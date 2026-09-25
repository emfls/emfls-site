import type { BestStats, GameState, Judgement, RoundConfig, SessionStats } from './types';
import { COUNTDOWN_STEP_MS, FEEDBACK_DURATION_MS, PULSE_END_RADIUS, TOTAL_ROUNDS } from './types';
import { applyJudgementToStats, createInitialSessionStats, getPulseMotionAtElapsed } from './logic';
import { getPulseEndTimeSeconds, judgeRadii } from './logic';
import { generateRoundConfig } from './rng';
import type { RandomSource } from './rng';
import { createPulseJunctionRenderer } from './renderer';
import { createPulseJunctionInput } from './input';
import type { GameplayInputCandidate } from './input';
import { getImprovedBestStats, loadBestStats, saveBestStats } from './storage';

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
  score: HTMLElement;
  combo: HTMLElement;
  results: Record<'score' | 'perfect' | 'good' | 'miss' | 'maxCombo' | 'bestScore' | 'bestCombo', HTMLElement>;
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
  const score = root.querySelector<HTMLElement>('[data-score]');
  const combo = root.querySelector<HTMLElement>('[data-combo]');
  const resultElements = {
    score: root.querySelector<HTMLElement>('[data-result="score"]'),
    perfect: root.querySelector<HTMLElement>('[data-result="perfect"]'),
    good: root.querySelector<HTMLElement>('[data-result="good"]'),
    miss: root.querySelector<HTMLElement>('[data-result="miss"]'),
    maxCombo: root.querySelector<HTMLElement>('[data-result="max-combo"]'),
    bestScore: root.querySelector<HTMLElement>('[data-result="best-score"]'),
    bestCombo: root.querySelector<HTMLElement>('[data-result="best-combo"]'),
  };
  const actualPanelStates = Array.from(panels, (panel) => panel.dataset.panel);
  const hasExpectedPanels = panelStates.every((state) => actualPanelStates.filter((value) => value === state).length === 1);
  const hasOnlyExpectedPanels = actualPanelStates.every((state) => state && panelStates.includes(state as typeof panelStates[number]));
  if (!countdown || !start || !resume || !restart || !round || !feedback || !canvas || !score || !combo || Object.values(resultElements).some((element) => !element) || panels.length !== panelStates.length || !hasExpectedPanels || !hasOnlyExpectedPanels) {
    throw new Error('Pulse Junction state shell is incomplete.');
  }
  return { countdown, panels, start, resume, restart, round, feedback, canvas, score, combo, results: resultElements as ControllerElements['results'] };
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
  let roundEndTimestamp: number | undefined;
  let pendingInput: GameplayInputCandidate | undefined;
  let roundInputResolved = false;
  let reuseCurrentRoundConfig = false;
  let sessionStats: SessionStats = createInitialSessionStats();
  let bestStats: BestStats = loadBestStats();
  let pendingJudgement: Judgement | undefined;

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
    roundEndTimestamp = undefined;
  };

  const syncState = (state: GameState) => {
    currentState = state;
    root.dataset.state = state;
    elements.panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== state; });
  };

  const updateRound = () => { elements.round.textContent = `${currentRound} / ${TOTAL_ROUNDS}`; };

  const updateHud = () => {
    elements.score.textContent = String(sessionStats.score);
    elements.combo.textContent = String(sessionStats.combo);
  };

  const updateResult = () => {
    elements.results.score.textContent = String(sessionStats.score);
    elements.results.perfect.textContent = String(sessionStats.perfect);
    elements.results.good.textContent = String(sessionStats.good);
    elements.results.miss.textContent = String(sessionStats.miss);
    elements.results.maxCombo.textContent = String(sessionStats.maxCombo);
    elements.results.bestScore.textContent = String(bestStats.score);
    elements.results.bestCombo.textContent = String(bestStats.combo);
  };

  const resetSession = () => {
    sessionStats = createInitialSessionStats();
    pendingJudgement = undefined;
    updateHud();
    updateResult();
  };

  const commitPendingJudgement = () => {
    if (!pendingJudgement) return;
    sessionStats = applyJudgementToStats(sessionStats, pendingJudgement).stats;
    pendingJudgement = undefined;
    updateHud();
  };

  const finishJudgement = (judgement: Judgement) => {
    clearAnimation();
    pendingInput = undefined;
    pendingJudgement = judgement;
    roundInputResolved = true;
    syncState('FEEDBACK');
    elements.feedback.dataset.judgement = judgement.toLowerCase();
    elements.feedback.textContent = judgement === 'PERFECT' ? 'Perfect' : judgement === 'GOOD' ? 'Good' : 'Miss';
    feedbackTimer = window.setTimeout(() => {
      feedbackTimer = undefined;
      commitPendingJudgement();
      if (currentRound >= TOTAL_ROUNDS) {
        bestStats = getImprovedBestStats(bestStats, sessionStats);
        saveBestStats(bestStats);
        updateResult();
        syncState('RESULT');
        return;
      }
      currentRound += 1;
      updateRound();
      enterActive();
    }, FEEDBACK_DURATION_MS);
  };

  const finishAutomaticMiss = () => finishJudgement('MISS');

  const handleInput = (candidate: GameplayInputCandidate) => {
    if (currentState !== 'ACTIVE' || document.visibilityState === 'hidden' || roundInputResolved) return;
    if (!pendingInput || candidate.timestamp < pendingInput.timestamp) pendingInput = candidate;
  };

  const animateRound = (timestamp: number) => {
    if (currentState !== 'ACTIVE' || !roundConfig) return;
    if (pendingInput) {
      const candidate = pendingInput;
      pendingInput = undefined;
      if (roundEndTimestamp !== undefined && candidate.timestamp <= roundEndTimestamp) {
        const elapsedSeconds = (candidate.timestamp - (roundStartTimestamp ?? timestamp)) / 1000;
        const motion = getPulseMotionAtElapsed(roundConfig, Math.max(0, elapsedSeconds));
        finishJudgement(judgeRadii(motion.radius, roundConfig.targetRadius));
        return;
      }
      finishAutomaticMiss();
      return;
    }
    if (roundEndTimestamp !== undefined && timestamp >= roundEndTimestamp) { finishAutomaticMiss(); return; }
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
    if (!reuseCurrentRoundConfig || !roundConfig) roundConfig = generateRoundConfig(currentRound, random);
    reuseCurrentRoundConfig = false;
    roundStartTimestamp = performance.now();
    roundEndTimestamp = roundStartTimestamp + getPulseEndTimeSeconds(roundConfig) * 1000;
    pendingInput = undefined;
    roundInputResolved = false;
    syncState('ACTIVE');
    animationFrame = window.requestAnimationFrame(animateRound);
  };

  const startCountdown = () => {
    if (currentState !== 'IDLE' && currentState !== 'PAUSED' && currentState !== 'RESULT') return;
    clearCountdown();
    clearFeedback();
    clearAnimation();
    if (currentState === 'RESULT') { currentRound = 1; reuseCurrentRoundConfig = false; resetSession(); updateRound(); }
    if (currentState === 'PAUSED') reuseCurrentRoundConfig = true;
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
  const handleVisibilityChange = () => {
    if (document.visibilityState !== 'hidden' || (currentState !== 'ACTIVE' && currentState !== 'FEEDBACK')) return;
    clearAnimation();
    clearFeedback();
    pendingInput = undefined;
    pendingJudgement = undefined;
    delete elements.feedback.dataset.judgement;
    syncState('PAUSED');
  };

  elements.start.addEventListener('click', handleStart);
  elements.resume.addEventListener('click', handleResume);
  elements.restart.addEventListener('click', handleRestart);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  const input = createPulseJunctionInput({ canvas: elements.canvas, isEnabled: () => currentState === 'ACTIVE' && document.visibilityState === 'visible', onInput: handleInput });
  updateRound();
  updateHud();
  updateResult();
  syncState('IDLE');

  return () => {
    clearCountdown();
    clearFeedback();
    clearAnimation();
    pendingInput = undefined;
    pendingJudgement = undefined;
    input.destroy();
    renderer.destroy();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    renderer.clear();
    elements.start.removeEventListener('click', handleStart);
    elements.resume.removeEventListener('click', handleResume);
    elements.restart.removeEventListener('click', handleRestart);
  };
};
