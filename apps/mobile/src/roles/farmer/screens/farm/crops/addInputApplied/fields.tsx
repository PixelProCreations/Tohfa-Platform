import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { FormChevronDownIcon } from '../../../../assets/icons/AssetIcons';
import { styles } from './styles';

export function FieldLabel({ label, required }: { label: string; required?: boolean | undefined }): React.JSX.Element {
  if (!required) return <Text style={styles.fieldLabel}>{label}</Text>;
  return (
    <View style={styles.fieldLabelRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.asterisk}> *</Text>
    </View>
  );
}

interface DropdownFieldProps {
  label: string;
  required?: boolean | undefined;
  value: string;
  accessibilityLabel: string;
  onPress: () => void;
}

export function DropdownField({
  label,
  required,
  value,
  accessibilityLabel,
  onPress,
}: DropdownFieldProps): React.JSX.Element {
  return (
    <View style={styles.fieldSection}>
      <FieldLabel label={label} required={required} />
      <TouchableOpacity
        style={styles.dropdownBox}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Text style={styles.dropdownText}>{value}</Text>
        <FormChevronDownIcon size={18} color={P.twGray500} />
      </TouchableOpacity>
    </View>
  );
}
