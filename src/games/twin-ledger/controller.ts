import { FEEDBACK_MS, MAX_TURNS, RECENT_HISTORY_LIMIT, RESOLVING_MS, getHardLimit } from './constants.ts';
import { getPlacementSideForKey } from './input.ts';
import { calculateFinalScore, getEffectiveValue, resolvePlacement } from './logic.ts';
import { createSessionSeed } from './rng.ts';
import { generateSequence } from './sequence.ts';
import { loadBestStats, saveBestStats } from './storage.ts';
import type { GameSession, PlacementSide, Tile, Zone } from './types.ts';

const GAME_STATES = ['IDLE', 'TURN', 'RESOLVING', 'FEEDBACK', 'PAUSED', 'RESULT'] as const;

export const commitPlacement = (session: GameSession, side: PlacementSide): GameSession | null => {
  if (session.state !== 'TURN' || (side !== 'LEFT' && side !== 'RIGHT')) return null;
  if (!Number.isSafeInteger(session.turn) || session.turn < 0 || session.turn >= MAX_TURNS) return null;

  const tile = session.currentTile;
  if (!tile || tile.id !== session.sequence[session.turn]?.id) return null;

  const turn = session.turn + 1;
  const resolution = resolvePlacement({
    leftTotal: session.leftTotal,
    rightTotal: session.rightTotal,
    side,
    tile,
    turn,
    combo: session.combo,
    maxCombo: session.maxCombo,
    exactCount: session.exactCount,
    breachCount: session.breachCount,
    turnPoints: session.score,
  });
  const placement = {
    turn,
    tile,
    side,
    effectiveValue: resolution.effectiveValue,
    difference: resolution.difference,
    zone: resolution.zone,
    turnScore: resolution.turnScore,
    comboAfter: resolution.combo,
  };

  let best = session.best;
  let finalScore: number | null = null;
  let result: GameSession['result'] = null;
  if (turn === MAX_TURNS) {
    const final = calculateFinalScore(resolution.turnPoints, resolution.breachCount, resolution.difference);
    best = {
      bestScore: Math.max(session.best.bestScore, final.score),
      bestMaxCombo: Math.max(session.best.bestMaxCombo, resolution.maxCombo),
    };
    finalScore = final.score;
    result = {
      score: final.score,
      finalDifference: resolution.difference,
      exactCount: resolution.exactCount,
      breachCount: resolution.breachCount,
      maxCombo: resolution.maxCombo,
      bestScore: best.bestScore,
    };
  }

  return {
    ...session,
    state: 'RESOLVING',
    turn,
    leftTotal: resolution.leftTotal,
    rightTotal: resolution.rightTotal,
    difference: resolution.difference,
    zone: resolution.zone,
    combo: resolution.combo,
    maxCombo: resolution.maxCombo,
    exactCount: resolution.exactCount,
    breachCount: resolution.breachCount,
    score: resolution.turnPoints,
    finalScore,
    currentTile: session.sequence[turn] ?? null,
    nextTile: session.sequence[turn + 1] ?? null,
    lastPlacement: placement,
    recentHistory: [...session.recentHistory, placement].slice(-RECENT_HISTORY_LIMIT),
    best,
    result,
  };
};

export const pauseSession = (session: GameSession): GameSession => {
  if (session.state !== 'TURN' && session.state !== 'RESOLVING' && session.state !== 'FEEDBACK') return session;
  return { ...session, state: 'PAUSED' };
};

export const resumeSession = (session: GameSession): GameSession | null => {
  if (session.state !== 'PAUSED') return null;
  return { ...session, state: session.turn >= MAX_TURNS ? 'RESULT' : 'TURN' };
};

const INITIAL_SESSION: GameSession = {
  state: 'IDLE',
  seed: null,
  sequence: [],
  turn: 0,
  leftTotal: 0,
  rightTotal: 0,
  difference: 0,
  zone: 'EXACT',
  combo: 0,
  maxCombo: 0,
  breachCount: 0,
  exactCount: 0,
  score: 0,
  finalScore: null,
  currentTile: null,
  nextTile: null,
  lastPlacement: null,
  recentHistory: [],
  result: null,
  best: { bestScore: 0, bestMaxCombo: 0 },
};

const zoneLabel = (zone: Zone): string => `${zone[0]}${zone.slice(1).toLowerCase()}`;
const signedValue = (value: number): string => `${value < 0 ? '−' : '+'}${Math.abs(value)}`;

const formatTile = (tile: Tile): string => tile.weight === 2
  ? `${signedValue(tile.baseValue)} · HEAVY (×2 = ${signedValue(getEffectiveValue(tile))})`
  : signedValue(tile.baseValue);

const required = <T extends Element>(root: HTMLElement, selector: string): T => {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Twin Ledger shell is missing ${selector}.`);
  return element;
};

export const createTwinLedgerController = (root: HTMLElement): (() => void) => {
  const document = root.ownerDocument;
  const view = document.defaultView;
  if (!view) throw new Error('Twin Ledger requires a browser document.');

  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-panel]'));
  const panelNames = panels.map((panel) => panel.dataset.panel);
  const validPanels = panels.length === GAME_STATES.length
    && GAME_STATES.every((state) => panelNames.filter((name) => name === state).length === 1)
    && panelNames.every((name) => name && GAME_STATES.includes(name as typeof GAME_STATES[number]));
  if (!validPanels) throw new Error('Twin Ledger shell must contain each of its six state panels exactly once.');

  const turnValue = required<HTMLElement>(root, '[data-turn]');
  const differenceValue = required<HTMLElement>(root, '[data-difference]');
  const zoneValue = required<HTMLElement>(root, '[data-zone]');
  const scoreValue = required<HTMLElement>(root, '[data-score]');
  const comboValue = required<HTMLElement>(root, '[data-combo]');
  const leftTotalValue = required<HTMLElement>(root, '[data-left-total]');
  const rightTotalValue = required<HTMLElement>(root, '[data-right-total]');
  const currentTileValue = required<HTMLElement>(root, '[data-current-tile]');
  const nextTileValue = required<HTMLElement>(root, '[data-next-tile]');
  const nextLabel = required<HTMLElement>(root, '[data-next-label]');
  const hardLimitValue = required<HTMLElement>(root, '[data-hard-limit]');
  const balanceMeter = required<HTMLElement>(root, '[data-balance-meter]');
  const balanceTrack = required<HTMLElement>(root, '[data-balance-fill]');
  const historyList = required<HTMLOListElement>(root, '[data-recent-history]');
  const sessionError = required<HTMLElement>(root, '[data-session-error]');
  const feedbackDetail = required<HTMLElement>(root, '[data-feedback-detail]');
  const leftButton = required<HTMLButtonElement>(root, '[data-action="left"]');
  const rightButton = required<HTMLButtonElement>(root, '[data-action="right"]');
  const startButton = required<HTMLButtonElement>(root, '[data-action="start"]');
  const resumeButton = required<HTMLButtonElement>(root, '[data-action="resume"]');
  const playAgainButton = required<HTMLButtonElement>(root, '[data-action="play-again"]');
  const resultScore = required<HTMLElement>(root, '[data-result="score"]');
  const resultDifference = required<HTMLElement>(root, '[data-result="final-difference"]');
  const resultExactCount = required<HTMLElement>(root, '[data-result="exact-count"]');
  const resultBreachCount = required<HTMLElement>(root, '[data-result="breach-count"]');
  const resultMaxCombo = required<HTMLElement>(root, '[data-result="max-combo"]');
  const resultBestScore = required<HTMLElement>(root, '[data-result="best-score"]');

  let session: GameSession = { ...INITIAL_SESSION, best: loadBestStats() };
  let disposed = false;
  let placementLocked = false;
  let timerId: number | undefined;
  let timerVersion = 0;

  const clearPhaseTimer = (): void => {
    timerVersion += 1;
    if (timerId !== undefined) view.clearTimeout(timerId);
    timerId = undefined;
  };

  const schedulePhase = (delay: number, callback: () => void): void => {
    const version = timerVersion;
    timerId = view.setTimeout(() => {
      if (disposed || version !== timerVersion) return;
      timerId = undefined;
      callback();
    }, delay);
  };

  const renderHistory = (): void => {
    const entries = session.recentHistory.map((placement) => {
      const item = document.createElement('li');
      const side = placement.side === 'LEFT' ? 'Left' : 'Right';
      item.textContent = `Turn ${placement.turn} · ${side} · ${formatTile(placement.tile)} · Difference ${placement.difference} · ${zoneLabel(placement.zone)}`;
      return item;
    });
    if (entries.length === 0) {
      const empty = document.createElement('li');
      empty.textContent = 'No placements yet.';
      entries.push(empty);
    }
    historyList.replaceChildren(...entries);
  };

  const render = (): void => {
    if (disposed) return;
    root.dataset.state = session.state;
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== session.state;
    });

    turnValue.textContent = `${session.turn} / ${MAX_TURNS}`;
    differenceValue.textContent = String(session.difference);
    zoneValue.textContent = zoneLabel(session.zone);
    scoreValue.textContent = session.seed === null ? '—' : String(session.score);
    comboValue.textContent = session.seed === null ? '—' : String(session.combo);
    leftTotalValue.textContent = String(session.leftTotal);
    rightTotalValue.textContent = String(session.rightTotal);
    currentTileValue.textContent = session.currentTile ? formatTile(session.currentTile) : '—';
    const limitTurn = Math.min(session.turn + 1, MAX_TURNS);
    const hardLimit = getHardLimit(Math.max(1, limitTurn));
    hardLimitValue.textContent = String(hardLimit);
    balanceMeter.setAttribute('aria-valuenow', String(Math.min(session.difference, hardLimit)));
    balanceMeter.setAttribute('aria-valuemax', String(hardLimit));
    const fill = balanceTrack as HTMLElement;
    fill.style.width = `${Math.min(100, (session.difference / hardLimit) * 100)}%`;

    if (session.currentTile && session.nextTile) {
      nextLabel.textContent = 'Next preview';
      nextTileValue.textContent = formatTile(session.nextTile);
    } else if (session.currentTile) {
      nextLabel.textContent = 'Next preview';
      nextTileValue.textContent = 'Final turn';
    } else if (session.seed !== null) {
      nextLabel.textContent = 'Next preview';
      nextTileValue.textContent = 'Sequence complete';
    } else {
      nextLabel.textContent = 'Next preview';
      nextTileValue.textContent = 'Shown when the session starts';
    }

    leftButton.disabled = session.state !== 'TURN' || placementLocked || !session.currentTile;
    rightButton.disabled = leftButton.disabled;
    startButton.disabled = session.state !== 'IDLE';
    resumeButton.disabled = session.state !== 'PAUSED';
    playAgainButton.disabled = session.state !== 'RESULT';
    resultScore.textContent = session.result ? String(session.result.score) : '—';
    resultDifference.textContent = session.result ? String(session.result.finalDifference) : '—';
    resultExactCount.textContent = session.result ? String(session.result.exactCount) : '—';
    resultBreachCount.textContent = session.result ? String(session.result.breachCount) : '—';
    resultMaxCombo.textContent = session.result ? String(session.result.maxCombo) : '—';
    resultBestScore.textContent = session.result ? String(session.result.bestScore) : '—';
    sessionError.hidden = sessionError.textContent === '';
    renderHistory();
  };

  const onPlacementClick = (side: PlacementSide) => (): void => {
    place(side);
  };

  const place = (side: PlacementSide): boolean => {
    if (disposed || placementLocked || session.state !== 'TURN') return false;
    const nextSession = commitPlacement(session, side);
    if (!nextSession) return false;

    placementLocked = true;
    clearPhaseTimer();
    session = nextSession;
    if (session.result) saveBestStats(session.best);
    const sideLabel = side === 'LEFT' ? 'Left' : 'Right';
    feedbackDetail.textContent = `Placed ${formatTile(nextSession.lastPlacement!.tile)} in ${sideLabel}. Difference ${nextSession.difference}: ${zoneLabel(nextSession.zone)}.`;
    render();

    schedulePhase(RESOLVING_MS, () => {
      if (session.state !== 'RESOLVING') return;
      session = { ...session, state: 'FEEDBACK' };
      render();
      schedulePhase(FEEDBACK_MS, () => {
        if (session.state !== 'FEEDBACK') return;
        session = { ...session, state: session.turn >= MAX_TURNS ? 'RESULT' : 'TURN' };
        placementLocked = false;
        render();
      });
    });
    return true;
  };

  const startFreshGame = (requiredState: 'IDLE' | 'RESULT'): void => {
    if (disposed || session.state !== requiredState) return;
    sessionError.textContent = '';
    const best = session.best;
    try {
      const seed = createSessionSeed();
      const generated = generateSequence(seed);
      if (generated.tiles.length !== MAX_TURNS || !generated.validation.valid) {
        throw new Error('Generated sequence did not pass validation.');
      }
      session = {
        ...INITIAL_SESSION,
        state: 'TURN',
        best,
        seed,
        sequence: generated.tiles,
        currentTile: generated.tiles[0] ?? null,
        nextTile: generated.tiles[1] ?? null,
      };
      placementLocked = false;
      render();
      root.focus();
    } catch {
      sessionError.textContent = 'This session could not be started. Please try again.';
      render();
    }
  };

  const beginGame = (): void => startFreshGame('IDLE');
  const playAgain = (): void => startFreshGame('RESULT');

  const resumeGame = (): void => {
    if (disposed || session.state !== 'PAUSED') return;
    clearPhaseTimer();
    placementLocked = false;
    const resumed = resumeSession(session);
    if (!resumed) return;
    session = resumed;
    render();
    root.focus();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (disposed) return;
    const side = getPlacementSideForKey(event);
    if (!side) return;

    const target = event.target as Element | null;
    if (target && typeof target.closest === 'function') {
      if (target.closest('input, textarea, select, option, [contenteditable], a, [role="button"]')) return;
      const focusedButton = target.closest('button');
      if (focusedButton && (!root.contains(focusedButton) || !focusedButton.matches('[data-action="left"], [data-action="right"]'))) return;
    }

    if (session.state === 'TURN' && place(side)) event.preventDefault();
  };

  const onVisibilityChange = (): void => {
    if (disposed || document.visibilityState !== 'hidden') return;
    const paused = pauseSession(session);
    if (paused === session) return;
    clearPhaseTimer();
    session = paused;
    placementLocked = true;
    render();
  };

  let cleanup = (): void => {};
  const onPageHide = (): void => cleanup();
  const onBeforeSwap = (): void => cleanup();

  cleanup = (): void => {
    if (disposed) return;
    disposed = true;
    clearPhaseTimer();
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    view.removeEventListener('pagehide', onPageHide);
    document.removeEventListener('astro:before-swap', onBeforeSwap);
    startButton.removeEventListener('click', beginGame);
    resumeButton.removeEventListener('click', resumeGame);
    playAgainButton.removeEventListener('click', playAgain);
    leftButton.removeEventListener('click', onLeftClick);
    rightButton.removeEventListener('click', onRightClick);
    delete root.dataset.controllerReady;
  };

  const onLeftClick = onPlacementClick('LEFT');
  const onRightClick = onPlacementClick('RIGHT');
  startButton.addEventListener('click', beginGame);
  resumeButton.addEventListener('click', resumeGame);
  playAgainButton.addEventListener('click', playAgain);
  leftButton.addEventListener('click', onLeftClick);
  rightButton.addEventListener('click', onRightClick);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('visibilitychange', onVisibilityChange);
  view.addEventListener('pagehide', onPageHide, { once: true });
  document.addEventListener('astro:before-swap', onBeforeSwap, { once: true });

  render();
  return cleanup;
};
