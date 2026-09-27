export const START_ANGLE = -Math.PI / 2;
export const TAU = Math.PI * 2;

export const MIN_RADIUS = 0.28;
export const MAX_RADIUS = 0.82;
export const START_RADIUS = 0.55;
export const PLAYER_SIZE = 0.025;
export const RADIUS_SENSITIVITY = 1;
export const MAX_RADIAL_SPEED = 0.7;

export const MAX_FRAME_DELTA_MS = 100;
export const MAX_SIM_STEP_MS = 16.667;
export const SAFETY_MARGIN = 0.03;
export const GENERATOR_MAX_ATTEMPTS = 20;
export const MAX_ANGULAR_PADDING = Math.asin(Math.min(1, PLAYER_SIZE / MIN_RADIUS));
export const LARGE_SHIFT_THRESHOLD = 0.16;

export const MIN_GATE_THICKNESS = 0.12;
export const MAX_GATE_THICKNESS = 0.22;
export const FIRST_GATE_SPACING = 1.1;
export const TARGET_GATE_LOOKAHEAD = 4;
export const MIN_UNPASSED_GATE_LOOKAHEAD = 2;
export const MAX_GATE_LOOKAHEAD = 7;
export const MAX_PATTERN_HISTORY = 3;
