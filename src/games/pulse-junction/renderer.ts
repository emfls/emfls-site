import { PULSE_END_RADIUS } from './types';

type RenderFrame = { pulseRadius: number; targetRadius: number; decoyRadii: number[] };

export const createPulseJunctionRenderer = (canvas: HTMLCanvasElement, root: HTMLElement) => {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Pulse Junction canvas context is unavailable.');
  const styles = getComputedStyle(root);
  const colors = {
    primary: styles.getPropertyValue('--game-color-primary').trim(),
    secondary: styles.getPropertyValue('--game-color-secondary').trim(),
    text: styles.getPropertyValue('--game-color-text').trim(),
    border: styles.getPropertyValue('--game-color-border').trim(),
  };
  const radiusPixels = (normalized: number) => normalized * Math.min(canvas.width, canvas.height) * 0.42;
  const drawRing = (radius: number, color: string, width: number, dashed = false) => {
    context.beginPath();
    context.setLineDash(dashed ? [10, 8] : []);
    context.lineWidth = width;
    context.strokeStyle = color;
    context.arc(canvas.width / 2, canvas.height / 2, radiusPixels(radius), 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
  };
  const clear = () => context.clearRect(0, 0, canvas.width, canvas.height);
  const render = ({ pulseRadius, targetRadius, decoyRadii }: RenderFrame) => {
    clear();
    context.fillStyle = colors.border;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.clearRect(4, 4, canvas.width - 8, canvas.height - 8);
    decoyRadii.forEach((radius) => drawRing(radius, colors.secondary, 5, true));
    drawRing(targetRadius, colors.primary, 12);
    context.fillStyle = colors.primary;
    context.fillRect(canvas.width / 2 - 4, canvas.height / 2 - radiusPixels(targetRadius) - 14, 8, 28);
    drawRing(Math.min(PULSE_END_RADIUS, pulseRadius), colors.text, 5);
  };
  return { render, clear };
};
