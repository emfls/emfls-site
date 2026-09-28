import assert from 'node:assert/strict';
import test from 'node:test';
import { FakeClock } from './fake-clock.mjs';

const controller = await import('../../src/games/signal-sweep/controller.ts').catch(() => ({}));
const generator = await import('../../src/games/signal-sweep/generator.ts').catch(() => ({}));
const { tierForRound } = await import('../../src/games/signal-sweep/constants.ts');
const available = (name) => assert.equal(typeof controller[name], 'function', `${name} must be exported`);

function fixture({ writeFails = false, initialStats = { bestScore: 0, bestCleanRounds: 0 } } = {}) {
  const clock = new FakeClock();
  const seeds = [0x10203040, 0x50607080];
  const plans = new Map(seeds.map((seed) => [seed, generator.generateSessionPlan(seed)]));
  const stored = { ...initialStats };
  let saves = 0;
  let seedIndex = 0;
  const session = controller.createSignalSweepSession({
    clock,
    timeOrigin: 1_800_000_000_000,
    getSeed: () => seeds[seedIndex++],
    createPlan: (seed) => plans.get(seed),
    getStorage: () => ({
      getItem: () => JSON.stringify(stored),
      setItem: (_key, value) => {
        saves += 1;
        if (writeFails) throw new Error('write denied');
        Object.assign(stored, JSON.parse(value));
      },
    }),
  });
  return { clock, plans, seeds, session, stored, get saves() { return saves; }, get seedIndex() { return seedIndex; } };
}

function enterActive(clock) {
  clock.advance(900);
}

function clearCurrentRound(clock, session, round) {
  for (const id of round.targetIds) assert.equal(session.activateSymbol(id, clock.now() + 1), true);
  assert.equal(session.getSnapshot().state, 'ROUND_FEEDBACK');
  assert.equal(session.getSnapshot().outcome, 'CLEAR');
}

test('correct targets and mistakes score synchronously once; CLEAR awards streak and remaining-time bonuses once', () => {
  available('createSignalSweepSession');
  const { clock, plans, session } = fixture();
  session.start();
  enterActive(clock);
  const round = plans.get(0x10203040).rounds[0];
  const wrong = round.symbols.find(({ id }) => !round.targetIds.includes(id)).id;
  const first = round.targetIds[0];

  assert.equal(session.activateSymbol(first, clock.now() + 1), true);
  assert.equal(session.getSnapshot().score, 100);
  assert.equal(session.activateSymbol(wrong, clock.now() + 2), true);
  assert.equal(session.getSnapshot().score, 50);
  assert.equal(session.getSnapshot().mistakes, 1);
  assert.equal(session.activateSymbol(first, clock.now() + 3), false);
  assert.equal(session.getSnapshot().score, 50);

  for (const id of round.targetIds.slice(1)) assert.equal(session.activateSymbol(id, clock.now() + 4), true);
  const expected = round.targetIds.length * 100 - 50 + 200 + 158;
  assert.equal(session.getSnapshot().state, 'ROUND_FEEDBACK');
  assert.equal(session.getSnapshot().score, expected);
  assert.equal(session.getSnapshot().correctTargets, round.targetIds.length);
  assert.equal(session.getSnapshot().totalMistakes, 1);
  clock.advance(1000);
  assert.equal(session.getSnapshot().score, expected);
});

test('timeout has no missing-target penalty; round 15 reaches exact result, persists bests once, and rematch resets', () => {
  available('createSignalSweepSession');
  const fixtureState = fixture();
  const { clock, plans, seeds, session, stored } = fixtureState;
  assert.equal(session.start(), true);
  assert.equal(session.start(), false);
  const firstPlan = plans.get(seeds[0]);

  enterActive(clock);
  const firstRound = firstPlan.rounds[0];
  const firstWrong = firstRound.symbols.find(({ id }) => !firstRound.targetIds.includes(id)).id;
  session.activateSymbol(firstWrong, clock.now() + 1);
  clearCurrentRound(clock, session, firstRound);
  const scoreAfterMistakenClear = session.getSnapshot().score;
  clock.advance(450);

  enterActive(clock);
  clock.advance(8_000);
  assert.equal(session.getSnapshot().outcome, 'TIMEOUT');
  assert.equal(session.getSnapshot().score, scoreAfterMistakenClear);
  clock.advance(450);

  for (let roundIndex = 2; roundIndex < 15; roundIndex += 1) {
    enterActive(clock);
    clearCurrentRound(clock, session, firstPlan.rounds[roundIndex]);
    clock.advance(450);
  }

  assert.equal(session.getSnapshot().state, 'RESULT');
  assert.deepEqual(session.getSnapshot().result, {
    score: session.getSnapshot().score,
    correctTargets: firstRound.targetIds.length + firstPlan.rounds.slice(2).reduce((sum, round) => sum + round.targetIds.length, 0),
    mistakes: 1,
    cleanRounds: 13,
    averageAccuracy: `${Math.round((((firstRound.targetIds.length / (firstRound.targetIds.length + 1)) + 13) / 15) * 100)}%`,
    bestScore: session.getSnapshot().score,
  });
  assert.deepEqual(stored, { bestScore: session.getSnapshot().score, bestCleanRounds: 13 });
  assert.equal(fixtureState.saves, 1);
  assert.equal(session.getSnapshot().bestCleanRounds, 13);
  assert.equal(session.getSnapshot().bestScore, session.getSnapshot().score);

  const completedScore = session.getSnapshot().score;
  assert.equal(session.playAgain(), true);
  assert.equal(session.getSnapshot().state, 'RULE_PREVIEW');
  assert.equal(session.getSnapshot().roundNumber, 1);
  assert.equal(session.getSnapshot().score, 0);
  assert.equal(session.getSnapshot().correctTargets, 0);
  assert.equal(session.getSnapshot().totalMistakes, 0);
  assert.equal(session.getSnapshot().bestScore, completedScore);
  assert.equal(session.getSnapshot().bestCleanRounds, 13);
  assert.equal(session.playAgain(), false);
});

test('a storage write failure cannot block RESULT or discard in-memory bests', () => {
  const fixtureState = fixture({ writeFails: true, initialStats: { bestScore: 10, bestCleanRounds: 15 } });
  const { clock, plans, seeds, session, stored } = fixtureState;
  assert.equal(session.start(), true);
  const plan = plans.get(seeds[0]);
  const cleanBonusByRoundStartStreak = [200, 200, 220, 220, 240, 240, 260, 260, 260, 260, 260, 260, 260, 260, 260];
  let expectedScore = 0;
  for (const [index, round] of plan.rounds.entries()) {
    enterActive(clock);
    clearCurrentRound(clock, session, round);
    const durationMs = tierForRound(round.roundNumber).timeMs;
    const timeBonus = Math.min(160, Math.floor((durationMs - 1) / 100) * 2);
    expectedScore += round.targetIds.length * 100 + cleanBonusByRoundStartStreak[index] + timeBonus;
    assert.equal(session.getSnapshot().score, expectedScore, `round ${round.roundNumber} applies its captured streak and time bonuses once`);
    clock.advance(450);
  }
  assert.equal(session.getSnapshot().state, 'RESULT');
  assert.equal(session.getSnapshot().bestScore, session.getSnapshot().score);
  assert.equal(session.getSnapshot().bestCleanRounds, 15);
  assert.deepEqual(stored, { bestScore: 10, bestCleanRounds: 15 });
  assert.equal(fixtureState.saves, 1);
});
