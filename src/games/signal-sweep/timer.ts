export interface TimerClock {
  now(): number;
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface DeadlineTimerOptions {
  readonly clock: TimerClock;
  readonly deadline: number;
  readonly updateIntervalMs?: number;
  readonly onUpdate: (remainingMs: number) => void;
  readonly onDeadline: () => void;
}

export interface DeadlineTimer {
  getRemaining(): number;
  cancel(): void;
}

export function createDeadlineTimer(options: DeadlineTimerOptions): DeadlineTimer {
  const interval = options.updateIntervalMs ?? 100;
  if (!Number.isFinite(options.deadline) || !Number.isFinite(interval) || interval <= 0) {
    throw new RangeError('deadline and positive update interval are required');
  }
  let timerHandle: unknown;
  let cancelled = false;
  let deadlineFired = false;

  const getRemaining = () => Math.max(0, options.deadline - options.clock.now());
  const update = (): void => {
    if (cancelled || deadlineFired) return;
    const remaining = getRemaining();
    options.onUpdate(remaining);
    if (remaining <= 0) {
      deadlineFired = true;
      timerHandle = undefined;
      options.onDeadline();
      return;
    }
    timerHandle = options.clock.setTimeout(update, Math.min(interval, remaining));
  };

  update();
  return Object.freeze({
    getRemaining,
    cancel() {
      if (cancelled) return;
      cancelled = true;
      if (timerHandle !== undefined) options.clock.clearTimeout(timerHandle);
      timerHandle = undefined;
    },
  });
}
