import assert from 'node:assert/strict';
import test from 'node:test';

const core = await import('../../src/games/glass-bloom/logic.ts').catch(() => ({}));

function playStrategy(seed, chooseAction) {
  let session = core.enterDecision(core.createSession(seed));
  let acceptedActions = 0;
  const finishRound = () => {
    session = core.advanceCrystal(session);
    if (session.state === 'CRYSTAL_INTRO') session = core.enterDecision(session);
  };

  while (session.state !== 'RESULT' && acceptedActions < 300) {
    const action = chooseAction(session);
    if (action === 'GROW') {
      session = core.completeGrow(core.resolveGrow(session));
      if (session.state === 'ROUND_FEEDBACK') finishRound();
    } else {
      session = core.completeBank(core.resolveBank(session));
      finishRound();
    }
    acceptedActions += 1;
  }
  assert.equal(session.state, 'RESULT', 'the strategy completes, but never creates a ninth Crystal');
  assert.equal(session.crystalIndex, 8);
  assert.equal(core.advanceCrystal(session), session, 'RESULT cannot advance a second time');
  return {
    session,
    stats: {
      totalScore: session.totalScore,
      successfulBanks: session.successfulBanks,
      breaks: session.breaks,
      highestStage: session.highestStage,
      bestBankStreak: session.bestBankStreak,
    },
  };
}

test('immediate Banks finish Crystal 8 with exact score and the streak bonus cap', () => {
  const { stats } = playStrategy(1, () => 'BANK');
  assert.deepEqual(stats, {
    totalScore: 910,
    successfulBanks: 8,
    breaks: 0,
    highestStage: 1,
    bestBankStreak: 8,
  });
});

test('early Grow strategy safely raises each Crystal once before Bank with exact bonuses', () => {
  const { stats } = playStrategy(21, (session) => session.stage === 1 ? 'GROW' : 'BANK');
  assert.deepEqual(stats, {
    totalScore: 1638,
    successfulBanks: 8,
    breaks: 0,
    highestStage: 2,
    bestBankStreak: 8,
  });
});

test('repeated Breaks discard only unbanked pots and reset the streak', () => {
  const { stats } = playStrategy(0, (session) => session.stage < 8 ? 'GROW' : 'BANK');
  assert.deepEqual(stats, {
    totalScore: 0,
    successfulBanks: 0,
    breaks: 8,
    highestStage: 7,
    bestBankStreak: 0,
  });
});

test('mixed Bank then Break preserves secured score and resets the active streak', () => {
  const { stats } = playStrategy(0, (session) => session.crystalIndex === 1 ? 'BANK' : session.crystalIndex === 2 && session.stage < 8 ? 'GROW' : 'BANK');
  assert.deepEqual(stats, {
    totalScore: 770,
    successfulBanks: 7,
    breaks: 1,
    highestStage: 2,
    bestBankStreak: 6,
  });
});

test('Stage 8 is reachable, bankable, and completes the eighth Crystal without Grow', () => {
  const { session, stats } = playStrategy(21, (snapshot) => snapshot.crystalIndex === 1 && snapshot.stage < 8 ? 'GROW' : 'BANK');
  assert.deepEqual(stats, {
    totalScore: 3610,
    successfulBanks: 8,
    breaks: 0,
    highestStage: 8,
    bestBankStreak: 8,
  });
  assert.equal(session.highestStage, 8);
});

test('Crystal 8 Break after seven Banks still reaches RESULT once with the banked total intact', () => {
  const { stats } = playStrategy(0, (session) => session.crystalIndex === 8 && session.stage < 8 ? 'GROW' : 'BANK');
  assert.deepEqual(stats, {
    totalScore: 790,
    successfulBanks: 7,
    breaks: 1,
    highestStage: 2,
    bestBankStreak: 7,
  });
});
