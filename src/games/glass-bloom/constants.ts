import type { CrystalIndex, GameState, Stage } from './types.ts';

export const UINT32_RANGE = 0x1_0000_0000;

export const STAGES: readonly Stage[] = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8]);
export const CRYSTAL_INDICES: readonly CrystalIndex[] = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8]);
export const STAGE_POTS: readonly number[] = Object.freeze([100, 180, 300, 500, 800, 1250, 1900, 2800]);
export const BASE_BREAK_RISKS: readonly number[] = Object.freeze([5, 10, 18, 28, 40, 55, 70]);
export const CRYSTAL_RISK_MODIFIERS: readonly number[] = Object.freeze([0, 0, 2, 2, 4, 4, 6, 6]);

export const GAME_STATES: readonly GameState[] = Object.freeze([
  'IDLE',
  'CRYSTAL_INTRO',
  'DECISION',
  'GROW_RESOLVING',
  'BANK_RESOLVING',
  'ROUND_FEEDBACK',
  'PAUSED',
  'RESULT',
]);
