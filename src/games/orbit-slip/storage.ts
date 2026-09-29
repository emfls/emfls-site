export const STORAGE_KEY = 'emfls:orbit-slip:best:v1';

export type BestStats = Readonly<{
  bestScore: number;
  bestTimeMs: number;
}>;

export type BestStatsStorage = Pick<Storage, 'getItem' | 'setItem'>;

export const ZERO_BEST_STATS: BestStats = Object.freeze({ bestScore: 0, bestTimeMs: 0 });

const fallbackStats = (): BestStats => ({ ...ZERO_BEST_STATS });

const isBestStats = (value: unknown): value is BestStats => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  if (keys.length !== 2 || !keys.includes('bestScore') || !keys.includes('bestTimeMs')) return false;
  const record = value as Record<string, unknown>;
  return Number.isSafeInteger(record.bestScore) && (record.bestScore as number) >= 0
    && Number.isSafeInteger(record.bestTimeMs) && (record.bestTimeMs as number) >= 0;
};

const getStorage = (storage?: BestStatsStorage): BestStatsStorage => {
  if (storage) return storage;
  if (typeof window === 'undefined') throw new Error('Browser storage is unavailable.');
  return window.localStorage;
};

const readStoredStats = (storage: BestStatsStorage): { stats: BestStats; valid: boolean } => {
  const raw = storage.getItem(STORAGE_KEY);
  if (raw === null) return { stats: fallbackStats(), valid: true };
  if (typeof raw !== 'string') return { stats: fallbackStats(), valid: false };
  const parsed: unknown = JSON.parse(raw);
  return isBestStats(parsed)
    ? { stats: { bestScore: parsed.bestScore, bestTimeMs: parsed.bestTimeMs }, valid: true }
    : { stats: fallbackStats(), valid: false };
};

export const readBestStats = (storage?: BestStatsStorage): BestStats => {
  try {
    const result = readStoredStats(getStorage(storage));
    return result.valid ? result.stats : fallbackStats();
  } catch {
    return fallbackStats();
  }
};

export const updateBestStats = (score: number, activeMs: number, storage?: BestStatsStorage): BestStats => {
  if (!Number.isSafeInteger(score) || score < 0 || !Number.isFinite(activeMs) || activeMs < 0 || !Number.isSafeInteger(Math.floor(activeMs))) {
    return fallbackStats();
  }
  try {
    const store = getStorage(storage);
    const existing = readStoredStats(store);
    if (!existing.valid) return fallbackStats();
    const next: BestStats = {
      bestScore: Math.max(existing.stats.bestScore, score),
      bestTimeMs: Math.max(existing.stats.bestTimeMs, Math.floor(activeMs)),
    };
    store.setItem(STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return fallbackStats();
  }
};
