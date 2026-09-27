import { getHardLimit, MAX_TURNS } from './constants.ts';
import type { DifferenceDPResult, Tile, Uint32Source } from './types.ts';

type PathState = Readonly<{
  difference: number;
  lastForcedSide: 'LEFT' | 'RIGHT' | null;
  forcedRun: number;
}>;

const pathKey = ({ difference, lastForcedSide, forcedRun }: PathState): string =>
  `${difference}|${lastForcedSide ?? '-'}|${forcedRun}`;

const result = (
  valid: boolean,
  reason: DifferenceDPResult['reason'],
  failedTurn: number | null,
  counts: readonly number[],
  finalSafeStateCount: number,
  deadEndCount: number,
  forcedSideRun: number,
): DifferenceDPResult => ({
  valid,
  reason,
  failedTurn,
  reachableCountsByTurn: counts,
  finalSafeStateCount,
  deadEndCount,
  forcedSideRun,
});

export const validateDifferenceDP = (tiles: readonly Tile[]): DifferenceDPResult => {
  if (!Array.isArray(tiles) || tiles.length < 1 || tiles.length > MAX_TURNS) {
    return result(false, 'INVALID_SEQUENCE', null, [], 0, 0, 0);
  }

  let safeStates = new Set<number>([0]);
  let pathStates = new Map<string, PathState>();
  const initialPath: PathState = { difference: 0, lastForcedSide: null, forcedRun: 0 };
  pathStates.set(pathKey(initialPath), initialPath);
  const counts: number[] = [];
  let deadEndCount = 0;
  let maxForcedRun = 0;

  for (let index = 0; index < tiles.length; index += 1) {
    const turn = index + 1;
    const tile = tiles[index];
    if (!tile || !Number.isSafeInteger(tile.baseValue) || ![1, 2].includes(tile.weight)) {
      counts.push(0);
      return result(false, 'INVALID_TILE', turn, counts, safeStates.size, deadEndCount, maxForcedRun);
    }

    const value = tile.baseValue * tile.weight;
    if (!Number.isSafeInteger(value)) {
      counts.push(0);
      return result(false, 'INVALID_TILE', turn, counts, safeStates.size, deadEndCount, maxForcedRun);
    }

    const hardLimit = getHardLimit(turn);
    const transitions = new Map<number, Readonly<{ left: number; right: number; safeLeft: boolean; safeRight: boolean }>>();
    const nextSafeStates = new Set<number>();
    let turnDeadEndCount = 0;

    for (const difference of safeStates) {
      const left = difference + value;
      const right = difference - value;
      const safeLeft = Math.abs(left) <= hardLimit;
      const safeRight = Math.abs(right) <= hardLimit;
      transitions.set(difference, { left, right, safeLeft, safeRight });
      if (!safeLeft && !safeRight) {
        turnDeadEndCount += 1;
        deadEndCount += 1;
      }
      if (safeLeft) nextSafeStates.add(left);
      if (safeRight) nextSafeStates.add(right);
    }
    counts.push(nextSafeStates.size);

    const nextPathStates = new Map<string, PathState>();
    for (const path of pathStates.values()) {
      const transition = transitions.get(path.difference);
      if (!transition) continue;
      const { left, right, safeLeft, safeRight } = transition;
      const safeCount = Number(safeLeft) + Number(safeRight);
      if (safeCount === 0) continue;
      const forcedSide = safeCount === 1 ? (safeLeft ? 'LEFT' : 'RIGHT') : null;
      const forcedRun = forcedSide === null
        ? 0
        : path.lastForcedSide === forcedSide ? path.forcedRun + 1 : 1;
      maxForcedRun = Math.max(maxForcedRun, forcedRun);

      if (safeLeft) {
        const nextPath: PathState = { difference: left, lastForcedSide: forcedSide, forcedRun };
        nextPathStates.set(pathKey(nextPath), nextPath);
      }
      if (safeRight) {
        const nextPath: PathState = { difference: right, lastForcedSide: forcedSide, forcedRun };
        nextPathStates.set(pathKey(nextPath), nextPath);
      }
    }

    if (nextSafeStates.size === 0) {
      return result(false, 'NO_SAFE_PATH', turn, counts, 0, deadEndCount, maxForcedRun);
    }
    if (turnDeadEndCount > 0) {
      return result(false, 'DEAD_END', turn, counts, nextSafeStates.size, deadEndCount, maxForcedRun);
    }
    if (maxForcedRun >= 3) {
      return result(false, 'FORCED_SIDE_STREAK', turn, counts, nextSafeStates.size, deadEndCount, maxForcedRun);
    }

    safeStates = nextSafeStates;
    pathStates = nextPathStates;
  }

  return result(true, null, null, counts, safeStates.size, deadEndCount, maxForcedRun);
};
