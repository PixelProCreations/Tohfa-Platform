import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { PLACEHOLDERS } from './constants';
import { FieldLabel } from './FieldLabel';
import { HintBadge, HintRow } from './HintBadge';
import { classifyNitrogen, classifyPhosphorus, classifyPotassium, type Hint } from './hints';
import { st } from './i18n';
import { styles } from './styles';
import { FieldErrorText } from '../../FieldErrorText';
import type { SoilTestField } from './validation';

interface Props {
  nitrogen: string;
  phosphorus: string;
  potassium: string;
  onChangeNitrogen: (v: string) => void;
  onChangePhosphorus: (v: string) => void;
  onChangePotassium: (v: string) => void;
  /** Visible validation messages by field, and the blur hook that reveals them. */
  errors?: Partial<Record<SoilTestField, string | undefined>>;
  onBlurField?: (field: SoilTestField) => void;
}

interface NutrientFieldProps {
  labelKey: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  classify: (v: number) => Hint | null;
  onBlur?: (() => void) | undefined;
  error?: string | undefined;
}

function NutrientField({
  labelKey,
  value,
  placeholder,
  onChange,
  classify,
  onBlur,
  error,
}: NutrientFieldProps): React.JSX.Element {
  const hint = classify(parseFloat(value) || 0);
  return (
    <View style={styles.fieldContainer}>
      <FieldLabel label={st(labelKey)} optionalText={st('field.optional')} />
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        maxLength={12}
        keyboardType="decimal-pad"
        placeholder={placeholder}
        placeholderTextColor={P.twGray400}
      />
      <FieldErrorText message={error} />
      <HintRow>{hint ? <HintBadge kind={hint.kind} text={st(hint.textKey)} /> : null}</HintRow>
    </View>
  );
}

export function NutrientsSection(props: Props): React.JSX.Element {
  return (
    <>
      <Text style={[styles.sectionHeading, styles.sectionHeadingNpk]}>{st('section.npk')}</Text>
      <NutrientField
        labelKey="field.nitrogen"
        value={props.nitrogen}
        placeholder={PLACEHOLDERS.nitrogen}
        onChange={props.onChangeNitrogen}
        onBlur={() => props.onBlurField?.('nitrogen')}
        error={props.errors?.nitrogen}
        classify={classifyNitrogen}
      />
      <NutrientField
        labelKey="field.phosphorus"
        value={props.phosphorus}
        placeholder={PLACEHOLDERS.phosphorus}
        onChange={props.onChangePhosphorus}
        onBlur={() => props.onBlurField?.('phosphorus')}
        error={props.errors?.phosphorus}
        classify={classifyPhosphorus}
      />
      <NutrientField
        labelKey="field.potassium"
        value={props.potassium}
        placeholder={PLACEHOLDERS.potassium}
        onChange={props.onChangePotassium}
        onBlur={() => props.onBlurField?.('potassium')}
        error={props.errors?.potassium}
        classify={classifyPotassium}
      />
    </>
  );
}
