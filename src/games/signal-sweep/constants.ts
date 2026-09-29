export const GENERATOR_VERSION = 1;
export const MAX_CANDIDATE_ATTEMPTS = 30;
export const SESSION_ROUNDS = 15;
export const MAX_TUPLE_OCCURRENCES = 3;
export const MIN_DISTRACTORS = 6;
export const FALLBACK_SEED_BASE = 0x5eed0000;
export const BEST_STORAGE_KEY = 'emfls:signal-sweep:best:v1';

export const ROUND_TIERS = Object.freeze([
  Object.freeze({ tier: 1, firstRound: 1, lastRound: 3, boardSize: 12, minTargets: 3, maxTargets: 5, timeMs: 8000 }),
  Object.freeze({ tier: 2, firstRound: 4, lastRound: 6, boardSize: 16, minTargets: 2, maxTargets: 5, timeMs: 7500 }),
  Object.freeze({ tier: 3, firstRound: 7, lastRound: 9, boardSize: 18, minTargets: 2, maxTargets: 5, timeMs: 7000 }),
  Object.freeze({ tier: 4, firstRound: 10, lastRound: 12, boardSize: 20, minTargets: 3, maxTargets: 6, timeMs: 6500 }),
  Object.freeze({ tier: 5, firstRound: 13, lastRound: 15, boardSize: 24, minTargets: 3, maxTargets: 6, timeMs: 6000 }),
]);

export const COLORS = Object.freeze({
  coral: Object.freeze({ name: 'Coral', hex: '#B5473C' }),
  teal: Object.freeze({ name: 'Teal', hex: '#147B80' }),
  violet: Object.freeze({ name: 'Violet', hex: '#6941A5' }),
  amber: Object.freeze({ name: 'Amber', hex: '#9A5B00' }),
});

export function tierForRound(roundNumber: number) {
  if (!Number.isInteger(roundNumber) || roundNumber < 1 || roundNumber > SESSION_ROUNDS) {
    throw new RangeError('roundNumber must be an integer from 1 through 15');
  }
  return ROUND_TIERS.find(({ firstRound, lastRound }) => roundNumber >= firstRound && roundNumber <= lastRound)!;
}
