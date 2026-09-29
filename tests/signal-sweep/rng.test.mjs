import assert from 'node:assert/strict';
import test from 'node:test';

const load = async () => import('../../src/games/signal-sweep/rng.ts').catch(() => ({}));
const rng = await load();
const available = (name) => assert.equal(typeof rng[name], 'function', `${name} must be exported`);

test('Mulberry32 exposes a stable uint32 stream for the same seed', () => {
  available('createSeededRandom');
  const first = rng.createSeededRandom(1);
  const replay = rng.createSeededRandom(1);
  assert.equal(first(), 2693262067);
  assert.equal(replay(), 2693262067);
  assert.deepEqual(Array.from({ length: 20 }, first), Array.from({ length: 20 }, replay));
  for (const seed of [-1, 1.5, 0x1_0000_0000]) assert.throws(() => rng.createSeededRandom(seed), RangeError);
});

test('bounded draws reject biased tail words and consume no word for a singleton', () => {
  available('drawInt');
  const words = [0xffff_ffff, 4];
  let used = 0;
  assert.equal(rng.drawInt(6, () => words[used++]), 4);
  assert.equal(used, 2);
  assert.equal(rng.drawInt(1, () => { throw new Error('singleton must not draw'); }), 0);
  assert.throws(() => rng.drawInt(0, () => 0), RangeError);
  for (const value of [-1, 0x1_0000_0000, 1.5, NaN]) assert.throws(() => rng.drawInt(3, () => value), RangeError);
});

test('session seed uses crypto once, then one validated Math.random fallback only when needed', () => {
  available('createSessionSeed');
  let cryptoCalls = 0;
  assert.equal(rng.createSessionSeed({
    cryptoProvider: { getRandomValues(array) { cryptoCalls += 1; array[0] = 0xfeed_beef; return array; } },
    fallbackRandom: () => { throw new Error('fallback must not run'); },
  }), 0xfeed_beef);
  assert.equal(cryptoCalls, 1);

  let fallbackCalls = 0;
  assert.equal(rng.createSessionSeed({
    cryptoProvider: { getRandomValues() { throw new Error('crypto unavailable'); } },
    fallbackRandom: () => { fallbackCalls += 1; return 0.5; },
  }), 0x8000_0000);
  assert.equal(fallbackCalls, 1);
  assert.throws(() => rng.createSessionSeed({ cryptoProvider: null, fallbackRandom: () => 1 }), RangeError);
});
