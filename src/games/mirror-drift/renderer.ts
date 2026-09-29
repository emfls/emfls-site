import { reflectPoint } from './geometry';
import { DOT_RADIUS, DPR_CAP, TARGET_RADIUS } from './types';
import type { Obstacle, StageDefinition, Vec2 } from './types';

type RenderModel = {
  stage: StageDefinition;
  positionA: Vec2;
  holdProgress: number;
};

export const createMirrorDriftRenderer = (canvas: HTMLCanvasElement, root: HTMLElement) => {
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Mirror Drift canvas context is unavailable.');
  }

  let logicalWidth = 0;
  let logicalHeight = 0;
  let effectiveDpr = 1;
  let latestModel: RenderModel | undefined;

  const token = (name: string) => getComputedStyle(root).getPropertyValue(name).trim();

  const readSize = () => {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.clientWidth || logicalWidth || 640;
    const height = rect.height || canvas.clientHeight || logicalHeight || 640;
    const devicePixelRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;

    return {
      width,
      height,
      dpr: Math.min(Math.max(devicePixelRatio, 1), DPR_CAP),
    };
  };

  const syncSize = () => {
    const next = readSize();
    const backingWidth = Math.max(1, Math.round(next.width * next.dpr));
    const backingHeight = Math.max(1, Math.round(next.height * next.dpr));

    if (
      next.width === logicalWidth &&
      next.height === logicalHeight &&
      next.dpr === effectiveDpr &&
      canvas.width === backingWidth &&
      canvas.height === backingHeight
    ) {
      return false;
    }

    logicalWidth = next.width;
    logicalHeight = next.height;
    effectiveDpr = next.dpr;
    canvas.width = backingWidth;
    canvas.height = backingHeight;
    context.setTransform(effectiveDpr, 0, 0, effectiveDpr, 0, 0);
    return true;
  };

  const clear = () => {
    context.save();
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
    context.setTransform(effectiveDpr, 0, 0, effectiveDpr, 0, 0);
  };

  const project = (point: Vec2) => {
    const scale = Math.min(logicalWidth, logicalHeight) / 2;

    return {
      x: logicalWidth / 2 + point.x * scale,
      y: logicalHeight / 2 - point.y * scale,
      scale,
    };
  };

  const drawCircle = (
    center: Vec2,
    radius: number,
    fill: string,
    stroke: string,
    lineWidth = 2,
    dashed = false,
  ) => {
    const point = project(center);

    context.beginPath();
    context.setLineDash(dashed ? [6, 5] : []);
    context.arc(point.x, point.y, radius * point.scale, 0, Math.PI * 2);
    context.fillStyle = fill;
    context.fill();
    context.strokeStyle = stroke;
    context.lineWidth = lineWidth;
    context.stroke();
    context.setLineDash([]);
  };

  const drawProgressArc = (center: Vec2, progress: number) => {
    if (progress <= 0) {
      return;
    }

    const point = project(center);
    const clampedProgress = Math.min(progress, 1);

    context.beginPath();
    context.arc(
      point.x,
      point.y,
      (TARGET_RADIUS + 0.018) * point.scale,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * clampedProgress,
    );
    context.strokeStyle = token('--game-color-success');
    context.lineWidth = 4;
    context.lineCap = 'round';
    context.stroke();
    context.lineCap = 'butt';
  };

  const drawObstacle = (obstacle: Obstacle) => {
    if (obstacle.kind === 'circle') {
      drawCircle(obstacle.center, obstacle.radius, token('--game-color-border'), token('--game-color-text-secondary'));
      return;
    }

    const topLeft = project({ x: obstacle.minX, y: obstacle.maxY });
    const bottomRight = project({ x: obstacle.maxX, y: obstacle.minY });

    context.fillStyle = token('--game-color-border');
    context.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
  };

  const renderModel = ({ stage, positionA, holdProgress }: RenderModel) => {
    clear();
    context.save();
    context.fillStyle = token('--game-color-background');
    context.fillRect(0, 0, logicalWidth, logicalHeight);

    const center = project({ x: 0, y: 0 });
    context.strokeStyle = token('--game-color-border');
    context.lineWidth = 1;
    context.beginPath();
    context.arc(center.x, center.y, center.scale * 0.025, 0, Math.PI * 2);
    context.stroke();

    stage.obstacles.forEach(drawObstacle);

    const positionB = reflectPoint(positionA);
    const dotA = project(positionA);
    const dotB = project(positionB);

    context.strokeStyle = token('--game-color-secondary');
    context.lineWidth = 2;
    context.globalAlpha = 0.7;
    context.beginPath();
    context.moveTo(dotA.x, dotA.y);
    context.lineTo(dotB.x, dotB.y);
    context.stroke();
    context.globalAlpha = 1;

    drawCircle(
      stage.targetA,
      TARGET_RADIUS,
      holdProgress > 0 ? token('--game-color-surface-elevated') : 'transparent',
      token('--game-color-primary'),
      3,
    );
    drawCircle(reflectPoint(stage.targetA), TARGET_RADIUS, 'transparent', token('--game-color-secondary'), 3, true);
    drawProgressArc(stage.targetA, holdProgress);
    drawProgressArc(reflectPoint(stage.targetA), holdProgress);

    context.beginPath();
    context.arc(dotA.x, dotA.y, dotA.scale * DOT_RADIUS, 0, Math.PI * 2);
    context.fillStyle = token('--game-color-primary');
    context.fill();

    context.beginPath();
    context.arc(dotB.x, dotB.y, dotB.scale * DOT_RADIUS, 0, Math.PI * 2);
    context.strokeStyle = token('--game-color-secondary');
    context.lineWidth = 4;
    context.stroke();
    context.restore();
  };

  const render = (model: RenderModel) => {
    latestModel = model;
    syncSize();
    renderModel(model);
  };

  const syncAndRerender = () => {
    if (syncSize() && latestModel) {
      renderModel(latestModel);
    }
  };

  syncSize();

  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(syncAndRerender);
  resizeObserver?.observe(canvas);
  window.addEventListener('resize', syncAndRerender);
  window.addEventListener('orientationchange', syncAndRerender);

  return {
    render,
    clear,
    destroy: () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', syncAndRerender);
      window.removeEventListener('orientationchange', syncAndRerender);
      latestModel = undefined;
      clear();
    },
  };
};
