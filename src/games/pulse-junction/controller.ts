import type { GameState } from './types';
import { COUNTDOWN_STEP_MS, FEEDBACK_DURATION_MS, PULSE_END_RADIUS, TOTAL_ROUNDS } from './types';
import { getPulseMotionAtElapsed } from './logic';
import { generateRoundConfig } from './rng';
import type { RandomSource, RoundConfig } from './rng';
import { createPulseJunctionRenderer } from './renderer';

const panelStates = ['IDLE', 'COUNTDOWN', 'FEEDBACK', 'PAUSED', 'RESULT'] as const;

type ControllerElements = {
  countdown: HTMLElement;
  panels: NodeListOf<HTMLElement>;
  start: HTMLButtonElement;
  resume: HTMLButtonElement;
  restart: HTMLButtonElement;
  round: HTMLElement;
  feedback: HTMLElement;
  canvas: HTMLCanvasElement;
};

const getElements = (root: HTMLElement): ControllerElements => {
  const countdown = root.querySelector<HTMLElement>('[data-countdown]');
  const panels = root.querySelectorAll<HTMLElement>('[data-panel]');
  const start = root.querySelector<HTMLButtonElement>('[data-action="start"]');
  const resume = root.querySelector<HTMLButtonElement>('[data-action="resume"]');
  const restart = root.querySelector<HTMLButtonElement>('[data-action="restart"]');
  const round = root.querySelector<HTMLElement>('[data-round]');
  const feedback = root.querySelector<HTMLElement>('[data-feedback]');
  const canvas = root.querySelector<HTMLCanvasElement>('[data-game-canvas]');
  const actualPanelStates = Array.from(panels, (panel) => panel.dataset.panel);
  const hasExpectedPanels = panelStates.every((state) => actualPanelStates.filter((value) => value === state).length === 1);
  const hasOnlyExpectedPanels = actualPanelStates.every((state) => state && panelStates.includes(state as typeof panelStates[number]));
  if (!countdown || !start || !resume || !restart || !round || !feedback || !canvas || panels.length !== panelStates.length || !hasExpectedPanels || !hasOnlyExpectedPanels) {
    throw new Error('Pulse Junction state shell is incomplete.');
  }
  return { countdown, panels, start, resume, restart, round, feedback, canvas };
};

export type PulseJunctionControllerOptions = { random?: RandomSource };

export const createPulseJunctionController = (root: HTMLElement, options: PulseJunctionControllerOptions = {}) => {
  const elements = getElements(root);
  const renderer = createPulseJunctionRenderer(elements.canvas, root);
  const random = options.random ?? Math.random;
  let currentState: GameState = 'IDLE';
  let currentRound = 1;
  let roundConfig: RoundConfig | undefined;
  let countdownTimer: number | undefined;
  let feedbackTimer: number | undefined;
  let animationFrame: number | undefined;
  let roundStartTimestamp: number | undefined;

  const clearCountdown = () => {
    if (countdownTimer !== undefined) window.clearTimeout(countdownTimer);
    countdownTimer = undefined;
  };

  const clearFeedback = () => {
    if (feedbackTimer !== undefined) window.clearTimeout(feedbackTimer);
    feedbackTimer = undefined;
  };

  const clearAnimation = () => {
    if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame);
    animationFrame = undefined;
    roundStartTimestamp = undefined;
  };

  const syncState = (state: GameState) => {
    currentState = state;
    root.dataset.state = state;
    elements.panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== state; });
  };

  const updateRound = () => { elements.round.textContent = `${currentRound} / ${TOTAL_ROUNDS}`; };

  const finishAutomaticMiss = () => {
    clearAnimation();
    syncState('FEEDBACK');
    elements.feedback.textContent = 'Miss';
    feedbackTimer = window.setTimeout(() => {
      feedbackTimer = undefined;
      if (currentRound >= TOTAL_ROUNDS) { syncState('RESULT'); return; }
      currentRound += 1;
      updateRound();
      enterActive();
    }, FEEDBACK_DURATION_MS);
  };

  const animateRound = (timestamp: number) => {
    if (currentState !== 'ACTIVE' || !roundConfig) return;
    roundStartTimestamp ??= timestamp;
    const elapsedSeconds = (timestamp - roundStartTimestamp) / 1000;
    const motion = getPulseMotionAtElapsed(roundConfig, elapsedSeconds);
    renderer.render({ pulseRadius: motion.radius, targetRadius: roundConfig.targetRadius, decoyRadii: roundConfig.decoyRadii });
    if (motion.radius >= PULSE_END_RADIUS) { finishAutomaticMiss(); return; }
    animationFrame = window.requestAnimationFrame(animateRound);
  };

  const enterActive = () => {
    clearFeedback();
    countdownTimer = undefined;
    roundConfig = generateRoundConfig(currentRound, random);
    roundStartTimestamp = undefined;
    syncState('ACTIVE');
    animationFrame = window.requestAnimationFrame(animateRound);
  };

  const startCountdown = () => {
    if (currentState !== 'IDLE' && currentState !== 'PAUSED' && currentState !== 'RESULT') return;
    clearCountdown();
    clearFeedback();
    clearAnimation();
    if (currentState === 'RESULT') { currentRound = 1; updateRound(); }
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
  updateRound();
  syncState('IDLE');

  return () => {
    clearCountdown();
    clearFeedback();
    clearAnimation();
    renderer.clear();
    elements.start.removeEventListener('click', handleStart);
    elements.resume.removeEventListener('click', handleResume);
    elements.restart.removeEventListener('click', handleRestart);
  };
};
