import { getHardLimit, MAX_TURNS, PHASES } from './constants.ts';
import type { PlacementSide, Tile, Zone } from './types.ts';

export const BASE_POINTS: Readonly<Record<Zone, number>> = Object.freeze({
  EXACT: 120,
  STABLE: 90,
  TENSE: 55,
  DANGER: 20,
  BREACH: 0,
});

const assertNonNegativeSafeInteger = (value: number, label: string): void => {
  if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`${label} must be a non-negative safe integer.`);
};

export const getEffectiveValue = (tile: Tile): number => {
  if (!tile || !Number.isSafeInteger(tile.baseValue) || (tile.weight !== 1 && tile.weight !== 2)) {
    throw new RangeError('Tile must have a safe integer baseValue and weight 1 or 2.');
  }
  return tile.baseValue * tile.weight;
};

export const getBalanceZone = (difference: number, turn: number): Zone => {
  assertNonNegativeSafeInteger(difference, 'difference');
  const hardLimit = getHardLimit(turn);
  if (difference === 0) return 'EXACT';
  if (difference <= 2) return 'STABLE';
  if (difference <= 4) return 'TENSE';
  if (difference <= hardLimit) return 'DANGER';
  return 'BREACH';
};

export const getComboMultiplier = (combo: number): number => {
  assertNonNegativeSafeInteger(combo, 'combo');
  if (combo <= 1) return 1;
  if (combo <= 3) return 1.1;
  if (combo <= 5) return 1.2;
  if (combo <= 7) return 1.3;
  if (combo <= 9) return 1.4;
  return 1.5;
};

export const calculateTurnScore = (zone: Zone, comboAfter: number): number => {
  const baseScore = BASE_POINTS[zone];
  if (baseScore === undefined) throw new RangeError('zone is not recognized.');
  return Math.round(baseScore * getComboMultiplier(comboAfter));
};

export type PlacementInput = Readonly<{
  leftTotal: number;
  rightTotal: number;
  side: PlacementSide;
  tile: Tile;
  turn: number;
  combo: number;
  maxCombo: number;
  exactCount: number;
  breachCount: number;
  turnPoints: number;
}>;

export const resolvePlacement = (input: PlacementInput) => {
  assertNonNegativeSafeInteger(Math.abs(input.leftTotal), 'leftTotal magnitude');
  assertNonNegativeSafeInteger(Math.abs(input.rightTotal), 'rightTotal magnitude');
  assertNonNegativeSafeInteger(input.combo, 'combo');
  assertNonNegativeSafeInteger(input.maxCombo, 'maxCombo');
  assertNonNegativeSafeInteger(input.exactCount, 'exactCount');
  assertNonNegativeSafeInteger(input.breachCount, 'breachCount');
  assertNonNegativeSafeInteger(input.turnPoints, 'turnPoints');
  if (input.turn < 1 || input.turn > MAX_TURNS) throw new RangeError(`turn must be from 1 to ${MAX_TURNS}.`);
  if (input.side !== 'LEFT' && input.side !== 'RIGHT') throw new RangeError('side must be LEFT or RIGHT.');
  if (!PHASES.some(({ firstTurn, lastTurn }) => input.turn >= firstTurn && input.turn <= lastTurn)) {
    throw new RangeError('turn is not covered by a phase.');
  }

  const effectiveValue = getEffectiveValue(input.tile);
  const leftTotal = input.leftTotal + (input.side === 'LEFT' ? effectiveValue : 0);
  const rightTotal = input.rightTotal + (input.side === 'RIGHT' ? effectiveValue : 0);
  const difference = Math.abs(leftTotal - rightTotal);
  const zone = getBalanceZone(difference, input.turn);
  const exactCount = input.exactCount + Number(zone === 'EXACT');
  const breachCount = input.breachCount + Number(zone === 'BREACH');
  const combo = zone === 'EXACT' || zone === 'STABLE' ? input.combo + 1 : 0;
  const maxCombo = Math.max(input.maxCombo, combo);
  const turnScore = calculateTurnScore(zone, combo);

  return {
    leftTotal,
    rightTotal,
    difference,
    zone,
    effectiveValue,
    exactCount,
    breachCount,
    combo,
    maxCombo,
    turnScore,
    turnPoints: input.turnPoints + turnScore,
  } as const;
};

export const calculateFinalScore = (turnPoints: number, breachCount: number, finalDifference: number) => {
  assertNonNegativeSafeInteger(turnPoints, 'turnPoints');
  assertNonNegativeSafeInteger(breachCount, 'breachCount');
  assertNonNegativeSafeInteger(finalDifference, 'finalDifference');
  const breachBonus = breachCount === 0 ? 500 : breachCount === 1 ? 250 : breachCount === 2 ? 100 : 0;
  const differenceBonus = finalDifference === 0 ? 300 : finalDifference <= 2 ? 150 : 0;
  const score = turnPoints + breachBonus + differenceBonus;
  if (!Number.isSafeInteger(score)) throw new RangeError('Final score must remain a safe integer.');
  return { turnPoints, breachBonus, differenceBonus, score } as const;
};
