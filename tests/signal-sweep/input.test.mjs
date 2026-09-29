import assert from 'node:assert/strict';
import test from 'node:test';

const input = await import('../../src/games/signal-sweep/input.ts').catch(() => ({}));
const available = (name) => assert.equal(typeof input[name], 'function', `${name} must be exported`);

test('modern monotonic input timestamps remain comparable with the active deadline', () => {
  available('normalizeInputTimestamp');
  available('inputBeatsDeadline');
  const timing = { now: 8100, timeOrigin: 1_800_000_000_000 };
  assert.equal(input.normalizeInputTimestamp(7999, timing), 7999);
  assert.deepEqual(input.inputBeatsDeadline(7999, 8000, timing), { timestamp: 7999, beatsDeadline: true });
});

test('equal or later input loses, while epoch-style timestamps normalize against timeOrigin', () => {
  available('inputBeatsDeadline');
  const origin = 1_800_000_000_000;
  const timing = { now: 8200, timeOrigin: origin };
  assert.deepEqual(input.inputBeatsDeadline(8000, 8000, timing), { timestamp: 8000, beatsDeadline: false });
  assert.deepEqual(input.inputBeatsDeadline(origin + 8000, 8000, timing), { timestamp: 8000, beatsDeadline: false });
  assert.deepEqual(input.inputBeatsDeadline(origin + 7999, 8000, timing), { timestamp: 7999, beatsDeadline: true });
});

test('invalid timestamps fall back to the current monotonic sample', () => {
  available('normalizeInputTimestamp');
  assert.equal(input.normalizeInputTimestamp(Number.NaN, { now: 321, timeOrigin: 1000 }), 321);
  assert.equal(input.normalizeInputTimestamp(-1, { now: 321, timeOrigin: 1000 }), 321);
});
