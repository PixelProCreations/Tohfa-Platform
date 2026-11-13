import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { ICON, LIME_STATUS_OPTIONS } from './constants';
import { FieldLabel } from './FieldLabel';
import { ChevronDownIcon } from './icons';
import { st } from './i18n';
import { styles } from './styles';

interface Props {
  limeStatus: string;
  onOpen: () => void;
}

/** Display label for a lime-status wire value; unknown values show as received. */
export function limeLabel(value: string): string {
  return (LIME_STATUS_OPTIONS as readonly string[]).includes(value)
    ? st(`lime.option.${value}`)
    : value;
}

export function LimeStatusField({ limeStatus, onOpen }: Props): React.JSX.Element {
  return (
    <View style={styles.fieldContainer}>
      <FieldLabel label={st('field.limeStatus')} optionalText={st('field.optional')} />
      <TouchableOpacity
        style={styles.dropdownBox}
        activeOpacity={0.8}
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={st('a11y.selectLimeStatus')}
      >
        <Text
          style={[
            styles.dropdownSelectedText,
            !limeStatus ? styles.dropdownPlaceholderText : undefined,
          ]}
        >
          {limeStatus ? limeLabel(limeStatus) : st('field.limeStatusPlaceholder')}
        </Text>
        <ChevronDownIcon size={ICON.base} color={P.twGray500} />
      </TouchableOpacity>
    </View>
  );
}
