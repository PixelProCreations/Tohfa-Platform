import { useEffect, useRef, useState } from 'react';
import { createIconTooltipController, ICON_TOOLTIP_MS, type IconTooltipController } from './iconTooltip';

/**
 * How long a press must be held before the label shows, passed as the button's `delayLongPress`.
 * React Native's default is 500ms; that reads as "nothing happened" to someone pressing to ask what
 * a button does, while a deliberate tap is well under 300ms, so this sits just above a tap.
 */
export const ICON_TOOLTIP_LONG_PRESS_MS = 350;

/**
 * Press-and-hold labels for icon-only buttons, without a tooltip library (this app adds no UI
 * dependencies). Returns which button's label is showing plus the controller to drive it from a
 * Touchable's `onLongPress` / `onPressOut` / `onPress`. All timing lives in `iconTooltip.ts`.
 *
 * The controller is created once per mount and is stable, so handlers built from it do not change
 * identity between renders; its timer is cancelled on unmount.
 */
export function useIconTooltip(durationMs: number = ICON_TOOLTIP_MS): {
  visibleKey: string | null;
  tooltip: IconTooltipController;
} {
  const [visibleKey, setVisibleKey] = useState<string | null>(null);
  const controllerRef = useRef<IconTooltipController | null>(null);
  if (controllerRef.current === null) {
    controllerRef.current = createIconTooltipController(setVisibleKey, durationMs);
  }
  const tooltip = controllerRef.current;

  useEffect(() => () => tooltip.dispose(), [tooltip]);

  return { visibleKey, tooltip };
}
