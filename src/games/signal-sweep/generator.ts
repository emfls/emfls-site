import {
  FALLBACK_SEED_BASE,
  GENERATOR_VERSION,
  MAX_CANDIDATE_ATTEMPTS,
  MAX_TUPLE_OCCURRENCES,
  ROUND_TIERS,
  SESSION_ROUNDS,
  tierForRound,
} from './constants.ts';
import { createSeededRandom, drawInt, type Uint32Source } from './rng.ts';
import { createRuleForTier, evaluateRule, isNearMiss } from './rules.ts';
import { canonicalSymbolTuple, createSymbol, enumerateSymbolTuples, type SymbolAttributes } from './symbols.ts';
import { validateRoundPlan } from './validator.ts';
import type { RoundPlan, SessionPlan } from './types.ts';

export type CandidateFactory = (
  roundNumber: number,
  sessionSeed: number,
  attempt: number,
  nextUint32: Uint32Source,
) => RoundPlan | null;

const CandidateRejected = Symbol('candidate-rejected');

function nonColorDifferentFromEveryTarget(candidate: SymbolAttributes, targets: readonly SymbolAttributes[]): boolean {
  return targets.every((target) => target.shape !== candidate.shape
    || target.fill !== candidate.fill
    || target.mark !== candidate.mark);
}

function makeId(seed: number, roundNumber: number, attempt: number, kind: 't' | 'd', ordinal: number): string {
  return `ss-s${seed.toString(16).padStart(8, '0')}-r${String(roundNumber).padStart(2, '0')}-a${String(attempt).padStart(2, '0')}-${kind}${String(ordinal).padStart(2, '0')}`;
}

function chooseAvailable(
  candidates: readonly SymbolAttributes[],
  tupleCounts: Map<string, number>,
  nextUint32: Uint32Source,
): SymbolAttributes {
  const available = candidates.filter((candidate) => (tupleCounts.get(canonicalSymbolTuple(candidate)) ?? 0) < MAX_TUPLE_OCCURRENCES);
  if (!available.length) throw CandidateRejected;
  const selected = available[drawInt(available.length, nextUint32)]!;
  const tuple = canonicalSymbolTuple(selected);
  tupleCounts.set(tuple, (tupleCounts.get(tuple) ?? 0) + 1);
  return selected;
}

function shuffle<T>(items: T[], nextUint32: Uint32Source): void {
  for (let index = items.length - 1; index > 0; index--) {
    const swapIndex = drawInt(index + 1, nextUint32);
    [items[index], items[swapIndex]] = [items[swapIndex]!, items[index]!];
  }
}

function createCandidateRound(
  roundNumber: number,
  sessionSeed: number,
  attempt: number,
  nextUint32: Uint32Source,
): RoundPlan | null {
  const spec = tierForRound(roundNumber);
  try {
    const rule = createRuleForTier(spec.tier, nextUint32);
    const targetCount = spec.minTargets + drawInt(spec.maxTargets - spec.minTargets + 1, nextUint32);
    const universe = enumerateSymbolTuples();
    const trueTuples = universe.filter((tuple) => evaluateRule(rule, tuple));
    const falseTuples = universe.filter((tuple) => !evaluateRule(rule, tuple));
    const tupleCounts = new Map<string, number>();
    const targets = Array.from({ length: targetCount }, () => chooseAvailable(trueTuples, tupleCounts, nextUint32));
    const distractorCount = spec.boardSize - targetCount;
    const nearMissMinimum = Math.ceil(distractorCount / 2);
    const validFalseTuples = falseTuples.filter((tuple) => nonColorDifferentFromEveryTarget(tuple, targets));
    let nearMissPool = validFalseTuples.filter((candidate) => targets.some((target) => isNearMiss(target, candidate, rule)));
    if (!nearMissPool.length && nearMissMinimum > 0) return null;
    const distractors: SymbolAttributes[] = [];

    for (let index = 0; index < nearMissMinimum; index++) {
      const candidate = chooseAvailable(nearMissPool, tupleCounts, nextUint32);
      distractors.push(candidate);
      nearMissPool = nearMissPool.filter((tuple) => (tupleCounts.get(canonicalSymbolTuple(tuple)) ?? 0) < MAX_TUPLE_OCCURRENCES);
    }
    for (let index = nearMissMinimum; index < distractorCount; index++) {
      distractors.push(chooseAvailable(validFalseTuples, tupleCounts, nextUint32));
    }

    const targetSymbols = targets.map((attributes, index) => createSymbol(makeId(sessionSeed, roundNumber, attempt, 't', index + 1), attributes));
    const board = [
      ...targetSymbols,
      ...distractors.map((attributes, index) => createSymbol(makeId(sessionSeed, roundNumber, attempt, 'd', index + 1), attributes)),
    ];
    shuffle(board, nextUint32);
    const targetIdSet = new Set(targetSymbols.map(({ id }) => id));
    const targetIds = board.filter(({ id }) => targetIdSet.has(id)).map(({ id }) => id);
    const round: RoundPlan = Object.freeze({
      roundNumber,
      tier: spec.tier,
      boardSize: spec.boardSize,
      rule,
      symbols: Object.freeze(board),
      targetIds: Object.freeze(targetIds),
      diagnostics: Object.freeze({ nearMissCount: nearMissMinimum, fallbackSeed: null, candidateAttempts: attempt, usedFallback: false }),
    });
    return validateRoundPlan(round).valid ? round : null;
  } catch (error) {
    if (error === CandidateRejected) return null;
    throw error;
  }
}

function withDiagnostics(round: RoundPlan, overrides: Partial<RoundPlan['diagnostics']>): RoundPlan {
  const targetIds = new Set(round.targetIds);
  const targets = round.symbols.filter(({ id }) => targetIds.has(id));
  const distractors = round.symbols.filter(({ id }) => !targetIds.has(id));
  const nearMissCount = distractors.filter((candidate) => targets.some((target) => isNearMiss(target, candidate, round.rule))).length;
  return Object.freeze({
    ...round,
    diagnostics: Object.freeze({ ...round.diagnostics, nearMissCount, ...overrides }),
  });
}

export function generateRoundWithFallback(
  roundNumber: number,
  sessionSeed: number,
  nextUint32: Uint32Source,
  candidateFactory: CandidateFactory = createCandidateRound,
): RoundPlan {
  for (let attempt = 1; attempt <= MAX_CANDIDATE_ATTEMPTS; attempt++) {
    const candidate = candidateFactory(roundNumber, sessionSeed, attempt, nextUint32);
    if (candidate && validateRoundPlan(candidate).valid) {
      return withDiagnostics(candidate, { candidateAttempts: attempt, fallbackSeed: null, usedFallback: false });
    }
  }
  const fallback = createFallbackRound(roundNumber, sessionSeed);
  return withDiagnostics(fallback, {
    candidateAttempts: MAX_CANDIDATE_ATTEMPTS,
    fallbackSeed: FALLBACK_SEED_BASE + (roundNumber - 1),
    usedFallback: true,
  });
}

export function createFallbackRound(roundNumber: number, _sessionSeed = 0): RoundPlan {
  const fallbackSeed = FALLBACK_SEED_BASE + (roundNumber - 1);
  const nextUint32 = createSeededRandom(fallbackSeed);
  for (let attempt = 1; attempt <= MAX_CANDIDATE_ATTEMPTS; attempt++) {
    const candidate = createCandidateRound(roundNumber, fallbackSeed, attempt, nextUint32);
    if (candidate && validateRoundPlan(candidate).valid) {
      return withDiagnostics(candidate, { fallbackSeed, candidateAttempts: attempt, usedFallback: true });
    }
  }
  throw new Error(`validated fallback generation failed for round ${roundNumber}`);
}

export function generateSessionPlan(seed: number): SessionPlan {
  const nextUint32 = createSeededRandom(seed);
  const rounds = Array.from({ length: SESSION_ROUNDS }, (_, index) =>
    generateRoundWithFallback(index + 1, seed, nextUint32));
  return Object.freeze({ seed, generatorVersion: GENERATOR_VERSION, rounds: Object.freeze(rounds) });
}

export { ROUND_TIERS };
