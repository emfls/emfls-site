import { ROUND_TIERS, SESSION_ROUNDS, tierForRound } from './constants.ts';
import { generateSessionPlan } from './generator.ts';
import { createSessionSeed } from './rng.ts';
import { symbolAccessibleName, symbolVisualDescriptor } from './symbols.ts';
import { validateRoundPlan } from './validator.ts';
import { inputBeatsDeadline } from './input.ts';
import { createDeadlineTimer, type TimerClock } from './timer.ts';
import {
  averageAccuracy,
  applyMistakePenalty,
  awardCorrectTarget,
  calculateRoundBonuses,
  countCleanRounds,
  formatAccuracy,
  roundAccuracy,
  streakAfterRound,
} from './scoring.ts';
import {
  loadBestStats,
  mergeBestStats,
  saveBestStats,
  type BestStats,
  type BestStatsStorage,
} from './storage.ts';
import type { RoundPlan, SessionPlan, SymbolData } from './types.ts';

export const SIGNAL_SWEEP_STATES = Object.freeze([
  'IDLE',
  'RULE_PREVIEW',
  'ACTIVE',
  'ROUND_FEEDBACK',
  'PAUSED',
  'RESULT',
] as const);

export type SignalSweepState = (typeof SIGNAL_SWEEP_STATES)[number];
export type SignalSweepOutcome = 'CLEAR' | 'TIMEOUT';
export type PauseReason = 'manual' | 'visibility' | 'orientation';

export interface SignalSweepResult {
  readonly score: number;
  readonly correctTargets: number;
  readonly mistakes: number;
  readonly cleanRounds: number;
  readonly averageAccuracy: string;
  readonly bestScore: number;
}

export interface SignalSweepSnapshot {
  readonly state: SignalSweepState;
  readonly roundNumber: number;
  readonly score: number;
  readonly correctTargets: number;
  readonly totalMistakes: number;
  readonly bestScore: number;
  readonly bestCleanRounds: number;
  readonly result: SignalSweepResult | null;
  readonly ruleText: string;
  readonly symbols: readonly SymbolData[];
  readonly targetIds: readonly string[];
  readonly selectedIds: readonly string[];
  readonly correctSelections: number;
  readonly mistakes: number;
  readonly remainingMs: number | null;
  readonly outcome: SignalSweepOutcome | null;
  readonly outcomeText: string;
  readonly resolutionRemainingMs: number | null;
  readonly mistakeSymbolId: string | null;
  readonly mistakeMessage: string;
  readonly generationError: string;
  readonly pauseReason: PauseReason | null;
}

export interface SignalSweepSession {
  getSnapshot(): SignalSweepSnapshot;
  start(): boolean;
  activateSymbol(symbolId: string, eventTimestamp: number): boolean;
  pause(reason?: PauseReason): boolean;
  resume(): boolean;
  playAgain(): boolean;
  destroy(): void;
}

interface SessionOptions {
  readonly clock?: TimerClock;
  readonly timeOrigin?: number;
  readonly getSeed?: () => number;
  readonly createPlan?: (seed: number) => SessionPlan;
  readonly getStorage?: () => BestStatsStorage | null;
  readonly onChange?: (snapshot: SignalSweepSnapshot) => void;
}

type ResumeContext =
  | { readonly kind: 'preview'; readonly activeRemainingMs: number | null }
  | { readonly kind: 'active'; readonly remainingMs: number }
  | { readonly kind: 'feedback'; readonly remainingMs: number; readonly outcome: SignalSweepOutcome };

const defaultClock: TimerClock = {
  now: () => globalThis.performance.now(),
  setTimeout: (callback, delayMs) => globalThis.setTimeout(callback, delayMs),
  clearTimeout: (handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>),
};

const PREVIEW_MS = 900;
const RESUME_PREVIEW_MS = 600;
const ROUND_FEEDBACK_MS = 450;
const MISTAKE_FEEDBACK_MS = 250;

export function createSignalSweepSession(options: SessionOptions = {}): SignalSweepSession {
  const clock = options.clock ?? defaultClock;
  const timeOrigin = options.timeOrigin ?? globalThis.performance?.timeOrigin ?? 0;
  const getSeed = options.getSeed ?? (() => createSessionSeed());
  const createPlan = options.createPlan ?? generateSessionPlan;
  let state: SignalSweepState = 'IDLE';
  let plan: SessionPlan | null = null;
  let roundIndex = -1;
  let selectedIds = new Set<string>();
  let score = 0;
  let correctTargets = 0;
  let totalMistakes = 0;
  let correctSelections = 0;
  let mistakes = 0;
  let streak = 0;
  let streakAtRoundStart = 0;
  let roundAccuracies: number[] = [];
  let roundOutcomes: { outcome: SignalSweepOutcome; mistakes: number }[] = [];
  let bestStats: BestStats = Object.freeze({ bestScore: 0, bestCleanRounds: 0 });
  let result: SignalSweepResult | null = null;
  let outcome: SignalSweepOutcome | null = null;
  let outcomeText = '';
  let resolutionRemainingMs: number | null = null;
  let mistakeSymbolId: string | null = null;
  let mistakeMessage = '';
  let generationError = '';
  let pauseReason: PauseReason | null = null;
  let resumeContext: ResumeContext | null = null;
  let previewActiveRemainingMs: number | null = null;
  let activeDeadline: number | null = null;
  let presentationDeadline: number | null = null;
  let deadlineTimer: ReturnType<typeof createDeadlineTimer> | null = null;
  let presentationTimer: unknown;
  let arbitrationTimer: unknown;
  let mistakeTimer: unknown;
  let generation = 0;
  let mistakeNonce = 0;
  let destroyed = false;

  const currentRound = (): RoundPlan | null => plan?.rounds[roundIndex] ?? null;

  function remainingTime(): number | null {
    if (state === 'ACTIVE' && deadlineTimer) return deadlineTimer.getRemaining();
    if (state === 'PAUSED' && resumeContext?.kind === 'active') return resumeContext.remainingMs;
    if (state === 'PAUSED' && resumeContext?.kind === 'preview') return resumeContext.activeRemainingMs;
    if (state === 'RULE_PREVIEW' && previewActiveRemainingMs !== null) return previewActiveRemainingMs;
    return null;
  }

  function getSnapshot(): SignalSweepSnapshot {
    const round = currentRound();
    return Object.freeze({
      state,
      roundNumber: round?.roundNumber ?? 0,
      score,
      correctTargets,
      totalMistakes,
      bestScore: bestStats.bestScore,
      bestCleanRounds: bestStats.bestCleanRounds,
      result,
      ruleText: round?.rule.text ?? '',
      symbols: round?.symbols ?? Object.freeze([]),
      targetIds: round?.targetIds ?? Object.freeze([]),
      selectedIds: Object.freeze([...selectedIds]),
      correctSelections,
      mistakes,
      remainingMs: remainingTime(),
      outcome,
      outcomeText,
      resolutionRemainingMs,
      mistakeSymbolId,
      mistakeMessage,
      generationError,
      pauseReason,
    });
  }

  const publish = (): void => options.onChange?.(getSnapshot());

  function cancelPendingWork(): void {
    if (presentationTimer !== undefined) clock.clearTimeout(presentationTimer);
    if (arbitrationTimer !== undefined) clock.clearTimeout(arbitrationTimer);
    if (mistakeTimer !== undefined) clock.clearTimeout(mistakeTimer);
    presentationTimer = undefined;
    arbitrationTimer = undefined;
    mistakeTimer = undefined;
    deadlineTimer?.cancel();
    deadlineTimer = null;
    presentationDeadline = null;
    activeDeadline = null;
    mistakeNonce += 1;
  }

  function transition(nextState: SignalSweepState): void {
    cancelPendingWork();
    generation += 1;
    state = nextState;
    if (nextState !== 'ACTIVE') {
      mistakeSymbolId = null;
      mistakeMessage = '';
    }
    publish();
  }

  function schedulePresentation(durationMs: number, callback: () => void): void {
    const expectedGeneration = generation;
    presentationDeadline = clock.now() + durationMs;
    presentationTimer = clock.setTimeout(() => {
      if (destroyed || generation !== expectedGeneration) return;
      presentationTimer = undefined;
      presentationDeadline = null;
      callback();
    }, durationMs);
  }

  function beginActive(durationMs: number): void {
    if (durationMs <= 0) {
      resolveRound('TIMEOUT', activeDeadline ?? clock.now());
      return;
    }
    transition('ACTIVE');
    activeDeadline = clock.now() + durationMs;
    const expectedGeneration = generation;
    deadlineTimer = createDeadlineTimer({
      clock,
      deadline: activeDeadline,
      updateIntervalMs: 100,
      onUpdate: () => {
        if (!destroyed && state === 'ACTIVE' && generation === expectedGeneration) publish();
      },
      onDeadline: () => {
        if (destroyed || state !== 'ACTIVE' || generation !== expectedGeneration || arbitrationTimer !== undefined) return;
        arbitrationTimer = clock.setTimeout(() => {
          if (destroyed || state !== 'ACTIVE' || generation !== expectedGeneration) return;
          arbitrationTimer = undefined;
          resolveRound('TIMEOUT', activeDeadline ?? clock.now());
        }, 0);
      },
    });
  }

  function beginPreview(durationMs: number, activeRemainingMs: number | null): void {
    previewActiveRemainingMs = activeRemainingMs;
    transition('RULE_PREVIEW');
    schedulePresentation(durationMs, () => {
      const round = currentRound();
      if (!round) return;
      const tier = tierForRound(round.roundNumber);
      beginActive(previewActiveRemainingMs ?? tier.timeMs);
      previewActiveRemainingMs = null;
    });
  }

  function startRound(roundNumberIndex: number): void {
    roundIndex = roundNumberIndex;
    selectedIds = new Set();
    correctSelections = 0;
    mistakes = 0;
    streakAtRoundStart = streak;
    outcome = null;
    outcomeText = '';
    resolutionRemainingMs = null;
    generationError = '';
    beginPreview(PREVIEW_MS, null);
  }

  function finishFeedback(): void {
    if (state !== 'ROUND_FEEDBACK') return;
    const nextRound = roundIndex + 1;
    if (nextRound >= SESSION_ROUNDS) {
      completeSession();
      transition('RESULT');
      return;
    }
    startRound(nextRound);
  }

  function completeSession(): void {
    bestStats = mergeBestStats(bestStats, { bestScore: score, bestCleanRounds: countCleanRounds(roundOutcomes) });
    saveBestStats(bestStats, options.getStorage);
    result = Object.freeze({
      score,
      correctTargets,
      mistakes: totalMistakes,
      cleanRounds: countCleanRounds(roundOutcomes),
      averageAccuracy: formatAccuracy(averageAccuracy(roundAccuracies)),
      bestScore: bestStats.bestScore,
    });
  }

  function beginFeedback(remainingMs: number, resolvedOutcome: SignalSweepOutcome): void {
    outcome = resolvedOutcome;
    transition('ROUND_FEEDBACK');
    schedulePresentation(Math.max(0, remainingMs), finishFeedback);
  }

  function resolveRound(resolvedOutcome: SignalSweepOutcome, eventTimestamp: number): void {
    if (state !== 'ACTIVE') return;
    const deadline = activeDeadline ?? clock.now();
    outcome = resolvedOutcome;
    resolutionRemainingMs = resolvedOutcome === 'CLEAR' ? Math.max(0, deadline - eventTimestamp) : 0;
    if (resolvedOutcome === 'CLEAR') {
      score += calculateRoundBonuses('CLEAR', resolutionRemainingMs, streakAtRoundStart).totalBonus;
    }
    roundAccuracies.push(roundAccuracy(correctSelections, mistakes));
    roundOutcomes.push({ outcome: resolvedOutcome, mistakes });
    streak = streakAfterRound(streakAtRoundStart, resolvedOutcome, mistakes);
    outcomeText = resolvedOutcome === 'CLEAR'
      ? `Round ${currentRound()?.roundNumber ?? ''} cleared.`
      : `Time is up. Round ${currentRound()?.roundNumber ?? ''} timed out.`;
    transition('ROUND_FEEDBACK');
    schedulePresentation(ROUND_FEEDBACK_MS, finishFeedback);
  }

  function createValidatedPlan(): SessionPlan {
    const seed = getSeed();
    const generated = createPlan(seed);
    if (!generated || generated.seed !== seed || generated.rounds.length !== SESSION_ROUNDS
      || generated.rounds.some((round, index) => !validateRoundPlan(round).valid || round.roundNumber !== index + 1)) {
      throw new Error('The generated round plan did not pass validation.');
    }
    return generated;
  }

  function resetMatchTotals(): void {
    score = 0;
    correctTargets = 0;
    totalMistakes = 0;
    correctSelections = 0;
    mistakes = 0;
    streak = 0;
    streakAtRoundStart = 0;
    roundAccuracies = [];
    roundOutcomes = [];
    selectedIds = new Set();
    outcome = null;
    outcomeText = '';
    resolutionRemainingMs = null;
    generationError = '';
    result = null;
  }

  function start(): boolean {
    if (destroyed || state !== 'IDLE' || plan) return false;
    try {
      plan = createValidatedPlan();
      bestStats = loadBestStats(options.getStorage);
      resetMatchTotals();
      startRound(0);
      return true;
    } catch {
      generationError = 'A new game could not be prepared. Please try again.';
      publish();
      return false;
    }
  }

  function playAgain(): boolean {
    if (destroyed || state !== 'RESULT') return false;
    try {
      const nextPlan = createValidatedPlan();
      plan = nextPlan;
      resetMatchTotals();
      startRound(0);
      return true;
    } catch {
      generationError = 'A new game could not be prepared. Please try again.';
      publish();
      return false;
    }
  }

  function activateSymbol(symbolId: string, eventTimestamp: number): boolean {
    const round = currentRound();
    if (destroyed || state !== 'ACTIVE' || !round || !activeDeadline) return false;
    const symbol = round.symbols.find(({ id }) => id === symbolId);
    if (!symbol) return false;
    const sample = inputBeatsDeadline(eventTimestamp, activeDeadline, { now: clock.now(), timeOrigin });
    if (!sample.beatsDeadline) {
      if (sample.timestamp >= activeDeadline) resolveRound('TIMEOUT', activeDeadline);
      return false;
    }

    if (round.targetIds.includes(symbolId)) {
      if (selectedIds.has(symbolId)) return false;
      selectedIds.add(symbolId);
      correctSelections += 1;
      correctTargets += 1;
      score = awardCorrectTarget(score);
      if (correctSelections === round.targetIds.length) resolveRound('CLEAR', sample.timestamp);
      else publish();
      return true;
    }

    mistakes += 1;
    totalMistakes += 1;
    score = applyMistakePenalty(score);
    mistakeSymbolId = symbolId;
    mistakeMessage = 'Not a match.';
    mistakeNonce += 1;
    const expectedMistakeNonce = mistakeNonce;
    if (mistakeTimer !== undefined) clock.clearTimeout(mistakeTimer);
    mistakeTimer = clock.setTimeout(() => {
      if (destroyed || expectedMistakeNonce !== mistakeNonce || state !== 'ACTIVE') return;
      mistakeTimer = undefined;
      mistakeSymbolId = null;
      mistakeMessage = '';
      publish();
    }, MISTAKE_FEEDBACK_MS);
    publish();
    return true;
  }

  function pause(reason: PauseReason = 'manual'): boolean {
    if (destroyed || !['RULE_PREVIEW', 'ACTIVE', 'ROUND_FEEDBACK'].includes(state)) return false;
    if (state === 'ACTIVE') {
      const remainingMs = deadlineTimer?.getRemaining() ?? 0;
      if (remainingMs <= 0) {
        resolveRound('TIMEOUT', activeDeadline ?? clock.now());
        return false;
      }
      resumeContext = { kind: 'active', remainingMs };
    } else if (state === 'RULE_PREVIEW') {
      resumeContext = { kind: 'preview', activeRemainingMs: previewActiveRemainingMs };
    } else {
      const remainingMs = Math.max(0, (presentationDeadline ?? clock.now()) - clock.now());
      if (remainingMs <= 0) {
        finishFeedback();
        return false;
      }
      resumeContext = { kind: 'feedback', remainingMs, outcome: outcome ?? 'TIMEOUT' };
    }
    pauseReason = reason;
    transition('PAUSED');
    return true;
  }

  function resume(): boolean {
    if (destroyed || state !== 'PAUSED' || !resumeContext) return false;
    const context = resumeContext;
    resumeContext = null;
    pauseReason = null;
    if (context.kind === 'feedback') {
      beginFeedback(context.remainingMs, context.outcome);
    } else {
      beginPreview(RESUME_PREVIEW_MS, context.kind === 'active' ? context.remainingMs : context.activeRemainingMs);
    }
    return true;
  }

  function destroy(): void {
    if (destroyed) return;
    destroyed = true;
    cancelPendingWork();
    generation += 1;
    resumeContext = null;
  }

  return Object.freeze({ getSnapshot, start, activateSymbol, pause, resume, playAgain, destroy });
}

export interface LifecycleTargets {
  readonly document: Pick<Document, 'addEventListener' | 'removeEventListener' | 'visibilityState'>;
  readonly window: Pick<Window, 'addEventListener' | 'removeEventListener'>;
}

export function bindSignalSweepLifecycle(session: SignalSweepSession, targets: LifecycleTargets): () => void {
  const onVisibilityChange = (): void => {
    if (targets.document.visibilityState === 'hidden') session.pause('visibility');
  };
  const onOrientationChange = (): void => session.pause('orientation');
  const onPageHide = (): void => session.destroy();
  const onBeforeSwap = (): void => session.destroy();

  targets.document.addEventListener('visibilitychange', onVisibilityChange);
  targets.document.addEventListener('astro:before-swap', onBeforeSwap);
  targets.window.addEventListener('orientationchange', onOrientationChange);
  targets.window.addEventListener('pagehide', onPageHide);

  return () => {
    targets.document.removeEventListener('visibilitychange', onVisibilityChange);
    targets.document.removeEventListener('astro:before-swap', onBeforeSwap);
    targets.window.removeEventListener('orientationchange', onOrientationChange);
    targets.window.removeEventListener('pagehide', onPageHide);
  };
}

function appendSvgSymbol(document: Document, button: HTMLButtonElement, symbol: SymbolData): void {
  const namespace = 'http://www.w3.org/2000/svg';
  const descriptor = symbolVisualDescriptor(symbol);
  const svg = document.createElementNS(namespace, 'svg');
  svg.setAttribute('viewBox', '0 0 64 64');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  let fill = descriptor.fill === 'hollow' ? 'none' : descriptor.colorHex;

  if (descriptor.fill === 'striped') {
    const defs = document.createElementNS(namespace, 'defs');
    const pattern = document.createElementNS(namespace, 'pattern');
    const patternId = `signal-sweep-stripe-${symbol.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
    pattern.setAttribute('id', patternId);
    pattern.setAttribute('width', '8');
    pattern.setAttribute('height', '8');
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    const base = document.createElementNS(namespace, 'rect');
    base.setAttribute('width', '8');
    base.setAttribute('height', '8');
    base.setAttribute('fill', '#ffffff');
    pattern.append(base);
    const hatch = document.createElementNS(namespace, 'path');
    hatch.setAttribute('d', 'M-2 2L2-2M0 8L8 0M6 10L10 6');
    hatch.setAttribute('stroke', descriptor.colorHex);
    hatch.setAttribute('stroke-width', '3');
    pattern.append(hatch);
    defs.append(pattern);
    svg.append(defs);
    fill = `url(#${patternId})`;
  }

  let shape: SVGElement;
  if (descriptor.shape === 'circle') {
    shape = document.createElementNS(namespace, 'circle');
    shape.setAttribute('cx', '32');
    shape.setAttribute('cy', '32');
    shape.setAttribute('r', '20');
  } else if (descriptor.shape === 'triangle') {
    shape = document.createElementNS(namespace, 'polygon');
    shape.setAttribute('points', '32,9 55,52 9,52');
  } else if (descriptor.shape === 'diamond') {
    shape = document.createElementNS(namespace, 'polygon');
    shape.setAttribute('points', '32,7 56,32 32,57 8,32');
  } else {
    shape = document.createElementNS(namespace, 'rect');
    shape.setAttribute('x', '12');
    shape.setAttribute('y', '12');
    shape.setAttribute('width', '40');
    shape.setAttribute('height', '40');
    shape.setAttribute('rx', '4');
  }
  shape.setAttribute('fill', fill);
  shape.setAttribute('stroke', descriptor.colorHex);
  shape.setAttribute('stroke-width', '3');
  svg.append(shape);

  if (descriptor.mark === 'dot') {
    const mark = document.createElementNS(namespace, 'circle');
    mark.setAttribute('cx', '32');
    mark.setAttribute('cy', '32');
    mark.setAttribute('r', '4');
    mark.setAttribute('fill', '#142b30');
    svg.append(mark);
  } else if (descriptor.mark === 'line' || descriptor.mark === 'cross') {
    const mark = document.createElementNS(namespace, 'path');
    mark.setAttribute('d', descriptor.mark === 'line' ? 'M21 32H43' : 'M23 23L41 41M41 23L23 41');
    mark.setAttribute('fill', 'none');
    mark.setAttribute('stroke', '#142b30');
    mark.setAttribute('stroke-width', '4');
    mark.setAttribute('stroke-linecap', 'round');
    svg.append(mark);
  }
  button.append(svg);
  const selectedMarker = document.createElement('span');
  selectedMarker.className = 'signal-sweep__selected-mark';
  selectedMarker.setAttribute('aria-hidden', 'true');
  selectedMarker.textContent = '✓';
  button.append(selectedMarker);
}

export function createSignalSweepController(root: HTMLElement): () => void {
  const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-panel]'));
  const actualStates = panels.map((panel) => panel.dataset.panel);
  if (
    panels.length !== SIGNAL_SWEEP_STATES.length ||
    SIGNAL_SWEEP_STATES.some((state) => actualStates.filter((actual) => actual === state).length !== 1)
  ) throw new Error('Signal Sweep requires exactly one panel for each of its six states.');

  const document = root.ownerDocument;
  const view = document.defaultView;
  const board = root.querySelector<HTMLElement>('[data-board]');
  const roundOutput = root.querySelector<HTMLElement>('[data-round]');
  const timerOutput = root.querySelector<HTMLElement>('[data-timer]');
  const scoreOutput = root.querySelector<HTMLElement>('[data-score]');
  const ruleOutput = root.querySelector<HTMLElement>('[data-rule]');
  const outcomeOutput = root.querySelector<HTMLElement>('[data-outcome]');
  const mistakeOutput = root.querySelector<HTMLElement>('[data-mistake-feedback]');
  const generationErrorOutput = root.querySelector<HTMLElement>('[data-generation-error]');
  const resultOutputs = {
    score: root.querySelector<HTMLElement>('[data-result="score"]'),
    correctTargets: root.querySelector<HTMLElement>('[data-result="correct-targets"]'),
    mistakes: root.querySelector<HTMLElement>('[data-result="mistakes"]'),
    cleanRounds: root.querySelector<HTMLElement>('[data-result="clean-rounds"]'),
    averageAccuracy: root.querySelector<HTMLElement>('[data-result="average-accuracy"]'),
    bestScore: root.querySelector<HTMLElement>('[data-result="best-score"]'),
  };
  if (!view || !board || !roundOutput || !timerOutput || !scoreOutput || !ruleOutput || !outcomeOutput || !mistakeOutput || !generationErrorOutput
    || Object.values(resultOutputs).some((element) => !element)) {
    throw new Error('Signal Sweep is missing a required game surface.');
  }

  let renderedRound = '';
  const session = createSignalSweepSession({ onChange: render });

  function render(snapshot: SignalSweepSnapshot): void {
    root.dataset.state = snapshot.state;
    for (const panel of panels) panel.hidden = panel.dataset.panel !== snapshot.state;
    roundOutput.textContent = snapshot.roundNumber ? `${snapshot.roundNumber} / ${SESSION_ROUNDS}` : `— / ${SESSION_ROUNDS}`;
    timerOutput.textContent = snapshot.remainingMs === null ? '—' : `${(snapshot.remainingMs / 1000).toFixed(1)}s`;
    scoreOutput.textContent = String(snapshot.score);
    ruleOutput.textContent = snapshot.ruleText || "Look for every symbol that matches the round's rule.";
    outcomeOutput.textContent = snapshot.outcomeText;
    mistakeOutput.textContent = snapshot.mistakeMessage;
    generationErrorOutput.textContent = snapshot.generationError;
    generationErrorOutput.hidden = !snapshot.generationError;
    resultOutputs.score!.textContent = snapshot.result ? String(snapshot.result.score) : '—';
    resultOutputs.correctTargets!.textContent = snapshot.result ? String(snapshot.result.correctTargets) : '—';
    resultOutputs.mistakes!.textContent = snapshot.result ? String(snapshot.result.mistakes) : '—';
    resultOutputs.cleanRounds!.textContent = snapshot.result ? String(snapshot.result.cleanRounds) : '—';
    resultOutputs.averageAccuracy!.textContent = snapshot.result?.averageAccuracy ?? '—';
    resultOutputs.bestScore!.textContent = snapshot.result ? String(snapshot.result.bestScore) : '—';

    const roundKey = `${snapshot.roundNumber}:${snapshot.symbols.map(({ id }) => id).join(',')}`;
    if (roundKey !== renderedRound) {
      renderedRound = roundKey;
      board.replaceChildren();
      for (const symbol of snapshot.symbols) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'signal-sweep__tile';
        button.dataset.symbolId = symbol.id;
        button.setAttribute('aria-label', symbolAccessibleName(symbol));
        button.setAttribute('aria-pressed', 'false');
        appendSvgSymbol(document, button, symbol);
        board.append(button);
      }
    }
    const selected = new Set(snapshot.selectedIds);
    for (const button of board.querySelectorAll<HTMLButtonElement>('[data-symbol-id]')) {
      const id = button.dataset.symbolId ?? '';
      const isSelected = selected.has(id);
      button.disabled = snapshot.state !== 'ACTIVE';
      button.setAttribute('aria-pressed', String(isSelected));
      button.classList.toggle('signal-sweep__tile--selected', isSelected);
      button.classList.toggle('signal-sweep__tile--mistake', snapshot.mistakeSymbolId === id);
    }
  }

  const onClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof view.Element)) return;
    const actionElement = target.closest<HTMLElement>('[data-action]');
    if (actionElement && root.contains(actionElement)) {
      const action = actionElement.dataset.action;
      if (action === 'start') session.start();
      else if (action === 'resume') session.resume();
      else if (action === 'pause') session.pause('manual');
      else if (action === 'play-again') session.playAgain();
      return;
    }
    const symbolButton = target.closest<HTMLButtonElement>('[data-symbol-id]');
    if (symbolButton && root.contains(symbolButton) && !symbolButton.disabled && symbolButton.dataset.symbolId) {
      session.activateSymbol(symbolButton.dataset.symbolId, event.timeStamp);
    }
  };
  root.addEventListener('click', onClick);
  const unbindLifecycle = bindSignalSweepLifecycle(session, { document, window: view });
  render(session.getSnapshot());

  return () => {
    root.removeEventListener('click', onClick);
    unbindLifecycle();
    session.destroy();
  };
}

export { ROUND_TIERS };
