import { BOARD_SIZE, DIRECTIONS } from './types';
import type { Cell, Direction, MoveResolution, Player, Token, TokenId, TokenMove } from './types';

const TOKEN_IDS = new Set<TokenId>(['A1', 'A2', 'A3', 'B1', 'B2', 'B3']);

const cloneCell = (position: Cell): Cell => Object.freeze({ row: position.row, col: position.col });

const cloneToken = (token: Token, position = token.position): Token => Object.freeze({
  id: token.id,
  player: token.player,
  position: cloneCell(position),
});

export const isCellInBoard = (cell: Cell): boolean => Boolean(
  cell
  && Number.isInteger(cell.row)
  && Number.isInteger(cell.col)
  && cell.row >= 0
  && cell.row < BOARD_SIZE
  && cell.col >= 0
  && cell.col < BOARD_SIZE,
);

export const cellKey = (cell: Cell): string => `${cell.row},${cell.col}`;

export const directionDelta = (direction: Direction): Cell => {
  switch (direction) {
    case 'UP': return Object.freeze({ row: -1, col: 0 });
    case 'DOWN': return Object.freeze({ row: 1, col: 0 });
    case 'LEFT': return Object.freeze({ row: 0, col: -1 });
    case 'RIGHT': return Object.freeze({ row: 0, col: 1 });
  }
};

const expectedPlayerForToken = (id: TokenId): Player => id[0] as Player;

const assertValidBlockedCells = (blockedCells: readonly Cell[]): Set<string> => {
  if (!Array.isArray(blockedCells)) throw new Error('Gravity Pact movement state has invalid blocked cells.');
  const blockedKeys = new Set<string>();
  for (const blockedCell of blockedCells) {
    if (!isCellInBoard(blockedCell)) throw new Error('Gravity Pact movement state has a blocked cell outside the board.');
    const key = cellKey(blockedCell);
    if (blockedKeys.has(key)) throw new Error(`Gravity Pact movement state has a duplicate blocked cell: ${key}.`);
    blockedKeys.add(key);
  }
  return blockedKeys;
};

export const assertValidMovementState = (tokens: readonly Token[], blockedCells: readonly Cell[]): void => {
  if (!Array.isArray(tokens)) throw new Error('Gravity Pact movement state has invalid tokens.');
  const blockedKeys = assertValidBlockedCells(blockedCells);
  const tokenIds = new Set<TokenId>();
  const occupiedKeys = new Set<string>();

  for (const token of tokens) {
    if (!token || !TOKEN_IDS.has(token.id)) throw new Error('Gravity Pact movement state has an invalid token id.');
    if (tokenIds.has(token.id)) throw new Error(`Gravity Pact movement state has a duplicate token id: ${token.id}.`);
    tokenIds.add(token.id);
    if (token.player !== expectedPlayerForToken(token.id)) throw new Error(`Gravity Pact movement state has invalid player ownership for ${token.id}.`);
    if (!isCellInBoard(token.position)) throw new Error(`Gravity Pact token ${token.id} is outside the board.`);
    const key = cellKey(token.position);
    if (occupiedKeys.has(key)) throw new Error(`Gravity Pact movement state has occupied cell ${key}.`);
    if (blockedKeys.has(key)) throw new Error(`Gravity Pact token ${token.id} occupies a blocked cell.`);
    occupiedKeys.add(key);
  }
};

const compareTokensForDirection = (direction: Direction) => (first: Token, second: Token): number => {
  const firstPosition = first.position;
  const secondPosition = second.position;
  let primaryDifference = 0;
  let secondaryDifference = 0;

  switch (direction) {
    case 'UP':
      primaryDifference = firstPosition.row - secondPosition.row;
      secondaryDifference = firstPosition.col - secondPosition.col;
      break;
    case 'DOWN':
      primaryDifference = secondPosition.row - firstPosition.row;
      secondaryDifference = firstPosition.col - secondPosition.col;
      break;
    case 'LEFT':
      primaryDifference = firstPosition.col - secondPosition.col;
      secondaryDifference = firstPosition.row - secondPosition.row;
      break;
    case 'RIGHT':
      primaryDifference = secondPosition.col - firstPosition.col;
      secondaryDifference = firstPosition.row - secondPosition.row;
      break;
  }

  if (primaryDifference !== 0) return primaryDifference;
  if (secondaryDifference !== 0) return secondaryDifference;
  return first.id < second.id ? -1 : first.id > second.id ? 1 : 0;
};

export const resolveMovement = (
  tokens: readonly Token[],
  blockedCells: readonly Cell[],
  direction: Direction,
): MoveResolution => {
  assertValidMovementState(tokens, blockedCells);
  const blockedKeys = new Set(blockedCells.map(cellKey));
  const occupancy = new Set(tokens.map((token) => cellKey(token.position)));
  const delta = directionDelta(direction);
  const orderedTokens = [...tokens].sort(compareTokensForDirection(direction));
  const movedPositions = new Map<TokenId, Cell>();
  const moves: TokenMove[] = [];

  for (const token of orderedTokens) {
    const from = token.position;
    const to = { row: from.row + delta.row, col: from.col + delta.col };
    const destinationKey = cellKey(to);
    if (!isCellInBoard(to) || blockedKeys.has(destinationKey) || occupancy.has(destinationKey)) continue;

    occupancy.delete(cellKey(from));
    occupancy.add(destinationKey);
    const nextPosition = cloneCell(to);
    movedPositions.set(token.id, nextPosition);
    moves.push(Object.freeze({ id: token.id, from: cloneCell(from), to: nextPosition }));
  }

  const beforeTokens = Object.freeze(tokens.map((token) => cloneToken(token)));
  const afterMoveTokens = Object.freeze(tokens.map((token) => cloneToken(token, movedPositions.get(token.id) ?? token.position)));
  return Object.freeze({
    direction,
    legal: moves.length > 0,
    beforeTokens,
    afterMoveTokens,
    moves: Object.freeze(moves),
  });
};

export const getLegalDirections = (tokens: readonly Token[], blockedCells: readonly Cell[]): Direction[] => DIRECTIONS.filter((direction) => (
  resolveMovement(tokens, blockedCells, direction).legal
));
