import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { customerColors, customerType, customerRadius, customerSpacing } from '../theme';

export interface CustomerChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export const CustomerChip: React.FC<CustomerChipProps> = ({
  label,
  selected = false,
  onPress,
  style,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.chip,
        selected ? styles.selectedChip : styles.unselectedChip,
        disabled && styles.disabledChip,
        style,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
    >
      <Text
        style={[
          styles.chipText,
          selected ? styles.selectedText : styles.unselectedText,
          disabled && styles.disabledText,
        ]}
      >
        {label}
        {selected ? ' ✓' : ''}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    height: 40,
    borderRadius: customerRadius.action,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
  },
  unselectedChip: {
    backgroundColor: customerColors.white,
    borderColor: customerColors.borderDecorative,
  },
  selectedChip: {
    backgroundColor: customerColors.surfaceSelected,
    borderColor: customerColors.brand,
  },
  disabledChip: {
    backgroundColor: customerColors.surfaceDisabled,
    borderColor: customerColors.surfaceDisabled,
  },
  chipText: {
    ...customerType.control,
    fontSize: 14,
  },
  unselectedText: {
    color: customerColors.body,
  },
  selectedText: {
    color: customerColors.brand,
    fontWeight: '700',
  },
  disabledText: {
    color: customerColors.disabledText,
  },
});

