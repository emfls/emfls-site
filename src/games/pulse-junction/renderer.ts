import { DPR_CAP, PULSE_END_RADIUS } from './types';

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
  let logicalWidth = 0;
  let logicalHeight = 0;
  let effectiveDpr = 1;
  const syncSize = () => {
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || canvas.clientWidth || canvas.width;
    const height = rect.height || canvas.clientHeight || canvas.height;
    if (!width || !height) return;
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), DPR_CAP);
    if (width === logicalWidth && height === logicalHeight && dpr === effectiveDpr) return;
    logicalWidth = width;
    logicalHeight = height;
    effectiveDpr = dpr;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const radiusPixels = (normalized: number) => normalized * Math.min(logicalWidth, logicalHeight) * 0.42;
  const drawRing = (radius: number, color: string, width: number, dashed = false) => {
    context.beginPath();
    context.setLineDash(dashed ? [10, 8] : []);
    context.lineWidth = width;
    context.strokeStyle = color;
    context.arc(logicalWidth / 2, logicalHeight / 2, radiusPixels(radius), 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
  };
  const clear = () => {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(effectiveDpr, 0, 0, effectiveDpr, 0, 0);
  };
  const render = ({ pulseRadius, targetRadius, decoyRadii }: RenderFrame) => {
    syncSize();
    if (!logicalWidth || !logicalHeight) return;
    clear();
    context.fillStyle = colors.border;
    context.fillRect(0, 0, logicalWidth, logicalHeight);
    context.clearRect(1, 1, Math.max(0, logicalWidth - 2), Math.max(0, logicalHeight - 2));
    decoyRadii.forEach((radius) => drawRing(radius, colors.secondary, 2.5, true));
    drawRing(targetRadius, colors.primary, 6);
    context.fillStyle = colors.primary;
    context.fillRect(logicalWidth / 2 - 2, logicalHeight / 2 - radiusPixels(targetRadius) - 7, 4, 14);
    drawRing(Math.min(PULSE_END_RADIUS, pulseRadius), colors.text, 2.5);
  };
  syncSize();
  const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(syncSize);
  resizeObserver?.observe(canvas);
  window.addEventListener('resize', syncSize);
  window.addEventListener('orientationchange', syncSize);
  return { render, clear, destroy: () => { resizeObserver?.disconnect(); window.removeEventListener('resize', syncSize); window.removeEventListener('orientationchange', syncSize); } };
};
