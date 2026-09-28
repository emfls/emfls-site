import { BEST_STORAGE_KEY } from './constants.ts';

export const SIGNAL_SWEEP_STORAGE_KEY = BEST_STORAGE_KEY;

export interface BestStats {
  readonly bestScore: number;
  readonly bestCleanRounds: number;
}

export interface BestStatsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

type StorageProvider = () => BestStatsStorage | null;

const EMPTY_BEST_STATS: BestStats = Object.freeze({ bestScore: 0, bestCleanRounds: 0 });
const defaultStorageProvider: StorageProvider = () => globalThis.localStorage;

function isNonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function exactBestStatsShape(value: unknown): value is Record<'bestScore' | 'bestCleanRounds', unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const keys = Object.keys(value);
  return keys.length === 2 && keys.includes('bestScore') && keys.includes('bestCleanRounds');
}

export function loadBestStats(getStorage: StorageProvider = defaultStorageProvider): BestStats {
  try {
    const storage = getStorage();
    if (!storage) return EMPTY_BEST_STATS;
    const serialized = storage.getItem(SIGNAL_SWEEP_STORAGE_KEY);
    if (serialized === null) return EMPTY_BEST_STATS;
    const parsed: unknown = JSON.parse(serialized);
    if (!exactBestStatsShape(parsed)) return EMPTY_BEST_STATS;
    return Object.freeze({
      bestScore: isNonNegativeSafeInteger(parsed.bestScore) ? parsed.bestScore : 0,
      bestCleanRounds: isNonNegativeSafeInteger(parsed.bestCleanRounds) ? parsed.bestCleanRounds : 0,
    });
  } catch {
    return EMPTY_BEST_STATS;
  }
}

export function mergeBestStats(current: BestStats, candidate: BestStats): BestStats {
  return Object.freeze({
    bestScore: Math.max(current.bestScore, candidate.bestScore),
    bestCleanRounds: Math.max(current.bestCleanRounds, candidate.bestCleanRounds),
  });
}

export function saveBestStats(
  stats: BestStats,
  getStorage: StorageProvider = defaultStorageProvider,
): boolean {
  if (!isNonNegativeSafeInteger(stats.bestScore) || !isNonNegativeSafeInteger(stats.bestCleanRounds)) return false;
  try {
    const storage = getStorage();
    if (!storage) return false;
    storage.setItem(SIGNAL_SWEEP_STORAGE_KEY, JSON.stringify({
      bestScore: stats.bestScore,
      bestCleanRounds: stats.bestCleanRounds,
    }));
    return true;
  } catch {
    return false;
  }
}
