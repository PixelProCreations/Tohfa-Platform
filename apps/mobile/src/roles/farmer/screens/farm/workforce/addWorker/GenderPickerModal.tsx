import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { GENDER_OPTIONS, type Gender } from './formReducer';
import { CheckIcon, CloseIcon } from './icons';
import { aw } from './i18n';
import { styles } from './styles';

interface Props {
  visible: boolean;
  gender: Gender;
  onSelect: (g: Gender) => void;
  onClose: () => void;
}

export function GenderPickerModal({ visible, gender, onSelect, onClose }: Props): React.JSX.Element {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>{aw('genderModalTitle')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <CloseIcon size={18} color={P.twGray400} />
            </TouchableOpacity>
          </View>
          {GENDER_OPTIONS.map((opt) => {
            const isSelected = gender === opt;
            return (
              <TouchableOpacity
                key={opt}
                style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                onPress={() => onSelect(opt)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                  {aw(`gender.${opt}`)}
                </Text>
                {isSelected && <CheckIcon size={18} color={P.twGreen700} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}
