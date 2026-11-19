import React from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authPalette as P } from '../../../../theme';
import type { PestCategory, PestLibraryEntry, PestSeverity } from '../../../../api/pest';
import type { CropItem } from '../../crops/cropItems';
import { CloseIcon } from './icons';
import { styles } from './styles';
import { CATEGORIES, SEVERITIES, TREATMENTS, tr } from './constants';

const CLOSE_ICON_SIZE = 18;

function ModalShell({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}): React.JSX.Element {
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
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.modalContainer, { marginTop: insets.top, marginBottom: insets.bottom }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <CloseIcon size={CLOSE_ICON_SIZE} color={P.twGray800} />
            </TouchableOpacity>
          </View>
          {children}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function OptionRow({
  selected,
  label,
  subLabel,
  onPress,
}: {
  selected: boolean;
  label: string;
  subLabel?: string;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <TouchableOpacity style={[styles.modalItem, selected && styles.modalItemSelected]} onPress={onPress}>
      <Text style={[styles.modalItemText, selected && styles.modalItemTextSelected]}>{label}</Text>
      {subLabel !== undefined ? <Text style={styles.modalSubItemText}>{subLabel}</Text> : null}
    </TouchableOpacity>
  );
}

export interface PickerModalsProps {
  openModal: 'crop' | 'pest' | 'type' | 'severity' | 'treatment' | null;
  onClose: () => void;
  cropOptions: CropItem[];
  selectedCrop: CropItem | null;
  onSelectCrop: (crop: CropItem) => void;
  pestOptions: PestLibraryEntry[];
  selectedPest: PestLibraryEntry | null;
  onSelectPest: (pest: PestLibraryEntry) => void;
  category: PestCategory;
  onSelectCategory: (category: PestCategory) => void;
  severity: PestSeverity;
  onSelectSeverity: (severity: PestSeverity) => void;
  treatment: string;
  onSelectTreatment: (treatment: string) => void;
}

export function PickerModals(props: PickerModalsProps): React.JSX.Element {
  const { openModal, onClose } = props;
  return (
    <>
      <ModalShell visible={openModal === 'crop'} title={tr('crop.modalTitle')} onClose={onClose}>
        {props.cropOptions.map((item) => (
          <OptionRow
            key={item.id}
            selected={props.selectedCrop?.id === item.id}
            label={`${item.zone} (${item.name})`}
            onPress={() => props.onSelectCrop(item)}
          />
        ))}
      </ModalShell>

      <ModalShell visible={openModal === 'pest'} title={tr('pest.modalTitle')} onClose={onClose}>
        {props.pestOptions.length === 0 ? (
          <Text style={styles.modalSubItemText}>{tr('pest.noneFound')}</Text>
        ) : (
          props.pestOptions.map((p) => (
            <OptionRow
              key={p.id}
              selected={props.selectedPest?.id === p.id}
              label={p.name}
              subLabel={`${p.scientificName ?? p.category} · ${p.season ?? p.riskLevel}`}
              onPress={() => props.onSelectPest(p)}
            />
          ))
        )}
      </ModalShell>

      <ModalShell visible={openModal === 'type'} title={tr('type.modalTitle')} onClose={onClose}>
        {CATEGORIES.map((c) => (
          <OptionRow key={c} selected={props.category === c} label={c} onPress={() => props.onSelectCategory(c)} />
        ))}
      </ModalShell>

      <ModalShell visible={openModal === 'severity'} title={tr('severity.modalTitle')} onClose={onClose}>
        {SEVERITIES.map((s) => (
          <OptionRow
            key={s}
            selected={props.severity === s}
            label={tr('severity.option', { severity: s })}
            onPress={() => props.onSelectSeverity(s)}
          />
        ))}
      </ModalShell>

      <ModalShell visible={openModal === 'treatment'} title={tr('treatment.modalTitle')} onClose={onClose}>
        {TREATMENTS.map((item) => (
          <OptionRow
            key={item}
            selected={props.treatment === item}
            label={item}
            onPress={() => props.onSelectTreatment(item)}
          />
        ))}
      </ModalShell>
    </>
  );
}
