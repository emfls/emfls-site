import { BOARD_SIZE } from './types';
import type { BoardLayout, Cell, MoveResolution, Token } from './types';
import { cellKey } from './movement';
import { PLAYER_A_GOALS, PLAYER_B_GOALS } from './layouts';

const GOAL_A_KEYS = new Set(PLAYER_A_GOALS.map(cellKey));
const GOAL_B_KEYS = new Set(PLAYER_B_GOALS.map(cellKey));

type Renderer = {
  renderBoard: (layout: BoardLayout, tokens: readonly Token[]) => void;
  animateMovement: (resolution: MoveResolution, durationMs: number) => void;
  snapTokens: (tokens: readonly Token[]) => void;
  cancelMovement: (tokens: readonly Token[]) => void;
  destroy: () => void;
};

const tokenPosition = (token: Token): { left: string; top: string } => ({
  left: `${((token.position.col + 0.5) / BOARD_SIZE) * 100}%`,
  top: `${((token.position.row + 0.5) / BOARD_SIZE) * 100}%`,
});

const setTokenPosition = (element: HTMLElement, token: Token) => {
  const { left, top } = tokenPosition(token);
  element.style.left = left;
  element.style.top = top;
  element.dataset.row = String(token.position.row);
  element.dataset.col = String(token.position.col);
};

const cellLabel = (row: number, col: number, layout: BoardLayout | undefined, tokens: readonly Token[]): string => {
  const key = cellKey({ row, col });
  const meanings: string[] = [];
  const blockedKeys = new Set(layout?.blockedCells.map(cellKey) ?? []);
  if (GOAL_A_KEYS.has(key)) meanings.push('Player A goal');
  if (GOAL_B_KEYS.has(key)) meanings.push('Player B goal');
  if (blockedKeys.has(key)) meanings.push('blocked');
  tokens.filter((token) => cellKey(token.position) === key).forEach((token) => meanings.push(`Player ${token.player} token`));
  if (meanings.length === 0) meanings.push('empty');
  return `Row ${row + 1}, column ${col + 1}, ${meanings.join(', ')}`;
};

export const createGravityPactRenderer = (board: HTMLElement, tokenLayer: HTMLElement): Renderer => {
  const cells = Array.from(board.querySelectorAll<HTMLElement>('[data-row][data-col]'));
  const tokenElements = new Map<Token['id'], HTMLElement>();
  let currentLayout: BoardLayout | undefined;
  let currentTokens: readonly Token[] = [];
  let frameId: number | undefined;

  const syncCellLabels = (tokens: readonly Token[]) => {
    cells.forEach((cell) => {
      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);
      cell.setAttribute('aria-label', cellLabel(row, col, currentLayout, tokens));
    });
  };

  const handleResize = () => {
    if (currentLayout) syncCellLabels(currentTokens);
  };
  window.addEventListener('resize', handleResize);

  const ensureTokenElement = (token: Token): HTMLElement => {
    const existing = tokenElements.get(token.id);
    if (existing) return existing;

    const element = document.createElement('span');
    element.className = `gravity-pact__token gravity-pact__token--${token.player.toLowerCase()}`;
    element.dataset.tokenId = token.id;
    element.dataset.player = token.player;
    element.setAttribute('aria-hidden', 'true');
    tokenLayer.append(element);
    tokenElements.set(token.id, element);
    return element;
  };

  const renderTokens = (tokens: readonly Token[], durationMs?: number) => {
    const visibleIds = new Set(tokens.map((token) => token.id));
    tokens.forEach((token) => {
      const element = ensureTokenElement(token);
      if (durationMs !== undefined) element.style.transitionDuration = `${durationMs}ms`;
      setTokenPosition(element, token);
    });
    tokenElements.forEach((element, id) => {
      if (!visibleIds.has(id)) element.remove();
    });
  };

  const snapTokens = (tokens: readonly Token[]) => {
    if (frameId !== undefined) window.cancelAnimationFrame(frameId);
    frameId = undefined;
    currentTokens = tokens;
    tokenLayer.dataset.animating = 'false';
    tokenElements.forEach((element) => { element.style.transitionDuration = '0ms'; });
    renderTokens(tokens);
    syncCellLabels(currentTokens);
    tokenElements.forEach((element) => {
      void element.offsetWidth;
      element.style.removeProperty('transition-duration');
    });
  };

  const renderBoard = (layout: BoardLayout, tokens: readonly Token[]) => {
    currentLayout = layout;
    const blockedKeys = new Set(layout.blockedCells.map(cellKey));
    cells.forEach((cell) => {
      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);
      const key = cellKey({ row, col });
      cell.classList.remove('gravity-pact__cell--goal-a', 'gravity-pact__cell--goal-b', 'gravity-pact__cell--blocked');
      delete cell.dataset.goal;
      delete cell.dataset.blocked;
      if (GOAL_A_KEYS.has(key)) {
        cell.classList.add('gravity-pact__cell--goal-a');
        cell.dataset.goal = 'A';
      } else if (GOAL_B_KEYS.has(key)) {
        cell.classList.add('gravity-pact__cell--goal-b');
        cell.dataset.goal = 'B';
      }
      if (blockedKeys.has(key)) {
        cell.classList.add('gravity-pact__cell--blocked');
        cell.dataset.blocked = 'true';
      }
    });
    snapTokens(tokens);
  };

  const animateMovement = (resolution: MoveResolution, durationMs: number) => {
    if (frameId !== undefined) window.cancelAnimationFrame(frameId);
    frameId = undefined;
    tokenLayer.dataset.animating = 'true';
    renderTokens(resolution.beforeTokens, 0);
    frameId = window.requestAnimationFrame(() => {
      frameId = undefined;
      renderTokens(resolution.afterMoveTokens, durationMs);
    });
  };

  const cancelMovement = (tokens: readonly Token[]) => snapTokens(tokens);

  const destroy = () => {
    if (frameId !== undefined) window.cancelAnimationFrame(frameId);
    frameId = undefined;
    window.removeEventListener('resize', handleResize);
    tokenElements.clear();
    tokenLayer.replaceChildren();
    delete tokenLayer.dataset.animating;
    cells.forEach((cell) => {
      cell.classList.remove('gravity-pact__cell--goal-a', 'gravity-pact__cell--goal-b', 'gravity-pact__cell--blocked');
      delete cell.dataset.goal;
      delete cell.dataset.blocked;
      cell.removeAttribute('aria-label');
    });
    currentLayout = undefined;
    currentTokens = [];
  };

  return { renderBoard, animateMovement, snapTokens, cancelMovement, destroy };
};
