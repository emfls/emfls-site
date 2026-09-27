const GAME_STATES = ['IDLE', 'COUNTDOWN', 'ACTIVE', 'PAUSED', 'HIT_FEEDBACK', 'RESULT'] as const;

type GameState = typeof GAME_STATES[number];

export type OrbitSlipControllerOptions = Readonly<{
  seed?: number;
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
}>;

type Elements = {
  panels: NodeListOf<HTMLElement>;
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

  return { panels, countdown, hudScore, hudTime, hudGates, resultScore, resultSurvivalTime, resultGatesPassed, resultBestScore, resultBestTime, start, resume, playAgain };
};

export const createOrbitSlipController = (
  root: HTMLElement,
  _options: OrbitSlipControllerOptions = {},
): (() => void) => {
  const elements = getElements(root);
  let currentState: GameState = 'IDLE';
  let countdownValue = 0;
  let countdownTimer: number | undefined;
  let destroyed = false;

  const setState = (state: GameState) => {
    currentState = state;
    root.dataset.state = state;
    elements.panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== state;
    });
  };

  const resetNeutralValues = () => {
    elements.hudScore.textContent = '0';
    elements.hudTime.textContent = '0.0 s';
    elements.hudGates.textContent = '0';
    elements.resultScore.textContent = '0';
    elements.resultSurvivalTime.textContent = '0.0 s';
    elements.resultGatesPassed.textContent = '0';
    elements.resultBestScore.textContent = '0';
    elements.resultBestTime.textContent = '0.0 s';
  };

  const scheduleCountdownStep = () => {
    countdownTimer = window.setTimeout(() => {
      countdownTimer = undefined;
      if (destroyed || currentState !== 'COUNTDOWN') return;
      if (countdownValue > 1) {
        countdownValue -= 1;
        elements.countdown.textContent = String(countdownValue);
        scheduleCountdownStep();
        return;
      }
      countdownValue = 0;
      setState('ACTIVE');
    }, 1000);
  };

  const beginCountdown = () => {
    if (destroyed || currentState === 'COUNTDOWN' || countdownTimer !== undefined) return;
    countdownValue = 3;
    elements.countdown.textContent = '3';
    setState('COUNTDOWN');
    scheduleCountdownStep();
  };

  const onStart = () => {
    if (currentState !== 'IDLE') return;
    resetNeutralValues();
    beginCountdown();
  };

  const onResume = () => {
    if (currentState !== 'PAUSED') return;
    beginCountdown();
  };

  const onPlayAgain = () => {
    if (currentState !== 'RESULT') return;
    resetNeutralValues();
    beginCountdown();
  };

  elements.start.addEventListener('click', onStart);
  elements.resume.addEventListener('click', onResume);
  elements.playAgain.addEventListener('click', onPlayAgain);
  setState('IDLE');
  resetNeutralValues();

  return () => {
    if (destroyed) return;
    destroyed = true;
    if (countdownTimer !== undefined) window.clearTimeout(countdownTimer);
    countdownTimer = undefined;
    elements.start.removeEventListener('click', onStart);
    elements.resume.removeEventListener('click', onResume);
    elements.playAgain.removeEventListener('click', onPlayAgain);
  };
};
