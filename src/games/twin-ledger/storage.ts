import type { BestStats } from './types.ts';

export const BEST_STORAGE_KEY = 'emfls:twin-ledger:best:v1';

type BestStatsStorage = Pick<Storage, 'getItem' | 'setItem'>;
export type BestStatsStorageProvider = () => BestStatsStorage | null;

const ZERO_STATS: BestStats = Object.freeze({ bestScore: 0, bestMaxCombo: 0 });

const browserStorage = (): BestStatsStorage | null => globalThis.localStorage ?? null;
const isValidBest = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;

export const loadBestStats = (getStorage: BestStatsStorageProvider = browserStorage): BestStats => {
  try {
    const storage = getStorage();
    if (!storage) return { ...ZERO_STATS };
    const raw = storage.getItem(BEST_STORAGE_KEY);
    if (raw === null) return { ...ZERO_STATS };

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...ZERO_STATS };
    const keys = Object.keys(parsed).sort();
    if (keys.length !== 2 || keys[0] !== 'bestMaxCombo' || keys[1] !== 'bestScore') return { ...ZERO_STATS };

    const values = parsed as Record<string, unknown>;
    return {
      bestScore: isValidBest(values.bestScore) ? values.bestScore : 0,
      bestMaxCombo: isValidBest(values.bestMaxCombo) ? values.bestMaxCombo : 0,
    };
  } catch {
    return { ...ZERO_STATS };
  }
};

export const saveBestStats = (
  stats: BestStats,
  getStorage: BestStatsStorageProvider = browserStorage,
): boolean => {
  try {
    const storage = getStorage();
    if (!storage || !isValidBest(stats.bestScore) || !isValidBest(stats.bestMaxCombo)) return false;
    storage.setItem(BEST_STORAGE_KEY, JSON.stringify({
      bestScore: stats.bestScore,
      bestMaxCombo: stats.bestMaxCombo,
    }));
    return true;
  } catch {
    return false;
  }
};
