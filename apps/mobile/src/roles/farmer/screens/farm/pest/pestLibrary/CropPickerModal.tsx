import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authPalette as P } from '../../../../theme';
import { CheckIcon, CloseIcon } from '../pestManagement/icons';
import { CROP_FILTER_OPTIONS } from './constants';
import { pl } from './i18n';
import { styles } from './styles';

const CLOSE_ICON_SIZE = 18;
const CHECK_ICON_SIZE = 18;

interface Props {
  visible: boolean;
  selectedCrop: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function CropPickerModal({ visible, selectedCrop, onSelect, onClose }: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
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
        <View style={[styles.modalCard, { marginTop: insets.top, marginBottom: insets.bottom }]}>
          <View style={styles.modalCardHeader}>
            <Text style={styles.modalCardTitle}>{pl('farmer.pestLibrary.cropPicker.title')}</Text>
            <TouchableOpacity onPress={onClose}>
              <CloseIcon size={CLOSE_ICON_SIZE} color={P.twGray500} />
            </TouchableOpacity>
          </View>

          {CROP_FILTER_OPTIONS.map((opt) => {
            const isSelected = selectedCrop === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.modalCardOption, isSelected && styles.modalCardOptionSelected]}
                onPress={() => onSelect(opt.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[styles.modalCardOptionText, isSelected && styles.modalCardOptionTextSelected]}
                >
                  {pl(opt.labelKey)}
                </Text>
                {isSelected && <CheckIcon size={CHECK_ICON_SIZE} color={P.twGreen700} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}
