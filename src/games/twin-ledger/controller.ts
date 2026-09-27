const GAME_STATES = ['IDLE', 'TURN', 'RESOLVING', 'FEEDBACK', 'PAUSED', 'RESULT'] as const;

export const createTwinLedgerController = (root: HTMLElement): (() => void) => {
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-panel]'));
  const panelNames = panels.map((panel) => panel.dataset.panel);
  const validPanels = panels.length === GAME_STATES.length
    && GAME_STATES.every((state) => panelNames.filter((name) => name === state).length === 1)
    && panelNames.every((name) => name && GAME_STATES.includes(name as typeof GAME_STATES[number]));

  if (!validPanels) throw new Error('Twin Ledger shell must contain each of its six state panels exactly once.');

  root.dataset.state = 'IDLE';
  panels.forEach((panel) => {
    panel.hidden = panel.dataset.panel !== 'IDLE';
  });

  return () => {
    panels.forEach((panel) => {
      panel.hidden = false;
    });
  };
};
