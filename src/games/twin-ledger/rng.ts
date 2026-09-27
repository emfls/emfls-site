import type { Uint32Source } from './types.ts';

const UINT32_RANGE = 0x1_0000_0000;

export type SessionSeedOptions = Readonly<{
  cryptoProvider?: Pick<Crypto, 'getRandomValues'>;
  fallbackRandom?: () => number;
}>;

export const createSessionSeed = ({ cryptoProvider, fallbackRandom = Math.random }: SessionSeedOptions = {}): number => {
  try {
    const provider = cryptoProvider ?? globalThis.crypto;
    if (provider && typeof provider.getRandomValues === 'function') {
      const seed = provider.getRandomValues(new Uint32Array(1))[0];
      if (Number.isSafeInteger(seed) && seed >= 0 && seed < UINT32_RANGE) return seed;
    }
  } catch {
    // The explicitly specified single Math.random fallback below handles unavailable crypto.
  }

  const sample = fallbackRandom();
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1) {
    throw new RangeError('Fallback random source must return a finite value in [0, 1).');
  }
  return Math.floor(sample * UINT32_RANGE);
};

export const createSeededRandom = (seed: number): Uint32Source => {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed >= UINT32_RANGE) {
    throw new RangeError('seed must be an unsigned 32-bit integer.');
  }

  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return (value ^ (value >>> 14)) >>> 0;
  };
};

export const drawInt = (maxExclusive: number, nextUint32: Uint32Source): number => {
  if (!Number.isSafeInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > UINT32_RANGE) {
    throw new RangeError('maxExclusive must be an integer from 1 through 2^32.');
  }
  if (maxExclusive === 1) return 0;

  const limit = Math.floor(UINT32_RANGE / maxExclusive) * maxExclusive;
  while (true) {
    const word = nextUint32();
    if (!Number.isSafeInteger(word) || word < 0 || word >= UINT32_RANGE) {
      throw new RangeError('Random source must return an unsigned 32-bit integer.');
    }
    if (word < limit) return word % maxExclusive;
  }
};
