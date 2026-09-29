import assert from 'node:assert/strict';
import test from 'node:test';

const storageApi = await import('../../src/games/glass-bloom/storage.ts').catch(() => ({}));
const empty = { bestScore: 0, highestStageReached: 0 };

function memoryStorage(raw = null) {
  let value = raw;
  const writes = [];
  return {
    writes,
    getItem(key) { assert.equal(key, 'emfls:glass-bloom:best:v1'); return value; },
    setItem(key, next) { assert.equal(key, 'emfls:glass-bloom:best:v1'); value = next; writes.push(next); },
    get value() { return value; },
  };
}

test('best storage uses the exact key and only the two frozen JSON fields', () => {
  assert.equal(storageApi.BEST_STORAGE_KEY, 'emfls:glass-bloom:best:v1');
  assert.equal(typeof storageApi.loadBestStats, 'function');
  assert.equal(typeof storageApi.saveBestStats, 'function');
  assert.equal(typeof storageApi.updateBestStats, 'function');

  const storage = memoryStorage(JSON.stringify({ bestScore: 1234, highestStageReached: 7 }));
  assert.deepEqual(storageApi.loadBestStats(() => storage), { bestScore: 1234, highestStageReached: 7 });
  assert.equal(storageApi.saveBestStats({ bestScore: 1234, highestStageReached: 7 }, () => storage), true);
  assert.deepEqual(JSON.parse(storage.value), { bestScore: 1234, highestStageReached: 7 });
  assert.deepEqual(Object.keys(JSON.parse(storage.value)).sort(), ['bestScore', 'highestStageReached']);
});

test('missing, malformed, wrong-shape, and throwing reads safely return empty bests', () => {
  const badValues = [null, '{invalid', '[]', '{"bestScore":7}', '{"bestScore":7,"highestStageReached":2,"session":{}}'];
  for (const value of badValues) {
    assert.deepEqual(storageApi.loadBestStats(() => ({ getItem: () => value, setItem() {} })), empty, String(value));
  }
  assert.deepEqual(storageApi.loadBestStats(() => null), empty);
  assert.deepEqual(storageApi.loadBestStats(() => { throw new Error('storage getter denied'); }), empty);
  assert.deepEqual(storageApi.loadBestStats(() => ({ getItem() { throw new Error('read denied'); }, setItem() {} })), empty);
});

test('each stored best validates independently and rejects invalid ranges', () => {
  const load = (value) => storageApi.loadBestStats(() => ({ getItem: () => JSON.stringify(value), setItem() {} }));
  assert.deepEqual(load({ bestScore: -1, highestStageReached: 8 }), { bestScore: 0, highestStageReached: 8 });
  assert.deepEqual(load({ bestScore: 900, highestStageReached: 9 }), { bestScore: 900, highestStageReached: 0 });
  assert.deepEqual(load({ bestScore: Number.MAX_SAFE_INTEGER + 1, highestStageReached: 0 }), { bestScore: 0, highestStageReached: 0 });
  assert.deepEqual(load({ bestScore: '900', highestStageReached: 3 }), { bestScore: 0, highestStageReached: 3 });
  assert.deepEqual(load({ bestScore: 100, highestStageReached: 2.5 }), { bestScore: 100, highestStageReached: 0 });
});

test('the browser localStorage getter can throw without breaking load or save', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() { throw new Error('localStorage denied'); },
    });
    assert.deepEqual(storageApi.loadBestStats(), empty);
    assert.equal(storageApi.saveBestStats({ bestScore: 1, highestStageReached: 1 }), false);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});

test('best score and highest stage update as independent maxima', () => {
  const storage = memoryStorage(JSON.stringify({ bestScore: 900, highestStageReached: 2 }));
  assert.deepEqual(storageApi.updateBestStats({ totalScore: 800, highestStage: 7 }, () => storage), {
    bestScore: 900,
    highestStageReached: 7,
  });
  assert.deepEqual(storageApi.updateBestStats({ totalScore: 1200, highestStage: 3 }, () => storage), {
    bestScore: 1200,
    highestStageReached: 7,
  });
  assert.deepEqual(JSON.parse(storage.value), { bestScore: 1200, highestStageReached: 7 });
  assert.equal(storage.writes.length, 2);
});

test('unavailable, denied, or quota-limited storage cannot throw or block in-memory bests', () => {
  assert.equal(storageApi.saveBestStats({ bestScore: 100, highestStageReached: 2 }, () => null), false);
  assert.equal(storageApi.saveBestStats({ bestScore: 100, highestStageReached: 2 }, () => ({ getItem() { return null; }, setItem() { throw new Error('quota'); } })), false);
  assert.deepEqual(storageApi.updateBestStats({ totalScore: 300, highestStage: 4 }, () => ({ getItem() { throw new Error('read denied'); }, setItem() { throw new Error('write denied'); } })), {
    bestScore: 300,
    highestStageReached: 4,
  });
  assert.deepEqual(storageApi.updateBestStats({ totalScore: 300, highestStage: 4 }, () => null), {
    bestScore: 300,
    highestStageReached: 4,
  });
});
