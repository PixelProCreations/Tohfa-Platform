import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import {
  customerColors,
  customerType,
  customerRadius,
  customerShadow,
  CUSTOMER_ACTION_HEIGHT,
  CUSTOMER_CIRCULAR_BUTTON_SIZE,
} from '../theme';

export type CustomerButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'circular';

export interface CustomerButtonProps {
  title?: string;
  variant?: CustomerButtonVariant;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  accessibilityLabel?: string;
}

export const CustomerButton: React.FC<CustomerButtonProps> = ({
  title,
  variant = 'primary',
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
  accessibilityLabel,
}) => {
  const isCircular = variant === 'circular';

  // Base styling per variant
  const getContainerStyle = (): StyleProp<ViewStyle> => {
    if (isCircular) {
      return [
        styles.circular,
        disabled ? styles.circularDisabled : styles.primaryBase,
        style,
      ];
    }

    switch (variant) {
      case 'secondary':
        return [
          styles.buttonBase,
          styles.secondaryBase,
          disabled && styles.secondaryDisabled,
          style,
        ];
      case 'tertiary':
        return [
          styles.buttonBase,
          styles.tertiaryBase,
          disabled && styles.tertiaryDisabled,
          style,
        ];
      case 'primary':
      default:
        return [
          styles.buttonBase,
          styles.primaryBase,
          disabled && styles.primaryDisabled,
          style,
        ];
    }
  };

  const getTextStyle = (): StyleProp<TextStyle> => {
    switch (variant) {
      case 'secondary':
        return [
          styles.textBase,
          styles.secondaryText,
          disabled && styles.disabledText,
          textStyle,
        ];
      case 'tertiary':
        return [
          styles.textBase,
          styles.tertiaryText,
          disabled && styles.disabledText,
          textStyle,
        ];
      case 'primary':
      default:
        return [
          styles.textBase,
          styles.primaryText,
          disabled && styles.disabledText,
          textStyle,
        ];
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={getContainerStyle()}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <>
          <ActivityIndicator
            size="small"
            color={variant === 'secondary' || variant === 'tertiary' ? customerColors.brand : customerColors.white}
            style={styles.spinner}
          />
          {!isCircular && (
            <Text style={getTextStyle()}>Please wait</Text>
          )}
        </>
      ) : (
        <>
          {leftIcon}
          {title ? <Text style={getTextStyle()}>{title}</Text> : null}
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    height: CUSTOMER_ACTION_HEIGHT,
    borderRadius: customerRadius.action,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  circular: {
    width: CUSTOMER_CIRCULAR_BUTTON_SIZE,
    height: CUSTOMER_CIRCULAR_BUTTON_SIZE,
    borderRadius: customerRadius.action,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBase: {
    backgroundColor: customerColors.brand,
  },
  primaryDisabled: {
    backgroundColor: customerColors.surfaceDisabled,
  },
  circularDisabled: {
    backgroundColor: customerColors.surfaceDisabled,
  },
  secondaryBase: {
    backgroundColor: customerColors.white,
    borderWidth: 1,
    borderColor: customerColors.borderControl,
  },
  secondaryDisabled: {
    borderColor: customerColors.surfaceDisabled,
    backgroundColor: customerColors.white,
  },
  tertiaryBase: {
    backgroundColor: 'transparent',
  },
  tertiaryDisabled: {
    opacity: 0.5,
  },
  textBase: {
    ...customerType.control,
  },
  primaryText: {
    color: customerColors.white,
  },
  secondaryText: {
    color: customerColors.body,
  },
  tertiaryText: {
    color: customerColors.brand,
  },
  disabledText: {
    color: customerColors.disabledText,
  },
  spinner: {
    marginRight: 6,
  },
});

