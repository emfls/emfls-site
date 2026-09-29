import assert from 'node:assert/strict';
import test from 'node:test';

const storageModule = await import('../../src/games/field-bloom/storage.ts').catch(() => ({}));
const progressModule = await import('../../src/games/field-bloom/progress.ts');

class MemoryStorage {
  values = new Map();
  writes = [];
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); this.writes.push([key, value]); }
}

function stored(value) {
  const storage = new MemoryStorage();
  storage.values.set('emfls:field-bloom:progress:v1', JSON.stringify(value));
  return storage;
}

test('loads and saves only the exact Field Bloom versioned progress record', () => {
  assert.equal(typeof storageModule.loadProgress, 'function');
  assert.equal(typeof storageModule.saveProgress, 'function');
  assert.equal(storageModule.FIELD_BLOOM_STORAGE_KEY, 'emfls:field-bloom:progress:v1');

  const storage = new MemoryStorage();
  const progress = {
    version: 1,
    unlockedThrough: 2,
    puzzles: { 'fb-01': { bestStars: 3, bestTimeMs: 12000 } },
  };
  assert.equal(storageModule.saveProgress(progress, storage), true);
  assert.deepEqual(storage.writes, [[
    'emfls:field-bloom:progress:v1',
    '{"version":1,"unlockedThrough":2,"puzzles":{"fb-01":{"bestStars":3,"bestTimeMs":12000}}}',
  ]]);
  assert.deepEqual(storageModule.loadProgress(storage), progress);
});

test('missing storage, malformed JSON, and invalid roots safely return the initial progress', () => {
  const initial = progressModule.createInitialProgress();
  assert.deepEqual(storageModule.loadProgress(null), initial);
  assert.equal(storageModule.saveProgress(initial, null), false);

  const malformed = new MemoryStorage();
  malformed.values.set('emfls:field-bloom:progress:v1', '{not json');
  assert.deepEqual(storageModule.loadProgress(malformed), initial);

  for (const value of [null, [], {}, { ...initial, version: 2 }, { ...initial, extra: true }, { ...initial, puzzles: [] }]) {
    assert.deepEqual(storageModule.loadProgress(stored(value)), initial);
  }
});

test('invalid unlock bounds reset to puzzle one without discarding valid best records', () => {
  const raw = {
    version: 1,
    unlockedThrough: 13,
    puzzles: { 'fb-02': { bestStars: 2, bestTimeMs: 4000 } },
  };
  assert.deepEqual(storageModule.loadProgress(stored(raw)), {
    version: 1,
    unlockedThrough: 1,
    puzzles: { 'fb-02': { bestStars: 2, bestTimeMs: 4000 } },
  });
});

test('unknown puzzle IDs are dropped and partially invalid metrics normalize independently', () => {
  const raw = {
    version: 1,
    unlockedThrough: 4,
    puzzles: {
      'fb-01': { bestStars: 4, bestTimeMs: 2500 },
      'fb-02': { bestStars: 2, bestTimeMs: Number.MAX_SAFE_INTEGER },
      'fb-03': { bestStars: 3, bestTimeMs: Number.MAX_SAFE_INTEGER + 1 },
      'fb-04': { bestStars: null, bestTimeMs: null },
      'fb-13': { bestStars: 3, bestTimeMs: 1 },
    },
  };
  assert.deepEqual(storageModule.loadProgress(stored(raw)), {
    version: 1,
    unlockedThrough: 4,
    puzzles: {
      'fb-01': { bestStars: null, bestTimeMs: 2500 },
      'fb-02': { bestStars: 2, bestTimeMs: Number.MAX_SAFE_INTEGER },
      'fb-03': { bestStars: 3, bestTimeMs: null },
    },
  });
});

test('wrong record shapes drop only that record while malformed metrics do not erase valid siblings', () => {
  const raw = {
    version: 1,
    unlockedThrough: 3,
    puzzles: {
      'fb-01': { bestStars: 1, bestTimeMs: 10, extra: true },
      'fb-02': { bestStars: '3', bestTimeMs: -1 },
      'fb-03': { bestStars: 1, bestTimeMs: 0 },
    },
  };
  assert.deepEqual(storageModule.loadProgress(stored(raw)), {
    version: 1,
    unlockedThrough: 3,
    puzzles: {
      'fb-03': { bestStars: 1, bestTimeMs: 0 },
    },
  });
});

test('storage getter, read, and write failures stay inside the safe fallback boundary', () => {
  const initial = progressModule.createInitialProgress();
  const readFailure = { getItem() { throw new Error('read blocked'); } };
  const writeFailure = { setItem() { throw new Error('write blocked'); } };
  assert.deepEqual(storageModule.loadProgress(readFailure), initial);
  assert.equal(storageModule.saveProgress(initial, writeFailure), false);

  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    get() { throw new Error('storage getter blocked'); },
  });
  try {
    assert.deepEqual(storageModule.loadProgress(), initial);
    assert.equal(storageModule.saveProgress(initial), false);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else delete globalThis.localStorage;
  }
});
