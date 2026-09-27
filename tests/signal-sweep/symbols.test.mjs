import assert from 'node:assert/strict';
import test from 'node:test';

const load = async () => import('../../src/games/signal-sweep/symbols.ts').catch(() => ({}));
const symbols = await load();
const available = (name) => assert.equal(typeof symbols[name], 'function', `${name} must be exported`);

test('symbol domain enumerates every frozen shape, fill, mark, and color value once', () => {
  available('enumerateSymbolTuples');
  assert.deepEqual(symbols.SHAPES, ['circle', 'triangle', 'square', 'diamond']);
  assert.deepEqual(symbols.FILLS, ['solid', 'striped', 'hollow']);
  assert.deepEqual(symbols.MARKS, ['none', 'dot', 'line', 'cross']);
  assert.deepEqual(symbols.COLOR_FAMILIES, ['coral', 'teal', 'violet', 'amber']);
  const tuples = symbols.enumerateSymbolTuples();
  assert.equal(tuples.length, 192);
  assert.equal(new Set(tuples.map(symbols.canonicalSymbolTuple)).size, 192);
  assert.deepEqual(tuples[0], { shape: 'circle', fill: 'solid', mark: 'none', colorFamily: 'coral' });
  for (const shape of symbols.SHAPES) assert.ok(tuples.some((tuple) => tuple.shape === shape));
  for (const fill of symbols.FILLS) assert.ok(tuples.some((tuple) => tuple.fill === fill));
  for (const mark of symbols.MARKS) assert.ok(tuples.some((tuple) => tuple.mark === mark));
  for (const colorFamily of symbols.COLOR_FAMILIES) assert.ok(tuples.some((tuple) => tuple.colorFamily === colorFamily));
});

test('visual descriptor and evaluator-facing attributes stay identical across the complete domain', () => {
  available('symbolVisualDescriptor');
  available('createSymbol');
  for (const [index, tuple] of symbols.enumerateSymbolTuples().entries()) {
    const symbol = symbols.createSymbol(`ss-domain-${index}`, tuple);
    const visual = symbols.symbolVisualDescriptor(symbol);
    assert.deepEqual(
      { shape: visual.shape, fill: visual.fill, mark: visual.mark, colorFamily: visual.colorFamily },
      { shape: symbol.shape, fill: symbol.fill, mark: symbol.mark, colorFamily: symbol.colorFamily },
    );
  }
});

test('symbol record, visual descriptor, palette, and accessible name derive from one tuple', () => {
  available('createSymbol');
  available('symbolVisualDescriptor');
  available('symbolAccessibleName');
  const symbol = symbols.createSymbol('ss-test-r01-a01-t01', {
    shape: 'triangle', fill: 'striped', mark: 'dot', colorFamily: 'coral',
  });
  assert.ok(Object.isFrozen(symbol));
  assert.deepEqual(symbols.symbolVisualDescriptor(symbol), {
    shape: 'triangle', fill: 'striped', mark: 'dot', colorFamily: 'coral', colorHex: '#B5473C',
  });
  assert.equal(symbols.symbolAccessibleName(symbol), 'Coral striped triangle with a dot');
  const unmarked = symbols.createSymbol('ss-test-r01-a01-t02', {
    shape: 'circle', fill: 'hollow', mark: 'none', colorFamily: 'teal',
  });
  assert.equal(symbols.symbolAccessibleName(unmarked), 'Teal hollow circle');
});

test('symbol construction rejects values outside the frozen data model', () => {
  available('createSymbol');
  assert.throws(() => symbols.createSymbol('', { shape: 'circle', fill: 'solid', mark: 'none', colorFamily: 'coral' }), RangeError);
  assert.throws(() => symbols.createSymbol('x', { shape: 'star', fill: 'solid', mark: 'none', colorFamily: 'coral' }), RangeError);
});
