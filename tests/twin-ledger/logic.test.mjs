import assert from 'node:assert/strict';
import test from 'node:test';

const load = async (path) => import(new URL(path, import.meta.url)).catch(() => ({}));
const constants = await load('../../src/games/twin-ledger/constants.ts');
const logic = await load('../../src/games/twin-ledger/logic.ts');
const sequenceApi = await load('../../src/games/twin-ledger/sequence.ts');
const available = (module, name) => assert.equal(typeof module[name], 'function', `${name} must be exported`);
const tile = (baseValue, weight, turn) => ({ id: `tl-${String(turn).padStart(2, '0')}`, baseValue, weight });

test('phase boundaries expose the exact pools and hard limits', () => {
  available(constants, 'phaseForTurn');
  const cases = [
    [1, 'LEARN', 8, [1, 2, 3, 4]], [6, 'LEARN', 8, [1, 2, 3, 4]],
    [7, 'PLAN', 7, [2, 3, 4, 5, -2, -3]], [12, 'PLAN', 7, [2, 3, 4, 5, -2, -3]],
    [13, 'PRESSURE', 6, [2, 3, 4, 5, 6, -2, -3, -4]],
    [18, 'PRESSURE', 6, [2, 3, 4, 5, 6, -2, -3, -4]],
  ];
  for (const [turn, name, hardLimit, pool] of cases) {
    const phase = constants.phaseForTurn(turn);
    assert.equal(phase.name, name);
    assert.equal(phase.hardLimit, hardLimit);
    assert.deepEqual([...phase.pool], pool);
  }
  assert.throws(() => constants.phaseForTurn(0), RangeError);
  assert.throws(() => constants.phaseForTurn(19), RangeError);
});

test('tile validation permits signed normal and legal HEAVY tiles only', () => {
  available(sequenceApi, 'validateTileForTurn');
  available(logic, 'getEffectiveValue');
  assert.equal(sequenceApi.validateTileForTurn(tile(3, 1, 1), 1).valid, true);
  assert.equal(sequenceApi.validateTileForTurn(tile(-3, 1, 8), 8).valid, true);
  assert.equal(sequenceApi.validateTileForTurn(tile(3, 2, 14), 14).valid, true);
  assert.equal(logic.getEffectiveValue(tile(3, 2, 14)), 6);
  assert.equal(logic.getEffectiveValue(tile(-3, 1, 8)), -3);
  assert.equal(sequenceApi.validateTileForTurn(tile(3, 3, 1), 1).valid, false);
  assert.equal(sequenceApi.validateTileForTurn(tile(-2, 2, 14), 14).valid, false);
  assert.equal(sequenceApi.validateTileForTurn(tile(2, 2, 13), 13).valid, false);
  assert.equal(sequenceApi.validateTileForTurn(tile(4, 2, 14), 14).valid, false);
});

test('balance zones cover every inclusive boundary in each phase', () => {
  available(logic, 'getBalanceZone');
  const cases = [
    [1, 0, 'EXACT'], [1, 1, 'STABLE'], [1, 2, 'STABLE'], [1, 3, 'TENSE'], [1, 4, 'TENSE'], [1, 5, 'DANGER'], [1, 8, 'DANGER'], [1, 9, 'BREACH'],
    [7, 4, 'TENSE'], [7, 5, 'DANGER'], [7, 7, 'DANGER'], [7, 8, 'BREACH'],
    [13, 4, 'TENSE'], [13, 5, 'DANGER'], [13, 6, 'DANGER'], [13, 7, 'BREACH'],
  ];
  for (const [turn, difference, expected] of cases) assert.equal(logic.getBalanceZone(difference, turn), expected);
});

test('base scores, combo bands, cap, and same-turn updated-combo multiplier are exact', () => {
  available(logic, 'getComboMultiplier');
  available(logic, 'calculateTurnScore');
  available(logic, 'resolvePlacement');
  assert.deepEqual(logic.BASE_POINTS, { EXACT: 120, STABLE: 90, TENSE: 55, DANGER: 20, BREACH: 0 });
  for (const [combo, expected] of [[0, 1], [1, 1], [2, 1.1], [3, 1.1], [4, 1.2], [5, 1.2], [6, 1.3], [7, 1.3], [8, 1.4], [9, 1.4], [10, 1.5], [99, 1.5]]) {
    assert.equal(logic.getComboMultiplier(combo), expected);
  }
  assert.equal(logic.calculateTurnScore('TENSE', 2), 61);
  const exact = logic.resolvePlacement({
    leftTotal: 3, rightTotal: 0, side: 'RIGHT', tile: tile(3, 1, 1), turn: 1,
    combo: 1, maxCombo: 1, exactCount: 0, breachCount: 0, turnPoints: 0,
  });
  assert.equal(exact.zone, 'EXACT');
  assert.equal(exact.combo, 2);
  assert.equal(exact.turnScore, 132);
  assert.equal(exact.exactCount, 1);
  assert.equal(exact.maxCombo, 2);
  const reset = logic.resolvePlacement({
    leftTotal: 0, rightTotal: 0, side: 'LEFT', tile: tile(3, 1, 1), turn: 1,
    combo: 3, maxCombo: 3, exactCount: 1, breachCount: 0, turnPoints: 200,
  });
  assert.equal(reset.zone, 'TENSE');
  assert.equal(reset.combo, 0);
  assert.equal(reset.maxCombo, 3);
  assert.equal(reset.turnScore, 55);
  assert.equal(reset.turnPoints, 255);
  const breach = logic.resolvePlacement({
    leftTotal: 0, rightTotal: 0, side: 'LEFT', tile: tile(9, 1, 1), turn: 1,
    combo: 2, maxCombo: 2, exactCount: 0, breachCount: 0, turnPoints: 55,
  });
  assert.equal(breach.zone, 'BREACH');
  assert.equal(breach.turnScore, 0);
  assert.equal(breach.breachCount, 1);
  assert.equal(breach.combo, 0);
});

test('final bonuses are combined once by a pure score calculation', () => {
  available(logic, 'calculateFinalScore');
  assert.deepEqual(logic.calculateFinalScore(1000, 0, 0), {
    turnPoints: 1000, breachBonus: 500, differenceBonus: 300, score: 1800,
  });
  assert.deepEqual(logic.calculateFinalScore(1000, 1, 2), {
    turnPoints: 1000, breachBonus: 250, differenceBonus: 150, score: 1400,
  });
  assert.equal(logic.calculateFinalScore(1000, 2, 3).score, 1100);
  assert.equal(logic.calculateFinalScore(1000, 3, 9).score, 1000);
  assert.deepEqual(logic.calculateFinalScore(1000, 1, 2), logic.calculateFinalScore(1000, 1, 2));
});
