import {
  STAGE_POTS,
} from './constants.ts';
import {
  advanceCrystal,
  completeBank,
  completeGrow,
  createSession,
  enterDecision,
  getSessionStats,
  resolveBank,
  resolveGrow,
} from './logic.ts';
import { createSessionSeed } from './rng.ts';
import { getBreakRisk } from './risk.ts';
import { loadBestStats, updateBestStats, type BestStorageProvider } from './storage.ts';
import { createPresentationTimer, type PresentationClock } from './timer.ts';
import type { BestStats, GameSession, GameState } from './types.ts';

export const PRESENTATION_DURATIONS_MS = Object.freeze({
  crystalIntro: 350,
  safeGrow: 450,
  breakGrow: 650,
  bank: 400,
  roundFeedback: 500,
});

const LIVE_STATES: readonly GameState[] = Object.freeze([
  'CRYSTAL_INTRO',
  'DECISION',
  'GROW_RESOLVING',
  'BANK_RESOLVING',
  'ROUND_FEEDBACK',
]);

const defaultClock: PresentationClock = {
  now: () => globalThis.performance.now(),
  setTimeout: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export function getGrowButtonCopy(session: GameSession | null): string {
  if (!session) return `Take the risk for ${STAGE_POTS[1]}`;
  if (session.state === 'GROW_RESOLVING') {
    if (session.growOutcome === 'SAFE') return `Grown — Stage ${session.stage} · Pot ${session.pot}`;
    if (session.growOutcome === 'SHATTERED') return 'Shattered — Pot lost';
  }
  if (session.state === 'ROUND_FEEDBACK' && session.roundOutcome === 'SHATTERED') return 'Shattered — Pot lost';
  const risk = getBreakRisk(session.stage, session.crystalIndex);
  const nextPot = risk === null ? undefined : STAGE_POTS[session.stage];
  return nextPot === undefined ? 'Maximum Stage' : `Take the risk for ${nextPot}`;
}

export type GlassBloomController = ReturnType<typeof createGlassBloomController>;

export function createGlassBloomController(options: {
  clock?: PresentationClock;
  seedSource?: () => number;
  storage?: BestStorageProvider;
} = {}) {
  const clock = options.clock ?? defaultClock;
  const seedSource = options.seedSource ?? createSessionSeed;
  const timer = createPresentationTimer({ clock });
  const subscribers = new Set<(snapshot: GameSession | null) => void>();
  let session: GameSession | null = null;
  let bestStats: BestStats = loadBestStats(options.storage);
  let pausedFromState: GameState | null = null;
  let sessionGeneration = 0;
  let finalizedResultGeneration = -1;
  let destroyed = false;

  const getState = (): GameState => session?.state ?? 'IDLE';

  const publish = (): void => {
    for (const subscriber of [...subscribers]) subscriber(session, bestStats);
  };

  const schedule = (durationMs: number, expectedState: GameState, callback: () => void): boolean => {
    const expectedGeneration = sessionGeneration;
    return timer.start(durationMs, () => {
      if (destroyed || sessionGeneration !== expectedGeneration || session?.state !== expectedState) return;
      callback();
    });
  };

  const scheduleIntro = (): void => {
    schedule(PRESENTATION_DURATIONS_MS.crystalIntro, 'CRYSTAL_INTRO', () => {
      if (!session) return;
      session = enterDecision(session);
      publish();
    });
  };

  const scheduleFeedback = (): void => {
    schedule(PRESENTATION_DURATIONS_MS.roundFeedback, 'ROUND_FEEDBACK', () => {
      if (!session) return;
      session = advanceCrystal(session);
      if (session.state === 'RESULT' && finalizedResultGeneration !== sessionGeneration) {
        finalizedResultGeneration = sessionGeneration;
        bestStats = updateBestStats(getSessionStats(session), options.storage);
      }
      publish();
      if (session.state === 'CRYSTAL_INTRO') scheduleIntro();
    });
  };

  const scheduleGrowResolution = (): void => {
    if (!session) return;
    const wasSafe = session.growOutcome === 'SAFE';
    const duration = wasSafe ? PRESENTATION_DURATIONS_MS.safeGrow : PRESENTATION_DURATIONS_MS.breakGrow;
    schedule(duration, 'GROW_RESOLVING', () => {
      if (!session) return;
      session = completeGrow(session);
      publish();
      if (session.state === 'ROUND_FEEDBACK') scheduleFeedback();
    });
  };

  const scheduleBankResolution = (): void => {
    schedule(PRESENTATION_DURATIONS_MS.bank, 'BANK_RESOLVING', () => {
      if (!session) return;
      session = completeBank(session);
      publish();
      if (session.state === 'ROUND_FEEDBACK') scheduleFeedback();
    });
  };

  return Object.freeze({
    getState,
    getSnapshot(): GameSession | null {
      return session;
    },
    getBestStats(): BestStats {
      return { ...bestStats };
    },
    subscribe(subscriber: (snapshot: GameSession | null, best: BestStats) => void): () => void {
      subscribers.add(subscriber);
      return () => subscribers.delete(subscriber);
    },
    start(): boolean {
      if (destroyed || session !== null) return false;
      session = createSession(seedSource());
      sessionGeneration += 1;
      finalizedResultGeneration = -1;
      publish();
      scheduleIntro();
      return true;
    },
    grow(): boolean {
      if (destroyed || !session || session.state !== 'DECISION') return false;
      const resolved = resolveGrow(session);
      if (resolved === session || resolved.state !== 'GROW_RESOLVING') return false;
      session = resolved;
      publish();
      scheduleGrowResolution();
      return true;
    },
    bank(): boolean {
      if (destroyed || !session || session.state !== 'DECISION') return false;
      const resolved = resolveBank(session);
      if (resolved === session || resolved.state !== 'BANK_RESOLVING') return false;
      session = resolved;
      publish();
      scheduleBankResolution();
      return true;
    },
    playAgain(): boolean {
      if (destroyed || session?.state !== 'RESULT') return false;
      timer.cancel();
      sessionGeneration += 1;
      finalizedResultGeneration = -1;
      pausedFromState = null;
      session = createSession(seedSource());
      publish();
      scheduleIntro();
      return true;
    },
    pause(): boolean {
      if (destroyed || !session || !LIVE_STATES.includes(session.state)) return false;
      const priorState = session.state;
      if (priorState !== 'DECISION' && !timer.pause()) return false;
      pausedFromState = priorState;
      session = { ...session, state: 'PAUSED' };
      publish();
      return true;
    },
    resume(): boolean {
      if (destroyed || !session || session.state !== 'PAUSED' || !pausedFromState) return false;
      const priorState = pausedFromState;
      if (priorState !== 'DECISION' && !timer.resume()) return false;
      pausedFromState = null;
      session = { ...session, state: priorState };
      publish();
      return true;
    },
    destroy(): void {
      if (destroyed) return;
      destroyed = true;
      sessionGeneration += 1;
      timer.cancel();
      pausedFromState = null;
      subscribers.clear();
    },
  });
}

export function bindGlassBloomLifecycle(options: {
  controller: GlassBloomController;
  documentRef: Pick<Document, 'addEventListener' | 'removeEventListener' | 'visibilityState'>;
  windowRef: Pick<Window, 'addEventListener' | 'removeEventListener'>;
}): () => void {
  let bound = true;
  const onVisibilityChange = (): void => {
    if (options.documentRef.visibilityState === 'hidden') options.controller.pause();
  };
  const onDestroy = (): void => options.controller.destroy();

  options.documentRef.addEventListener('visibilitychange', onVisibilityChange);
  options.documentRef.addEventListener('astro:before-swap', onDestroy);
  options.windowRef.addEventListener('pagehide', onDestroy);

  return () => {
    if (!bound) return;
    bound = false;
    options.documentRef.removeEventListener('visibilitychange', onVisibilityChange);
    options.documentRef.removeEventListener('astro:before-swap', onDestroy);
    options.windowRef.removeEventListener('pagehide', onDestroy);
  };
}
