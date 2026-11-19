import React from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { CalendarIcon, CheckmarkIcon, ChevronDownIcon, CrossMedicalIcon } from './icons';
import { styles } from './styles';
import { tr } from './constants';
import { FieldErrorText } from '../../FieldErrorText';

const ICON_L = 16;
const ICON_XL = 18;

export function TreatmentField({
  treatment,
  onOpen,
}: {
  treatment: string;
  onOpen: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.formGroup}>
      <View style={styles.labelRow}>
        <CrossMedicalIcon size={ICON_L} color={P.forestGreen} />
        <Text style={styles.label}>
          {tr('treatment.label')} <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
      </View>

      <TouchableOpacity
        style={styles.selectBoxGreen}
        onPress={onOpen}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={tr('treatment.a11y')}
      >
        <Text style={styles.selectBoxText}>{treatment}</Text>
        <ChevronDownIcon size={ICON_XL} color={P.forestGreen} />
      </TouchableOpacity>

      <Text style={styles.helpText}>{tr('treatment.help')}</Text>
    </View>
  );
}

export function IntervalPhiRow({
  intervalDays,
  phiDays,
  onChangeInterval,
  onChangePhi,
  onBlurInterval,
  onBlurPhi,
  intervalError,
  phiError,
}: {
  intervalDays: string;
  phiDays: string;
  onChangeInterval: (value: string) => void;
  onChangePhi: (value: string) => void;
  onBlurInterval?: () => void;
  onBlurPhi?: () => void;
  intervalError?: string | undefined;
  phiError?: string | undefined;
}): React.JSX.Element {
  return (
    <View style={styles.rowTwoCols}>
      <View style={styles.col}>
        <Text style={styles.subLabel}>{tr('interval.label')}</Text>
        <TextInput
          style={styles.numInput}
          value={intervalDays}
          onChangeText={onChangeInterval}
          onBlur={onBlurInterval}
          maxLength={3}
          keyboardType="number-pad"
          accessibilityLabel={tr('interval.a11y')}
        />
        <FieldErrorText message={intervalError} />
      </View>

      <View style={styles.col}>
        <Text style={styles.subLabel}>{tr('phi.label')}</Text>
        <View style={styles.autoFieldBox}>
          <TextInput
            style={styles.phiInputText}
            value={phiDays}
            onChangeText={onChangePhi}
            onBlur={onBlurPhi}
            maxLength={3}
            keyboardType="number-pad"
            accessibilityLabel={tr('phi.a11y')}
          />
          <View style={styles.autoBadge}>
            <Text style={styles.autoBadgeText}>{tr('phi.auto')}</Text>
          </View>
        </View>
        <FieldErrorText message={phiError} />
      </View>
    </View>
  );
}

export function NextDateField({
  display,
  intervalDays,
}: {
  display: string;
  intervalDays: string;
}): React.JSX.Element {
  return (
    <View style={styles.formGroup}>
      <View style={styles.labelRow}>
        <CalendarIcon size={ICON_L} color={P.twGray600} />
        <Text style={styles.subLabelNoMargin}>{tr('nextDate.label')}</Text>
      </View>

      <View style={styles.dateBox}>
        <Text style={styles.dateText}>{display}</Text>
        <View style={styles.dateDaysBadge}>
          <Text style={styles.dateDaysBadgeText}>
            {tr('nextDate.todayPlus', { days: intervalDays.trim() || 0 })}
          </Text>
        </View>
      </View>
    </View>
  );
}

export function SaveButton({
  saving,
  disabled,
  onPress,
}: {
  saving: boolean;
  disabled: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.saveBtn, disabled && styles.saveBtnDisabled]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={tr('save.label')}
      disabled={disabled}
    >
      {saving ? (
        <ActivityIndicator size="small" color={P.white} />
      ) : (
        <>
          <CheckmarkIcon size={ICON_XL} color={P.white} />
          <Text style={styles.saveBtnText}>{tr('save.label')}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
