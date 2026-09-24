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

export type DifficultyId = 'learn' | 'vary' | 'pressure' | 'read' | 'final';

export type DifficultyConfig = {
  id: DifficultyId;
  targetMin: number;
  targetMax: number;
  speedMin: number;
  speedMax: number;
  accelerationChoices: number[];
  minSpeed: number;
  maxSpeed: number;
  decoyMin: number;
  decoyMax: number;
};

export type RoundConfig = {
  round: number;
  difficulty: DifficultyId;
  targetRadius: number;
  initialSpeed: number;
  acceleration: number;
  minSpeed: number;
  maxSpeed: number;
  decoyRadii: number[];
};

export type PulseMotion = {
  radius: number;
  speed: number;
};

export const TOTAL_ROUNDS = 20;
export const COUNTDOWN_STEP_MS = 650;
export const FEEDBACK_DURATION_MS = 360;
export const PULSE_START_RADIUS = 0.08;
export const PULSE_END_RADIUS = 1.0;
export const PERFECT_THRESHOLD = 0.025;
export const GOOD_THRESHOLD = 0.060;
export const DPR_CAP = 2;
