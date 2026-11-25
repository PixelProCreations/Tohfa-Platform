/**
 * FormAlert — the one way a form tells the user something went wrong.
 *
 * Two variants, because the two kinds of failure ask different things of the user:
 *
 *  - `inline`: a validation problem with ONE field (a 9-digit mobile number, an empty
 *    required field). It sits directly under that field, in a small tinted pill, and
 *    has no buttons — the fix is to edit the field, and the screen clears the alert as
 *    soon as the user does. Pair it with a danger-coloured border on the input.
 *  - `banner`: a failure of the whole action (the server could not send the OTP, the
 *    user is offline, rate limited). A compact card with an icon, an optional title,
 *    the message, an optional "Retry" text button and an optional dismiss "×". Show
 *    Retry ONLY when trying the same thing again can actually help — never for a
 *    validation error, where it would just repeat the same refusal.
 *
 * It replaces the full-screen `ErrorState` (48px icon + outlined Retry) that form
 * screens used to drop in the middle of the form; `ErrorState` stays the right tool
 * for a screen whose whole content failed to load.
 *
 * No user-facing text lives here: every label (message, title, retry, dismiss) is
 * passed in already translated by the caller's role catalogue, so this package never
 * imports a role's i18n (cross-role import guard).
 *
 * Accessibility: the alert is one accessible element with role "alert" and a polite
 * live region, so TalkBack / VoiceOver announce it when it appears without stealing
 * focus. The icon is decorative and hidden from the accessibility tree.
 *
 * Motion: a short fade + slide-in on appear (and whenever the message changes). It is
 * skipped entirely when the OS "reduce motion" setting is on.
 */
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { semantic, tokens } from '@tohfa/design-tokens';
import { useTheme } from './theme';
import { Icon } from './Icon';

export type FormAlertVariant = 'inline' | 'banner';
export type FormAlertTone = 'danger' | 'warning';

export interface FormAlertProps {
  message: string;
  /** Defaults to `inline` (field-level validation error). */
  variant?: FormAlertVariant | undefined;
  /** Defaults to `danger`. `warning` suits "wait and try again" states (rate limits). */
  tone?: FormAlertTone | undefined;
  /** Banner only. Short bold heading above the message. */
  title?: string | undefined;
  /** Material Symbols name. Defaults to `error` (danger) / `warning` (warning). */
  icon?: string | undefined;
  /** Banner only. Retry is rendered only when BOTH a handler and a label are given. */
  onRetry?: (() => void) | undefined;
  retryLabel?: string | undefined;
  /** Banner only. The dismiss "×" is rendered only when BOTH a handler and its accessibility label are given. */
  onDismiss?: (() => void) | undefined;
  dismissLabel?: string | undefined;
  testID?: string | undefined;
}

/**
 * Entrance animation length. Not a design token: the token set has no motion scale,
 * and this matches the short UI transitions already used in the app (e.g. the admin
 * toast's 180ms exit). If a motion scale is ever added to tokens.json, read it here.
 */
const ENTER_DURATION_MS = 180;

/** Tracks the OS "reduce motion" accessibility setting. */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    const info = AccessibilityInfo as Partial<typeof AccessibilityInfo> | undefined;
    info
      ?.isReduceMotionEnabled?.()
      .then((value) => {
        if (alive) setReduce(value);
      })
      .catch(() => undefined);
    const sub = info?.addEventListener?.('reduceMotionChanged', (value: boolean) => setReduce(value));
    return () => {
      alive = false;
      sub?.remove();
    };
  }, []);
  return reduce;
}

export const FormAlert: React.FC<FormAlertProps> = ({
  message,
  variant = 'inline',
  tone = 'danger',
  title,
  icon,
  onRetry,
  retryLabel,
  onDismiss,
  dismissLabel,
  testID,
}) => {
  const theme = useTheme();
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: ENTER_DURATION_MS,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [message, reduceMotion, progress]);

  const accent =
    tone === 'warning'
      ? (theme.colors.warning ?? semantic('warning'))
      : theme.colors.danger;
  const tint =
    tone === 'warning'
      ? (theme.colors.warningSurface ?? semantic('warningLight'))
      : (theme.colors.dangerSurface ?? semantic('errorLight'));
  const glyph = icon ?? (tone === 'warning' ? 'warning' : 'error');

  const enter = {
    opacity: progress,
    transform: [
      {
        translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-theme.spacing.xs, 0] }),
      },
    ],
  };

  // One accessible node, announced politely; the icon is decoration.
  const a11y = {
    accessible: true,
    accessibilityRole: 'alert' as const,
    accessibilityLiveRegion: 'polite' as const,
  };

  const decorativeIcon = (size: number) => (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Icon color={accent} name={glyph} size={size} />
    </View>
  );

  if (variant === 'inline') {
    return (
      <Animated.View
        {...a11y}
        accessibilityLabel={message}
        style={[
          styles.row,
          {
            marginTop: tokens.spacing.xsSm,
            paddingVertical: theme.spacing.xs,
            paddingHorizontal: theme.spacing.sm,
            gap: tokens.spacing.xsSm,
            borderRadius: theme.radius.md ?? theme.radius.input,
            backgroundColor: tint,
          },
          enter,
        ]}
        testID={testID}
      >
        {decorativeIcon(theme.typography.body)}
        <Text
          style={[
            styles.flex,
            {
              color: accent,
              fontSize: theme.typography.caption,
              fontWeight: theme.weights.medium,
            },
          ]}
        >
          {message}
        </Text>
      </Animated.View>
    );
  }

  const showRetry = Boolean(onRetry && retryLabel);
  const showDismiss = Boolean(onDismiss && dismissLabel);
  const hitSlop = {
    top: theme.spacing.sm,
    bottom: theme.spacing.sm,
    left: theme.spacing.sm,
    right: theme.spacing.sm,
  };

  return (
    <Animated.View
      style={[
        styles.row,
        {
          marginTop: theme.spacing.lg,
          padding: theme.spacing.md,
          gap: tokens.spacing.smMd,
          borderRadius: theme.radius.card ?? theme.radius.cardMin,
          borderLeftWidth: theme.spacing.xs,
          borderLeftColor: accent,
          backgroundColor: tint,
        },
        enter,
      ]}
      testID={testID}
    >
      {decorativeIcon(theme.typography.bodyLarge)}
      <View
        {...a11y}
        accessibilityLabel={title ? `${title}. ${message}` : message}
        style={styles.flex}
      >
        {title ? (
          <Text
            style={{
              color: theme.colors.onSurface,
              fontSize: theme.typography.bodySmall,
              fontWeight: theme.weights.bold,
              marginBottom: theme.spacing.xs,
            }}
          >
            {title}
          </Text>
        ) : null}
        <Text
          style={{
            color: theme.colors.onSurfaceVariant ?? theme.colors.onSurface,
            fontSize: theme.typography.bodySmall,
          }}
        >
          {message}
        </Text>
      </View>
      {showRetry || showDismiss ? (
        <View style={[styles.actions, { gap: theme.spacing.sm }]}>
          {showDismiss ? (
            <TouchableOpacity
              accessibilityLabel={dismissLabel}
              accessibilityRole="button"
              hitSlop={hitSlop}
              onPress={onDismiss}
              testID={testID ? `${testID}-dismiss` : undefined}
            >
              <Icon color={theme.colors.onSurfaceVariant ?? theme.colors.onSurface} name="close" size={theme.typography.body} />
            </TouchableOpacity>
          ) : null}
          {showRetry ? (
            <TouchableOpacity
              accessibilityRole="button"
              hitSlop={hitSlop}
              onPress={onRetry}
              testID={testID ? `${testID}-retry` : undefined}
            >
              <Text
                style={{
                  color: accent,
                  fontSize: theme.typography.bodySmall,
                  fontWeight: theme.weights.bold,
                }}
              >
                {retryLabel}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  flex: {
    flex: 1,
  },
  actions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
});
