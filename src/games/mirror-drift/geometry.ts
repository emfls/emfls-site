import { BOARD_MAX, BOARD_MIN, DOT_RADIUS, TARGET_RADIUS } from './types';
import type { Obstacle, StageDefinition, Vec2 } from './types';

const EPSILON = 1e-9;
const TARGET_TOLERANCE = TARGET_RADIUS - DOT_RADIUS;

export type CollisionResult = {
  collided: boolean;
  point: 'A' | 'B' | null;
  obstacleIndex: number | null;
};

export type StageValidation = { valid: boolean; errors: string[] };

const isFiniteNumber = (value: number) => Number.isFinite(value);
const isFinitePoint = (point: Vec2) => isFiniteNumber(point.x) && isFiniteNumber(point.y);
const distanceSquared = (a: Vec2, b: Vec2) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;

export const reflectPoint = (point: Vec2): Vec2 => ({ x: -point.x, y: -point.y });

export const isDotCenterInsideBoard = (point: Vec2): boolean => (
  isFinitePoint(point)
  && point.x >= BOARD_MIN + DOT_RADIUS - EPSILON
  && point.x <= BOARD_MAX - DOT_RADIUS + EPSILON
  && point.y >= BOARD_MIN + DOT_RADIUS - EPSILON
  && point.y <= BOARD_MAX - DOT_RADIUS + EPSILON
);

export const clampDotCenterToBoard = (point: Vec2): Vec2 => ({
  x: Math.min(BOARD_MAX - DOT_RADIUS, Math.max(BOARD_MIN + DOT_RADIUS, point.x)),
  y: Math.min(BOARD_MAX - DOT_RADIUS, Math.max(BOARD_MIN + DOT_RADIUS, point.y)),
});

export const isTargetCenterInsideBoard = (point: Vec2): boolean => (
  isFinitePoint(point)
  && point.x >= BOARD_MIN + TARGET_RADIUS - EPSILON
  && point.x <= BOARD_MAX - TARGET_RADIUS + EPSILON
  && point.y >= BOARD_MIN + TARGET_RADIUS - EPSILON
  && point.y <= BOARD_MAX - TARGET_RADIUS + EPSILON
);

export const isDotInsideTarget = (dot: Vec2, target: Vec2): boolean => (
  isFinitePoint(dot) && isFinitePoint(target) && distanceSquared(dot, target) <= TARGET_TOLERANCE ** 2 + EPSILON
);

export const areBothDotsInsideTargets = (positionA: Vec2, targetA: Vec2): boolean => {
  const positionB = reflectPoint(positionA);
  const targetB = reflectPoint(targetA);
  return isDotInsideTarget(positionA, targetA) && isDotInsideTarget(positionB, targetB);
};

export const pointCollidesWithObstacle = (point: Vec2, obstacle: Obstacle): boolean => {
  if (obstacle.kind === 'circle') {
    return distanceSquared(point, obstacle.center) <= (obstacle.radius + DOT_RADIUS) ** 2 + EPSILON;
  }
  return point.x >= obstacle.minX - DOT_RADIUS - EPSILON
    && point.x <= obstacle.maxX + DOT_RADIUS + EPSILON
    && point.y >= obstacle.minY - DOT_RADIUS - EPSILON
    && point.y <= obstacle.maxY + DOT_RADIUS + EPSILON;
};

const segmentCircleCollision = (start: Vec2, end: Vec2, center: Vec2, radius: number): boolean => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared <= EPSILON) return distanceSquared(start, center) <= radius * radius + EPSILON;
  const projection = Math.min(1, Math.max(0, ((center.x - start.x) * dx + (center.y - start.y) * dy) / lengthSquared));
  const closest = { x: start.x + projection * dx, y: start.y + projection * dy };
  return distanceSquared(closest, center) <= radius * radius + EPSILON;
};

const segmentAabbCollision = (start: Vec2, end: Vec2, minX: number, maxX: number, minY: number, maxY: number): boolean => {
  if (start.x >= minX - EPSILON && start.x <= maxX + EPSILON && start.y >= minY - EPSILON && start.y <= maxY + EPSILON) return true;
  let enter = 0;
  let exit = 1;
  for (const [origin, delta, min, max] of [[start.x, end.x - start.x, minX, maxX], [start.y, end.y - start.y, minY, maxY]] as const) {
    if (Math.abs(delta) <= EPSILON) { if (origin < min - EPSILON || origin > max + EPSILON) return false; continue; }
    const first = (min - origin) / delta;
    const second = (max - origin) / delta;
    enter = Math.max(enter, Math.min(first, second));
    exit = Math.min(exit, Math.max(first, second));
    if (enter > exit + EPSILON) return false;
  }
  return enter <= exit + EPSILON && exit >= -EPSILON && enter <= 1 + EPSILON;
};

export const segmentCollidesWithObstacle = (start: Vec2, end: Vec2, obstacle: Obstacle): boolean => (
  obstacle.kind === 'circle'
    ? segmentCircleCollision(start, end, obstacle.center, obstacle.radius + DOT_RADIUS)
    : segmentAabbCollision(start, end, obstacle.minX - DOT_RADIUS, obstacle.maxX + DOT_RADIUS, obstacle.minY - DOT_RADIUS, obstacle.maxY + DOT_RADIUS)
);

export const checkMirroredMovementCollision = (previousA: Vec2, nextA: Vec2, obstacles: readonly Obstacle[]): CollisionResult => {
  const previousB = reflectPoint(previousA);
  const nextB = reflectPoint(nextA);
  for (let index = 0; index < obstacles.length; index += 1) {
    if (segmentCollidesWithObstacle(previousA, nextA, obstacles[index])) return { collided: true, point: 'A', obstacleIndex: index };
    if (segmentCollidesWithObstacle(previousB, nextB, obstacles[index])) return { collided: true, point: 'B', obstacleIndex: index };
  }
  return { collided: false, point: null, obstacleIndex: null };
};

export const validateStage = (stage: StageDefinition): StageValidation => {
  const errors: string[] = [];
  const label = `Stage ${stage.id}`;
  if (!Number.isInteger(stage.id)) errors.push('id must be an integer');
  if (!Number.isFinite(stage.timeLimitMs) || stage.timeLimitMs < 8000 || stage.timeLimitMs > 18000) errors.push('timeLimitMs must be between 8000 and 18000');
  if (!isFinitePoint(stage.startA) || !isDotCenterInsideBoard(stage.startA) || !isDotCenterInsideBoard(reflectPoint(stage.startA))) errors.push('startA or reflected startB is outside dot bounds');
  if (!isFinitePoint(stage.targetA) || !isTargetCenterInsideBoard(stage.targetA) || !isTargetCenterInsideBoard(reflectPoint(stage.targetA))) errors.push('targetA or reflected targetB is outside target bounds');
  if (areBothDotsInsideTargets(stage.startA, stage.targetA)) errors.push('start is already inside both targets');
  stage.obstacles.forEach((obstacle, index) => {
    if (obstacle.kind === 'circle') {
      if (!isFinitePoint(obstacle.center) || !Number.isFinite(obstacle.radius) || obstacle.radius <= 0) errors.push(`obstacle ${index} circle is malformed`);
      if (obstacle.center.x - obstacle.radius < BOARD_MIN - EPSILON || obstacle.center.x + obstacle.radius > BOARD_MAX + EPSILON || obstacle.center.y - obstacle.radius < BOARD_MIN - EPSILON || obstacle.center.y + obstacle.radius > BOARD_MAX + EPSILON) errors.push(`obstacle ${index} circle is outside board`);
    } else {
      if (![obstacle.minX, obstacle.maxX, obstacle.minY, obstacle.maxY].every(Number.isFinite) || obstacle.minX >= obstacle.maxX || obstacle.minY >= obstacle.maxY) errors.push(`obstacle ${index} bar is malformed`);
      if (obstacle.minX < BOARD_MIN || obstacle.maxX > BOARD_MAX || obstacle.minY < BOARD_MIN || obstacle.maxY > BOARD_MAX) errors.push(`obstacle ${index} bar is outside board`);
    }
  });
  if (pointCollidesWithObstacles(stage.startA, stage.obstacles) || pointCollidesWithObstacles(reflectPoint(stage.startA), stage.obstacles)) errors.push('start collides with an obstacle');
  if (pointCollidesWithObstacles(stage.targetA, stage.obstacles) || pointCollidesWithObstacles(reflectPoint(stage.targetA), stage.obstacles)) errors.push('target collides with an obstacle');
  if (stage.solutionPathA.length < 2 || stage.solutionPathA[0].x !== stage.startA.x || stage.solutionPathA[0].y !== stage.startA.y) errors.push('solutionPathA must start at startA');
  const last = stage.solutionPathA[stage.solutionPathA.length - 1];
  if (!last || last.x !== stage.targetA.x || last.y !== stage.targetA.y) errors.push('solutionPathA must end at targetA');
  stage.solutionPathA.forEach((point) => { if (!isDotCenterInsideBoard(point) || !isDotCenterInsideBoard(reflectPoint(point))) errors.push('solutionPathA leaves board bounds'); });
  for (let index = 1; index < stage.solutionPathA.length; index += 1) {
    if (checkMirroredMovementCollision(stage.solutionPathA[index - 1], stage.solutionPathA[index], stage.obstacles).collided) errors.push(`solutionPathA segment ${index - 1} collides`);
  }
  if (!areBothDotsInsideTargets(last, stage.targetA)) errors.push('solutionPathA final point misses targets');
  return { valid: errors.length === 0, errors: errors.map((error) => `${label}: ${error}`) };
};

export const pointCollidesWithObstacles = (point: Vec2, obstacles: readonly Obstacle[]): boolean => obstacles.some((obstacle) => pointCollidesWithObstacle(point, obstacle));

export const validateStageDefinitions = (stages: readonly StageDefinition[]): StageValidation => {
  const errors: string[] = [];
  if (stages.length !== 12) errors.push('Expected exactly 12 stages');
  const phases = ['LEARN', 'LEARN', 'SPLIT', 'SPLIT', 'CORRIDOR', 'CORRIDOR', 'OFFSET', 'OFFSET', 'PRECISION', 'PRECISION', 'FINAL', 'FINAL'];
  stages.forEach((stage, index) => {
    if (stage.id !== index + 1) errors.push(`Stage ${index + 1}: id/order mismatch`);
    if (stage.phase !== phases[index]) errors.push(`Stage ${stage.id}: phase mismatch`);
    errors.push(...validateStage(stage).errors);
  });
  return { valid: errors.length === 0, errors };
};

export const assertValidStageDefinitions = (stages: readonly StageDefinition[]): void => {
  const result = validateStageDefinitions(stages);
  if (!result.valid) throw new Error(`Mirror Drift stage validation failed: ${result.errors.join('; ')}`);
};
