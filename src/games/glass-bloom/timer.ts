export type PresentationClock = Readonly<{
  now: () => number;
  setTimeout: (callback: () => void, delayMs: number) => unknown;
  clearTimeout: (handle: unknown) => void;
}>;

type TimerState = 'IDLE' | 'RUNNING' | 'PAUSED';

const systemClock: PresentationClock = {
  now: () => globalThis.performance.now(),
  setTimeout: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export function createPresentationTimer({ clock = systemClock }: { clock?: PresentationClock } = {}) {
  let state: TimerState = 'IDLE';
  let handle: unknown = null;
  let generation = 0;
  let deadline = 0;
  let remaining = 0;
  let onExpire: (() => void) | null = null;

  function schedule(delayMs: number): void {
    generation += 1;
    const scheduledGeneration = generation;
    remaining = delayMs;
    deadline = clock.now() + delayMs;
    state = 'RUNNING';
    handle = clock.setTimeout(() => {
      if (state !== 'RUNNING' || generation !== scheduledGeneration) return;
      handle = null;
      state = 'IDLE';
      remaining = 0;
      const callback = onExpire;
      onExpire = null;
      callback?.();
    }, delayMs);
  }

  return Object.freeze({
    start(durationMs: number, callback: () => void): boolean {
      if (state !== 'IDLE') return false;
      if (!Number.isFinite(durationMs) || durationMs < 0) throw new RangeError('duration must be non-negative');
      if (typeof callback !== 'function') throw new TypeError('callback must be a function');
      onExpire = callback;
      schedule(durationMs);
      return true;
    },
    pause(): boolean {
      if (state !== 'RUNNING') return false;
      remaining = Math.max(0, deadline - clock.now());
      clock.clearTimeout(handle);
      handle = null;
      generation += 1;
      state = 'PAUSED';
      return true;
    },
    resume(): boolean {
      if (state !== 'PAUSED') return false;
      schedule(remaining);
      return true;
    },
    cancel(): boolean {
      if (state === 'IDLE') return false;
      if (state === 'RUNNING') clock.clearTimeout(handle);
      handle = null;
      generation += 1;
      state = 'IDLE';
      remaining = 0;
      onExpire = null;
      return true;
    },
    getRemaining(): number {
      if (state === 'RUNNING') return Math.max(0, deadline - clock.now());
      return state === 'PAUSED' ? remaining : 0;
    },
  });
}
