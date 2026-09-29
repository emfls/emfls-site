import assert from 'node:assert/strict';
import test from 'node:test';

const load = async () => import('../../src/games/signal-sweep/validator.ts').catch(() => ({}));
const loadGenerator = async () => import('../../src/games/signal-sweep/generator.ts').catch(() => ({}));
const loadSymbols = async () => import('../../src/games/signal-sweep/symbols.ts').catch(() => ({}));
const loadRules = async () => import('../../src/games/signal-sweep/rules.ts').catch(() => ({}));
const validator = await load();
const generator = await loadGenerator();
const symbols = await loadSymbols();
const rules = await loadRules();
const available = (name) => assert.equal(typeof validator[name], 'function', `${name} must be exported`);

test('rule validator reports mismatched template, text, evaluator, and color-only logic', () => {
  available('validateRule');
  const valid = {
    tier: 1, templateId: 'T1_SHAPE', textTemplateId: 'T1_SHAPE', evaluatorTemplateId: 'T1_SHAPE',
    text: 'Find every symbol that is a circle.',
    expression: { kind: 'all', atoms: [{ attribute: 'shape', operator: 'eq', value: 'circle' }] },
  };
  assert.equal(validator.validateRule(valid, 1).valid, true);
  assert.ok(validator.validateRule({ ...valid, evaluatorTemplateId: 'T1_FILL' }, 1).issues.includes('TEMPLATE_EVALUATOR_MISMATCH'));
  assert.ok(validator.validateRule({ ...valid, text: 'Find every square.' }, 1).issues.includes('RULE_TEXT_MISMATCH'));
  const colorOnly = { ...valid, expression: { kind: 'all', atoms: [{ attribute: 'colorFamily', operator: 'eq', value: 'coral' }] } };
  assert.ok(validator.validateRule(colorOnly, 1).issues.includes('COLOR_ONLY_RULE'));

  const colorOnlyBranch = {
    tier: 4, templateId: 'T4_COLOR_SHAPE_OR_FILL', textTemplateId: 'T4_COLOR_SHAPE_OR_FILL',
    evaluatorTemplateId: 'T4_COLOR_SHAPE_OR_FILL',
    expression: { kind: 'or', branches: [
      { kind: 'all', atoms: [{ attribute: 'colorFamily', operator: 'eq', value: 'coral' }] },
      { kind: 'all', atoms: [{ attribute: 'fill', operator: 'eq', value: 'solid' }] },
    ] },
  };
  colorOnlyBranch.text = rules.renderRuleText(colorOnlyBranch.expression);
  assert.ok(validator.validateRule(colorOnlyBranch, 4).issues.includes('COLOR_ONLY_RULE'));

  const invalidNegativeMark = {
    tier: 3, templateId: 'T3_NOT_MARK_AND_COLOR_AND_SHAPE', textTemplateId: 'T3_NOT_MARK_AND_COLOR_AND_SHAPE',
    evaluatorTemplateId: 'T3_NOT_MARK_AND_COLOR_AND_SHAPE',
    expression: { kind: 'all', atoms: [
      { attribute: 'mark', operator: 'not-eq', value: 'none' },
      { attribute: 'colorFamily', operator: 'eq', value: 'coral' },
      { attribute: 'shape', operator: 'eq', value: 'circle' },
    ] },
  };
  invalidNegativeMark.text = rules.renderRuleText(invalidNegativeMark.expression);
  assert.ok(validator.validateRule(invalidNegativeMark, 3).issues.includes('INVALID_RULE_GRAMMAR'));
  assert.doesNotThrow(() => validator.validateRule({ ...valid, expression: { kind: 'or', branches: [null] } }));
});

test('round validator rejects invalid board size, false target claims, and repeated tuples above three', () => {
  available('validateRoundPlan');
  assert.equal(typeof generator.createFallbackRound, 'function', 'createFallbackRound must be exported');
  const round = generator.createFallbackRound(1, 17);
  assert.equal(validator.validateRoundPlan(round).valid, true);
  assert.ok(validator.validateRoundPlan({ ...round, boardSize: round.boardSize + 1 }).issues.includes('INVALID_BOARD_SIZE'));
  const falseId = round.symbols.find((symbol) => !round.targetIds.includes(symbol.id)).id;
  assert.ok(validator.validateRoundPlan({ ...round, targetIds: [...round.targetIds, falseId] }).issues.includes('TARGET_RULE_MISMATCH'));
  const repeated = round.symbols.map((symbol) => ({ ...symbol, shape: 'circle', fill: 'solid', mark: 'none', colorFamily: 'coral' }));
  assert.ok(validator.validateRoundPlan({ ...round, symbols: repeated }).issues.includes('TUPLE_LIMIT_EXCEEDED'));
});

test('round validator rejects an invalid target count and fewer than six distractors', () => {
  available('validateRoundPlan');
  assert.equal(typeof generator.createFallbackRound, 'function', 'createFallbackRound must be exported');
  const round = generator.createFallbackRound(1, 29);
  assert.ok(validator.validateRoundPlan({ ...round, targetIds: round.symbols.map((symbol) => symbol.id) }).issues.includes('INVALID_DISTRACTOR_COUNT'));
  assert.ok(validator.validateRoundPlan({ ...round, targetIds: [] }).issues.includes('INVALID_TARGET_COUNT'));
});

test('round validator rejects all-target boards and a true symbol mislabeled as a distractor', () => {
  available('validateRoundPlan');
  const round = generator.createFallbackRound(1, 31);
  const allTargets = validator.validateRoundPlan({ ...round, targetIds: round.symbols.map(({ id }) => id) });
  assert.ok(allTargets.issues.includes('ALL_TARGET_BOARD'));
  assert.ok(allTargets.issues.includes('INVALID_DISTRACTOR_COUNT'));

  const removedTarget = round.targetIds[0];
  const mislabeled = validator.validateRoundPlan({ ...round, targetIds: round.targetIds.slice(1) });
  assert.ok(mislabeled.issues.includes('TARGET_RULE_MISMATCH'));
  assert.ok(round.symbols.some(({ id }) => id === removedTarget));
});

test('round validator rejects target/distractor visual ambiguity and insufficient near misses', () => {
  available('validateRoundPlan');
  const round = generator.createFallbackRound(10, 37);
  const target = round.symbols.find(({ id }) => round.targetIds.includes(id));
  const distractor = round.symbols.find(({ id }) => !round.targetIds.includes(id));
  const otherColor = target.colorFamily === 'coral' ? 'teal' : 'coral';
  const ambiguous = round.symbols.map((symbol) => symbol.id === distractor.id
    ? { ...symbol, shape: target.shape, fill: target.fill, mark: target.mark, colorFamily: otherColor }
    : symbol);
  assert.ok(validator.validateRoundPlan({ ...round, symbols: ambiguous }).issues.includes('VISUAL_AMBIGUITY'));

  const targets = round.symbols.filter(({ id }) => round.targetIds.includes(id));
  const safeFalseTuples = (awaitlessUniverse()).filter((tuple) =>
    !rulesEvaluate(round.rule, tuple)
    && targets.every((candidate) => candidate.shape !== tuple.shape || candidate.fill !== tuple.fill || candidate.mark !== tuple.mark)
    && !targets.some((candidate) => rulesNearMiss(candidate, tuple, round.rule)));
  const replacements = [];
  for (const symbol of round.symbols.filter(({ id }) => !round.targetIds.includes(id))) {
    const tuple = safeFalseTuples.find((candidate) => !replacements.some((selected) =>
      selected.shape === candidate.shape && selected.fill === candidate.fill
      && selected.mark === candidate.mark && selected.colorFamily === candidate.colorFamily));
    assert.ok(tuple, 'fixture has enough non-near false distractor tuples');
    replacements.push(tuple);
  }
  let replacementIndex = 0;
  const noNearMisses = round.symbols.map((symbol) => {
    if (round.targetIds.includes(symbol.id)) return symbol;
    const tuple = replacements[replacementIndex++];
    return { id: symbol.id, ...tuple };
  });
  assert.ok(validator.validateRoundPlan({ ...round, symbols: noNearMisses }).issues.includes('NEAR_MISS_DEFICIENCY'));
});

const awaitlessUniverse = () => symbols.enumerateSymbolTuples();
const rulesEvaluate = (rule, tuple) => rules.evaluateRule(rule, tuple);
const rulesNearMiss = (target, tuple, rule) => rules.isNearMiss(target, tuple, rule);
