import { MATCH_INTRO_MS } from './types';
import type { GameState, Player } from './types';

const panelStates = ['IDLE', 'MATCH_INTRO', 'TURN', 'MOVING', 'SCORE_FEEDBACK', 'PAUSED', 'RESULT'] as const;

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
  if (!validPanels || !scoreA || !scoreB || !turns || !layout || !turnStatus || !turnLabel || !introLayout || !introStarter || !board || directionButtons.length !== 4 || !scoreFeedback || !scoreFeedbackA || !scoreFeedbackB || !resultOutcome || !resultScoreA || !resultScoreB || !resultTurns || !start || !resume || !restart) {
    throw new Error('Gravity Pact shell is incomplete.');
  }
  return { panels, scoreA, scoreB, turns, layout, turnStatus, turnLabel, introLayout, introStarter, board, directionButtons, scoreFeedback, scoreFeedbackA, scoreFeedbackB, resultOutcome, resultScoreA, resultScoreB, resultTurns, start, resume, restart };
};

export const createGravityPactController = (root: HTMLElement) => {
  const elements = getElements(root);
  let currentState: GameState = 'IDLE';
  let currentPlayer: Player = 'A';
  let introTimeout: number | undefined;

  const clearIntroTimeout = () => {
    if (introTimeout !== undefined) window.clearTimeout(introTimeout);
    introTimeout = undefined;
  };

  const syncState = (state: GameState) => {
    currentState = state;
    root.dataset.state = state;
    elements.panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== state;
    });
  };

  const syncShellValues = (intro = false) => {
    elements.scoreA.textContent = '0 / 3';
    elements.scoreB.textContent = '0 / 3';
    elements.turns.textContent = '0 / 30';
    elements.layout.textContent = intro ? '1' : '—';
    elements.turnStatus.textContent = currentState === 'TURN' ? `Player ${currentPlayer} Turn` : 'Waiting to start';
    elements.turnLabel.textContent = currentState === 'TURN' ? `Player ${currentPlayer} Turn` : 'Waiting to start';
    elements.introLayout.textContent = intro ? 'Layout 1' : 'Layout —';
    elements.introStarter.textContent = `Player ${currentPlayer} starts`;
    elements.scoreFeedbackA.textContent = '—';
    elements.scoreFeedbackB.textContent = '—';
    elements.resultOutcome.textContent = '—';
    elements.resultScoreA.textContent = '0';
    elements.resultScoreB.textContent = '0';
    elements.resultTurns.textContent = '0';
    elements.directionButtons.forEach((button) => { button.disabled = true; });
  };

  const enterMatchIntro = () => {
    clearIntroTimeout();
    currentPlayer = 'A';
    syncState('MATCH_INTRO');
    syncShellValues(true);
    introTimeout = window.setTimeout(() => {
      introTimeout = undefined;
      if (currentState !== 'MATCH_INTRO') return;
      syncState('TURN');
      syncShellValues(true);
    }, MATCH_INTRO_MS);
  };

  const handleStart = () => {
    if (currentState !== 'IDLE') return;
    enterMatchIntro();
  };

  const handleResume = () => {
    if (currentState !== 'PAUSED') return;
    syncState('TURN');
    syncShellValues(true);
  };

  const handleRestart = () => {
    if (currentState !== 'RESULT') return;
    enterMatchIntro();
  };

  elements.start.addEventListener('click', handleStart);
  elements.resume.addEventListener('click', handleResume);
  elements.restart.addEventListener('click', handleRestart);
  syncShellValues();
  syncState('IDLE');
  syncShellValues();

  return () => {
    clearIntroTimeout();
    elements.start.removeEventListener('click', handleStart);
    elements.resume.removeEventListener('click', handleResume);
    elements.restart.removeEventListener('click', handleRestart);
  };
};
