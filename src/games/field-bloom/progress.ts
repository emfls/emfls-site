import { FIELD_BLOOM_PUZZLE_IDS } from './types.ts';
import type { PuzzleId, StarRating, StoredProgress } from './types.ts';

const puzzleNumberById = new Map(FIELD_BLOOM_PUZZLE_IDS.map((id, index) => [id, index + 1]));

export function createInitialProgress(): StoredProgress {
  return { version: 1, unlockedThrough: 1, puzzles: {} };
}

export function isPuzzleUnlocked(progress: Pick<StoredProgress, 'unlockedThrough'>, puzzleId: string): boolean {
  const puzzleNumber = puzzleNumberById.get(puzzleId as PuzzleId);
  return puzzleNumber !== undefined
    && Number.isSafeInteger(progress.unlockedThrough)
    && progress.unlockedThrough >= 1
    && progress.unlockedThrough <= FIELD_BLOOM_PUZZLE_IDS.length
    && puzzleNumber <= progress.unlockedThrough;
}

export function recordPuzzleResult(
  progress: StoredProgress,
  puzzleId: string,
  stars: StarRating,
  elapsedActiveMs: number,
): StoredProgress {
  const puzzleNumber = puzzleNumberById.get(puzzleId as PuzzleId);
  if (progress.version !== 1 || !isPuzzleUnlocked(progress, puzzleId) || puzzleNumber === undefined) {
    throw new RangeError('Only a known, unlocked Field Bloom puzzle can record a result.');
  }
  if (![1, 2, 3].includes(stars) || !Number.isSafeInteger(elapsedActiveMs) || elapsedActiveMs < 0) {
    throw new RangeError('Puzzle results require 1–3 stars and a nonnegative safe-integer time.');
  }
  const previous = progress.puzzles[puzzleId] ?? { bestStars: null, bestTimeMs: null };
  const bestStars = previous.bestStars === null ? stars : Math.max(previous.bestStars, stars) as StarRating;
  const bestTimeMs = previous.bestTimeMs === null ? elapsedActiveMs : Math.min(previous.bestTimeMs, elapsedActiveMs);
  const nextRecord = { bestStars, bestTimeMs };
  const nextPuzzleNumber = Math.min(FIELD_BLOOM_PUZZLE_IDS.length, puzzleNumber + 1);

  return {
    version: 1,
    unlockedThrough: Math.max(progress.unlockedThrough, nextPuzzleNumber),
    puzzles: { ...progress.puzzles, [puzzleId]: nextRecord },
  };
}
