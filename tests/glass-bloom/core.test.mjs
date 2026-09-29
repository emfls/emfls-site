import assert from 'node:assert/strict';
import test from 'node:test';

const load = async (path) => import(path).catch(() => ({}));
const [constants, risk, rng, logic] = await Promise.all([
  load('../../src/games/glass-bloom/constants.ts'),
  load('../../src/games/glass-bloom/risk.ts'),
  load('../../src/games/glass-bloom/rng.ts'),
  load('../../src/games/glass-bloom/logic.ts'),
]);
const available = (module, name) => assert.equal(typeof module[name], 'function', `${name} must be exported`);
const hasArray = (module, name) => assert.ok(Array.isArray(module[name]), `${name} must be exported as an array`);

test('immutable data contains exactly eight stages/crystals and the frozen lifecycle', () => {
  hasArray(constants, 'STAGES');
  hasArray(constants, 'CRYSTAL_INDICES');
  hasArray(constants, 'STAGE_POTS');
  hasArray(constants, 'BASE_BREAK_RISKS');
  hasArray(constants, 'CRYSTAL_RISK_MODIFIERS');
  hasArray(constants, 'GAME_STATES');

  assert.deepEqual(constants.STAGES, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(constants.CRYSTAL_INDICES, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(constants.STAGE_POTS, [100, 180, 300, 500, 800, 1250, 1900, 2800]);
  assert.deepEqual(constants.BASE_BREAK_RISKS, [5, 10, 18, 28, 40, 55, 70]);
  assert.deepEqual(constants.CRYSTAL_RISK_MODIFIERS, [0, 0, 2, 2, 4, 4, 6, 6]);
  for (const table of [constants.STAGES, constants.CRYSTAL_INDICES, constants.STAGE_POTS, constants.BASE_BREAK_RISKS, constants.CRYSTAL_RISK_MODIFIERS, constants.GAME_STATES]) {
    assert.equal(Object.isFrozen(table), true);
  }
  assert.ok(constants.STAGE_POTS.every((pot, index, pots) => index === 0 || pot > pots[index - 1]));
  assert.deepEqual(constants.GAME_STATES, ['IDLE', 'CRYSTAL_INTRO', 'DECISION', 'GROW_RESOLVING', 'BANK_RESOLVING', 'ROUND_FEEDBACK', 'PAUSED', 'RESULT']);
});

test('one risk source returns every exact Stage and Crystal pair, with no Stage 8 risk', () => {
  available(risk, 'isStage');
  available(risk, 'isCrystalIndex');
  available(risk, 'getBreakRisk');

  let pairs = 0;
  for (let stage = 1; stage <= 7; stage += 1) {
    for (let crystal = 1; crystal <= 8; crystal += 1) {
      assert.equal(risk.getBreakRisk(stage, crystal), constants.BASE_BREAK_RISKS[stage - 1] + constants.CRYSTAL_RISK_MODIFIERS[crystal - 1]);
      pairs += 1;
    }
  }
  assert.equal(pairs, 56);
  assert.equal(risk.getBreakRisk(1, 1), 5);
  assert.equal(risk.getBreakRisk(7, 8), 76);
  assert.equal(risk.getBreakRisk(8, 1), null);
  assert.equal(risk.getBreakRisk(1, 0), null);
  assert.equal(risk.getBreakRisk(9, 8), null);
  assert.equal(risk.isStage(8), true);
  assert.equal(risk.isStage(0), false);
  assert.equal(risk.isCrystalIndex(8), true);
  assert.equal(risk.isCrystalIndex(9), false);
});

test('risk bands use the exact inclusive boundaries and reject invalid percentages', () => {
  available(risk, 'getRiskBand');
  assert.equal(risk.getRiskBand(0), 'LOW');
  assert.equal(risk.getRiskBand(14), 'LOW');
  assert.equal(risk.getRiskBand(15), 'MODERATE');
  assert.equal(risk.getRiskBand(29), 'MODERATE');
  assert.equal(risk.getRiskBand(30), 'HIGH');
  assert.equal(risk.getRiskBand(49), 'HIGH');
  assert.equal(risk.getRiskBand(50), 'SEVERE');
  assert.equal(risk.getRiskBand(76), 'SEVERE');
  assert.equal(risk.getRiskBand(100), 'SEVERE');
  for (const value of [-1, 101, NaN, Infinity]) assert.throws(() => risk.getRiskBand(value), RangeError);
});

test('break threshold is strict: equality at 5% is safe', () => {
  available(risk, 'doesBreak');
  const threshold = 5 / 100;
  assert.equal(risk.doesBreak(0, 5), true);
  assert.equal(risk.doesBreak(0.0499, 5), true);
  assert.equal(risk.doesBreak(threshold - Number.EPSILON, 5), true);
  assert.equal(risk.doesBreak(threshold, 5), false);
  assert.equal(risk.doesBreak(threshold + Number.EPSILON, 5), false);
  assert.equal(risk.doesBreak(0.9999999999999999, 5), false);
  assert.equal(risk.doesBreak(0, 0), false);
  assert.equal(risk.doesBreak(0.9999999999999999, 100), true);
  for (const roll of [-Number.EPSILON, 1, NaN]) assert.throws(() => risk.doesBreak(roll, 5), RangeError);
});

test('Mulberry32 validates uint32 seeds, including zero and maximum, and repeats exactly', () => {
  available(rng, 'nextSeededValue');
  available(rng, 'createSeededRandom');
  for (const seed of [0, 1, 0x80000000, 0xffffffff]) {
    const first = rng.createSeededRandom(seed);
    const replay = rng.createSeededRandom(seed);
    const firstValues = Array.from({ length: 40 }, first);
    assert.deepEqual(firstValues, Array.from({ length: 40 }, replay));
    assert.ok(firstValues.every((value) => Number.isFinite(value) && value >= 0 && value < 1));
  }
  assert.equal(rng.createSeededRandom(1)(), 2693262067 / 0x1_0000_0000);
  assert.deepEqual(rng.nextSeededValue(1), { value: 2693262067 / 0x1_0000_0000, nextState: 0x6d2b79f6 });
  for (const seed of [-1, 1.5, 0x1_0000_0000, NaN]) assert.throws(() => rng.createSeededRandom(seed), RangeError);
  assert.notDeepEqual(Array.from({ length: 8 }, rng.createSeededRandom(0)), Array.from({ length: 8 }, rng.createSeededRandom(1)));
});

test('seed acquisition draws crypto once and uses only one validated fallback sample if needed', () => {
  available(rng, 'createSessionSeed');
  let cryptoCalls = 0;
  assert.equal(rng.createSessionSeed({
    cryptoProvider: { getRandomValues(array) { cryptoCalls += 1; array[0] = 0xffffffff; return array; } },
    fallbackRandom: () => { throw new Error('fallback must not run'); },
  }), 0xffffffff);
  assert.equal(cryptoCalls, 1);

  let fallbackCalls = 0;
  assert.equal(rng.createSessionSeed({
    cryptoProvider: { getRandomValues() { throw new Error('crypto unavailable'); } },
    fallbackRandom: () => { fallbackCalls += 1; return 0.5; },
  }), 0x80000000);
  assert.equal(fallbackCalls, 1);
  assert.equal(rng.createSessionSeed({ cryptoProvider: null, fallbackRandom: () => 0 }), 0);
  for (const value of [-1, 1, NaN]) assert.throws(() => rng.createSessionSeed({ cryptoProvider: null, fallbackRandom: () => value }), RangeError);
});

test('session starts at Crystal 1 with a reproducible uint32 stream and exact baseline stats', () => {
  available(logic, 'createSession');
  available(logic, 'enterDecision');
  const session = logic.createSession(0);
  assert.deepEqual({
    state: session.state,
    seed: session.seed,
    crystalIndex: session.crystalIndex,
    stage: session.stage,
    pot: session.pot,
    totalScore: session.totalScore,
    bankStreak: session.bankStreak,
    bestBankStreak: session.bestBankStreak,
    successfulBanks: session.successfulBanks,
    breaks: session.breaks,
    highestStage: session.highestStage,
    rngState: session.rngState,
  }, {
    state: 'CRYSTAL_INTRO', seed: 0, crystalIndex: 1, stage: 1, pot: 100, totalScore: 0,
    bankStreak: 0, bestBankStreak: 0, successfulBanks: 0, breaks: 0, highestStage: 1, rngState: 0,
  });
  assert.equal(logic.enterDecision(session).state, 'DECISION');
  assert.throws(() => logic.createSession(-1), RangeError);
});

test('one legal safe Grow advances one RNG word and one table Stage without ending the Crystal', () => {
  available(rng, 'nextSeededValue');
  available(logic, 'createSession');
  available(logic, 'enterDecision');
  available(logic, 'resolveGrow');
  available(logic, 'completeGrow');
  const decision = logic.enterDecision(logic.createSession(1));
  const expectedDraw = rng.nextSeededValue(decision.rngState);
  const resolving = logic.resolveGrow(decision);
  assert.equal(resolving.state, 'GROW_RESOLVING');
  assert.equal(resolving.growOutcome, 'SAFE');
  assert.equal(resolving.rngState, expectedDraw.nextState);
  assert.equal(resolving.stage, 2);
  assert.equal(resolving.pot, 180);
  assert.equal(resolving.crystalIndex, 1);
  assert.equal(resolving.highestStage, 2);
  assert.equal(logic.resolveGrow(resolving), resolving);
  const nextDecision = logic.completeGrow(resolving);
  assert.equal(nextDecision.state, 'DECISION');
  assert.equal(nextDecision.crystalIndex, 1);
  assert.equal(nextDecision.growOutcome, null);
});

test('Break commits one roll, loses only unbanked pot, resets streak, and preserves banked score', () => {
  for (const name of ['createSession', 'enterDecision', 'resolveGrow', 'completeGrow', 'resolveBank', 'completeBank', 'advanceCrystal', 'getSessionStats']) available(logic, name);
  let session = logic.createSession(0);

  session = logic.enterDecision(session);
  session = logic.resolveBank(session);
  assert.equal(session.bankAward, 100);
  assert.equal(session.totalScore, 100);
  assert.equal(session.bankStreak, 1);
  assert.equal(session.rngState, 0);
  session = logic.advanceCrystal(logic.completeBank(session));

  session = logic.enterDecision(session);
  session = logic.resolveGrow(session);
  assert.equal(session.growOutcome, 'SAFE');
  session = logic.completeGrow(session);
  session = logic.resolveBank(session);
  assert.equal(session.bankAward, 189);
  assert.equal(session.totalScore, 289);
  assert.equal(session.bankStreak, 2);
  assert.equal(session.bestBankStreak, 2);
  assert.equal(session.successfulBanks, 2);
  session = logic.advanceCrystal(logic.completeBank(session));

  session = logic.enterDecision(session);
  const beforeBreakScore = session.totalScore;
  const broken = logic.resolveGrow(session);
  assert.equal(broken.state, 'GROW_RESOLVING');
  assert.equal(broken.growOutcome, 'SHATTERED');
  assert.equal(broken.roundOutcome, 'SHATTERED');
  assert.equal(broken.pot, 0);
  assert.equal(broken.totalScore, beforeBreakScore);
  assert.equal(broken.bankStreak, 0);
  assert.equal(broken.bestBankStreak, 2);
  assert.equal(broken.breaks, 1);
  const feedback = logic.completeGrow(broken);
  assert.equal(feedback.state, 'ROUND_FEEDBACK');
  const nextCrystal = logic.advanceCrystal(feedback);
  assert.equal(nextCrystal.state, 'CRYSTAL_INTRO');
  assert.equal(nextCrystal.crystalIndex, 4);
  assert.equal(nextCrystal.stage, 1);
  assert.equal(nextCrystal.pot, 100);
  assert.equal(nextCrystal.totalScore, beforeBreakScore);
  assert.deepEqual(logic.getSessionStats(nextCrystal), {
    totalScore: 289, successfulBanks: 2, breaks: 1, highestStage: 2, bestBankStreak: 2,
  });
});

test('pre-bank streak multiplier caps at 1.20 and awards use Math.round exactly', () => {
  available(logic, 'getBankMultiplier');
  available(logic, 'calculateBankAward');
  assert.deepEqual([0, 1, 2, 3, 4, 5, 50].map(logic.getBankMultiplier), [1, 1.05, 1.1, 1.15, 1.2, 1.2, 1.2]);
  assert.deepEqual([
    logic.calculateBankAward(100, 0), logic.calculateBankAward(180, 1), logic.calculateBankAward(300, 2),
    logic.calculateBankAward(500, 3), logic.calculateBankAward(800, 4), logic.calculateBankAward(2800, 5),
  ], [100, 189, 330, 575, 960, 3360]);
  assert.equal(logic.calculateBankAward(1250, 0), 1250);
  assert.equal(logic.calculateBankAward(1250, 1), 1313);
  assert.equal(logic.calculateBankAward(1250, 4), 1500);
  assert.throws(() => logic.getBankMultiplier(-1), RangeError);
  assert.throws(() => logic.calculateBankAward(-1, 0), RangeError);
});

test('Bank commits award/stats before its presentation and consumes zero RNG words', () => {
  for (const name of ['createSession', 'enterDecision', 'resolveBank', 'completeBank', 'advanceCrystal']) available(logic, name);
  const decision = logic.enterDecision(logic.createSession(0));
  const resolving = logic.resolveBank(decision);

  assert.equal(resolving.state, 'BANK_RESOLVING');
  assert.equal(resolving.totalScore, 100);
  assert.equal(resolving.bankAward, 100);
  assert.equal(resolving.bankStreak, 1);
  assert.equal(resolving.bestBankStreak, 1);
  assert.equal(resolving.successfulBanks, 1);
  assert.equal(resolving.pot, 0);
  assert.equal(resolving.rngState, decision.rngState);
  assert.equal(logic.resolveBank(resolving), resolving);
  assert.equal(logic.completeBank(resolving).state, 'ROUND_FEEDBACK');
  const nextCrystal = logic.advanceCrystal(logic.completeBank(resolving));
  assert.equal(nextCrystal.crystalIndex, 2);
  assert.equal(nextCrystal.state, 'CRYSTAL_INTRO');
});

test('illegal Stage 8 Grow and actions outside DECISION are identity no-ops', () => {
  for (const name of ['createSession', 'enterDecision', 'resolveGrow', 'resolveBank']) available(logic, name);
  const idle = logic.createSession(0);
  assert.equal(logic.resolveGrow(idle), idle);
  assert.equal(logic.resolveBank(idle), idle);
  const stageEight = { ...logic.enterDecision(idle), stage: 8, pot: 2800 };
  assert.equal(logic.resolveGrow(stageEight), stageEight);
  assert.equal(stageEight.rngState, idle.rngState);
});

test('eight completed Crystals end at RESULT and no operation can create a ninth', () => {
  for (const name of ['createSession', 'enterDecision', 'resolveBank', 'completeBank', 'advanceCrystal']) available(logic, name);
  let session = logic.createSession(0);
  for (let crystal = 1; crystal <= 8; crystal += 1) {
    assert.equal(session.crystalIndex, crystal);
    session = logic.enterDecision(session);
    session = logic.resolveBank(session);
    session = logic.completeBank(session);
    session = logic.advanceCrystal(session);
    if (crystal < 8) {
      assert.equal(session.state, 'CRYSTAL_INTRO');
      assert.equal(session.crystalIndex, crystal + 1);
    }
  }
  assert.equal(session.state, 'RESULT');
  assert.equal(session.crystalIndex, 8);
  assert.equal(session.successfulBanks, 8);
  assert.equal(logic.advanceCrystal(session), session);
});

test('same seed and accepted-action strategy reproduce the entire pure session exactly', () => {
  for (const name of ['createSession', 'enterDecision', 'resolveGrow', 'completeGrow', 'resolveBank', 'completeBank', 'advanceCrystal']) available(logic, name);
  const play = (seed) => {
    let session = logic.createSession(seed);
    let steps = 0;
    while (session.state !== 'RESULT' && steps < 100) {
      steps += 1;
      if (session.state === 'CRYSTAL_INTRO') session = logic.enterDecision(session);
      else if (session.state === 'DECISION' && session.stage < 3) session = logic.resolveGrow(session);
      else if (session.state === 'DECISION') session = logic.resolveBank(session);
      else if (session.state === 'GROW_RESOLVING') {
        session = logic.completeGrow(session);
        if (session.state === 'ROUND_FEEDBACK') session = logic.advanceCrystal(session);
      } else if (session.state === 'BANK_RESOLVING') session = logic.advanceCrystal(logic.completeBank(session));
      else if (session.state === 'ROUND_FEEDBACK') session = logic.advanceCrystal(session);
      else assert.fail(`unexpected pure-core state ${session.state}`);
    }
    assert.equal(session.state, 'RESULT');
    return session;
  };
  assert.deepEqual(play(0), play(0));
  assert.notDeepEqual(play(0), play(1));
});

test('seeded core transactions never call ambient Math.random', () => {
  for (const name of ['createSession', 'enterDecision', 'resolveGrow', 'resolveBank']) available(logic, name);
  const originalRandom = Math.random;
  Math.random = () => { throw new Error('core transaction must not use ambient randomness'); };
  try {
    const session = logic.enterDecision(logic.createSession(0));
    assert.equal(logic.resolveGrow(session).state, 'GROW_RESOLVING');
    assert.equal(logic.resolveBank(session).state, 'BANK_RESOLVING');
  } finally {
    Math.random = originalRandom;
  }
});
