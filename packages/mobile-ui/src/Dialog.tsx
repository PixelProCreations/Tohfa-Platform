import React, { useSyncExternalStore } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TextStyle, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hex, semantic } from '@tohfa/design-tokens';
import { useTheme } from './theme';
import type { MobileTheme } from './theme';
import { Icon } from './Icon';
import { dialogStore, layoutDialogButtons } from './dialogQueue';
import type { DialogButtonStyle, DialogStore, DialogTone } from './dialogQueue';

export {
  appAlert,
  dismissDialog,
  showDialog,
  type AlertStyleButton,
  type AppAlertOptions,
  type DialogButton,
  type DialogButtonStyle,
  type DialogOptions,
  type DialogTone,
} from './dialogQueue';

const TONE_ICON: Record<DialogTone, string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
};

function toneColors(theme: MobileTheme, tone: DialogTone): { fg: string; bg: string } {
  switch (tone) {
    case 'success':
      return { fg: theme.colors.success, bg: semantic('successLight') };
    case 'warning':
      return { fg: semantic('warning'), bg: semantic('warningLight') };
    case 'error':
      return { fg: theme.colors.danger, bg: semantic('errorLight') };
    case 'info':
    default:
      return { fg: theme.colors.info, bg: semantic('infoLight') };
  }
}

function buttonColors(theme: MobileTheme, style: DialogButtonStyle): { button: ViewStyle; text: TextStyle } {
  switch (style) {
    case 'cancel':
      return {
        button: { backgroundColor: theme.colors.white, borderWidth: 1, borderColor: semantic('border') },
        text: { color: theme.colors.onSurface },
      };
    case 'destructive':
      return { button: { backgroundColor: theme.colors.danger }, text: { color: theme.colors.white } };
    case 'default':
    default:
      return { button: { backgroundColor: theme.colors.primary }, text: { color: theme.colors.white } };
  }
}

export interface DialogHostProps {
  /** Label of the implicit button of a dialog shown without buttons (pass t('â€¦ok')). */
  defaultButtonLabel: string;
  /** Override for tests or a second, isolated queue. Defaults to the app-wide `dialogStore`. */
  store?: DialogStore;
}

/**
 * Renders the dialog at the head of the queue (see ./dialogQueue.ts). Mount it
 * ONCE, near the app root and inside `SafeAreaProvider`; every `showDialog` /
 * `appAlert` call anywhere in the app is rendered here.
 *
 * Android: a Modal is its own window, so the root's StatusBarInset /
 * NavigationBarInset (SystemBars.tsx) do not reach it. The Modal is therefore
 * drawn translucent under both system bars (so the scrim covers the whole
 * screen) and the card is kept clear of them with `useSafeAreaInsets()`.
 * The hardware back button is `onRequestClose`, which only closes a
 * cancelable dialog.
 */
export function DialogHost({ defaultButtonLabel, store = dialogStore }: DialogHostProps): React.JSX.Element {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const dialog = useSyncExternalStore(store.subscribe, store.current, store.current);

  const labels = dialog?.buttons.map((b) => b.label ?? defaultButtonLabel) ?? [];
  const layout = dialog ? layoutDialogButtons(dialog.buttons.map((b, i) => ({ label: labels[i], style: b.style }))) : null;
  const tone = dialog ? toneColors(theme, dialog.tone) : null;
  const bodyLineHeight = Math.round(theme.typography.body * theme.lineHeights.body);
  const titleLineHeight = Math.round(theme.typography.title * theme.lineHeights.heading);

  const requestClose = (): void => {
    if (dialog) store.requestClose(dialog.id);
  };

  return (
    <Modal
      visible={dialog !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={requestClose}
    >
      <View
        style={[
          styles.scrim,
          {
            paddingTop: insets.top + theme.spacing.xl,
            paddingBottom: insets.bottom + theme.spacing.xl,
            paddingLeft: insets.left + theme.spacing.xl,
            paddingRight: insets.right + theme.spacing.xl,
          },
        ]}
      >
        {/* The backdrop is a sibling behind the card, so a tap on the card never reaches it. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={requestClose}
          accessible={false}
          importantForAccessibility="no"
        />
        {dialog && tone && layout ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.white,
                borderRadius: theme.radius.cardMax,
                padding: theme.spacing.xl,
                gap: theme.spacing.lg,
              },
            ]}
            accessibilityViewIsModal
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            <View style={[styles.headerRow, { gap: theme.spacing.md }]}>
              <View
                style={[
                  styles.toneBadge,
                  {
                    backgroundColor: tone.bg,
                    width: theme.minTouchTarget,
                    height: theme.minTouchTarget,
                    borderRadius: theme.radius.pill,
                  },
                ]}
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden
              >
                <Icon name={TONE_ICON[dialog.tone]} color={tone.fg} />
              </View>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.colors.onSurface,
                    fontSize: theme.typography.title,
                    lineHeight: titleLineHeight,
                    fontWeight: theme.weights.bold,
                  },
                ]}
                accessibilityRole="header"
              >
                {dialog.title}
              </Text>
            </View>

            {dialog.message ? (
              <ScrollView style={styles.messageScroll} bounces={false}>
                <Text
                  style={{
                    color: theme.colors.onSurfaceVariant ?? theme.colors.onSurface,
                    fontSize: theme.typography.body,
                    lineHeight: bodyLineHeight,
                  }}
                >
                  {dialog.message}
                </Text>
              </ScrollView>
            ) : null}

            <View style={[layout.direction === 'row' ? styles.buttonRow : styles.buttonColumn, { gap: theme.spacing.sm }]}>
              {layout.order.map((index) => {
                const button = dialog.buttons[index];
                if (!button) return null;
                const label = labels[index] ?? defaultButtonLabel;
                const colors = buttonColors(theme, button.style);
                return (
                  <Pressable
                    key={index}
                    onPress={() => store.press(dialog.id, index)}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    testID={button.testID}
                    style={({ pressed }) => [
                      styles.button,
                      layout.direction === 'row' && styles.buttonInRow,
                      {
                        minHeight: theme.minTouchTarget,
                        borderRadius: theme.radius.button,
                        paddingHorizontal: theme.spacing.lg,
                        paddingVertical: theme.spacing.md,
                      },
                      colors.button,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        {
                          fontSize: theme.typography.body,
                          lineHeight: bodyLineHeight,
                          fontWeight: theme.weights.semibold,
                        },
                        colors.text,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: hex('dialogScrim'),
  },
  card: {
    width: '100%',
    maxHeight: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toneBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    flexShrink: 1,
  },
  messageScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  buttonColumn: {
    flexDirection: 'column',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInRow: {
    flex: 1,
  },
  buttonText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
