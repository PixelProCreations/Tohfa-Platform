import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { ArrowBackIcon } from './icons';
import { styles } from './styles';
import { tr } from './constants';

const CANCEL_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
const BACK_ICON_SIZE = 20;

export function LogPestHeader({ onBack }: { onBack: (() => void) | undefined }): React.JSX.Element {
  return (
    <View style={styles.headerBar}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={tr('a11y.goBack')}
      >
        <ArrowBackIcon size={BACK_ICON_SIZE} color={P.deepGreen} />
      </TouchableOpacity>

      <View style={styles.headerTextGroup}>
        <Text style={styles.headerTitle}>{tr('header.title')}</Text>
        <Text style={styles.headerSubtitle}>{tr('header.subtitle')}</Text>
      </View>

      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.7}
        hitSlop={CANCEL_HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel={tr('header.cancel')}
      >
        <Text style={styles.cancelButtonText}>{tr('header.cancel')}</Text>
      </TouchableOpacity>
    </View>
  );
}
