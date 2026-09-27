import {
  FIRST_GATE_SPACING,
  GENERATOR_MAX_ATTEMPTS,
  LARGE_SHIFT_THRESHOLD,
  MAX_ANGULAR_PADDING,
  MAX_GATE_LOOKAHEAD,
  MAX_PATTERN_HISTORY,
  MAX_RADIUS,
  MIN_RADIUS,
  MIN_UNPASSED_GATE_LOOKAHEAD,
  MIN_GATE_THICKNESS,
  MAX_GATE_THICKNESS,
  PLAYER_SIZE,
  SAFETY_MARGIN,
  START_RADIUS,
  TARGET_GATE_LOOKAHEAD,
} from './constants.ts';
import { getAngularSpeed } from './motion.ts';
import { getEligibleGateTemplates, GATE_TEMPLATES, validateGateTemplates } from './templates.ts';
import { randomFloat, randomIndex, readRandomUnit } from './rng.ts';
import type { CorridorClass, Gate, GateGenerationContext, GateGenerationResult, GateTemplate, RandomSource } from './types.ts';

type Interval = readonly [number, number];

const spacingRange = (activeMs: number): readonly [number, number] =>
  activeMs < 15_000 ? [0.85, 1.1] : activeMs < 30_000 ? [0.72, 0.95] : activeMs < 45_000 ? [0.62, 0.85] : [0.55, 0.78];

const getUsableInterval = (gate: Pick<Gate, 'safeRMin' | 'safeRMax'> & Partial<Pick<Gate, 'usableRMin' | 'usableRMax'>>): Interval => {
  const min = gate.usableRMin ?? gate.safeRMin + PLAYER_SIZE;
  const max = gate.usableRMax ?? gate.safeRMax - PLAYER_SIZE;
  return [min, max];
};

export const requiredRadialDistance = (previous: Interval, next: Interval): number => {
  if (![...previous, ...next].every(Number.isFinite) || previous[0] > previous[1] || next[0] > next[1]) {
    throw new RangeError('Radial intervals must be finite and ordered.');
  }
  if (previous[1] >= next[0] && next[1] >= previous[0]) return 0;
  return next[0] > previous[1] ? next[0] - previous[1] : previous[0] - next[1];
};

const intervalClass = (interval: Interval): CorridorClass => {
  const midpoint = (interval[0] + interval[1]) / 2;
  return midpoint <= 0.42 ? 'INNER' : midpoint >= 0.68 ? 'OUTER' : 'CENTER';
};

const classifyShift = (from: Interval, to: Interval): 'INWARD' | 'OUTWARD' | 'NONE' => {
  if (requiredRadialDistance(from, to) < LARGE_SHIFT_THRESHOLD) return 'NONE';
  if (to[0] >= from[1]) return 'OUTWARD';
  if (to[1] <= from[0]) return 'INWARD';
  return 'NONE';
};

const rejectPattern = (history: readonly Gate[], nextInterval: Interval): string | undefined => {
  const recent = history.slice(-3);
  if (recent.length === 3) {
    const intervals = recent.map((gate) => getUsableInterval(gate));
    const first = classifyShift(intervals[0], intervals[1]);
    const second = classifyShift(intervals[1], intervals[2]);
    const third = classifyShift(intervals[2], nextInterval);
    if (first !== 'NONE' && first === second && second === third) return 'SAME_DIRECTION_LARGE_SHIFT';
  }

  if (recent.length >= 2) {
    const classes = [...recent.slice(-2).map((gate) => intervalClass(getUsableInterval(gate))), intervalClass(nextInterval)];
    const isExtremeSwitch = (a: CorridorClass, b: CorridorClass) =>
      (a === 'INNER' && b === 'OUTER') || (a === 'OUTER' && b === 'INNER');
    if (isExtremeSwitch(classes[0], classes[1]) && isExtremeSwitch(classes[1], classes[2])) return 'EXTREME_SWITCH';
  }
  return undefined;
};

const makeGate = (
  id: number,
  template: GateTemplate,
  translation: number,
  angleStart: number,
  thickness: number,
  previousInterval: Interval,
): Gate | undefined => {
  const safeRMin = template.safeRMin + translation;
  const safeRMax = template.safeRMax + translation;
  const usableRMin = safeRMin + PLAYER_SIZE;
  const usableRMax = safeRMax - PLAYER_SIZE;
  if (safeRMin < MIN_RADIUS || safeRMax > MAX_RADIUS || usableRMin > usableRMax || thickness < MIN_GATE_THICKNESS || thickness > MAX_GATE_THICKNESS) return undefined;
  const angleEnd = angleStart + thickness;
  const obstacles = [];
  if (safeRMin > MIN_RADIUS) obstacles.push({ id: `${id}:inner`, angleStart, angleEnd, rMin: MIN_RADIUS, rMax: safeRMin });
  if (safeRMax < MAX_RADIUS) obstacles.push({ id: `${id}:outer`, angleStart, angleEnd, rMin: safeRMax, rMax: MAX_RADIUS });
  return {
    id,
    angleStart,
    angleEnd,
    safeRMin,
    safeRMax,
    usableRMin,
    usableRMax,
    obstacles,
    passed: false,
    templateId: template.id,
    corridorClass: template.corridorClass,
    requiredRadialDistance: requiredRadialDistance(previousInterval, [usableRMin, usableRMax]),
  };
};

const previousIntervalFor = (context: GateGenerationContext): Interval => {
  const previous = context.gates.at(-1);
  return previous ? getUsableInterval(previous) : [START_RADIUS, START_RADIUS];
};

const passageAngleFor = (context: GateGenerationContext): number => {
  const previous = context.gates.at(-1);
  return previous ? previous.angleEnd + SAFETY_MARGIN : context.progressAngle;
};

const fairnessAccepts = (gate: Gate, context: GateGenerationContext, previousInterval: Interval): boolean => {
  const deltaAngle = Math.max(0, gate.angleStart - MAX_ANGULAR_PADDING - passageAngleFor(context));
  const availableTime = deltaAngle / getAngularSpeed(context.activeMs);
  return gate.requiredRadialDistance <= 0.8 * 0.7 * availableTime;
};

export const generateNextGate = (context: GateGenerationContext, random: RandomSource): GateGenerationResult => {
  if (!Number.isFinite(context.progressAngle) || context.progressAngle < 0 || !Number.isFinite(context.activeMs) || context.activeMs < 0 || !Number.isSafeInteger(context.nextGateId) || context.nextGateId < 1) {
    throw new RangeError('Invalid Gate generation context.');
  }
  if (context.gates.length > MAX_GATE_LOOKAHEAD) throw new RangeError('Gate lookahead cannot exceed seven.');
  const validation = validateGateTemplates(GATE_TEMPLATES);
  if (!validation.valid) throw new Error(`Invalid Gate template constants: ${validation.errors.join(' ')}`);
  const eligible = getEligibleGateTemplates(context.activeMs);
  const first = context.gates.length === 0;
  const previousInterval = previousIntervalFor(context);
  const spacing = spacingRange(context.activeMs);
  const rejections: string[] = [];

  for (let attempt = 1; attempt <= GENERATOR_MAX_ATTEMPTS; attempt += 1) {
    const template = eligible[randomIndex(eligible.length, random)];
    const translation = randomFloat(-0.025, 0.025, random);
    const thickness = randomFloat(MIN_GATE_THICKNESS, MAX_GATE_THICKNESS, random);
    const angleStart = first ? context.progressAngle + FIRST_GATE_SPACING : context.gates.at(-1)!.angleStart + randomFloat(spacing[0], spacing[1], random);
    const candidate = makeGate(context.nextGateId, template, translation, angleStart, thickness, previousInterval);
    if (!candidate) {
      rejections.push('STRUCTURE');
      continue;
    }
    if (!fairnessAccepts(candidate, context, previousInterval)) {
      rejections.push('FAIRNESS');
      continue;
    }
    const patternRejection = rejectPattern(context.history, [candidate.usableRMin, candidate.usableRMax]);
    if (patternRejection) {
      rejections.push(patternRejection);
      continue;
    }
    return { gate: candidate, attempts: attempt, usedFallback: false, rejections };
  }

  const fallbackTemplate = GATE_TEMPLATES[0];
  const fallbackSpacing = first ? FIRST_GATE_SPACING : spacing[1];
  const fallbackAngle = first ? context.progressAngle + fallbackSpacing : context.gates.at(-1)!.angleStart + fallbackSpacing;
  const fallback = makeGate(context.nextGateId, fallbackTemplate, 0, fallbackAngle, MIN_GATE_THICKNESS, previousInterval);
  if (!fallback) throw new Error('Deterministic Gate fallback is structurally invalid.');
  return { gate: fallback, attempts: GENERATOR_MAX_ATTEMPTS, usedFallback: true, rejections };
};

export const removeSafelyPassedGates = (progressAngle: number, gates: readonly Gate[]): Gate[] => {
  if (!Number.isFinite(progressAngle) || progressAngle < 0) throw new RangeError('progressAngle must be finite and non-negative.');
  return gates.filter((gate) => !gate.passed || progressAngle <= gate.angleEnd + SAFETY_MARGIN + MAX_ANGULAR_PADDING);
};

export const maintainGateLookahead = (context: GateGenerationContext, random: RandomSource): GateGenerationContext => {
  if (context.gates.length > MAX_GATE_LOOKAHEAD) throw new RangeError('Gate lookahead cannot exceed seven.');
  const gates = [...context.gates];
  const history = [...context.history].slice(-MAX_PATTERN_HISTORY);
  let nextGateId = context.nextGateId;
  const unpassed = () => gates.filter((gate) => !gate.passed).length;
  const target = Math.max(TARGET_GATE_LOOKAHEAD, MIN_UNPASSED_GATE_LOOKAHEAD);
  while (unpassed() < target && gates.length < MAX_GATE_LOOKAHEAD) {
    const result = generateNextGate({ ...context, gates, history, nextGateId }, random);
    gates.push(result.gate);
    history.push(result.gate);
    if (history.length > MAX_PATTERN_HISTORY) history.shift();
    nextGateId += 1;
  }
  return { ...context, gates, history, nextGateId };
};
