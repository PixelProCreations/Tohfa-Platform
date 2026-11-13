import React from 'react';
import { Platform, View } from 'react-native';
import type { ViewProps } from 'react-native';
import { SafeAreaView as InsetSafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ModalSafeAreaProps extends ViewProps {
  /** Which edges to keep clear of the system bars. Defaults to top and bottom. */
  edges?: ReadonlyArray<'top' | 'bottom'>;
}

/**
 * The root content view of a FULL-SCREEN React Native `<Modal>`.
 *
 * Why this is not `SafeAreaView` (./SafeAreaView.tsx): that one is a plain View
 * on Android because the app root reserves the status / navigation bars once
 * (StatusBarInset / NavigationBarInset, SystemBars.tsx). A Modal is a separate
 * Android window outside that root, and since RN 0.88 runs edge-to-edge it
 * draws under both bars: a modal's header sat under the clock and its footer
 * buttons under the gesture / 3-button bar.
 *
 * - Android: pads the content by `useSafeAreaInsets()`. The Modal must pass
 *   `statusBarTranslucent` and `navigationBarTranslucent` so its window really
 *   spans the whole screen on every Android version, which is what those
 *   insets describe.
 * - iOS: the library's native SafeAreaView, which measures its own position,
 *   so it is also right inside a `pageSheet` (no status bar to clear there).
 *
 * Usage:
 *   <Modal statusBarTranslucent navigationBarTranslucent ...>
 *     <ModalSafeArea style={{ flex: 1, backgroundColor }}>...</ModalSafeArea>
 *   </Modal>
 */
export function ModalSafeArea({ edges = ['top', 'bottom'], style, ...rest }: ModalSafeAreaProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'ios') {
    return <InsetSafeAreaView edges={edges} style={style} {...rest} />;
  }
  return (
    <View
      style={[
        style,
        {
          paddingTop: edges.includes('top') ? insets.top : 0,
          paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
        },
      ]}
      {...rest}
    />
  );
}
