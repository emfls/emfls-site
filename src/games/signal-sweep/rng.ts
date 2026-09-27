const UINT32_RANGE = 0x1_0000_0000;

export type Uint32Source = () => number;

export function createSeededRandom(seed: number): Uint32Source {
  if (!Number.isInteger(seed) || seed < 0 || seed >= UINT32_RANGE) {
    throw new RangeError('seed must be an unsigned 32-bit integer');
  }
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return (value ^ (value >>> 14)) >>> 0;
  };
}

export function drawInt(maxExclusive: number, nextUint32: Uint32Source): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > UINT32_RANGE) {
    throw new RangeError('maxExclusive must be an integer from 1 through 2^32');
  }
  if (maxExclusive === 1) return 0;

  const limit = Math.floor(UINT32_RANGE / maxExclusive) * maxExclusive;
  for (;;) {
    const value = nextUint32();
    if (!Number.isInteger(value) || value < 0 || value >= UINT32_RANGE) {
      throw new RangeError('random source must return an unsigned 32-bit integer');
    }
    if (value < limit) return value % maxExclusive;
  }
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
    // Explicitly fall through to the one-draw non-cryptographic fallback.
  }

  const random = options.fallbackRandom ?? Math.random;
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError('fallback random source must return a value in [0, 1)');
  }
  return Math.floor(value * UINT32_RANGE) >>> 0;
}
