import type { Direction } from './types';

const directionByKey: Readonly<Record<string, Direction>> = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
};

type InputOptions = {
  root: HTMLElement;
  directionButtons: NodeListOf<HTMLButtonElement>;
  isTurn: () => boolean;
  isDirectionEnabled: (direction: Direction) => boolean;
  onDirection: (direction: Direction) => void;
};

const isInteractiveTarget = (target: EventTarget | null, root: HTMLElement): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target.closest('[contenteditable="true"]')) return true;
  if (target.closest('input, textarea, select, option')) return true;

  const directionButton = target.closest<HTMLButtonElement>('[data-direction]');
  if (directionButton && root.contains(directionButton)) return false;
  return Boolean(target.closest('a, button, [role="button"]'));
};

const directionFromButton = (button: HTMLButtonElement): Direction | undefined => {
  const direction = button.dataset.direction;
  return direction === 'UP' || direction === 'DOWN' || direction === 'LEFT' || direction === 'RIGHT'
    ? direction
    : undefined;
};

export const createGravityPactInput = ({
  root,
  directionButtons,
  isTurn,
  isDirectionEnabled,
  onDirection,
}: InputOptions): (() => void) => {
  const buttonHandlers: Array<{ button: HTMLButtonElement; handler: () => void }> = [];

  directionButtons.forEach((button) => {
    const handler = () => {
      const direction = directionFromButton(button);
      if (!direction || button.disabled || !isTurn() || !isDirectionEnabled(direction)) return;
      onDirection(direction);
    };
    button.addEventListener('click', handler);
    buttonHandlers.push({ button, handler });
  });

  const handleKeyDown = (event: KeyboardEvent) => {
    const direction = directionByKey[event.key];
    if (!direction || event.repeat || isInteractiveTarget(event.target, root) || !isTurn()) return;
    event.preventDefault();
    if (!isDirectionEnabled(direction)) return;
    onDirection(direction);
  };

  document.addEventListener('keydown', handleKeyDown);

  return () => {
    buttonHandlers.forEach(({ button, handler }) => button.removeEventListener('click', handler));
    document.removeEventListener('keydown', handleKeyDown);
  };
};
