import { UINT32_RANGE } from './constants.ts';

export type SeededValue = Readonly<{ value: number; nextState: number }>;
export type Uint32Source = () => number;

function assertUint32(seed: number, label: string): void {
  if (!Number.isInteger(seed) || seed < 0 || seed >= UINT32_RANGE) {
    throw new RangeError(`${label} must be an unsigned 32-bit integer`);
  }
}

export function nextSeededValue(state: number): SeededValue {
  assertUint32(state, 'state');
  const nextState = (state + 0x6d2b79f5) >>> 0;
  let value = nextState;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  const uint32 = (value ^ (value >>> 14)) >>> 0;
  return Object.freeze({ value: uint32 / UINT32_RANGE, nextState });
}

export function createSeededRandom(seed: number): () => number {
  assertUint32(seed, 'seed');
  let state = seed;
  return () => {
    const draw = nextSeededValue(state);
    state = draw.nextState;
    return draw.value;
  };
}

export function createSessionSeed(options: {
  cryptoProvider?: Pick<Crypto, 'getRandomValues'> | null;
  fallbackRandom?: () => number;
} = {}): number {
  let cryptoProvider: Pick<Crypto, 'getRandomValues'> | null | undefined;
  try {
    cryptoProvider = options.cryptoProvider === undefined ? globalThis.crypto : options.cryptoProvider;
    if (cryptoProvider && typeof cryptoProvider.getRandomValues === 'function') {
      const values = new Uint32Array(1);
      cryptoProvider.getRandomValues(values);
      return values[0]!;
    }
  } catch {
    // If secure seed acquisition is unavailable, use one explicit fallback draw.
  }

  const fallbackRandom = options.fallbackRandom ?? Math.random;
  const value = fallbackRandom();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('fallback random source must return a value in [0, 1)');
  }
  return Math.floor(value * UINT32_RANGE) >>> 0;
}
