import assert from 'node:assert/strict';
import test from 'node:test';

const load = async () => import(new URL('../../src/games/twin-ledger/sequence.ts', import.meta.url)).catch(() => ({}));
const sequenceApi = await load();
const available = (name) => assert.equal(typeof sequenceApi[name], 'function', `${name} must be exported`);

const assertSequenceContract = (tiles) => {
  assert.equal(tiles.length, 18);
  const phaseOne = tiles.slice(0, 6);
  const phaseTwo = tiles.slice(6, 12);
  const phaseThree = tiles.slice(12, 18);
  assert.ok(phaseOne.every((tile) => tile.weight === 1 && [1, 2, 3, 4].includes(tile.baseValue)));
  assert.ok(phaseTwo.every((tile) => tile.weight === 1 && [2, 3, 4, 5, -2, -3].includes(tile.baseValue)));
  assert.ok([1, 2].includes(phaseTwo.filter((tile) => tile.baseValue < 0).length));
  assert.ok(phaseThree.every((tile) => [2, 3, 4, 5, 6, -2, -3, -4].includes(tile.baseValue)));
  assert.ok(phaseThree.filter((tile) => tile.baseValue < 0).length <= 2);
  const heavy = tiles.flatMap((tile, index) => tile.weight === 2 ? [index + 1] : []);
  assert.equal(heavy.length, 2);
  assert.ok(heavy.every((turn) => turn >= 14));
  assert.ok(heavy.every((turn, index) => index === 0 || turn - heavy[index - 1] > 1));
  assert.ok(heavy.every((turn) => [2, 3].includes(tiles[turn - 1].baseValue)));
  for (let index = 0; index < tiles.length; index += 1) {
    if (index > 0) assert.ok(!(tiles[index].baseValue === tiles[index - 1].baseValue && tiles[index].weight === tiles[index - 1].weight));
    if (index > 1) {
      assert.ok(!(tiles[index].baseValue === tiles[index - 1].baseValue && tiles[index].baseValue === tiles[index - 2].baseValue));
      assert.ok(![tiles[index], tiles[index - 1], tiles[index - 2]].every((tile) => tile.baseValue < 0));
    }
  }
};

test('literal fallback is frozen and passes the exact production sequence validator', () => {
  available('validateSequence');
  assert.ok(Array.isArray(sequenceApi.FALLBACK_SEQUENCE));
  assert.deepEqual(sequenceApi.FALLBACK_SEQUENCE.map(({ baseValue, weight }) => [baseValue, weight]), [
    [1, 1], [2, 1], [1, 1], [2, 1], [1, 1], [2, 1],
    [-2, 1], [3, 1], [-3, 1], [4, 1], [5, 1], [2, 1],
    [3, 1], [2, 2], [-2, 1], [3, 2], [4, 1], [5, 1],
  ]);
  assert.equal(sequenceApi.validateSequence(sequenceApi.FALLBACK_SEQUENCE).valid, true);
  assert.equal(sequenceApi.validateSequence(sequenceApi.FALLBACK_SEQUENCE).fairness.forcedSideRun, 2);
  assertSequenceContract(sequenceApi.FALLBACK_SEQUENCE);
});

test('sequence validator rejects duplicate adjacency, triple base, triple negatives, and adjacent HEAVY', () => {
  available('validateSequence');
  const copy = () => sequenceApi.FALLBACK_SEQUENCE.map((tile) => ({ ...tile }));

  const adjacentIdentical = copy();
  adjacentIdentical[1].baseValue = adjacentIdentical[0].baseValue;
  assert.equal(sequenceApi.validateSequence(adjacentIdentical).reason, 'IDENTICAL_ADJACENT');

  const tripleBase = copy();
  tripleBase[11].baseValue = 3;
  tripleBase[12].baseValue = 2;
  tripleBase[13].baseValue = 2;
  tripleBase[14].baseValue = 2;
  assert.equal(sequenceApi.validateSequence(tripleBase).reason, 'TRIPLE_BASE_VALUE');

  const tripleNegatives = copy();
  tripleNegatives[6].baseValue = 3;
  tripleNegatives[7].baseValue = 4;
  tripleNegatives[8].baseValue = 2;
  tripleNegatives[10].baseValue = -2;
  tripleNegatives[11].baseValue = -3;
  tripleNegatives[12].baseValue = -2;
  assert.equal(sequenceApi.validateSequence(tripleNegatives).reason, 'TRIPLE_NEGATIVE');

  const adjacentHeavy = copy();
  adjacentHeavy[14].baseValue = 2;
  adjacentHeavy[14].weight = 2;
  adjacentHeavy[15].weight = 1;
  assert.equal(sequenceApi.validateSequence(adjacentHeavy).reason, 'ADJACENT_HEAVY');
});

test('generated sessions are deterministic, phase-valid, bounded, and fairly continuable', () => {
  available('generateSequence');
  available('validateSequence');
  for (let seed = 0; seed < 100; seed += 1) {
    const generated = sequenceApi.generateSequence(seed);
    assertSequenceContract(generated.tiles);
    assert.equal(generated.validation.valid, true);
    assert.ok(generated.attempts >= 1 && generated.attempts <= 50);
    assert.ok(!generated.usedFallback || generated.attempts === 50);
    assert.deepEqual(sequenceApi.validateSequence(generated.tiles), generated.validation);
  }
  assert.deepEqual(sequenceApi.generateSequence(123456).tiles, sequenceApi.generateSequence(123456).tiles);
  assert.notDeepEqual(sequenceApi.generateSequence(123456).tiles, sequenceApi.generateSequence(123457).tiles);
});

test('generation uses the same validated fallback after exactly fifty rejected candidates', () => {
  available('generateSequence');
  let draws = 0;
  const generated = sequenceApi.generateSequence(7, () => { draws += 1; return 0; });
  assert.equal(generated.attempts, 50);
  assert.equal(generated.usedFallback, true);
  assert.equal(draws, 1100);
  assert.deepEqual(generated.tiles, sequenceApi.FALLBACK_SEQUENCE);
  assert.equal(generated.validation.valid, true);
});

test('injected invalid RNG output is rejected and deterministic generation has no hidden random calls', () => {
  available('generateSequence');
  assert.throws(() => sequenceApi.generateSequence(5, () => 0x1_0000_0000), RangeError);
  const originalRandom = Math.random;
  Math.random = () => { throw new Error('hidden randomness'); };
  try {
    assert.doesNotThrow(() => sequenceApi.generateSequence(5));
  } finally {
    Math.random = originalRandom;
  }
});
