import assert from 'node:assert/strict';
import test from 'node:test';

const progressModule = await import('../../src/games/field-bloom/progress.ts').catch(() => ({}));

test('initial progress unlocks only puzzle 1 and uses the frozen sparse shape', () => {
  assert.equal(typeof progressModule.createInitialProgress, 'function');
  assert.equal(typeof progressModule.isPuzzleUnlocked, 'function');
  const progress = progressModule.createInitialProgress();
  assert.deepEqual(progress, { version: 1, unlockedThrough: 1, puzzles: {} });
  assert.equal(progressModule.isPuzzleUnlocked(progress, 'fb-01'), true);
  assert.equal(progressModule.isPuzzleUnlocked(progress, 'fb-02'), false);
});

test('solving any unlocked level advances monotonically and independently keeps best stars and fastest time', () => {
  assert.equal(typeof progressModule.recordPuzzleResult, 'function');
  const initial = progressModule.createInitialProgress();
  const first = progressModule.recordPuzzleResult(initial, 'fb-01', 1, 5000);
  assert.equal(first.unlockedThrough, 2);
  assert.deepEqual(first.puzzles['fb-01'], { bestStars: 1, bestTimeMs: 5000 });
  const improved = progressModule.recordPuzzleResult(first, 'fb-01', 3, 9000);
  assert.deepEqual(improved.puzzles['fb-01'], { bestStars: 3, bestTimeMs: 5000 });
  const faster = progressModule.recordPuzzleResult(improved, 'fb-01', 2, 3000);
  assert.deepEqual(faster.puzzles['fb-01'], { bestStars: 3, bestTimeMs: 3000 });
  assert.equal(faster.unlockedThrough, 2);
  const alreadyAdvanced = progressModule.recordPuzzleResult({ ...faster, unlockedThrough: 5 }, 'fb-02', 1, 8000);
  assert.equal(alreadyAdvanced.unlockedThrough, 5, 'replay results never relock later puzzles');
  assert.deepEqual(initial, { version: 1, unlockedThrough: 1, puzzles: {} }, 'updates do not mutate prior progress');
});

test('last puzzle caps unlock at 12 and invalid or locked results are rejected', () => {
  const atTwelve = { version: 1, unlockedThrough: 12, puzzles: {} };
  assert.equal(progressModule.recordPuzzleResult(atTwelve, 'fb-12', 1, 0).unlockedThrough, 12);
  assert.throws(() => progressModule.recordPuzzleResult(progressModule.createInitialProgress(), 'fb-02', 1, 1));
  assert.throws(() => progressModule.recordPuzzleResult(atTwelve, 'fb-13', 1, 1));
  assert.throws(() => progressModule.recordPuzzleResult(atTwelve, 'fb-12', 0, 1));
  assert.throws(() => progressModule.recordPuzzleResult(atTwelve, 'fb-12', 3, -1));
});
