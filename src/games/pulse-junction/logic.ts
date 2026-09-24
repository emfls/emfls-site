import {
  GOOD_THRESHOLD,
  PERFECT_THRESHOLD,
  PULSE_END_RADIUS,
  PULSE_START_RADIUS,
} from './types';
import type { DifficultyConfig, Judgement, PulseMotion, RoundConfig } from './types';

const difficultyConfigs: DifficultyConfig[] = [
  { id: 'learn', targetMin: 0.45, targetMax: 0.70, speedMin: 0.46, speedMax: 0.46, accelerationChoices: [0], minSpeed: 0.46, maxSpeed: 0.46, decoyMin: 0, decoyMax: 0 },
  { id: 'vary', targetMin: 0.40, targetMax: 0.76, speedMin: 0.50, speedMax: 0.60, accelerationChoices: [0], minSpeed: 0.50, maxSpeed: 0.60, decoyMin: 0, decoyMax: 0 },
  { id: 'pressure', targetMin: 0.35, targetMax: 0.82, speedMin: 0.58, speedMax: 0.70, accelerationChoices: [-0.06, 0, 0.06], minSpeed: 0.48, maxSpeed: 0.78, decoyMin: 0, decoyMax: 0 },
  { id: 'read', targetMin: 0.35, targetMax: 0.82, speedMin: 0.66, speedMax: 0.78, accelerationChoices: [0, 0.05], minSpeed: 0.66, maxSpeed: 0.84, decoyMin: 1, decoyMax: 1 },
  { id: 'final', targetMin: 0.35, targetMax: 0.82, speedMin: 0.74, speedMax: 0.88, accelerationChoices: [0, 0.04, 0.08], minSpeed: 0.74, maxSpeed: 0.96, decoyMin: 1, decoyMax: 2 },
];

export const judgeError = (error: number): Judgement => {
  if (!Number.isFinite(error) || error < 0) return 'MISS';
  if (error <= PERFECT_THRESHOLD) return 'PERFECT';
  if (error <= GOOD_THRESHOLD) return 'GOOD';
  return 'MISS';
};

export const judgeRadii = (pulseRadius: number, targetRadius: number): Judgement => judgeError(Math.abs(pulseRadius - targetRadius));

export const getDifficulty = (round: number): DifficultyConfig => {
  if (!Number.isInteger(round) || round < 1 || round > 20) throw new RangeError('Pulse Junction round must be between 1 and 20.');
  if (round <= 4) return difficultyConfigs[0];
  if (round <= 8) return difficultyConfigs[1];
  if (round <= 12) return difficultyConfigs[2];
  if (round <= 16) return difficultyConfigs[3];
  return difficultyConfigs[4];
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const distanceAt = (config: RoundConfig, elapsedSeconds: number): number => {
  const time = Math.max(0, elapsedSeconds);
  const acceleration = config.acceleration;
  if (acceleration === 0) return config.initialSpeed * time;
  const boundary = acceleration > 0 ? config.maxSpeed : config.minSpeed;
  const timeToBoundary = (boundary - config.initialSpeed) / acceleration;
  if (timeToBoundary <= 0 || time <= timeToBoundary) return config.initialSpeed * time + 0.5 * acceleration * time ** 2;
  return config.initialSpeed * timeToBoundary + 0.5 * acceleration * timeToBoundary ** 2 + boundary * (time - timeToBoundary);
};

export const getPulseMotionAtElapsed = (config: RoundConfig, elapsedSeconds: number): PulseMotion => {
  const elapsed = Math.max(0, elapsedSeconds);
  const unclampedSpeed = config.initialSpeed + config.acceleration * elapsed;
  return {
    radius: clamp(PULSE_START_RADIUS + distanceAt(config, elapsed), PULSE_START_RADIUS, PULSE_END_RADIUS),
    speed: clamp(unclampedSpeed, config.minSpeed, config.maxSpeed),
  };
};

export const getPulseEndTimeSeconds = (config: RoundConfig): number => {
  let low = 0;
  let high = 4;
  while (getPulseMotionAtElapsed(config, high).radius < PULSE_END_RADIUS && high < 128) high *= 2;
  for (let index = 0; index < 60; index += 1) {
    const middle = (low + high) / 2;
    if (getPulseMotionAtElapsed(config, middle).radius >= PULSE_END_RADIUS) high = middle;
    else low = middle;
  }
  return high;
};
