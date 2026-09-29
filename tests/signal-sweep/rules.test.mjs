import assert from 'node:assert/strict';
import test from 'node:test';

const loadRules = async () => import('../../src/games/signal-sweep/rules.ts').catch(() => ({}));
const loadRng = async () => import('../../src/games/signal-sweep/rng.ts').catch(() => ({}));
const loadSymbols = async () => import('../../src/games/signal-sweep/symbols.ts').catch(() => ({}));
const rules = await loadRules();
const rng = await loadRng();
const symbols = await loadSymbols();
const available = (module, name) => assert.equal(typeof module[name], 'function', `${name} must be exported`);
const EXPECTED = [
  'T1_SHAPE', 'T1_FILL', 'T1_MARK',
  'T2_SHAPE_FILL', 'T2_SHAPE_MARK', 'T2_FILL_MARK',
  'T3_NOT_SHAPE_AND_FILL', 'T3_NOT_FILL_AND_MARK', 'T3_NOT_MARK_AND_COLOR_AND_SHAPE',
  'T4_SHAPE_OR_FILL', 'T4_SHAPE_FILL_OR_MARK', 'T4_COLOR_SHAPE_OR_FILL',
  'T5_NOT_SHAPE_FILL_MARK', 'T5_NOT_FILL_SHAPE_COLOR', 'T5_OR_SHAPE_FILL_MARK',
  'T5_OR_COLOR_SHAPE_FILL', 'T5_OR_MARK_FILL_SHAPE',
];

test('registry contains every stable template ID in frozen tier order', () => {
  assert.deepEqual(rules.RULE_TEMPLATE_IDS, EXPECTED);
  assert.equal(rules.RULE_TEMPLATES.length, 17);
  assert.deepEqual(rules.RULE_TEMPLATES.map((template) => template.tier), [1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 5, 5]);
});

test('every template binds rule text and evaluator to the same stable definition', () => {
  available(rules, 'createRuleFromTemplate');
  available(rules, 'renderRuleText');
  available(rules, 'evaluateRule');
  available(rng, 'createSeededRandom');
  available(symbols, 'enumerateSymbolTuples');
  const universe = symbols.enumerateSymbolTuples().map((attributes, index) => symbols.createSymbol(`probe-${index}`, attributes));

  for (const [index, id] of EXPECTED.entries()) {
    const rule = rules.createRuleFromTemplate(id, rng.createSeededRandom(index + 1));
    assert.equal(rule.templateId, id);
    assert.equal(rule.textTemplateId, id);
    assert.equal(rule.evaluatorTemplateId, id);
    assert.equal(rule.text, rules.renderRuleText(rule.expression));
    const trueCount = universe.filter((symbol) => rules.evaluateRule(rule, symbol)).length;
    assert.ok(trueCount > 0 && trueCount < universe.length, `${id} has both true and false witnesses`);
    const target = universe.find((symbol) => rules.evaluateRule(rule, symbol));
    const falseSymbol = universe.find((symbol) => !rules.evaluateRule(rule, symbol));
    assert.ok(target && falseSymbol, `${id} exposes deterministic true and false symbols`);
  }
});

test('near misses are false witnesses changed in one referenced non-color attribute only', () => {
  available(rules, 'createRuleFromTemplate');
  available(rules, 'evaluateRule');
  available(rules, 'isNearMiss');
  available(rng, 'createSeededRandom');
  available(symbols, 'enumerateSymbolTuples');
  const universe = symbols.enumerateSymbolTuples();
  const rule = rules.createRuleFromTemplate('T1_SHAPE', rng.createSeededRandom(4));
  const target = universe.find((symbol) => rules.evaluateRule(rule, symbol));
  const near = universe.find((symbol) => rules.isNearMiss(target, symbol, rule));
  const colorOnly = { ...target, colorFamily: target.colorFamily === 'coral' ? 'teal' : 'coral' };
  assert.ok(near);
  assert.equal(rules.isNearMiss(target, near, rule), true);
  assert.equal(rules.isNearMiss(target, colorOnly, rule), false);
});

test('tiers enforce their atom, NOT, OR, color, and nesting limits', () => {
  available(rules, 'createRuleFromTemplate');
  available(rng, 'createSeededRandom');
  for (const [index, id] of EXPECTED.entries()) {
    const rule = rules.createRuleFromTemplate(id, rng.createSeededRandom(index + 41));
    const groups = rule.expression.kind === 'all' ? [rule.expression.atoms] : rule.expression.branches.map((branch) => branch.atoms);
    const atoms = groups.flat();
    assert.ok(atoms.length <= 3, `${id} has at most three atoms`);
    for (const group of groups) {
      if (group.some((atom) => atom.attribute === 'colorFamily')) {
        assert.ok(group.some((atom) => atom.attribute !== 'colorFamily'), `${id} color condition has a non-color companion`);
      }
    }
    if (rule.tier === 1) assert.ok(atoms.length === 1 && atoms[0].attribute !== 'colorFamily' && atoms[0].operator === 'eq');
    if (rule.tier === 2) assert.ok(rule.expression.kind === 'all' && atoms.length === 2 && atoms.every((atom) => atom.operator === 'eq'));
    if (rule.tier === 3) assert.ok(rule.expression.kind === 'all' && atoms.filter((atom) => atom.operator === 'not-eq').length === 1);
    if (rule.tier === 4) assert.ok(rule.expression.kind === 'or' && rule.expression.branches.length === 2 && atoms.every((atom) => atom.operator === 'eq'));
    if (rule.tier === 5) assert.ok(rule.expression.kind === 'or' || atoms.filter((atom) => atom.operator === 'not-eq').length === 1);
  }
});

test('OR branches are not logically equivalent over the full 192-symbol domain', () => {
  available(rules, 'createRuleFromTemplate');
  available(rules, 'evaluateBranch');
  available(rng, 'createSeededRandom');
  available(symbols, 'enumerateSymbolTuples');
  const universe = symbols.enumerateSymbolTuples();
  for (const [index, template] of rules.RULE_TEMPLATES.entries()) {
    if (template.kind !== 'or') continue;
    const rule = rules.createRuleFromTemplate(template.id, rng.createSeededRandom(index + 90));
    const [left, right] = rule.expression.branches;
    assert.ok(universe.some((symbol) => rules.evaluateBranch(left, symbol) !== rules.evaluateBranch(right, symbol)), template.id);
  }
});

test('tier selection stays within its own frozen template family', () => {
  available(rules, 'createRuleForTier');
  available(rng, 'createSeededRandom');
  for (let tier = 1; tier <= 5; tier++) {
    const rule = rules.createRuleForTier(tier, rng.createSeededRandom(300 + tier));
    assert.equal(rule.tier, tier);
    assert.ok(rules.RULE_TEMPLATES.some((template) => template.id === rule.templateId && template.tier === tier));
  }
  assert.throws(() => rules.createRuleForTier(6, rng.createSeededRandom(1)), RangeError);
});
