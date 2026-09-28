export interface ActiveTimerClock {
  now(): number;
  setTimeout(callback: () => void, delayMs: number): unknown;
  clearTimeout(handle: unknown): void;
}

export interface ActiveTimerOptions {
  readonly clock: ActiveTimerClock;
  readonly updateIntervalMs?: number;
  readonly onUpdate: (elapsedMs: number) => void;
}

export interface ActiveTimer {
  start(): boolean;
  pause(): boolean;
  resume(): boolean;
  stop(): number;
  getElapsedMs(): number;
  isRunning(): boolean;
}

export function createActiveTimer(options: ActiveTimerOptions): ActiveTimer {
  const updateIntervalMs = options.updateIntervalMs ?? 250;
  if (!Number.isFinite(updateIntervalMs) || updateIntervalMs <= 0) {
    throw new RangeError('A positive timer update interval is required.');
  }

  let accumulatedMs = 0;
  let activeSince: number | null = null;
  let started = false;
  let stopped = false;
  let generation = 0;
  let timeoutHandle: unknown;

  const readNow = (): number => {
    const now = options.clock.now();
    return Number.isFinite(now) && now >= 0 ? now : (activeSince ?? 0);
  };

  const getElapsedMs = (): number => Math.round(
    accumulatedMs + (activeSince === null ? 0 : Math.max(0, readNow() - activeSince)),
  );

  const clearScheduledUpdate = (): void => {
    if (timeoutHandle !== undefined) options.clock.clearTimeout(timeoutHandle);
    timeoutHandle = undefined;
  };

  const scheduleUpdate = (expectedGeneration: number): void => {
    timeoutHandle = options.clock.setTimeout(() => {
      if (stopped || !started || activeSince === null || generation !== expectedGeneration) return;
      timeoutHandle = undefined;
      options.onUpdate(getElapsedMs());
      if (!stopped && activeSince !== null && generation === expectedGeneration) scheduleUpdate(expectedGeneration);
    }, updateIntervalMs);
  };

  const beginActiveInterval = (): void => {
    activeSince = readNow();
    const expectedGeneration = ++generation;
    options.onUpdate(getElapsedMs());
    scheduleUpdate(expectedGeneration);
  };

  return Object.freeze({
    start(): boolean {
      if (stopped || started) return false;
      started = true;
      beginActiveInterval();
      return true;
    },
    pause(): boolean {
      if (stopped || !started || activeSince === null) return false;
      accumulatedMs += Math.max(0, readNow() - activeSince);
      activeSince = null;
      generation += 1;
      clearScheduledUpdate();
      options.onUpdate(getElapsedMs());
      return true;
    },
    resume(): boolean {
      if (stopped || !started || activeSince !== null) return false;
      beginActiveInterval();
      return true;
    },
    stop(): number {
      if (!stopped) {
        if (activeSince !== null) accumulatedMs += Math.max(0, readNow() - activeSince);
        activeSince = null;
        stopped = true;
        generation += 1;
        clearScheduledUpdate();
      }
      return Math.round(accumulatedMs);
    },
    getElapsedMs,
    isRunning: () => !stopped && activeSince !== null,
  });
}

export function formatElapsedTime(elapsedMs: number): string {
  const safeElapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  const wholeSeconds = Math.floor(safeElapsed / 1000);
  const minutes = Math.floor(wholeSeconds / 60);
  const seconds = String(wholeSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}
