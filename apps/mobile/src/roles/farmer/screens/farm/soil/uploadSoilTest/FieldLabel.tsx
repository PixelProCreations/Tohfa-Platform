import React from 'react';
import { Text, View } from 'react-native';
import { styles } from './styles';

interface Props {
  label: string;
  /** Required fields show an asterisk; optional ones show the "optional" tag. */
  required?: boolean;
  optionalText?: string;
}

/** Label line shared by the numeric fields: `Label *` or `Label optional`. */
export function FieldLabel({ label, required, optionalText }: Props): React.JSX.Element {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.inputLabel}>{`${label} `}</Text>
      {required ? <Text style={styles.requiredAsterisk}>*</Text> : null}
      {optionalText ? <Text style={styles.optionalText}>{optionalText}</Text> : null}
    </View>
  );
}
