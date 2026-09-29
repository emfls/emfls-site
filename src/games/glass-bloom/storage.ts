import type { BestStats, SessionStats, Stage } from './types.ts';

export const BEST_STORAGE_KEY = 'emfls:glass-bloom:best:v1';

type BestStorage = Pick<Storage, 'getItem' | 'setItem'>;
export type BestStorageProvider = () => BestStorage | null;

const EMPTY_BEST: BestStats = Object.freeze({ bestScore: 0, highestStageReached: 0 });
const browserStorage = (): BestStorage | null => {
  try {
    const storage = globalThis.localStorage;
    return storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function'
      ? storage
      : null;
  } catch {
    return null;
  }
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const isValidScore = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
const isValidHighestStage = (value: unknown): value is 0 | Stage =>
  Number.isSafeInteger(value) && (value as number) >= 0 && (value as number) <= 8;

export function loadBestStats(getStorage: BestStorageProvider = browserStorage): BestStats {
  try {
    const storage = getStorage();
    if (!storage) return { ...EMPTY_BEST };
    const raw = storage.getItem(BEST_STORAGE_KEY);
    if (raw === null) return { ...EMPTY_BEST };

    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed)) return { ...EMPTY_BEST };
    const keys = Object.keys(parsed).sort();
    if (keys.length !== 2 || keys[0] !== 'bestScore' || keys[1] !== 'highestStageReached') {
      return { ...EMPTY_BEST };
    }

    return {
      bestScore: isValidScore(parsed.bestScore) ? parsed.bestScore : 0,
      highestStageReached: isValidHighestStage(parsed.highestStageReached) ? parsed.highestStageReached : 0,
    };
  } catch {
    return { ...EMPTY_BEST };
  }
}

export function saveBestStats(stats: BestStats, getStorage: BestStorageProvider = browserStorage): boolean {
  if (!isValidScore(stats.bestScore) || !isValidHighestStage(stats.highestStageReached)) return false;
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.setItem(BEST_STORAGE_KEY, JSON.stringify({
      bestScore: stats.bestScore,
      highestStageReached: stats.highestStageReached,
    }));
    return true;
  } catch {
    return false;
  }
}

function isValidSessionBest(stats: SessionStats): boolean {
  return isValidScore(stats.totalScore)
    && Number.isSafeInteger(stats.highestStage)
    && stats.highestStage >= 1
    && stats.highestStage <= 8;
}

export function updateBestStats(session: SessionStats, getStorage: BestStorageProvider = browserStorage): BestStats {
  const current = loadBestStats(getStorage);
  if (!isValidSessionBest(session)) return current;

  const best: BestStats = {
    bestScore: Math.max(current.bestScore, session.totalScore),
    highestStageReached: Math.max(current.highestStageReached, session.highestStage) as 0 | Stage,
  };
  saveBestStats(best, getStorage);
  return best;
}
