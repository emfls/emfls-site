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

export type Direction =
  | 'UP'
  | 'DOWN'
  | 'LEFT'
  | 'RIGHT';

export const DIRECTIONS = [
  'UP',
  'DOWN',
  'LEFT',
  'RIGHT',
] as const;

export type Cell = Readonly<{
  row: number;
  col: number;
}>;

export type TokenId =
  | 'A1'
  | 'A2'
  | 'A3'
  | 'B1'
  | 'B2'
  | 'B3';

export type Token = Readonly<{
  id: TokenId;
  player: Player;
  position: Cell;
}>;

export type BoardLayoutId =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6;

export type BoardLayout = Readonly<{
  id: BoardLayoutId;
  blockedCells: readonly Cell[];
}>;

export type TokenMove = Readonly<{
  id: TokenId;
  from: Cell;
  to: Cell;
}>;

export type MoveResolution = Readonly<{
  direction: Direction;
  legal: boolean;
  beforeTokens: readonly Token[];
  afterMoveTokens: readonly Token[];
  moves: readonly TokenMove[];
}>;

export const BOARD_SIZE = 5;

export const MAX_TURNS = 30;

export const MATCH_INTRO_MS = 700;

export const MOVE_MS = 220;

export const REDUCED_MOVE_MS = 80;

export const SCORE_FEEDBACK_MS = 400;
