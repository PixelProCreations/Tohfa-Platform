import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme } from '../../../theme';
import { t } from '../../../../../i18n/farmer';
import type { ManualPointRow } from '../manualPoints';
import {
  COORDINATE_INPUT_MAX_LENGTH,
  rowFieldErrors,
  sanitizeCoordinateText,
  type CoordinateField,
  type RowTouched,
} from '../locationInputRules';
import { errorMessage } from '../../../utils/validation';
import { PlusIcon, CloseIcon } from './icons';
import { styles } from './styles';

interface ManualPointsPanelProps {
  points: ManualPointRow[];
  shapeError: string | null;
  showHint: boolean;
  /** Parent can set this once Next / Save is attempted so every row's errors show at once. */
  submitted?: boolean;
  onChangePoint: (rowId: string, field: 'latText' | 'lngText', text: string) => void;
  onAddPoint: () => void;
  onRemovePoint: (rowId: string) => void;
}

/** The manual-coordinates fallback: typed lat/lng rows, add/remove controls and row-list feedback. */
export const ManualPointsPanel: React.FC<ManualPointsPanelProps> = ({
  points,
  shapeError,
  showHint,
  submitted = false,
  onChangePoint,
  onAddPoint,
  onRemovePoint,
}) => {
  const { colors } = useTheme();
  // Which fields of which rows have been left; errors stay hidden until then (or until submit).
  const [touched, setTouched] = useState<Record<string, RowTouched>>({});
  const markTouched = (rowId: string, field: CoordinateField) =>
    setTouched((prev) => ({ ...prev, [rowId]: { ...prev[rowId], [field]: true } }));
  const inputColors = {
    borderColor: colors.borderLight,
    color: colors.textDark,
    backgroundColor: colors.white,
  };
  return (
    <View>
      {/* Capped and scrollable so a long outline can't push the card up over the whole
          map; `nestedScrollEnabled` because this sits inside the screen's own layout on
          Android, the same as the place-search suggestions list. */}
      <ScrollView
        style={styles.manualPointsList}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
      >
        {points.map((row, index) => {
          const errors = rowFieldErrors(row, touched[row.id] ?? {}, submitted);
          const latMessage = errorMessage(errors.latText, t);
          const lngMessage = errorMessage(errors.lngText, t);
          const latHasError = latMessage !== undefined;
          const lngHasError = lngMessage !== undefined;
          return (
            <View key={row.id} style={styles.manualPointBlock}>
              <View style={styles.manualPointRow}>
                <Text style={styles.manualPointIndex}>{index + 1}</Text>
                <View style={styles.fieldCol}>
                  <TextInput
                    style={[styles.fieldInput, inputColors, latHasError ? styles.inputError : null]}
                    value={row.latText}
                    onChangeText={(text) => onChangePoint(row.id, 'latText', sanitizeCoordinateText(text))}
                    onBlur={() => markTouched(row.id, 'latText')}
                    keyboardType="numbers-and-punctuation"
                    maxLength={COORDINATE_INPUT_MAX_LENGTH}
                    placeholder={t('farmer.registration.gps.manualLat')}
                    placeholderTextColor={colors.textPlaceholder}
                    accessibilityLabel={t('farmer.registration.gps.manualLat')}
                  />
                </View>
                <View style={styles.fieldCol}>
                  <TextInput
                    style={[styles.fieldInput, inputColors, lngHasError ? styles.inputError : null]}
                    value={row.lngText}
                    onChangeText={(text) => onChangePoint(row.id, 'lngText', sanitizeCoordinateText(text))}
                    onBlur={() => markTouched(row.id, 'lngText')}
                    keyboardType="numbers-and-punctuation"
                    maxLength={COORDINATE_INPUT_MAX_LENGTH}
                    placeholder={t('farmer.registration.gps.manualLng')}
                    placeholderTextColor={colors.textPlaceholder}
                    accessibilityLabel={t('farmer.registration.gps.manualLng')}
                  />
                </View>
                {points.length >= 2 ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.manualPointRemoveBtn}
                    onPress={() => onRemovePoint(row.id)}
                    accessibilityRole="button"
                    accessibilityLabel={t('farmer.registration.step3.manualRemovePoint', {
                      index: index + 1,
                    })}
                  >
                    <CloseIcon size={16} color={colors.textSubtle} />
                  </TouchableOpacity>
                ) : null}
              </View>
              {latMessage ? <Text style={styles.fieldErrorText}>{latMessage}</Text> : null}
              {lngMessage && lngMessage !== latMessage ? (
                <Text style={styles.fieldErrorText}>{lngMessage}</Text>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.manualAddPointBtn}
        onPress={onAddPoint}
        accessibilityRole="button"
      >
        <PlusIcon size={14} color={colors.brandGreen} />
        <Text style={styles.manualAddPointText}>{t('farmer.registration.step3.manualAddPoint')}</Text>
      </TouchableOpacity>

      {shapeError ? (
        <Text style={styles.fieldErrorText}>{shapeError}</Text>
      ) : showHint ? (
        <Text style={styles.manualHintText}>{t('farmer.registration.step3.manualPointsHint')}</Text>
      ) : null}
    </View>
  );
};
