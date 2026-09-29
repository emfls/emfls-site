import type { GlassBloomController } from './controller.ts';

const GUARDED_FOCUS_SELECTOR = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="link"]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

type InputDocument = Pick<Document, 'activeElement' | 'addEventListener' | 'removeEventListener'>;
type InputRoot = Pick<HTMLElement, 'addEventListener' | 'removeEventListener' | 'contains'>;

function hasGuardedFocus(target: EventTarget | null): boolean {
  if (!target) return false;
  const element = target as HTMLElement;
  return Boolean(element.isContentEditable || element.closest?.(GUARDED_FOCUS_SELECTOR));
}

export function bindGlassBloomInput(options: {
  root: InputRoot;
  documentRef: InputDocument;
  controller: GlassBloomController;
}): () => void {
  let bound = true;

  const onClick = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest?.('[data-action]') as HTMLButtonElement | null;
    if (!button || !options.root.contains(button) || button.disabled) return;

    switch (button.dataset.action) {
      case 'start': options.controller.start(); break;
      case 'grow': options.controller.grow(); break;
      case 'bank': options.controller.bank(); break;
      case 'pause': options.controller.pause(); break;
      case 'resume': options.controller.resume(); break;
      case 'play-again': options.controller.playAgain(); break;
    }
  };

  const onKeydown = (event: KeyboardEvent): void => {
    if (
      event.defaultPrevented
      || event.repeat
      || event.isComposing
      || event.keyCode === 229
      || event.ctrlKey
      || event.altKey
      || event.metaKey
      || event.shiftKey
    ) return;

    const focused = options.documentRef.activeElement ?? event.target;
    if (hasGuardedFocus(focused)) return;

    const accepted = event.key === ' ' || event.code === 'Space'
      ? options.controller.grow()
      : event.key === 'Enter'
        ? options.controller.bank()
        : false;
    if (accepted) event.preventDefault();
  };

  options.root.addEventListener('click', onClick);
  options.documentRef.addEventListener('keydown', onKeydown);

  return () => {
    if (!bound) return;
    bound = false;
    options.root.removeEventListener('click', onClick);
    options.documentRef.removeEventListener('keydown', onKeydown);
  };
}
