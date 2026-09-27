import assert from 'node:assert/strict';
import test from 'node:test';

const load = async () => import(new URL('../../src/games/twin-ledger/fairness.ts', import.meta.url)).catch(() => ({}));
const fairness = await load();
const available = (name) => assert.equal(typeof fairness[name], 'function', `${name} must be exported`);
const tiles = (values) => values.map(([baseValue, weight = 1], index) => ({
  id: `dp-${String(index + 1).padStart(2, '0')}`,
  baseValue,
  weight,
}));

test('Difference DP deduplicates safe states and accepts a complete safe path', () => {
  available('validateDifferenceDP');
  const duplicatePaths = fairness.validateDifferenceDP(tiles([[1], [1]]));
  assert.equal(duplicatePaths.valid, true);
  assert.deepEqual(duplicatePaths.reachableCountsByTurn, [2, 3]);
  const full = fairness.validateDifferenceDP(tiles(Array.from({ length: 18 }, () => [1])));
  assert.equal(full.valid, true);
  assert.equal(full.reachableCountsByTurn.length, 18);
  assert.ok(full.finalSafeStateCount > 0);
});

test('Difference DP rejects no-path and dead-end-safe-state sequences', () => {
  available('validateDifferenceDP');
  const noPath = fairness.validateDifferenceDP(tiles([[9]]));
  assert.equal(noPath.valid, false);
  assert.equal(noPath.reason, 'NO_SAFE_PATH');
  const deadEnd = fairness.validateDifferenceDP(tiles([[1], [1], [2], [2], [9]]));
  assert.equal(deadEnd.valid, false);
  assert.equal(deadEnd.reason, 'DEAD_END');
  assert.ok(deadEnd.deadEndCount > 0);
  assert.ok(deadEnd.finalSafeStateCount > 0);
  assert.equal(deadEnd.failedTurn, 5);
});

test('Difference DP uses signed effective values and checks no continuation after the final turn', () => {
  available('validateDifferenceDP');
  const signedHeavy = fairness.validateDifferenceDP(tiles([[-3, 2]]));
  assert.equal(signedHeavy.valid, true);
  assert.deepEqual(signedHeavy.reachableCountsByTurn, [2]);
  const lastTurn = fairness.validateDifferenceDP(tiles(Array.from({ length: 18 }, () => [1])));
  assert.equal(lastTurn.valid, true);
  assert.equal(lastTurn.failedTurn, null);
  assert.equal(lastTurn.reachableCountsByTurn.length, 18);
});

test('path-level safety audit rejects three consecutive forced choices on one safe path', () => {
  available('validateDifferenceDP');
  const values = [...Array(13).fill([1]), [4], [6], [-3], [1], [1]];
  const result = fairness.validateDifferenceDP(tiles(values));
  assert.equal(result.valid, false);
  assert.equal(result.reason, 'FORCED_SIDE_STREAK');
  assert.ok(result.forcedSideRun >= 3);
  assert.equal(result.failedTurn, 14);
});
