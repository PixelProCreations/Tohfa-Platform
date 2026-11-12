import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { authPalette as P, spacing, typography } from '../../theme';

/** Inline validation message shown under a text input; renders nothing when there is no error. */
export function FieldErrorText({ message, testID }: { message?: string | undefined; testID?: string }): React.JSX.Element | null {
  if (!message) return null;
  return (
    <Text style={styles.text} testID={testID} accessibilityRole="alert">
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: typography.bodySmall,
    color: P.twRed600,
    marginTop: spacing.xs,
  },
});
