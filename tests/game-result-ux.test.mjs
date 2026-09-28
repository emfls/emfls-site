import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

const games = [
  {
    name: 'Pulse Junction',
    component: '../src/components/games/PulseJunctionGame.astro',
    styles: '../src/styles/games/pulse-junction.css',
    terminal: 'RESULT',
    action: 'restart',
    label: 'Play Again',
    control: 'button',
    values: ['Total Score', 'Perfect', 'Good', 'Miss', 'Max Combo', 'Best Score', 'Best Combo'],
  },
  {
    name: 'Mirror Drift',
    component: '../src/components/games/MirrorDriftGame.astro',
    styles: '../src/styles/games/mirror-drift.css',
    terminal: 'RESULT',
    action: 'restart',
    label: 'Play Again',
    control: 'button',
    values: ['Total Score', 'Total Strikes', 'Fastest Clear', 'Best Score', 'Fewest Strikes'],
  },
  {
    name: 'Orbit Slip',
    component: '../src/components/games/OrbitSlipGame.astro',
    styles: '../src/styles/games/orbit-slip.css',
    terminal: 'RESULT',
    action: 'play-again',
    label: 'Play Again',
    control: 'button',
    values: ['Score', 'Survival Time', 'Gates Passed', 'Best Score', 'Best Time'],
  },
  {
    name: 'Signal Sweep',
    component: '../src/components/games/SignalSweepGame.astro',
    styles: '../src/styles/games/signal-sweep.css',
    terminal: 'RESULT',
    action: 'play-again',
    label: 'Play Again',
    control: 'button',
    values: ['Score', 'Correct Targets', 'Mistakes', 'Clean Rounds', 'Average Accuracy', 'Best Score'],
  },
  {
    name: 'Gravity Pact',
    component: '../src/components/games/GravityPactGame.astro',
    styles: '../src/styles/games/gravity-pact.css',
    terminal: 'RESULT',
    action: 'restart',
    label: 'Play Again',
    control: 'button',
    values: ['Result', 'A Score', 'B Score', 'Turns Used'],
  },
  {
    name: 'Field Bloom',
    component: '../src/components/games/FieldBloomGame.astro',
    styles: '../src/styles/games/field-bloom.css',
    terminal: 'SOLVE_FEEDBACK',
    action: 'retry',
    label: 'Retry Puzzle',
    control: 'button',
    values: ['Stars', 'Pieces Used', 'Undo Count', 'Time', 'Best Stars', 'Best Time'],
  },
  {
    name: 'Twin Ledger',
    component: '../src/components/games/TwinLedgerGame.astro',
    styles: '../src/styles/games/twin-ledger.css',
    terminal: 'RESULT',
    action: 'play-again',
    label: 'Play Again',
    control: 'button',
    values: ['Score', 'Final Difference', 'Exact Count', 'Breach Count', 'Max Combo', 'Best Score'],
  },
  {
    name: 'Glass Bloom',
    component: '../src/components/games/GlassBloomGame.astro',
    styles: '../src/styles/games/glass-bloom.css',
    terminal: 'RESULT',
    action: 'play-again',
    label: 'Play Again',
    control: 'button',
    values: ['Total Score', 'Successful Banks', 'Breaks', 'Highest Stage', 'Best Bank Streak', 'Best Score'],
  },
];

test('all eight terminal surfaces expose one native, clearly labeled replay action', () => {
  const sharedStyles = source('../src/styles/game-shell.css');
  const tokens = source('../src/styles/game-tokens.css');
  assert.match(tokens, /--game-control-min-size:\s*44px/);
  assert.match(sharedStyles, /\.button\s*\{[^}]*min-height:\s*var\(--game-control-min-size\)/s);
  assert.match(sharedStyles, /:focus-visible/);

  for (const game of games) {
    const component = source(game.component);
    const terminal = component.match(new RegExp(`data-panel="${game.terminal}"[^>]*>([\\s\\S]*?)<\\/section>|data-panel="${game.terminal}"[^>]*>([\\s\\S]*?)<\\/div>`));
    assert.ok(terminal, `${game.name} must expose its terminal surface`);
    const body = terminal[1] ?? terminal[2];
    const replay = body.match(new RegExp(`<${game.control}\\b[^>]*data-action="${game.action}"[^>]*>([\\s\\S]*?)<\\/${game.control}>`));
    assert.ok(replay, `${game.name} must expose its primary replay button in the terminal surface`);
    assert.equal(replay[1].replace(/<[^>]+>/g, '').trim(), game.label, `${game.name} replay label`);
    assert.equal((body.match(new RegExp(`data-action="${game.action}"`, 'g')) ?? []).length, 1, `${game.name} must not duplicate its replay action`);
    for (const valueLabel of game.values) {
      assert.ok(body.includes(`<dt>${valueLabel}</dt>`), `${game.name} result must visibly label ${valueLabel}`);
    }

    assert.match(component, /<button\b/ , `${game.name} replay uses a native button`);
  }
});

test('inactive game panels are removed from layout and cannot intercept input', () => {
  for (const game of games) {
    const styles = source(game.styles);
    assert.match(styles, /\[hidden\][^{]*\{[^}]*display:\s*none/s, `${game.name} must suppress display rules on hidden panels`);
  }
});

test('Glass Bloom puts the terminal result before gameplay-only decision controls', () => {
  const styles = source('../src/styles/games/glass-bloom.css');

  assert.match(styles, /\.glass-bloom\[data-state="RESULT"\]\s+\.glass-bloom__play\s*\{[^}]*display:\s*none/s);
  assert.match(styles, /\.glass-bloom\[data-state="RESULT"\]\s+\.glass-bloom__panels\s*\{[^}]*order:\s*1/s);
  assert.match(styles, /\.glass-bloom\[data-state="RESULT"\]\s+\.glass-bloom__hud\s*\{[^}]*display:\s*none/s);
  assert.match(styles, /@media\s*\(max-width:\s*40rem\)[\s\S]*?\.glass-bloom__result-stats\s*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(styles, /\.glass-bloom__result-stats\s*>\s*div\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto/s);
  assert.match(styles, /@media\s*\(max-width:\s*40rem\)[\s\S]*?\.glass-bloom__result-stats\s*>\s*div\s*\{[^}]*padding-block:\s*0/s);
});
