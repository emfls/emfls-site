import {
  MAX_FRAME_DELTA_MS,
  MAX_RADIAL_SPEED,
  MAX_RADIUS,
  MAX_SIM_STEP_MS,
  MIN_RADIUS,
  START_ANGLE,
  TAU,
} from './constants.ts';

const requireFinite = (value: number, name: string): void => {
  if (!Number.isFinite(value)) throw new RangeError(`${name} must be finite.`);
};

export const getAngularSpeed = (activeMs: number): number => {
  requireFinite(activeMs, 'activeMs');
  if (activeMs < 0) throw new RangeError('activeMs must be non-negative.');
  if (activeMs < 15_000) return 0.8;
  if (activeMs < 30_000) return 0.95;
  if (activeMs < 45_000) return 1.1;
  if (activeMs < 60_000) return 1.2;
  return 1.28;
};

export const clampRadius = (radius: number): number => {
  requireFinite(radius, 'radius');
  return Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, radius));
};

export const clampTargetRadius = (radius: number): number => clampRadius(radius);

export const moveRadiusTowardTarget = (radius: number, targetRadius: number, dtSeconds: number): number => {
  requireFinite(dtSeconds, 'dtSeconds');
  if (dtSeconds < 0) throw new RangeError('dtSeconds must be non-negative.');
  const current = clampRadius(radius);
  const target = clampTargetRadius(targetRadius);
  const distance = target - current;
  const maxStep = MAX_RADIAL_SPEED * dtSeconds;
  if (Math.abs(distance) <= maxStep) return target;
  return current + Math.sign(distance) * maxStep;
};

export const advanceProgressAngle = (progressAngle: number, activeMs: number, dtSeconds: number): number => {
  requireFinite(progressAngle, 'progressAngle');
  requireFinite(dtSeconds, 'dtSeconds');
  if (progressAngle < 0 || dtSeconds < 0) throw new RangeError('Progress and elapsed time must be non-negative.');
  return progressAngle + getAngularSpeed(activeMs) * dtSeconds;
};

export const wrapAngle = (angle: number): number => {
  requireFinite(angle, 'angle');
  return ((angle % TAU) + TAU) % TAU;
};

export const getPresentationAngle = (progressAngle: number): number => {
  requireFinite(progressAngle, 'progressAngle');
  return wrapAngle(START_ANGLE + progressAngle);
};

export const capFrameDeltaMs = (deltaMs: number): number => {
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return 0;
  return Math.min(deltaMs, MAX_FRAME_DELTA_MS);
};

export const splitFrameDeltaMs = (deltaMs: number): number[] => {
  requireFinite(deltaMs, 'deltaMs');
  if (deltaMs < 0) throw new RangeError('deltaMs must be non-negative.');
  if (deltaMs === 0) return [];
  const count = Math.ceil(deltaMs / MAX_SIM_STEP_MS);
  const step = deltaMs / count;
  return Array.from({ length: count }, () => step);
};
