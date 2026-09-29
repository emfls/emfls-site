import { TARGET_HOLD_MS } from './types';
import type { FailureReason, SessionStats } from './types';

export type TargetHoldState = {
  startedAt: number | undefined;
  heldMs: number;
  progress: number;
  complete: boolean;
};

export const getRemainingMs = (timeLimitMs: number, elapsedMs: number): number => Math.max(0, Math.min(timeLimitMs, timeLimitMs - Math.max(0, elapsedMs)));

export const formatRemainingTime = (remainingMs: number): string => `${(Math.max(0, remainingMs) / 1000).toFixed(1)} s`;

export const createInitialSessionStats = (): SessionStats => ({ score: 0, totalStrikes: 0, fastestClearMs: null });

export const calculateStageScore = (remainingMs: number, stageStrikes: number): number => {
  const timeBonus = Math.floor(Math.max(0, remainingMs) / 100) * 5;
  const cappedTimeBonus = Math.min(500, timeBonus);
  const strikePenalty = 100 * Math.max(0, stageStrikes);
  return Math.max(100, 500 + cappedTimeBonus - strikePenalty);
};

export const updateFastestClear = (previousMs: number | null, successfulElapsedMs: number): number => (
  previousMs === null ? successfulElapsedMs : Math.min(previousMs, successfulElapsedMs)
);

export const formatFastestClear = (ms: number | null): string => ms === null ? '—' : `${(Math.max(0, ms) / 1000).toFixed(1)} s`;

export const applyStageClearToSession = (previous: SessionStats, stageScore: number, successfulElapsedMs: number): SessionStats => ({
  score: previous.score + stageScore,
  totalStrikes: previous.totalStrikes,
  fastestClearMs: updateFastestClear(previous.fastestClearMs, successfulElapsedMs),
});

export const resolveClearDeadline = (clearTimestamp: number, deadlineTimestamp: number): 'CLEAR' | 'TIMEOUT' => (
  clearTimestamp <= deadlineTimestamp ? 'CLEAR' : 'TIMEOUT'
);

export const resolveFailureReason = (collided: boolean, candidateTimestamp: number, deadlineTimestamp: number): FailureReason | null => {
  if (collided) return 'COLLISION';
  return candidateTimestamp > deadlineTimestamp ? 'TIMEOUT' : null;
};

export const updateTargetHold = (previous: TargetHoldState | undefined, bothInside: boolean, now: number): TargetHoldState => {
  if (!bothInside) return { startedAt: undefined, heldMs: 0, progress: 0, complete: false };
  const startedAt = previous?.startedAt ?? now;
  const heldMs = Math.max(0, now - startedAt);
  return { startedAt, heldMs, progress: Math.min(1, heldMs / TARGET_HOLD_MS), complete: heldMs >= TARGET_HOLD_MS };
};
