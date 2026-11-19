import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from './styles';

export interface PickerOption {
  value: string;
  label: string;
}

interface Props {
  visible: boolean;
  title: string;
  options: readonly PickerOption[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function PickerModal({ visible, title, options, selected, onSelect, onClose }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  return (
    <Modal statusBarTranslucent navigationBarTranslucent onRequestClose={onClose} visible={visible} transparent animationType="fade">
      <TouchableOpacity style={[styles.modalBackdrop, { paddingBottom: insets.bottom }]} activeOpacity={1} onPress={onClose}>
        <View style={styles.pickerModalContent}>
          <Text style={styles.pickerModalTitle}>{title}</Text>
          {options.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                onPress={() => onSelect(opt.value)}
              >
                <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
