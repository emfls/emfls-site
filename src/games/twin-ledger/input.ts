import type { PlacementSide } from './types.ts';

export type PlacementShortcutEvent = Readonly<Pick<
  KeyboardEvent,
  'key' | 'repeat' | 'isComposing' | 'ctrlKey' | 'altKey' | 'metaKey'
>>;

export const getPlacementSideForKey = (event: PlacementShortcutEvent): PlacementSide | null => {
  if (event.repeat || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return null;

  const key = event.key.toLowerCase();
  if (key === 'arrowleft' || key === 'a') return 'LEFT';
  if (key === 'arrowright' || key === 'd') return 'RIGHT';
  return null;
};
