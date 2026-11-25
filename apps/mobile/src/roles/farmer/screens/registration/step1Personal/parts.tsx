import React from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { Step1Form } from './useStep1Form';
import type { Step1Styles } from './styles';

export interface SectionProps {
  form: Step1Form;
  styles: Step1Styles;
  /** Placeholder / icon / spinner colours that cannot live in a StyleSheet. */
  colors: { placeholder: string; subtle: string; brand: string; white: string };
}

export const RequiredLabel: React.FC<{ styles: Step1Styles; text: string }> = ({
  styles,
  text,
}) => (
  <Text style={styles.label}>
    {text} <Text style={styles.requiredStar}>*</Text>
  </Text>
);

export interface PickerOption {
  value: string;
  label: string;
}

/** Full-screen-safe option list; replaces the clipped inline dropdowns on Step 1. */
export const OptionPickerModal: React.FC<{
  styles: Step1Styles;
  visible: boolean;
  title: string;
  options: PickerOption[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}> = ({ styles, visible, title, options, selected, onSelect, onClose }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    navigationBarTranslucent
    onRequestClose={onClose}
  >
    <View style={styles.pickerOverlay}>
      <TouchableOpacity
        style={styles.pickerBackdrop}
        activeOpacity={0.45}
        onPress={onClose}
        accessibilityRole="button"
      />
      <View style={styles.pickerCard}>
        <Text style={styles.pickerTitle}>{title}</Text>
        <ScrollView keyboardShouldPersistTaps="handled">
          {options.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={styles.dropdownOption}
              onPress={() => onSelect(opt.value)}
            >
              <Text
                style={[
                  styles.dropdownOptionText,
                  opt.value === selected && styles.dropdownOptionTextSelected,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

export const FieldError: React.FC<{ styles: Step1Styles; message: string | undefined }> = ({
  styles,
  message,
}) => (message ? <Text style={styles.fieldErrorText}>{message}</Text> : null);
