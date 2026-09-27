import { MAX_RADIUS, MIN_RADIUS } from './constants.ts';
import type { CorridorClass, GateTemplate } from './types.ts';

export const GATE_TEMPLATES: readonly GateTemplate[] = Object.freeze([
  Object.freeze({ id: 1, safeRMin: 0.39, safeRMax: 0.71, corridorClass: 'CENTER' as const }),
  Object.freeze({ id: 2, safeRMin: 0.28, safeRMax: 0.50, corridorClass: 'INNER' as const }),
  Object.freeze({ id: 3, safeRMin: 0.60, safeRMax: 0.82, corridorClass: 'OUTER' as const }),
  Object.freeze({ id: 4, safeRMin: 0.32, safeRMax: 0.54, corridorClass: 'INNER' as const }),
  Object.freeze({ id: 5, safeRMin: 0.56, safeRMax: 0.78, corridorClass: 'OUTER' as const }),
  Object.freeze({ id: 6, safeRMin: 0.42, safeRMax: 0.68, corridorClass: 'CENTER' as const }),
  Object.freeze({ id: 7, safeRMin: 0.35, safeRMax: 0.57, corridorClass: 'CENTER' as const }),
  Object.freeze({ id: 8, safeRMin: 0.53, safeRMax: 0.75, corridorClass: 'CENTER' as const }),
  Object.freeze({ id: 9, safeRMin: 0.30, safeRMax: 0.48, corridorClass: 'INNER' as const }),
  Object.freeze({ id: 10, safeRMin: 0.62, safeRMax: 0.80, corridorClass: 'OUTER' as const }),
  Object.freeze({ id: 11, safeRMin: 0.38, safeRMax: 0.55, corridorClass: 'CENTER' as const }),
  Object.freeze({ id: 12, safeRMin: 0.55, safeRMax: 0.72, corridorClass: 'CENTER' as const }),
]);

const validClasses: readonly CorridorClass[] = ['INNER', 'CENTER', 'OUTER'];

export interface TemplateValidation {
  readonly valid: boolean;
  readonly errors: readonly string[];
}

export const validateGateTemplates = (templates: readonly GateTemplate[]): TemplateValidation => {
  const errors: string[] = [];
  if (!Array.isArray(templates) || templates.length !== 12) errors.push('Expected exactly twelve templates.');
  const ids = new Set<number>();
  for (const template of templates) {
    if (!Number.isSafeInteger(template?.id) || template.id < 1 || template.id > 12 || ids.has(template.id)) {
      errors.push(`Invalid or duplicate template id: ${String(template?.id)}.`);
    } else ids.add(template.id);
    if (!Number.isFinite(template?.safeRMin) || !Number.isFinite(template?.safeRMax)) {
      errors.push(`Template ${String(template?.id)} has non-finite bounds.`);
      continue;
    }
    const width = template.safeRMax - template.safeRMin;
    if (template.safeRMin < MIN_RADIUS || template.safeRMax > MAX_RADIUS || width < 0.15) {
      errors.push(`Template ${String(template.id)} has invalid bounds or insufficient width.`);
    }
    if (!validClasses.includes(template.corridorClass)) errors.push(`Template ${String(template.id)} has an invalid corridor class.`);
    if (template.safeRMin + 0.025 > template.safeRMax - 0.025) errors.push(`Template ${String(template.id)} has no center-safe interval.`);
  }
  if (ids.size === 12 && Array.from(ids).some((id, index) => id !== index + 1)) errors.push('Template ids must be the integers 1 through 12.');
  return { valid: errors.length === 0, errors };
};

export const getEligibleGateTemplates = (activeMs: number): readonly GateTemplate[] => {
  if (!Number.isFinite(activeMs) || activeMs < 0) throw new RangeError('activeMs must be finite and non-negative.');
  const minimumWidth = activeMs < 15_000 ? 0.22 : activeMs < 30_000 ? 0.18 : 0.15;
  return GATE_TEMPLATES.filter((template) => template.safeRMax - template.safeRMin + Number.EPSILON * 4 >= minimumWidth);
};
