export type EditorialSection = {
  title: string;
  body: string;
};

export type GameEditorial = {
  strategy: EditorialSection;
  example: EditorialSection;
  designNote: EditorialSection;
};

export const gameEditorial = {
  'pulse-junction': {
    strategy: {
      title: 'Read the target, then rebuild your streak',
      body: 'Follow the marked target ring rather than a decoy. Later rounds can change pulse speed and add decoys, so judge the approach you see now instead of reusing an opening-round rhythm. After a Miss resets the combo, use the next input to establish a new streak rather than chasing the points already lost.',
    },
    example: {
      title: 'A fifth consecutive hit changes the award',
      body: 'If your combo is 4 and the next judgement is Perfect, the new combo is 5 and the multiplier is ×1.25: 100 base points × 1.25 = 125. A Miss awards 0 and resets the combo, so timing affects both this round and the multiplier you carry forward.',
    },
    designNote: {
      title: 'One tap is judged by radial distance',
      body: 'Pulse Junction asks for one timed input as an expanding pulse crosses a marked radius; it does not ask you to steer or hold the pulse. Across 20 rounds, target position and speed change, and later rounds add decoy rings, making target recognition part of the timing decision.',
    },
  },
  'mirror-drift': {
    strategy: {
      title: 'Plan both paths before you drag',
      body: 'The ring point reflects the solid point across the board center. Before bending around an obstacle, check the reflected route too: a safe line for one point can put its partner into a different obstacle. The later offset stages reward deliberate waypoint changes instead of assuming both routes have the same open space.',
    },
    example: {
      title: 'A clear can trade strikes for time',
      body: 'Stage 1 allows 18 seconds. With 8 seconds left and one strike on that stage, the clear score is 500 base + 400 time bonus − 100 strike penalty = 800. The time bonus is 5 points per full 100 ms remaining, capped at 500.',
    },
    designNote: {
      title: 'One drag solves a paired geometry problem',
      body: 'A single pointer path creates two simultaneous swept paths, and both points must reach their matching targets. The 12 authored stages progress from open lines to corridors and offset routes, so the task shifts from learning the reflection to routing around both sets of obstacles.',
    },
  },
  'gravity-pact': {
    strategy: {
      title: 'Treat each direction as a shared move',
      body: 'A turn is not movement for only the active player: every token is considered in the chosen direction, and another token or blocked cell can stop its next step. Before moving, check whether the result opens a scoring lane for you, improves the opponent’s route, or leaves a token blocking a useful cell.',
    },
    example: {
      title: 'Layout 1 makes an opening UP move affect both sides',
      body: 'On the no-blocked-cell starting layout, choosing UP advances four tokens by one cell: all three Player A tokens and Player B’s center token. The two Player B tokens already on the top edge cannot move farther up. No token reaches a goal on this move, but the shared board has already changed for both players.',
    },
    designNote: {
      title: 'Turns change a shared 5 × 5 board',
      body: 'Players alternate directional choices while both colors remain active on the same board. A token moves at most one cell when that destination is open; reaching a matching goal scores a point and removes that token. This makes a move’s value depend on the opponent’s position as well as your own.',
    },
  },
  'orbit-slip': {
    strategy: {
      title: 'Move toward the next corridor early',
      body: 'Your point continues around the center while you adjust only its radius. Gates approach during that adjustment, and radial movement is limited to 0.7 radius units per second within the 0.28–0.82 range. Read the opening before it arrives; a late reversal may not cover the distance in time.',
    },
    example: {
      title: 'Survival and cleared gates both count',
      body: 'The score is one point per full 100 ms survived plus 50 for each cleared gate. For example, 1,000 ms alive and one gate cleared gives floor(1,000 ÷ 100) + 50 = 60 points.',
    },
    designNote: {
      title: 'Orbit motion is automatic; radius is your control',
      body: 'Orbit Slip separates continuous angular motion from your radial input. You read a moving gate’s safe radial corridor and move inward or outward while the point keeps orbiting, rather than steering around the board with a free-direction control.',
    },
  },
  'twin-ledger': {
    strategy: {
      title: 'Compare the projected difference with the turn limit',
      body: 'Estimate both totals after adding the signed tile, then compare their absolute difference with the current hard limit. Exact and Stable results build a combo; Tense, Danger, and Breach reset it. A small award that protects the ledger can be preferable to preserving a streak while crossing the limit.',
    },
    example: {
      title: 'One +2 tile can turn a two-point gap into Exact',
      body: 'On turn 7 the hard limit is 7. If the totals are Left 8 and Right 6 and the available tile has effective value +2, placing it on the Right makes both totals 8: difference 0, Exact, 120 base points. Placing it on the Left instead makes the difference 4: Tense, 55 base points.',
    },
    designNote: {
      title: 'Signed choices shape an 18-turn balance',
      body: 'Each tile changes one running total, while the hard limit tightens from 8 on turns 1–6 to 7 on turns 7–12 and 6 on turns 13–18. A Breach loses that turn’s points but does not end the session, so recovery and the final balance still matter.',
    },
  },
  'signal-sweep': {
    strategy: {
      title: 'Translate the rule into a short scan',
      body: 'Check only the attributes named by the displayed rule: shape, fill, mark, and color family. For an AND rule, every clause must match; for an OR rule, either complete branch can match. Keep shape and fill in view even when a tile’s color is visually prominent.',
    },
    example: {
      title: 'An AND rule requires both properties',
      body: 'If a round asks for a triangle that is striped, a striped triangle matches; a solid triangle does not, even though its shape is right. Each correct selection adds 100 points, while a wrong selection removes 50, so checking both named attributes is worth the extra glance.',
    },
    designNote: {
      title: 'The board is a rule-reading task, not a color-only test',
      body: 'Symbols combine shape, fill, mark, and color family, while generated rules can join conditions with AND or offer alternative branches with OR. Reading the rule and then scanning the relevant symbol features is the core action; color alone never defines every match.',
    },
  },
  'field-bloom': {
    strategy: {
      title: 'Start with the tightest cell constraints',
      body: 'Look for targets whose activation count leaves little room for overlap, then choose a piece orientation that covers those cells without touching a forbidden square. A placement can help one target while overcharging another, so check the full piece footprint—not just its center—before committing.',
    },
    example: {
      title: 'Puzzle 1 is a one-piece, three-star solution',
      body: 'In FB-01, the three goal-1 cells sit next to each other in the second row. Centering the H3 piece on the middle target activates each of the three cells exactly once. That uses the puzzle’s par of one piece; solving with no Undo earns 3 stars.',
    },
    designNote: {
      title: 'Piece footprints turn placement into arithmetic',
      body: 'The pieces cover different fixed cell masks: H3 and V3 activate straight lines, while CROSS5 and X5 use different five-cell patterns. Each puzzle checks exact target counts and untouched forbidden cells; extra inventory is allowed, and time does not determine the star rating.',
    },
  },
  'glass-bloom': {
    strategy: {
      title: 'Compare the next pot with the amount still at risk',
      body: 'Before choosing Grow, compare the next stage’s pot increase with the displayed break risk on the current stage. A break removes the unbanked pot and resets the bank streak; Bank secures the current pot and advances the crystal. The stronger decision can change as the pot grows or the crystal modifier changes risk.',
    },
    example: {
      title: 'The first growth risks the current 100-point pot',
      body: 'Crystal 1 starts at Stage 1 with a 100-point pot and a 5% break risk. If Grow is safe, the pot advances to 180; if it breaks, the unbanked 100 is lost. Banking now locks 100 points with the first-bank ×1.00 multiplier, so the choice is +80 potential pot versus risking what is already held.',
    },
    designNote: {
      title: 'The central action is deciding when to stop',
      body: 'Each crystal presents a sequence of fixed pot values and stage-dependent break risk. You can take the current pot with Bank or accept the next risk with Grow; consecutive banks add 5% per prior bank up to 20%, while a break resets that streak.',
    },
  },
} satisfies Record<string, GameEditorial>;
