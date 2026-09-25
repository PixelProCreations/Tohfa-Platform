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

const TOAST_THEMES = {
  approve: {
    accent: '#2E7D32',
    iconBg: '#E8F5E9',
    titleColor: '#1B5E20',
    borderColor: '#C8E6C9',
    badgeText: 'Approved',
  },
  reject: {
    accent: '#D32F2F',
    iconBg: '#FFEBEE',
    titleColor: '#B71C1C',
    borderColor: '#FFCDD2',
    badgeText: 'Rejected',
  },
  info_request: {
    accent: '#F0562A',
    iconBg: '#FFECE8',
    titleColor: '#C03912',
    borderColor: '#FFCCBC',
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
              <Text style={[styles.tagBadgeText, { color: theme.accent }]}>
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
              stroke="#A39A94"
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
    top: Platform.OS === 'ios' ? 52 : 24,
    right: 16,
    zIndex: 999999,
    maxWidth: 330,
    minWidth: 270,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 5,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  titleText: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  messageText: {
    fontSize: 11.5,
    color: '#6B6560',
    lineHeight: 15.5,
    fontWeight: '500',
  },
  closeBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F8F5F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
});
