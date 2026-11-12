import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { PLACEHOLDERS } from './constants';
import { FieldLabel } from './FieldLabel';
import { HintBadge, HintRow } from './HintBadge';
import { classifyOrganicCarbon, classifyPh, isPhAcidic } from './hints';
import { st } from './i18n';
import { styles } from './styles';
import { FieldErrorText } from '../../FieldErrorText';
import type { SoilTestField } from './validation';

/** Generous cap on typed characters; the validators enforce the real limits. */
const MAX_DECIMAL_INPUT_LENGTH = 12;

interface Props {
  organicCarbon: string;
  ph: string;
  ec: string;
  tds: string;
  onChangeOrganicCarbon: (v: string) => void;
  onChangePh: (v: string) => void;
  onChangeEc: (v: string) => void;
  onChangeTds: (v: string) => void;
  /** Visible validation messages by field, and the blur hook that reveals them. */
  errors?: Partial<Record<SoilTestField, string | undefined>>;
  onBlurField?: (field: SoilTestField) => void;
}

export function MeasuredValuesSection(props: Props): React.JSX.Element {
  const ocHint = classifyOrganicCarbon(parseFloat(props.organicCarbon) || 0);
  const phVal = parseFloat(props.ph) || 0;
  const phHint = classifyPh(phVal);
  return (
    <>
      <Text style={styles.sectionHeading}>{st('section.measured')}</Text>

      <View style={styles.fieldContainer}>
        <FieldLabel label={st('field.organicCarbon')} required />
        <TextInput
          style={styles.textInput}
          value={props.organicCarbon}
          onChangeText={props.onChangeOrganicCarbon}
          onBlur={() => props.onBlurField?.('organicCarbon')}
          maxLength={MAX_DECIMAL_INPUT_LENGTH}
          keyboardType="decimal-pad"
          placeholder={PLACEHOLDERS.organicCarbon}
          placeholderTextColor={P.twGray400}
        />
        <FieldErrorText message={props.errors?.organicCarbon} />
        <HintRow>
          {ocHint ? <HintBadge kind={ocHint.kind} text={st(ocHint.textKey)} /> : null}
        </HintRow>
      </View>

      <View style={styles.fieldContainer}>
        <FieldLabel label={st('field.ph')} required />
        <TextInput
          style={[styles.textInput, isPhAcidic(phVal) ? styles.textInputError : undefined]}
          value={props.ph}
          onChangeText={props.onChangePh}
          onBlur={() => props.onBlurField?.('ph')}
          maxLength={MAX_DECIMAL_INPUT_LENGTH}
          keyboardType="decimal-pad"
          placeholder={PLACEHOLDERS.ph}
          placeholderTextColor={P.twGray400}
        />
        <FieldErrorText message={props.errors?.ph} />
        <HintRow>
          {phHint ? <HintBadge kind={phHint.kind} text={st(phHint.textKey)} /> : null}
        </HintRow>
      </View>

      <View style={styles.fieldContainer}>
        <FieldLabel label={st('field.ec')} required />
        <TextInput
          style={styles.textInput}
          value={props.ec}
          onChangeText={props.onChangeEc}
          onBlur={() => props.onBlurField?.('ec')}
          maxLength={MAX_DECIMAL_INPUT_LENGTH}
          keyboardType="decimal-pad"
          placeholder={PLACEHOLDERS.ec}
          placeholderTextColor={P.twGray400}
        />
        <FieldErrorText message={props.errors?.ec} />
        <HintRow>
          <HintBadge kind="ok" text={st('hint.ec.good')} />
        </HintRow>
      </View>

      <View style={styles.fieldContainer}>
        <FieldLabel label={st('field.tds')} optionalText={st('field.optional')} />
        <TextInput
          style={styles.textInput}
          value={props.tds}
          onChangeText={props.onChangeTds}
          onBlur={() => props.onBlurField?.('tds')}
          maxLength={7}
          keyboardType="number-pad"
          placeholder={PLACEHOLDERS.tds}
          placeholderTextColor={P.twGray400}
        />
        <FieldErrorText message={props.errors?.tds} />
        <HintRow>
          <HintBadge kind="ok" text={st('hint.tds.good')} />
        </HintRow>
      </View>
    </>
  );
}
