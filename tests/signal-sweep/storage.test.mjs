import assert from 'node:assert/strict';
import test from 'node:test';

const storageModule = await import('../../src/games/signal-sweep/storage.ts').catch(() => ({}));
const available = (name) => assert.equal(typeof storageModule[name], 'function', `${name} must be exported`);

function memoryStorage(initial = null) {
  let value = initial;
  return {
    getItem() { return value; },
    setItem(_key, next) { value = next; },
    value: () => value,
  };
}

test('best stats use only the exact key and absent, malformed, or wrong-shape data is empty', () => {
  available('loadBestStats');
  assert.equal(typeof storageModule.SIGNAL_SWEEP_STORAGE_KEY, 'string');
  assert.equal(storageModule.SIGNAL_SWEEP_STORAGE_KEY, 'emfls:signal-sweep:best:v1');
  assert.deepEqual(storageModule.loadBestStats(() => null), { bestScore: 0, bestCleanRounds: 0 });
  assert.deepEqual(storageModule.loadBestStats(() => memoryStorage('{')), { bestScore: 0, bestCleanRounds: 0 });
  assert.deepEqual(storageModule.loadBestStats(() => memoryStorage('{"bestScore":90,"bestCleanRounds":2,"session":{}}')), {
    bestScore: 0,
    bestCleanRounds: 0,
  });
});

test('best fields validate independently and reject negative or unsafe values', () => {
  available('loadBestStats');
  const exact = (bestScore, bestCleanRounds) => JSON.stringify({ bestScore, bestCleanRounds });
  assert.deepEqual(storageModule.loadBestStats(() => memoryStorage(exact(-1, 7))), { bestScore: 0, bestCleanRounds: 7 });
  assert.deepEqual(storageModule.loadBestStats(() => memoryStorage(exact(Number.MAX_SAFE_INTEGER + 1, 4))), {
    bestScore: 0,
    bestCleanRounds: 4,
  });
  assert.deepEqual(storageModule.loadBestStats(() => memoryStorage(exact(120, -3))), { bestScore: 120, bestCleanRounds: 0 });
});

test('storage getter and read failures never escape or prevent safe defaults', () => {
  available('loadBestStats');
  assert.deepEqual(storageModule.loadBestStats(() => { throw new Error('getter denied'); }), { bestScore: 0, bestCleanRounds: 0 });
  assert.deepEqual(storageModule.loadBestStats(() => ({ getItem() { throw new Error('read denied'); }, setItem() {} })), {
    bestScore: 0,
    bestCleanRounds: 0,
  });
});

test('the native localStorage getter may throw during load or result persistence', () => {
  available('loadBestStats');
  available('saveBestStats');
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('storage getter denied'); } });
  try {
    assert.deepEqual(storageModule.loadBestStats(), { bestScore: 0, bestCleanRounds: 0 });
    assert.equal(storageModule.saveBestStats({ bestScore: 10, bestCleanRounds: 1 }), false);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});

test('best fields merge independently and writes contain only the exact best-stat shape', () => {
  available('mergeBestStats');
  available('saveBestStats');
  const merged = storageModule.mergeBestStats({ bestScore: 100, bestCleanRounds: 8 }, { bestScore: 140, bestCleanRounds: 3 });
  assert.deepEqual(merged, { bestScore: 140, bestCleanRounds: 8 });

  const storage = memoryStorage();
  assert.equal(storageModule.saveBestStats(merged, () => storage), true);
  assert.equal(storage.value(), '{"bestScore":140,"bestCleanRounds":8}');
});

test('missing storage and write failures do not throw or claim persistence', () => {
  available('saveBestStats');
  const stats = { bestScore: 10, bestCleanRounds: 1 };
  assert.equal(storageModule.saveBestStats(stats, () => null), false);
  assert.equal(storageModule.saveBestStats(stats, () => ({
    getItem() { return null; },
    setItem() { throw new Error('write denied'); },
  })), false);
});
