/**
 * The status-bar strip colour comes from a stack of mounted ScreenStatusBar
 * entries (packages/mobile-ui/src/SystemBars.tsx), mirroring how RN's own
 * StatusBar merged `backgroundColor` / `translucent` before RN 0.88 removed
 * them. These pin the merge rules the restored screens rely on.
 */
import { describe, expect, it } from 'vitest';
import { resolveStatusBar } from '@tohfa/mobile-ui';

describe('resolveStatusBar (Android edge-to-edge status-bar strip)', () => {
  it('has no colour and is not translucent when no screen declared one', () => {
    expect(resolveStatusBar([])).toEqual({ backgroundColor: undefined, translucent: false });
  });

  it('uses the most recently mounted screen colour', () => {
    expect(
      resolveStatusBar([
        { backgroundColor: 'brand', translucent: undefined },
        { backgroundColor: 'page', translucent: undefined },
      ]),
    ).toEqual({ backgroundColor: 'page', translucent: false });
  });

  it('inherits a prop the newest entry leaves undefined', () => {
    expect(
      resolveStatusBar([
        { backgroundColor: 'brand', translucent: undefined },
        { backgroundColor: undefined, translucent: undefined },
      ]),
    ).toEqual({ backgroundColor: 'brand', translucent: false });
  });

  it('a full-bleed screen on top makes the strip translucent; a later opaque screen undoes it', () => {
    const fullBleed = { backgroundColor: undefined, translucent: true };
    expect(resolveStatusBar([fullBleed]).translucent).toBe(true);
    expect(
      resolveStatusBar([fullBleed, { backgroundColor: 'page', translucent: false }]).translucent,
    ).toBe(false);
  });
});
