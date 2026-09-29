import { evaluateBoard } from './evaluator.ts';
import { checkPlacementLegality } from './logic.ts';
import { isPieceType } from './masks.ts';
import { FIELD_BLOOM_PUZZLE_IDS } from './types.ts';
import type { CellRequirementKind, Placement, PuzzleDefinition, PuzzleDiagnostic } from './types.ts';

const requirementKinds = new Set<CellRequirementKind>(['goal1', 'goal2', 'forbidden']);
const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const isSafeIntegerField = (value: Record<string, unknown>, key: string): boolean => Number.isSafeInteger(value[key]);

function progressionMatches(index: number, puzzle: Record<string, unknown>): boolean {
  const dimensionsMatch = Number.isSafeInteger(puzzle.rows) && Number.isSafeInteger(puzzle.cols);
  if (!dimensionsMatch) return false;
  const rows = puzzle.rows as number;
  const cols = puzzle.cols as number;
  const requirements = Array.isArray(puzzle.requirements) ? puzzle.requirements : [];
  const inventory = Array.isArray(puzzle.inventory) ? puzzle.inventory : [];
  const kinds = new Set(requirements.filter(isRecord).map(({ kind }) => kind));
  const pieceTypes = new Set(inventory.filter(isRecord).map(({ pieceType }) => pieceType));
  const has = (kind: string) => kinds.has(kind);
  const hasPiece = (pieceType: string) => pieceTypes.has(pieceType);
  const onlyGoal1 = has('goal1') && !has('goal2') && !has('forbidden');

  if (index === 0) return rows === 4 && cols === 4 && onlyGoal1 && hasPiece('H3');
  if (index === 1) return rows === 4 && cols === 4 && onlyGoal1 && hasPiece('V3');
  if (index === 2) return rows === 4 && cols === 4 && onlyGoal1 && hasPiece('CROSS5');
  if (index === 3) return rows === 5 && cols === 5 && onlyGoal1 && hasPiece('CROSS5');
  if (index >= 4 && index <= 5) {
    return rows === 5 && cols === 5 && has('forbidden') && !has('goal2');
  }
  if (index >= 6 && index <= 7) {
    return rows === 5 && cols === 5 && has('forbidden') && !has('goal2') && hasPiece('X5');
  }
  if (index >= 8 && index <= 9) {
    return rows === 5 && cols === 5 && has('goal1') && has('goal2') && has('forbidden');
  }
  return rows === 6 && cols === 6
    && has('goal1') && has('goal2') && has('forbidden')
    && ['H3', 'V3', 'CROSS5', 'X5'].every(hasPiece);
}

export function validatePuzzleSet(value: unknown): PuzzleDiagnostic[] {
  if (!Array.isArray(value)) {
    return [{ code: 'INVALID_PUZZLE_SET', puzzleId: null, path: 'puzzles', message: 'Puzzle set must be an array.' }];
  }

  const diagnostics: PuzzleDiagnostic[] = [];
  const add = (code: string, puzzleId: string | null, path: string, message: string) => {
    diagnostics.push({ code, puzzleId, path, message });
  };
  if (value.length !== FIELD_BLOOM_PUZZLE_IDS.length) {
    add('INVALID_PUZZLE_ID_ORDER', null, 'puzzles.length', `Expected exactly ${FIELD_BLOOM_PUZZLE_IDS.length} ordered puzzles.`);
  }

  const seenPuzzleIds = new Set<string>();
  value.forEach((entry, index) => {
    const puzzle = isRecord(entry) ? entry : {};
    const puzzleId = typeof puzzle.id === 'string' ? puzzle.id : null;
    const prefix = `puzzles[${index}]`;
    const expectedId = FIELD_BLOOM_PUZZLE_IDS[index];
    if (puzzleId !== expectedId) {
      add('INVALID_PUZZLE_ID_ORDER', puzzleId, `${prefix}.id`, `Expected ${expectedId ?? 'no additional puzzle'} at this position.`);
    }
    if (puzzleId !== null && seenPuzzleIds.has(puzzleId)) {
      add('DUPLICATE_PUZZLE_ID', puzzleId, `${prefix}.id`, 'Puzzle IDs must be unique.');
    }
    if (puzzleId !== null) seenPuzzleIds.add(puzzleId);

    const rows = puzzle.rows;
    const cols = puzzle.cols;
    const validDimensions = Number.isSafeInteger(rows) && Number.isSafeInteger(cols)
      && (rows as number) >= 4 && (rows as number) <= 6
      && (cols as number) >= 4 && (cols as number) <= 6;
    if (!validDimensions) {
      add('INVALID_DIMENSIONS', puzzleId, `${prefix}.rows/cols`, 'Rows and columns must be integers from 4 through 6.');
    }

    const requirements = Array.isArray(puzzle.requirements) ? puzzle.requirements : [];
    if (!Array.isArray(puzzle.requirements) || requirements.length === 0) {
      add('NO_CONSTRAINED_CELLS', puzzleId, `${prefix}.requirements`, 'At least one constrained cell is required.');
    }
    const seenCoordinates = new Set<string>();
    let hasGoalRequirement = false;
    requirements.forEach((rawRequirement, requirementIndex) => {
      const requirement = isRecord(rawRequirement) ? rawRequirement : {};
      const path = `${prefix}.requirements[${requirementIndex}]`;
      const rowValid = isSafeIntegerField(requirement, 'row');
      const colValid = isSafeIntegerField(requirement, 'col');
      const inside = rowValid && colValid && validDimensions
        && (requirement.row as number) >= 0 && (requirement.row as number) < (rows as number)
        && (requirement.col as number) >= 0 && (requirement.col as number) < (cols as number);
      if (!inside) {
        add('INVALID_REQUIREMENT_COORDINATE', puzzleId, path, 'Requirement coordinates must be integer cells inside the puzzle.');
      } else {
        const coordinate = `${requirement.row},${requirement.col}`;
        if (seenCoordinates.has(coordinate)) {
          add('DUPLICATE_REQUIREMENT_COORDINATE', puzzleId, path, 'A cell may have only one requirement.');
        }
        seenCoordinates.add(coordinate);
      }
      if (typeof requirement.kind !== 'string' || !requirementKinds.has(requirement.kind as CellRequirementKind)) {
        add('INVALID_REQUIREMENT_KIND', puzzleId, `${path}.kind`, 'Requirement kind must be goal1, goal2, or forbidden.');
      } else if (requirement.kind === 'goal1' || requirement.kind === 'goal2') {
        hasGoalRequirement = true;
      }
    });
    if (requirements.length > 0 && !hasGoalRequirement) {
      add('MISSING_GOAL_REQUIREMENT', puzzleId, `${prefix}.requirements`, 'At least one goal requirement is required.');
    }

    const inventory = Array.isArray(puzzle.inventory) ? puzzle.inventory : [];
    if (!Array.isArray(puzzle.inventory) || inventory.length === 0) {
      add('EMPTY_INVENTORY', puzzleId, `${prefix}.inventory`, 'At least one inventory piece is required.');
    }
    const inventoryById = new Map<string, Record<string, unknown>>();
    inventory.forEach((rawPiece, pieceIndex) => {
      const piece = isRecord(rawPiece) ? rawPiece : {};
      const path = `${prefix}.inventory[${pieceIndex}]`;
      if (typeof piece.pieceInstanceId !== 'string' || piece.pieceInstanceId.length === 0) {
        add('DUPLICATE_PIECE_INSTANCE_ID', puzzleId, `${path}.pieceInstanceId`, 'Piece instance IDs must be nonempty and unique.');
      } else if (inventoryById.has(piece.pieceInstanceId)) {
        add('DUPLICATE_PIECE_INSTANCE_ID', puzzleId, `${path}.pieceInstanceId`, 'Piece instance IDs must be unique within a puzzle.');
      } else {
        inventoryById.set(piece.pieceInstanceId, piece);
      }
      if (!isPieceType(piece.pieceType)) {
        add('INVALID_PIECE_TYPE', puzzleId, `${path}.pieceType`, 'Piece type must be one of the four frozen masks.');
      }
    });

    const knownSolution = Array.isArray(puzzle.knownSolution) ? puzzle.knownSolution : [];
    const seenSolutionPieces = new Set<string>();
    const seenSolutionCenters = new Set<string>();
    const acceptedPlacements: Placement[] = [];
    knownSolution.forEach((rawPlacement, solutionIndex) => {
      const placement = isRecord(rawPlacement) ? rawPlacement : {};
      const path = `${prefix}.knownSolution[${solutionIndex}]`;
      const instanceId = typeof placement.pieceInstanceId === 'string' ? placement.pieceInstanceId : null;
      const inventoryPiece = instanceId === null ? undefined : inventoryById.get(instanceId);
      if (!inventoryPiece) {
        add('UNKNOWN_SOLUTION_PIECE', puzzleId, `${path}.pieceInstanceId`, 'Known solution must use an inventory piece instance.');
      }
      if (instanceId !== null && seenSolutionPieces.has(instanceId)) {
        add('DUPLICATE_SOLUTION_PIECE', puzzleId, `${path}.pieceInstanceId`, 'A known solution may use each inventory piece only once.');
      }
      if (instanceId !== null) seenSolutionPieces.add(instanceId);

      if (!isPieceType(placement.pieceType)) {
        add('INVALID_PIECE_TYPE', puzzleId, `${path}.pieceType`, 'Known-solution piece type must use a frozen mask.');
      } else if (inventoryPiece && inventoryPiece.pieceType !== placement.pieceType) {
        add('SOLUTION_PIECE_TYPE_MISMATCH', puzzleId, `${path}.pieceType`, 'Known-solution piece type must match its inventory instance.');
      }

      const rowValid = isSafeIntegerField(placement, 'row');
      const colValid = isSafeIntegerField(placement, 'col');
      const center = rowValid && colValid ? `${placement.row},${placement.col}` : null;
      if (center !== null && seenSolutionCenters.has(center)) {
        add('SOLUTION_CENTER_REUSED', puzzleId, path, 'Known-solution centers must be unique.');
      }
      if (center !== null) seenSolutionCenters.add(center);

      if (!rowValid || !colValid || !validDimensions) {
        add('ILLEGAL_SOLUTION_CENTER', puzzleId, path, 'Known-solution center must be a legal in-bounds placement.');
        return;
      }
      if (!inventoryPiece || !isPieceType(placement.pieceType) || inventoryPiece.pieceType !== placement.pieceType) return;
      const candidate = {
        pieceInstanceId: instanceId as string,
        pieceType: placement.pieceType,
        row: placement.row as number,
        col: placement.col as number,
      } as Placement;
      const legality = checkPlacementLegality(puzzle as unknown as PuzzleDefinition, acceptedPlacements, candidate);
      if (!legality.legal) {
        if (legality.reason === 'MASK_OUT_OF_BOUNDS' || legality.reason === 'INVALID_CENTER') {
          add('ILLEGAL_SOLUTION_CENTER', puzzleId, path, 'Known-solution mask must remain inside the board.');
        } else if (legality.reason === 'CENTER_ALREADY_USED') {
          if (center === null || !seenSolutionCenters.has(center)) {
            add('SOLUTION_CENTER_REUSED', puzzleId, path, 'Known-solution centers must be unique.');
          }
        } else if (legality.reason === 'PIECE_ALREADY_USED') {
          if (instanceId === null || !seenSolutionPieces.has(instanceId)) {
            add('DUPLICATE_SOLUTION_PIECE', puzzleId, path, 'Known solution may not reuse an inventory piece.');
          }
        } else {
          add('UNKNOWN_SOLUTION_PIECE', puzzleId, path, 'Known solution must reference a usable inventory piece.');
        }
        return;
      }
      acceptedPlacements.push(candidate);
    });

    const parPieces = puzzle.parPieces;
    if (!Number.isSafeInteger(parPieces) || (parPieces as number) < knownSolution.length) {
      add('PAR_BELOW_SOLUTION_LENGTH', puzzleId, `${prefix}.parPieces`, 'parPieces must be a nonnegative integer at least as large as the known solution.');
    }

    if (validDimensions && requirements.length > 0) {
      try {
        if (!evaluateBoard(puzzle as unknown as PuzzleDefinition, knownSolution as Placement[]).solved) {
          add('KNOWN_SOLUTION_NOT_SOLVED', puzzleId, `${prefix}.knownSolution`, 'Known solution must solve every constrained cell.');
        }
      } catch {
        add('KNOWN_SOLUTION_NOT_SOLVED', puzzleId, `${prefix}.knownSolution`, 'Known solution could not be evaluated.');
      }
    } else {
      add('KNOWN_SOLUTION_NOT_SOLVED', puzzleId, `${prefix}.knownSolution`, 'Known solution cannot be evaluated without valid dimensions and requirements.');
    }

    if (!progressionMatches(index, puzzle)) {
      add('PROGRESSION_CONTRACT_VIOLATION', puzzleId, prefix, 'Puzzle data does not match its frozen progression tier.');
    }
  });

  return diagnostics;
}

export function assertValidPuzzleSet(value: unknown): asserts value is readonly PuzzleDefinition[] {
  const diagnostics = validatePuzzleSet(value);
  if (diagnostics.length > 0) {
    const first = diagnostics[0]!;
    throw new Error(`Invalid Field Bloom puzzle set: ${first.code} at ${first.path} — ${first.message}`);
  }
}
