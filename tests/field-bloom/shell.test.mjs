import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const routePath = new URL('../../src/pages/games/field-bloom.astro', import.meta.url);
const componentPath = new URL('../../src/components/games/FieldBloomGame.astro', import.meta.url);
const controllerPath = new URL('../../src/games/field-bloom/controller.ts', import.meta.url);
const stylesPath = new URL('../../src/styles/games/field-bloom.css', import.meta.url);

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

test('presentation exposes requirement and piece type metadata without changing labels', () => {
  const controller = readRequired(controllerPath, 'Field Bloom controller');

  assert.match(controller, /element\.dataset\.requirement\s*=\s*cell\.requirement/);
  assert.match(controller, /button\.dataset\.pieceType\s*=\s*piece\.pieceType/);
  assert.match(controller, /button\.setAttribute\('aria-label', `\$\{piece\.pieceType\} energy piece/);
});

test('narrow Field Bloom boards let six columns fit without overlapping touch targets', () => {
  const styles = readRequired(stylesPath, 'Field Bloom styles');
  const narrowLayout = styles.match(/@media\s*\(max-width:\s*22rem\)[\s\S]*?(?=\n@media|$)/)?.[0] ?? '';
  const mobileLayout = styles.match(/@media\s*\(max-width:\s*40rem\)[\s\S]*?(?=\n@media|$)/)?.[0] ?? '';

  assert.match(narrowLayout, /\.field-bloom__board\s*\{[^}]*gap:\s*1px[^}]*padding:\s*0/);
  assert.match(narrowLayout, /:root:has\(\.field-bloom\)\s*\{[^}]*min-width:\s*0/);
  assert.match(narrowLayout, /\.field-bloom__levels\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(mobileLayout, /\.field-bloom__board\[aria-colcount='6'\]\s*\.field-bloom__cell\s*\{[^}]*aspect-ratio:\s*auto/);
  assert.match(styles, /\.field-bloom__cell\s*\{[^}]*min-height:\s*var\(--game-control-min-size\)/);
});
