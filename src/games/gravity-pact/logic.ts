import { PLAYER_A_GOALS, PLAYER_B_GOALS, GRAVITY_PACT_LAYOUTS } from './layouts';
import { MAX_TURNS } from './types';
import type { BoardLayout, BoardLayoutId, MatchOutcome, MatchResult, Player, RandomSource, Scores, Token } from './types';
import { cellKey } from './movement';

const SCORE_MIN = 0;
const SCORE_MAX = 3;

const freezeScores = (scores: Scores): Scores => Object.freeze({ A: scores.A, B: scores.B });

const assertScore = (value: number, player: Player): void => {
  if (!Number.isInteger(value) || value < SCORE_MIN || value > SCORE_MAX) {
    throw new Error(`Gravity Pact score for Player ${player} must be an integer from 0 to 3.`);
  }
};

const assertScores = (scores: Scores): void => {
  if (!scores || typeof scores !== 'object') throw new Error('Gravity Pact scores are required.');
  assertScore(scores.A, 'A');
  assertScore(scores.B, 'B');
};

const isMatchingGoal = (token: Token): boolean => {
  const goals = token.player === 'A' ? PLAYER_A_GOALS : PLAYER_B_GOALS;
  return goals.some((goal) => cellKey(goal) === cellKey(token.position));
};

export const oppositePlayer = (player: Player): Player => player === 'A' ? 'B' : 'A';

export const resolveScoring = (
  afterMoveTokens: readonly Token[],
  previousScores: Scores,
): ScoringResolution => {
  if (!Array.isArray(afterMoveTokens)) throw new Error('Gravity Pact scoring requires a token snapshot.');
  assertScores(previousScores);
  const scoringIds = new Set(afterMoveTokens.filter(isMatchingGoal).map(({ id }) => id));
  const scoreDeltaA = afterMoveTokens.filter(({ id, player }) => player === 'A' && scoringIds.has(id)).length;
  const scoreDeltaB = afterMoveTokens.filter(({ id, player }) => player === 'B' && scoringIds.has(id)).length;
  const scores = { A: previousScores.A + scoreDeltaA, B: previousScores.B + scoreDeltaB } as Scores;
  assertScores(scores);
  return Object.freeze({
    afterScoringTokens: Object.freeze(afterMoveTokens.filter(({ id }) => !scoringIds.has(id))),
    scoreDeltaA,
    scoreDeltaB,
    scores: freezeScores(scores),
  });
};

const resultForScores = (scores: Scores, cause: 'THREE_POINTS' | 'TURN_LIMIT' | 'STALEMATE'): MatchResult => {
  assertScores(scores);
  const outcome: MatchOutcome = scores.A > scores.B
    ? 'PLAYER_A'
    : scores.B > scores.A
      ? 'PLAYER_B'
      : 'DRAW';
  return Object.freeze({ outcome, cause });
};

export const resolveThreePointResult = (scores: Scores): MatchResult | undefined => {
  assertScores(scores);
  if (scores.A < SCORE_MAX && scores.B < SCORE_MAX) return undefined;
  return resultForScores(scores, 'THREE_POINTS');
};

export const resolveTurnLimit = (scores: Scores, turnsUsed: number): MatchResult | undefined => {
  assertScores(scores);
  if (!Number.isInteger(turnsUsed) || turnsUsed < 0) throw new Error('Gravity Pact turns used must be a non-negative integer.');
  return turnsUsed === MAX_TURNS ? resultForScores(scores, 'TURN_LIMIT') : undefined;
};

export const resolveStalemate = (scores: Scores): MatchResult => resultForScores(scores, 'STALEMATE');

export const outcomeText = (outcome: MatchOutcome): string => {
  switch (outcome) {
    case 'PLAYER_A': return 'Player A Wins';
    case 'PLAYER_B': return 'Player B Wins';
    case 'DRAW': return 'Draw';
  }
};

const randomIndex = (length: number, randomSource: RandomSource): number => {
  if (!Number.isInteger(length) || length <= 0) throw new Error('Gravity Pact random selection requires a non-empty collection.');
  const value = randomSource();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error('Gravity Pact random source must return a finite value from 0 inclusive to 1 exclusive.');
  return Math.floor(value * length);
};

export const selectInitialLayout = (randomSource: RandomSource = Math.random): BoardLayout => (
  GRAVITY_PACT_LAYOUTS[randomIndex(GRAVITY_PACT_LAYOUTS.length, randomSource)]
);

export const selectInitialStarter = (randomSource: RandomSource = Math.random): Player => (
  randomIndex(2, randomSource) === 0 ? 'A' : 'B'
);

export const selectRematchLayout = (previousLayoutId: BoardLayoutId, randomSource: RandomSource = Math.random): BoardLayout => {
  const eligibleLayouts = GRAVITY_PACT_LAYOUTS.filter(({ id }) => id !== previousLayoutId);
  return eligibleLayouts[randomIndex(eligibleLayouts.length, randomSource)];
};
