import { COLOR_FAMILIES, FILLS, MARKS, SHAPES } from './symbols.ts';
import type { AllExpression, RuleAtom, RuleExpression, RuleInstance, SymbolAttribute, SymbolData } from './types.ts';
import { drawInt, type Uint32Source } from './rng.ts';

type AtomSpec = Readonly<{ attribute: SymbolAttribute; operator?: 'eq' | 'not-eq'; exclude?: readonly string[] }>;
type TemplateSpec = Readonly<{
  id: string;
  tier: number;
  kind: 'all' | 'or';
  groups: readonly (readonly AtomSpec[])[];
}>;

const atom = (attribute: SymbolAttribute, operator: 'eq' | 'not-eq' = 'eq', exclude: readonly string[] = []) =>
  Object.freeze({ attribute, operator, exclude: Object.freeze([...exclude]) });
const group = (...atoms: AtomSpec[]) => Object.freeze(atoms);

export const RULE_TEMPLATES: readonly TemplateSpec[] = Object.freeze([
  { id: 'T1_SHAPE', tier: 1, kind: 'all', groups: [group(atom('shape'))] },
  { id: 'T1_FILL', tier: 1, kind: 'all', groups: [group(atom('fill'))] },
  { id: 'T1_MARK', tier: 1, kind: 'all', groups: [group(atom('mark'))] },
  { id: 'T2_SHAPE_FILL', tier: 2, kind: 'all', groups: [group(atom('shape'), atom('fill'))] },
  { id: 'T2_SHAPE_MARK', tier: 2, kind: 'all', groups: [group(atom('shape'), atom('mark'))] },
  { id: 'T2_FILL_MARK', tier: 2, kind: 'all', groups: [group(atom('fill'), atom('mark'))] },
  { id: 'T3_NOT_SHAPE_AND_FILL', tier: 3, kind: 'all', groups: [group(atom('shape', 'not-eq'), atom('fill'))] },
  { id: 'T3_NOT_FILL_AND_MARK', tier: 3, kind: 'all', groups: [group(atom('fill', 'not-eq'), atom('mark'))] },
  { id: 'T3_NOT_MARK_AND_COLOR_AND_SHAPE', tier: 3, kind: 'all', groups: [group(atom('mark', 'not-eq', ['none']), atom('colorFamily'), atom('shape'))] },
  { id: 'T4_SHAPE_OR_FILL', tier: 4, kind: 'or', groups: [group(atom('shape')), group(atom('fill'))] },
  { id: 'T4_SHAPE_FILL_OR_MARK', tier: 4, kind: 'or', groups: [group(atom('shape'), atom('fill')), group(atom('mark'))] },
  { id: 'T4_COLOR_SHAPE_OR_FILL', tier: 4, kind: 'or', groups: [group(atom('colorFamily'), atom('shape')), group(atom('fill'))] },
  { id: 'T5_NOT_SHAPE_FILL_MARK', tier: 5, kind: 'all', groups: [group(atom('shape', 'not-eq'), atom('fill'), atom('mark'))] },
  { id: 'T5_NOT_FILL_SHAPE_COLOR', tier: 5, kind: 'all', groups: [group(atom('fill', 'not-eq'), atom('shape'), atom('colorFamily'))] },
  { id: 'T5_OR_SHAPE_FILL_MARK', tier: 5, kind: 'or', groups: [group(atom('shape'), atom('fill')), group(atom('mark'))] },
  { id: 'T5_OR_COLOR_SHAPE_FILL', tier: 5, kind: 'or', groups: [group(atom('colorFamily'), atom('shape')), group(atom('fill'))] },
  { id: 'T5_OR_MARK_FILL_SHAPE', tier: 5, kind: 'or', groups: [group(atom('mark'), atom('fill')), group(atom('shape'))] },
].map((template) => Object.freeze({ ...template, groups: Object.freeze(template.groups) })));

export const RULE_TEMPLATE_IDS = Object.freeze(RULE_TEMPLATES.map(({ id }) => id));

function domainFor(attribute: SymbolAttribute): readonly string[] {
  if (attribute === 'shape') return SHAPES;
  if (attribute === 'fill') return FILLS;
  if (attribute === 'mark') return MARKS;
  return COLOR_FAMILIES;
}

function createAtom(spec: AtomSpec, nextUint32: Uint32Source): RuleAtom {
  const domain = domainFor(spec.attribute).filter((value) => !spec.exclude?.includes(value));
  const value = domain[drawInt(domain.length, nextUint32)]!;
  return Object.freeze({ attribute: spec.attribute, operator: spec.operator ?? 'eq', value }) as RuleAtom;
}

export function createRuleFromTemplate(templateId: string, nextUint32: Uint32Source): RuleInstance {
  const template = RULE_TEMPLATES.find(({ id }) => id === templateId);
  if (!template) throw new RangeError(`unsupported rule template: ${templateId}`);
  const groups = template.groups.map((specs) => Object.freeze(specs.map((spec) => createAtom(spec, nextUint32))));
  const expression: RuleExpression = template.kind === 'all'
    ? Object.freeze({ kind: 'all', atoms: groups[0]! })
    : Object.freeze({
      kind: 'or',
      branches: Object.freeze(groups.map((atoms) => Object.freeze({ kind: 'all' as const, atoms }))),
    });
  return Object.freeze({
    tier: template.tier,
    templateId,
    textTemplateId: templateId,
    evaluatorTemplateId: templateId,
    expression,
    text: renderRuleText(expression),
  });
}

export function createRuleForTier(tier: number, nextUint32: Uint32Source): RuleInstance {
  const templates = RULE_TEMPLATES.filter((template) => template.tier === tier);
  if (!templates.length) throw new RangeError('tier must be an integer from 1 through 5');
  return createRuleFromTemplate(templates[drawInt(templates.length, nextUint32)]!.id, nextUint32);
}

function renderAtom(atomValue: RuleAtom): string {
  const { attribute, operator, value } = atomValue;
  const positive = attribute === 'shape'
    ? `is a ${value}`
    : attribute === 'fill'
      ? `is ${value}`
      : attribute === 'mark'
        ? value === 'none' ? 'has no mark' : `has a ${value} mark`
        : `is in the ${value} family`;
  if (operator === 'eq') return positive;
  if (attribute === 'shape') return `is not a ${value}`;
  if (attribute === 'fill') return `is not ${value}`;
  if (attribute === 'mark') return `does not have a ${value} mark`;
  return `is not in the ${value} family`;
}

function renderBranch(branch: AllExpression): string {
  return branch.atoms.map(renderAtom).join(' and ');
}

export function renderRuleText(expression: RuleExpression): string {
  const condition = expression.kind === 'all'
    ? renderBranch(expression)
    : `matches either “${renderBranch(expression.branches[0]!)}” or “${renderBranch(expression.branches[1]!)}”`;
  return `Find every symbol that ${condition}.`;
}

export function evaluateBranch(branch: AllExpression, symbol: SymbolData | Record<string, unknown>): boolean {
  return branch.atoms.every(({ attribute, operator, value }) => {
    const matches = symbol[attribute] === value;
    return operator === 'eq' ? matches : !matches;
  });
}

export function evaluateRule(rule: Pick<RuleInstance, 'expression'>, symbol: SymbolData | Record<string, unknown>): boolean {
  return rule.expression.kind === 'all'
    ? evaluateBranch(rule.expression, symbol)
    : rule.expression.branches.some((branch) => evaluateBranch(branch, symbol));
}

export function isNearMiss(target: SymbolData | Record<string, unknown>, candidate: SymbolData | Record<string, unknown>, rule: Pick<RuleInstance, 'expression'>): boolean {
  if (!evaluateRule(rule, target) || evaluateRule(rule, candidate)) return false;
  const atoms = rule.expression.kind === 'all'
    ? rule.expression.atoms
    : rule.expression.branches.flatMap((branch) => branch.atoms);
  const referenced = [...new Set(atoms.map(({ attribute }) => attribute))];
  const changed = referenced.filter((attribute) => target[attribute] !== candidate[attribute]);
  return changed.length === 1 && changed[0] !== 'colorFamily'
    && ['shape', 'fill', 'mark'].includes(changed[0]!);
}
