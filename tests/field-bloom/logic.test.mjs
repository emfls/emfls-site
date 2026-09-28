import assert from 'node:assert/strict';
import test from 'node:test';

const logic = await import('../../src/games/field-bloom/logic.ts').catch(() => ({}));
const puzzlesModule = await import('../../src/games/field-bloom/puzzles.ts').catch(() => ({}));
const validator = await import('../../src/games/field-bloom/validator.ts').catch(() => ({}));

const edgePuzzle = {
  id: 'fb-edge', rows: 4, cols: 4,
  requirements: [{ row: 0, col: 0, kind: 'goal1' }],
  inventory: [
    { pieceInstanceId: 'edge-h3', pieceType: 'H3' }, { pieceInstanceId: 'edge-h3b', pieceType: 'H3' },
    { pieceInstanceId: 'edge-v3', pieceType: 'V3' }, { pieceInstanceId: 'edge-cross5', pieceType: 'CROSS5' },
    { pieceInstanceId: 'edge-x5', pieceType: 'X5' },
  ],
  parPieces: 1, knownSolution: [],
};
const candidate = (pieceInstanceId, pieceType, row, col) => ({ pieceInstanceId, pieceType, row, col });

test('legal centers include safe edges and center, exclude every corner and off-board mask', () => {
  assert.equal(typeof logic.getLegalCenters, 'function');
  assert.equal(typeof logic.checkPlacementLegality, 'function');
  const expectedCenters = {
    H3: [0, 1, 2, 3].flatMap((row) => [1, 2].map((col) => ({ row, col }))),
    V3: [1, 2].flatMap((row) => [0, 1, 2, 3].map((col) => ({ row, col }))),
    CROSS5: [1, 2].flatMap((row) => [1, 2].map((col) => ({ row, col }))),
    X5: [1, 2].flatMap((row) => [1, 2].map((col) => ({ row, col }))),
  };
  const pieceIds = { H3: 'edge-h3', V3: 'edge-v3', CROSS5: 'edge-cross5', X5: 'edge-x5' };
  for (const [pieceType, centers] of Object.entries(expectedCenters)) {
    assert.deepEqual(logic.getLegalCenters(pieceType, 4, 4), centers);
    for (const center of centers) {
      assert.equal(logic.checkPlacementLegality(edgePuzzle, [], candidate(pieceIds[pieceType], pieceType, center.row, center.col)).legal, true);
    }
    assert.equal(logic.checkPlacementLegality(edgePuzzle, [], candidate(pieceIds[pieceType], pieceType, 0, 0)).reason, 'MASK_OUT_OF_BOUNDS');
  }
  assert.ok(logic.getLegalCenters('H3', 4, 4).some(({ row, col }) => row === 0 && col === 1), 'safe top edge center');
  assert.ok(logic.getLegalCenters('H3', 4, 4).some(({ row, col }) => row === 3 && col === 2), 'safe bottom edge center');
  assert.ok(logic.getLegalCenters('V3', 4, 4).some(({ row, col }) => row === 1 && col === 0), 'safe left edge center');
  assert.ok(logic.getLegalCenters('V3', 4, 4).some(({ row, col }) => row === 2 && col === 3), 'safe right edge center');
  for (const [row, col] of [[0, 0], [0, 3], [3, 0], [3, 3]]) {
    assert.equal(logic.checkPlacementLegality(edgePuzzle, [], candidate('edge-h3', 'H3', row, col)).reason, 'MASK_OUT_OF_BOUNDS');
  }
  assert.equal(logic.checkPlacementLegality(edgePuzzle, [], candidate('edge-h3', 'H3', 2, 0)).legal, false);
});

test('used piece and reused center are illegal while forbidden and overcharge placements remain legal', () => {
  const first = candidate('edge-h3', 'H3', 1, 1);
  assert.equal(logic.checkPlacementLegality(edgePuzzle, [first], candidate('edge-h3', 'H3', 1, 2)).reason, 'PIECE_ALREADY_USED');
  assert.equal(logic.checkPlacementLegality(edgePuzzle, [first], candidate('edge-h3b', 'H3', 1, 1)).reason, 'CENTER_ALREADY_USED');

  const forbiddenPuzzle = {
    ...edgePuzzle, rows: 5, cols: 5,
    requirements: [{ row: 2, col: 2, kind: 'forbidden' }],
  };
  assert.equal(logic.checkPlacementLegality(forbiddenPuzzle, [], candidate('edge-h3', 'H3', 2, 2)).legal, true);

  const goalPuzzle = { ...forbiddenPuzzle, requirements: [{ row: 2, col: 2, kind: 'goal1' }] };
  const existing = candidate('edge-h3', 'H3', 2, 1);
  const overcharge = candidate('edge-h3b', 'H3', 2, 2);
  assert.equal(logic.checkPlacementLegality(goalPuzzle, [existing], overcharge).legal, true);
  assert.equal(logic.evaluateBoard(goalPuzzle, [existing, overcharge]).cells.find(({ row, col }) => row === 2 && col === 2).status, 'overcharged');
});

test('the authored 12-puzzle set has stable ordered IDs, dimensions, progression and legal solved proofs', () => {
  assert.ok(Array.isArray(puzzlesModule.FIELD_BLOOM_PUZZLES));
  assert.equal(puzzlesModule.FIELD_BLOOM_PUZZLES.length, 12);
  assert.deepEqual(puzzlesModule.FIELD_BLOOM_PUZZLES.map(({ id }) => id), Array.from({ length: 12 }, (_, index) => `fb-${String(index + 1).padStart(2, '0')}`));
  const expectedGrids = [
    ['....', '111.', '....', '....'],
    ['..1.', '..1.', '..1.', '....'],
    ['.1..', '111.', '.1..', '....'],
    ['.....', '111..', '...1.', '..111', '...1.'],
    ['.....', '111..', '.....', '....x', '.....'],
    ['.....', '..1..', '.111.', '..1..', 'x....'],
    ['.x...', '.1.1.', '..1..', '.1.1.', '.....'],
    ['1.1..', '.1...', '1.1..', '..111', 'xx...'],
    ['.1...', '.1...', '121..', '.....', '....x'],
    ['.....', '1221.', '.....', '....x', '.....'],
    ['xx..1.', '111.1.', '...11.', '.1.2.1', '11111.', '.1.1.1'],
    ['x...1.', '111.1.', '....1.', '..1212', '.1111.', 'x.11.1'],
  ];
  for (const [index, puzzle] of puzzlesModule.FIELD_BLOOM_PUZZLES.entries()) {
    const grid = Array.from({ length: puzzle.rows }, () => Array.from({ length: puzzle.cols }, () => '.'));
    for (const { row, col, kind } of puzzle.requirements) grid[row][col] = { goal1: '1', goal2: '2', forbidden: 'x' }[kind];
    assert.deepEqual(grid.map((row) => row.join('')), expectedGrids[index], `${puzzle.id} retains the A-approved grid`);
  }
  assert.equal(typeof validator.validatePuzzleSet, 'function');
  assert.deepEqual(validator.validatePuzzleSet(puzzlesModule.FIELD_BLOOM_PUZZLES), []);
  for (const puzzle of puzzlesModule.FIELD_BLOOM_PUZZLES) {
    assert.ok(puzzle.rows >= 4 && puzzle.rows <= 6);
    assert.ok(puzzle.cols >= 4 && puzzle.cols <= 6);
    const result = logic.evaluateBoard(puzzle, []);
    for (const placement of puzzle.knownSolution) {
      assert.equal(logic.checkPlacementLegality(puzzle, puzzle.knownSolution.slice(0, puzzle.knownSolution.indexOf(placement)), placement).legal, true);
    }
    assert.equal(logic.evaluateBoard(puzzle, puzzle.knownSolution).solved, true);
    assert.ok(puzzle.parPieces >= puzzle.knownSolution.length);
    assert.ok(result.cells.length === puzzle.rows * puzzle.cols);
  }
});

test('star thresholds are exact, always award at least one, and do not take time as an input', () => {
  assert.equal(typeof logic.calculateStars, 'function');
  assert.equal(logic.calculateStars(2, 0, 2), 3);
  assert.equal(logic.calculateStars(1, 0, 2), 3);
  assert.equal(logic.calculateStars(3, 0, 2), 2);
  assert.equal(logic.calculateStars(2, 2, 2), 2);
  assert.equal(logic.calculateStars(4, 0, 2), 1);
  assert.equal(logic.calculateStars(3, 3, 2), 1);
  assert.equal(logic.calculateStars(12, 100, 1), 1);
  assert.equal(logic.calculateStars.length, 3);
});
