export interface FieldBloomInputHandlers {
  onAction(action: string): void;
  onPuzzleSelect(puzzleId: string): void;
  onPieceSelect(pieceInstanceId: string): void;
  onCellActivate(row: number, col: number): void;
  onPreview(row: number, col: number): void;
  onClearPreview(): void;
}

type InputRoot = Pick<HTMLElement, 'addEventListener' | 'removeEventListener'>;

function closest(target: EventTarget | null, selector: string): HTMLElement | null {
  if (target === null || typeof target !== 'object' || !('closest' in target)) return null;
  const candidate = target as Element;
  return typeof candidate.closest === 'function' ? candidate.closest<HTMLElement>(selector) : null;
}

function readIntegerAttribute(element: HTMLElement, name: 'cellRow' | 'cellCol'): number | null {
  const rawValue = element.dataset[name];
  if (rawValue === undefined || !/^\d+$/.test(rawValue)) return null;
  const value = Number(rawValue);
  return Number.isSafeInteger(value) ? value : null;
}

export function bindFieldBloomInput(root: InputRoot, handlers: FieldBloomInputHandlers): () => void {
  const onClick = (event: Event): void => {
    const actionElement = closest(event.target, '[data-action]');
    const action = actionElement?.dataset.action;
    if (action) {
      handlers.onAction(action);
      return;
    }

    const puzzleElement = closest(event.target, '[data-puzzle-id]');
    const puzzleId = puzzleElement?.dataset.puzzleId;
    if (puzzleId) {
      handlers.onPuzzleSelect(puzzleId);
      return;
    }

    const pieceElement = closest(event.target, '[data-piece-id]');
    const pieceInstanceId = pieceElement?.dataset.pieceId;
    if (pieceInstanceId) {
      handlers.onPieceSelect(pieceInstanceId);
      return;
    }

    const cellElement = closest(event.target, '[data-cell-row][data-cell-col]');
    if (!cellElement) return;
    const row = readIntegerAttribute(cellElement, 'cellRow');
    const col = readIntegerAttribute(cellElement, 'cellCol');
    if (row !== null && col !== null) handlers.onCellActivate(row, col);
  };

  const onPointerOver = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
    const cellElement = closest(event.target, '[data-cell-row][data-cell-col]');
    if (!cellElement) return;
    const row = readIntegerAttribute(cellElement, 'cellRow');
    const col = readIntegerAttribute(cellElement, 'cellCol');
    if (row !== null && col !== null) handlers.onPreview(row, col);
  };

  const onPointerOut = (event: PointerEvent): void => {
    const cellElement = closest(event.target, '[data-cell-row][data-cell-col]');
    if (!cellElement) return;
    if (event.relatedTarget && cellElement.contains(event.relatedTarget as Node)) return;
    handlers.onClearPreview();
  };

  root.addEventListener('click', onClick);
  root.addEventListener('pointerover', onPointerOver);
  root.addEventListener('pointerout', onPointerOut);

  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('pointerover', onPointerOver);
    root.removeEventListener('pointerout', onPointerOut);
  };
}
