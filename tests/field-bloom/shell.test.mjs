import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const routePath = new URL('../../src/pages/games/field-bloom.astro', import.meta.url);
const componentPath = new URL('../../src/components/games/FieldBloomGame.astro', import.meta.url);

const readRequired = (path, label) => {
  assert.ok(existsSync(path), `${label} must be present for the Field Bloom shell`);
  return readFileSync(path, 'utf8');
};

test('Field Bloom route uses its catalog entry and the existing detail frame', () => {
  const route = readRequired(routePath, 'Field Bloom route');

  assert.match(route, /games\.find\(\s*\(entry\)\s*=>\s*entry\.slug\s*===\s*'field-bloom'/);
  assert.match(route, /<GameDetailFrame\s+game=\{game\}/);
  assert.match(route, /<FieldBloomGame\s+slot="game"\s*\/>/);
  assert.doesNotMatch(route, /slot="related-games"/);
  assert.doesNotMatch(route, /Coming Soon|Under Construction/i);
});

test('route publishes the frozen English guide copy without changing catalog metadata', () => {
  const route = readRequired(routePath, 'Field Bloom route');

  assert.match(route, /Place energy pieces on the grid\./);
  assert.match(route, /Every target must receive exactly its shown number of activations/);
  assert.match(route, /Tap or click an unused piece to select it/);
  assert.match(route, /Earn 3 stars with no Undo and at most par pieces/);
  assert.match(route, /Time does not affect stars/);
});

test('DOM shell exposes exactly the five frozen lifecycle state surfaces', () => {
  const component = readRequired(componentPath, 'Field Bloom component');
  const panels = [...component.matchAll(/data-panel="([A-Z_]+)"/g)].map((match) => match[1]);

  assert.equal((component.match(/data-state=/g) ?? []).length, 1);
  assert.match(component, /data-state="LEVEL_SELECT"/);
  assert.deepEqual(panels, ['LEVEL_SELECT', 'PUZZLE_INTRO', 'PLAYING', 'SOLVE_FEEDBACK', 'PAUSED']);
  assert.match(component, /data-board/);
  assert.match(component, /data-inventory/);
  assert.match(component, /data-action="undo"/);
  assert.match(component, /data-action="reset"/);
  assert.match(component, /data-action="resume"/);
  assert.match(component, /data-action="next"/);
  assert.match(component, /data-action="retry"/);
  assert.match(component, /data-action="level-select"/);
  assert.doesNotMatch(component, /src\/games\/field-bloom|setInterval|Math\.random|localStorage/);
});
