import assert from 'node:assert/strict';
import test from 'node:test';

const { createFieldBloomSession } = await import('../../src/games/field-bloom/controller.ts');
const { FIELD_BLOOM_PUZZLES } = await import('../../src/games/field-bloom/puzzles.ts');

class FakeClock {
  current = 0;
  nextId = 1;
  tasks = new Map();
  now = () => this.current;
  setTimeout = (callback, delayMs) => {
    const id = this.nextId++;
    this.tasks.set(id, { at: this.current + delayMs, callback });
    return id;
  };
  clearTimeout = (id) => this.tasks.delete(id);
  advance(durationMs) {
    const end = this.current + durationMs;
    while (true) {
      const next = [...this.tasks.entries()]
        .filter(([, task]) => task.at <= end)
        .sort((left, right) => left[1].at - right[1].at || left[0] - right[0])[0];
      if (!next) break;
      const [id, task] = next;
      this.tasks.delete(id);
      this.current = task.at;
      task.callback();
    }
    this.current = end;
  }
}

class MemoryStorage {
  values = new Map();
  writes = [];
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); this.writes.push([key, value]); }
}

function solveThroughSession(session, puzzle) {
  for (const placement of puzzle.knownSolution) {
    assert.equal(session.selectPiece(placement.pieceInstanceId), true);
    assert.equal(session.placeAt(placement.row, placement.col), true);
  }
  return session.getSnapshot();
}

test('the actual controller transaction solves all 12 fixed puzzles and unlocks only through 12', () => {
  const clock = new FakeClock();
  const storage = new MemoryStorage();
  const session = createFieldBloomSession({ clock, storage });

  assert.equal(session.selectPuzzle('fb-01'), true);
  for (let index = 0; index < FIELD_BLOOM_PUZZLES.length; index += 1) {
    const puzzle = FIELD_BLOOM_PUZZLES[index];
    if (index > 0) assert.equal(session.nextPuzzle(), true);
    assert.equal(session.getSnapshot().puzzleId, puzzle.id);
    assert.equal(session.startPuzzle(), true);
    clock.advance(2750);

    const solved = solveThroughSession(session, puzzle);
    assert.equal(solved.state, 'SOLVE_FEEDBACK', puzzle.id);
    assert.equal(solved.result.stars, 3, puzzle.id);
    assert.equal(solved.result.piecesUsed, puzzle.knownSolution.length, puzzle.id);
    assert.equal(solved.result.undoCount, 0, puzzle.id);
    assert.equal(solved.result.elapsedActiveMs, 2750, puzzle.id);
    assert.equal(solved.result.bestStars, 3, puzzle.id);
    assert.equal(solved.result.bestTimeMs, 2750, puzzle.id);
    assert.equal(solved.progress.unlockedThrough, Math.min(index + 2, 12), puzzle.id);
    assert.equal(solved.allPuzzlesComplete, index === 11, puzzle.id);
    assert.equal(storage.writes.length, index + 1, 'one persistence attempt per solved puzzle');
    assert.equal(session.placeAt(0, 0), false, 'SOLVE_FEEDBACK rejects later placement');
    assert.deepEqual(session.getSnapshot().result, solved.result, 'a duplicate solve cannot replace its result');
  }

  assert.equal(session.nextPuzzle(), false, 'puzzle twelve never creates a thirteenth puzzle');
  assert.equal(session.backToLevels(), true);
  assert.equal(session.selectPuzzle('fb-13'), false);
  assert.equal(session.selectPuzzle('fb-12'), true, 'an unlocked puzzle remains replayable');
});

test('Retry and selector replay reset attempts but retain progress and independent bests', () => {
  const clock = new FakeClock();
  const storage = new MemoryStorage();
  const session = createFieldBloomSession({ clock, storage });
  const firstPuzzle = FIELD_BLOOM_PUZZLES[0];

  session.selectPuzzle(firstPuzzle.id);
  session.startPuzzle();
  clock.advance(5000);
  const first = solveThroughSession(session, firstPuzzle);
  assert.equal(first.result.bestTimeMs, 5000);
  const firstProgress = first.progress;

  assert.equal(session.retryPuzzle(), true);
  assert.equal(session.getSnapshot().state, 'PUZZLE_INTRO');
  assert.deepEqual(session.getSnapshot().placements, []);
  assert.equal(session.getSnapshot().selectedPieceInstanceId, null);
  assert.equal(session.getSnapshot().undoCount, 0);
  assert.equal(session.getSnapshot().elapsedActiveMs, 0);
  assert.deepEqual(session.getSnapshot().progress, firstProgress);
  session.startPuzzle();
  session.reset();
  session.reset();
  clock.advance(1000);
  const lowerStars = solveThroughSession(session, firstPuzzle);
  assert.equal(lowerStars.result.stars, 2);
  assert.equal(lowerStars.result.bestStars, 3, 'best stars remain an independent maximum');
  assert.equal(lowerStars.result.bestTimeMs, 1000, 'best time remains an independent minimum');
  assert.equal(lowerStars.progress.unlockedThrough, 2, 'a lower-star replay never relocks progress');

  assert.equal(session.backToLevels(), true);
  assert.equal(session.selectPuzzle(firstPuzzle.id), true);
  const replay = session.getSnapshot();
  assert.equal(replay.progress.puzzles[firstPuzzle.id].bestStars, 3);
  assert.equal(replay.progress.puzzles[firstPuzzle.id].bestTimeMs, 1000);
  assert.deepEqual(replay.placements, []);
  assert.equal(replay.undoCount, 0);
});

test('missing or failing storage never blocks in-memory result and unlock progress', () => {
  for (const storage of [null, {
    getItem() { throw new Error('read unavailable'); },
    setItem() { throw new Error('write unavailable'); },
  }]) {
    const session = createFieldBloomSession({ clock: new FakeClock(), storage });
    assert.equal(session.selectPuzzle('fb-01'), true);
    session.startPuzzle();
    const solved = solveThroughSession(session, FIELD_BLOOM_PUZZLES[0]);
    assert.equal(solved.state, 'SOLVE_FEEDBACK');
    assert.equal(solved.progress.unlockedThrough, 2);
    assert.equal(solved.result.bestStars, 3);
  }
});
