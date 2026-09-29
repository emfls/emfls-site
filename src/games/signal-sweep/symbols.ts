import { COLORS } from './constants.ts';
import type { ColorFamily, Fill, Mark, Shape, SymbolData, SymbolVisualDescriptor } from './types.ts';

export const SHAPES = Object.freeze(['circle', 'triangle', 'square', 'diamond'] as const);
export const FILLS = Object.freeze(['solid', 'striped', 'hollow'] as const);
export const MARKS = Object.freeze(['none', 'dot', 'line', 'cross'] as const);
export const COLOR_FAMILIES = Object.freeze(['coral', 'teal', 'violet', 'amber'] as const);

export type SymbolAttributes = Omit<SymbolData, 'id'>;

const isOneOf = (value: unknown, choices: readonly string[]): boolean => choices.includes(String(value));

export function canonicalSymbolTuple(symbol: SymbolAttributes | SymbolData): string {
  return [symbol.shape, symbol.fill, symbol.mark, symbol.colorFamily].join('|');
}

export function enumerateSymbolTuples(): readonly SymbolAttributes[] {
  const tuples: SymbolAttributes[] = [];
  for (const shape of SHAPES) {
    for (const fill of FILLS) {
      for (const mark of MARKS) {
        for (const colorFamily of COLOR_FAMILIES) {
          tuples.push(Object.freeze({ shape, fill, mark, colorFamily }));
        }
      }
    }
  }
  return Object.freeze(tuples);
}

export function createSymbol(id: string, attributes: SymbolAttributes): SymbolData {
  if (typeof id !== 'string' || !id.trim()
    || !isOneOf(attributes?.shape, SHAPES)
    || !isOneOf(attributes?.fill, FILLS)
    || !isOneOf(attributes?.mark, MARKS)
    || !isOneOf(attributes?.colorFamily, COLOR_FAMILIES)) {
    throw new RangeError('symbol ID and all four supported attributes are required');
  }
  return Object.freeze({ id, ...attributes });
}

export function symbolVisualDescriptor(symbol: SymbolAttributes | SymbolData): SymbolVisualDescriptor {
  return Object.freeze({
    shape: symbol.shape,
    fill: symbol.fill,
    mark: symbol.mark,
    colorFamily: symbol.colorFamily,
    colorHex: COLORS[symbol.colorFamily].hex,
  });
}

export function symbolAccessibleName(symbol: SymbolAttributes | SymbolData): string {
  const color = COLORS[symbol.colorFamily].name;
  const mark = symbol.mark === 'none' ? '' : ` with a ${symbol.mark}`;
  return `${color} ${symbol.fill} ${symbol.shape}${mark}`;
}

export function isValidSymbolAttributes(value: unknown): value is SymbolAttributes {
  if (!value || typeof value !== 'object') return false;
  const symbol = value as Record<string, unknown>;
  return isOneOf(symbol.shape, SHAPES)
    && isOneOf(symbol.fill, FILLS)
    && isOneOf(symbol.mark, MARKS)
    && isOneOf(symbol.colorFamily, COLOR_FAMILIES);
}

export type { ColorFamily, Fill, Mark, Shape };
