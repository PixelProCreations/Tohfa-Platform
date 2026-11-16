import React from 'react';
import { Platform, View } from 'react-native';
import type { ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Drop-in replacement for React Native's deprecated `SafeAreaView`.
 *
 * Why this uses useSafeAreaInsets instead of the context library's SafeAreaView:
 * the library's SafeAreaView pulls in NativeSafeAreaView (a Fabric codegen
 * component) at module-load time, which can cause mobile-ui's module initialisation
 * to fail during Metro bundling. useSafeAreaInsets is already imported in
 * SystemBars.tsx so it introduces no new dependency.
 *
 * - iOS: applies insets on all edges as padding, matching RN's deprecated behaviour.
 * - Android: returns a plain View with no insets; root insets are reserved once by
 *   StatusBarInset and NavigationBarInset (SystemBars.tsx, pull request 156).
 */
export function SafeAreaView({ style, ...props }: ViewProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  if (Platform.OS !== 'ios') {
    return <View style={style} {...props} />;
  }
  return (
    <View
      style={[
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
        style,
      ]}
      {...props}
    />
  );
}
