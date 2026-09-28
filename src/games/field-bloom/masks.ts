import type { Coordinate, PieceType } from './types.ts';

type MaskOffset = Readonly<Coordinate>;
type PieceMask = readonly MaskOffset[];

const freezeMask = (offsets: Coordinate[]): PieceMask => Object.freeze(
  offsets.map((offset) => Object.freeze(offset)),
);

export const PIECE_MASKS: Readonly<Record<PieceType, PieceMask>> = Object.freeze({
  H3: freezeMask([{ row: 0, col: -1 }, { row: 0, col: 0 }, { row: 0, col: 1 }]),
  V3: freezeMask([{ row: -1, col: 0 }, { row: 0, col: 0 }, { row: 1, col: 0 }]),
  CROSS5: freezeMask([
    { row: -1, col: 0 }, { row: 0, col: -1 }, { row: 0, col: 0 },
    { row: 0, col: 1 }, { row: 1, col: 0 },
  ]),
  X5: freezeMask([
    { row: -1, col: -1 }, { row: -1, col: 1 }, { row: 0, col: 0 },
    { row: 1, col: -1 }, { row: 1, col: 1 },
  ]),
});

export function isPieceType(value: unknown): value is PieceType {
  return typeof value === 'string' && Object.hasOwn(PIECE_MASKS, value);
}

export function getPieceCells(pieceType: PieceType, row: number, col: number): Coordinate[] {
  if (!isPieceType(pieceType)) return [];
  return PIECE_MASKS[pieceType]
    .map((offset) => ({ row: row + offset.row, col: col + offset.col }))
    .sort((a, b) => a.row - b.row || a.col - b.col);
}
