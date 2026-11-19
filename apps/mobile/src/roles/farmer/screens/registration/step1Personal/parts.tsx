import React from 'react';
import { Text } from 'react-native';
import type { Step1Form } from './useStep1Form';
import type { Step1Styles } from './styles';

export interface SectionProps {
  form: Step1Form;
  styles: Step1Styles;
  /** Placeholder / icon / spinner colours that cannot live in a StyleSheet. */
  colors: { placeholder: string; subtle: string; brand: string; white: string };
}

export const RequiredLabel: React.FC<{ styles: Step1Styles; text: string }> = ({
  styles,
  text,
}) => (
  <Text style={styles.label}>
    {text} <Text style={styles.requiredStar}>*</Text>
  </Text>
);

export const FieldError: React.FC<{ styles: Step1Styles; message: string | undefined }> = ({
  styles,
  message,
}) => (message ? <Text style={styles.fieldErrorText}>{message}</Text> : null);
