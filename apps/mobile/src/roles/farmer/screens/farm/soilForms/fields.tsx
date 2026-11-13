import React from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { authPalette as P } from '../../../theme';
import { FieldErrorText } from '../FieldErrorText';
import { DATE_FORMAT, HIT_SLOP, ICON, OPACITY } from './constants';
import { CalendarIcon, ChevronDownIcon } from './icons';
import { sf } from './i18n';
import { styles } from './styles';

interface FieldLabelProps {
  label: string;
  /** Leading icon; when present the label text is preceded by a space. */
  icon?: React.ReactNode;
  required?: boolean;
  optional?: boolean;
  /** Makes the whole label row tappable (used to open the date picker). */
  onPress?: () => void;
}

/** Label row: optional icon, label, then a red `*` or a grey "(optional)". */
export function FieldLabel({ label, icon, required, optional, onPress }: FieldLabelProps) {
  const text = `${icon ? ' ' : ''}${label}${required ? ' ' : ''}`;
  const content = (
    <>
      {icon}
      <Text style={styles.inputLabel}>{text}</Text>
      {required ? <Text style={styles.requiredAsterisk}>*</Text> : null}
      {optional ? <Text style={styles.optionalText}>{` ${sf('common.optional')}`}</Text> : null}
    </>
  );
  if (onPress) {
    return (
      <TouchableOpacity style={styles.labelRow} activeOpacity={OPACITY.pressed} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={styles.labelRow}>{content}</View>;
}

export function SaveErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.errorBanner}>
      <Text style={styles.errorBannerText}>{message}</Text>
    </View>
  );
}

/** "Target Zone / Plot" field: shows the selected zone and opens the picker. */
export function ZonePickerField({ plotName, onOpen }: { plotName: string; onOpen: () => void }) {
  return (
    <View style={styles.fieldContainer}>
      <FieldLabel label={sf('common.targetZoneLabel')} required />
      <TouchableOpacity
        style={styles.pickerBox}
        onPress={onOpen}
        activeOpacity={OPACITY.pressed}
        accessibilityRole="button"
        accessibilityLabel={sf('common.selectZoneA11y')}
      >
        <Text style={styles.pickerValueText}>{plotName}</Text>
        <ChevronDownIcon size={ICON.chevron} color={P.twGray500} />
      </TouchableOpacity>
    </View>
  );
}

interface DateFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onOpenPicker: () => void;
  containerStyle: StyleProp<ViewStyle>;
  /** Optional: reveals validation on blur and renders the message under the box. */
  onBlur?: () => void;
  error?: string | undefined;
}

/** Required date field: tappable label, free-text DD/MM/YY entry and a calendar button. */
export function DateField({ label, value, onChangeText, onOpenPicker, containerStyle, onBlur, error }: DateFieldProps) {
  return (
    <View style={containerStyle}>
      <FieldLabel
        label={label}
        required
        onPress={onOpenPicker}
        icon={<CalendarIcon size={ICON.label} color={P.twGray600} />}
      />
      <View style={styles.dateBox}>
        <TextInput
          style={styles.dateTextInput}
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          maxLength={10}
          placeholder={DATE_FORMAT}
          placeholderTextColor={P.twGray400}
        />
        <TouchableOpacity
          onPress={onOpenPicker}
          hitSlop={HIT_SLOP.dateIcon}
          accessibilityRole="button"
          accessibilityLabel={sf('common.pickDateA11y')}
        >
          <CalendarIcon size={ICON.dateBox} color={P.twGray400} />
        </TouchableOpacity>
      </View>
      <FieldErrorText message={error} />
    </View>
  );
}

interface PresetChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
  /** Rendered before the label inside the same Text (e.g. a check / plus glyph). */
  prefix?: string;
}

export function PresetChip({ label, active, onPress, prefix }: PresetChipProps) {
  return (
    <TouchableOpacity
      style={[styles.presetChip, active && styles.presetChipActive]}
      onPress={onPress}
      activeOpacity={OPACITY.pressed}
    >
      <Text style={[styles.presetChipText, active && styles.presetChipTextActive]}>
        {prefix}
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface SuccessContextRowProps {
  label: string;
  value: React.ReactNode;
  valueStyle?: StyleProp<TextStyle>;
  numberOfLines?: number;
  /** Notes rows top-align, add spacing and use the smaller value font. */
  notes?: boolean;
}

export function SuccessContextRow({
  label,
  value,
  valueStyle,
  numberOfLines,
  notes,
}: SuccessContextRowProps) {
  return (
    <View style={[styles.successContextRow, notes && styles.successNotesRow]}>
      <Text style={styles.successContextLabel}>{label}</Text>
      <Text
        style={[styles.successContextVal, notes && styles.successNotesVal, valueStyle]}
        numberOfLines={numberOfLines}
      >
        {value}
      </Text>
    </View>
  );
}
