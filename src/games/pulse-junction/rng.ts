import { getDifficulty } from './logic';
import type { RoundConfig } from './types';

export type RandomSource = () => number;

const safeRandom = (random: RandomSource) => Math.min(0.9999999999999999, Math.max(0, Number(random()) || 0));
export const randomBetween = (min: number, max: number, random: RandomSource) => min + (max - min) * safeRandom(random);
export const choose = <T>(values: readonly T[], random: RandomSource): T => values[Math.min(values.length - 1, Math.floor(safeRandom(random) * values.length))];

export const createSeededRandom = (seed: number): RandomSource => {
  let state = (seed >>> 0) || 0x6d2b79f5;
  return () => {
    state = Math.imul(state ^ (state >>> 15), state | 1);
    state ^= state + Math.imul(state ^ (state >>> 7), state | 61);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
};

const decoyIsValid = (candidate: number, target: number, decoys: number[]) => Math.abs(candidate - target) >= 0.14 && decoys.every((decoy) => Math.abs(candidate - decoy) >= 0.10);

export const generateRoundConfig = (round: number, random: RandomSource): RoundConfig => {
  const difficulty = getDifficulty(round);
  const targetRadius = randomBetween(difficulty.targetMin, difficulty.targetMax, random);
  const decoyCount = difficulty.decoyMax === difficulty.decoyMin ? difficulty.decoyMin : (safeRandom(random) < 0.5 ? 1 : 2);
  const decoyRadii: number[] = [];
  for (let index = 0; index < decoyCount; index += 1) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const candidate = randomBetween(0.25, 0.90, random);
      if (decoyIsValid(candidate, targetRadius, decoyRadii)) { decoyRadii.push(candidate); break; }
    }
  }
  return {
    round,
    difficulty: difficulty.id,
    targetRadius,
    initialSpeed: randomBetween(difficulty.speedMin, difficulty.speedMax, random),
    acceleration: choose(difficulty.accelerationChoices, random),
    minSpeed: difficulty.minSpeed,
    maxSpeed: difficulty.maxSpeed,
    decoyRadii,
  };
};
