import {
  MAX_RADIAL_SPEED,
  RADIUS_SENSITIVITY,
  SAFETY_MARGIN,
  START_RADIUS,
} from './constants.ts';
import { collidesWithGate } from './collision.ts';
import { maintainGateLookahead, removeSafelyPassedGates } from './generator.ts';
import { createOrbitSlipInput } from './input.ts';
import {
  advanceProgressAngle,
  capFrameDeltaMs,
  clampTargetRadius,
  moveRadiusTowardTarget,
  splitFrameDeltaMs,
} from './motion.ts';
import { createOrbitSlipRenderer } from './renderer.ts';
import { createSeededRandom, createSessionSeed } from './rng.ts';
import { updateBestStats } from './storage.ts';
import type { GameState, Gate, RandomSource } from './types.ts';

const GAME_STATES: readonly GameState[] = ['IDLE', 'COUNTDOWN', 'ACTIVE', 'PAUSED', 'HIT_FEEDBACK', 'RESULT'];

export type OrbitSlipCollisionSnapshot = Readonly<{
  seed: number;
  progressAngle: number;
  radius: number;
  activeMs: number;
  gatesPassed: number;
}>;

export type OrbitSlipControllerOptions = Readonly<{
  seed?: number;
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
  onCollision?: (snapshot: OrbitSlipCollisionSnapshot) => void;
}>;

type Elements = {
  panels: NodeListOf<HTMLElement>;
  canvas: HTMLCanvasElement;
  countdown: HTMLElement;
  hudScore: HTMLElement;
  hudTime: HTMLElement;
  hudGates: HTMLElement;
  resultScore: HTMLElement;
  resultSurvivalTime: HTMLElement;
  resultGatesPassed: HTMLElement;
  resultBestScore: HTMLElement;
  resultBestTime: HTMLElement;
  start: HTMLButtonElement;
  resume: HTMLButtonElement;
  playAgain: HTMLButtonElement;
};

export const calculateOrbitSlipScore = (activeMs: number, gatesPassed: number): number => {
  if (!Number.isFinite(activeMs) || activeMs < 0 || !Number.isSafeInteger(gatesPassed) || gatesPassed < 0) {
    throw new RangeError('Score inputs must be finite and non-negative.');
  }
  return Math.floor(activeMs / 100) + gatesPassed * 50;
};

export type OrbitSlipGateStepResult = Readonly<{
  collided: boolean;
  gates: readonly Gate[];
  newlyPassed: readonly Gate[];
}>;

export const resolveOrbitSlipGateStep = (progressAngle: number, radius: number, gates: readonly Gate[]): OrbitSlipGateStepResult => {
  if (gates.some((gate) => collidesWithGate(progressAngle, radius, gate))) {
    return { collided: true, gates, newlyPassed: [] };
  }
  const newlyPassed: Gate[] = [];
  const updatedGates = gates.map((gate) => {
    if (gate.passed || progressAngle <= gate.angleEnd + SAFETY_MARGIN) return gate;
    const passedGate = { ...gate, passed: true };
    newlyPassed.push(passedGate);
    return passedGate;
  });
  return { collided: false, gates: updatedGates, newlyPassed };
};

type RunSession = {
  seed: number;
  random: RandomSource;
  progressAngle: number;
  radius: number;
  targetRadius: number;
  activeMs: number;
  gatesPassed: number;
  gates: Gate[];
  history: Gate[];
  nextGateId: number;
};

const getElements = (root: HTMLElement): Elements => {
  const panels = root.querySelectorAll<HTMLElement>('[data-panel]');
  const panelNames = Array.from(panels, (panel) => panel.dataset.panel);
  const validPanels = panels.length === GAME_STATES.length
    && GAME_STATES.every((state) => panelNames.filter((value) => value === state).length === 1)
    && panelNames.every((state) => state && GAME_STATES.includes(state as GameState));
  const canvas = root.querySelector<HTMLCanvasElement>('[data-canvas]');
  const countdown = root.querySelector<HTMLElement>('[data-countdown]');
  const hudScore = root.querySelector<HTMLElement>('[data-hud-score]');
  const hudTime = root.querySelector<HTMLElement>('[data-hud-time]');
  const hudGates = root.querySelector<HTMLElement>('[data-hud-gates]');
  const resultScore = root.querySelector<HTMLElement>('[data-result="score"]');
  const resultSurvivalTime = root.querySelector<HTMLElement>('[data-result="survival-time"]');
  const resultGatesPassed = root.querySelector<HTMLElement>('[data-result="gates-passed"]');
  const resultBestScore = root.querySelector<HTMLElement>('[data-result="best-score"]');
  const resultBestTime = root.querySelector<HTMLElement>('[data-result="best-time"]');
  const start = root.querySelector<HTMLButtonElement>('[data-action="start"]');
  const resume = root.querySelector<HTMLButtonElement>('[data-action="resume"]');
  const playAgain = root.querySelector<HTMLButtonElement>('[data-action="play-again"]');

  if (!validPanels || root.querySelectorAll('canvas').length !== 1 || !canvas || !countdown || !hudScore || !hudTime || !hudGates || !resultScore || !resultSurvivalTime || !resultGatesPassed || !resultBestScore || !resultBestTime || !start || !resume || !playAgain) {
    throw new Error('Orbit Slip shell is incomplete.');
  }

  return { panels, canvas, countdown, hudScore, hudTime, hudGates, resultScore, resultSurvivalTime, resultGatesPassed, resultBestScore, resultBestTime, start, resume, playAgain };
};

export const createOrbitSlipController = (
  root: HTMLElement,
  options: OrbitSlipControllerOptions = {},
): (() => void) => {
  const elements = getElements(root);
  let currentState: GameState = 'IDLE';
  let session: RunSession | undefined;
  let animationFrame: number | undefined;
  let lastFrameTime: number | undefined;
  let countdownValue = 0;
  let countdownTimer: number | undefined;
  let hitFeedbackTimer: number | undefined;
  let countdownRemainingMs = 1000;
  let countdownDeadline = 0;
  let destroyed = false;
  let suppressResizePause = false;
  let injectedSeedUsed = false;

  const renderer = createOrbitSlipRenderer(elements.canvas, {
    onResize: () => {
      if (currentState === 'ACTIVE' && !suppressResizePause) pauseActiveRun();
    },
  });

  const input = createOrbitSlipInput(elements.canvas, {
    inputContext: root,
    isActive: () => currentState === 'ACTIVE',
    onRadialDelta: (normalizedDelta) => {
      if (!session || currentState !== 'ACTIVE') return;
      session.targetRadius = clampTargetRadius(session.targetRadius + normalizedDelta * RADIUS_SENSITIVITY);
    },
  });

  const setState = (state: GameState): void => {
    currentState = state;
    root.dataset.state = state;
    elements.panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== state;
    });
    if (state === 'ACTIVE') {
      input.clearKeys();
      suppressResizePause = true;
      renderer.resize();
      suppressResizePause = false;
      elements.canvas.focus();
    }
  };

  const resetNeutralValues = (): void => {
    elements.hudScore.textContent = '0';
    elements.hudTime.textContent = '0.0 s';
    elements.hudGates.textContent = '0';
    elements.resultScore.textContent = '0';
    elements.resultSurvivalTime.textContent = '0.0 s';
    elements.resultGatesPassed.textContent = '0';
    elements.resultBestScore.textContent = '0';
    elements.resultBestTime.textContent = '0.0 s';
  };

  const renderSession = (): void => {
    if (!session) return;
    renderer.render({ progressAngle: session.progressAngle, radius: session.radius, gates: session.gates });
  };

  const initializeSession = (): void => {
    const seed = options.seed !== undefined && !injectedSeedUsed ? options.seed : createSessionSeed();
    if (options.seed !== undefined) injectedSeedUsed = true;
    const random = createSeededRandom(seed);
    const initial: RunSession = {
      seed,
      random,
      progressAngle: 0,
      radius: START_RADIUS,
      targetRadius: START_RADIUS,
      activeMs: 0,
      gatesPassed: 0,
      gates: [],
      history: [],
      nextGateId: 1,
    };
    const planned = maintainGateLookahead(initial, random);
    session = { ...initial, gates: [...planned.gates], history: [...planned.history], nextGateId: planned.nextGateId };
    renderSession();
  };

  const enterActive = (): void => {
    if (destroyed || currentState !== 'COUNTDOWN' || document.hidden) return;
    countdownValue = 0;
    countdownRemainingMs = 1000;
    setState('ACTIVE');
    lastFrameTime = performance.now();
    scheduleFrame();
  };

  const scheduleCountdownStep = (): void => {
    if (destroyed || currentState !== 'COUNTDOWN' || document.hidden || countdownTimer !== undefined) return;
    const duration = Math.max(0, countdownRemainingMs);
    countdownDeadline = performance.now() + duration;
    countdownTimer = window.setTimeout(() => {
      countdownTimer = undefined;
      countdownRemainingMs = 0;
      if (destroyed || currentState !== 'COUNTDOWN') return;
      if (document.hidden) return;
      if (countdownValue > 1) {
        countdownValue -= 1;
        elements.countdown.textContent = String(countdownValue);
        countdownRemainingMs = 1000;
        scheduleCountdownStep();
        return;
      }
      enterActive();
    }, duration);
  };

  const freezeCountdown = (): void => {
    if (currentState !== 'COUNTDOWN' || countdownTimer === undefined) return;
    countdownRemainingMs = Math.max(0, countdownDeadline - performance.now());
    window.clearTimeout(countdownTimer);
    countdownTimer = undefined;
  };

  const beginCountdown = (): void => {
    if (destroyed || currentState === 'COUNTDOWN' || countdownTimer !== undefined) return;
    countdownValue = 3;
    countdownRemainingMs = 1000;
    elements.countdown.textContent = '3';
    setState('COUNTDOWN');
    scheduleCountdownStep();
  };

  const cancelAnimationFrame = (): void => {
    if (animationFrame === undefined) return;
    window.cancelAnimationFrame(animationFrame);
    animationFrame = undefined;
  };

  const commitCollision = (): void => {
    if (!session || currentState !== 'ACTIVE') return;
    cancelAnimationFrame();
    lastFrameTime = undefined;
    input.releasePointer();
    input.clearKeys();
    setState('HIT_FEEDBACK');
    hitFeedbackTimer = window.setTimeout(() => {
      hitFeedbackTimer = undefined;
      if (destroyed || currentState !== 'HIT_FEEDBACK' || !session) return;
      const score = calculateOrbitSlipScore(session.activeMs, session.gatesPassed);
      const best = updateBestStats(score, session.activeMs, options.storage);
      elements.resultScore.textContent = String(score);
      elements.resultSurvivalTime.textContent = `${(session.activeMs / 1000).toFixed(1)} s`;
      elements.resultGatesPassed.textContent = String(session.gatesPassed);
      elements.resultBestScore.textContent = String(best.bestScore);
      elements.resultBestTime.textContent = `${(best.bestTimeMs / 1000).toFixed(1)} s`;
      setState('RESULT');
    }, 400);
    options.onCollision?.({
      seed: session.seed,
      progressAngle: session.progressAngle,
      radius: session.radius,
      activeMs: session.activeMs,
      gatesPassed: session.gatesPassed,
    });
  };

  const simulateStep = (dtMs: number): boolean => {
    if (!session || currentState !== 'ACTIVE') return false;
    const dtSeconds = dtMs / 1000;
    const keyboardIntent = input.getKeyboardIntent();
    session.targetRadius = clampTargetRadius(session.targetRadius + keyboardIntent * MAX_RADIAL_SPEED * dtSeconds);
    const nextRadius = moveRadiusTowardTarget(session.radius, session.targetRadius, dtSeconds);
    const nextProgressAngle = advanceProgressAngle(session.progressAngle, session.activeMs, dtSeconds);
    const nextActiveMs = session.activeMs + dtMs;

    session.radius = nextRadius;
    session.progressAngle = nextProgressAngle;
    session.activeMs = nextActiveMs;
    const gateStep = resolveOrbitSlipGateStep(nextProgressAngle, nextRadius, session.gates);
    if (gateStep.collided) {
      renderSession();
      commitCollision();
      return false;
    }

    session.gates = [...gateStep.gates];
    session.gatesPassed += gateStep.newlyPassed.length;
    elements.hudGates.textContent = String(session.gatesPassed);
    elements.hudTime.textContent = `${(session.activeMs / 1000).toFixed(1)} s`;

    const planned = maintainGateLookahead(session, session.random);
    session.gates = removeSafelyPassedGates(nextProgressAngle, [...planned.gates]);
    session.history = [...planned.history];
    session.nextGateId = planned.nextGateId;
    elements.hudScore.textContent = String(calculateOrbitSlipScore(session.activeMs, session.gatesPassed));
    return true;
  };

  const onAnimationFrame = (now: number): void => {
    animationFrame = undefined;
    if (destroyed || currentState !== 'ACTIVE' || !session) return;
    const elapsed = lastFrameTime === undefined ? 0 : capFrameDeltaMs(now - lastFrameTime);
    lastFrameTime = now;
    for (const stepMs of splitFrameDeltaMs(elapsed)) {
      if (!simulateStep(stepMs)) break;
    }
    renderSession();
    if (currentState === 'ACTIVE') scheduleFrame();
  };

  function scheduleFrame(): void {
    if (destroyed || currentState !== 'ACTIVE' || animationFrame !== undefined) return;
    animationFrame = window.requestAnimationFrame(onAnimationFrame);
  }

  function pauseActiveRun(): void {
    if (currentState !== 'ACTIVE') return;
    cancelAnimationFrame();
    lastFrameTime = undefined;
    input.releasePointer();
    input.clearKeys();
    setState('PAUSED');
    renderSession();
  }

  const onStart = (): void => {
    if (currentState !== 'IDLE') return;
    resetNeutralValues();
    initializeSession();
    beginCountdown();
  };

  const onResume = (): void => {
    if (currentState !== 'PAUSED') return;
    beginCountdown();
  };

  const onPlayAgain = (): void => {
    if (currentState !== 'RESULT') return;
    resetNeutralValues();
    initializeSession();
    beginCountdown();
  };

  const onVisibilityChange = (): void => {
    if (document.hidden) {
      if (currentState === 'ACTIVE') pauseActiveRun();
      else if (currentState === 'COUNTDOWN') freezeCountdown();
      return;
    }
    if (currentState === 'COUNTDOWN') scheduleCountdownStep();
  };

  const onViewportChange = (): void => {
    renderer.resize();
    if (currentState === 'ACTIVE') pauseActiveRun();
    else if (currentState === 'PAUSED') renderSession();
  };

  const onWindowBlur = (): void => input.clearKeys();

  elements.start.addEventListener('click', onStart);
  elements.resume.addEventListener('click', onResume);
  elements.playAgain.addEventListener('click', onPlayAgain);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('resize', onViewportChange);
  window.addEventListener('orientationchange', onViewportChange);
  window.addEventListener('blur', onWindowBlur);
  setState('IDLE');
  resetNeutralValues();
  renderer.resize();

  return () => {
    if (destroyed) return;
    destroyed = true;
    if (countdownTimer !== undefined) window.clearTimeout(countdownTimer);
    countdownTimer = undefined;
    if (hitFeedbackTimer !== undefined) window.clearTimeout(hitFeedbackTimer);
    hitFeedbackTimer = undefined;
    cancelAnimationFrame();
    input.destroy();
    renderer.destroy();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('resize', onViewportChange);
    window.removeEventListener('orientationchange', onViewportChange);
    window.removeEventListener('blur', onWindowBlur);
    elements.start.removeEventListener('click', onStart);
    elements.resume.removeEventListener('click', onResume);
    elements.playAgain.removeEventListener('click', onPlayAgain);
  };
};
