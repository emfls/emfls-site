import { PLAYER_SIZE } from './constants.ts';
import type { Gate } from './types.ts';

export const getAngularPadding = (radius: number): number => {
  if (!Number.isFinite(radius) || radius < 0) throw new RangeError('radius must be finite and non-negative.');
  return Math.asin(Math.min(1, PLAYER_SIZE / Math.max(radius, 0.05)));
};

export const intervalsOverlapInclusive = (aMin: number, aMax: number, bMin: number, bMax: number): boolean => {
  if (![aMin, aMax, bMin, bMax].every(Number.isFinite) || aMin > aMax || bMin > bMax) {
    throw new RangeError('Intervals must be finite and ordered.');
  }
  return aMin <= bMax && bMin <= aMax;
};

export const collidesWithGate = (progressAngle: number, radius: number, gate: Pick<Gate, 'obstacles'>): boolean => {
  if (!Number.isFinite(progressAngle) || progressAngle < 0 || !Number.isFinite(radius) || radius < 0) {
    throw new RangeError('Player position must be finite and non-negative.');
  }
  const playerMin = radius - PLAYER_SIZE;
  const playerMax = radius + PLAYER_SIZE;
  const padding = getAngularPadding(radius);
  return gate.obstacles.some((obstacle) =>
    intervalsOverlapInclusive(playerMin, playerMax, obstacle.rMin, obstacle.rMax)
      && progressAngle >= obstacle.angleStart - padding
      && progressAngle <= obstacle.angleEnd + padding,
  );
};
