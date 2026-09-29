import assert from 'node:assert/strict';
import test from 'node:test';
import { FakeClock } from './fake-clock.mjs';

const timerModule = await import('../../src/games/signal-sweep/timer.ts').catch(() => ({}));
const available = (name) => assert.equal(typeof timerModule[name], 'function', `${name} must be exported`);

test('deadline timer emits bounded 100ms remaining-time updates and one logical deadline', () => {
  available('createDeadlineTimer');
  const clock = new FakeClock();
  const updates = [];
  let deadlines = 0;
  const timer = timerModule.createDeadlineTimer({
    clock,
    deadline: 250,
    onUpdate: (remaining) => updates.push(remaining),
    onDeadline: () => { deadlines += 1; },
  });
  assert.equal(updates[0], 250);
  clock.advance(249);
  assert.equal(deadlines, 0);
  assert.equal(timer.getRemaining(), 1);
  clock.advance(1);
  assert.equal(deadlines, 1);
  assert.deepEqual(updates, [250, 150, 50, 0]);
  clock.advance(500);
  assert.equal(deadlines, 1);
});

test('cancelling a deadline timer prevents stale updates and deadline callbacks', () => {
  available('createDeadlineTimer');
  const clock = new FakeClock();
  let updates = 0;
  let deadlines = 0;
  const timer = timerModule.createDeadlineTimer({
    clock,
    deadline: 1000,
    onUpdate: () => { updates += 1; },
    onDeadline: () => { deadlines += 1; },
  });
  timer.cancel();
  clock.advance(2000);
  assert.equal(updates, 1);
  assert.equal(deadlines, 0);
  assert.equal(clock.tasks.size, 0);
});
