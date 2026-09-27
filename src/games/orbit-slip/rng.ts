import type { RandomSource } from './types.ts';

const UINT32_RANGE = 0x1_0000_0000;

export const createSessionSeed = (): number => Math.floor(Math.random() * UINT32_RANGE) >>> 0;

export const createSeededRandom = (seed: number): RandomSource => {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed >= UINT32_RANGE) {
    throw new RangeError('seed must be an unsigned 32-bit integer.');
  }
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / UINT32_RANGE;
  };
};

export const readRandomUnit = (random: RandomSource): number => {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('Random source must return a value in [0, 1).');
  return value;
};

export const randomFloat = (min: number, max: number, random: RandomSource): number => {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) throw new RangeError('Random range must be finite and ordered.');
  return min + readRandomUnit(random) * (max - min);
};

export const randomIndex = (length: number, random: RandomSource): number => {
  if (!Number.isSafeInteger(length) || length <= 0) throw new RangeError('length must be a positive integer.');
  return Math.floor(readRandomUnit(random) * length);
};
