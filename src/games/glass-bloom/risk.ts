import { BASE_BREAK_RISKS, CRYSTAL_RISK_MODIFIERS } from './constants.ts';
import type { CrystalIndex, RiskBand, Stage } from './types.ts';

export function isStage(value: unknown): value is Stage {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 8;
}

export function isCrystalIndex(value: unknown): value is CrystalIndex {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 8;
}

export function getBreakRisk(stage: number, crystalIndex: number): number | null {
  if (!isStage(stage) || !isCrystalIndex(crystalIndex) || stage === 8) return null;
  const baseRisk = BASE_BREAK_RISKS[stage - 1];
  const modifier = CRYSTAL_RISK_MODIFIERS[crystalIndex - 1];
  if (baseRisk === undefined || modifier === undefined) return null;
  return baseRisk + modifier;
}

export function getRiskBand(risk: number): RiskBand {
  if (!Number.isInteger(risk) || risk < 0 || risk > 100) throw new RangeError('risk must be an integer from 0 through 100');
  if (risk < 15) return 'LOW';
  if (risk < 30) return 'MODERATE';
  if (risk < 50) return 'HIGH';
  return 'SEVERE';
}

export function doesBreak(roll: number, risk: number): boolean {
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1) throw new RangeError('roll must be in [0, 1)');
  if (!Number.isInteger(risk) || risk < 0 || risk > 100) throw new RangeError('risk must be an integer from 0 through 100');
  return roll < risk / 100;
}
