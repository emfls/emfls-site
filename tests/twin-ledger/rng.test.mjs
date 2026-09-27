import assert from 'node:assert/strict';
import test from 'node:test';

const load = async () => import(new URL('../../src/games/twin-ledger/rng.ts', import.meta.url)).catch(() => ({}));
const rng = await load();
const available = (name) => assert.equal(typeof rng[name], 'function', `${name} must be exported`);

test('Mulberry32 uint32 stream is stable for a frozen seed', () => {
  available('createSeededRandom');
  const first = rng.createSeededRandom(1);
  const second = rng.createSeededRandom(1);
  assert.equal(first(), 2693262067);
  assert.equal(second(), 2693262067);
  assert.deepEqual(Array.from({ length: 12 }, () => first()), Array.from({ length: 12 }, () => second()));
  assert.throws(() => rng.createSeededRandom(-1), RangeError);
  assert.throws(() => rng.createSeededRandom(0x1_0000_0000), RangeError);
  assert.throws(() => rng.createSeededRandom(1.5), RangeError);
});

test('bounded integer draw is unbiased and consumes rejected uint32 words', () => {
  available('drawInt');
  const words = [0xffff_ffff, 4];
  let consumed = 0;
  assert.equal(rng.drawInt(6, () => words[consumed++]), 4);
  assert.equal(consumed, 2);
  consumed = 0;
  assert.equal(rng.drawInt(1, () => { consumed += 1; return 0; }), 0);
  assert.equal(consumed, 0);
  for (const value of [-1, 0x1_0000_0000, 1.5, NaN]) {
    assert.throws(() => rng.drawInt(3, () => value), RangeError);
  }
  assert.throws(() => rng.drawInt(0, () => 0), RangeError);
});

test('session seed acquisition uses one crypto draw and one explicit fallback draw', () => {
  available('createSessionSeed');
  let cryptoCalls = 0;
  const secureSeed = rng.createSessionSeed({
    cryptoProvider: { getRandomValues(array) { cryptoCalls += 1; array[0] = 0xfeed_beef; return array; } },
    fallbackRandom: () => { throw new Error('fallback must not run'); },
  });
  assert.equal(secureSeed, 0xfeed_beef);
  assert.equal(cryptoCalls, 1);
  let fallbackCalls = 0;
  const fallbackSeed = rng.createSessionSeed({
    cryptoProvider: { getRandomValues() { throw new Error('crypto unavailable'); } },
    fallbackRandom: () => { fallbackCalls += 1; return 0.5; },
  });
  assert.equal(fallbackSeed, 0x8000_0000);
  assert.equal(fallbackCalls, 1);
});
