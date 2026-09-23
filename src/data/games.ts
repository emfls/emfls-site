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
  },
];
