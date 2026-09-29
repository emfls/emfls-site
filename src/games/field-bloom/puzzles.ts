import { assertValidPuzzleSet } from './validator.ts';
import type { CellRequirementKind, PieceInstance, Placement, PuzzleDefinition, PuzzleId } from './types.ts';

type PuzzleSpec = Omit<PuzzleDefinition, 'id' | 'requirements'> & { id: PuzzleId; grid: readonly string[] };

const GRID_REQUIREMENTS: Readonly<Record<string, CellRequirementKind>> = Object.freeze({
  '1': 'goal1',
  '2': 'goal2',
  x: 'forbidden',
});

function definePuzzle(spec: PuzzleSpec): PuzzleDefinition {
  if (spec.grid.length !== spec.rows || spec.grid.some((row) => row.length !== spec.cols)) {
    throw new Error(`Invalid fixed grid dimensions for ${spec.id}.`);
  }
  const requirements = spec.grid.flatMap((line, row) => [...line].flatMap((symbol, col) => {
    if (symbol === '.') return [];
    const kind = Object.hasOwn(GRID_REQUIREMENTS, symbol) ? GRID_REQUIREMENTS[symbol] : undefined;
    if (!kind) throw new Error(`Invalid fixed grid symbol for ${spec.id} at ${row},${col}.`);
    return [{ row, col, kind }];
  }));
  const inventory = spec.inventory.map((piece) => Object.freeze({ ...piece } satisfies PieceInstance));
  const knownSolution = spec.knownSolution.map((placement) => Object.freeze({ ...placement } satisfies Placement));
  return Object.freeze({
    id: spec.id,
    rows: spec.rows,
    cols: spec.cols,
    requirements: Object.freeze(requirements.map((requirement) => Object.freeze(requirement))),
    inventory: Object.freeze(inventory),
    parPieces: spec.parPieces,
    knownSolution: Object.freeze(knownSolution),
  });
}

export const FIELD_BLOOM_PUZZLES: readonly PuzzleDefinition[] = Object.freeze([
  definePuzzle({
    id: 'fb-01', rows: 4, cols: 4, parPieces: 1,
    grid: ['....', '111.', '....', '....'],
    inventory: [{ pieceInstanceId: 'fb01-h3-1', pieceType: 'H3' }],
    knownSolution: [{ pieceInstanceId: 'fb01-h3-1', pieceType: 'H3', row: 1, col: 1 }],
  }),
  definePuzzle({
    id: 'fb-02', rows: 4, cols: 4, parPieces: 1,
    grid: ['..1.', '..1.', '..1.', '....'],
    inventory: [
      { pieceInstanceId: 'fb02-v3-1', pieceType: 'V3' },
      { pieceInstanceId: 'fb02-h3-1', pieceType: 'H3' },
    ],
    knownSolution: [{ pieceInstanceId: 'fb02-v3-1', pieceType: 'V3', row: 1, col: 2 }],
  }),
  definePuzzle({
    id: 'fb-03', rows: 4, cols: 4, parPieces: 1,
    grid: ['.1..', '111.', '.1..', '....'],
    inventory: [
      { pieceInstanceId: 'fb03-cross5-1', pieceType: 'CROSS5' },
      { pieceInstanceId: 'fb03-h3-1', pieceType: 'H3' },
    ],
    knownSolution: [{ pieceInstanceId: 'fb03-cross5-1', pieceType: 'CROSS5', row: 1, col: 1 }],
  }),
  definePuzzle({
    id: 'fb-04', rows: 5, cols: 5, parPieces: 2,
    grid: ['.....', '111..', '...1.', '..111', '...1.'],
    inventory: [
      { pieceInstanceId: 'fb04-h3-1', pieceType: 'H3' },
      { pieceInstanceId: 'fb04-v3-1', pieceType: 'V3' },
      { pieceInstanceId: 'fb04-cross5-1', pieceType: 'CROSS5' },
    ],
    knownSolution: [
      { pieceInstanceId: 'fb04-h3-1', pieceType: 'H3', row: 1, col: 1 },
      { pieceInstanceId: 'fb04-cross5-1', pieceType: 'CROSS5', row: 3, col: 3 },
    ],
  }),
  definePuzzle({
    id: 'fb-05', rows: 5, cols: 5, parPieces: 1,
    grid: ['.....', '111..', '.....', '....x', '.....'],
    inventory: [
      { pieceInstanceId: 'fb05-h3-1', pieceType: 'H3' },
      { pieceInstanceId: 'fb05-v3-1', pieceType: 'V3' },
    ],
    knownSolution: [{ pieceInstanceId: 'fb05-h3-1', pieceType: 'H3', row: 1, col: 1 }],
  }),
  definePuzzle({
    id: 'fb-06', rows: 5, cols: 5, parPieces: 1,
    grid: ['.....', '..1..', '.111.', '..1..', 'x....'],
    inventory: [
      { pieceInstanceId: 'fb06-cross5-1', pieceType: 'CROSS5' },
      { pieceInstanceId: 'fb06-h3-1', pieceType: 'H3' },
      { pieceInstanceId: 'fb06-v3-1', pieceType: 'V3' },
    ],
    knownSolution: [{ pieceInstanceId: 'fb06-cross5-1', pieceType: 'CROSS5', row: 2, col: 2 }],
  }),
  definePuzzle({
    id: 'fb-07', rows: 5, cols: 5, parPieces: 1,
    grid: ['.x...', '.1.1.', '..1..', '.1.1.', '.....'],
    inventory: [
      { pieceInstanceId: 'fb07-x5-1', pieceType: 'X5' },
      { pieceInstanceId: 'fb07-h3-1', pieceType: 'H3' },
      { pieceInstanceId: 'fb07-cross5-1', pieceType: 'CROSS5' },
    ],
    knownSolution: [{ pieceInstanceId: 'fb07-x5-1', pieceType: 'X5', row: 2, col: 2 }],
  }),
  definePuzzle({
    id: 'fb-08', rows: 5, cols: 5, parPieces: 2,
    grid: ['1.1..', '.1...', '1.1..', '..111', 'xx...'],
    inventory: [
      { pieceInstanceId: 'fb08-x5-1', pieceType: 'X5' },
      { pieceInstanceId: 'fb08-h3-1', pieceType: 'H3' },
      { pieceInstanceId: 'fb08-v3-1', pieceType: 'V3' },
      { pieceInstanceId: 'fb08-cross5-1', pieceType: 'CROSS5' },
    ],
    knownSolution: [
      { pieceInstanceId: 'fb08-x5-1', pieceType: 'X5', row: 1, col: 1 },
      { pieceInstanceId: 'fb08-h3-1', pieceType: 'H3', row: 3, col: 3 },
    ],
  }),
  definePuzzle({
    id: 'fb-09', rows: 5, cols: 5, parPieces: 2,
    grid: ['.1...', '.1...', '121..', '.....', '....x'],
    inventory: [
      { pieceInstanceId: 'fb09-h3-1', pieceType: 'H3' },
      { pieceInstanceId: 'fb09-v3-1', pieceType: 'V3' },
      { pieceInstanceId: 'fb09-cross5-1', pieceType: 'CROSS5' },
    ],
    knownSolution: [
      { pieceInstanceId: 'fb09-h3-1', pieceType: 'H3', row: 2, col: 1 },
      { pieceInstanceId: 'fb09-v3-1', pieceType: 'V3', row: 1, col: 1 },
    ],
  }),
  definePuzzle({
    id: 'fb-10', rows: 5, cols: 5, parPieces: 2,
    grid: ['.....', '1221.', '.....', '....x', '.....'],
    inventory: [
      { pieceInstanceId: 'fb10-h3-1', pieceType: 'H3' },
      { pieceInstanceId: 'fb10-h3-2', pieceType: 'H3' },
      { pieceInstanceId: 'fb10-v3-1', pieceType: 'V3' },
    ],
    knownSolution: [
      { pieceInstanceId: 'fb10-h3-1', pieceType: 'H3', row: 1, col: 1 },
      { pieceInstanceId: 'fb10-h3-2', pieceType: 'H3', row: 1, col: 2 },
    ],
  }),
  definePuzzle({
    id: 'fb-11', rows: 6, cols: 6, parPieces: 5,
    grid: ['xx..1.', '111.1.', '...11.', '.1.2.1', '11111.', '.1.1.1'],
    inventory: [
      { pieceInstanceId: 'fb11-h3-1', pieceType: 'H3' },
      { pieceInstanceId: 'fb11-v3-1', pieceType: 'V3' },
      { pieceInstanceId: 'fb11-cross5-1', pieceType: 'CROSS5' },
      { pieceInstanceId: 'fb11-x5-1', pieceType: 'X5' },
      { pieceInstanceId: 'fb11-v3-2', pieceType: 'V3' },
    ],
    knownSolution: [
      { pieceInstanceId: 'fb11-h3-1', pieceType: 'H3', row: 1, col: 1 },
      { pieceInstanceId: 'fb11-v3-1', pieceType: 'V3', row: 1, col: 4 },
      { pieceInstanceId: 'fb11-cross5-1', pieceType: 'CROSS5', row: 4, col: 1 },
      { pieceInstanceId: 'fb11-x5-1', pieceType: 'X5', row: 4, col: 4 },
      { pieceInstanceId: 'fb11-v3-2', pieceType: 'V3', row: 3, col: 3 },
    ],
  }),
  definePuzzle({
    id: 'fb-12', rows: 6, cols: 6, parPieces: 5,
    grid: ['x...1.', '111.1.', '....1.', '..1212', '.1111.', 'x.11.1'],
    inventory: [
      { pieceInstanceId: 'fb12-h3-1', pieceType: 'H3' },
      { pieceInstanceId: 'fb12-v3-1', pieceType: 'V3' },
      { pieceInstanceId: 'fb12-cross5-1', pieceType: 'CROSS5' },
      { pieceInstanceId: 'fb12-x5-1', pieceType: 'X5' },
      { pieceInstanceId: 'fb12-h3-2', pieceType: 'H3' },
    ],
    knownSolution: [
      { pieceInstanceId: 'fb12-h3-1', pieceType: 'H3', row: 1, col: 1 },
      { pieceInstanceId: 'fb12-v3-1', pieceType: 'V3', row: 1, col: 4 },
      { pieceInstanceId: 'fb12-cross5-1', pieceType: 'CROSS5', row: 4, col: 2 },
      { pieceInstanceId: 'fb12-x5-1', pieceType: 'X5', row: 4, col: 4 },
      { pieceInstanceId: 'fb12-h3-2', pieceType: 'H3', row: 3, col: 4 },
    ],
  }),
]);

assertValidPuzzleSet(FIELD_BLOOM_PUZZLES);
