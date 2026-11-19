import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import type { PestDetection, PestRepeatInterval } from '../../../../api/pest';
import { CheckIcon, CloseIcon } from '../pestManagement/icons';
import { REPEAT_VALUES } from './constants';
import { formatIsoDisplay } from './dateUtils';
import { ts } from './i18n';
import { styles } from './styles';

interface OverlayShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function OverlayShell({ title, onClose, children }: OverlayShellProps): React.JSX.Element {
  return (
    <View style={styles.inModalOverlay}>
      <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
      <View style={styles.pickerCard}>
        <View style={styles.pickerHeader}>
          <Text style={styles.pickerTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <CloseIcon size={18} color={P.twGray500} />
          </TouchableOpacity>
        </View>
        {children}
      </View>
    </View>
  );
}

interface OptionRowProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function OptionRow({ label, selected, onPress }: OptionRowProps): React.JSX.Element {
  return (
    <TouchableOpacity style={[styles.pickerOption, selected && styles.pickerOptionSelected]} onPress={onPress}>
      <Text style={[styles.pickerOptionText, selected && styles.pickerOptionTextSelected]}>{label}</Text>
      {selected && <CheckIcon size={18} color={P.twGreen700} />}
    </TouchableOpacity>
  );
}

interface DetectionPickerProps {
  detections: PestDetection[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}

export function DetectionPickerOverlay({
  detections,
  selectedId,
  onSelect,
  onClose,
}: DetectionPickerProps): React.JSX.Element {
  return (
    <OverlayShell title={ts('farmer.treatmentSchedule.picker.detectionTitle')} onClose={onClose}>
      <OptionRow
        label={ts('farmer.treatmentSchedule.detection.none')}
        selected={selectedId === null}
        onPress={() => onSelect(null)}
      />
      {detections.map((d) => (
        <OptionRow
          key={d.id}
          label={ts('farmer.treatmentSchedule.detection.label', {
            pest: d.pestName,
            date: formatIsoDisplay(d.detectedOn),
          })}
          selected={selectedId === d.id}
          onPress={() => onSelect(d.id)}
        />
      ))}
    </OverlayShell>
  );
}

interface RepeatPickerProps {
  selected: PestRepeatInterval;
  onSelect: (value: PestRepeatInterval) => void;
  onClose: () => void;
}

export function RepeatPickerOverlay({ selected, onSelect, onClose }: RepeatPickerProps): React.JSX.Element {
  return (
    <OverlayShell title={ts('farmer.treatmentSchedule.picker.repeatTitle')} onClose={onClose}>
      {REPEAT_VALUES.map((value) => (
        <OptionRow
          key={value}
          label={ts(`farmer.treatmentSchedule.repeat.${value}`)}
          selected={selected === value}
          onPress={() => onSelect(value)}
        />
      ))}
    </OverlayShell>
  );
}
