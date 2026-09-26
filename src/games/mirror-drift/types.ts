export type GameState =
  | 'IDLE'
  | 'STAGE_INTRO'
  | 'ACTIVE'
  | 'FAIL_FEEDBACK'
  | 'CLEAR_FEEDBACK'
  | 'PAUSED'
  | 'RESULT';

export const TOTAL_STAGES = 12;
export const STAGE_INTRO_MS = 600;
