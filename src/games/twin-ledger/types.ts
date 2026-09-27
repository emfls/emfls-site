export type Phase = 'LEARN' | 'PLAN' | 'PRESSURE';

export type Tile = Readonly<{
  id: string;
  baseValue: number;
  weight: 1 | 2;
}>;

export type Zone = 'EXACT' | 'STABLE' | 'TENSE' | 'DANGER' | 'BREACH';

export type PlacementSide = 'LEFT' | 'RIGHT';

export type GameState = 'IDLE' | 'TURN' | 'RESOLVING' | 'FEEDBACK' | 'PAUSED' | 'RESULT';

export type PhaseConfig = Readonly<{
  name: Phase;
  firstTurn: number;
  lastTurn: number;
  hardLimit: number;
  pool: readonly number[];
}>;

export type DifferenceDPResult = Readonly<{
  valid: boolean;
  reason: 'INVALID_SEQUENCE' | 'INVALID_TILE' | 'NO_SAFE_PATH' | 'DEAD_END' | 'FORCED_SIDE_STREAK' | null;
  failedTurn: number | null;
  reachableCountsByTurn: readonly number[];
  finalSafeStateCount: number;
  deadEndCount: number;
  forcedSideRun: number;
}>;

export type SequenceValidationResult = Readonly<{
  valid: boolean;
  reason: string | null;
  failedTurn: number | null;
  fairness: DifferenceDPResult | null;
}>;

export type GeneratedSequence = Readonly<{
  seed: number;
  tiles: readonly Tile[];
  attempts: number;
  usedFallback: boolean;
  validation: SequenceValidationResult;
}>;

export type Placement = Readonly<{
  turn: number;
  tile: Tile;
  side: PlacementSide;
  effectiveValue: number;
  difference: number;
  zone: Zone;
  turnScore: number;
  comboAfter: number;
}>;

export type GameResult = Readonly<{
  score: number;
  finalDifference: number;
  exactCount: number;
  breachCount: number;
  maxCombo: number;
  bestScore: number;
}>;

export type BestStats = Readonly<{
  bestScore: number;
  bestMaxCombo: number;
}>;

export type GameSession = Readonly<{
  state: GameState;
  seed: number | null;
  sequence: readonly Tile[];
  turn: number;
  leftTotal: number;
  rightTotal: number;
  difference: number;
  zone: Zone;
  combo: number;
  maxCombo: number;
  breachCount: number;
  exactCount: number;
  score: number;
  finalScore: number | null;
  currentTile: Tile | null;
  nextTile: Tile | null;
  lastPlacement: Placement | null;
  recentHistory: readonly Placement[];
  result: GameResult | null;
  best: BestStats;
}>;

export type Uint32Source = () => number;
