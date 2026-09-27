import assert from 'node:assert/strict';
import test from 'node:test';

const inputApi = await import('../../src/games/twin-ledger/input.ts').catch(() => ({}));

test('placement shortcuts map left/right keys and ignore key repeat', () => {
  assert.equal(typeof inputApi.getPlacementSideForKey, 'function');
  const map = (key, extra = {}) => inputApi.getPlacementSideForKey({
    key,
    repeat: false,
    isComposing: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    ...extra,
  });

  assert.equal(map('ArrowLeft'), 'LEFT');
  assert.equal(map('a'), 'LEFT');
  assert.equal(map('A'), 'LEFT');
  assert.equal(map('ArrowRight'), 'RIGHT');
  assert.equal(map('d'), 'RIGHT');
  assert.equal(map('D'), 'RIGHT');
  assert.equal(map('ArrowLeft', { repeat: true }), null);
  assert.equal(map('ArrowRight', { isComposing: true }), null);
  assert.equal(map('a', { ctrlKey: true }), null);
  assert.equal(map('d', { altKey: true }), null);
  assert.equal(map('ArrowLeft', { metaKey: true }), null);
  assert.equal(map('Enter'), null);
});
