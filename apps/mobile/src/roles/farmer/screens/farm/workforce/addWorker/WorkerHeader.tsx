import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { ArrowBackIcon } from '../../../../assets/icons/AssetIcons';
import { aw, common } from './i18n';
import { styles } from './styles';

interface Props {
  isEditing: boolean;
  name: string;
  onBack: (() => void) | undefined;
  onCancel: (() => void) | undefined;
}

export function WorkerHeader({ isEditing, name, onBack, onCancel }: Props): React.JSX.Element {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack || onCancel}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={common.back()}
        >
          <ArrowBackIcon size={20} color={P.deepGreen} />
        </TouchableOpacity>

        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>{isEditing ? aw('titleEdit') : aw('titleAdd')}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {name.trim() || aw('newProfile')}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onCancel || onBack}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={common.cancel()}
      >
        <Text style={styles.cancelButtonText}>{common.cancel()}</Text>
      </TouchableOpacity>
    </View>
  );
}
