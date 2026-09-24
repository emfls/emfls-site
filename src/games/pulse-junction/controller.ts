import type { GameState } from './types';
import { COUNTDOWN_STEP_MS } from './types';

const panelStates = ['IDLE', 'COUNTDOWN', 'FEEDBACK', 'PAUSED', 'RESULT'] as const;

type ControllerElements = {
  countdown: HTMLElement;
  panels: NodeListOf<HTMLElement>;
  start: HTMLButtonElement;
  resume: HTMLButtonElement;
  restart: HTMLButtonElement;
};

const getElements = (root: HTMLElement): ControllerElements => {
  const countdown = root.querySelector<HTMLElement>('[data-countdown]');
  const panels = root.querySelectorAll<HTMLElement>('[data-panel]');
  const start = root.querySelector<HTMLButtonElement>('[data-action="start"]');
  const resume = root.querySelector<HTMLButtonElement>('[data-action="resume"]');
  const restart = root.querySelector<HTMLButtonElement>('[data-action="restart"]');
  const actualPanelStates = Array.from(panels, (panel) => panel.dataset.panel);
  const hasExpectedPanels = panelStates.every((state) => actualPanelStates.filter((value) => value === state).length === 1);
  const hasOnlyExpectedPanels = actualPanelStates.every((state) => state && panelStates.includes(state as typeof panelStates[number]));
  if (!countdown || !start || !resume || !restart || panels.length !== panelStates.length || !hasExpectedPanels || !hasOnlyExpectedPanels) {
    throw new Error('Pulse Junction state shell is incomplete.');
  }
  return { countdown, panels, start, resume, restart };
};

export const createPulseJunctionController = (root: HTMLElement) => {
  const elements = getElements(root);
  let currentState: GameState = 'IDLE';
  let countdownTimer: number | undefined;

  const clearCountdown = () => {
    if (countdownTimer !== undefined) window.clearTimeout(countdownTimer);
    countdownTimer = undefined;
  };

  const syncState = (state: GameState) => {
    currentState = state;
    root.dataset.state = state;
    elements.panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== state; });
  };

  const enterActive = () => {
    countdownTimer = undefined;
    syncState('ACTIVE');
  };

  const startCountdown = () => {
    if (currentState !== 'IDLE' && currentState !== 'PAUSED' && currentState !== 'RESULT') return;
    clearCountdown();
    syncState('COUNTDOWN');
    let step = 3;
    elements.countdown.textContent = String(step);
    const advance = () => {
      step -= 1;
      if (step === 0) { enterActive(); return; }
      elements.countdown.textContent = String(step);
      countdownTimer = window.setTimeout(advance, COUNTDOWN_STEP_MS);
    };
    countdownTimer = window.setTimeout(advance, COUNTDOWN_STEP_MS);
  };

  const handleResume = () => { if (currentState === 'PAUSED') startCountdown(); };
  const handleRestart = () => { if (currentState === 'RESULT') startCountdown(); };
  const handleStart = () => { if (currentState === 'IDLE') startCountdown(); };

  elements.start.addEventListener('click', handleStart);
  elements.resume.addEventListener('click', handleResume);
  elements.restart.addEventListener('click', handleRestart);
  syncState('IDLE');

  return () => {
    clearCountdown();
    elements.start.removeEventListener('click', handleStart);
    elements.resume.removeEventListener('click', handleResume);
    elements.restart.removeEventListener('click', handleRestart);
  };
};
