import assert from 'node:assert/strict';
import test from 'node:test';

const validator = await import('../../src/games/field-bloom/validator.ts').catch(() => ({}));
const puzzlesModule = await import('../../src/games/field-bloom/puzzles.ts').catch(() => ({}));
const cloneSet = () => structuredClone(puzzlesModule.FIELD_BLOOM_PUZZLES);
const codesFor = (puzzles) => validator.validatePuzzleSet(puzzles).map(({ code }) => code);

test('all twelve fixed puzzles validate with stable diagnostic shape and fail-fast assertion', () => {
  assert.equal(typeof validator.validatePuzzleSet, 'function');
  assert.equal(typeof validator.assertValidPuzzleSet, 'function');
  assert.equal(typeof puzzlesModule.FIELD_BLOOM_PUZZLES?.length, 'number');
  assert.deepEqual(validator.validatePuzzleSet(puzzlesModule.FIELD_BLOOM_PUZZLES), []);
  assert.doesNotThrow(() => validator.assertValidPuzzleSet(puzzlesModule.FIELD_BLOOM_PUZZLES));
  assert.deepEqual(validator.validatePuzzleSet(null).map(({ code }) => code), ['INVALID_PUZZLE_SET']);
  const duplicateId = cloneSet();
  duplicateId[1].id = duplicateId[0].id;
  const diagnostic = validator.validatePuzzleSet(duplicateId).find(({ code }) => code === 'DUPLICATE_PUZZLE_ID');
  assert.deepEqual(Object.keys(diagnostic), ['code', 'puzzleId', 'path', 'message']);
  assert.throws(() => validator.assertValidPuzzleSet(duplicateId), /Invalid Field Bloom puzzle set:/);
});

test('validator rejects invalid dimensions, coordinate bounds, duplicate requirements, and empty constraints', () => {
  let puzzles = cloneSet(); puzzles[0].rows = 3;
  assert.ok(codesFor(puzzles).includes('INVALID_DIMENSIONS'));
  puzzles = cloneSet(); puzzles[0].requirements[0].row = puzzles[0].rows;
  assert.ok(codesFor(puzzles).includes('INVALID_REQUIREMENT_COORDINATE'));
  puzzles = cloneSet(); puzzles[0].requirements.push({ ...puzzles[0].requirements[0] });
  assert.ok(codesFor(puzzles).includes('DUPLICATE_REQUIREMENT_COORDINATE'));
  puzzles = cloneSet(); puzzles[0].requirements = [];
  assert.ok(codesFor(puzzles).includes('NO_CONSTRAINED_CELLS'));
  puzzles = cloneSet(); puzzles[0].requirements = [{ row: 0, col: 0, kind: 'forbidden' }];
  assert.ok(codesFor(puzzles).includes('MISSING_GOAL_REQUIREMENT'));
  puzzles = cloneSet(); puzzles[0].requirements[0].kind = 'neutral';
  assert.ok(codesFor(puzzles).includes('INVALID_REQUIREMENT_KIND'));
});

test('validator rejects duplicate inventory IDs, unknown piece types, and missing inventory', () => {
  let puzzles = cloneSet(); puzzles[1].inventory[1].pieceInstanceId = puzzles[1].inventory[0].pieceInstanceId;
  assert.ok(codesFor(puzzles).includes('DUPLICATE_PIECE_INSTANCE_ID'));
  puzzles = cloneSet(); puzzles[0].inventory[0].pieceType = 'L4';
  assert.ok(codesFor(puzzles).includes('INVALID_PIECE_TYPE'));
  puzzles = cloneSet(); puzzles[0].inventory = [];
  assert.ok(codesFor(puzzles).includes('EMPTY_INVENTORY'));
});

test('validator rejects each known-solution reference, uniqueness, legality, solve, and par defect', () => {
  let puzzles = cloneSet(); puzzles[0].knownSolution[0].pieceInstanceId = 'missing';
  assert.ok(codesFor(puzzles).includes('UNKNOWN_SOLUTION_PIECE'));
  puzzles = cloneSet(); puzzles[0].knownSolution.push({ ...puzzles[0].knownSolution[0] });
  assert.ok(codesFor(puzzles).includes('DUPLICATE_SOLUTION_PIECE'));
  puzzles = cloneSet(); puzzles[1].knownSolution[0].pieceType = 'H3';
  assert.ok(codesFor(puzzles).includes('SOLUTION_PIECE_TYPE_MISMATCH'));
  puzzles = cloneSet(); puzzles[0].knownSolution[0].col = 0;
  assert.ok(codesFor(puzzles).includes('ILLEGAL_SOLUTION_CENTER'));
  puzzles = cloneSet(); puzzles[1].knownSolution.push({ pieceInstanceId: 'fb02-h3-1', pieceType: 'H3', row: 1, col: 2 });
  assert.ok(codesFor(puzzles).includes('SOLUTION_CENTER_REUSED'));
  puzzles = cloneSet(); puzzles[0].knownSolution = [];
  assert.ok(codesFor(puzzles).includes('KNOWN_SOLUTION_NOT_SOLVED'));
  puzzles = cloneSet(); puzzles[0].parPieces = 0;
  assert.ok(codesFor(puzzles).includes('PAR_BELOW_SOLUTION_LENGTH'));
});

test('validator enforces ordered IDs and the authored progression contract', () => {
  let puzzles = cloneSet(); [puzzles[0], puzzles[1]] = [puzzles[1], puzzles[0]];
  assert.ok(codesFor(puzzles).includes('INVALID_PUZZLE_ID_ORDER'));
  puzzles = cloneSet(); puzzles[1].id = puzzles[0].id;
  assert.ok(codesFor(puzzles).includes('DUPLICATE_PUZZLE_ID'));
  puzzles = cloneSet(); puzzles[0].rows = 5;
  assert.ok(codesFor(puzzles).includes('PROGRESSION_CONTRACT_VIOLATION'));
  puzzles = cloneSet(); puzzles[10].requirements = puzzles[10].requirements.filter(({ kind }) => kind !== 'forbidden');
  assert.ok(codesFor(puzzles).includes('PROGRESSION_CONTRACT_VIOLATION'));
});
