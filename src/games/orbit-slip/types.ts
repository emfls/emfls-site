export type GameState = 'IDLE' | 'COUNTDOWN' | 'ACTIVE' | 'PAUSED' | 'HIT_FEEDBACK' | 'RESULT';

export type CorridorClass = 'INNER' | 'CENTER' | 'OUTER';

export interface GateTemplate {
  readonly id: number;
  readonly safeRMin: number;
  readonly safeRMax: number;
  readonly corridorClass: CorridorClass;
}

export interface SafeCorridor {
  readonly safeRMin: number;
  readonly safeRMax: number;
  readonly usableRMin: number;
  readonly usableRMax: number;
}

export interface ObstacleArc {
  readonly id: string;
  readonly angleStart: number;
  readonly angleEnd: number;
  readonly rMin: number;
  readonly rMax: number;
}

export interface Gate extends SafeCorridor {
  readonly id: number;
  readonly angleStart: number;
  readonly angleEnd: number;
  readonly obstacles: readonly ObstacleArc[];
  readonly passed: boolean;
  readonly templateId: number;
  readonly corridorClass: CorridorClass;
  readonly requiredRadialDistance: number;
}

export interface GateGenerationContext {
  readonly progressAngle: number;
  readonly activeMs: number;
  readonly gates: readonly Gate[];
  readonly history: readonly Gate[];
  readonly nextGateId: number;
}

export type RandomSource = () => number;

export interface GateGenerationResult {
  readonly gate: Gate;
  readonly attempts: number;
  readonly usedFallback: boolean;
  readonly rejections: readonly string[];
}
