import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../theme';
import { ArrowBackIcon } from '../../../assets/icons/AssetIcons';
import { ICON } from './constants';
import { lh } from './i18n';
import { styles } from './styles';

export function LearningHubHeader({ onBack }: { onBack: () => void }): React.JSX.Element {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={lh('header.back')}
      >
        <ArrowBackIcon size={ICON.header} color={P.greenDeep1} />
      </TouchableOpacity>
      <View style={styles.headerTextWrap}>
        <Text style={styles.headerTitle}>{lh('header.title')}</Text>
        <Text style={styles.headerSubtitle}>{lh('header.subtitle')}</Text>
      </View>
    </View>
  );
}
