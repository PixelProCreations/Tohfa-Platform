import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { tokens } from '@tohfa/design-tokens';
import { useTheme } from './theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline';

export type ButtonSize = 'md' | 'sm';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  /** `sm` is a compact button (36dp visual, small label); touch target stays 44 via hitSlop. */
  size?: ButtonSize;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  testID,
  size = 'md',
}) => {
  const theme = useTheme();
  const small = size === 'sm';
  const labelSize = small ? tokens.typeStyle.small.size : theme.typography.body;
  const labelLineHeight = small
    ? tokens.typeStyle.small.lineHeight
    : Math.round(theme.typography.body * theme.lineHeights.body);
  // Extend the touch area up to the platform minimum without growing the visual button.
  const hitInset = small ? Math.max(0, Math.ceil((theme.minTouchTarget - tokens.size.buttonSmallHeight) / 2)) : 0;

  const getVariantStyles = (): { button: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'secondary':
        return {
          button: { backgroundColor: theme.colors.secondary },
          text: { color: theme.colors.white },
        };
      case 'danger':
        return {
          button: { backgroundColor: theme.colors.danger },
          text: { color: theme.colors.white },
        };
      case 'outline':
        return {
          button: {
            backgroundColor: theme.colors.white,
            borderWidth: 1,
            borderColor: theme.colors.primary,
          },
          text: { color: theme.colors.primary },
        };
      case 'primary':
      default:
        return {
          button: { backgroundColor: theme.colors.primary },
          text: { color: theme.colors.white },
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      {...(small ? { hitSlop: { top: hitInset, bottom: hitInset, left: 0, right: 0 } } : {})}
      style={[
        styles.baseButton,
        small
          ? {
              minHeight: tokens.size.buttonSmallHeight,
              borderRadius: theme.radius.button,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.xs,
            }
          : {
              minHeight: theme.minTouchTarget,
              borderRadius: theme.radius.button,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.md,
            },
        vStyles.button,
        disabled && styles.disabledButton,
        style,
      ]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={vStyles.text.color} size="small" />
      ) : (
        <Text
          style={[
            styles.baseText,
            {
              fontSize: labelSize,
              fontWeight: theme.weights.semibold,
              lineHeight: labelLineHeight,
            },
            vStyles.text,
            disabled && styles.disabledText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  baseText: {},
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.8,
  },
});
