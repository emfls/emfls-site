export type GameCategory = 'Puzzle' | 'Arcade' | 'Reflex' | 'Strategy';

export type GameMode = 'Solo' | 'Local 2 Player';

export type GameMeta = {
  name: string;
  slug: string;
  href: string;
  description: string;
  primaryCategory: GameCategory;
  categories: GameCategory[];
  mode: GameMode;
  session: string;
  comparison: {
    challenge: string;
    input: string;
    bestFor: string;
  };
  featuredOrder?: number;
  quickPlayOrder?: number;
};

export const games: GameMeta[] = [
  {
    name: 'Pulse Junction',
    slug: 'pulse-junction',
    href: '/games/pulse-junction/',
    description: 'Time your input as an expanding pulse crosses the target ring.',
    primaryCategory: 'Reflex',
    categories: ['Reflex', 'Arcade'],
    mode: 'Solo',
    session: '30–60 sec',
    comparison: { challenge: 'Time a pulse crossing a marked radius', input: 'Tap, click, or Space', bestFor: 'Short timing rounds and combo building' },
    featuredOrder: 1,
    quickPlayOrder: 1,
  },
  {
    name: 'Mirror Drift',
    slug: 'mirror-drift',
    href: '/games/mirror-drift/',
    description: 'Move one point while its mirrored partner moves in the opposite direction.',
    primaryCategory: 'Puzzle',
    categories: ['Puzzle'],
    mode: 'Solo',
    session: '1–2 min',
    comparison: { challenge: 'Route two reflected points together', input: 'Drag one point', bestFor: 'Paired spatial planning' },
    featuredOrder: 2,
  },
  {
    name: 'Gravity Pact',
    slug: 'gravity-pact',
    href: '/games/gravity-pact/',
    description: 'Take turns choosing gravity and move every token on the shared board.',
    primaryCategory: 'Strategy',
    categories: ['Strategy'],
    mode: 'Local 2 Player',
    session: '2–4 min',
    comparison: { challenge: 'Plan one-cell moves on a shared board', input: 'Direction pad or Arrow Keys', bestFor: 'Taking turns and reading an opponent' },
    featuredOrder: 4,
  },
  {
    name: 'Orbit Slip',
    slug: 'orbit-slip',
    href: '/games/orbit-slip/',
    description: 'Adjust your orbit radius and slip through gaps without touching the barriers.',
    primaryCategory: 'Arcade',
    categories: ['Arcade', 'Reflex'],
    mode: 'Solo',
    session: '30–90 sec',
    comparison: { challenge: 'Fit an orbiting point through moving gaps', input: 'Drag radius or use direction keys', bestFor: 'Continuous movement with a narrow control axis' },
    featuredOrder: 3,
    quickPlayOrder: 2,
  },
  {
    name: 'Twin Ledger',
    slug: 'twin-ledger',
    href: '/games/twin-ledger/',
    description: 'Place signed numbers into two ledgers and keep their totals under control.',
    primaryCategory: 'Strategy',
    categories: ['Strategy', 'Puzzle'],
    mode: 'Solo',
    session: '1–3 min',
    comparison: { challenge: 'Place signed values while limiting the gap', input: 'Choose Left or Right ledger', bestFor: 'Balancing a changing total' },
  },
  {
    name: 'Signal Sweep',
    slug: 'signal-sweep',
    href: '/games/signal-sweep/',
    description: 'Scan the board and select every symbol that matches the current visual rule.',
    primaryCategory: 'Reflex',
    categories: ['Reflex'],
    mode: 'Solo',
    session: '45–90 sec',
    comparison: { challenge: 'Find every symbol matching a visual rule', input: 'Tap, click, Enter, or Space', bestFor: 'Scanning multiple symbol attributes' },
    quickPlayOrder: 3,
  },
  {
    name: 'Field Bloom',
    slug: 'field-bloom',
    href: '/games/field-bloom/',
    description: 'Place energy pieces so every target activates exactly as required without hitting forbidden cells.',
    primaryCategory: 'Puzzle',
    categories: ['Puzzle', 'Strategy'],
    mode: 'Solo',
    session: '30 sec–2 min',
    comparison: { challenge: 'Meet exact activation counts without forbidden cells', input: 'Select a piece, then place it', bestFor: 'Planning overlapping piece footprints' },
  },
  {
    name: 'Glass Bloom',
    slug: 'glass-bloom',
    href: '/games/glass-bloom/',
    description: 'Grow the crystal for a bigger reward or bank your score before it shatters.',
    primaryCategory: 'Arcade',
    categories: ['Arcade', 'Strategy'],
    mode: 'Solo',
    session: '1–2 min',
    comparison: { challenge: 'Choose between growing a pot and banking it', input: 'Grow/Bank buttons, Space, or Enter', bestFor: 'Stopping under escalating risk' },
  },
];

export function getRelatedGames(gameSlug: string, limit = 3): GameMeta[] {
  const current = games.find((game) => game.slug === gameSlug);
  if (!current || !Number.isInteger(limit) || limit <= 0) return [];

  return games
    .map((candidate, index) => ({
      candidate,
      index,
      categoryOverlap: candidate.categories.filter((category) => current.categories.includes(category)).length,
    }))
    .filter(({ candidate }) => candidate.slug !== current.slug)
    .sort((left, right) =>
      right.categoryOverlap - left.categoryOverlap ||
      Number(right.candidate.primaryCategory === current.primaryCategory) - Number(left.candidate.primaryCategory === current.primaryCategory) ||
      Number(right.candidate.mode === current.mode) - Number(left.candidate.mode === current.mode) ||
      left.index - right.index,
    )
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

function getDiscoveryGames(orderKey: 'featuredOrder' | 'quickPlayOrder'): GameMeta[] {
  return games
    .filter((game) => Number.isInteger(game[orderKey]))
    .sort((left, right) => (left[orderKey] ?? 0) - (right[orderKey] ?? 0));
}

export function getFeaturedGames(): GameMeta[] {
  return getDiscoveryGames('featuredOrder');
}

export function getQuickPlayGames(): GameMeta[] {
  return getDiscoveryGames('quickPlayOrder');
}

export { gameEditorial } from './gameEditorial.ts';
