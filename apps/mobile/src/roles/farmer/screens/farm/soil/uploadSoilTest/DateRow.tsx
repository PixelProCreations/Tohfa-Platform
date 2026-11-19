import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { HIT_SLOP_LARGE, ICON } from './constants';
import { CalendarIcon } from './icons';
import { st } from './i18n';
import { styles } from './styles';
import { FieldErrorText } from '../../FieldErrorText';

interface Props {
  testDate: string;
  nextDue: string;
  onChangeTestDate: (v: string) => void;
  onChangeNextDue: (v: string) => void;
  onOpenTestDate: () => void;
  onOpenNextDue: () => void;
  testDateError?: string | undefined;
  nextDueError?: string | undefined;
  onBlurTestDate?: () => void;
  onBlurNextDue?: () => void;
}

interface DateFieldProps {
  label: string;
  value: string;
  placeholder: string;
  a11yLabel: string;
  onChange: (v: string) => void;
  onOpen: () => void;
  onBlur?: (() => void) | undefined;
  error?: string | undefined;
}

function DateField({
  label,
  value,
  placeholder,
  a11yLabel,
  onChange,
  onOpen,
  onBlur,
  error,
}: DateFieldProps): React.JSX.Element {
  return (
    <View style={styles.dateInputContainer}>
      <TouchableOpacity style={styles.labelRow} activeOpacity={0.7} onPress={onOpen}>
        <CalendarIcon size={ICON.small} color={P.twGray600} />
        <Text style={styles.inputLabel}>{` ${label} `}</Text>
        <Text style={styles.requiredAsterisk}>*</Text>
      </TouchableOpacity>
      <View style={styles.inputBox}>
        <TextInput
          style={styles.inputText}
          value={value}
          onChangeText={onChange}
          onBlur={onBlur}
          maxLength={10}
          placeholder={placeholder}
          placeholderTextColor={P.twGray400}
        />
        <TouchableOpacity
          onPress={onOpen}
          hitSlop={HIT_SLOP_LARGE}
          accessibilityRole="button"
          accessibilityLabel={a11yLabel}
        >
          <CalendarIcon size={ICON.base} color={P.twGray400} />
        </TouchableOpacity>
      </View>
      <FieldErrorText message={error} />
    </View>
  );
}

export function DateRow(props: Props): React.JSX.Element {
  return (
    <>
      <View style={styles.dateRow}>
        <DateField
          label={st('field.testDate')}
          value={props.testDate}
          placeholder={st('field.testDatePlaceholder')}
          a11yLabel={st('a11y.openTestDate')}
          onChange={props.onChangeTestDate}
          onOpen={props.onOpenTestDate}
          onBlur={props.onBlurTestDate}
          error={props.testDateError}
        />
        <DateField
          label={st('field.nextDue')}
          value={props.nextDue}
          placeholder={st('field.nextDuePlaceholder')}
          a11yLabel={st('a11y.openNextDue')}
          onChange={props.onChangeNextDue}
          onOpen={props.onOpenNextDue}
          onBlur={props.onBlurNextDue}
          error={props.nextDueError}
        />
      </View>
      <Text style={styles.dateHintText}>{st('hint.nextDueAuto')}</Text>
    </>
  );
}
