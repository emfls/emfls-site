import { getPieceCells } from './masks.ts';
import type { BoardEvaluation, CellRequirement, CellStatus, Placement, PuzzleDefinition } from './types.ts';

const coordinateKey = (row: number, col: number): string => `${row},${col}`;

export function calculateActivationCounts(puzzle: Pick<PuzzleDefinition, 'rows' | 'cols'>, placements: readonly Placement[]): number[][] {
  const counts = Array.from({ length: puzzle.rows }, () => Array<number>(puzzle.cols).fill(0));
  for (const placement of placements) {
    for (const cell of getPieceCells(placement.pieceType, placement.row, placement.col)) {
      if (cell.row >= 0 && cell.row < puzzle.rows && cell.col >= 0 && cell.col < puzzle.cols) {
        counts[cell.row][cell.col] += 1;
      }
    }
  }
  return counts;
}

export function getCellStatus(requirement: CellRequirement, activationCount: number): CellStatus {
  if (requirement === 'neutral') return 'neutral';
  if (requirement === 'forbidden') return activationCount === 0 ? 'satisfied' : 'violation';
  if (requirement === 'goal1') {
    if (activationCount === 0) return 'under';
    return activationCount === 1 ? 'satisfied' : 'overcharged';
  }
  if (requirement !== 'goal2') return 'violation';
  if (activationCount < 2) return 'under';
  return activationCount === 2 ? 'satisfied' : 'overcharged';
}

export function evaluateBoard(puzzle: PuzzleDefinition, placements: readonly Placement[]): BoardEvaluation {
  const activationCounts = calculateActivationCounts(puzzle, placements);
  const requirementByCoordinate = new Map(
    puzzle.requirements.map(({ row, col, kind }) => [coordinateKey(row, col), kind]),
  );
  const cells = activationCounts.flatMap((rowCounts, row) => rowCounts.map((activationCount, col) => {
    const requirement = requirementByCoordinate.get(coordinateKey(row, col)) ?? 'neutral';
    return {
      row,
      col,
      requirement,
      activationCount,
      status: getCellStatus(requirement, activationCount),
    };
  }));
  const constrainedCells = cells.filter(({ requirement }) => requirement !== 'neutral');
  const underCount = cells.filter(({ status }) => status === 'under').length;
  const overchargedCount = cells.filter(({ status }) => status === 'overcharged').length;
  const forbiddenViolationCount = cells.filter(({ status }) => status === 'violation').length;

  return {
    activationCounts,
    cells,
    underCount,
    overchargedCount,
    forbiddenViolationCount,
    solved: constrainedCells.length > 0 && constrainedCells.every(({ status }) => status === 'satisfied'),
  };
}

export function isPuzzleSolved(evaluation: Pick<BoardEvaluation, 'solved'>): boolean {
  return evaluation.solved === true;
}
