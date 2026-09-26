import { TARGET_HOLD_MS } from './types';

export type TargetHoldState = {
  startedAt: number | undefined;
  heldMs: number;
  progress: number;
  complete: boolean;
};

export const getRemainingMs = (timeLimitMs: number, elapsedMs: number): number => Math.max(0, Math.min(timeLimitMs, timeLimitMs - Math.max(0, elapsedMs)));

export const formatRemainingTime = (remainingMs: number): string => `${(Math.max(0, remainingMs) / 1000).toFixed(1)} s`;

export const updateTargetHold = (previous: TargetHoldState | undefined, bothInside: boolean, now: number): TargetHoldState => {
  if (!bothInside) return { startedAt: undefined, heldMs: 0, progress: 0, complete: false };
  const startedAt = previous?.startedAt ?? now;
  const heldMs = Math.max(0, now - startedAt);
  return { startedAt, heldMs, progress: Math.min(1, heldMs / TARGET_HOLD_MS), complete: heldMs >= TARGET_HOLD_MS };
};
