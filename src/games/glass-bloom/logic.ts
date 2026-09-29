import { STAGE_POTS, UINT32_RANGE } from './constants.ts';
import { doesBreak, getBreakRisk, isCrystalIndex, isStage } from './risk.ts';
import { nextSeededValue } from './rng.ts';
import type { CrystalIndex, GameSession, SessionStats, Stage } from './types.ts';

function isUint32(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value < UINT32_RANGE;
}

function isNonNegativeSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function copySession(session: GameSession, changes: Partial<GameSession>): GameSession {
  return { ...session, ...changes };
}

export function createSession(seed: number): GameSession {
  if (!isUint32(seed)) throw new RangeError('seed must be an unsigned 32-bit integer');
  return {
    state: 'CRYSTAL_INTRO',
    seed,
    rngState: seed,
    crystalIndex: 1,
    stage: 1,
    pot: STAGE_POTS[0]!,
    totalScore: 0,
    bankStreak: 0,
    bestBankStreak: 0,
    successfulBanks: 0,
    breaks: 0,
    highestStage: 1,
    growOutcome: null,
    roundOutcome: null,
    bankAward: 0,
  };
}

export function enterDecision(session: GameSession): GameSession {
  if (session.state !== 'CRYSTAL_INTRO') return session;
  return copySession(session, { state: 'DECISION', growOutcome: null, roundOutcome: null, bankAward: 0 });
}

export function resolveGrow(session: GameSession): GameSession {
  if (session.state !== 'DECISION' || !isStage(session.stage) || !isCrystalIndex(session.crystalIndex)) return session;
  const risk = getBreakRisk(session.stage, session.crystalIndex);
  if (risk === null) return session;

  const draw = nextSeededValue(session.rngState);
  if (doesBreak(draw.value, risk)) {
    return copySession(session, {
      state: 'GROW_RESOLVING',
      rngState: draw.nextState,
      pot: 0,
      bankStreak: 0,
      breaks: session.breaks + 1,
      growOutcome: 'SHATTERED',
      roundOutcome: 'SHATTERED',
      bankAward: 0,
    });
  }

  const nextStage = (session.stage + 1) as Stage;
  const nextPot = STAGE_POTS[nextStage - 1];
  if (nextPot === undefined) return session;
  return copySession(session, {
    state: 'GROW_RESOLVING',
    rngState: draw.nextState,
    stage: nextStage,
    pot: nextPot,
    highestStage: Math.max(session.highestStage, nextStage) as Stage,
    growOutcome: 'SAFE',
    roundOutcome: null,
    bankAward: 0,
  });
}

export function completeGrow(session: GameSession): GameSession {
  if (session.state !== 'GROW_RESOLVING') return session;
  if (session.growOutcome === 'SAFE') {
    return copySession(session, { state: 'DECISION', growOutcome: null, roundOutcome: null });
  }
  if (session.growOutcome === 'SHATTERED') {
    return copySession(session, { state: 'ROUND_FEEDBACK', roundOutcome: 'SHATTERED' });
  }
  return session;
}

export function getBankMultiplier(preBankStreak: number): number {
  if (!Number.isSafeInteger(preBankStreak) || preBankStreak < 0) throw new RangeError('streak must be a non-negative safe integer');
  return 1 + Math.min(preBankStreak, 4) * 0.05;
}

export function calculateBankAward(pot: number, preBankStreak: number): number {
  if (!isNonNegativeSafeInteger(pot)) throw new RangeError('pot must be a non-negative safe integer');
  return Math.round(pot * getBankMultiplier(preBankStreak));
}

export function resolveBank(session: GameSession): GameSession {
  if (session.state !== 'DECISION' || !isStage(session.stage) || !isCrystalIndex(session.crystalIndex)) return session;
  if (!isNonNegativeSafeInteger(session.pot) || !isNonNegativeSafeInteger(session.totalScore)) return session;
  const award = calculateBankAward(session.pot, session.bankStreak);
  const bankStreak = session.bankStreak + 1;
  return copySession(session, {
    state: 'BANK_RESOLVING',
    pot: 0,
    totalScore: session.totalScore + award,
    bankStreak,
    bestBankStreak: Math.max(session.bestBankStreak, bankStreak),
    successfulBanks: session.successfulBanks + 1,
    growOutcome: null,
    roundOutcome: 'BANKED',
    bankAward: award,
  });
}

export function completeBank(session: GameSession): GameSession {
  if (session.state !== 'BANK_RESOLVING') return session;
  return copySession(session, { state: 'ROUND_FEEDBACK' });
}

export function advanceCrystal(session: GameSession): GameSession {
  if (session.state !== 'ROUND_FEEDBACK') return session;
  if (session.crystalIndex === 8) return copySession(session, { state: 'RESULT' });

  const nextCrystal = (session.crystalIndex + 1) as CrystalIndex;
  return copySession(session, {
    state: 'CRYSTAL_INTRO',
    crystalIndex: nextCrystal,
    stage: 1,
    pot: STAGE_POTS[0]!,
    growOutcome: null,
    roundOutcome: null,
    bankAward: 0,
  });
}

export function getSessionStats(session: GameSession): SessionStats {
  return Object.freeze({
    totalScore: session.totalScore,
    successfulBanks: session.successfulBanks,
    breaks: session.breaks,
    highestStage: session.highestStage,
    bestBankStreak: session.bestBankStreak,
  });
}
