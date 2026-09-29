import type { PhaseConfig } from './types.ts';

export const MAX_TURNS = 18;
export const RECENT_HISTORY_LIMIT = 4;
export const RESOLVING_MS = 120;
export const FEEDBACK_MS = 300;
export const GENERATION_MAX_ATTEMPTS = 50;

export const PHASES: readonly PhaseConfig[] = Object.freeze([
  Object.freeze({ name: 'LEARN', firstTurn: 1, lastTurn: 6, hardLimit: 8, pool: Object.freeze([1, 2, 3, 4]) }),
  Object.freeze({ name: 'PLAN', firstTurn: 7, lastTurn: 12, hardLimit: 7, pool: Object.freeze([2, 3, 4, 5, -2, -3]) }),
  Object.freeze({ name: 'PRESSURE', firstTurn: 13, lastTurn: 18, hardLimit: 6, pool: Object.freeze([2, 3, 4, 5, 6, -2, -3, -4]) }),
]);

export const phaseForTurn = (turn: number): PhaseConfig => {
  if (!Number.isSafeInteger(turn) || turn < 1 || turn > MAX_TURNS) {
    throw new RangeError(`turn must be an integer from 1 to ${MAX_TURNS}.`);
  }
  const phase = PHASES.find(({ firstTurn, lastTurn }) => turn >= firstTurn && turn <= lastTurn);
  if (!phase) throw new RangeError(`No phase is configured for turn ${turn}.`);
  return phase;
};

export const getHardLimit = (turn: number): number => phaseForTurn(turn).hardLimit;
