import { reflectPoint } from './geometry';
import type { Obstacle, StageDefinition, Vec2 } from './types';

type RenderModel = { stage: StageDefinition; positionA: Vec2; holdProgress: number };

export const createMirrorDriftRenderer = (canvas: HTMLCanvasElement, root: HTMLElement) => {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Mirror Drift canvas context is unavailable.');
  const token = (name: string) => getComputedStyle(root).getPropertyValue(name).trim();
  const project = (point: Vec2) => {
    const scale = Math.min(canvas.width, canvas.height) / 2;
    return { x: canvas.width / 2 + point.x * scale, y: canvas.height / 2 - point.y * scale, scale };
  };
  const drawCircle = (center: Vec2, radius: number, fill: string, stroke: string, lineWidth = 2, dashed = false) => {
    const point = project(center);
    context.beginPath(); context.setLineDash(dashed ? [6, 5] : []); context.arc(point.x, point.y, radius * point.scale, 0, Math.PI * 2); context.fillStyle = fill; context.fill(); context.strokeStyle = stroke; context.lineWidth = lineWidth; context.stroke(); context.setLineDash([]);
  };
  const drawObstacle = (obstacle: Obstacle) => {
    if (obstacle.kind === 'circle') drawCircle(obstacle.center, obstacle.radius, token('--game-color-border'), token('--game-color-text-secondary'));
    else { const topLeft = project({ x: obstacle.minX, y: obstacle.maxY }); const bottomRight = project({ x: obstacle.maxX, y: obstacle.minY }); context.fillStyle = token('--game-color-border'); context.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y); }
  };
  const render = ({ stage, positionA, holdProgress }: RenderModel) => {
    context.clearRect(0, 0, canvas.width, canvas.height); context.fillStyle = token('--game-color-background'); context.fillRect(0, 0, canvas.width, canvas.height);
    const center = project({ x: 0, y: 0 }); context.strokeStyle = token('--game-color-border'); context.lineWidth = 1; context.beginPath(); context.arc(center.x, center.y, center.scale * 0.025, 0, Math.PI * 2); context.stroke();
    stage.obstacles.forEach(drawObstacle);
    const targetA = project(stage.targetA); const targetB = project(reflectPoint(stage.targetA)); const positionB = reflectPoint(positionA); const dotA = project(positionA); const dotB = project(positionB);
    context.strokeStyle = token('--game-color-secondary'); context.lineWidth = 2; context.globalAlpha = 0.7; context.beginPath(); context.moveTo(dotA.x, dotA.y); context.lineTo(dotB.x, dotB.y); context.stroke(); context.globalAlpha = 1;
    drawCircle(stage.targetA, 0.075, holdProgress > 0 ? token('--game-color-surface-elevated') : 'transparent', token('--game-color-primary'), 3);
    drawCircle(reflectPoint(stage.targetA), 0.075, 'transparent', token('--game-color-secondary'), 3, true);
    context.beginPath(); context.arc(dotA.x, dotA.y, dotA.scale * 0.035, 0, Math.PI * 2); context.fillStyle = token('--game-color-primary'); context.fill();
    context.beginPath(); context.arc(dotB.x, dotB.y, dotB.scale * 0.035, 0, Math.PI * 2); context.strokeStyle = token('--game-color-secondary'); context.lineWidth = 4; context.stroke();
  };
  const clear = () => context.clearRect(0, 0, canvas.width, canvas.height);
  return { render, clear, destroy: clear };
};
