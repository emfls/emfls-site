import { evaluateBoard, isPuzzleSolved } from './evaluator.ts';
import { getPieceCells, isPieceType } from './masks.ts';
import type { Coordinate, PieceType, Placement, PuzzleDefinition, StarRating } from './types.ts';

export { evaluateBoard, isPuzzleSolved } from './evaluator.ts';
export { getPieceCells } from './masks.ts';

export type PlacementRejection =
  | 'UNKNOWN_PIECE_TYPE'
  | 'PIECE_NOT_IN_INVENTORY'
  | 'PIECE_TYPE_MISMATCH'
  | 'PIECE_ALREADY_USED'
  | 'CENTER_ALREADY_USED'
  | 'INVALID_CENTER'
  | 'MASK_OUT_OF_BOUNDS';

export interface PlacementLegality {
  legal: boolean;
  reason: PlacementRejection | null;
  cells: Coordinate[];
}

export function getLegalCenters(pieceType: PieceType, rows: number, cols: number): Coordinate[] {
  if (!isPieceType(pieceType) || !Number.isSafeInteger(rows) || !Number.isSafeInteger(cols) || rows < 1 || cols < 1) return [];
  const centers: Coordinate[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cells = getPieceCells(pieceType, row, col);
      if (cells.every((cell) => cell.row >= 0 && cell.row < rows && cell.col >= 0 && cell.col < cols)) {
        centers.push({ row, col });
      }
    }
  }
  return centers;
}

export function checkPlacementLegality(
  puzzle: PuzzleDefinition,
  placements: readonly Placement[],
  candidate: Placement,
): PlacementLegality {
  const reject = (reason: PlacementRejection): PlacementLegality => ({ legal: false, reason, cells: [] });
  if (!isPieceType(candidate?.pieceType)) return reject('UNKNOWN_PIECE_TYPE');
  if (!Number.isSafeInteger(candidate.row) || !Number.isSafeInteger(candidate.col)) return reject('INVALID_CENTER');
  const inventoryPiece = puzzle.inventory.find(({ pieceInstanceId }) => pieceInstanceId === candidate.pieceInstanceId);
  if (!inventoryPiece) return reject('PIECE_NOT_IN_INVENTORY');
  if (inventoryPiece.pieceType !== candidate.pieceType) return reject('PIECE_TYPE_MISMATCH');
  if (placements.some(({ pieceInstanceId }) => pieceInstanceId === candidate.pieceInstanceId)) return reject('PIECE_ALREADY_USED');
  if (placements.some(({ row, col }) => row === candidate.row && col === candidate.col)) return reject('CENTER_ALREADY_USED');
  const cells = getPieceCells(candidate.pieceType, candidate.row, candidate.col);
  if (cells.some((cell) => cell.row < 0 || cell.row >= puzzle.rows || cell.col < 0 || cell.col >= puzzle.cols)) {
    return reject('MASK_OUT_OF_BOUNDS');
  }
  return { legal: true, reason: null, cells };
}

export function calculateStars(piecesUsed: number, undoCount: number, parPieces: number): StarRating {
  if (![piecesUsed, undoCount, parPieces].every(Number.isSafeInteger) || piecesUsed < 0 || undoCount < 0 || parPieces < 0) {
    throw new RangeError('Star inputs must be nonnegative safe integers.');
  }
  if (piecesUsed <= parPieces && undoCount === 0) return 3;
  if (piecesUsed <= parPieces + 1 && undoCount <= 2) return 2;
  return 1;
}

export { getCellStatus } from './evaluator.ts';
