import { createInitialProgress } from './progress.ts';
import { FIELD_BLOOM_PUZZLE_IDS } from './types.ts';
import type { PuzzleBestRecord, StoredProgress } from './types.ts';

export const FIELD_BLOOM_STORAGE_KEY = 'emfls:field-bloom:progress:v1';

export interface ProgressStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && expected.every((key) => Object.hasOwn(value, key));
}

function isValidUnlock(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 1 && (value as number) <= FIELD_BLOOM_PUZZLE_IDS.length;
}

function normalizeRecord(value: unknown): PuzzleBestRecord | null {
  if (!isObject(value) || !hasExactKeys(value, ['bestStars', 'bestTimeMs'])) return null;
  const rawStars = value.bestStars;
  const bestStars = rawStars === null || (Number.isSafeInteger(rawStars) && [1, 2, 3].includes(rawStars as number))
    ? rawStars as PuzzleBestRecord['bestStars']
    : null;
  const rawTime = value.bestTimeMs;
  const bestTimeMs = rawTime === null || (Number.isSafeInteger(rawTime) && (rawTime as number) >= 0)
    ? rawTime as PuzzleBestRecord['bestTimeMs']
    : null;
  if (bestStars === null && bestTimeMs === null) return null;
  return { bestStars, bestTimeMs };
}

function normalizeProgress(value: unknown): StoredProgress {
  if (!isObject(value) || !hasExactKeys(value, ['version', 'unlockedThrough', 'puzzles']) || value.version !== 1 || !isObject(value.puzzles)) {
    return createInitialProgress();
  }

  const puzzles: StoredProgress['puzzles'] = {};
  for (const puzzleId of FIELD_BLOOM_PUZZLE_IDS) {
    if (!Object.hasOwn(value.puzzles, puzzleId)) continue;
    const record = normalizeRecord(value.puzzles[puzzleId]);
    if (record) puzzles[puzzleId] = record;
  }

  return {
    version: 1,
    unlockedThrough: isValidUnlock(value.unlockedThrough) ? value.unlockedThrough : 1,
    puzzles,
  };
}

function resolveStorage(storage: ProgressStorage | null | undefined): ProgressStorage | null {
  if (storage !== undefined) return storage;
  try {
    const candidate = (globalThis as typeof globalThis & { localStorage?: ProgressStorage }).localStorage;
    return candidate && typeof candidate.getItem === 'function' && typeof candidate.setItem === 'function'
      ? candidate
      : null;
  } catch {
    return null;
  }
}

export function loadProgress(storage?: ProgressStorage | null): StoredProgress {
  const resolved = resolveStorage(storage);
  if (!resolved) return createInitialProgress();
  try {
    const serialized = resolved.getItem(FIELD_BLOOM_STORAGE_KEY);
    if (serialized === null) return createInitialProgress();
    return normalizeProgress(JSON.parse(serialized) as unknown);
  } catch {
    return createInitialProgress();
  }
}

export function saveProgress(progress: StoredProgress, storage?: ProgressStorage | null): boolean {
  const resolved = resolveStorage(storage);
  if (!resolved) return false;
  try {
    const normalized = normalizeProgress(progress);
    resolved.setItem(FIELD_BLOOM_STORAGE_KEY, JSON.stringify(normalized));
    return true;
  } catch {
    return false;
  }
}
