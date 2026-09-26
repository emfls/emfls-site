import { MIRROR_DRIFT_STAGES } from './stages';
import { assertValidStageDefinitions, areBothDotsInsideTargets, checkMirroredMovementCollision } from './geometry';
import { applyStageClearToSession, calculateStageScore, createInitialSessionStats, formatFastestClear, formatRemainingTime, getRemainingMs, resolveClearDeadline, resolveFailureReason, updateTargetHold } from './logic';
import { createMirrorDriftRenderer } from './renderer';
import { createMirrorDriftInput } from './input';
import type { DragMoveCandidate } from './input';
import { getImprovedBestStats, loadBestStats, saveBestStats } from './storage';
import { CLEAR_FEEDBACK_MS, FAIL_FEEDBACK_MS, STAGE_INTRO_MS, TARGET_HOLD_MS, TOTAL_STAGES } from './types';
import type { BestStats, FailureReason, GameState, SessionStats, StageClearSnapshot, Vec2 } from './types';

const panelStates = ['IDLE', 'STAGE_INTRO', 'FAIL_FEEDBACK', 'CLEAR_FEEDBACK', 'PAUSED', 'RESULT'] as const;

type Elements = {
  panels: NodeListOf<HTMLElement>;
  canvas: HTMLCanvasElement;
  stage: HTMLElement;
  score: HTMLElement;
  strikes: HTMLElement;
  time: HTMLElement;
  stageIntro: HTMLElement;
  failFeedback: HTMLElement;
  stageScore: HTMLElement;
  resultScore: HTMLElement;
  resultStrikes: HTMLElement;
  resultFastestClear: HTMLElement;
  resultBestScore: HTMLElement;
  resultFewestStrikes: HTMLElement;
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
  const failFeedback = root.querySelector<HTMLElement>('[data-feedback="fail"]');
  const stageScore = root.querySelector<HTMLElement>('[data-stage-score]');
  const resultScore = root.querySelector<HTMLElement>('[data-result="score"]');
  const resultStrikes = root.querySelector<HTMLElement>('[data-result="strikes"]');
  const resultFastestClear = root.querySelector<HTMLElement>('[data-result="fastest-clear"]');
  const resultBestScore = root.querySelector<HTMLElement>('[data-result="best-score"]');
  const resultFewestStrikes = root.querySelector<HTMLElement>('[data-result="fewest-strikes"]');
  const start = root.querySelector<HTMLButtonElement>('[data-action="start"]');
  const resume = root.querySelector<HTMLButtonElement>('[data-action="resume"]');
  const restart = root.querySelector<HTMLButtonElement>('[data-action="restart"]');
  if (!validPanels || !canvas || !stage || !score || !strikes || !time || !stageIntro || !failFeedback || !stageScore || !resultScore || !resultStrikes || !resultFastestClear || !resultBestScore || !resultFewestStrikes || !start || !resume || !restart) {
    throw new Error('Mirror Drift shell is incomplete.');
  }
  return { panels, canvas, stage, score, strikes, time, stageIntro, failFeedback, stageScore, resultScore, resultStrikes, resultFastestClear, resultBestScore, resultFewestStrikes, start, resume, restart };
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
  let attemptDeadlineTimestamp: number | undefined;
  let targetHold: ReturnType<typeof updateTargetHold> | undefined;
  let input: ReturnType<typeof createMirrorDriftInput>;
  let stageStrikes = 0;
  let sessionStats: SessionStats = createInitialSessionStats();
  let bestStats: BestStats = loadBestStats();
  let feedbackTimeout: number | undefined;
  let clearSnapshot: StageClearSnapshot | undefined;
  let pauseContinuation: 'RESTART_STAGE' | 'AFTER_CLEAR' | undefined;

  const activeStage = () => MIRROR_DRIFT_STAGES[currentStage - 1];

  const clearStageIntro = () => {
    if (stageIntroTimeout !== undefined) window.clearTimeout(stageIntroTimeout);
    stageIntroTimeout = undefined;
  };

  const clearFeedback = () => {
    if (feedbackTimeout !== undefined) window.clearTimeout(feedbackTimeout);
    feedbackTimeout = undefined;
  };

  const clearAnimation = () => {
    if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame);
    animationFrame = undefined;
    attemptStartTimestamp = undefined;
    attemptDeadlineTimestamp = undefined;
  };

  const syncState = (state: GameState) => {
    currentState = state;
    root.dataset.state = state;
    elements.panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== state; });
  };

  const updateHud = () => {
    elements.stage.textContent = `${currentStage} / ${TOTAL_STAGES}`;
    elements.score.textContent = String(sessionStats.score);
    elements.strikes.textContent = String(sessionStats.totalStrikes);
    elements.time.textContent = '—';
  };

  const updateResult = () => {
    elements.resultScore.textContent = String(sessionStats.score);
    elements.resultStrikes.textContent = String(sessionStats.totalStrikes);
    elements.resultFastestClear.textContent = formatFastestClear(sessionStats.fastestClearMs);
    elements.resultBestScore.textContent = String(bestStats.score);
    elements.resultFewestStrikes.textContent = bestStats.fewestStrikes === null ? '—' : String(bestStats.fewestStrikes);
  };

  const prepareStage = () => {
    const stage = activeStage();
    currentPositionA = { ...stage.startA };
    targetHold = undefined;
    elements.stageScore.textContent = '—';
    elements.time.textContent = formatRemainingTime(stage.timeLimitMs);
    renderer.render({ stage, positionA: currentPositionA, holdProgress: 0 });
  };

  const animate = (timestamp: number) => {
    if (currentState !== 'ACTIVE' || attemptStartTimestamp === undefined) return;
    const stage = activeStage();
    const deadlineTimestamp = attemptDeadlineTimestamp ?? attemptStartTimestamp + stage.timeLimitMs;
    const elapsedMs = Math.max(0, timestamp - attemptStartTimestamp);
    const remainingMs = getRemainingMs(stage.timeLimitMs, elapsedMs);
    elements.time.textContent = formatRemainingTime(remainingMs);
    targetHold = updateTargetHold(targetHold, areBothDotsInsideTargets(currentPositionA, stage.targetA), timestamp);
    if (targetHold.complete && targetHold.startedAt !== undefined) {
      const clearTimestamp = targetHold.startedAt + TARGET_HOLD_MS;
      if (resolveClearDeadline(clearTimestamp, deadlineTimestamp) === 'CLEAR') {
        commitStageClear(clearTimestamp);
        return;
      }
    }
    if (timestamp >= deadlineTimestamp) {
      failAttempt('TIMEOUT');
      return;
    }
    renderer.render({ stage, positionA: currentPositionA, holdProgress: targetHold.progress });
    animationFrame = window.requestAnimationFrame(animate);
  };

  const enterActive = () => {
    clearAnimation();
    attemptStartTimestamp = performance.now();
    attemptDeadlineTimestamp = attemptStartTimestamp + activeStage().timeLimitMs;
    targetHold = undefined;
    syncState('ACTIVE');
    animationFrame = window.requestAnimationFrame(animate);
  };

  const enterStageIntro = () => {
    clearStageIntro();
    clearFeedback();
    clearAnimation();
    input?.cancelPointer();
    clearSnapshot = undefined;
    pauseContinuation = undefined;
    prepareStage();
    elements.stageIntro.textContent = `Stage ${currentStage}`;
    syncState('STAGE_INTRO');
    stageIntroTimeout = window.setTimeout(() => {
      stageIntroTimeout = undefined;
      enterActive();
    }, STAGE_INTRO_MS);
  };

  const handleStart = () => { if (currentState === 'IDLE') enterStageIntro(); };
  const handleResume = () => {
    if (currentState !== 'PAUSED') return;
    if (pauseContinuation === 'AFTER_CLEAR') {
      finishClearContinuation();
      return;
    }
    enterStageIntro();
  };
  const handleMove = (candidate: DragMoveCandidate) => {
    if (currentState !== 'ACTIVE' || attemptDeadlineTimestamp === undefined) return;
    const stage = activeStage();
    const now = performance.now();
    const candidateTimestamp = Math.abs(candidate.timestamp - now) <= 60_000 ? candidate.timestamp : now;
    const failureReason = resolveFailureReason(
      checkMirroredMovementCollision(currentPositionA, candidate.desiredA, stage.obstacles).collided,
      candidateTimestamp,
      attemptDeadlineTimestamp,
    );
    if (failureReason) {
      failAttempt(failureReason);
      return;
    }
    currentPositionA = candidate.desiredA;
    renderer.render({ stage, positionA: currentPositionA, holdProgress: targetHold?.progress ?? 0 });
  };
  const handleInputCancel = () => { if (currentState === 'ACTIVE') enterStageIntro(); };
  const handleRestart = () => {
    if (currentState !== 'RESULT') return;
    currentStage = 1;
    stageStrikes = 0;
    sessionStats = createInitialSessionStats();
    clearSnapshot = undefined;
    pauseContinuation = undefined;
    updateHud();
    updateResult();
    enterStageIntro();
  };

  const failAttempt = (reason: FailureReason) => {
    if (currentState !== 'ACTIVE') return;
    clearAnimation();
    input.cancelPointer();
    targetHold = undefined;
    stageStrikes += 1;
    sessionStats = { ...sessionStats, totalStrikes: sessionStats.totalStrikes + 1 };
    updateHud();
    elements.failFeedback.textContent = reason === 'COLLISION' ? 'Hit' : 'Time';
    syncState('FAIL_FEEDBACK');
    clearFeedback();
    feedbackTimeout = window.setTimeout(() => {
      feedbackTimeout = undefined;
      enterStageIntro();
    }, FAIL_FEEDBACK_MS);
  };

  const commitStageClear = (clearTimestamp: number) => {
    if (currentState !== 'ACTIVE' || attemptStartTimestamp === undefined || attemptDeadlineTimestamp === undefined) return;
    if (resolveClearDeadline(clearTimestamp, attemptDeadlineTimestamp) === 'TIMEOUT') {
      failAttempt('TIMEOUT');
      return;
    }
    const elapsedMs = Math.max(0, clearTimestamp - attemptStartTimestamp);
    const remainingMs = Math.max(0, attemptDeadlineTimestamp - clearTimestamp);
    const stageScore = calculateStageScore(remainingMs, stageStrikes);
    clearAnimation();
    input.cancelPointer();
    targetHold = undefined;
    clearSnapshot = { stage: currentStage, stageScore, remainingMs, elapsedMs };
    sessionStats = applyStageClearToSession(sessionStats, stageScore, elapsedMs);
    updateHud();
    elements.stageScore.textContent = `+${stageScore}`;
    syncState('CLEAR_FEEDBACK');
    clearFeedback();
    feedbackTimeout = window.setTimeout(() => {
      feedbackTimeout = undefined;
      finishClearContinuation();
    }, CLEAR_FEEDBACK_MS);
  };

  const finishClearContinuation = () => {
    if (!clearSnapshot) {
      enterStageIntro();
      return;
    }
    clearSnapshot = undefined;
    pauseContinuation = undefined;
    if (currentStage < TOTAL_STAGES) {
      currentStage += 1;
      stageStrikes = 0;
      updateHud();
      enterStageIntro();
      return;
    }
    bestStats = getImprovedBestStats(bestStats, sessionStats);
    saveBestStats(bestStats);
    updateResult();
    syncState('RESULT');
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
    if (document.visibilityState !== 'hidden') return;
    if (currentState === 'ACTIVE') {
      clearAnimation();
      input.cancelPointer();
      targetHold = undefined;
      pauseContinuation = 'RESTART_STAGE';
    } else if (currentState === 'STAGE_INTRO') {
      clearStageIntro();
      pauseContinuation = 'RESTART_STAGE';
    } else if (currentState === 'FAIL_FEEDBACK') {
      clearFeedback();
      pauseContinuation = 'RESTART_STAGE';
    } else if (currentState === 'CLEAR_FEEDBACK') {
      clearFeedback();
      pauseContinuation = 'AFTER_CLEAR';
    } else {
      return;
    }
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
  updateResult();
  syncState('IDLE');

  return () => {
    clearStageIntro();
    clearFeedback();
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
