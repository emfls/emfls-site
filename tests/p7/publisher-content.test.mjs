import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import * as catalog from '../../src/data/games.ts';
import { gameCategories } from '../../src/data/gameCategories.ts';

const expectedSlugs = [
  'pulse-junction',
  'mirror-drift',
  'gravity-pact',
  'orbit-slip',
  'twin-ledger',
  'signal-sweep',
  'field-bloom',
  'glass-bloom',
];

const normalize = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

test('all eight playable games have distinct, complete editorial guidance', () => {
  const editorial = catalog.gameEditorial;
  assert.ok(editorial && typeof editorial === 'object', 'gameEditorial must be exported from the catalog');
  assert.deepEqual(Object.keys(editorial).sort(), expectedSlugs.slice().sort());

  const sectionBodies = [];
  for (const slug of expectedSlugs) {
    const entry = editorial[slug];
    assert.ok(entry.strategy?.title && entry.strategy.body, `${slug} needs practical strategy guidance`);
    assert.ok(entry.example?.title && entry.example.body, `${slug} needs a source-grounded worked example`);
    assert.ok(entry.designNote?.title && entry.designNote.body, `${slug} needs a mechanic-specific design explanation`);
    for (const section of Object.values(entry)) {
      assert.doesNotMatch(section.body, /\b(TODO|TBD|lorem ipsum|coming soon)\b/i);
      sectionBodies.push(normalize(section.body));
    }
  }
  assert.equal(new Set(sectionBodies).size, sectionBodies.length, 'editorial section bodies must not be exact duplicates');
});

test('the four category pages provide category-specific selection guidance for each listed game', () => {
  assert.equal(gameCategories.length, 4);
  for (const category of gameCategories) {
    assert.ok(category.editorial?.playStyle, `${category.name} needs a play-style explanation`);
    assert.ok(category.editorial?.chooseIf, `${category.name} needs a selection cue`);
    const memberSlugs = catalog.games.filter((game) => game.categories.includes(category.name)).map(({ slug }) => slug).sort();
    assert.deepEqual(Object.keys(category.editorial.gameComparisons).sort(), memberSlugs, `${category.name} needs a distinction for every actual member`);
    const distinctions = Object.values(category.editorial.gameComparisons);
    assert.ok(distinctions.every((copy) => copy.trim() && !/\b(TODO|TBD|lorem ipsum|coming soon)\b/i.test(copy)));
    assert.equal(new Set(distinctions.map(normalize)).size, distinctions.length, `${category.name} comparisons should not repeat`);
  }
  assert.equal(new Set(gameCategories.map(({ editorial }) => normalize(editorial.playStyle))).size, gameCategories.length);
  assert.equal(new Set(gameCategories.map(({ editorial }) => normalize(editorial.chooseIf))).size, gameCategories.length);
});

test('the eight-game catalog exposes real comparison details without adding routes', async () => {
  const { games } = catalog;
  assert.deepEqual(games.map(({ slug }) => slug).sort(), expectedSlugs.slice().sort());
  for (const game of games) {
    assert.ok(game.comparison?.challenge, `${game.slug} needs a distinct challenge label`);
    assert.ok(game.comparison?.input, `${game.slug} needs an input-style label`);
    assert.ok(game.comparison?.bestFor, `${game.slug} needs a player-choice cue`);
    const route = await readFile(new URL(`../../src/pages/games/${game.slug}.astro`, import.meta.url), 'utf8');
    assert.match(route, /slot="how-to-play"/);
    assert.match(route, /slot="controls"/);
    assert.match(route, /slot="scoring"/);
  }
});

test('shared templates render the added value while preserving game-first and existing guides', async () => {
  const frame = await readFile(new URL('../../src/components/GameDetailFrame.astro', import.meta.url), 'utf8');
  const categoryPage = await readFile(new URL('../../src/components/GameCategoryPage.astro', import.meta.url), 'utf8');
  const gamesIndex = await readFile(new URL('../../src/pages/games/index.astro', import.meta.url), 'utf8');
  const home = await readFile(new URL('../../src/pages/index.astro', import.meta.url), 'utf8');
  const about = await readFile(new URL('../../src/pages/about.astro', import.meta.url), 'utf8');

  assert.ok(frame.indexOf('game-detail__stage-section') < frame.indexOf('game-detail__editorial'));
  assert.match(frame, /gameEditorial/);
  assert.match(frame, /game-detail__guides/);
  assert.match(categoryPage, /category\.editorial/);
  assert.match(gamesIndex, /game\.comparison/);
  assert.match(home, /home-mechanics/);
  assert.match(about, /How the mechanics differ/);
});
