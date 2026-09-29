import assert from 'node:assert/strict';
import test from 'node:test';

const load = async (path) => import(new URL(path, import.meta.url)).catch(() => ({}));
const controllerApi = await load('../../src/games/twin-ledger/controller.ts');
const sequenceApi = await load('../../src/games/twin-ledger/sequence.ts');
const available = (module, name) => assert.equal(typeof module[name], 'function', `${name} must be exported`);

const makeSession = (turn = 0, sequence = sequenceApi.FALLBACK_SEQUENCE, overrides = {}) => ({
  state: 'TURN',
  seed: 1,
  sequence,
  turn,
  leftTotal: 0,
  rightTotal: 0,
  difference: 0,
  zone: 'EXACT',
  combo: 0,
  maxCombo: 0,
  breachCount: 0,
  exactCount: 0,
  score: 0,
  finalScore: null,
  currentTile: sequence[turn] ?? null,
  nextTile: sequence[turn + 1] ?? null,
  lastPlacement: null,
  recentHistory: [],
  result: null,
  best: { bestScore: 0, bestMaxCombo: 0 },
  ...overrides,
});

test('a placement commits one signed value, consumes one tile, and advances the preview', () => {
  available(controllerApi, 'commitPlacement');
  const next = controllerApi.commitPlacement(makeSession(), 'RIGHT');
  assert.equal(next.state, 'RESOLVING');
  assert.equal(next.turn, 1);
  assert.equal(next.leftTotal, 0);
  assert.equal(next.rightTotal, 1);
  assert.equal(next.difference, 1);
  assert.equal(next.zone, 'STABLE');
  assert.equal(next.lastPlacement.turn, 1);
  assert.equal(next.lastPlacement.side, 'RIGHT');
  assert.equal(next.lastPlacement.effectiveValue, 1);
  assert.equal(next.currentTile.id, sequenceApi.FALLBACK_SEQUENCE[1].id);
  assert.equal(next.nextTile.id, sequenceApi.FALLBACK_SEQUENCE[2].id);
  assert.equal(next.recentHistory.length, 1);
  assert.equal(next.score, 90);
  assert.equal(next.lastPlacement.turnScore, 90);
  assert.equal(next.combo, 1);
});

test('negative and HEAVY tiles use signed weighted values in the placement transaction', () => {
  available(controllerApi, 'commitPlacement');
  const negative = controllerApi.commitPlacement(makeSession(6), 'LEFT');
  assert.equal(negative.lastPlacement.tile.baseValue, -2);
  assert.equal(negative.leftTotal, -2);
  assert.equal(negative.difference, 2);

  const heavy = controllerApi.commitPlacement(makeSession(13), 'RIGHT');
  assert.equal(heavy.lastPlacement.tile.weight, 2);
  assert.equal(heavy.lastPlacement.effectiveValue, 4);
  assert.equal(heavy.rightTotal, 4);
  assert.equal(heavy.difference, 4);
});

test('a locked or completed session cannot commit again or create turn 19', () => {
  available(controllerApi, 'commitPlacement');
  const committed = controllerApi.commitPlacement(makeSession(), 'LEFT');
  assert.equal(controllerApi.commitPlacement(committed, 'RIGHT'), null);

  const lastTurn = controllerApi.commitPlacement(makeSession(17), 'RIGHT');
  assert.equal(lastTurn.turn, 18);
  assert.equal(lastTurn.currentTile, null);
  assert.equal(lastTurn.nextTile, null);
  assert.equal(controllerApi.commitPlacement(lastTurn, 'LEFT'), null);
});

test('recent placement history stays capped at four entries', () => {
  available(controllerApi, 'commitPlacement');
  let session = makeSession();
  for (let index = 0; index < 7; index += 1) {
    session = controllerApi.commitPlacement(session, index % 2 ? 'RIGHT' : 'LEFT');
    if (index < 6) session = { ...session, state: 'TURN' };
  }
  assert.equal(session.recentHistory.length, 4);
  assert.deepEqual(session.recentHistory.map(({ turn }) => turn), [4, 5, 6, 7]);
});

test('pause and resume preserve TURN state and snap committed phases to the next turn', () => {
  available(controllerApi, 'pauseSession');
  available(controllerApi, 'resumeSession');

  const turnState = makeSession(3);
  const pausedTurn = controllerApi.pauseSession(turnState);
  assert.equal(pausedTurn.state, 'PAUSED');
  assert.equal(pausedTurn.turn, 3);
  assert.equal(pausedTurn.currentTile.id, turnState.currentTile.id);
  assert.equal(controllerApi.pauseSession(pausedTurn), pausedTurn);
  const resumedTurn = controllerApi.resumeSession(pausedTurn);
  assert.equal(resumedTurn.state, 'TURN');
  assert.equal(resumedTurn.turn, 3);

  for (const phase of ['RESOLVING', 'FEEDBACK']) {
    const committed = controllerApi.commitPlacement(makeSession(6), 'LEFT');
    const activePhase = { ...committed, state: phase };
    const resumed = controllerApi.resumeSession(controllerApi.pauseSession(activePhase));
    assert.equal(resumed.state, 'TURN');
    assert.equal(resumed.turn, 7, `${phase} must not repeat its committed placement`);
    assert.equal(resumed.leftTotal, committed.leftTotal);
    assert.equal(resumed.currentTile.id, sequenceApi.FALLBACK_SEQUENCE[7].id);
    assert.equal(controllerApi.commitPlacement(resumed, 'RIGHT').turn, 8);
  }

  const finalCommitted = controllerApi.commitPlacement(makeSession(17), 'RIGHT');
  const finalResume = controllerApi.resumeSession(controllerApi.pauseSession(finalCommitted));
  assert.equal(finalResume.state, 'RESULT');
  assert.equal(finalResume.turn, 18);
  assert.equal(finalResume.currentTile, null);
  assert.equal(finalResume.nextTile, null);
  assert.equal(controllerApi.commitPlacement(finalResume, 'LEFT'), null);
  assert.equal(controllerApi.resumeSession(makeSession()), null);
});

test('exact scoring and combo update are part of the single committed placement', () => {
  available(controllerApi, 'commitPlacement');
  const session = makeSession(0, sequenceApi.FALLBACK_SEQUENCE, { leftTotal: 1 });
  const exact = controllerApi.commitPlacement(session, 'RIGHT');
  assert.equal(exact.zone, 'EXACT');
  assert.equal(exact.difference, 0);
  assert.equal(exact.combo, 1);
  assert.equal(exact.maxCombo, 1);
  assert.equal(exact.exactCount, 1);
  assert.equal(exact.score, 120);
  assert.equal(exact.lastPlacement.turnScore, 120);
  assert.equal(exact.lastPlacement.comboAfter, 1);
  assert.equal(controllerApi.commitPlacement(exact, 'LEFT'), null);
});

test('a Breach scores zero but remains in the match for the following turn', () => {
  available(controllerApi, 'commitPlacement');
  const breached = controllerApi.commitPlacement(makeSession(12, sequenceApi.FALLBACK_SEQUENCE, {
    leftTotal: 10,
    score: 25,
  }), 'LEFT');
  assert.equal(breached.zone, 'BREACH');
  assert.equal(breached.state, 'RESOLVING');
  assert.equal(breached.turn, 13);
  assert.equal(breached.score, 25);
  assert.equal(breached.breachCount, 1);
  assert.equal(breached.currentTile.id, sequenceApi.FALLBACK_SEQUENCE[13].id);
  assert.equal(breached.result, null);
  assert.equal(controllerApi.commitPlacement({ ...breached, state: 'TURN' }, 'RIGHT').turn, 14);
});

test('turn 18 calculates both bonuses once and updates best fields independently', () => {
  available(controllerApi, 'commitPlacement');
  const finalTurn = makeSession(17, sequenceApi.FALLBACK_SEQUENCE, {
    score: 410,
    combo: 1,
    maxCombo: 4,
    exactCount: 2,
    breachCount: 1,
    best: { bestScore: 900, bestMaxCombo: 1 },
  });
  const completed = controllerApi.commitPlacement(finalTurn, 'RIGHT');
  assert.equal(completed.state, 'RESOLVING');
  assert.equal(completed.turn, 18);
  assert.equal(completed.zone, 'DANGER');
  assert.equal(completed.score, 430);
  assert.equal(completed.lastPlacement.turnScore, 20);
  assert.equal(completed.breachCount, 1);
  assert.equal(completed.finalScore, 680);
  assert.deepEqual(completed.result, {
    score: 680,
    finalDifference: 5,
    exactCount: 2,
    breachCount: 1,
    maxCombo: 4,
    bestScore: 900,
  });
  assert.deepEqual(completed.best, { bestScore: 900, bestMaxCombo: 4 });
  assert.equal(controllerApi.commitPlacement(completed, 'LEFT'), null);
});
