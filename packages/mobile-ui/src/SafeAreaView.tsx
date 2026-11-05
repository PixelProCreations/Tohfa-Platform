import React from 'react';
import { Platform, View } from 'react-native';
import type { ViewProps } from 'react-native';
import { SafeAreaView as InsetSafeAreaView } from 'react-native-safe-area-context';

/**
 * Drop-in replacement for React Native's deprecated `SafeAreaView`.
 *
 * Why this exists: React Native 0.88 deprecates `SafeAreaView` from
 * 'react-native' and points at 'react-native-safe-area-context' instead.
 * Swapping every screen straight to the library's component would change
 * layout on Android, so this wrapper keeps the old behaviour exactly:
 *
 * - iOS: RN's SafeAreaView padded its content by the device's safe-area
 *   insets on all edges. The library's SafeAreaView does the same (all edges
 *   by default), so iOS renders it.
 * - Android: RN's SafeAreaView never applied any inset; it was a plain View.
 *   Android insets are reserved once at the app root by `StatusBarInset` and
 *   `NavigationBarInset` (see SystemBars.tsx, the edge-to-edge fix of
 *   pull request 156). Applying the library's insets here as well would pad every
 *   screen a second time, so Android keeps rendering a plain View.
 */
export function SafeAreaView(props: ViewProps): React.JSX.Element {
  if (Platform.OS === 'ios') {
    return <InsetSafeAreaView {...props} />;
  }
  return <View {...props} />;
}
