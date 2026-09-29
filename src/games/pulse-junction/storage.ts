import type { BestStats, SessionStats } from './types';

export const BEST_STORAGE_KEY = 'emfls:pulse-junction:best:v1';
const emptyBestStats = (): BestStats => ({ score: 0, combo: 0 });
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const isValidBestStats = (value: unknown): value is BestStats => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<BestStats>;
  return Number.isSafeInteger(candidate.score) && candidate.score >= 0 && Number.isSafeInteger(candidate.combo) && candidate.combo >= 0 && candidate.combo <= 20;
};

const getBrowserStorage = (): StorageLike | undefined => {
  try { return window.localStorage; } catch { return undefined; }
};

export const loadBestStats = (storage: StorageLike | undefined = getBrowserStorage()): BestStats => {
  if (!storage) return emptyBestStats();
  try {
    const parsed: unknown = JSON.parse(storage.getItem(BEST_STORAGE_KEY) ?? 'null');
    return isValidBestStats(parsed) ? parsed : emptyBestStats();
  } catch { return emptyBestStats(); }
};

export const getImprovedBestStats = (previous: BestStats, session: Pick<SessionStats, 'score' | 'maxCombo'>): BestStats => ({
  score: Math.max(previous.score, session.score),
  combo: Math.max(previous.combo, session.maxCombo),
});

export const saveBestStats = (best: BestStats, storage: StorageLike | undefined = getBrowserStorage()): void => {
  if (!storage) return;
  try { storage.setItem(BEST_STORAGE_KEY, JSON.stringify({ score: best.score, combo: best.combo })); } catch { /* Storage is optional. */ }
};
