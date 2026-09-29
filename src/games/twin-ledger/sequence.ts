import { GENERATION_MAX_ATTEMPTS, MAX_TURNS, phaseForTurn } from './constants.ts';
import { validateDifferenceDP } from './fairness.ts';
import { createSeededRandom, drawInt } from './rng.ts';
import type { GeneratedSequence, SequenceValidationResult, Tile, Uint32Source } from './types.ts';

const UINT32_RANGE = 0x1_0000_0000;
const PLAN_NEGATIVES = Object.freeze([-3, -2]);
const PLAN_POSITIVES = Object.freeze([2, 3, 4, 5]);
const PRESSURE_NEGATIVES = Object.freeze([-4, -3, -2]);
const PRESSURE_POSITIVES = Object.freeze([2, 3, 4, 5, 6]);
const HEAVY_VALUES = Object.freeze([2, 3]);
const HEAVY_POSITION_PAIRS: readonly (readonly [number, number])[] = Object.freeze([
  Object.freeze([14, 16]),
  Object.freeze([14, 17]),
  Object.freeze([14, 18]),
  Object.freeze([15, 17]),
  Object.freeze([15, 18]),
  Object.freeze([16, 18]),
]);

const fallbackValues: readonly (readonly [number, 1 | 2])[] = [
  [1, 1], [2, 1], [1, 1], [2, 1], [1, 1], [2, 1],
  [-2, 1], [3, 1], [-3, 1], [4, 1], [5, 1], [2, 1],
  [3, 1], [2, 2], [-2, 1], [3, 2], [4, 1], [5, 1],
];

export const FALLBACK_SEQUENCE: readonly Tile[] = Object.freeze(fallbackValues.map(([baseValue, weight], index) => Object.freeze({
  id: `tl-${String(index + 1).padStart(2, '0')}`,
  baseValue,
  weight,
})));

const tileIdForTurn = (turn: number): string => `tl-${String(turn).padStart(2, '0')}`;

const invalid = (reason: string, failedTurn: number | null = null): SequenceValidationResult => ({
  valid: false,
  reason,
  failedTurn,
  fairness: null,
});

export const validateTileForTurn = (tile: Tile, turn: number): Readonly<{ valid: boolean; reason: string | null }> => {
  if (!Number.isSafeInteger(turn) || turn < 1 || turn > MAX_TURNS) return { valid: false, reason: 'TURN_RANGE' };
  if (!tile || typeof tile !== 'object') return { valid: false, reason: 'TILE_SHAPE' };
  if (tile.id !== tileIdForTurn(turn)) return { valid: false, reason: 'TILE_ID' };
  if (!Number.isSafeInteger(tile.baseValue) || tile.baseValue === 0) return { valid: false, reason: 'BASE_VALUE' };
  if (tile.weight !== 1 && tile.weight !== 2) return { valid: false, reason: 'WEIGHT' };

  const phase = phaseForTurn(turn);
  if (!phase.pool.includes(tile.baseValue)) return { valid: false, reason: 'PHASE_POOL' };
  if (tile.weight === 2 && (turn < 14 || turn > 18 || tile.baseValue < 2 || tile.baseValue > 3)) {
    return { valid: false, reason: 'HEAVY_RULE' };
  }
  return { valid: true, reason: null };
};

export const validateSequence = (tiles: readonly Tile[]): SequenceValidationResult => {
  if (!Array.isArray(tiles) || tiles.length !== MAX_TURNS) return invalid('LENGTH');

  const ids = new Set<string>();
  for (let index = 0; index < tiles.length; index += 1) {
    const turn = index + 1;
    const check = validateTileForTurn(tiles[index], turn);
    if (!check.valid) return invalid(check.reason ?? 'TILE_INVALID', turn);
    if (ids.has(tiles[index].id)) return invalid('DUPLICATE_ID', turn);
    ids.add(tiles[index].id);
  }

  const planNegativeCount = tiles.slice(6, 12).filter(({ baseValue }) => baseValue < 0).length;
  if (planNegativeCount < 1 || planNegativeCount > 2) return invalid('PLAN_NEGATIVE_COUNT');
  const pressureNegativeCount = tiles.slice(12, 18).filter(({ baseValue }) => baseValue < 0).length;
  if (pressureNegativeCount > 2) return invalid('PRESSURE_NEGATIVE_COUNT');
  const heavyTurns = tiles.flatMap(({ weight }, index) => weight === 2 ? [index + 1] : []);
  if (heavyTurns.length !== 2) return invalid('HEAVY_COUNT');
  for (let index = 1; index < heavyTurns.length; index += 1) {
    if (heavyTurns[index] - heavyTurns[index - 1] <= 1) return invalid('ADJACENT_HEAVY', heavyTurns[index]);
  }

  for (let index = 1; index < tiles.length; index += 1) {
    const previous = tiles[index - 1];
    const current = tiles[index];
    if (current.baseValue === previous.baseValue && current.weight === previous.weight) {
      return invalid('IDENTICAL_ADJACENT', index + 1);
    }
    if (index >= 2) {
      const beforePrevious = tiles[index - 2];
      if (current.baseValue === previous.baseValue && current.baseValue === beforePrevious.baseValue) {
        return invalid('TRIPLE_BASE_VALUE', index + 1);
      }
      if (current.baseValue < 0 && previous.baseValue < 0 && beforePrevious.baseValue < 0) {
        return invalid('TRIPLE_NEGATIVE', index + 1);
      }
    }
  }

  const fairness = validateDifferenceDP(tiles);
  if (!fairness.valid) return { valid: false, reason: fairness.reason, failedTurn: fairness.failedTurn, fairness };
  return { valid: true, reason: null, failedTurn: null, fairness };
};

const chooseNegative = (
  remainingSlots: number,
  remainingNegatives: number,
  nextUint32: Uint32Source,
): Readonly<{ negative: boolean; remainingNegatives: number }> => {
  const negative = remainingNegatives === remainingSlots
    || (remainingNegatives > 0 && drawInt(remainingSlots, nextUint32) < remainingNegatives);
  return { negative, remainingNegatives: negative ? remainingNegatives - 1 : remainingNegatives };
};

const chooseFrom = (values: readonly number[], nextUint32: Uint32Source): number => values[drawInt(values.length, nextUint32)];

const createCandidate = (nextUint32: Uint32Source): readonly Tile[] => {
  const planNegativeCount = 1 + drawInt(2, nextUint32);
  const pressureNegativeCount = drawInt(3, nextUint32);
  const heavyPair = HEAVY_POSITION_PAIRS[drawInt(HEAVY_POSITION_PAIRS.length, nextUint32)];
  const heavyTurns = new Set(heavyPair);
  const tiles: Tile[] = [];

  for (let turn = 1; turn <= 6; turn += 1) {
    const phase = phaseForTurn(turn);
    tiles.push({ id: tileIdForTurn(turn), baseValue: chooseFrom(phase.pool, nextUint32), weight: 1 });
  }

  let planNegativesRemaining = planNegativeCount;
  for (let turn = 7; turn <= 12; turn += 1) {
    const slotsRemaining = 13 - turn;
    const sign = chooseNegative(slotsRemaining, planNegativesRemaining, nextUint32);
    planNegativesRemaining = sign.remainingNegatives;
    const pool = sign.negative ? PLAN_NEGATIVES : PLAN_POSITIVES;
    tiles.push({ id: tileIdForTurn(turn), baseValue: chooseFrom(pool, nextUint32), weight: 1 });
  }

  let pressureNegativesRemaining = pressureNegativeCount;
  let normalPressureSlotsRemaining = 4;
  for (let turn = 13; turn <= 18; turn += 1) {
    if (heavyTurns.has(turn)) {
      tiles.push({ id: tileIdForTurn(turn), baseValue: chooseFrom(HEAVY_VALUES, nextUint32), weight: 2 });
      continue;
    }
    const sign = chooseNegative(normalPressureSlotsRemaining, pressureNegativesRemaining, nextUint32);
    normalPressureSlotsRemaining -= 1;
    pressureNegativesRemaining = sign.remainingNegatives;
    const pool = sign.negative ? PRESSURE_NEGATIVES : PRESSURE_POSITIVES;
    tiles.push({ id: tileIdForTurn(turn), baseValue: chooseFrom(pool, nextUint32), weight: 1 });
  }

  return tiles;
};

const fallbackValidation = validateSequence(FALLBACK_SEQUENCE);
if (!fallbackValidation.valid) throw new Error(`Twin Ledger fallback sequence is invalid: ${fallbackValidation.reason}.`);

export const generateSequence = (seed: number, injectedRandom?: Uint32Source): GeneratedSequence => {
  const seededRandom = createSeededRandom(seed);
  const nextUint32 = injectedRandom ?? seededRandom;

  for (let attempt = 1; attempt <= GENERATION_MAX_ATTEMPTS; attempt += 1) {
    const tiles = createCandidate(nextUint32);
    const validation = validateSequence(tiles);
    if (validation.valid) return { seed, tiles, attempts: attempt, usedFallback: false, validation };
  }

  return {
    seed,
    tiles: FALLBACK_SEQUENCE,
    attempts: GENERATION_MAX_ATTEMPTS,
    usedFallback: true,
    validation: fallbackValidation,
  };
};
