import type { BestStats, SessionStats } from './types';

export const BEST_STORAGE_KEY = 'emfls:mirror-drift:best:v1';
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const emptyBestStats = (): BestStats => ({ score: 0, fewestStrikes: null });

const isValidBestStats = (value: unknown): value is BestStats => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<BestStats>;
  const validFewestStrikes = candidate.fewestStrikes === null
    || (Number.isSafeInteger(candidate.fewestStrikes) && candidate.fewestStrikes >= 0);
  return Number.isSafeInteger(candidate.score) && candidate.score >= 0 && validFewestStrikes;
};

const getBrowserStorage = (): StorageLike | undefined => {
  try { return typeof window === 'undefined' ? undefined : window.localStorage; } catch { return undefined; }
};

export const loadBestStats = (storage: StorageLike | undefined = getBrowserStorage()): BestStats => {
  if (!storage) return emptyBestStats();
  try {
    const parsed: unknown = JSON.parse(storage.getItem(BEST_STORAGE_KEY) ?? 'null');
    return isValidBestStats(parsed) ? parsed : emptyBestStats();
  } catch { return emptyBestStats(); }
};

export const getImprovedBestStats = (previous: BestStats, session: Pick<SessionStats, 'score' | 'totalStrikes'>): BestStats => ({
  score: Math.max(previous.score, session.score),
  fewestStrikes: previous.fewestStrikes === null
    ? session.totalStrikes
    : Math.min(previous.fewestStrikes, session.totalStrikes),
});

export const saveBestStats = (best: BestStats, storage: StorageLike | undefined = getBrowserStorage()): void => {
  if (!storage) return;
  try { storage.setItem(BEST_STORAGE_KEY, JSON.stringify({ score: best.score, fewestStrikes: best.fewestStrikes })); } catch { /* Storage is optional. */ }
};
