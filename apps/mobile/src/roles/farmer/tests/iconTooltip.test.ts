import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createIconTooltipController } from '../screens/profile/iconTooltip';

describe('createIconTooltipController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(durationMs = 2000) {
    const seen: (string | null)[] = [];
    const controller = createIconTooltipController((key) => seen.push(key), durationMs);
    return { controller, seen };
  }

  it('shows the long-pressed tooltip and keeps it up while the finger is still down', () => {
    const { controller, seen } = setup();
    controller.show('zones-locate');
    expect(seen).toEqual(['zones-locate']);
    // Held well past the duration: the hide timer only starts on release.
    vi.advanceTimersByTime(10_000);
    expect(seen).toEqual(['zones-locate']);
  });

  it('hides the tooltip a fixed time after release', () => {
    const { controller, seen } = setup(2000);
    controller.show('zones-locate');
    controller.release('zones-locate');
    vi.advanceTimersByTime(1999);
    expect(seen).toEqual(['zones-locate']);
    vi.advanceTimersByTime(1);
    expect(seen).toEqual(['zones-locate', null]);
  });

  it('ignores the release of a button whose tooltip is not the one showing', () => {
    const { controller, seen } = setup();
    // A plain tap on any button calls release() too -- it must not schedule anything by itself.
    controller.release('zones-undo');
    vi.advanceTimersByTime(10_000);
    expect(seen).toEqual([]);

    controller.show('zones-locate');
    controller.release('zones-undo');
    vi.advanceTimersByTime(10_000);
    expect(seen).toEqual(['zones-locate']);
  });

  it('a new long-press replaces the visible tooltip and cancels its pending hide', () => {
    const { controller, seen } = setup(2000);
    controller.show('zones-locate');
    controller.release('zones-locate');
    vi.advanceTimersByTime(1000);
    controller.show('zones-fullscreen');
    // The old timer would have fired here; it must not hide the new tooltip.
    vi.advanceTimersByTime(5000);
    expect(seen).toEqual(['zones-locate', 'zones-fullscreen']);
  });

  it('hide() clears at once and cancels any pending timer', () => {
    const { controller, seen } = setup(2000);
    controller.show('zones-locate');
    controller.release('zones-locate');
    controller.hide();
    expect(seen).toEqual(['zones-locate', null]);
    vi.advanceTimersByTime(5000);
    expect(seen).toEqual(['zones-locate', null]);
  });

  it('hide() with nothing showing does not notify', () => {
    const { controller, seen } = setup();
    controller.hide();
    expect(seen).toEqual([]);
  });

  it('dispose() cancels a pending hide without notifying (the screen is unmounting)', () => {
    const { controller, seen } = setup(2000);
    controller.show('zones-locate');
    controller.release('zones-locate');
    controller.dispose();
    vi.advanceTimersByTime(5000);
    expect(seen).toEqual(['zones-locate']);
  });
});
