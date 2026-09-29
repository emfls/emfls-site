export const FIELD_BLOOM_PUZZLE_IDS = [
  'fb-01', 'fb-02', 'fb-03', 'fb-04', 'fb-05', 'fb-06',
  'fb-07', 'fb-08', 'fb-09', 'fb-10', 'fb-11', 'fb-12',
] as const;

export type PuzzleId = (typeof FIELD_BLOOM_PUZZLE_IDS)[number];
export type PieceType = 'H3' | 'V3' | 'CROSS5' | 'X5';
export type CellRequirementKind = 'goal1' | 'goal2' | 'forbidden';
export type CellRequirement = CellRequirementKind | 'neutral';
export type CellStatus = 'neutral' | 'under' | 'satisfied' | 'overcharged' | 'violation';
export type GameState = 'LEVEL_SELECT' | 'PUZZLE_INTRO' | 'PLAYING' | 'SOLVE_FEEDBACK' | 'PAUSED';
export type StarRating = 1 | 2 | 3;

export interface Coordinate {
  row: number;
  col: number;
}

export interface PieceInstance {
  pieceInstanceId: string;
  pieceType: PieceType;
}

export interface Placement extends PieceInstance, Coordinate {}

export interface PuzzleDefinition {
  id: PuzzleId;
  rows: number;
  cols: number;
  requirements: readonly (Coordinate & { kind: CellRequirementKind })[];
  inventory: readonly PieceInstance[];
  parPieces: number;
  knownSolution: readonly Placement[];
}

export interface CellEvaluation extends Coordinate {
  requirement: CellRequirement;
  activationCount: number;
  status: CellStatus;
}

export interface ViolationSummary {
  underCount: number;
  overchargedCount: number;
  forbiddenViolationCount: number;
}

export interface BoardEvaluation extends ViolationSummary {
  activationCounts: number[][];
  cells: CellEvaluation[];
  solved: boolean;
}

export interface PuzzleResult {
  stars: StarRating;
  piecesUsed: number;
  undoCount: number;
  elapsedActiveMs: number;
  bestStars: StarRating | null;
  bestTimeMs: number | null;
}

export interface PuzzleSession {
  state: GameState;
  puzzleId: PuzzleId;
  placements: Placement[];
  selectedPieceInstanceId: string | null;
  undoCount: number;
  elapsedActiveMs: number;
  result: PuzzleResult | null;
}

export interface PuzzleBestRecord {
  bestStars: StarRating | null;
  bestTimeMs: number | null;
}

export interface StoredProgress {
  version: 1;
  unlockedThrough: number;
  puzzles: Record<string, PuzzleBestRecord>;
}

export interface PuzzleDiagnostic {
  code: string;
  puzzleId: string | null;
  path: string;
  message: string;
}
