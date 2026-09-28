import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const routePath = new URL('../../src/pages/games/glass-bloom.astro', import.meta.url);
const componentPath = new URL('../../src/components/games/GlassBloomGame.astro', import.meta.url);
const stylesPath = new URL('../../src/styles/games/glass-bloom.css', import.meta.url);
const inputPath = new URL('../../src/games/glass-bloom/input.ts', import.meta.url);
const controllerPath = new URL('../../src/games/glass-bloom/controller.ts', import.meta.url);

const readRequired = (path, label) => {
  assert.ok(existsSync(path), `${label} must exist`);
  return readFileSync(path, 'utf8');
};

test('Glass Bloom route reuses its catalog record and the shared game detail frame', () => {
  const route = readRequired(routePath, 'Glass Bloom route');

  assert.match(route, /games\.find\(\s*\(entry\)\s*=>\s*entry\.slug\s*===\s*'glass-bloom'/);
  assert.match(route, /<GameDetailFrame\s+game=\{game\}/);
  assert.match(route, /<GlassBloomGame\s+slot="game"\s*\/>/);
  assert.doesNotMatch(route, /slot="related-games"/);
  assert.doesNotMatch(route, /Coming Soon|Under Construction/i);
});

test('route contains the A-frozen English guide copy', () => {
  const route = readRequired(routePath, 'Glass Bloom route');

  assert.match(route, /Grow your crystal to raise its pot, but each growth carries a break risk/);
  assert.match(route, /Select Grow or Bank, or use Space to Grow and Enter to Bank/);
  assert.match(route, /Banked points are added to your total with a bonus that grows after consecutive banks/);
});

test('static shell exposes exactly the eight frozen panels with IDLE as the only visible panel', () => {
  const component = readRequired(componentPath, 'Glass Bloom component');
  const panels = [...component.matchAll(/data-panel="([A-Z_]+)"/g)].map((match) => match[1]);

  assert.deepEqual(panels, ['IDLE', 'CRYSTAL_INTRO', 'DECISION', 'GROW_RESOLVING', 'BANK_RESOLVING', 'ROUND_FEEDBACK', 'PAUSED', 'RESULT']);
  assert.equal((component.match(/data-state=/g) ?? []).length, 1);
  assert.match(component, /data-state="IDLE"/);
  assert.match(component, /data-panel="IDLE"(?![^>]*\bhidden\b)/);
  for (const panel of panels.slice(1)) {
    assert.match(component, new RegExp(`data-panel="${panel}"[^>]*\\bhidden\\b`));
  }
});

test('hierarchy includes the frozen HUD, risk surfaces, and an in-project SVG crystal', () => {
  const component = readRequired(componentPath, 'Glass Bloom component');

  for (const label of ['Total Score', 'Crystal', 'Stage', 'Unbanked', 'Break Risk', 'If Safe', 'Risk level']) {
    assert.ok(component.includes(label), `missing visible game label: ${label}`);
  }
  assert.match(component, /<svg\b[^>]*class="glass-bloom__crystal"/);
  assert.doesNotMatch(component, /<img\b|https?:\/\//i);
  assert.match(component, /Maximum Stage · Bank to secure 2,800/);
});

test('interactive controller hooks stay inside the existing shell with rematch and best-record handling delegated', () => {
  const component = readRequired(componentPath, 'Glass Bloom component');
  const input = readRequired(inputPath, 'Glass Bloom input');
  const controller = readRequired(controllerPath, 'Glass Bloom controller');

  for (const action of ['start', 'grow', 'bank', 'pause', 'resume', 'play-again']) {
    assert.match(component, new RegExp(`data-action="${action}"[^>]*\\bdisabled\\b`));
  }
  assert.match(component, /data-glass-bloom/);
  for (const value of ['total-score', 'crystal-index', 'stage', 'pot', 'break-risk', 'safe-pot', 'risk-band']) {
    assert.ok(component.includes(`data-value="${value}"`), `missing live value hook: ${value}`);
  }
  assert.match(component, /createGlassBloomController/);
  assert.match(component, /bindGlassBloomInput/);
  assert.match(component, /astro:before-swap/);
  assert.match(component, /pagehide/);
  assert.doesNotMatch(component, /localStorage|emfls:glass-bloom:best:v1/);
  assert.match(component, /setDisabled\('play-again',\s*state\s*!==\s*'RESULT'\)/);
  assert.match(component, /controller\.getBestStats\(\)/);
  assert.match(input, /case 'play-again':\s*options\.controller\.playAgain\(\)/);
  assert.match(controller, /getBestStats\(\)/);
});

test('RESULT exposes exactly the six frozen public fields and no seventh lifetime metric', () => {
  const component = readRequired(componentPath, 'Glass Bloom component');
  const result = component.match(/<section class="glass-bloom__panel" data-panel="RESULT"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  assert.ok(result, 'the existing RESULT panel must remain the only result surface');
  const labels = [...result.matchAll(/<dt>([^<]+)<\/dt>/g)].map((match) => match[1]);
  assert.deepEqual(labels, ['Total Score', 'Successful Banks', 'Breaks', 'Highest Stage', 'Best Bank Streak', 'Best Score']);
  assert.doesNotMatch(result, /Highest Stage Reached|Crystals Banked|Your banked total/);
  for (const value of ['result-total-score', 'result-successful-banks', 'result-breaks', 'result-highest-stage', 'result-best-bank-streak', 'result-best-score']) {
    assert.ok(result.includes(`data-value="${value}"`), `missing result value hook ${value}`);
  }
});

test('scoped styles support the shell without introducing outcome animation or placeholders', () => {
  const styles = readRequired(stylesPath, 'Glass Bloom styles');

  assert.match(styles, /\.glass-bloom__panel\[hidden\]\s*\{\s*display:\s*none/);
  assert.match(styles, /--game-control-min-size/);
  assert.match(styles, /@media\s*\(max-width:/);
  assert.doesNotMatch(styles, /Coming Soon|Under Construction|animation-name:\s*(?:shatter|grow-outcome)/i);
});
