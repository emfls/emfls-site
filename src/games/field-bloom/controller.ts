import { evaluateBoard } from './evaluator.ts';
import { bindFieldBloomInput } from './input.ts';
import { calculateStars, checkPlacementLegality, getPieceCells } from './logic.ts';
import { FIELD_BLOOM_PUZZLES } from './puzzles.ts';
import { isPuzzleUnlocked, recordPuzzleResult } from './progress.ts';
import { loadProgress, saveProgress } from './storage.ts';
import { createActiveTimer, formatElapsedTime } from './timer.ts';
import { FIELD_BLOOM_PUZZLE_IDS } from './types.ts';
import type { ActiveTimerClock } from './timer.ts';
import type { ProgressStorage } from './storage.ts';
import type { BoardEvaluation, Coordinate, GameState, Placement, PuzzleDefinition, PuzzleId, PuzzleResult, StoredProgress } from './types.ts';

export const FIELD_BLOOM_GAME_STATES: readonly GameState[] = Object.freeze([
  'LEVEL_SELECT', 'PUZZLE_INTRO', 'PLAYING', 'SOLVE_FEEDBACK', 'PAUSED',
]);

export type PauseReason = 'manual' | 'visibility' | 'orientation';

export interface FieldBloomSnapshot {
  state: GameState;
  puzzleId: PuzzleId | null;
  puzzle: PuzzleDefinition | null;
  placements: Placement[];
  selectedPieceInstanceId: string | null;
  undoCount: number;
  elapsedActiveMs: number;
  evaluation: BoardEvaluation | null;
  invalidFeedback: string;
  pauseReason: PauseReason | null;
  progress: StoredProgress;
  result: PuzzleResult | null;
  allPuzzlesComplete: boolean;
}

export interface FieldBloomSessionOptions {
  readonly clock?: ActiveTimerClock;
  readonly initialProgress?: StoredProgress;
  readonly storage?: ProgressStorage | null;
}

export interface FieldBloomSession {
  getSnapshot(): FieldBloomSnapshot;
  subscribe(listener: (snapshot: FieldBloomSnapshot) => void): () => void;
  selectPuzzle(puzzleId: string): boolean;
  backToLevels(): boolean;
  startPuzzle(): boolean;
  retryPuzzle(): boolean;
  nextPuzzle(): boolean;
  selectPiece(pieceInstanceId: string): boolean;
  placeAt(row: number, col: number): boolean;
  undo(): boolean;
  reset(): boolean;
  pause(reason?: PauseReason): boolean;
  resume(): boolean;
  destroy(): void;
}

export interface LifecycleTargets {
  readonly document: Pick<Document, 'addEventListener' | 'removeEventListener' | 'visibilityState'>;
  readonly window: Pick<Window, 'addEventListener' | 'removeEventListener'>;
}

const systemClock: ActiveTimerClock = {
  now: () => globalThis.performance.now(),
  setTimeout: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof globalThis.setTimeout>),
};

function copyProgress(progress: StoredProgress): StoredProgress {
  return {
    version: 1,
    unlockedThrough: progress.unlockedThrough,
    puzzles: Object.fromEntries(Object.entries(progress.puzzles).map(([id, record]) => [id, { ...record }])),
  };
}

function invalidMessage(reason: string | null): string {
  if (reason === 'MASK_OUT_OF_BOUNDS' || reason === 'INVALID_CENTER') {
    return 'That piece would cross the board edge. Choose another cell.';
  }
  if (reason === 'CENTER_ALREADY_USED') return 'That cell already has a piece center.';
  if (reason === 'PIECE_ALREADY_USED') return 'That energy piece has already been placed.';
  return 'Choose an available energy piece before placing it.';
}

export function createFieldBloomSession(options: FieldBloomSessionOptions = {}): FieldBloomSession {
  const clock = options.clock ?? systemClock;
  let progress = copyProgress(options.initialProgress ?? loadProgress(options.storage));
  let state: GameState = 'LEVEL_SELECT';
  let puzzle: PuzzleDefinition | null = null;
  let placements: Placement[] = [];
  let selectedPieceInstanceId: string | null = null;
  let undoCount = 0;
  let elapsedActiveMs = 0;
  let invalidFeedback = '';
  let pauseReason: PauseReason | null = null;
  let result: PuzzleResult | null = null;
  let allPuzzlesComplete = false;
  let activeTimer: ReturnType<typeof createActiveTimer> | null = null;
  let attemptGeneration = 0;
  let destroyed = false;
  const subscribers = new Set<(snapshot: FieldBloomSnapshot) => void>();

  const getSnapshot = (): FieldBloomSnapshot => ({
    state,
    puzzleId: puzzle?.id ?? null,
    puzzle,
    placements: placements.map((placement) => ({ ...placement })),
    selectedPieceInstanceId,
    undoCount,
    elapsedActiveMs: activeTimer?.getElapsedMs() ?? elapsedActiveMs,
    evaluation: puzzle ? evaluateBoard(puzzle, placements) : null,
    invalidFeedback,
    pauseReason,
    progress: copyProgress(progress),
    result: result ? { ...result } : null,
    allPuzzlesComplete,
  });

  const publish = (): void => {
    if (destroyed) return;
    const snapshot = getSnapshot();
    for (const subscriber of subscribers) subscriber(snapshot);
  };

  const stopTimer = (): number => {
    const finalElapsed = activeTimer?.stop() ?? elapsedActiveMs;
    elapsedActiveMs = finalElapsed;
    activeTimer = null;
    return finalElapsed;
  };

  const clearAttempt = (): void => {
    attemptGeneration += 1;
    stopTimer();
    placements = [];
    selectedPieceInstanceId = null;
    undoCount = 0;
    elapsedActiveMs = 0;
    invalidFeedback = '';
    pauseReason = null;
    result = null;
    allPuzzlesComplete = false;
  };

  const startTimer = (): void => {
    const expectedAttempt = ++attemptGeneration;
    activeTimer = createActiveTimer({
      clock,
      onUpdate: (nextElapsedMs) => {
        if (destroyed || expectedAttempt !== attemptGeneration) return;
        elapsedActiveMs = nextElapsedMs;
        publish();
      },
    });
    activeTimer.start();
  };

  return Object.freeze({
    getSnapshot,
    subscribe(listener) {
      if (destroyed) return () => {};
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    },
    selectPuzzle(puzzleId) {
      if (destroyed || state !== 'LEVEL_SELECT') return false;
      const nextPuzzle = FIELD_BLOOM_PUZZLES.find((candidate) => candidate.id === puzzleId);
      if (!nextPuzzle || !isPuzzleUnlocked(progress, nextPuzzle.id)) return false;
      clearAttempt();
      puzzle = nextPuzzle;
      state = 'PUZZLE_INTRO';
      publish();
      return true;
    },
    backToLevels() {
      if (destroyed || !['PUZZLE_INTRO', 'SOLVE_FEEDBACK'].includes(state)) return false;
      clearAttempt();
      puzzle = null;
      state = 'LEVEL_SELECT';
      publish();
      return true;
    },
    startPuzzle() {
      if (destroyed || state !== 'PUZZLE_INTRO' || !puzzle) return false;
      clearAttempt();
      state = 'PLAYING';
      startTimer();
      return true;
    },
    retryPuzzle() {
      if (destroyed || state !== 'SOLVE_FEEDBACK' || !puzzle) return false;
      clearAttempt();
      state = 'PUZZLE_INTRO';
      publish();
      return true;
    },
    nextPuzzle() {
      if (destroyed || state !== 'SOLVE_FEEDBACK' || !puzzle) return false;
      const currentIndex = FIELD_BLOOM_PUZZLES.findIndex(({ id }) => id === puzzle?.id);
      const nextPuzzle = FIELD_BLOOM_PUZZLES[currentIndex + 1];
      if (!nextPuzzle || !isPuzzleUnlocked(progress, nextPuzzle.id)) return false;
      clearAttempt();
      puzzle = nextPuzzle;
      state = 'PUZZLE_INTRO';
      publish();
      return true;
    },
    selectPiece(pieceInstanceId) {
      if (destroyed || state !== 'PLAYING' || !puzzle) return false;
      const piece = puzzle.inventory.find(({ pieceInstanceId: id }) => id === pieceInstanceId);
      if (!piece || placements.some(({ pieceInstanceId: id }) => id === pieceInstanceId)) return false;
      selectedPieceInstanceId = selectedPieceInstanceId === pieceInstanceId ? null : pieceInstanceId;
      invalidFeedback = '';
      publish();
      return true;
    },
    placeAt(row, col) {
      if (destroyed || state !== 'PLAYING' || !puzzle || selectedPieceInstanceId === null) return false;
      const piece = puzzle.inventory.find(({ pieceInstanceId: id }) => id === selectedPieceInstanceId);
      if (!piece) return false;
      const candidate: Placement = { ...piece, row, col };
      const legality = checkPlacementLegality(puzzle, placements, candidate);
      if (!legality.legal) {
        invalidFeedback = invalidMessage(legality.reason);
        publish();
        return false;
      }

      placements = [...placements, candidate];
      selectedPieceInstanceId = null;
      invalidFeedback = '';
      if (evaluateBoard(puzzle, placements).solved) {
        elapsedActiveMs = stopTimer();
        const stars = calculateStars(placements.length, undoCount, puzzle.parPieces);
        progress = recordPuzzleResult(progress, puzzle.id, stars, elapsedActiveMs);
        const best = progress.puzzles[puzzle.id];
        result = {
          stars,
          piecesUsed: placements.length,
          undoCount,
          elapsedActiveMs,
          bestStars: best.bestStars,
          bestTimeMs: best.bestTimeMs,
        };
        allPuzzlesComplete = puzzle.id === FIELD_BLOOM_PUZZLE_IDS[FIELD_BLOOM_PUZZLE_IDS.length - 1];
        saveProgress(progress, options.storage);
        state = 'SOLVE_FEEDBACK';
        pauseReason = null;
      }
      publish();
      return true;
    },
    undo() {
      if (destroyed || state !== 'PLAYING' || placements.length === 0) return false;
      placements = placements.slice(0, -1);
      selectedPieceInstanceId = null;
      undoCount += 1;
      invalidFeedback = '';
      publish();
      return true;
    },
    reset() {
      if (destroyed || state !== 'PLAYING' || !puzzle) return false;
      placements = [];
      selectedPieceInstanceId = null;
      undoCount += 1;
      invalidFeedback = '';
      publish();
      return true;
    },
    pause(reason: PauseReason = 'manual') {
      if (destroyed || state !== 'PLAYING' || !activeTimer) return false;
      state = 'PAUSED';
      pauseReason = reason;
      activeTimer.pause();
      elapsedActiveMs = activeTimer.getElapsedMs();
      publish();
      return true;
    },
    resume() {
      if (destroyed || state !== 'PAUSED' || !activeTimer) return false;
      state = 'PLAYING';
      pauseReason = null;
      if (!activeTimer.resume()) {
        state = 'PAUSED';
        pauseReason = 'manual';
        return false;
      }
      publish();
      return true;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      attemptGeneration += 1;
      stopTimer();
      subscribers.clear();
    },
  });
}

export function bindFieldBloomLifecycle(session: FieldBloomSession, targets: LifecycleTargets): () => void {
  let bound = true;
  const onVisibilityChange = (): void => {
    if (targets.document.visibilityState === 'hidden') session.pause('visibility');
  };
  const onOrientationChange = (): void => session.pause('orientation');
  const onDestroy = (): void => session.destroy();

  targets.document.addEventListener('visibilitychange', onVisibilityChange);
  targets.document.addEventListener('astro:before-swap', onDestroy);
  targets.window.addEventListener('orientationchange', onOrientationChange);
  targets.window.addEventListener('pagehide', onDestroy);

  return () => {
    if (!bound) return;
    bound = false;
    targets.document.removeEventListener('visibilitychange', onVisibilityChange);
    targets.document.removeEventListener('astro:before-swap', onDestroy);
    targets.window.removeEventListener('orientationchange', onOrientationChange);
    targets.window.removeEventListener('pagehide', onDestroy);
  };
}

function requirementSummary(puzzle: PuzzleDefinition): string {
  const counts = new Map<string, number>();
  for (const { kind } of puzzle.requirements) counts.set(kind, (counts.get(kind) ?? 0) + 1);
  const labels: Record<string, string> = {
    goal1: '1-activation target', goal2: '2-activation target', forbidden: 'forbidden cell',
  };
  return [...counts].map(([kind, count]) => `${count} ${labels[kind]}${count === 1 ? '' : 's'}`).join(' · ');
}

function inventorySummary(puzzle: PuzzleDefinition): string {
  const counts = new Map<string, number>();
  for (const { pieceType } of puzzle.inventory) counts.set(pieceType, (counts.get(pieceType) ?? 0) + 1);
  return [...counts].map(([pieceType, count]) => `${pieceType} × ${count}`).join(' · ');
}

function requirementLabel(kind: string): string {
  if (kind === 'goal1') return 'Target: exactly 1 activation';
  if (kind === 'goal2') return 'Target: exactly 2 activations';
  if (kind === 'forbidden') return 'Forbidden cell';
  return 'Neutral cell';
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    neutral: 'neutral', under: 'below target', satisfied: 'satisfied',
    overcharged: 'overcharged', violation: 'forbidden activation',
  };
  return labels[status] ?? 'invalid';
}

function markerFor(kind: string): string {
  if (kind === 'goal1') return '1';
  if (kind === 'goal2') return '2';
  if (kind === 'forbidden') return 'X';
  return '·';
}

function stateMark(status: string): string {
  if (status === 'satisfied') return '✓';
  if (status === 'overcharged' || status === 'violation') return '!';
  return '';
}

export function createFieldBloomController(root: HTMLElement, options: FieldBloomSessionOptions = {}): () => void {
  const document = root.ownerDocument;
  const window = document.defaultView;
  const session = createFieldBloomSession(options);
  let previewCenter: Coordinate | null = null;
  let boardPuzzleId: string | null = null;
  let inventoryPuzzleId: string | null = null;
  let disposed = false;

  const board = root.querySelector<HTMLDivElement>('[data-board]');
  const inventory = root.querySelector<HTMLUListElement>('[data-inventory]');
  const renderBoard = (snapshot: FieldBloomSnapshot): void => {
    if (!board || !snapshot.puzzle || !snapshot.evaluation) return;
    if (boardPuzzleId !== snapshot.puzzle.id || board.children.length !== snapshot.puzzle.rows * snapshot.puzzle.cols) {
      const fragment = document.createDocumentFragment();
      for (let index = 0; index < snapshot.puzzle.rows * snapshot.puzzle.cols; index += 1) {
        const row = Math.floor(index / snapshot.puzzle.cols);
        const col = index % snapshot.puzzle.cols;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'field-bloom__cell';
        button.dataset.cellRow = String(row);
        button.dataset.cellCol = String(col);
        button.setAttribute('role', 'gridcell');
        const requirement = document.createElement('span');
        requirement.className = 'field-bloom__cell-requirement';
        requirement.dataset.cellRequirement = '';
        const count = document.createElement('span');
        count.className = 'field-bloom__cell-count';
        count.dataset.cellCount = '';
        const mark = document.createElement('span');
        mark.className = 'field-bloom__cell-mark';
        mark.dataset.cellMark = '';
        mark.setAttribute('aria-hidden', 'true');
        button.append(requirement, count, mark);
        fragment.append(button);
      }
      board.replaceChildren(fragment);
      boardPuzzleId = snapshot.puzzle.id;
    }
    board.setAttribute('aria-rowcount', String(snapshot.puzzle.rows));
    board.setAttribute('aria-colcount', String(snapshot.puzzle.cols));
    board.style.setProperty('--field-bloom-board-columns', String(snapshot.puzzle.cols));
    const selected = snapshot.puzzle.inventory.find(({ pieceInstanceId }) => pieceInstanceId === snapshot.selectedPieceInstanceId);
    let previewCells = new Set<string>();
    let previewIsLegal = false;
    if (selected && previewCenter) {
      const previewPlacement = { ...selected, ...previewCenter };
      const legality = checkPlacementLegality(snapshot.puzzle, snapshot.placements, previewPlacement);
      previewIsLegal = legality.legal;
      if (previewIsLegal) {
        previewCells = new Set(getPieceCells(selected.pieceType, previewCenter.row, previewCenter.col).map(({ row, col }) => `${row},${col}`));
      }
    }

    snapshot.evaluation.cells.forEach((cell, index) => {
      const element = board.children.item(index) as HTMLButtonElement | null;
      if (!element) return;
      const previewKey = `${cell.row},${cell.col}`;
      const invalidCenter = selected && previewCenter && !previewIsLegal
        && previewCenter.row === cell.row && previewCenter.col === cell.col;
      const requirement = element.querySelector<HTMLElement>('[data-cell-requirement]');
      const count = element.querySelector<HTMLElement>('[data-cell-count]');
      const mark = element.querySelector<HTMLElement>('[data-cell-mark]');
      element.dataset.status = cell.status;
      element.classList.toggle('field-bloom__cell--preview', previewIsLegal && previewCells.has(previewKey));
      element.classList.toggle('field-bloom__cell--preview-invalid', Boolean(invalidCenter));
      if (requirement) requirement.textContent = markerFor(cell.requirement);
      if (count) count.textContent = String(cell.activationCount);
      if (mark) mark.textContent = invalidCenter ? '!' : stateMark(cell.status);
      element.setAttribute('aria-label', `Row ${cell.row + 1}, column ${cell.col + 1}. ${requirementLabel(cell.requirement)}; ${cell.activationCount} activations; ${statusLabel(cell.status)}.`);
    });
  };

  const renderInventory = (snapshot: FieldBloomSnapshot): void => {
    if (!inventory || !snapshot.puzzle) return;
    if (inventoryPuzzleId !== snapshot.puzzle.id) {
      const fragment = document.createDocumentFragment();
      snapshot.puzzle.inventory.forEach((piece, index) => {
        const item = document.createElement('li');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'field-bloom__piece';
        button.dataset.pieceId = piece.pieceInstanceId;
        const name = document.createElement('span');
        name.className = 'field-bloom__piece-type';
        name.dataset.pieceType = '';
        const stateText = document.createElement('span');
        stateText.className = 'field-bloom__piece-state';
        stateText.dataset.pieceState = '';
        button.append(name, stateText);
        item.append(button);
        fragment.append(item);
        button.setAttribute('aria-label', `${piece.pieceType} energy piece ${index + 1}`);
      });
      inventory.replaceChildren(fragment);
      inventoryPuzzleId = snapshot.puzzle.id;
    }
    for (const button of inventory.querySelectorAll<HTMLButtonElement>('[data-piece-id]')) {
      const pieceId = button.dataset.pieceId;
      const piece = snapshot.puzzle.inventory.find(({ pieceInstanceId }) => pieceInstanceId === pieceId);
      if (!piece) continue;
      const isUsed = snapshot.placements.some(({ pieceInstanceId }) => pieceInstanceId === piece.pieceInstanceId);
      const isSelected = snapshot.selectedPieceInstanceId === piece.pieceInstanceId;
      button.disabled = snapshot.state !== 'PLAYING' || isUsed;
      button.setAttribute('aria-pressed', String(isSelected));
      button.classList.toggle('field-bloom__piece--selected', isSelected);
      button.classList.toggle('field-bloom__piece--used', isUsed);
      const name = button.querySelector<HTMLElement>('[data-piece-type]');
      const stateText = button.querySelector<HTMLElement>('[data-piece-state]');
      if (name) name.textContent = piece.pieceType;
      if (stateText) stateText.textContent = isUsed ? 'Used' : isSelected ? 'Selected' : 'Available';
      const index = snapshot.puzzle.inventory.findIndex(({ pieceInstanceId }) => pieceInstanceId === pieceId);
      button.setAttribute('aria-label', `${piece.pieceType} energy piece ${index + 1}, ${isUsed ? 'used' : isSelected ? 'selected' : 'available'}`);
    }
  };

  const render = (snapshot: FieldBloomSnapshot): void => {
    root.dataset.state = snapshot.state;
    root.querySelectorAll<HTMLElement>('[data-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.panel !== snapshot.state;
    });

    root.querySelectorAll<HTMLButtonElement>('[data-puzzle-id]').forEach((button) => {
      const id = button.dataset.puzzleId ?? '';
      const isUnlocked = isPuzzleUnlocked(snapshot.progress, id);
      button.disabled = snapshot.state !== 'LEVEL_SELECT' || !isUnlocked;
      button.setAttribute('aria-current', snapshot.puzzleId === id ? 'true' : 'false');
      const puzzleText = button.querySelector<HTMLElement>('.field-bloom__level-title');
      if (puzzleText) {
        let bestLabel = puzzleText.querySelector<HTMLElement>('[data-level-best]');
        if (!bestLabel) {
          bestLabel = document.createElement('span');
          bestLabel.dataset.levelBest = '';
          puzzleText.append(bestLabel);
        }
        const best = snapshot.progress.puzzles[id];
        bestLabel.hidden = !best;
        bestLabel.textContent = best
          ? ` · Best ${best.bestStars ?? '—'} ${best.bestStars === 1 ? 'star' : 'stars'} · ${best.bestTimeMs === null ? '—' : formatElapsedTime(best.bestTimeMs)}`
          : '';
      }
    });

    const puzzleNumber = snapshot.puzzle ? FIELD_BLOOM_PUZZLE_IDS.indexOf(snapshot.puzzle.id) + 1 : 0;
    const title = snapshot.puzzle ? `Puzzle ${puzzleNumber}` : '';
    const setText = (selector: string, text: string): void => {
      const element = root.querySelector<HTMLElement>(selector);
      if (element && element.textContent !== text) element.textContent = text;
    };
    setText('[data-puzzle-title]', title);
    setText('[data-playing-title]', title);
    if (snapshot.puzzle) {
      setText('[data-board-size]', `${snapshot.puzzle.rows} × ${snapshot.puzzle.cols}`);
      setText('[data-requirement-summary]', requirementSummary(snapshot.puzzle));
      setText('[data-inventory-summary]', inventorySummary(snapshot.puzzle));
    }
    setText('[data-timer]', formatElapsedTime(snapshot.elapsedActiveMs));
    setText('[data-paused-timer]', formatElapsedTime(snapshot.elapsedActiveMs));
    setText('[data-status]', snapshot.invalidFeedback);
    const selectedPiece = snapshot.puzzle?.inventory.find(({ pieceInstanceId }) => pieceInstanceId === snapshot.selectedPieceInstanceId);
    setText('[data-selected-piece]', selectedPiece ? `Selected: ${selectedPiece.pieceType}` : 'No energy piece selected');
    setText('[data-undo-count]', `Undos this attempt: ${snapshot.undoCount}`);

    root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
      const action = button.dataset.action;
      const currentIndex = snapshot.puzzle ? FIELD_BLOOM_PUZZLES.findIndex(({ id }) => id === snapshot.puzzle?.id) : -1;
      const canNext = snapshot.state === 'SOLVE_FEEDBACK'
        && currentIndex >= 0
        && isPuzzleUnlocked(snapshot.progress, FIELD_BLOOM_PUZZLES[currentIndex + 1]?.id ?? '');
      const enabled: Record<string, boolean> = {
        start: snapshot.state === 'PUZZLE_INTRO',
        'back-to-levels': snapshot.state === 'PUZZLE_INTRO',
        undo: snapshot.state === 'PLAYING' && snapshot.placements.length > 0,
        reset: snapshot.state === 'PLAYING',
        pause: snapshot.state === 'PLAYING',
        resume: snapshot.state === 'PAUSED',
        next: canNext,
        retry: snapshot.state === 'SOLVE_FEEDBACK',
        'level-select': snapshot.state === 'SOLVE_FEEDBACK',
      };
      button.disabled = !enabled[action ?? ''];
    });

    const completionHeading = snapshot.puzzle ? `${title} solved` : 'Puzzle solved';
    setText('[data-completion-heading]', snapshot.allPuzzlesComplete ? 'All puzzles complete' : completionHeading);
    setText('[data-completion-message]', snapshot.allPuzzlesComplete
      ? 'You completed all 12 Field Bloom puzzles. You can revisit any unlocked puzzle.'
      : 'Every target is exact, and every forbidden cell stayed untouched.');
    const resultValues: Record<string, string> = {
      stars: snapshot.result ? String(snapshot.result.stars) : '',
      'pieces-used': snapshot.result ? String(snapshot.result.piecesUsed) : '',
      'undo-count': snapshot.result ? String(snapshot.result.undoCount) : '',
      time: snapshot.result ? formatElapsedTime(snapshot.result.elapsedActiveMs) : '',
      'best-stars': snapshot.result ? String(snapshot.result.bestStars ?? '—') : '',
      'best-time': snapshot.result
        ? snapshot.result.bestTimeMs === null ? '—' : formatElapsedTime(snapshot.result.bestTimeMs)
        : '',
    };
    for (const [key, value] of Object.entries(resultValues)) setText(`[data-result="${key}"]`, value);
    const results = root.querySelector<HTMLElement>('.field-bloom__results');
    if (results) results.hidden = snapshot.result === null;

    const actions = root.querySelector<HTMLElement>('[data-playing-actions]');
    if (actions) actions.hidden = snapshot.state !== 'PLAYING';
    const selectedLabel = root.querySelector<HTMLElement>('[data-selected-piece]');
    if (selectedLabel) selectedLabel.hidden = snapshot.state !== 'PLAYING';
    const status = root.querySelector<HTMLElement>('[data-status]');
    if (status) status.hidden = snapshot.state !== 'PLAYING' || snapshot.invalidFeedback.length === 0;

    renderBoard(snapshot);
    renderInventory(snapshot);
  };

  const unbindInput = bindFieldBloomInput(root, {
    onAction(action) {
      previewCenter = null;
      if (action === 'start') session.startPuzzle();
      else if (action === 'back-to-levels' || action === 'level-select') session.backToLevels();
      else if (action === 'undo') session.undo();
      else if (action === 'reset') session.reset();
      else if (action === 'pause') session.pause('manual');
      else if (action === 'resume') session.resume();
      else if (action === 'retry') session.retryPuzzle();
      else if (action === 'next') session.nextPuzzle();
    },
    onPuzzleSelect(puzzleId) { previewCenter = null; session.selectPuzzle(puzzleId); },
    onPieceSelect(pieceInstanceId) { previewCenter = null; session.selectPiece(pieceInstanceId); },
    onCellActivate(row, col) { previewCenter = null; session.placeAt(row, col); },
    onPreview(row, col) { previewCenter = { row, col }; render(session.getSnapshot()); },
    onClearPreview() { previewCenter = null; render(session.getSnapshot()); },
  });
  const unsubscribe = session.subscribe(render);
  const unbindLifecycle = window ? bindFieldBloomLifecycle(session, { document, window }) : () => {};
  render(session.getSnapshot());
  root.dataset.controllerReady = 'true';

  return () => {
    if (disposed) return;
    disposed = true;
    unbindInput();
    unbindLifecycle();
    unsubscribe();
    session.destroy();
    delete root.dataset.controllerReady;
  };
}
