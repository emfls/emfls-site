const SCORE_PER_TARGET = 100;
const MISTAKE_PENALTY = 50;
const CLEAR_BASE_BONUS = 200;

export function awardCorrectTarget(score: number): number {
  return Math.max(0, Math.trunc(score)) + SCORE_PER_TARGET;
}

export function applyMistakePenalty(score: number): number {
  return Math.max(0, Math.trunc(score) - MISTAKE_PENALTY);
}

export function multiplierForStreak(streak: number): number {
  if (!Number.isFinite(streak) || streak < 0) throw new RangeError('streak must be non-negative');
  if (streak >= 6) return 1.3;
  if (streak >= 4) return 1.2;
  if (streak >= 2) return 1.1;
  return 1;
}

export function calculateClearBonus(streakAtRoundStart: number): { multiplier: number; points: number } {
  const multiplier = multiplierForStreak(streakAtRoundStart);
  return Object.freeze({ multiplier, points: Math.round(CLEAR_BASE_BONUS * multiplier) });
}

export function calculateTimeBonus(remainingMs: number): number {
  if (!Number.isFinite(remainingMs)) return 0;
  return Math.min(160, Math.floor(Math.max(0, remainingMs) / 100) * 2);
}

export function calculateRoundBonuses(
  outcome: 'CLEAR' | 'TIMEOUT',
  remainingMs: number,
  streakAtRoundStart: number,
): { clearBonus: number; timeBonus: number; totalBonus: number } {
  if (outcome !== 'CLEAR') return Object.freeze({ clearBonus: 0, timeBonus: 0, totalBonus: 0 });
  const clearBonus = calculateClearBonus(streakAtRoundStart).points;
  const timeBonus = calculateTimeBonus(remainingMs);
  return Object.freeze({ clearBonus, timeBonus, totalBonus: clearBonus + timeBonus });
}

export function isCleanRound(outcome: 'CLEAR' | 'TIMEOUT', mistakes: number): boolean {
  return outcome === 'CLEAR' && mistakes === 0;
}

export function streakAfterRound(streakAtRoundStart: number, outcome: 'CLEAR' | 'TIMEOUT', mistakes: number): number {
  return isCleanRound(outcome, mistakes) ? streakAtRoundStart + 1 : 0;
}

export function countCleanRounds(outcomes: readonly { outcome: 'CLEAR' | 'TIMEOUT'; mistakes: number }[]): number {
  return outcomes.filter(({ outcome, mistakes }) => isCleanRound(outcome, mistakes)).length;
}

export function roundAccuracy(correctSelections: number, mistakes: number): number {
  if (!Number.isFinite(correctSelections) || !Number.isFinite(mistakes) || correctSelections < 0 || mistakes < 0) return 0;
  const total = correctSelections + mistakes;
  return total === 0 ? 0 : correctSelections / total;
}

export function averageAccuracy(roundAccuracies: readonly number[]): number {
  if (!roundAccuracies.length) return 0;
  return roundAccuracies.reduce((sum, accuracy) => sum + accuracy, 0) / roundAccuracies.length;
}

export function formatAccuracy(accuracy: number): string {
  const percentage = Number.isFinite(accuracy) ? Math.round(Math.max(0, Math.min(1, accuracy)) * 100) : 0;
  return `${percentage}%`;
}
