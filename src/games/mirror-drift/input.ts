import { clampDotCenterToBoard } from './geometry';
import { DOT_RADIUS } from './types';
import type { Vec2 } from './types';

export type DragMoveCandidate = {
  pointerId: number;
  desiredA: Vec2;
  timestamp: number;
};

type InputOptions = {
  canvas: HTMLCanvasElement;
  isEnabled: () => boolean;
  getPositionA: () => Vec2;
  onMove: (candidate: DragMoveCandidate) => void;
  onCancel: () => void;
};

export const clientToNormalized = (rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>, clientX: number, clientY: number): Vec2 => {
  const scale = Math.min(rect.width, rect.height) / 2;
  if (scale <= 0) return { x: 0, y: 0 };
  return {
    x: (clientX - (rect.left + rect.width / 2)) / scale,
    y: ((rect.top + rect.height / 2) - clientY) / scale,
  };
};

export const getAcquisitionRadius = (renderedRadiusCss: number): number => Math.max(22, renderedRadiusCss);

export const isWithinAcquisition = (point: Vec2, center: Vec2, radius: number): boolean => (
  (point.x - center.x) ** 2 + (point.y - center.y) ** 2 <= radius ** 2
);

export const createMirrorDriftInput = ({ canvas, isEnabled, getPositionA, onMove, onCancel }: InputOptions) => {
  let activePointerId: number | undefined;
  let pointerOffset: Vec2 | undefined;

  const getPointerPosition = (event: PointerEvent) => clientToNormalized(canvas.getBoundingClientRect(), event.clientX, event.clientY);

  const getAClientCenter = () => {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width, rect.height) / 2;
    const positionA = getPositionA();
    return { x: rect.left + rect.width / 2 + positionA.x * scale, y: rect.top + rect.height / 2 - positionA.y * scale, scale };
  };

  const releaseCapture = (pointerId: number) => {
    try { if (canvas.hasPointerCapture(pointerId)) canvas.releasePointerCapture(pointerId); } catch { /* Browser may reject a stale capture. */ }
  };

  const clearPointer = (pointerId: number) => {
    activePointerId = undefined;
    pointerOffset = undefined;
    releaseCapture(pointerId);
  };

  const handlePointerDown = (event: PointerEvent) => {
    if (!isEnabled() || activePointerId !== undefined || !event.isPrimary || event.button !== 0) return;
    const position = getPointerPosition(event);
    const center = getAClientCenter();
    const rect = canvas.getBoundingClientRect();
    const pointerCenter = { x: event.clientX, y: event.clientY };
    const centerDistance = Math.hypot(pointerCenter.x - center.x, pointerCenter.y - center.y);
    const acquisitionRadius = getAcquisitionRadius(DOT_RADIUS * center.scale);
    if (centerDistance > acquisitionRadius || event.clientX < rect.left - acquisitionRadius || event.clientX > rect.right + acquisitionRadius || event.clientY < rect.top - acquisitionRadius || event.clientY > rect.bottom + acquisitionRadius) return;
    activePointerId = event.pointerId;
    const currentA = getPositionA();
    pointerOffset = { x: currentA.x - position.x, y: currentA.y - position.y };
    try { canvas.setPointerCapture(event.pointerId); } catch { clearPointer(event.pointerId); return; }
    event.preventDefault();
  };

  const handlePointerMove = (event: PointerEvent) => {
    if (!isEnabled() || activePointerId !== event.pointerId || !pointerOffset) return;
    const pointerPosition = getPointerPosition(event);
    onMove({ pointerId: event.pointerId, desiredA: clampDotCenterToBoard({ x: pointerPosition.x + pointerOffset.x, y: pointerPosition.y + pointerOffset.y }), timestamp: event.timeStamp });
    event.preventDefault();
  };

  const handlePointerUp = (event: PointerEvent) => {
    if (activePointerId !== event.pointerId) return;
    clearPointer(event.pointerId);
    event.preventDefault();
  };

  const handlePointerCancel = (event: PointerEvent) => {
    if (activePointerId !== event.pointerId) return;
    clearPointer(event.pointerId);
    onCancel();
  };

  const handleLostPointerCapture = (event: PointerEvent) => {
    if (activePointerId !== event.pointerId) return;
    clearPointer(event.pointerId);
    onCancel();
  };

  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointercancel', handlePointerCancel);
  canvas.addEventListener('lostpointercapture', handleLostPointerCapture);

  return {
    isDragging: () => activePointerId !== undefined,
    cancelPointer: () => { if (activePointerId !== undefined) clearPointer(activePointerId); },
    destroy: () => {
      if (activePointerId !== undefined) clearPointer(activePointerId);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerCancel);
      canvas.removeEventListener('lostpointercapture', handleLostPointerCapture);
    },
  };
};
