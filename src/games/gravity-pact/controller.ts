import { createGravityPactInput } from './input';
import { GRAVITY_PACT_LAYOUTS, INITIAL_TOKENS } from './layouts';
import { getLegalDirections, resolveMovement } from './movement';
import { createGravityPactRenderer } from './renderer';
import { MATCH_INTRO_MS, MOVE_MS, REDUCED_MOVE_MS } from './types';
import type { BoardLayout, Direction, GameState, MoveResolution, Player, Token } from './types';

const panelStates = ['IDLE', 'MATCH_INTRO', 'TURN', 'MOVING', 'SCORE_FEEDBACK', 'PAUSED', 'RESULT'] as const;

type PauseContinuation = 'TURN' | 'MOVING' | undefined;

type Elements = {
  panels: NodeListOf<HTMLElement>;
  scoreA: HTMLElement;
  scoreB: HTMLElement;
  turns: HTMLElement;
  layout: HTMLElement;
  turnStatus: HTMLElement;
  turnLabel: HTMLElement;
  introLayout: HTMLElement;
  introStarter: HTMLElement;
  board: HTMLElement;
  tokenLayer: HTMLElement;
  directionButtons: NodeListOf<HTMLButtonElement>;
  scoreFeedback: HTMLElement;
  scoreFeedbackA: HTMLElement;
  scoreFeedbackB: HTMLElement;
  resultOutcome: HTMLElement;
  resultScoreA: HTMLElement;
  resultScoreB: HTMLElement;
  resultTurns: HTMLElement;
  start: HTMLButtonElement;
  resume: HTMLButtonElement;
  restart: HTMLButtonElement;
};

const getElements = (root: HTMLElement): Elements => {
  const panels = root.querySelectorAll<HTMLElement>('[data-panel]');
  const panelNames = Array.from(panels, (panel) => panel.dataset.panel);
  const validPanels = panels.length === panelStates.length
    && panelStates.every((state) => panelNames.filter((value) => value === state).length === 1)
    && panelNames.every((state) => state && panelStates.includes(state as typeof panelStates[number]));
  const scoreA = root.querySelector<HTMLElement>('[data-score-a]');
  const scoreB = root.querySelector<HTMLElement>('[data-score-b]');
  const turns = root.querySelector<HTMLElement>('[data-turns]');
  const layout = root.querySelector<HTMLElement>('[data-layout]');
  const turnStatus = root.querySelector<HTMLElement>('[data-turn-status]');
  const turnLabel = root.querySelector<HTMLElement>('[data-turn-label]');
  const introLayout = root.querySelector<HTMLElement>('[data-intro-layout]');
  const introStarter = root.querySelector<HTMLElement>('[data-intro-starter]');
  const board = root.querySelector<HTMLElement>('[data-board]');
  const tokenLayer = root.querySelector<HTMLElement>('[data-token-layer]');
  const directionButtons = root.querySelectorAll<HTMLButtonElement>('[data-direction]');
  const scoreFeedback = root.querySelector<HTMLElement>('[data-score-feedback]');
  const scoreFeedbackA = root.querySelector<HTMLElement>('[data-score-feedback-a]');
  const scoreFeedbackB = root.querySelector<HTMLElement>('[data-score-feedback-b]');
  const resultOutcome = root.querySelector<HTMLElement>('[data-result="outcome"]');
  const resultScoreA = root.querySelector<HTMLElement>('[data-result="score-a"]');
  const resultScoreB = root.querySelector<HTMLElement>('[data-result="score-b"]');
  const resultTurns = root.querySelector<HTMLElement>('[data-result="turns"]');
  const start = root.querySelector<HTMLButtonElement>('[data-action="start"]');
  const resume = root.querySelector<HTMLButtonElement>('[data-action="resume"]');
  const restart = root.querySelector<HTMLButtonElement>('[data-action="restart"]');
  if (!validPanels || !scoreA || !scoreB || !turns || !layout || !turnStatus || !turnLabel || !introLayout || !introStarter || !board || !tokenLayer || directionButtons.length !== 4 || !scoreFeedback || !scoreFeedbackA || !scoreFeedbackB || !resultOutcome || !resultScoreA || !resultScoreB || !resultTurns || !start || !resume || !restart) {
    throw new Error('Gravity Pact shell is incomplete.');
  }
  return { panels, scoreA, scoreB, turns, layout, turnStatus, turnLabel, introLayout, introStarter, board, tokenLayer, directionButtons, scoreFeedback, scoreFeedbackA, scoreFeedbackB, resultOutcome, resultScoreA, resultScoreB, resultTurns, start, resume, restart };
};

const directionFromButton = (button: HTMLButtonElement): Direction | undefined => {
  const direction = button.dataset.direction;
  return direction === 'UP' || direction === 'DOWN' || direction === 'LEFT' || direction === 'RIGHT'
    ? direction
    : undefined;
};

export const createGravityPactController = (root: HTMLElement) => {
  const elements = getElements(root);
  const renderer = createGravityPactRenderer(elements.board, elements.tokenLayer);
  let currentState: GameState = 'IDLE';
  let currentLayout: BoardLayout = GRAVITY_PACT_LAYOUTS[0];
  let currentTokens: readonly Token[] = INITIAL_TOKENS;
  let currentPlayer: Player = 'A';
  let turnsUsed = 0;
  let matchStarted = false;
  let pendingMove: MoveResolution | undefined;
  let pauseContinuation: PauseContinuation;
  let introTimeout: number | undefined;
  let moveTimeout: number | undefined;
  let moveNonce = 0;

  const clearIntroTimeout = () => {
    if (introTimeout !== undefined) window.clearTimeout(introTimeout);
    introTimeout = undefined;
  };

  const clearMoveTimeout = () => {
    if (moveTimeout !== undefined) window.clearTimeout(moveTimeout);
    moveTimeout = undefined;
    moveNonce += 1;
  };

  const syncDirectionButtons = () => {
    const legalDirections = currentState === 'TURN'
      ? new Set(getLegalDirections(currentTokens, currentLayout.blockedCells))
      : new Set<Direction>();
    elements.directionButtons.forEach((button) => {
      const direction = directionFromButton(button);
      button.disabled = currentState !== 'TURN' || !direction || !legalDirections.has(direction);
    });
  };

  const syncShellValues = (showMatchLayout = matchStarted) => {
    const playerLabel = `Player ${currentPlayer} Turn`;
    elements.scoreA.textContent = '0 / 3';
    elements.scoreB.textContent = '0 / 3';
    elements.turns.textContent = `${turnsUsed} / 30`;
    elements.layout.textContent = showMatchLayout ? String(currentLayout.id) : '—';
    elements.turnStatus.textContent = currentState === 'TURN' ? playerLabel : 'Waiting to start';
    elements.turnLabel.textContent = currentState === 'TURN' || currentState === 'MOVING' ? playerLabel : 'Waiting to start';
    elements.introLayout.textContent = showMatchLayout ? `Layout ${currentLayout.id}` : 'Layout —';
    elements.introStarter.textContent = `Player ${currentPlayer} starts`;
    elements.scoreFeedbackA.textContent = '—';
    elements.scoreFeedbackB.textContent = '—';
    elements.resultOutcome.textContent = '—';
    elements.resultScoreA.textContent = '0';
    elements.resultScoreB.textContent = '0';
    elements.resultTurns.textContent = String(turnsUsed);
    syncDirectionButtons();
  };

  const syncState = (state: GameState) => {
    currentState = state;
    root.dataset.state = state;
    elements.panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== state;
    });
    syncShellValues();
  };

  const getMoveDuration = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? REDUCED_MOVE_MS
    : MOVE_MS;

  const commitPendingMove = () => {
    const resolution = pendingMove;
    if (!resolution) return;
    pendingMove = undefined;
    clearMoveTimeout();
    currentTokens = resolution.afterMoveTokens;
    turnsUsed += 1;
    currentPlayer = currentPlayer === 'A' ? 'B' : 'A';
    renderer.snapTokens(currentTokens);
    pauseContinuation = undefined;
    syncState('TURN');
  };

  const handleDirection = (direction: Direction) => {
    if (currentState !== 'TURN') return;
    const resolution = resolveMovement(currentTokens, currentLayout.blockedCells, direction);
    if (!resolution.legal) {
      syncDirectionButtons();
      return;
    }

    pendingMove = resolution;
    syncState('MOVING');
    const duration = getMoveDuration();
    renderer.animateMovement(resolution, duration);
    const nonce = ++moveNonce;
    moveTimeout = window.setTimeout(() => {
      moveTimeout = undefined;
      if (nonce !== moveNonce || currentState !== 'MOVING' || pendingMove !== resolution) return;
      commitPendingMove();
    }, duration);
  };

  const enterMatchIntro = () => {
    clearIntroTimeout();
    clearMoveTimeout();
    pendingMove = undefined;
    pauseContinuation = undefined;
    currentLayout = GRAVITY_PACT_LAYOUTS[0];
    currentTokens = INITIAL_TOKENS;
    currentPlayer = 'A';
    turnsUsed = 0;
    matchStarted = true;
    renderer.renderBoard(currentLayout, currentTokens);
    syncState('MATCH_INTRO');
    introTimeout = window.setTimeout(() => {
      introTimeout = undefined;
      if (currentState !== 'MATCH_INTRO') return;
      syncState('TURN');
    }, MATCH_INTRO_MS);
  };

  const handleStart = () => {
    if (currentState !== 'IDLE') return;
    enterMatchIntro();
  };

  const handleResume = () => {
    if (currentState !== 'PAUSED') return;
    if (pauseContinuation === 'MOVING' && pendingMove) {
      renderer.snapTokens(pendingMove.afterMoveTokens);
      commitPendingMove();
      return;
    }
    pauseContinuation = undefined;
    syncState('TURN');
  };

  const handleRestart = () => {
    if (currentState !== 'RESULT') return;
    enterMatchIntro();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState !== 'hidden') return;
    if (currentState === 'TURN') {
      pauseContinuation = 'TURN';
      syncState('PAUSED');
      return;
    }
    if (currentState === 'MOVING' && pendingMove) {
      clearMoveTimeout();
      renderer.cancelMovement(currentTokens);
      pauseContinuation = 'MOVING';
      syncState('PAUSED');
    }
  };

  const handleViewportChange = () => {
    if (currentState === 'MOVING' && pendingMove) {
      renderer.cancelMovement(pendingMove.afterMoveTokens);
      commitPendingMove();
      return;
    }
    if (currentState === 'TURN') renderer.snapTokens(currentTokens);
  };

  const removeInputListeners = createGravityPactInput({
    root,
    directionButtons: elements.directionButtons,
    isTurn: () => currentState === 'TURN',
    isDirectionEnabled: (direction) => getLegalDirections(currentTokens, currentLayout.blockedCells).includes(direction),
    onDirection: handleDirection,
  });

  elements.start.addEventListener('click', handleStart);
  elements.resume.addEventListener('click', handleResume);
  elements.restart.addEventListener('click', handleRestart);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('resize', handleViewportChange);
  window.addEventListener('orientationchange', handleViewportChange);

  renderer.renderBoard(currentLayout, currentTokens);
  syncState('IDLE');

  return () => {
    clearIntroTimeout();
    clearMoveTimeout();
    removeInputListeners();
    renderer.destroy();
    elements.start.removeEventListener('click', handleStart);
    elements.resume.removeEventListener('click', handleResume);
    elements.restart.removeEventListener('click', handleRestart);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('resize', handleViewportChange);
    window.removeEventListener('orientationchange', handleViewportChange);
  };
};
