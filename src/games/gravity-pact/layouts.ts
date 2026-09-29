import type { BoardLayout, BoardLayoutId, Cell, Direction, Token } from './types';
import { cellKey, getLegalDirections, isCellInBoard, resolveMovement } from './movement';

const makeCell = (row: number, col: number): Cell => Object.freeze({ row, col });

const makeToken = (id: Token['id'], player: Token['player'], position: Cell): Token => Object.freeze({
  id,
  player,
  position: makeCell(position.row, position.col),
});

const makeLayout = (id: BoardLayoutId, blockedCells: readonly Cell[]): BoardLayout => Object.freeze({
  id,
  blockedCells: Object.freeze(blockedCells.map((blockedCell) => makeCell(blockedCell.row, blockedCell.col))),
});

export const PLAYER_A_STARTS = Object.freeze([
  makeCell(4, 1),
  makeCell(4, 3),
  makeCell(3, 2),
]);

export const PLAYER_B_STARTS = Object.freeze([
  makeCell(0, 1),
  makeCell(0, 3),
  makeCell(1, 2),
]);

export const INITIAL_TOKENS = Object.freeze([
  makeToken('A1', 'A', PLAYER_A_STARTS[0]),
  makeToken('A2', 'A', PLAYER_A_STARTS[1]),
  makeToken('A3', 'A', PLAYER_A_STARTS[2]),
  makeToken('B1', 'B', PLAYER_B_STARTS[0]),
  makeToken('B2', 'B', PLAYER_B_STARTS[1]),
  makeToken('B3', 'B', PLAYER_B_STARTS[2]),
]);

export const PLAYER_A_GOALS = Object.freeze([
  makeCell(0, 0),
  makeCell(0, 2),
  makeCell(0, 4),
]);

export const PLAYER_B_GOALS = Object.freeze([
  makeCell(4, 0),
  makeCell(4, 2),
  makeCell(4, 4),
]);

export const GRAVITY_PACT_LAYOUTS = Object.freeze([
  makeLayout(1, []),
  makeLayout(2, [makeCell(2, 2)]),
  makeLayout(3, [makeCell(2, 1), makeCell(2, 3)]),
  makeLayout(4, [makeCell(1, 1), makeCell(3, 3)]),
  makeLayout(5, [makeCell(1, 0), makeCell(3, 4), makeCell(1, 4), makeCell(3, 0)]),
  makeLayout(6, [makeCell(2, 0), makeCell(2, 4), makeCell(1, 3), makeCell(3, 1)]),
]);

export type LayoutWitness = Readonly<{
  layoutId: BoardLayoutId;
  playerAFirstScore: readonly Direction[];
  playerBFirstScore: readonly Direction[];
  expectedPlayerAToken: Token['id'];
  expectedPlayerBToken: Token['id'];
}>;

const makeWitness = (
  layoutId: BoardLayoutId,
  playerAFirstScore: readonly Direction[],
  playerBFirstScore: readonly Direction[],
  expectedPlayerAToken: Token['id'],
  expectedPlayerBToken: Token['id'],
): LayoutWitness => Object.freeze({
  layoutId,
  playerAFirstScore: Object.freeze([...playerAFirstScore]),
  playerBFirstScore: Object.freeze([...playerBFirstScore]),
  expectedPlayerAToken,
  expectedPlayerBToken,
});

export const GRAVITY_PACT_WITNESSES = Object.freeze([
  makeWitness(1, ['DOWN', 'UP', 'LEFT', 'LEFT', 'UP', 'UP', 'UP'], ['UP', 'DOWN', 'LEFT', 'LEFT', 'DOWN', 'DOWN', 'DOWN'], 'A2', 'B2'),
  makeWitness(2, ['UP', 'UP', 'LEFT', 'UP', 'UP', 'RIGHT'], ['DOWN', 'DOWN', 'LEFT', 'DOWN', 'DOWN', 'RIGHT'], 'A2', 'B2'),
  makeWitness(3, ['UP', 'LEFT', 'UP', 'RIGHT', 'UP', 'UP'], ['DOWN', 'LEFT', 'DOWN', 'RIGHT', 'DOWN', 'DOWN'], 'A1', 'B1'),
  makeWitness(4, ['LEFT', 'UP', 'RIGHT', 'UP', 'UP'], ['LEFT', 'LEFT', 'DOWN', 'DOWN', 'DOWN'], 'A3', 'B3'),
  makeWitness(5, ['UP', 'UP', 'UP', 'LEFT', 'UP', 'RIGHT'], ['DOWN', 'DOWN', 'DOWN', 'LEFT', 'DOWN', 'RIGHT'], 'A2', 'B2'),
  makeWitness(6, ['LEFT', 'LEFT', 'UP', 'UP', 'UP'], ['LEFT', 'DOWN', 'RIGHT', 'DOWN', 'DOWN'], 'A3', 'B3'),
]);

const allStartsAndGoals = [...PLAYER_A_STARTS, ...PLAYER_B_STARTS, ...PLAYER_A_GOALS, ...PLAYER_B_GOALS];
const allStartGoalKeys = new Set(allStartsAndGoals.map(cellKey));

const rotatedCellKey = (cell: Cell): string => cellKey({ row: 4 - cell.row, col: 4 - cell.col });

export const validateGravityPactLayouts = (layouts: readonly BoardLayout[]): string[] => {
  const errors: string[] = [];
  if (!Array.isArray(layouts)) return ['layout collection: expected an array.'];
  if (layouts.length !== 6) errors.push(`layout collection: expected exactly 6 layouts, received ${layouts.length}.`);

  const seenIds = new Set<number>();
  layouts.forEach((layout, index) => {
    const expectedId = index + 1;
    const id = layout?.id;
    const label = Number.isInteger(id) ? `layout ${id}` : `layout at index ${index}`;
    if (seenIds.has(id as number)) errors.push(`${label}: duplicate layout id.`);
    if (Number.isInteger(id)) seenIds.add(id as number);
    if (id !== expectedId) errors.push(`${label}: expected id ${expectedId} at position ${index + 1}.`);

    const blockedCells = layout?.blockedCells;
    if (!Array.isArray(blockedCells)) {
      errors.push(`${label}: blockedCells must be an array.`);
      return;
    }
    if (blockedCells.length > 4) errors.push(`${label}: blocked cell count must be between 0 and 4.`);

    const blockedKeys = new Set<string>();
    let validBlockedCells = true;
    for (const blockedCell of blockedCells) {
      if (!isCellInBoard(blockedCell)) {
        errors.push(`${label}: blocked cell must be an integer coordinate inside the board.`);
        validBlockedCells = false;
        continue;
      }
      const key = cellKey(blockedCell);
      if (blockedKeys.has(key)) errors.push(`${label}: duplicate blocked cell ${key}.`);
      blockedKeys.add(key);
      if (allStartGoalKeys.has(key)) errors.push(`${label}: blocked cell ${key} overlaps a start or goal.`);
    }

    for (const blockedCell of blockedCells) {
      if (isCellInBoard(blockedCell) && !blockedKeys.has(rotatedCellKey(blockedCell))) {
        errors.push(`${label}: blocked cell ${cellKey(blockedCell)} is missing its 180-degree partner.`);
      }
    }

    if (validBlockedCells) {
      try {
        const legalDirections = getLegalDirections(INITIAL_TOKENS, blockedCells);
        if (legalDirections.length < 2) errors.push(`${label}: expected at least two initial legal directions, received ${legalDirections.length}.`);
      } catch (error) {
        const reason = error instanceof Error ? error.message : 'movement validation failed';
        errors.push(`${label}: initial legal direction validation failed: ${reason}`);
      }
    }
  });

  return errors;
};

export const assertValidGravityPactLayouts = (layouts: readonly BoardLayout[]): void => {
  const errors = validateGravityPactLayouts(layouts);
  if (errors.length > 0) throw new Error(`Gravity Pact layout validation failed: ${errors.join(' ')}`);
};

const isMatchingGoal = (token: Token, goals: readonly Cell[]): boolean => goals.some((goal) => cellKey(goal) === cellKey(token.position));

const validateWitnessSequence = (
  witness: LayoutWitness,
  directions: readonly Direction[],
  expectedPlayer: 'A' | 'B',
  expectedToken: Token['id'],
): string[] => {
  const layout = GRAVITY_PACT_LAYOUTS.find(({ id }) => id === witness.layoutId);
  if (!layout) return [`layout ${witness.layoutId}: witness has no matching layout.`];
  const errors: string[] = [];
  let tokens: readonly Token[] = INITIAL_TOKENS;
  const goals = expectedPlayer === 'A' ? PLAYER_A_GOALS : PLAYER_B_GOALS;
  const opponent = expectedPlayer === 'A' ? 'B' : 'A';
  const opponentGoals = expectedPlayer === 'A' ? PLAYER_B_GOALS : PLAYER_A_GOALS;

  directions.forEach((direction, index) => {
    const resolution = resolveMovement(tokens, layout.blockedCells, direction);
    if (!resolution.legal) errors.push(`layout ${witness.layoutId} ${expectedPlayer} witness step ${index + 1}: direction ${direction} is illegal.`);
    if (new Set(resolution.afterMoveTokens.map(({ position }) => cellKey(position))).size !== resolution.afterMoveTokens.length) {
      errors.push(`layout ${witness.layoutId} ${expectedPlayer} witness step ${index + 1}: token positions overlap.`);
    }
    if (index < directions.length - 1) {
      if (resolution.afterMoveTokens.some((token) => isMatchingGoal(token, token.player === 'A' ? PLAYER_A_GOALS : PLAYER_B_GOALS))) {
        errors.push(`layout ${witness.layoutId} ${expectedPlayer} witness step ${index + 1}: a matching goal was reached before the final step.`);
      }
    } else {
      const scoringToken = resolution.afterMoveTokens.find(({ id }) => id === expectedToken);
      if (!scoringToken || !isMatchingGoal(scoringToken, goals)) errors.push(`layout ${witness.layoutId} ${expectedPlayer} witness: expected ${expectedToken} to reach its matching goal.`);
      if (resolution.afterMoveTokens.some((token) => token.player === opponent && isMatchingGoal(token, opponentGoals))) {
        errors.push(`layout ${witness.layoutId} ${expectedPlayer} witness: opponent reached a matching goal.`);
      }
    }
    tokens = resolution.afterMoveTokens;
  });

  return errors;
};

export const validateGravityPactWitnesses = (witnesses: readonly LayoutWitness[] = GRAVITY_PACT_WITNESSES): string[] => {
  const errors: string[] = [];
  for (const witness of witnesses) {
    errors.push(...validateWitnessSequence(witness, witness.playerAFirstScore, 'A', witness.expectedPlayerAToken));
    errors.push(...validateWitnessSequence(witness, witness.playerBFirstScore, 'B', witness.expectedPlayerBToken));
  }
  return errors;
};

export const assertValidGravityPactWitnesses = (witnesses: readonly LayoutWitness[] = GRAVITY_PACT_WITNESSES): void => {
  const errors = validateGravityPactWitnesses(witnesses);
  if (errors.length > 0) throw new Error(`Gravity Pact witness validation failed: ${errors.join(' ')}`);
};
