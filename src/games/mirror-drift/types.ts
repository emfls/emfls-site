export type GameState =
  | 'IDLE'
  | 'STAGE_INTRO'
  | 'ACTIVE'
  | 'FAIL_FEEDBACK'
  | 'CLEAR_FEEDBACK'
  | 'PAUSED'
  | 'RESULT';

export type FailureReason = 'COLLISION' | 'TIMEOUT';

export type SessionStats = {
  score: number;
  totalStrikes: number;
  fastestClearMs: number | null;
};

export type BestStats = {
  score: number;
  fewestStrikes: number | null;
};

export type StageClearSnapshot = {
  stage: number;
  stageScore: number;
  remainingMs: number;
  elapsedMs: number;
};

export const TOTAL_STAGES = 12;
export const STAGE_INTRO_MS = 600;

export const BOARD_MIN = -1;
export const BOARD_MAX = 1;
export const DOT_RADIUS = 0.035;
export const TARGET_RADIUS = 0.075;
export const TARGET_HOLD_MS = 150;
export const FAIL_FEEDBACK_MS = 400;
export const CLEAR_FEEDBACK_MS = 400;
export const DPR_CAP = 2;

export type Vec2 = { x: number; y: number };

export type CircleObstacle = {
  kind: 'circle';
  center: Vec2;
  radius: number;
};

export type BarObstacle = {
  kind: 'bar';
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type Obstacle = CircleObstacle | BarObstacle;

export type StagePhase = 'LEARN' | 'SPLIT' | 'CORRIDOR' | 'OFFSET' | 'PRECISION' | 'FINAL';

export type StageDefinition = {
  id: number;
  phase: StagePhase;
  startA: Vec2;
  targetA: Vec2;
  obstacles: readonly Obstacle[];
  timeLimitMs: number;
  solutionPathA: readonly Vec2[];
};
