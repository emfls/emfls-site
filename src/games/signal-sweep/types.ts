export type Shape = 'circle' | 'triangle' | 'square' | 'diamond';
export type Fill = 'solid' | 'striped' | 'hollow';
export type Mark = 'none' | 'dot' | 'line' | 'cross';
export type ColorFamily = 'coral' | 'teal' | 'violet' | 'amber';
export type SymbolAttribute = 'shape' | 'fill' | 'mark' | 'colorFamily';

export interface SymbolData {
  readonly id: string;
  readonly shape: Shape;
  readonly fill: Fill;
  readonly mark: Mark;
  readonly colorFamily: ColorFamily;
}

export interface RuleAtom {
  readonly attribute: SymbolAttribute;
  readonly operator: 'eq' | 'not-eq';
  readonly value: Shape | Fill | Mark | ColorFamily;
}

export interface AllExpression {
  readonly kind: 'all';
  readonly atoms: readonly RuleAtom[];
}

export interface OrExpression {
  readonly kind: 'or';
  readonly branches: readonly AllExpression[];
}

export type RuleExpression = AllExpression | OrExpression;

export interface RuleInstance {
  readonly tier: number;
  readonly templateId: string;
  readonly textTemplateId: string;
  readonly evaluatorTemplateId: string;
  readonly expression: RuleExpression;
  readonly text: string;
}

export interface GenerationDiagnostics {
  readonly nearMissCount: number;
  readonly fallbackSeed: number | null;
  readonly candidateAttempts: number;
  readonly usedFallback: boolean;
}

export interface RoundPlan {
  readonly roundNumber: number;
  readonly tier: number;
  readonly boardSize: number;
  readonly rule: RuleInstance;
  readonly symbols: readonly SymbolData[];
  readonly targetIds: readonly string[];
  readonly diagnostics: GenerationDiagnostics;
}

export interface SessionPlan {
  readonly seed: number;
  readonly generatorVersion: number;
  readonly rounds: readonly RoundPlan[];
}

export interface SymbolVisualDescriptor {
  readonly shape: Shape;
  readonly fill: Fill;
  readonly mark: Mark;
  readonly colorFamily: ColorFamily;
  readonly colorHex: string;
}
