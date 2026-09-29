import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { gameCategories } from '../src/data/gameCategories.ts';
import { games } from '../src/data/games.ts';

const siteOrigin = 'https://emfls.com';
const trustRoutes = ['/about/', '/contact/', '/privacy/', '/terms/'];
const canonicalRoutes = [
  '/',
  '/games/',
  ...games.map(({ href }) => href),
  ...gameCategories.map(({ href }) => href),
  ...trustRoutes,
];
const featuredSlugs = ['pulse-junction', 'mirror-drift', 'orbit-slip', 'gravity-pact'];
const quickPlaySlugs = ['pulse-junction', 'orbit-slip', 'signal-sweep'];
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
const navigationRoutes = new Set([
  '/',
  '/games/',
  '/site-map/',
  ...games.map(({ href }) => href),
  ...gameCategories.map(({ href }) => href),
  '/404.html',
]);
const legacyGuidePrefixes = ['/articles/', '/tags/'];
const legacyGuideRoutes = new Set(['/editorial-policy/', '/content-methodology/', '/disclaimer/']);
const voidElements = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

function decodeEntities(value) {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|apos|gt|lt|nbsp|quot);/gi, (entity, code) => {
    if (code[0] === '#') {
      const number = code[1]?.toLowerCase() === 'x' ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
      return Number.isInteger(number) && number >= 0 && number <= 0x10ffff ? String.fromCodePoint(number) : entity;
    }
    return ({ amp: '&', apos: "'", gt: '>', lt: '<', nbsp: '\u00a0', quot: '"' })[code.toLowerCase()] ?? entity;
  });
}

function findTagEnd(html, start) {
  let quote = '';
  for (let index = start + 1; index < html.length; index += 1) {
    const char = html[index];
    if (quote) {
      if (char === quote) quote = '';
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '>') {
      return index + 1;
    }
  }
  return html.length;
}

function parseAttributes(raw, matchLength) {
  const body = raw.slice(matchLength, -1).replace(/\/\s*$/, '');
  const attributes = {};
  const expression = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const match of body.matchAll(expression)) {
    const name = match[1].toLowerCase();
    const value = match[2] ?? match[3] ?? match[4] ?? '';
    attributes[name] = decodeEntities(value);
  }
  return attributes;
}

function parseHtml(html) {
  const root = { tag: '#document', attributes: {}, children: [] };
  const stack = [root];
  let index = 0;

  while (index < html.length) {
    if (html.startsWith('<!--', index)) {
      const end = html.indexOf('-->', index + 4);
      index = end < 0 ? html.length : end + 3;
      continue;
    }

    if (html[index] !== '<') {
      const next = html.indexOf('<', index);
      const end = next < 0 ? html.length : next;
      stack.at(-1).children.push({ tag: '#text', text: html.slice(index, end), children: [] });
      index = end;
      continue;
    }

    if (/^<!|^<\?/.test(html.slice(index, index + 2))) {
      index = findTagEnd(html, index);
      continue;
    }

    const end = findTagEnd(html, index);
    const raw = html.slice(index, end);
    const tagMatch = raw.match(/^<\s*(\/?)\s*([A-Za-z][A-Za-z\d:-]*)\b/);
    if (!tagMatch) {
      stack.at(-1).children.push({ tag: '#text', text: '<', children: [] });
      index += 1;
      continue;
    }

    const tag = tagMatch[2].toLowerCase();
    if (tagMatch[1]) {
      for (let stackIndex = stack.length - 1; stackIndex > 0; stackIndex -= 1) {
        if (stack[stackIndex].tag === tag) {
          stack.length = stackIndex;
          break;
        }
      }
      index = end;
      continue;
    }

    const node = { tag, attributes: parseAttributes(raw, tagMatch[0].length), children: [] };
    stack.at(-1).children.push(node);
    if (voidElements.has(tag) || /\/\s*>$/.test(raw)) {
      index = end;
      continue;
    }

    if (tag === 'script' || tag === 'style') {
      const close = html.toLowerCase().indexOf(`</${tag}`, end);
      index = close < 0 ? html.length : close;
      continue;
    }

    stack.push(node);
    index = end;
  }

  return root;
}

function descendants(node, predicate) {
  const matches = [];
  const visit = (current) => {
    for (const child of current.children ?? []) {
      if (child.tag === '#text') continue;
      if (predicate(child)) matches.push(child);
      visit(child);
    }
  };
  visit(node);
  return matches;
}

function textContent(node) {
  if (node.tag === '#text') return decodeEntities(node.text);
  return (node.children ?? []).map(textContent).join('');
}

function normalizedText(node) {
  return textContent(node).replace(/\s+/g, ' ').trim();
}

function hasClass(node, expected) {
  return (node.attributes?.class ?? '').split(/\s+/).includes(expected);
}

function findClass(node, expected) {
  return descendants(node, (child) => hasClass(child, expected));
}

function firstTag(node, tag) {
  return descendants(node, (child) => child.tag === tag)[0] ?? null;
}

function firstHref(node) {
  return descendants(node, (child) => child.tag === 'a' && child.attributes.href !== undefined)[0]?.attributes.href ?? null;
}

function walkHtml(directory) {
  const files = [];
  if (!existsSync(directory) || !statSync(directory).isDirectory()) return files;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkHtml(path));
    else if (entry.isFile() && extname(entry.name).toLowerCase() === '.html') files.push(path);
  }
  return files;
}

function fileRoute(root, file) {
  const path = relative(root, file).split(sep).join('/');
  if (path === 'index.html') return '/';
  if (path.endsWith('/index.html')) return `/${path.slice(0, -'index.html'.length)}`;
  return `/${path}`;
}

function outputFileForPath(root, pathname) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes('\0') || decoded.split('/').includes('..')) return null;
  const normalized = `/${decoded.replace(/^\/+/, '')}`;
  const rootPath = resolve(root);
  const relativePath = normalized.slice(1);
  const candidates = normalized === '/'
    ? [join(rootPath, 'index.html')]
    : normalized.endsWith('/')
      ? [join(rootPath, relativePath, 'index.html')]
      : extname(normalized)
        ? [join(rootPath, relativePath)]
        : [join(rootPath, relativePath, 'index.html'), join(rootPath, `${relativePath}.html`), join(rootPath, relativePath)];

  for (const candidate of candidates) {
    const resolved = resolve(candidate);
    if ((resolved === rootPath || resolved.startsWith(`${rootPath}${sep}`)) && existsSync(resolved) && statSync(resolved).isFile()) return resolved;
  }
  return null;
}

function resolveHref(href, sourceRoute) {
  const trimmed = href.trim();
  if (!trimmed) return { error: 'empty-href' };
  if (/^javascript:/i.test(trimmed)) return { error: 'javascript-scheme' };
  if (/^mailto:/i.test(trimmed)) return trimmed.slice(7).trim() ? { external: true } : { error: 'invalid-mailto' };
  if (/^tel:/i.test(trimmed)) return trimmed.slice(4).trim() ? { external: true } : { error: 'invalid-tel' };
  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed) && !/^https?:/i.test(trimmed)) return { error: 'unsupported-scheme' };

  let url;
  try {
    url = new URL(trimmed, `${siteOrigin}${sourceRoute}`);
  } catch {
    return { error: 'malformed-url' };
  }
  if (url.hostname.toLowerCase() === 'emfls.github.io' || url.hostname.toLowerCase().endsWith('.emfls.github.io')) return { error: 'legacy-emfls-github-io-link' };
  if (!['http:', 'https:'].includes(url.protocol)) return { error: 'unsupported-scheme' };
  if (url.hostname.toLowerCase() !== 'emfls.com') return { external: true };
  try {
    return { pathname: url.pathname, fragment: url.hash ? decodeURIComponent(url.hash.slice(1)) : '' };
  } catch {
    return { error: 'malformed-fragment' };
  }
}

function isLegacyGuidePath(pathname) {
  return legacyGuideRoutes.has(pathname) || legacyGuidePrefixes.some((prefix) => pathname.startsWith(prefix));
}

function addDiscoveryFailure(failures, route, reason, details = {}) {
  failures.push({ route, reason, ...details });
}

function auditCanonicalMetadata(documents) {
  const failures = [];
  const byRoute = new Map([...documents.values()].map((document) => [document.route, document]));
  const metadata = (document, predicate) => descendants(document.tree, predicate);
  const canonicalLinks = (document) => metadata(document, (node) =>
    node.tag === 'link' && (node.attributes.rel ?? '').toLowerCase().split(/\s+/).includes('canonical'),
  );
  const robotsTags = (document) => metadata(document, (node) =>
    node.tag === 'meta' && (node.attributes.name ?? '').toLowerCase() === 'robots',
  );
  const openGraphUrls = (document) => metadata(document, (node) =>
    node.tag === 'meta' && (node.attributes.property ?? '').toLowerCase() === 'og:url',
  );
  const hasDirective = (content, directive) => content.split(',').some((value) => value.trim().toLowerCase() === directive);
  const blocksIndexing = (content) => hasDirective(content, 'noindex') || hasDirective(content, 'none');
  let canonicalMetadataPages = 0;

  for (const route of canonicalRoutes) {
    const document = byRoute.get(route);
    if (!document) continue;
    canonicalMetadataPages += 1;
    const canonicals = canonicalLinks(document);
    const expected = new URL(route, siteOrigin).href;
    if (canonicals.length !== 1) {
      failures.push({ route, reason: 'canonical-count-mismatch', expected: 1, actual: canonicals.length });
    } else if (canonicals[0].attributes.href !== expected) {
      failures.push({ route, reason: 'canonical-url-mismatch', expected, actual: canonicals[0].attributes.href ?? null });
    }

    const robots = robotsTags(document);
    if (robots.length > 1) failures.push({ route, reason: 'indexable-route-robots-count-mismatch', expected: 1, actual: robots.length });
    if (robots.some((tag) => blocksIndexing(tag.attributes.content ?? ''))) {
      failures.push({ route, reason: 'indexable-route-noindex' });
    }

    const canonicalUrl = canonicals.length === 1 ? canonicals[0].attributes.href : null;
    for (const tag of openGraphUrls(document)) {
      if (tag.attributes.content !== canonicalUrl) {
        failures.push({ route, reason: 'og-url-canonical-mismatch', canonical: canonicalUrl, actual: tag.attributes.content ?? null });
      }
    }
  }

  const siteMap = byRoute.get('/site-map/');
  if (!siteMap) {
    failures.push({ route: '/site-map/', reason: 'missing-site-map-html' });
  } else {
    const robots = robotsTags(siteMap);
    const validRobots = robots.length === 1
      && hasDirective(robots[0].attributes.content ?? '', 'noindex')
      && hasDirective(robots[0].attributes.content ?? '', 'follow');
    if (!validRobots || canonicalRoutes.includes('/site-map/')) {
      failures.push({ route: '/site-map/', reason: 'site-map-indexability-mismatch', robotsCount: robots.length });
    }
  }

  const custom404 = byRoute.get('/404.html');
  if (!custom404) {
    failures.push({ route: '/404.html', reason: 'missing-custom-404-html' });
  } else {
    if (canonicalLinks(custom404).length) failures.push({ route: '/404.html', reason: 'custom-404-has-canonical' });
    const robots = robotsTags(custom404);
    if (robots.length !== 1 || !robots.some((tag) => blocksIndexing(tag.attributes.content ?? ''))) {
      failures.push({ route: '/404.html', reason: 'custom-404-indexable', robotsCount: robots.length });
    }
  }

  const canonicalRouteSet = new Set(canonicalRoutes);
  for (const document of documents.values()) {
    if (canonicalRouteSet.has(document.route) || ['/site-map/', '/404.html'].includes(document.route)) continue;
    for (const canonical of canonicalLinks(document)) {
      let url;
      try {
        url = new URL(canonical.attributes.href);
      } catch {
        continue;
      }
      if (url.origin === siteOrigin && ['/', '/games/'].includes(url.pathname)) {
        failures.push({ route: document.route, reason: 'legacy-canonical-soft-migration', actual: url.href });
      }
    }
  }

  return { canonicalMetadataPages, failures };
}

function auditDiscovery(root, documents) {
  const failures = [];
  const byRoute = new Map([...documents.values()].map((document) => [document.route, document]));
  const catalogBySlug = new Map(games.map((game) => [game.slug, game]));

  const home = byRoute.get('/');
  if (!home) {
    addDiscoveryFailure(failures, '/', 'missing-home-html');
  } else {
    const featureContainer = findClass(home.tree, 'featured-grid')[0];
    const cards = featureContainer ? descendants(featureContainer, (node) => node.tag === 'article' && hasClass(node, 'game-card')) : [];
    const expectedFeatured = featuredSlugs.map((slug) => catalogBySlug.get(slug)).filter(Boolean);
    if (cards.length !== expectedFeatured.length) addDiscoveryFailure(failures, '/', 'featured-count-mismatch', { expected: expectedFeatured.length, actual: cards.length });
    cards.forEach((card, index) => {
      const game = expectedFeatured[index];
      if (!game) return;
      const meta = findClass(card, 'game-card__topline')[0];
      const spans = meta ? descendants(meta, (node) => node.tag === 'span') : [];
      const footer = findClass(card, 'game-card__footer')[0];
      const footerMode = footer ? descendants(footer, (node) => node.tag === 'span')[0] : null;
      const actual = {
        name: normalizedText(firstTag(card, 'h3') ?? { children: [] }),
        href: firstHref(card),
        description: normalizedText(firstTag(card, 'p') ?? { children: [] }),
        primaryCategory: normalizedText(findClass(card, 'game-card__category')[0] ?? { children: [] }),
        session: normalizedText(spans.at(-1) ?? { children: [] }),
        mode: normalizedText(footerMode ?? { children: [] }),
      };
      for (const [field, expected] of Object.entries({ name: game.name, href: game.href, description: game.description, primaryCategory: game.primaryCategory, session: game.session, mode: game.mode })) {
        if (actual[field] !== expected) addDiscoveryFailure(failures, '/', `featured-${field}-mismatch`, { index, expected, actual: actual[field] });
      }
    });

    const categoryCards = findClass(home.tree, 'category-card').filter((node) => node.tag === 'a');
    const actualCategories = categoryCards.map((card) => ({ name: normalizedText(firstTag(card, 'h3') ?? card), href: card.attributes.href }));
    const expectedCategories = gameCategories.map(({ name, href }) => ({ name, href }));
    if (JSON.stringify(actualCategories) !== JSON.stringify(expectedCategories)) addDiscoveryFailure(failures, '/', 'home-category-cards-mismatch', { expected: expectedCategories, actual: actualCategories });
  }

  const gamesIndex = byRoute.get('/games/');
  if (!gamesIndex) {
    addDiscoveryFailure(failures, '/games/', 'missing-games-index-html');
  } else {
    const cards = findClass(gamesIndex.tree, 'games-card').filter((node) => node.tag === 'article');
    if (cards.length !== games.length) addDiscoveryFailure(failures, '/games/', 'games-index-count-mismatch', { expected: games.length, actual: cards.length });
    const quickPlayControls = descendants(gamesIndex.tree, (node) =>
      node.tag === 'button' && node.attributes['data-filter-group'] === 'session' && node.attributes['data-filter-value'] === 'Quick Play',
    );
    if (quickPlayControls.length !== 1 || normalizedText(quickPlayControls[0] ?? { children: [] }) !== 'Quick Play' || quickPlayControls[0]?.attributes['aria-pressed'] !== 'false') {
      addDiscoveryFailure(failures, '/games/', 'quick-play-filter-control-mismatch', { actualCount: quickPlayControls.length, ariaPressed: quickPlayControls[0]?.attributes['aria-pressed'] ?? null });
    }
    cards.forEach((card, index) => {
      const game = games[index];
      if (!game) return;
      const actualName = normalizedText(firstTag(card, 'h3') ?? { children: [] });
      const actualHref = firstHref(card);
      const actualQuick = card.attributes['data-quick-play'];
      const expectedQuick = String(quickPlaySlugs.includes(game.slug));
      if (actualName !== game.name || actualHref !== game.href) addDiscoveryFailure(failures, '/games/', 'games-index-card-mismatch', { index, expected: { name: game.name, href: game.href }, actual: { name: actualName, href: actualHref } });
      if (actualQuick !== expectedQuick) addDiscoveryFailure(failures, '/games/', 'quick-play-card-metadata-mismatch', { game: game.slug, expected: expectedQuick, actual: actualQuick ?? null });
    });

    const quickTagged = cards.filter((card) => card.attributes['data-quick-play'] === 'true').map((card) => {
      const href = firstHref(card);
      return games.find((game) => game.href === href)?.slug ?? null;
    });
    if (JSON.stringify(quickTagged) !== JSON.stringify(quickPlaySlugs)) addDiscoveryFailure(failures, '/games/', 'quick-play-set-mismatch', { expected: quickPlaySlugs, actual: quickTagged });
  }

  for (const category of gameCategories) {
    const route = category.href;
    const document = byRoute.get(route);
    if (!document) {
      addDiscoveryFailure(failures, route, 'missing-category-html');
      continue;
    }
    const cards = findClass(document.tree, 'game-category-card').filter((node) => node.tag === 'article');
    const expectedGames = games.filter((game) => game.categories.includes(category.name));
    const actual = cards.map((card) => ({ name: normalizedText(firstTag(card, 'h3') ?? { children: [] }), href: firstHref(card) }));
    const expected = expectedGames.map(({ name, href }) => ({ name, href }));
    if (JSON.stringify(actual) !== JSON.stringify(expected)) addDiscoveryFailure(failures, route, 'category-membership-mismatch', { expected, actual });
  }

  for (const forbiddenRoute of ['/categories/quick-play/', '/categories/two-player/']) {
    if (outputFileForPath(root, forbiddenRoute)) addDiscoveryFailure(failures, forbiddenRoute, 'unexpected-indexable-category-route');
  }

  const siteMap = byRoute.get('/site-map/');
  if (!siteMap) {
    addDiscoveryFailure(failures, '/site-map/', 'missing-site-map-html');
  } else {
    const linkedRoutes = new Set(descendants(siteMap.tree, (node) => node.tag === 'a' && node.attributes.href).map((node) => {
      const resolved = resolveHref(node.attributes.href, '/site-map/');
      return resolved.pathname;
    }).filter(Boolean));
    const missingRoutes = canonicalRoutes.filter((route) => !linkedRoutes.has(route));
    if (missingRoutes.length) addDiscoveryFailure(failures, '/site-map/', 'site-map-destination-missing', { missingRoutes });
  }

  const custom404 = byRoute.get('/404.html');
  if (!custom404) {
    addDiscoveryFailure(failures, '/404.html', 'missing-custom-404-html');
  } else {
    const hrefs = new Set(descendants(custom404.tree, (node) => node.tag === 'a' && node.attributes.href).map((node) => {
      const resolved = resolveHref(node.attributes.href, '/404.html');
      return resolved.pathname;
    }).filter(Boolean));
    if (!hrefs.has('/') || !hrefs.has('/games/')) addDiscoveryFailure(failures, '/404.html', 'custom-404-navigation-missing', { actual: [...hrefs] });
  }

  return failures;
}

function auditRelatedGames(documents) {
  const failures = [];
  let linksChecked = 0;
  const catalogBySlug = new Map(games.map((game) => [game.slug, game]));

  for (const game of games) {
    const route = game.href;
    const document = [...documents.values()].find((item) => item.route === route);
    if (!document) {
      failures.push({ game: game.slug, reason: 'missing-game-html' });
      continue;
    }
    const sections = findClass(document.tree, 'game-detail__related');
    if (sections.length !== 1) {
      failures.push({ game: game.slug, reason: 'related-section-count-mismatch', actual: sections.length });
      continue;
    }
    if (normalizedText(firstTag(sections[0], 'h2') ?? { children: [] }) !== 'Related Games') failures.push({ game: game.slug, reason: 'related-heading-missing' });
    const links = descendants(sections[0], (node) => node.tag === 'a' && hasClass(node, 'game-detail__related-link'));
    linksChecked += links.length;
    const expected = expectedRelatedSlugs[game.slug].map((slug) => catalogBySlug.get(slug));
    if (links.length !== 3) failures.push({ game: game.slug, reason: 'related-count-mismatch', expected: 3, actual: links.length });
    const actual = links.map((link) => ({
      href: link.attributes.href,
      name: normalizedText(firstTag(link, 'strong') ?? { children: [] }),
      description: normalizedText(findClass(link, 'game-detail__related-description')[0] ?? { children: [] }),
    }));
    const actualSlugs = actual.map((item) => games.find((candidate) => candidate.href === item.href)?.slug ?? null);
    if (JSON.stringify(actualSlugs) !== JSON.stringify(expectedRelatedSlugs[game.slug])) failures.push({ game: game.slug, reason: 'related-order-or-destination-mismatch', expected: expectedRelatedSlugs[game.slug], actual: actualSlugs });
    if (actual.some((item, index) => item.name !== expected[index]?.name)) failures.push({ game: game.slug, reason: 'name-mismatch' });
    if (actual.some((item, index) => item.description !== expected[index]?.description)) failures.push({ game: game.slug, reason: 'description-mismatch' });
    if (actual.some((item) => item.href === game.href)) failures.push({ game: game.slug, reason: 'self-link' });
    if (new Set(actual.map((item) => item.href)).size !== actual.length) failures.push({ game: game.slug, reason: 'duplicate-link' });
  }

  return { gamePages: games.length, linksChecked, failures };
}

export function validateGeneratedSite(outputDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../dist')) {
  const root = resolve(outputDirectory);
  const htmlFiles = walkHtml(root);
  const documents = new Map(htmlFiles.map((file) => {
    const html = readFileSync(file, 'utf8');
    return [file, { file, route: fileRoute(root, file), html, tree: parseHtml(html) }];
  }));
  const brokenLinks = [];
  const graph = new Map();
  let linksInspected = 0;
  let internalLinksInspected = 0;
  let externalLinksIgnored = 0;

  for (const document of documents.values()) {
    const anchors = descendants(document.tree, (node) => node.tag === 'a' && node.attributes.href !== undefined);
    linksInspected += anchors.length;
    for (const anchor of anchors) {
      const href = anchor.attributes.href;
      const resolution = resolveHref(href, document.route);
      if (resolution.error) {
        brokenLinks.push({ source: document.route, href, reason: resolution.error });
        continue;
      }
      if (resolution.external) {
        externalLinksIgnored += 1;
        continue;
      }
      internalLinksInspected += 1;
      if (navigationRoutes.has(document.route) && isLegacyGuidePath(resolution.pathname)) {
        brokenLinks.push({ source: document.route, href, reason: 'legacy-guide-navigation' });
      }

      const targetFile = outputFileForPath(root, resolution.pathname);
      if (!targetFile) {
        brokenLinks.push({ source: document.route, href, reason: 'missing-destination' });
        continue;
      }
      if (resolution.fragment && extname(targetFile).toLowerCase() === '.html') {
        const target = documents.get(targetFile) ?? { tree: parseHtml(readFileSync(targetFile, 'utf8')) };
        const ids = new Set(descendants(target.tree, (node) => node.attributes.id || node.attributes.name).flatMap((node) => [node.attributes.id, node.attributes.name]).filter(Boolean));
        if (!ids.has(resolution.fragment)) brokenLinks.push({ source: document.route, href, reason: 'missing-fragment' });
      }

      if (extname(targetFile).toLowerCase() === '.html') {
        const targetRoute = documents.get(targetFile)?.route ?? fileRoute(root, targetFile);
        const edges = graph.get(document.route) ?? new Set();
        edges.add(targetRoute);
        graph.set(document.route, edges);
      }
    }
  }

  const missingRequiredDestinations = canonicalRoutes.filter((route) => !outputFileForPath(root, route));
  for (const route of missingRequiredDestinations) brokenLinks.push({ source: '[required routes]', href: route, reason: 'missing-required-destination' });

  const reachable = new Set();
  const queue = outputFileForPath(root, '/') ? ['/'] : [];
  while (queue.length) {
    const route = queue.shift();
    if (reachable.has(route)) continue;
    reachable.add(route);
    for (const destination of graph.get(route) ?? []) if (!reachable.has(destination)) queue.push(destination);
  }
  const orphanCanonicalDestinations = canonicalRoutes.filter((route) => !reachable.has(route));
  const canonicalMetadata = auditCanonicalMetadata(documents);
  const discoveryFailures = auditDiscovery(root, documents);
  const relatedGames = auditRelatedGames(documents);
  const report = {
    generatedHtmlPages: htmlFiles.length,
    requiredDestinations: canonicalRoutes.length,
    linksInspected,
    internalLinksInspected,
    externalLinksIgnored,
    brokenLinks,
    orphanCanonicalDestinations,
    canonicalMetadataPages: canonicalMetadata.canonicalMetadataPages,
    canonicalMetadataFailures: canonicalMetadata.failures,
    relatedGames,
    discoveryFailures,
  };
  report.passed = brokenLinks.length === 0 && orphanCanonicalDestinations.length === 0 && canonicalMetadata.failures.length === 0 && relatedGames.failures.length === 0 && discoveryFailures.length === 0;
  return report;
}

function parseCliRoot(args) {
  const index = args.indexOf('--root');
  if (index < 0) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error('--root requires a directory path');
  return isAbsolute(value) ? value : resolve(value);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const report = validateGeneratedSite(parseCliRoot(process.argv.slice(2)));
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (!report.passed) process.exitCode = 1;
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ passed: false, error: error.message }, null, 2)}\n`);
    process.exitCode = 1;
  }
}
