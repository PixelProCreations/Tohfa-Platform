/**
 * The timing behind the press-and-hold labels on ZonesScreen's icon-only map buttons, kept free of
 * React (and of react-native) so it runs under this app's plain-Node vitest -- see
 * `useIconTooltip.ts` for the hook the screen actually uses.
 *
 * Behaviour: a long-press shows that button's label and keeps it up for as long as the finger stays
 * down; lifting the finger starts a short timer that hides it. One label at a time -- a long-press
 * on another button replaces it. This is the same restartable single-timer shape as the editor's
 * "outside the farm" notice (`useZoneBoundaryEditor`'s `handleRejectedPoint`), so the screen has
 * one auto-dismiss pattern rather than two.
 */

/** How long a label stays up after the finger lifts. Long enough to read a short phrase. */
export const ICON_TOOLTIP_MS = 2000;

export interface IconTooltipController {
  /** Long-press on the button identified by `key`: show its label, cancelling any pending hide. */
  show(key: string): void;
  /**
   * The finger lifted off `key`'s button. Starts the hide timer only when it is `key`'s label that
   * is showing -- every press-out calls this, including plain taps, which must schedule nothing.
   */
  release(key: string): void;
  /** Hide now (e.g. a button was tapped to act). Notifies only if something was showing. */
  hide(): void;
  /** Unmount: cancel any timer without notifying, so nothing sets state on an unmounted screen. */
  dispose(): void;
}

export function createIconTooltipController(
  onChange: (visibleKey: string | null) => void,
  durationMs: number = ICON_TOOLTIP_MS,
): IconTooltipController {
  let visibleKey: string | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function setVisible(next: string | null) {
    if (visibleKey === next) return;
    visibleKey = next;
    onChange(next);
  }

  return {
    show(key) {
      clearTimer();
      setVisible(key);
    },
    release(key) {
      if (visibleKey !== key) return;
      clearTimer();
      timer = setTimeout(() => {
        timer = null;
        setVisible(null);
      }, durationMs);
    },
    hide() {
      clearTimer();
      setVisible(null);
    },
    dispose() {
      clearTimer();
    },
  };
}
