import { MAX_RADIUS, MIN_RADIUS, PLAYER_SIZE, START_ANGLE } from './constants.ts';
import type { Gate, ObstacleArc } from './types.ts';

export const DPR_CAP = 2;

export type OrbitSlipRenderFrame = Readonly<{
  progressAngle: number;
  radius: number;
  gates: readonly Pick<Gate, 'id' | 'passed' | 'obstacles'>[];
}>;

export type OrbitSlipRendererOptions = Readonly<{
  getDevicePixelRatio?: () => number;
  onResize?: () => void;
}>;

export type OrbitSlipRenderer = Readonly<{
  resize: () => boolean;
  render: (frame: OrbitSlipRenderFrame) => void;
  getSnapshot: () => Readonly<{ width: number; height: number; scale: number }>;
  destroy: () => void;
}>;

export const createOrbitSlipRenderer = (
  canvas: HTMLCanvasElement,
  options: OrbitSlipRendererOptions = {},
): OrbitSlipRenderer => {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Orbit Slip requires a 2D Canvas context.');
  const reducedMotion = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : undefined;

  let width = 0;
  let height = 0;
  let scale = 1;
  let hasInitialSize = false;
  let destroyed = false;

  const readScale = (): number => {
    const devicePixelRatio = options.getDevicePixelRatio?.()
      ?? (typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1);
    return Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? Math.min(devicePixelRatio, DPR_CAP) : 1;
  };

  const resize = (): boolean => {
    if (destroyed) return false;
    const rect = canvas.getBoundingClientRect();
    if (!Number.isFinite(rect.width) || !Number.isFinite(rect.height) || rect.width <= 0 || rect.height <= 0) return false;
    const nextWidth = rect.width;
    const nextHeight = rect.height;
    const nextScale = readScale();
    const changed = nextWidth !== width || nextHeight !== height || nextScale !== scale;
    if (!changed) return false;
    const previouslySized = hasInitialSize;
    width = nextWidth;
    height = nextHeight;
    scale = nextScale;
    const backingWidth = Math.round(width * scale);
    const backingHeight = Math.round(height * scale);
    if (canvas.width !== backingWidth) canvas.width = backingWidth;
    if (canvas.height !== backingHeight) canvas.height = backingHeight;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    hasInitialSize = true;
    if (previouslySized) options.onResize?.();
    return true;
  };

  const drawObstacle = (obstacle: ObstacleArc, centerX: number, centerY: number, gameRadius: number, opacity: number): void => {
    const start = START_ANGLE + obstacle.angleStart;
    const end = START_ANGLE + obstacle.angleEnd;
    const innerRadius = obstacle.rMin * gameRadius;
    const outerRadius = obstacle.rMax * gameRadius;
    context.save();
    context.globalAlpha = opacity;
    context.fillStyle = '#bd4350';
    context.strokeStyle = '#762b36';
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(centerX, centerY, outerRadius, start, end);
    context.arc(centerX, centerY, innerRadius, end, start, true);
    context.closePath();
    context.fill();
    context.stroke();

    // Repeated radial hatches make barriers legible without color alone.
    const hatchCount = Math.min(32, Math.max(1, Math.ceil((end - start) / 0.055)));
    context.beginPath();
    for (let index = 0; index <= hatchCount; index += 1) {
      const angle = start + ((end - start) * index) / hatchCount;
      context.moveTo(centerX + Math.cos(angle) * innerRadius, centerY + Math.sin(angle) * innerRadius);
      context.lineTo(centerX + Math.cos(angle) * outerRadius, centerY + Math.sin(angle) * outerRadius);
    }
    context.stroke();
    context.restore();
  };

  const render = (frame: OrbitSlipRenderFrame): void => {
    if (destroyed) return;
    resize();
    if (!hasInitialSize) return;
    const centerX = width / 2;
    const centerY = height / 2;
    const gameRadius = Math.min(width, height) / 2;
    context.clearRect(0, 0, width, height);
    context.save();
    context.strokeStyle = 'rgba(103, 137, 145, 0.32)';
    context.lineWidth = 1;
    context.beginPath();
    context.arc(centerX, centerY, MIN_RADIUS * gameRadius, 0, Math.PI * 2);
    context.arc(centerX, centerY, MAX_RADIUS * gameRadius, 0, Math.PI * 2);
    context.stroke();

    const gates = frame.gates.filter((gate) => !gate.passed).slice().sort((a, b) => a.id - b.id);
    gates.forEach((gate, index) => {
      const opacity = Math.max(0.32, 0.92 - index * 0.1);
      gate.obstacles.forEach((obstacle) => drawObstacle(obstacle, centerX, centerY, gameRadius, opacity));
    });

    const angle = START_ANGLE + frame.progressAngle;
    if (!reducedMotion?.matches) {
      const trailStart = angle - 0.07;
      context.strokeStyle = 'rgba(31, 111, 126, 0.42)';
      context.lineWidth = Math.max(2, gameRadius * 0.018);
      context.lineCap = 'round';
      context.beginPath();
      context.moveTo(centerX + Math.cos(trailStart) * frame.radius * gameRadius, centerY + Math.sin(trailStart) * frame.radius * gameRadius);
      context.lineTo(centerX + Math.cos(angle) * frame.radius * gameRadius, centerY + Math.sin(angle) * frame.radius * gameRadius);
      context.stroke();
    }
    context.fillStyle = '#125765';
    context.beginPath();
    context.arc(centerX + Math.cos(angle) * frame.radius * gameRadius, centerY + Math.sin(angle) * frame.radius * gameRadius, Math.max(3, PLAYER_SIZE * gameRadius), 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#345d65';
    context.beginPath();
    context.arc(centerX, centerY, Math.max(2, gameRadius * 0.018), 0, Math.PI * 2);
    context.fill();
    context.restore();
  };

  const onWindowResize = (): void => { resize(); };
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('orientationchange', onWindowResize);
  }
  const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(() => resize());
  observer?.observe(canvas);

  return {
    resize,
    render,
    getSnapshot: () => ({ width, height, scale }),
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      observer?.disconnect();
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', onWindowResize);
        window.removeEventListener('orientationchange', onWindowResize);
      }
    },
  };
};
