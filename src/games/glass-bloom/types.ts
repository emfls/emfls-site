export type Stage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type CrystalIndex = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type GameState =
  | 'IDLE'
  | 'CRYSTAL_INTRO'
  | 'DECISION'
  | 'GROW_RESOLVING'
  | 'BANK_RESOLVING'
  | 'ROUND_FEEDBACK'
  | 'PAUSED'
  | 'RESULT';

export type GrowOutcome = 'SAFE' | 'SHATTERED';
export type RoundOutcome = 'BANKED' | 'SHATTERED';
export type RiskBand = 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
export type HighestStageReached = 0 | Stage;

export type GameSession = Readonly<{
  state: GameState;
  seed: number;
  rngState: number;
  crystalIndex: CrystalIndex;
  stage: Stage;
  pot: number;
  totalScore: number;
  bankStreak: number;
  bestBankStreak: number;
  successfulBanks: number;
  breaks: number;
  highestStage: Stage;
  growOutcome: GrowOutcome | null;
  roundOutcome: RoundOutcome | null;
  bankAward: number;
}>;

export type SessionStats = Readonly<{
  totalScore: number;
  successfulBanks: number;
  breaks: number;
  highestStage: Stage;
  bestBankStreak: number;
}>;

export type BestStats = Readonly<{
  bestScore: number;
  highestStageReached: HighestStageReached;
}>;
