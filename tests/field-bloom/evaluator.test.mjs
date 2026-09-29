import assert from 'node:assert/strict';
import test from 'node:test';

const evaluator = await import('../../src/games/field-bloom/evaluator.ts').catch(() => ({}));
const puzzlesModule = await import('../../src/games/field-bloom/puzzles.ts').catch(() => ({}));

const puzzleWith = (kind, row = 2, col = 2) => ({
  id: 'fb-test', rows: 6, cols: 6,
  requirements: [{ row, col, kind }], inventory: [], parPieces: 0, knownSolution: [],
});
const h3At = (id, row, col) => ({ pieceInstanceId: id, pieceType: 'H3', row, col });

test('goal1, goal2, and forbidden cells expose every required count band', () => {
  assert.equal(typeof evaluator.evaluateBoard, 'function');
  const goal1Cases = [
    [],
    [h3At('g1-0', 2, 2)],
    [h3At('g1-0', 2, 1), h3At('g1-1', 2, 2)],
  ];
  for (const [index, status] of ['under', 'satisfied', 'overcharged'].entries()) {
    const cell = evaluator.evaluateBoard(puzzleWith('goal1'), goal1Cases[index]).cells[14];
    assert.deepEqual([cell.activationCount, cell.status], [index, status]);
  }

  for (const [count, status] of [[0, 'under'], [1, 'under'], [2, 'satisfied'], [3, 'overcharged']]) {
    const placements = Array.from({ length: count }, (_, index) => h3At(`g2-${index}`, 2, 1 + index));
    const cell = evaluator.evaluateBoard(puzzleWith('goal2'), placements).cells[14];
    assert.deepEqual([cell.activationCount, cell.status], [count, status]);
  }
  for (const [count, status] of [[0, 'satisfied'], [1, 'violation'], [2, 'violation']]) {
    const placements = Array.from({ length: count }, (_, index) => h3At(`x-${index}`, 2, 1 + index));
    const cell = evaluator.evaluateBoard(puzzleWith('forbidden'), placements).cells[14];
    assert.deepEqual([cell.activationCount, cell.status], [count, status]);
  }
});

test('neutral cells are visible in evaluation but do not constrain solved status', () => {
  const puzzle = {
    ...puzzleWith('goal1', 0, 0),
    requirements: [{ row: 0, col: 0, kind: 'goal1' }],
  };
  const result = evaluator.evaluateBoard(puzzle, [h3At('neutral-effect', 2, 2)]);
  const neutral = result.cells.find((cell) => cell.row === 2 && cell.col === 2);
  assert.deepEqual([neutral.requirement, neutral.status, neutral.activationCount], ['neutral', 'neutral', 1]);
  assert.equal(result.solved, false);

  const exactlySolved = {
    ...puzzleWith('goal1', 2, 1),
    requirements: [{ row: 2, col: 1, kind: 'goal1' }],
  };
  const withNeutralActivation = evaluator.evaluateBoard(exactlySolved, [h3At('neutral-is-ignored', 2, 2)]);
  assert.equal(withNeutralActivation.cells.find((cell) => cell.row === 2 && cell.col === 2).requirement, 'neutral');
  assert.equal(withNeutralActivation.solved, true);
});

test('overlapping masks are fully recomputed and placement order does not change counts', () => {
  const puzzle = {
    ...puzzleWith('goal1', 2, 2),
    requirements: [
      { row: 2, col: 2, kind: 'goal1' },
      { row: 3, col: 3, kind: 'goal2' },
      { row: 0, col: 0, kind: 'forbidden' },
    ],
  };
  const placements = [h3At('a', 2, 1), h3At('b', 2, 3), { pieceInstanceId: 'c', pieceType: 'V3', row: 2, col: 3 }];
  const first = evaluator.evaluateBoard(puzzle, placements);
  const reversed = evaluator.evaluateBoard(puzzle, [...placements].reverse());
  assert.deepEqual(first.activationCounts, reversed.activationCounts);
  assert.equal(first.cells.find(({ row, col }) => row === 2 && col === 2).activationCount, 2);
  assert.deepEqual(first.activationCounts[0], [0, 0, 0, 0, 0, 0]);
  assert.equal(first.cells.length, puzzle.rows * puzzle.cols);
  assert.equal(first.underCount, 1);
  assert.equal(first.overchargedCount, 1);
  assert.equal(first.forbiddenViolationCount, 0);
  assert.equal(first.solved, false);
});

test('exact goals and clean forbidden cells solve even when inventory remains', () => {
  assert.equal(typeof evaluator.isPuzzleSolved, 'function');
  const puzzle = puzzlesModule.FIELD_BLOOM_PUZZLES?.[1];
  assert.ok(puzzle, 'fixed puzzle data must be exported');
  const result = evaluator.evaluateBoard(puzzle, puzzle.knownSolution);
  assert.equal(result.solved, true);
  assert.equal(evaluator.isPuzzleSolved(result), true);
  assert.ok(puzzle.inventory.length > puzzle.knownSolution.length);
  assert.equal(evaluator.evaluateBoard(puzzle, []).solved, false);
});

test('overcharge and forbidden activation each block a board whose other targets are exact', () => {
  const puzzle = {
    id: 'fb-solved-contract', rows: 6, cols: 6,
    requirements: [
      { row: 2, col: 2, kind: 'goal1' },
      { row: 4, col: 4, kind: 'goal2' },
      { row: 0, col: 0, kind: 'forbidden' },
    ],
    inventory: [], parPieces: 2, knownSolution: [],
  };
  const exactPlacements = [
    h3At('goal1', 2, 2),
    { pieceInstanceId: 'goal2-a', pieceType: 'H3', row: 4, col: 3 },
    { pieceInstanceId: 'goal2-b', pieceType: 'V3', row: 3, col: 4 },
  ];
  assert.equal(evaluator.evaluateBoard(puzzle, exactPlacements).solved, true);
  assert.equal(evaluator.evaluateBoard(puzzle, [...exactPlacements, h3At('overcharge', 2, 1)]).solved, false);
  assert.equal(evaluator.evaluateBoard(puzzle, [...exactPlacements, { pieceInstanceId: 'forbidden-hit', pieceType: 'V3', row: 1, col: 0 }]).solved, false);
});
