export type OrbitSlipInputOptions = Readonly<{
  inputContext?: HTMLElement;
  isActive: () => boolean;
  onRadialDelta: (normalizedDelta: number) => void;
}>;

export type OrbitSlipInput = Readonly<{
  getKeyboardIntent: () => -1 | 0 | 1;
  clearKeys: () => void;
  releasePointer: () => void;
  destroy: () => void;
}>;

const normalizeKey = (key: string): string => key.length === 1 ? key.toLowerCase() : key;
const radialKeys = new Set(['ArrowUp', 'w', 'ArrowDown', 's']);

export const createOrbitSlipInput = (canvas: HTMLCanvasElement, options: OrbitSlipInputOptions): OrbitSlipInput => {
  const context = options.inputContext ?? canvas;
  const pressed = new Set<string>();
  let pointerId: number | undefined;
  let previousDistance: number | undefined;
  let destroyed = false;

  const getDistance = (event: PointerEvent): { distance: number; radius: number } | undefined => {
    const rect = canvas.getBoundingClientRect();
    const radius = Math.min(rect.width, rect.height) / 2;
    if (!Number.isFinite(radius) || radius <= 0 || ![rect.left, rect.top, rect.width, rect.height, event.clientX, event.clientY].every(Number.isFinite)) return undefined;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return { distance: Math.hypot(event.clientX - centerX, event.clientY - centerY), radius };
  };

  const releasePointer = (): void => {
    const ownedId = pointerId;
    pointerId = undefined;
    previousDistance = undefined;
    if (ownedId === undefined) return;
    try {
      if (canvas.hasPointerCapture(ownedId)) canvas.releasePointerCapture(ownedId);
    } catch {
      // Pointer capture may already have been released by the browser.
    }
  };

  const onPointerDown = (event: PointerEvent): void => {
    if (destroyed || !options.isActive() || pointerId !== undefined || !event.isPrimary || event.button !== 0) return;
    const position = getDistance(event);
    if (!position) return;
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      return;
    }
    pointerId = event.pointerId;
    previousDistance = position.distance;
    event.preventDefault();
  };

  const onPointerMove = (event: PointerEvent): void => {
    if (destroyed || !options.isActive() || pointerId !== event.pointerId || previousDistance === undefined) return;
    const position = getDistance(event);
    if (!position) return;
    const delta = (position.distance - previousDistance) / position.radius;
    previousDistance = position.distance;
    if (delta !== 0) options.onRadialDelta(delta);
    event.preventDefault();
  };

  const onPointerEnd = (event: PointerEvent): void => {
    if (pointerId !== event.pointerId) return;
    releasePointer();
  };

  const onLostPointerCapture = (event: PointerEvent): void => {
    if (pointerId !== event.pointerId) return;
    pointerId = undefined;
    previousDistance = undefined;
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (destroyed || event.target !== canvas || !options.isActive()) return;
    const key = normalizeKey(event.key);
    if (!radialKeys.has(key) || event.repeat) return;
    pressed.add(key);
    event.preventDefault();
  };

  const onKeyUp = (event: KeyboardEvent): void => {
    if (event.target !== canvas) return;
    const key = normalizeKey(event.key);
    if (!radialKeys.has(key)) return;
    pressed.delete(key);
    event.preventDefault();
  };

  const clearKeys = (): void => pressed.clear();
  const onBlur = (): void => clearKeys();

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerEnd);
  canvas.addEventListener('pointercancel', onPointerEnd);
  canvas.addEventListener('lostpointercapture', onLostPointerCapture);
  canvas.addEventListener('keydown', onKeyDown);
  canvas.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('blur', onBlur);
  context.addEventListener('keydown', onKeyDown);
  context.addEventListener('keyup', onKeyUp);
  context.addEventListener('focusout', onBlur);

  return {
    getKeyboardIntent: () => {
      if (destroyed || !options.isActive()) return 0;
      const outward = pressed.has('ArrowUp') || pressed.has('w');
      const inward = pressed.has('ArrowDown') || pressed.has('s');
      return outward === inward ? 0 : outward ? 1 : -1;
    },
    clearKeys,
    releasePointer,
    destroy: () => {
      if (destroyed) return;
      destroyed = true;
      releasePointer();
      clearKeys();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerEnd);
      canvas.removeEventListener('pointercancel', onPointerEnd);
      canvas.removeEventListener('lostpointercapture', onLostPointerCapture);
      canvas.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('blur', onBlur);
      context.removeEventListener('keydown', onKeyDown);
      context.removeEventListener('keyup', onKeyUp);
      context.removeEventListener('focusout', onBlur);
    },
  };
};
