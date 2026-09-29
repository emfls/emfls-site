import type { GameCategory } from './games';

export type GameCategoryDefinition = {
  name: GameCategory;
  slug: string;
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  editorial: {
    playStyle: string;
    chooseIf: string;
    gameComparisons: Record<string, string>;
  };
};

export const gameCategories: GameCategoryDefinition[] = [
  {
    name: 'Puzzle',
    slug: 'puzzle',
    href: '/categories/puzzle/',
    eyebrow: 'Puzzle games',
    title: 'Puzzle Browser Games',
    description: 'Think through spatial, number, and placement challenges designed for quick, focused sessions.',
    editorial: {
      playStyle: 'Puzzle here means three different ways to reason: route mirrored paths, balance signed totals, or cover exact grid constraints with pieces.',
      chooseIf: 'Choose this category when you want to plan a move or placement before committing, rather than react to a moving target.',
      gameComparisons: {
        'mirror-drift': 'Spatial planning: one drag routes a point and its reflected partner around obstacles.',
        'twin-ledger': 'Number planning: place a signed tile on one side and watch the absolute difference change.',
        'field-bloom': 'Placement planning: fit a piece mask so targets reach exact counts and forbidden cells stay clear.',
      },
    },
  },
  {
    name: 'Arcade',
    slug: 'arcade',
    href: '/categories/arcade/',
    eyebrow: 'Arcade games',
    title: 'Arcade Browser Games',
    description: 'Jump into quick browser games built around movement, timing, and risk.',
    editorial: {
      playStyle: 'These arcade sessions differ in what you control: a single timing input, an orbit radius, or the decision to expose an unbanked pot to risk.',
      chooseIf: 'Choose this category for a compact run where a quick input or a stop-or-continue choice drives the result.',
      gameComparisons: {
        'pulse-junction': 'Timing: tap as an expanding pulse crosses the marked ring, then protect the growing combo.',
        'orbit-slip': 'Movement: change radius early enough to pass the opening in an approaching gate.',
        'glass-bloom': 'Risk: decide whether the next pot increase is worth putting the current pot at risk.',
      },
    },
  },
  {
    name: 'Reflex',
    slug: 'reflex',
    href: '/categories/reflex/',
    eyebrow: 'Reflex games',
    title: 'Reflex Browser Games',
    description: 'Test your timing, recognition, and quick decisions in short sessions you can restart instantly.',
    editorial: {
      playStyle: 'Reflex can mean noticing a changing radius, reading several visual attributes, or moving before a narrow gate arrives.',
      chooseIf: 'Choose by the signal you prefer to read: one moving ring, a rule applied across a board, or an approaching spatial gap.',
      gameComparisons: {
        'pulse-junction': 'Single target: judge when one expanding ring reaches the selected radius.',
        'orbit-slip': 'Continuous gap: adjust radius while your point keeps orbiting toward the gate.',
        'signal-sweep': 'Visual rule: identify all matching symbols and avoid near-miss distractors.',
      },
    },
  },
  {
    name: 'Strategy',
    slug: 'strategy',
    href: '/categories/strategy/',
    eyebrow: 'Strategy games',
    title: 'Strategy Browser Games',
    description: 'Make compact strategic choices with clear trade-offs, from shared-board play to risk management.',
    editorial: {
      playStyle: 'Strategy spans opponent-aware shared movement, signed-number balance, constrained placement, and the timing of a bank decision.',
      chooseIf: 'Choose a game here when you want a consequence to carry into the next move, turn, placement, or risk decision.',
      gameComparisons: {
        'gravity-pact': 'Shared board: either player’s tokens can move or block a lane after a directional choice.',
        'twin-ledger': 'Ledger balance: signed values change both the difference zone and the combo.',
        'field-bloom': 'Constraint solving: each piece affects several target counts and forbidden cells at once.',
        'glass-bloom': 'Risk management: banking secures the pot; another growth can lose it and reset the streak.',
      },
    },
  },
];
