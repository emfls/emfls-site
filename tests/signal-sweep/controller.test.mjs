import assert from 'node:assert/strict';
import test from 'node:test';
import { FakeClock } from './fake-clock.mjs';

const controller = await import('../../src/games/signal-sweep/controller.ts').catch(() => ({}));
const generator = await import('../../src/games/signal-sweep/generator.ts').catch(() => ({}));
const available = (name) => assert.equal(typeof controller[name], 'function', `${name} must be exported`);

function fixture() {
  const clock = new FakeClock();
  const plan = generator.generateSessionPlan(0x13572468);
  let seeds = 0;
  const session = controller.createSignalSweepSession({
    clock,
    timeOrigin: 1_800_000_000_000,
    getSeed: () => { seeds += 1; return plan.seed; },
    createPlan: () => plan,
  });
  return { clock, plan, session, get seeds() { return seeds; } };
}

test('Start is one-shot, preview locks tiles, then the first board becomes active', () => {
  available('createSignalSweepSession');
  const { clock, plan, session } = fixture();
  assert.equal(session.getSnapshot().state, 'IDLE');
  assert.equal(session.start(), true);
  assert.equal(session.start(), false);
  assert.equal(session.getSnapshot().state, 'RULE_PREVIEW');
  assert.equal(session.activateSymbol(plan.rounds[0].targetIds[0], 10), false);
  clock.advance(899);
  assert.equal(session.getSnapshot().state, 'RULE_PREVIEW');
  clock.advance(1);
  const active = session.getSnapshot();
  assert.equal(active.state, 'ACTIVE');
  assert.equal(active.roundNumber, 1);
  assert.equal(active.symbols.length, 12);
});

test('correct targets select once and distinct distractor clicks count without ending the round', () => {
  available('createSignalSweepSession');
  const { clock, plan, session } = fixture();
  session.start();
  clock.advance(900);
  const round = plan.rounds[0];
  const targetId = round.targetIds[0];
  const distractorId = round.symbols.find(({ id }) => !round.targetIds.includes(id)).id;
  assert.equal(session.activateSymbol(targetId, clock.now() + 1), true);
  assert.equal(session.activateSymbol(targetId, clock.now() + 2), false);
  assert.deepEqual(session.getSnapshot().selectedIds, [targetId]);
  assert.equal(session.getSnapshot().correctSelections, 1);
  assert.equal(session.activateSymbol(distractorId, clock.now() + 3), true);
  assert.equal(session.activateSymbol(distractorId, clock.now() + 4), true);
  assert.equal(session.getSnapshot().mistakes, 2);
  assert.equal(session.getSnapshot().state, 'ACTIVE');
});

test('active timer updates, final pre-deadline input wins, and exact-boundary input loses', () => {
  available('createSignalSweepSession');
  const { clock, plan, session } = fixture();
  session.start();
  clock.advance(900);
  clock.advance(800);
  assert.equal(session.getSnapshot().remainingMs, 7200);
  const [first, ...rest] = plan.rounds[0].targetIds;
  for (const id of rest) session.activateSymbol(id, clock.now() + 1);
  assert.equal(session.getSnapshot().state, 'ACTIVE');
  assert.equal(session.activateSymbol(first, 900 + 8000 - 1), true);
  assert.equal(session.getSnapshot().state, 'ROUND_FEEDBACK');
  assert.equal(session.getSnapshot().outcome, 'CLEAR');

  const next = fixture();
  next.session.start();
  next.clock.advance(900);
  next.clock.advance(8000);
  const [boundaryTarget] = next.plan.rounds[0].targetIds;
  assert.equal(next.session.getSnapshot().state, 'ROUND_FEEDBACK');
  assert.equal(next.session.getSnapshot().outcome, 'TIMEOUT');
  assert.equal(next.session.activateSymbol(boundaryTarget, next.clock.now()), false);
});

test('pause during preview and active excludes hidden time and preserves board and selection', () => {
  available('createSignalSweepSession');
  const { clock, plan, session } = fixture();
  session.start();
  clock.advance(300);
  assert.equal(session.pause('visibility'), true);
  assert.equal(session.getSnapshot().state, 'PAUSED');
  clock.advance(5000);
  assert.equal(session.getSnapshot().state, 'PAUSED');
  assert.equal(session.resume(), true);
  clock.advance(599);
  assert.equal(session.getSnapshot().state, 'RULE_PREVIEW');
  clock.advance(1);
  assert.equal(session.getSnapshot().state, 'ACTIVE');

  const id = plan.rounds[0].targetIds[0];
  session.activateSymbol(id, clock.now() + 1);
  const beforePause = session.getSnapshot();
  const pausedAt = clock.now();
  clock.advance(1400);
  assert.equal(session.pause('orientation'), true);
  const remaining = Math.max(0, beforePause.remainingMs - 1400);
  assert.equal(session.getSnapshot().remainingMs, remaining);
  clock.advance(7000);
  assert.equal(session.getSnapshot().remainingMs, remaining);
  assert.equal(session.resume(), true);
  clock.advance(600);
  const resumed = session.getSnapshot();
  assert.equal(resumed.state, 'ACTIVE');
  assert.deepEqual(resumed.symbols, beforePause.symbols);
  assert.deepEqual(resumed.selectedIds, beforePause.selectedIds);
  assert.equal(resumed.remainingMs, remaining);
  assert.ok(clock.now() >= pausedAt + 9000);
});

test('feedback pause resumes its remaining presentation time and advances exactly once', () => {
  available('createSignalSweepSession');
  const { clock, plan, session } = fixture();
  session.start();
  clock.advance(900);
  for (const id of plan.rounds[0].targetIds) session.activateSymbol(id, clock.now() + 1);
  assert.equal(session.getSnapshot().state, 'ROUND_FEEDBACK');
  clock.advance(200);
  assert.equal(session.pause('manual'), true);
  clock.advance(5000);
  assert.equal(session.resume(), true);
  assert.equal(session.getSnapshot().state, 'ROUND_FEEDBACK');
  clock.advance(249);
  assert.equal(session.getSnapshot().roundNumber, 1);
  clock.advance(1);
  assert.equal(session.getSnapshot().roundNumber, 2);
  assert.equal(session.getSnapshot().state, 'RULE_PREVIEW');
});

test('cleanup cancels pending work and cannot create stale round transitions', () => {
  available('createSignalSweepSession');
  const { clock, session } = fixture();
  session.start();
  assert.equal(session.destroy(), undefined);
  clock.advance(10000);
  assert.equal(session.getSnapshot().state, 'RULE_PREVIEW');
  assert.equal(session.start(), false);
  assert.equal(session.resume(), false);
});

test('orientation and hidden-document lifecycle events pause without implicit visibility resume', () => {
  available('bindSignalSweepLifecycle');
  const { clock, session } = fixture();
  session.start();
  clock.advance(900);
  class VisibilityDocument extends EventTarget {
    visibilityState = 'visible';
  }
  const document = new VisibilityDocument();
  const window = new EventTarget();
  const unbind = controller.bindSignalSweepLifecycle(session, { document, window });
  window.dispatchEvent(new Event('orientationchange'));
  assert.equal(session.getSnapshot().state, 'PAUSED');
  assert.equal(session.getSnapshot().pauseReason, 'orientation');
  session.resume();
  clock.advance(600);
  assert.equal(session.getSnapshot().state, 'ACTIVE');
  document.visibilityState = 'hidden';
  document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(session.getSnapshot().state, 'PAUSED');
  document.visibilityState = 'visible';
  document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(session.getSnapshot().state, 'PAUSED');
  window.dispatchEvent(new Event('pagehide'));
  assert.equal(session.resume(), false);
  unbind();
});
