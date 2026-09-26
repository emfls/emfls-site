export type GameState =
  | 'IDLE'
  | 'MATCH_INTRO'
  | 'TURN'
  | 'MOVING'
  | 'SCORE_FEEDBACK'
  | 'PAUSED'
  | 'RESULT';

export type Player =
  | 'A'
  | 'B';

export const BOARD_SIZE = 5;

export const MAX_TURNS = 30;

export const MATCH_INTRO_MS = 700;

export const MOVE_MS = 220;

export const REDUCED_MOVE_MS = 80;

export const SCORE_FEEDBACK_MS = 400;
