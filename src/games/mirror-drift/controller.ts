import { MIRROR_DRIFT_STAGES } from './stages';
import { assertValidStageDefinitions, areBothDotsInsideTargets, checkMirroredMovementCollision } from './geometry';
import { formatRemainingTime, getRemainingMs, updateTargetHold } from './logic';
import { createMirrorDriftRenderer } from './renderer';
import { createMirrorDriftInput } from './input';
import type { DragMoveCandidate } from './input';
import { STAGE_INTRO_MS, TOTAL_STAGES } from './types';
import type { GameState, Vec2 } from './types';

const panelStates = ['IDLE', 'STAGE_INTRO', 'FAIL_FEEDBACK', 'CLEAR_FEEDBACK', 'PAUSED', 'RESULT'] as const;

type Elements = {
  panels: NodeListOf<HTMLElement>;
  canvas: HTMLCanvasElement;
  stage: HTMLElement;
  score: HTMLElement;
  strikes: HTMLElement;
  time: HTMLElement;
  stageIntro: HTMLElement;
  start: HTMLButtonElement;
  resume: HTMLButtonElement;
  restart: HTMLButtonElement;
};

const getElements = (root: HTMLElement): Elements => {
  const panels = root.querySelectorAll<HTMLElement>('[data-panel]');
  const actualPanels = Array.from(panels, (panel) => panel.dataset.panel);
  const validPanels = panels.length === panelStates.length
    && panelStates.every((state) => actualPanels.filter((value) => value === state).length === 1)
    && actualPanels.every((state) => state && panelStates.includes(state as typeof panelStates[number]));
  const canvas = root.querySelector<HTMLCanvasElement>('[data-game-canvas]');
  const stage = root.querySelector<HTMLElement>('[data-stage]');
  const score = root.querySelector<HTMLElement>('[data-score]');
  const strikes = root.querySelector<HTMLElement>('[data-strikes]');
  const time = root.querySelector<HTMLElement>('[data-time]');
  const stageIntro = root.querySelector<HTMLElement>('[data-stage-intro]');
  const start = root.querySelector<HTMLButtonElement>('[data-action="start"]');
  const resume = root.querySelector<HTMLButtonElement>('[data-action="resume"]');
  const restart = root.querySelector<HTMLButtonElement>('[data-action="restart"]');
  if (!validPanels || !canvas || !stage || !score || !strikes || !time || !stageIntro || !start || !resume || !restart) {
    throw new Error('Mirror Drift shell is incomplete.');
  }
  return { panels, canvas, stage, score, strikes, time, stageIntro, start, resume, restart };
};

export const createMirrorDriftController = (root: HTMLElement) => {
  assertValidStageDefinitions(MIRROR_DRIFT_STAGES);
  const elements = getElements(root);
  const renderer = createMirrorDriftRenderer(elements.canvas, root);
  let currentState: GameState = 'IDLE';
  let currentStage = 1;
  let currentPositionA: Vec2 = { ...MIRROR_DRIFT_STAGES[0].startA };
  let stageIntroTimeout: number | undefined;
  let animationFrame: number | undefined;
  let attemptStartTimestamp: number | undefined;
  let targetHold: ReturnType<typeof updateTargetHold> | undefined;
  let input: ReturnType<typeof createMirrorDriftInput>;

  const activeStage = () => MIRROR_DRIFT_STAGES[currentStage - 1];

  const clearStageIntro = () => {
    if (stageIntroTimeout !== undefined) window.clearTimeout(stageIntroTimeout);
    stageIntroTimeout = undefined;
  };

  const clearAnimation = () => {
    if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame);
    animationFrame = undefined;
    attemptStartTimestamp = undefined;
  };

  const syncState = (state: GameState) => {
    currentState = state;
    root.dataset.state = state;
    elements.panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== state; });
  };

  const updateHud = () => {
    elements.stage.textContent = `${currentStage} / ${TOTAL_STAGES}`;
    elements.score.textContent = '0';
    elements.strikes.textContent = '0';
    elements.time.textContent = '—';
  };

  const prepareStage = () => {
    const stage = activeStage();
    currentPositionA = { ...stage.startA };
    targetHold = undefined;
    elements.time.textContent = formatRemainingTime(stage.timeLimitMs);
    renderer.render({ stage, positionA: currentPositionA, holdProgress: 0 });
  };

  const animate = (timestamp: number) => {
    if (currentState !== 'ACTIVE' || attemptStartTimestamp === undefined) return;
    const stage = activeStage();
    const elapsedMs = Math.max(0, timestamp - attemptStartTimestamp);
    const remainingMs = getRemainingMs(stage.timeLimitMs, elapsedMs);
    elements.time.textContent = formatRemainingTime(remainingMs);
    targetHold = updateTargetHold(targetHold, areBothDotsInsideTargets(currentPositionA, stage.targetA), timestamp);
    renderer.render({ stage, positionA: currentPositionA, holdProgress: targetHold.progress });
    if (remainingMs > 0) animationFrame = window.requestAnimationFrame(animate);
  };

  const enterActive = () => {
    clearAnimation();
    attemptStartTimestamp = performance.now();
    targetHold = undefined;
    syncState('ACTIVE');
    animationFrame = window.requestAnimationFrame(animate);
  };

  const enterStageIntro = () => {
    clearStageIntro();
    clearAnimation();
    input?.cancelPointer();
    prepareStage();
    elements.stageIntro.textContent = `Stage ${currentStage}`;
    syncState('STAGE_INTRO');
    stageIntroTimeout = window.setTimeout(() => {
      stageIntroTimeout = undefined;
      enterActive();
    }, STAGE_INTRO_MS);
  };

  const handleStart = () => { if (currentState === 'IDLE') enterStageIntro(); };
  const handleResume = () => { if (currentState === 'PAUSED') enterStageIntro(); };
  const handleMove = (candidate: DragMoveCandidate) => {
    if (currentState !== 'ACTIVE') return;
    const stage = activeStage();
    if (checkMirroredMovementCollision(currentPositionA, candidate.desiredA, stage.obstacles).collided) return;
    currentPositionA = candidate.desiredA;
    renderer.render({ stage, positionA: currentPositionA, holdProgress: targetHold?.progress ?? 0 });
  };
  const handleInputCancel = () => { if (currentState === 'ACTIVE') enterStageIntro(); };
  const handleRestart = () => {
    if (currentState !== 'RESULT') return;
    currentStage = 1;
    updateHud();
    enterStageIntro();
  };

  elements.start.addEventListener('click', handleStart);
  elements.resume.addEventListener('click', handleResume);
  elements.restart.addEventListener('click', handleRestart);
  input = createMirrorDriftInput({
    canvas: elements.canvas,
    isEnabled: () => currentState === 'ACTIVE' && document.visibilityState === 'visible',
    getPositionA: () => currentPositionA,
    onMove: handleMove,
    onCancel: handleInputCancel,
  });
  const handleVisibilityChange = () => {
    if (document.visibilityState !== 'hidden' || (currentState !== 'ACTIVE' && currentState !== 'STAGE_INTRO')) return;
    clearStageIntro();
    clearAnimation();
    input.cancelPointer();
    targetHold = undefined;
    syncState('PAUSED');
  };
  const handleViewportChange = () => {
    if (currentState === 'ACTIVE' && input.isDragging()) {
      input.cancelPointer();
      enterStageIntro();
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('resize', handleViewportChange);
  window.addEventListener('orientationchange', handleViewportChange);
  updateHud();
  syncState('IDLE');

  return () => {
    clearStageIntro();
    clearAnimation();
    renderer.destroy();
    input.destroy();
    elements.start.removeEventListener('click', handleStart);
    elements.resume.removeEventListener('click', handleResume);
    elements.restart.removeEventListener('click', handleRestart);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('resize', handleViewportChange);
    window.removeEventListener('orientationchange', handleViewportChange);
  };
};
