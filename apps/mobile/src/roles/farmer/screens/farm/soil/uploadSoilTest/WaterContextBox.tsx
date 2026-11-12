import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { authPalette as P } from '../../../../theme';
import { HIT_SLOP_SMALL, ICON } from './constants';
import { WaterDropIcon } from './icons';
import { st } from './i18n';
import { styles } from './styles';

interface Props {
  waterSourcesText: string;
  onEdit?: (() => void) | undefined;
}

export function WaterContextBox({ waterSourcesText, onEdit }: Props): React.JSX.Element {
  return (
    <View style={styles.waterContextBox}>
      <View style={styles.waterIconCircle}>
        <WaterDropIcon size={ICON.doc} color={P.twGray500} />
      </View>
      <View style={styles.waterContextInfo}>
        <Text style={styles.waterContextLabel}>{st('water.label')}</Text>
        <Text style={styles.waterContextValue}>{waterSourcesText}</Text>
      </View>
      <TouchableOpacity onPress={onEdit} activeOpacity={0.7} hitSlop={HIT_SLOP_SMALL}>
        <Text style={styles.waterContextEditBtn}>{st('water.edit')}</Text>
      </TouchableOpacity>
    </View>
  );
}
