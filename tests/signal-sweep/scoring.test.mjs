import assert from 'node:assert/strict';
import test from 'node:test';

const load = async () => import('../../src/games/signal-sweep/scoring.ts').catch(() => ({}));
const scoring = await load();
const available = (name) => assert.equal(typeof scoring[name], 'function', `${name} must be exported`);

test('target points, mistake penalty, and zero floor are exact', () => {
  available('awardCorrectTarget');
  available('applyMistakePenalty');
  assert.equal(scoring.awardCorrectTarget(0), 100);
  assert.equal(scoring.awardCorrectTarget(250), 350);
  assert.equal(scoring.applyMistakePenalty(500), 450);
  assert.equal(scoring.applyMistakePenalty(30), 0);
  assert.equal(scoring.applyMistakePenalty(0), 0);
});

test('clear bonus multiplier bands are captured from the starting streak only', () => {
  available('multiplierForStreak');
  available('calculateClearBonus');
  assert.equal(scoring.multiplierForStreak(0), 1);
  assert.equal(scoring.multiplierForStreak(1), 1);
  assert.equal(scoring.multiplierForStreak(2), 1.1);
  assert.equal(scoring.multiplierForStreak(3), 1.1);
  assert.equal(scoring.multiplierForStreak(4), 1.2);
  assert.equal(scoring.multiplierForStreak(5), 1.2);
  assert.equal(scoring.multiplierForStreak(6), 1.3);
  assert.equal(scoring.multiplierForStreak(100), 1.3);
  assert.deepEqual(scoring.calculateClearBonus(3), { multiplier: 1.1, points: 220 });
});

test('remaining-time bonus uses 100ms floors, caps at 160, and belongs only to CLEAR', () => {
  available('calculateTimeBonus');
  available('calculateRoundBonuses');
  assert.equal(scoring.calculateTimeBonus(8000), 160);
  assert.equal(scoring.calculateTimeBonus(7999), 158);
  assert.equal(scoring.calculateTimeBonus(99), 0);
  assert.equal(scoring.calculateTimeBonus(-10), 0);
  assert.deepEqual(scoring.calculateRoundBonuses('CLEAR', 550, 2), { clearBonus: 220, timeBonus: 10, totalBonus: 230 });
  assert.deepEqual(scoring.calculateRoundBonuses('TIMEOUT', 8000, 6), { clearBonus: 0, timeBonus: 0, totalBonus: 0 });
});

test('clean streak and accuracy semantics handle mistakes, timeout, and zero denominator', () => {
  available('streakAfterRound');
  available('isCleanRound');
  available('countCleanRounds');
  available('roundAccuracy');
  available('averageAccuracy');
  available('formatAccuracy');
  assert.equal(scoring.streakAfterRound(2, 'CLEAR', 0), 3);
  assert.equal(scoring.streakAfterRound(2, 'CLEAR', 1), 0);
  assert.equal(scoring.streakAfterRound(5, 'TIMEOUT', 0), 0);
  assert.equal(scoring.isCleanRound('CLEAR', 0), true);
  assert.equal(scoring.isCleanRound('CLEAR', 1), false);
  assert.equal(scoring.countCleanRounds([
    { outcome: 'CLEAR', mistakes: 0 }, { outcome: 'CLEAR', mistakes: 1 }, { outcome: 'TIMEOUT', mistakes: 0 },
  ]), 1);
  assert.equal(scoring.roundAccuracy(0, 0), 0);
  assert.equal(scoring.roundAccuracy(2, 1), 2 / 3);
  const average = scoring.averageAccuracy([1, 0, ...Array(13).fill(0.5)]);
  assert.equal(average, (1 + 13 * 0.5) / 15);
  assert.equal(scoring.formatAccuracy(average), `${Math.round(average * 100)}%`);
});
