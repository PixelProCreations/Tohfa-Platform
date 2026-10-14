/**
 * Android hardware back for the warehouse area flows (W4 audit).
 *
 * Each area flow keeps its own screen stack. `onHardwareBack` returns true when
 * it handled the press (it popped the flow's stack) and false when the flow is
 * at its root, so the press falls through to the host's listener (the Sub shell
 * or App.tsx), which owns what "back" means outside the flow. Finance,
 * Notifications, Profile, Receiving and Wallet predate this hook and always
 * return true (their back() calls the host's onBack at the root); the Sub
 * shell relies on that for Receiving, so they keep it.
 *
 * The listener is re-registered on every render on purpose (no dependency
 * list): React Native calls the most recently added listener first, and the
 * hosts register theirs after the flow mounts. Re-adding on each render puts a
 * flow that has just navigated back on top, and always calls the latest
 * closure over the flow's current stack.
 */
import { useEffect } from 'react';
import { BackHandler } from 'react-native';

export function useFlowBack(onHardwareBack: () => boolean): void {
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
    return () => sub.remove();
  });
}
