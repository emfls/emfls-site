import type { GameCategory } from './games';

export type GameCategoryDefinition = {
  name: GameCategory;
  slug: string;
  href: string;
  eyebrow: string;
  title: string;
  description: string;
};

export const gameCategories: GameCategoryDefinition[] = [
  {
    name: 'Puzzle',
    slug: 'puzzle',
    href: '/categories/puzzle/',
    eyebrow: 'Puzzle games',
    title: 'Puzzle Browser Games',
    description: 'Think through spatial, number, and placement challenges designed for quick, focused sessions.',
  },
  {
    name: 'Arcade',
    slug: 'arcade',
    href: '/categories/arcade/',
    eyebrow: 'Arcade games',
    title: 'Arcade Browser Games',
    description: 'Jump into quick browser games built around movement, timing, and risk.',
  },
  {
    name: 'Reflex',
    slug: 'reflex',
    href: '/categories/reflex/',
    eyebrow: 'Reflex games',
    title: 'Reflex Browser Games',
    description: 'Test your timing, recognition, and quick decisions in short sessions you can restart instantly.',
  },
  {
    name: 'Strategy',
    slug: 'strategy',
    href: '/categories/strategy/',
    eyebrow: 'Strategy games',
    title: 'Strategy Browser Games',
    description: 'Make compact strategic choices with clear trade-offs, from shared-board play to risk management.',
  },
];
