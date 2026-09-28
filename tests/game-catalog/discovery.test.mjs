import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import * as catalog from '../../src/data/games.ts';
import { gameCategories } from '../../src/data/gameCategories.ts';

const allowedCategories = ['Puzzle', 'Arcade', 'Reflex', 'Strategy'];
const expectedFeatured = ['pulse-junction', 'mirror-drift', 'orbit-slip', 'gravity-pact'];
const expectedQuickPlay = ['pulse-junction', 'orbit-slip', 'signal-sweep'];
const expectedCategoryMembers = {
  Puzzle: ['mirror-drift', 'twin-ledger', 'field-bloom'],
  Arcade: ['pulse-junction', 'orbit-slip', 'glass-bloom'],
  Reflex: ['pulse-junction', 'orbit-slip', 'signal-sweep'],
  Strategy: ['gravity-pact', 'twin-ledger', 'field-bloom', 'glass-bloom'],
};

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('the catalog remains eight games in exactly the four established categories', () => {
  assert.equal(catalog.games.length, 8);
  assert.equal(new Set(catalog.games.map(({ slug }) => slug)).size, catalog.games.length, 'game slugs are unique');
  assert.equal(new Set(catalog.games.map(({ href }) => href)).size, catalog.games.length, 'game hrefs are unique');
  assert.deepEqual(gameCategories.map(({ name }) => name), allowedCategories);
  assert.deepEqual([...new Set(catalog.games.flatMap(({ categories }) => categories))].sort(), [...allowedCategories].sort());

  for (const game of catalog.games) {
    assert.ok(allowedCategories.includes(game.primaryCategory), `${game.slug} has a valid primary category`);
    assert.ok(game.categories.length > 0, `${game.slug} has at least one category`);
    assert.ok(game.categories.includes(game.primaryCategory), `${game.slug} includes its primary category`);
    assert.equal(new Set(game.categories).size, game.categories.length, `${game.slug} has no duplicate categories`);
    assert.ok(game.categories.every((category) => allowedCategories.includes(category)), `${game.slug} has only established categories`);
    assert.match(game.href, new RegExp(`^/games/${game.slug}/$`), `${game.slug} has a canonical game href`);
  }
});

test('featured and Quick Play classifications are explicit, ordered, unique catalog members', () => {
  assert.equal(typeof catalog.getFeaturedGames, 'function');
  assert.equal(typeof catalog.getQuickPlayGames, 'function');

  const featured = catalog.getFeaturedGames();
  const quickPlay = catalog.getQuickPlayGames();
  assert.deepEqual(featured.map(({ slug }) => slug), expectedFeatured);
  assert.deepEqual(quickPlay.map(({ slug }) => slug), expectedQuickPlay);
  for (const [label, selected] of [['Featured', featured], ['Quick Play', quickPlay]]) {
    assert.equal(new Set(selected.map(({ slug }) => slug)).size, selected.length, `${label} has no duplicate games`);
    assert.ok(selected.every((entry) => catalog.games.includes(entry)), `${label} resolves to catalog records`);
  }
  assert.deepEqual(catalog.games.filter(({ featuredOrder }) => featuredOrder !== undefined).map(({ featuredOrder }) => featuredOrder).sort(), [1, 2, 3, 4]);
  assert.deepEqual(catalog.games.filter(({ quickPlayOrder }) => quickPlayOrder !== undefined).map(({ quickPlayOrder }) => quickPlayOrder), [1, 2, 3]);
});

test('Home featured cards and category cards are rendered from their authoritative data sources', () => {
  const home = read('../../src/pages/index.astro');

  assert.match(home, /import\s+\{\s*getFeaturedGames\s*\}\s+from\s+['"]\.\.\/data\/games/);
  assert.match(home, /const\s+featuredGames\s*=\s*getFeaturedGames\(\)/);
  assert.doesNotMatch(home, /const\s+featuredGames\s*=\s*\[/);
  for (const field of ['name', 'href', 'primaryCategory', 'mode', 'session', 'description']) {
    assert.ok(home.includes(`game.${field}`), `Home cards derive ${field} from each catalog game`);
  }
  assert.match(home, /import\s+\{\s*gameCategories\s*\}\s+from\s+['"]\.\.\/data\/gameCategories/);
  assert.match(home, /gameCategories\.map\(/);
  assert.doesNotMatch(home, /const\s+categories\s*=\s*\[/);
});

test('the Games index exposes a Quick Play filter backed by catalog classification', () => {
  const index = read('../../src/pages/games/index.astro');

  assert.match(index, /data-filter-group="session"/);
  assert.match(index, /const quickPlayFilters = \['All', 'Quick Play'\]/);
  assert.match(index, /quickPlayFilters\.map\(/);
  assert.match(index, /data-quick-play=\{game\.quickPlayOrder\s*!==\s*undefined\}/);
  assert.match(index, /quickPlayMatch\s*=\s*filters\.session\s*===\s*'All'\s*\|\|\s*card\.dataset\.quickPlay\s*===\s*'true'/);
  assert.match(index, /categoryMatch\s*&&\s*modeMatch\s*&&\s*quickPlayMatch/);
  assert.match(index, /aria-pressed=/);
  assert.match(index, /No games match these filters\./);
});

test('all four category pages stay catalog-driven and no extra category is introduced', () => {
  const categoryFrame = read('../../src/components/GameCategoryPage.astro');
  assert.match(categoryFrame, /games\.filter\(\(game\)\s*=>\s*game\.categories\.includes\(category\.name\)\)/);

  for (const category of gameCategories) {
    assert.match(category.href, new RegExp(`^/categories/${category.slug}/$`));
    assert.deepEqual(
      catalog.games.filter((game) => game.categories.includes(category.name)).map(({ slug }) => slug),
      expectedCategoryMembers[category.name],
      `${category.name} route membership stays aligned with the authoritative catalog`,
    );
    const route = `../../src/pages/categories/${category.slug}.astro`;
    assert.ok(existsSync(new URL(route, import.meta.url)), `${category.slug} route exists`);
    assert.ok(read(route).includes(`entry.slug === '${category.slug}'`));
  }
  assert.equal(gameCategories.length, 4);
});
