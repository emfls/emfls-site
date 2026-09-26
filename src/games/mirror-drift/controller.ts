import { STAGE_INTRO_MS, TOTAL_STAGES } from './types';
import type { GameState } from './types';

const panelStates = ['IDLE', 'STAGE_INTRO', 'FAIL_FEEDBACK', 'CLEAR_FEEDBACK', 'PAUSED', 'RESULT'] as const;

type Elements = {
  panels: NodeListOf<HTMLElement>;
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
  const stage = root.querySelector<HTMLElement>('[data-stage]');
  const score = root.querySelector<HTMLElement>('[data-score]');
  const strikes = root.querySelector<HTMLElement>('[data-strikes]');
  const time = root.querySelector<HTMLElement>('[data-time]');
  const stageIntro = root.querySelector<HTMLElement>('[data-stage-intro]');
  const start = root.querySelector<HTMLButtonElement>('[data-action="start"]');
  const resume = root.querySelector<HTMLButtonElement>('[data-action="resume"]');
  const restart = root.querySelector<HTMLButtonElement>('[data-action="restart"]');
  if (!validPanels || !stage || !score || !strikes || !time || !stageIntro || !start || !resume || !restart) {
    throw new Error('Mirror Drift shell is incomplete.');
  }
  return { panels, stage, score, strikes, time, stageIntro, start, resume, restart };
};

export const createMirrorDriftController = (root: HTMLElement) => {
  const elements = getElements(root);
  let currentState: GameState = 'IDLE';
  let currentStage = 1;
  let stageIntroTimeout: number | undefined;

  const clearStageIntro = () => {
    if (stageIntroTimeout !== undefined) window.clearTimeout(stageIntroTimeout);
    stageIntroTimeout = undefined;
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

  const enterStageIntro = () => {
    clearStageIntro();
    elements.stageIntro.textContent = `Stage ${currentStage}`;
    syncState('STAGE_INTRO');
    stageIntroTimeout = window.setTimeout(() => {
      stageIntroTimeout = undefined;
      syncState('ACTIVE');
    }, STAGE_INTRO_MS);
  };

  const handleStart = () => { if (currentState === 'IDLE') enterStageIntro(); };
  const handleResume = () => { if (currentState === 'PAUSED') enterStageIntro(); };
  const handleRestart = () => {
    if (currentState !== 'RESULT') return;
    currentStage = 1;
    updateHud();
    enterStageIntro();
  };

  elements.start.addEventListener('click', handleStart);
  elements.resume.addEventListener('click', handleResume);
  elements.restart.addEventListener('click', handleRestart);
  updateHud();
  syncState('IDLE');

  return () => {
    clearStageIntro();
    elements.start.removeEventListener('click', handleStart);
    elements.resume.removeEventListener('click', handleResume);
    elements.restart.removeEventListener('click', handleRestart);
  };
};
