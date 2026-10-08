import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../theme';

export type ToastType = 'approve' | 'reject' | 'info_request';

export interface ToastData {
  id?: string;
  type: ToastType;
  title: string;
  message: string;
}

interface Props {
  toast: ToastData | null;
  onDismiss: () => void;
  duration?: number;
}

/**
 * Each toast type maps onto one semantic pair of the admin theme instead of
 * carrying its own hex values:
 *   accent      -> tone.border  (left stripe + icon; the PDF's alert-card stripe)
 *   iconBg      -> tone.bg      (soft tint behind the icon and the tag badge)
 *   titleColor  -> tone.text    (also the tag badge label, like the PDF's status badges)
 *   borderColor -> adminColors.border (the neutral card outline every PDF card uses)
 * `info_request` was brand orange before and stays brand: it maps to `brandSoft`
 * (Orange Deep on Orange Tint, Orange stripe), not to the blue `info` pair.
 */
const TOAST_THEMES = {
  approve: {
    accent: adminColors.success.border,
    iconBg: adminColors.success.bg,
    titleColor: adminColors.success.text,
    borderColor: adminColors.border,
    badgeText: 'Approved',
  },
  reject: {
    accent: adminColors.danger.border,
    iconBg: adminColors.danger.bg,
    titleColor: adminColors.danger.text,
    borderColor: adminColors.border,
    badgeText: 'Rejected',
  },
  info_request: {
    accent: adminColors.brandSoft.border,
    iconBg: adminColors.brandSoft.bg,
    titleColor: adminColors.brandSoft.text,
    borderColor: adminColors.border,
    badgeText: 'Requested',
  },
};

export const TohfaToast: React.FC<Props> = ({
  toast,
  onDismiss,
  duration = 3800,
}) => {
  const translateX = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (toast) {
      // Clear any pending dismissal timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Reset values
      translateX.setValue(100);
      opacity.setValue(0);

      // Slide in from right and fade in
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          tension: 70,
          friction: 9,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      timerRef.current = setTimeout(() => {
        dismiss();
      }, duration);
    } else {
      translateX.setValue(100);
      opacity.setValue(0);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [toast, duration]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 80,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!toast) return null;

  const theme = TOAST_THEMES[toast.type] || TOAST_THEMES.approve;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateX }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.toastCard,
          {
            borderLeftColor: theme.accent,
            borderColor: theme.borderColor,
          },
        ]}
      >
        {/* Themed Icon Badge */}
        <View style={[styles.iconCircle, { backgroundColor: theme.iconBg }]}>
          {toast.type === 'approve' && (
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M20 6L9 17L4 12"
                stroke={theme.accent}
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
          {toast.type === 'reject' && (
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M18 6L6 18M6 6l12 12"
                stroke={theme.accent}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
          {toast.type === 'info_request' && (
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Path
                d="M22 2L11 13"
                stroke={theme.accent}
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M22 2L15 22L11 13L2 9L22 2Z"
                stroke={theme.accent}
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
        </View>

        {/* Content */}
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.titleText, { color: theme.titleColor }]}>
              {toast.title}
            </Text>
            <View style={[styles.tagBadge, { backgroundColor: theme.iconBg }]}>
              <Text style={[styles.tagBadgeText, { color: theme.titleColor }]}>
                {theme.badgeText}
              </Text>
            </View>
          </View>
          <Text style={styles.messageText} numberOfLines={2}>
            {toast.message}
          </Text>
        </View>

        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={dismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Dismiss toast"
        >
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path
              d="M18 6L6 18M6 6l12 12"
              stroke={adminColors.muted}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    // Status-bar offset, not a spacing step; should become a safe-area inset.
    top: Platform.OS === 'ios' ? 52 : 24,
    right: adminSpacing.lg,
    zIndex: 999999,
    maxWidth: 330,
    minWidth: 270,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderLeftWidth: 5,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    // PDF "Shadow MD — toasts, floating actions".
    ...adminShadow.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.sm,
  },
  textContainer: {
    flex: 1,
    marginRight: adminSpacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    marginBottom: 2, // optical nudge below the 4px spacing grid
  },
  titleText: {
    ...adminType.rowTitle,
  },
  tagBadge: {
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2, // optical nudge below the 4px spacing grid
    borderRadius: adminRadius.full,
  },
  tagBadgeText: {
    ...adminType.caption,
  },
  messageText: {
    ...adminType.rowMeta,
    color: adminColors.muted,
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});
