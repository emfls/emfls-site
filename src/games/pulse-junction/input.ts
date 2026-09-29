export type GameplayInputSource = 'pointer' | 'keyboard';

export type GameplayInputCandidate = {
  source: GameplayInputSource;
  timestamp: number;
};

type PulseJunctionInputOptions = {
  canvas: HTMLCanvasElement;
  isEnabled: () => boolean;
  onInput: (candidate: GameplayInputCandidate) => void;
};

type PulseJunctionInput = {
  destroy: () => void;
  cancelPointer: () => void;
};

const interactiveSelector = 'button, a, input, select, textarea, summary, [contenteditable="true"], [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"]';

const normalizeTimestamp = (event: Event): number => {
  const timestamp = event.timeStamp;
  if (Number.isFinite(timestamp)) {
    const performanceTimeOrigin = typeof performance.timeOrigin === 'number' ? performance.timeOrigin : 0;
    if (performanceTimeOrigin > 0 && timestamp > performanceTimeOrigin / 2) return timestamp - performanceTimeOrigin;
    return timestamp;
  }
  return performance.now();
};

const isInteractiveTarget = (target: EventTarget | null): boolean => target instanceof Element && Boolean(target.closest(interactiveSelector));

export const createPulseJunctionInput = ({ canvas, isEnabled, onInput }: PulseJunctionInputOptions): PulseJunctionInput => {
  let activePointerId: number | undefined;

  const cancelPointer = () => { activePointerId = undefined; };

  const handlePointerDown = (event: PointerEvent) => {
    if (!isEnabled() || event.button !== 0 || activePointerId !== undefined) return;
    activePointerId = event.pointerId;
    event.preventDefault();
    onInput({ source: 'pointer', timestamp: normalizeTimestamp(event) });
  };
  const handlePointerUp = (event: PointerEvent) => { if (event.pointerId === activePointerId) cancelPointer(); };
  const handlePointerCancel = (event: PointerEvent) => { if (event.pointerId === activePointerId) cancelPointer(); };
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isEnabled() || event.repeat || (event.code !== 'Space' && event.key !== ' ')) return;
    if (isInteractiveTarget(event.target)) return;
    event.preventDefault();
    onInput({ source: 'keyboard', timestamp: normalizeTimestamp(event) });
  };
  const handleViewportChange = () => { cancelPointer(); };

  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointercancel', handlePointerCancel);
  window.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('pointercancel', handlePointerCancel);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', handleViewportChange);
  window.addEventListener('orientationchange', handleViewportChange);

  return {
    destroy: () => {
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerCancel);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
      cancelPointer();
    },
    cancelPointer,
  };
};
