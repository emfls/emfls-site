export type GameState = 'IDLE' | 'COUNTDOWN' | 'ACTIVE' | 'FEEDBACK' | 'PAUSED' | 'RESULT';

export type Judgement = 'PERFECT' | 'GOOD' | 'MISS';

export type HudSnapshot = {
  round: number;
  score: number;
  combo: number;
};

export type ResultSnapshot = {
  score: number;
  perfect: number;
  good: number;
  miss: number;
  maxCombo: number;
};

export const TOTAL_ROUNDS = 20;
export const COUNTDOWN_STEP_MS = 650;
export const FEEDBACK_DURATION_MS = 360;
export const PULSE_START_RADIUS = 0.08;
export const PULSE_END_RADIUS = 1.0;
export const PERFECT_THRESHOLD = 0.025;
export const GOOD_THRESHOLD = 0.060;
export const DPR_CAP = 2;
