import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LIME_STATUS_OPTIONS } from './constants';
import { limeLabel } from './LimeStatusField';
import { st } from './i18n';
import { styles } from './styles';

interface Props {
  visible: boolean;
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function LimePickerModal({ visible, selected, onSelect, onClose }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  return (
    <Modal statusBarTranslucent navigationBarTranslucent visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={[styles.modalOverlay, { paddingBottom: insets.bottom }]} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{st('lime.modalTitle')}</Text>
          {LIME_STATUS_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.modalOption, selected === opt ? styles.modalOptionSelected : undefined]}
              onPress={() => onSelect(opt)}
            >
              <Text
                style={[
                  styles.modalOptionText,
                  selected === opt ? styles.modalOptionTextSelected : undefined,
                ]}
              >
                {limeLabel(opt)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
