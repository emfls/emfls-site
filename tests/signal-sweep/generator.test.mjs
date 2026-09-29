import assert from 'node:assert/strict';
import test from 'node:test';

const loadGenerator = async () => import('../../src/games/signal-sweep/generator.ts').catch(() => ({}));
const loadValidator = async () => import('../../src/games/signal-sweep/validator.ts').catch(() => ({}));
const loadRng = async () => import('../../src/games/signal-sweep/rng.ts').catch(() => ({}));
const generator = await loadGenerator();
const validator = await loadValidator();
const rng = await loadRng();
const available = (module, name) => assert.equal(typeof module[name], 'function', `${name} must be exported`);

test('same uint32 seed reproduces all 15 rules, boards, IDs, positions, and diagnostics', () => {
  available(generator, 'generateSessionPlan');
  const first = generator.generateSessionPlan(0x1234_abcd);
  const replay = generator.generateSessionPlan(0x1234_abcd);
  assert.equal(first.rounds.length, 15);
  assert.deepEqual(first, replay);
  assert.equal(first.seed, 0x1234_abcd);
  assert.equal(first.generatorVersion, 1);
});

test('100 uint32 seeds produce 15 validator-approved rounds with exact size and tier bounds', () => {
  available(generator, 'generateSessionPlan');
  available(validator, 'validateRoundPlan');
  const targetCountsByTier = Array.from({ length: 5 }, () => new Set());
  for (let index = 0; index < 100; index++) {
    const seed = Math.imul(index, 0x9e3779b1) >>> 0;
    const plan = generator.generateSessionPlan(seed);
    assert.equal(plan.rounds.length, 15);
    for (const round of plan.rounds) {
      assert.equal(validator.validateRoundPlan(round).valid, true, `seed ${seed}, round ${round.roundNumber}`);
      assert.equal(round.symbols.length, [12, 16, 18, 20, 24][Math.floor((round.roundNumber - 1) / 3)]);
      const minTargets = round.tier === 1 || round.tier >= 4 ? 3 : 2;
      const maxTargets = round.tier >= 4 ? 6 : 5;
      assert.ok(round.targetIds.length >= minTargets && round.targetIds.length <= maxTargets);
      targetCountsByTier[round.tier - 1].add(round.targetIds.length);
      assert.ok(round.symbols.length - round.targetIds.length >= 6);
    }
  }
  for (const [tier, counts] of targetCountsByTier.entries()) {
    const minTargets = tier === 0 || tier >= 3 ? 3 : 2;
    const maxTargets = tier >= 3 ? 6 : 5;
    assert.ok(counts.has(minTargets), `tier ${tier + 1} reaches the minimum target boundary`);
    assert.ok(counts.has(maxTargets), `tier ${tier + 1} reaches the maximum target boundary`);
  }
});

test('all 15 frozen fallback seeds pass the same validator and match the A contract diagnostics', () => {
  available(generator, 'createFallbackRound');
  available(validator, 'validateRoundPlan');
  const expected = [
    ['T1_SHAPE', 3, 12, 9], ['T1_FILL', 3, 12, 9], ['T1_FILL', 4, 12, 8],
    ['T2_SHAPE_MARK', 5, 16, 9], ['T2_FILL_MARK', 4, 16, 11], ['T2_SHAPE_FILL', 4, 16, 10],
    ['T3_NOT_FILL_AND_MARK', 5, 18, 11], ['T3_NOT_SHAPE_AND_FILL', 4, 18, 12], ['T3_NOT_SHAPE_AND_FILL', 3, 18, 9],
    ['T4_SHAPE_FILL_OR_MARK', 4, 20, 9], ['T4_COLOR_SHAPE_OR_FILL', 3, 20, 10], ['T4_COLOR_SHAPE_OR_FILL', 5, 20, 13],
    ['T5_NOT_FILL_SHAPE_COLOR', 4, 24, 13], ['T5_OR_MARK_FILL_SHAPE', 6, 24, 13], ['T5_OR_SHAPE_FILL_MARK', 4, 24, 12],
  ];
  for (let index = 0; index < 15; index++) {
    const round = generator.createFallbackRound(index + 1, 0xabcdef01);
    assert.equal(validator.validateRoundPlan(round).valid, true, `fallback round ${index + 1}`);
    assert.deepEqual([round.rule.templateId, round.targetIds.length, round.boardSize, round.diagnostics.nearMissCount], expected[index]);
    assert.equal(round.diagnostics.fallbackSeed, 0x5eed0000 + index);
  }
});

test('30 rejected candidates use an isolated validated fallback and preserve the session stream', () => {
  available(generator, 'generateRoundWithFallback');
  available(generator, 'createFallbackRound');
  available(validator, 'validateRoundPlan');
  available(rng, 'createSeededRandom');
  const seed = 707;
  const next = rng.createSeededRandom(seed);
  let attempts = 0;
  const round = generator.generateRoundWithFallback(1, 123, next, (_number, _seed, _attempt, stream) => {
    attempts += 1;
    stream();
    return null;
  });
  assert.equal(attempts, 30);
  assert.equal(round.diagnostics.candidateAttempts, 30);
  assert.equal(round.diagnostics.usedFallback, true);
  assert.equal(validator.validateRoundPlan(round).valid, true);
  const expectedNext = rng.createSeededRandom(seed);
  for (let i = 0; i < 30; i++) expectedNext();
  assert.equal(next(), expectedNext());
});

test('failed candidates consume one shared stream and generation never calls hidden randomness', () => {
  available(generator, 'generateRoundWithFallback');
  available(generator, 'createFallbackRound');
  available(rng, 'createSeededRandom');
  const seed = 19;
  const next = rng.createSeededRandom(seed);
  const fallback = generator.createFallbackRound(1, 123);
  let attempts = 0;
  const round = generator.generateRoundWithFallback(1, 123, next, (_number, _seed, attempt, stream) => {
    attempts += 1;
    stream();
    return attempt < 3 ? null : fallback;
  });
  assert.equal(attempts, 3);
  assert.equal(round.diagnostics.candidateAttempts, 3);
  const expectedNext = rng.createSeededRandom(seed);
  for (let i = 0; i < 3; i++) expectedNext();
  assert.equal(next(), expectedNext());

  const originalRandom = Math.random;
  try {
    Math.random = () => { throw new Error('hidden randomness is forbidden'); };
    assert.equal(generator.generateSessionPlan(0).rounds.length, 15);
  } finally {
    Math.random = originalRandom;
  }
});

test('uint32 boundary seeds also produce complete deterministic plans', () => {
  available(generator, 'generateSessionPlan');
  for (const seed of [0, 0xffff_ffff]) {
    const plan = generator.generateSessionPlan(seed);
    assert.equal(plan.rounds.length, 15);
    assert.deepEqual(plan, generator.generateSessionPlan(seed));
  }
});

test('different seeds change the generated plan and every tier reaches its frozen board and target bands', () => {
  available(generator, 'generateSessionPlan');
  const first = generator.generateSessionPlan(0x1111);
  const second = generator.generateSessionPlan(0x2222);
  assert.notDeepEqual(first, second);
  const specs = [
    { size: 12, min: 3, max: 5 }, { size: 16, min: 2, max: 5 }, { size: 18, min: 2, max: 5 },
    { size: 20, min: 3, max: 6 }, { size: 24, min: 3, max: 6 },
  ];
  for (let tier = 1; tier <= 5; tier++) {
    const plan = generator.generateSessionPlan(tier * 0x10001);
    const tierRounds = plan.rounds.slice((tier - 1) * 3, tier * 3);
    assert.equal(tierRounds.length, 3);
    for (const round of tierRounds) {
      assert.equal(round.boardSize, specs[tier - 1].size);
      assert.ok(round.targetIds.length >= specs[tier - 1].min);
      assert.ok(round.targetIds.length <= specs[tier - 1].max);
      assert.equal(new Set(round.targetIds).size, round.targetIds.length);
      assert.ok(round.diagnostics.nearMissCount >= Math.ceil((round.boardSize - round.targetIds.length) / 2));
    }
  }
});
