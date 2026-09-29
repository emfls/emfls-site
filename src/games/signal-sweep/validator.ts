import { MIN_DISTRACTORS, MAX_TUPLE_OCCURRENCES, ROUND_TIERS, tierForRound } from './constants.ts';
import { evaluateRule, isNearMiss, RULE_TEMPLATES, renderRuleText } from './rules.ts';
import { canonicalSymbolTuple, enumerateSymbolTuples, isValidSymbolAttributes } from './symbols.ts';
import type { RoundPlan, RuleAtom, RuleExpression, RuleInstance, SymbolData } from './types.ts';

const validOperators = new Set(['eq', 'not-eq']);

function expressionGroups(expression: any): (RuleAtom[] | null)[] | null {
  if (expression?.kind === 'all') return Array.isArray(expression.atoms) ? [expression.atoms] : null;
  if (expression?.kind === 'or' && Array.isArray(expression.branches)) {
    return expression.branches.map((branch: any) => Array.isArray(branch?.atoms) ? branch.atoms : null);
  }
  return null;
}

export function validateRule(rule: RuleInstance | Record<string, any>, expectedTier?: number): { valid: boolean; issues: string[] } {
  const issues = new Set<string>();
  const expression = rule?.expression as RuleExpression | undefined;
  const template = RULE_TEMPLATES.find(({ id }) => id === rule?.templateId);
  const groups = expressionGroups(expression);
  const safeGroups = groups?.filter((group): group is RuleAtom[] => Array.isArray(group)) ?? [];
  const atoms = safeGroups.flat();

  if (!template || rule?.textTemplateId !== rule?.templateId || rule?.evaluatorTemplateId !== rule?.templateId) {
    issues.add('TEMPLATE_EVALUATOR_MISMATCH');
  }
  if (expectedTier !== undefined && rule?.tier !== expectedTier) issues.add('INVALID_TIER');
  if (!expression || !groups || groups.some((group) => !Array.isArray(group))
    || !['all', 'or'].includes(expression.kind)) issues.add('INVALID_RULE_GRAMMAR');

  if (expression && groups && !groups.some((group) => !Array.isArray(group))) {
    if (atoms.length < 1 || atoms.length > 3 || safeGroups.some((group) => !group.length)) issues.add('INVALID_RULE_GRAMMAR');
    for (const item of atoms) {
      if (!item || !['shape', 'fill', 'mark', 'colorFamily'].includes(item.attribute) || !validOperators.has(item.operator)) {
        issues.add('INVALID_RULE_GRAMMAR');
        continue;
      }
      const attributeValues = {
        shape: item.attribute === 'shape' ? item.value : 'circle',
        fill: item.attribute === 'fill' ? item.value : 'solid',
        mark: item.attribute === 'mark' ? item.value : 'none',
        colorFamily: item.attribute === 'colorFamily' ? item.value : 'coral',
      };
      if (!isValidSymbolAttributes(attributeValues)
        || (item.operator === 'not-eq' && item.attribute === 'mark' && item.value === 'none')) {
        issues.add('INVALID_RULE_GRAMMAR');
      }
    }

    if (expression.kind === 'or') {
      if (safeGroups.length !== 2) issues.add('INVALID_RULE_GRAMMAR');
      if (safeGroups.length === 2) {
        const universe = enumerateSymbolTuples();
        const evaluateGroup = (group: RuleAtom[], symbol: (typeof universe)[number]): boolean =>
          group.every(({ attribute, operator, value }) => (symbol[attribute] === value) === (operator === 'eq'));
        if (!universe.some((symbol) => evaluateGroup(safeGroups[0]!, symbol) !== evaluateGroup(safeGroups[1]!, symbol))) {
          issues.add('IDENTICAL_OR_BRANCHES');
        }
      }
    } else if (safeGroups.length !== 1) {
      issues.add('INVALID_RULE_GRAMMAR');
    }

    const hasColor = atoms.some(({ attribute }) => attribute === 'colorFamily');
    const hasNonColor = atoms.some(({ attribute }) => attribute !== 'colorFamily');
    if ((hasColor && !hasNonColor) || safeGroups.some((group) =>
      group.some(({ attribute }) => attribute === 'colorFamily')
      && !group.some(({ attribute }) => attribute !== 'colorFamily'))) issues.add('COLOR_ONLY_RULE');

    if (template) {
      const templateShapeMatches = template.kind === expression.kind
        && template.groups.length === safeGroups.length
        && template.groups.every((specs, groupIndex) => specs.length === safeGroups[groupIndex]?.length
          && specs.every((spec, atomIndex) => {
            const actual = safeGroups[groupIndex]?.[atomIndex];
            return actual?.attribute === spec.attribute && actual.operator === (spec.operator ?? 'eq');
          }));
      if (!templateShapeMatches) issues.add('TEMPLATE_EXPRESSION_MISMATCH');
    }
    try {
      if (rule?.text !== renderRuleText(expression)) issues.add('RULE_TEXT_MISMATCH');
    } catch {
      issues.add('RULE_TEXT_MISMATCH');
    }
    if (template && template.tier !== rule?.tier) issues.add('INVALID_TIER');
  }

  return { valid: issues.size === 0, issues: [...issues] };
}

export function validateRoundPlan(round: RoundPlan | Record<string, any>): { valid: boolean; issues: string[] } {
  const issues = new Set<string>();
  const roundNumber = round?.roundNumber;
  let tierSpec: (typeof ROUND_TIERS)[number] | undefined;
  try {
    tierSpec = tierForRound(roundNumber);
  } catch {
    issues.add('INVALID_ROUND_NUMBER');
  }
  const symbols: any[] = Array.isArray(round?.symbols) ? round.symbols : [];
  if (!tierSpec || round?.tier !== tierSpec.tier || round?.boardSize !== tierSpec.boardSize
    || symbols.length !== tierSpec.boardSize) issues.add('INVALID_BOARD_SIZE');

  const ruleResult = validateRule(round?.rule ?? {}, tierSpec?.tier);
  for (const issue of ruleResult.issues) issues.add(issue);
  const stableId = /^ss-s[0-9a-f]{8}-r(?:0[1-9]|1[0-5])-a(?:0[1-9]|[12][0-9]|30)-(?:t|d)\d{2}$/;
  if (symbols.some((symbol) => typeof symbol?.id !== 'string' || !stableId.test(symbol.id))) issues.add('INVALID_SYMBOL_ID');
  if (symbols.some((symbol) => !isValidSymbolAttributes(symbol))) issues.add('INVALID_SYMBOL');
  const ids = symbols.map((symbol) => symbol?.id);
  if (new Set(ids).size !== ids.length) issues.add('INVALID_SYMBOL_ID');

  const targetIds: unknown[] = Array.isArray(round?.targetIds) ? round.targetIds : [];
  if (new Set(targetIds).size !== targetIds.length || targetIds.some((id) => typeof id !== 'string' || !ids.includes(id))) {
    issues.add('INVALID_TARGET_ID');
  }
  const minTargets = tierSpec?.minTargets ?? 1;
  const maxTargets = tierSpec?.maxTargets ?? 0;
  if (targetIds.length < minTargets || targetIds.length > maxTargets) issues.add('INVALID_TARGET_COUNT');
  if (symbols.length - targetIds.length < MIN_DISTRACTORS) issues.add('INVALID_DISTRACTOR_COUNT');
  if (symbols.length > 0 && targetIds.length === symbols.length) issues.add('ALL_TARGET_BOARD');

  const targetSet = new Set(targetIds);
  const rule = round?.rule;
  if (rule?.expression && ruleResult.valid && symbols.every(isValidSymbolAttributes)) {
    for (const symbol of symbols) {
      const matches = evaluateRule(rule, symbol);
      if (targetSet.has(symbol?.id) !== matches) issues.add('TARGET_RULE_MISMATCH');
    }
    const targets = symbols.filter((symbol) => targetSet.has(symbol?.id));
    const distractors = symbols.filter((symbol) => !targetSet.has(symbol?.id));
    if (targets.some((target) => distractors.some((distractor) =>
      target.shape === distractor.shape && target.fill === distractor.fill && target.mark === distractor.mark))) {
      issues.add('VISUAL_AMBIGUITY');
    }
    const tupleCounts = new Map<string, number>();
    for (const symbol of symbols) {
      const tuple = canonicalSymbolTuple(symbol);
      tupleCounts.set(tuple, (tupleCounts.get(tuple) ?? 0) + 1);
    }
    if ([...tupleCounts.values()].some((count) => count > MAX_TUPLE_OCCURRENCES)) issues.add('TUPLE_LIMIT_EXCEEDED');
    const nearMissCount = distractors.filter((candidate) => targets.some((target) => isNearMiss(target, candidate, rule))).length;
    if (nearMissCount < Math.ceil(distractors.length / 2)) issues.add('NEAR_MISS_DEFICIENCY');
  }

  return { valid: issues.size === 0, issues: [...issues] };
}
