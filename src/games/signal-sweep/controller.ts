export const SIGNAL_SWEEP_STATES = Object.freeze([
  'IDLE',
  'RULE_PREVIEW',
  'ACTIVE',
  'ROUND_FEEDBACK',
  'PAUSED',
  'RESULT',
] as const);

export type SignalSweepState = (typeof SIGNAL_SWEEP_STATES)[number];

export const createSignalSweepController = (root: HTMLElement): void => {
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-panel]'));
  const actualStates = panels.map((panel) => panel.dataset.panel);

  if (
    panels.length !== SIGNAL_SWEEP_STATES.length ||
    SIGNAL_SWEEP_STATES.some((state) => actualStates.filter((actual) => actual === state).length !== 1)
  ) {
    throw new Error('Signal Sweep requires exactly one panel for each of its six states.');
  }

  root.dataset.state = 'IDLE';
  panels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== 'IDLE';
  });
};
