import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import * as catalog from '../../src/data/games.ts';

const routeSlugs = [
  'pulse-junction',
  'mirror-drift',
  'orbit-slip',
  'signal-sweep',
  'gravity-pact',
  'field-bloom',
  'twin-ledger',
  'glass-bloom',
];

const expectedRelatedSlugs = {
  'pulse-junction': ['orbit-slip', 'signal-sweep', 'glass-bloom'],
  'mirror-drift': ['field-bloom', 'twin-ledger', 'pulse-junction'],
  'orbit-slip': ['pulse-junction', 'glass-bloom', 'signal-sweep'],
  'signal-sweep': ['pulse-junction', 'orbit-slip', 'mirror-drift'],
  'gravity-pact': ['twin-ledger', 'field-bloom', 'glass-bloom'],
  'field-bloom': ['twin-ledger', 'mirror-drift', 'glass-bloom'],
  'twin-ledger': ['field-bloom', 'gravity-pact', 'mirror-drift'],
  'glass-bloom': ['orbit-slip', 'pulse-junction', 'twin-ledger'],
};

function expectedRelatedHrefs(current) {
  return catalog.games
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
    .slice(0, 3)
    .map(({ candidate }) => candidate.href);
}

test('each catalog game has three unique, non-self, canonical related games in deterministic relevance order', () => {
  assert.equal(catalog.games.length, 8);
  assert.equal(typeof catalog.getRelatedGames, 'function');

  const slugs = new Set(catalog.games.map((game) => game.slug));
  const hrefs = new Set(catalog.games.map((game) => game.href));
  assert.equal(slugs.size, catalog.games.length);
  assert.equal(hrefs.size, catalog.games.length);

  for (const game of catalog.games) {
    const related = catalog.getRelatedGames(game.slug);
    const repeated = catalog.getRelatedGames(game.slug);
    assert.equal(related.length, 3, `${game.name} should have exactly three related games`);
    assert.deepEqual(related, repeated, `${game.name} recommendations must be stable`);
    assert.deepEqual(related.map((item) => item.slug), expectedRelatedSlugs[game.slug], `${game.name} recommendations must preserve the reviewed fixed order`);
    assert.deepEqual(related.map((item) => item.href), expectedRelatedHrefs(game), `${game.name} ranking must follow the shared relevance policy`);
    assert.ok(related.every((item) => item.slug !== game.slug), `${game.name} must not recommend itself`);
    assert.equal(new Set(related.map((item) => item.slug)).size, 3, `${game.name} must not repeat a recommendation`);
    assert.ok(related.every((item) => slugs.has(item.slug) && hrefs.has(item.href)), `${game.name} links must resolve to catalog entries`);
  }
});

test('all eight detail routes use the shared frame and render its real related-game section', () => {
  const frame = readFileSync(new URL('../../src/components/GameDetailFrame.astro', import.meta.url), 'utf8');

  assert.match(frame, /getRelatedGames\(game\.slug\)/);
  assert.match(frame, /<section class="game-detail__related"[^>]*aria-labelledby="related-games-heading"/);
  assert.match(frame, /<a\b[^>]*href=\{related\.href\}/);
  assert.match(frame, /Related Games/);
  assert.doesNotMatch(frame, /Astro\.slots\.has\('related-games'\)/);
  assert.doesNotMatch(frame, /Coming Soon|Under Construction/i);

  for (const slug of routeSlugs) {
    const route = readFileSync(new URL(`../../src/pages/games/${slug}.astro`, import.meta.url), 'utf8');
    assert.match(route, /<GameDetailFrame\s+game=\{game\}/, `${slug} must use the shared game frame`);
    assert.doesNotMatch(route, /slot="related-games"/, `${slug} must not own a route-local recommendations array`);
  }
});

test('unknown game slugs do not receive unrelated recommendations', () => {
  assert.deepEqual(catalog.getRelatedGames('not-a-catalog-game'), []);
});
