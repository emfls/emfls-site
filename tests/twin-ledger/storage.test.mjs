import assert from 'node:assert/strict';
import test from 'node:test';

const storageApi = await import('../../src/games/twin-ledger/storage.ts').catch(() => ({}));
const zeroStats = { bestScore: 0, bestMaxCombo: 0 };

test('best-stat storage uses one exact key and exact JSON shape', () => {
  assert.equal(storageApi.BEST_STORAGE_KEY, 'emfls:twin-ledger:best:v1');
  assert.equal(typeof storageApi.loadBestStats, 'function');
  assert.equal(typeof storageApi.saveBestStats, 'function');
  let savedKey;
  let savedValue;
  const storage = {
    getItem: () => JSON.stringify({ bestScore: 1234, bestMaxCombo: 7 }),
    setItem: (key, value) => { savedKey = key; savedValue = value; },
  };
  assert.deepEqual(storageApi.loadBestStats(() => storage), { bestScore: 1234, bestMaxCombo: 7 });
  assert.equal(storageApi.saveBestStats({ bestScore: 1234, bestMaxCombo: 7 }, () => storage), true);
  assert.equal(savedKey, 'emfls:twin-ledger:best:v1');
  assert.deepEqual(JSON.parse(savedValue), { bestScore: 1234, bestMaxCombo: 7 });
});

test('unavailable, throwing, malformed, or wrong-shape storage falls back without blocking play', () => {
  assert.deepEqual(storageApi.loadBestStats(() => null), zeroStats);
  assert.deepEqual(storageApi.loadBestStats(() => { throw new Error('storage getter denied'); }), zeroStats);
  assert.deepEqual(storageApi.loadBestStats(() => ({ getItem: () => { throw new Error('read denied'); }, setItem() {} })), zeroStats);
  assert.deepEqual(storageApi.loadBestStats(() => ({ getItem: () => '{not json', setItem() {} })), zeroStats);
  assert.deepEqual(storageApi.loadBestStats(() => ({ getItem: () => JSON.stringify({ bestScore: 10 }), setItem() {} })), zeroStats);
  assert.deepEqual(storageApi.loadBestStats(() => ({ getItem: () => JSON.stringify({ bestScore: 10, bestMaxCombo: 2, extra: true }), setItem() {} })), zeroStats);
});

test('the native localStorage property getter may throw without breaking load or save', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  try {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() { throw new Error('storage property denied'); },
    });
    assert.deepEqual(storageApi.loadBestStats(), zeroStats);
    assert.equal(storageApi.saveBestStats({ bestScore: 1, bestMaxCombo: 1 }), false);
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});

test('best fields validate independently and reject negative or unsafe integers', () => {
  const load = (value) => storageApi.loadBestStats(() => ({ getItem: () => JSON.stringify(value), setItem() {} }));
  assert.deepEqual(load({ bestScore: -1, bestMaxCombo: 8 }), { bestScore: 0, bestMaxCombo: 8 });
  assert.deepEqual(load({ bestScore: 100, bestMaxCombo: Number.MAX_SAFE_INTEGER + 1 }), { bestScore: 100, bestMaxCombo: 0 });
  assert.deepEqual(load({ bestScore: '100', bestMaxCombo: 3 }), { bestScore: 0, bestMaxCombo: 3 });
});

test('write failure or unavailable storage returns safely without throwing', () => {
  assert.equal(storageApi.saveBestStats({ bestScore: 10, bestMaxCombo: 2 }, () => null), false);
  assert.equal(storageApi.saveBestStats({ bestScore: 10, bestMaxCombo: 2 }, () => ({
    getItem: () => null,
    setItem: () => { throw new Error('quota exceeded'); },
  })), false);
});
