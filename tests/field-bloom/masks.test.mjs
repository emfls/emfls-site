import assert from 'node:assert/strict';
import test from 'node:test';

const masksModule = await import('../../src/games/field-bloom/masks.ts').catch(() => ({}));

test('the four immutable masks use the frozen row/column offsets', () => {
  assert.deepEqual(masksModule.PIECE_MASKS, {
    H3: [{ row: 0, col: -1 }, { row: 0, col: 0 }, { row: 0, col: 1 }],
    V3: [{ row: -1, col: 0 }, { row: 0, col: 0 }, { row: 1, col: 0 }],
    CROSS5: [
      { row: -1, col: 0 }, { row: 0, col: -1 }, { row: 0, col: 0 },
      { row: 0, col: 1 }, { row: 1, col: 0 },
    ],
    X5: [
      { row: -1, col: -1 }, { row: -1, col: 1 }, { row: 0, col: 0 },
      { row: 1, col: -1 }, { row: 1, col: 1 },
    ],
  });
  assert.ok(Object.isFrozen(masksModule.PIECE_MASKS));
  for (const mask of Object.values(masksModule.PIECE_MASKS)) assert.ok(Object.isFrozen(mask));
});

test('effect coordinates use the same mask source and return row-major absolute cells', () => {
  assert.equal(typeof masksModule.getPieceCells, 'function');
  assert.deepEqual(masksModule.getPieceCells('X5', 2, 2), [
    { row: 1, col: 1 }, { row: 1, col: 3 }, { row: 2, col: 2 },
    { row: 3, col: 1 }, { row: 3, col: 3 },
  ]);
});
