import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
  TextInputProps,
} from 'react-native';
import {
  customerColors,
  customerType,
  customerRadius,
  customerSpacing,
  CUSTOMER_INPUT_HEIGHT,
} from '../theme';

export interface CustomerInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helper?: string;
  isPhone?: boolean;
  phonePrefix?: string;
  containerStyle?: StyleProp<ViewStyle>;
  rightElement?: React.ReactNode;
}

export const CustomerInput: React.FC<CustomerInputProps> = ({
  label,
  error,
  helper,
  isPhone = false,
  phonePrefix = '+91',
  containerStyle,
  rightElement,
  onFocus,
  onBlur,
  ...inputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  const getBorderColor = () => {
    if (error) return customerColors.status.error.text;
    if (isFocused) return customerColors.brand;
    return customerColors.borderDecorative;
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            borderWidth: isFocused || error ? 1.5 : 1,
          },
        ]}
      >
        {isPhone && (
          <View style={styles.phonePrefixContainer}>
            <Text style={styles.phonePrefixText}>{phonePrefix}</Text>
            <View style={styles.prefixDivider} />
          </View>
        )}

        <TextInput
          style={[styles.input, isPhone && styles.phoneInput]}
          placeholderTextColor={customerColors.placeholder}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={label}
          accessibilityRole="text"
          {...inputProps}
        />

        {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helper ? (
        <Text style={styles.helperText}>{helper}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: customerSpacing[16],
  },
  label: {
    ...customerType.support,
    color: customerColors.body,
    marginBottom: customerSpacing[8],
    fontWeight: '600',
  },
  inputContainer: {
    height: CUSTOMER_INPUT_HEIGHT,
    backgroundColor: customerColors.white,
    borderRadius: customerRadius.input,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  phonePrefixContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  phonePrefixText: {
    ...customerType.body,
    color: customerColors.body,
    fontWeight: '600',
  },
  prefixDivider: {
    width: 1,
    height: 24,
    backgroundColor: customerColors.borderDecorative,
    marginLeft: 10,
  },
  input: {
    flex: 1,
    ...customerType.body,
    color: customerColors.body,
    paddingVertical: 0,
    height: '100%',
  },
  phoneInput: {
    letterSpacing: 1.5,
  },
  rightElement: {
    marginLeft: 8,
  },
  errorText: {
    ...customerType.meta,
    color: customerColors.status.error.text,
    marginTop: 4,
  },
  helperText: {
    ...customerType.meta,
    color: customerColors.secondary,
    marginTop: 4,
  },
});

