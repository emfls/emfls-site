import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

import { gameCategories } from '../src/data/gameCategories.ts';
import { games } from '../src/data/games.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const validatorPath = join(repoRoot, 'scripts/validate-generated-site.mjs');
const featuredSlugs = ['pulse-junction', 'mirror-drift', 'orbit-slip', 'gravity-pact'];
const quickPlaySlugs = ['pulse-junction', 'orbit-slip', 'signal-sweep'];
const relatedSlugs = {
  'pulse-junction': ['orbit-slip', 'signal-sweep', 'glass-bloom'],
  'mirror-drift': ['field-bloom', 'twin-ledger', 'pulse-junction'],
  'orbit-slip': ['pulse-junction', 'glass-bloom', 'signal-sweep'],
  'signal-sweep': ['pulse-junction', 'orbit-slip', 'mirror-drift'],
  'gravity-pact': ['twin-ledger', 'field-bloom', 'glass-bloom'],
  'field-bloom': ['twin-ledger', 'mirror-drift', 'glass-bloom'],
  'twin-ledger': ['field-bloom', 'gravity-pact', 'mirror-drift'],
  'glass-bloom': ['orbit-slip', 'pulse-junction', 'twin-ledger'],
};
const trustRoutes = ['/about/', '/contact/', '/privacy/', '/terms/'];
const canonicalRoutes = [
  '/',
  '/games/',
  ...games.map(({ href }) => href),
  ...gameCategories.map(({ href }) => href),
  ...trustRoutes,
];

function link(href, text) {
  return `<a href="${href}">${text}</a>`;
}

function sharedShell(content) {
  const footer = [
    link('/games/', 'Games'),
    ...gameCategories.map((category) => link(category.href, category.name)),
    ...trustRoutes.map((route) => link(route, route.split('/')[1])),
    link('/site-map/', 'Site Map'),
  ].join('');

  return `<!doctype html><html><body><a href="#main-content">Skip</a><header>${link('/', 'Home')}${link('/games/', 'Games')}${link('/about/', 'About')}</header><main id="main-content">${content}</main><footer>${footer}</footer></body></html>`;
}

function fixturePages() {
  const bySlug = new Map(games.map((game) => [game.slug, game]));
  const pages = new Map();
  const featured = featuredSlugs.map((slug) => bySlug.get(slug));
  const homeContent = `<section class="featured-grid">${featured.map((game) => `<article class="game-card"><div class="game-card__topline"><span class="game-card__category">${game.primaryCategory}</span><span>${game.session}</span></div><h3>${game.name}</h3><p>${game.description}</p><div class="game-card__footer"><span>${game.mode}</span><a href="${game.href}">Play</a></div></article>`).join('')}</section><section class="category-grid">${gameCategories.map((category) => `<a class="category-card" href="${category.href}"><h3>${category.name}</h3></a>`).join('')}</section>`;
  pages.set('/', sharedShell(homeContent));

  const gameCards = games.map((game) => `<article class="games-card" data-game-card data-categories="${game.categories.join(',')}" data-mode="${game.mode}" data-quick-play="${quickPlaySlugs.includes(game.slug)}"><h3>${game.name}</h3><a href="${game.href}">Play</a></article>`).join('');
  pages.set('/games/', sharedShell(`<div class="games-filters"><button type="button" data-filter-group="category" data-filter-value="All" aria-pressed="true">All</button><button type="button" data-filter-group="mode" data-filter-value="All" aria-pressed="true">All</button><button type="button" data-filter-group="session" data-filter-value="All" aria-pressed="true">All</button><button type="button" data-filter-group="session" data-filter-value="Quick Play" aria-pressed="false">Quick Play</button></div><section class="games-grid">${gameCards}</section>`));

  for (const category of gameCategories) {
    const members = games.filter((game) => game.categories.includes(category.name));
    const cards = members.map((game) => `<article class="game-category-card"><h3>${game.name}</h3><a href="${game.href}">Play</a></article>`).join('');
    pages.set(category.href, sharedShell(`<h1>${category.title}</h1><section class="game-category__grid">${cards}</section>`));
  }

  for (const game of games) {
    const related = relatedSlugs[game.slug].map((slug) => bySlug.get(slug));
    const relatedHtml = related.map((item) => `<li><a class="game-detail__related-link" href="${item.href}"><strong>${item.name}</strong><span class="game-detail__related-description">${item.description}</span><span>${item.primaryCategory} · ${item.session}</span></a></li>`).join('');
    const content = `<nav class="game-breadcrumb">${link('/', 'Home')}${link('/games/', 'Games')}${link(`/categories/${game.primaryCategory.toLowerCase()}/`, game.primaryCategory)}</nav><h1>${game.name}</h1><p class="game-detail__description">${game.description}</p><div class="game-detail__meta"><span>Mode ${game.mode}</span><span>Session ${game.session}</span></div><section class="game-detail__related"><h2>Related Games</h2><ul>${relatedHtml}</ul></section><a href="/games/">Back to all games</a>`;
    pages.set(game.href, sharedShell(content));
  }

  for (const route of trustRoutes) {
    const links = route === '/contact/'
      ? '<a href="mailto:hello@example.com">Email</a><a href="tel:+821012345678">Phone</a><a href="https://example.org/reference">External</a>'
      : '';
    pages.set(route, sharedShell(`<h1>${route.split('/')[1]}</h1>${links}`));
  }
  pages.set('/site-map/', sharedShell(`<nav>${canonicalRoutes.map((route) => link(route, route)).join('')}</nav>`));
  pages.set('/404.html', sharedShell(`<h1>Page not found</h1>${link('/', 'Back to Home')}${link('/games/', 'Browse Games')}`));
  return pages;
}

function writeFixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'emfls-generated-site-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [route, html] of fixturePages()) {
    const file = route === '/'
      ? join(root, 'index.html')
      : route.endsWith('/')
        ? join(root, route.slice(1), 'index.html')
        : join(root, route.slice(1));
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html);
  }
  return root;
}

function runValidator(root) {
  return spawnSync(process.execPath, ['--experimental-strip-types', validatorPath, '--root', root], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function jsonReport(result) {
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

test('fresh generated output validates all canonical pages, discovery surfaces, and related HTML', (t) => {
  const root = writeFixture(t);
  const report = jsonReport(runValidator(root));

  assert.equal(report.requiredDestinations, 18);
  assert.equal(report.brokenLinks.length, 0);
  assert.equal(report.externalLinksIgnored, 3);
  assert.deepEqual(report.orphanCanonicalDestinations, []);
  assert.deepEqual(report.relatedGames, { gamePages: 8, linksChecked: 24, failures: [] });
  assert.equal(report.discoveryFailures.length, 0);
  assert.ok(report.linksInspected > 0);
});

test('generated-output audit rejects missing routes, invalid schemes, and missing fragments', (t) => {
  const root = writeFixture(t);
  const aboutFile = join(root, 'about/index.html');
  const original = readFileSync(aboutFile, 'utf8');
  writeFileSync(aboutFile, original.replace('</main>', '<a href="/not-generated/">Missing</a><a href="#not-on-page">Broken fragment</a><a href="javascript:alert(1)">Unsafe</a><a href="https://emfls.github.io/old/">Legacy host</a></main>'));
  const homeFile = join(root, 'index.html');
  writeFileSync(homeFile, readFileSync(homeFile, 'utf8').replace('</main>', '<a href="/articles/legacy/">Legacy guide</a></main>'));

  const result = runValidator(root);
  assert.equal(result.status, 1, result.stdout);
  const report = JSON.parse(result.stdout);
  assert.ok(report.brokenLinks.some(({ reason }) => reason === 'missing-destination'));
  assert.ok(report.brokenLinks.some(({ reason }) => reason === 'missing-fragment'));
  assert.ok(report.brokenLinks.some(({ reason }) => reason === 'javascript-scheme'));
  assert.ok(report.brokenLinks.some(({ reason }) => reason === 'legacy-emfls-github-io-link'));
  assert.ok(report.brokenLinks.some(({ reason }) => reason === 'legacy-guide-navigation'));
});

test('generated-output audit catches an orphan canonical destination', (t) => {
  const root = writeFixture(t);
  const strategyHref = '/categories/strategy/';
  function removeStrategyLinks(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const file = join(directory, entry.name);
      if (entry.isDirectory()) removeStrategyLinks(file);
      else if (file.endsWith('.html')) writeFileSync(file, readFileSync(file, 'utf8').replaceAll(`href="${strategyHref}"`, 'href="/"'));
    }
  }
  removeStrategyLinks(root);

  const result = runValidator(root);
  assert.equal(result.status, 1, result.stdout);
  const report = JSON.parse(result.stdout);
  assert.ok(report.orphanCanonicalDestinations.includes(strategyHref));
});

test('generated-output audit catches rendered Home, Quick Play, and category metadata drift', (t) => {
  const root = writeFixture(t);
  const homeFile = join(root, 'index.html');
  const gamesFile = join(root, 'games/index.html');
  const puzzleFile = join(root, 'categories/puzzle/index.html');
  writeFileSync(homeFile, readFileSync(homeFile, 'utf8').replace('Time your input as an expanding pulse crosses the target ring.', 'Wrong Home description'));
  writeFileSync(gamesFile, readFileSync(gamesFile, 'utf8').replace('data-quick-play="true"', 'data-quick-play="false"').replace('data-filter-value="Quick Play"', 'data-filter-value="Quick Search"'));
  writeFileSync(puzzleFile, readFileSync(puzzleFile, 'utf8').replace('href="/games/mirror-drift/"', 'href="/games/pulse-junction/"'));

  const result = runValidator(root);
  assert.equal(result.status, 1, result.stdout);
  const report = JSON.parse(result.stdout);
  assert.ok(report.discoveryFailures.some(({ route, reason }) => route === '/' && reason === 'featured-description-mismatch'));
  assert.ok(report.discoveryFailures.some(({ route, reason }) => route === '/games/' && reason === 'quick-play-card-metadata-mismatch'));
  assert.ok(report.discoveryFailures.some(({ route, reason }) => route === '/games/' && reason === 'quick-play-filter-control-mismatch'));
  assert.ok(report.discoveryFailures.some(({ route, reason }) => route === '/categories/puzzle/' && reason === 'category-membership-mismatch'));
});

test('generated-output audit detects Related Games order and copy drift', (t) => {
  const root = writeFixture(t);
  const pulseFile = join(root, 'games/pulse-junction/index.html');
  const original = readFileSync(pulseFile, 'utf8');
  writeFileSync(pulseFile, original.replace('Adjust your orbit radius and slip through gaps without touching the barriers.', 'Wrong related description'));

  const result = runValidator(root);
  assert.equal(result.status, 1, result.stdout);
  const report = JSON.parse(result.stdout);
  assert.ok(report.relatedGames.failures.some(({ game, reason }) => game === 'pulse-junction' && reason === 'description-mismatch'));
});

test('generated-output audit rejects a reordered Related Games row', (t) => {
  const root = writeFixture(t);
  const pulseFile = join(root, 'games/pulse-junction/index.html');
  const original = readFileSync(pulseFile, 'utf8');
  const section = original.match(/<section class="game-detail__related">[\s\S]*?<\/section>/)?.[0];
  assert.ok(section, 'fixture has the actual Related Games section');
  const items = section.match(/<li>[\s\S]*?<\/li>/g);
  assert.equal(items?.length, 3);
  let nextItem = 0;
  const reordered = [items[1], items[0], items[2]];
  const changed = section.replace(/<li>[\s\S]*?<\/li>/g, () => reordered[nextItem++]);
  assert.notEqual(changed, section);
  writeFileSync(pulseFile, original.replace(section, changed));

  const result = runValidator(root);
  assert.equal(result.status, 1, result.stdout);
  const report = JSON.parse(result.stdout);
  assert.ok(report.relatedGames.failures.some(({ game, reason }) => game === 'pulse-junction' && reason === 'related-order-or-destination-mismatch'));
});

test('generated-output audit requires the Related Games heading and three rendered links', (t) => {
  const root = writeFixture(t);
  const pulseFile = join(root, 'games/pulse-junction/index.html');
  const original = readFileSync(pulseFile, 'utf8');
  const section = original.match(/<section class="game-detail__related">[\s\S]*?<\/section>/)?.[0];
  assert.ok(section);
  const missingHeading = section.replace('<h2>Related Games</h2>', '');
  const missingRow = missingHeading.replace(/<li>[\s\S]*?<\/li>/, '');
  writeFileSync(pulseFile, original.replace(section, missingRow));

  const result = runValidator(root);
  assert.equal(result.status, 1, result.stdout);
  const report = JSON.parse(result.stdout);
  assert.ok(report.relatedGames.failures.some(({ game, reason }) => game === 'pulse-junction' && reason === 'related-heading-missing'));
  assert.ok(report.relatedGames.failures.some(({ game, reason }) => game === 'pulse-junction' && reason === 'related-count-mismatch'));
});
