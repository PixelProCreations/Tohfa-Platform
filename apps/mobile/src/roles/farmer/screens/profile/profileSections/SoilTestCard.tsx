import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Icon, Skeleton } from '@tohfa/mobile-ui';
import type { SoilTestRecord } from '../../../api/soil';
import { t } from '../../../../../i18n/farmer';
import { authPalette as P } from '../../../theme';
import { CARD_ACTION_HIT_SLOP } from './profileHelpers';
import { SoilSummaryBody } from './SoilSummaryBody';
import { styles } from './profileStyles';

export function SoilTestCard({
  soilLoading,
  latestSoilTest,
  onHistory,
}: {
  soilLoading: boolean;
  latestSoilTest: SoilTestRecord | null;
  onHistory: () => void;
}): React.JSX.Element {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.cardIconBox, styles.iconBoxAmber]}>
          <Icon name="science" size={18} color={P.yellow900} />
        </View>
        <View style={styles.cardHeaderTitleBox}>
          <Text style={styles.cardTitle}>{t('farmer.profile.soil.title')}</Text>
          <Text style={styles.cardSubtitle}>{t('farmer.profile.soil.subtitle')}</Text>
        </View>
        <TouchableOpacity onPress={onHistory} hitSlop={CARD_ACTION_HIT_SLOP}>
          <Text style={styles.cardActionLink}>{t('farmer.common.history')}</Text>
        </TouchableOpacity>
      </View>

      {/* Real latest test, or the same honest "no test yet" state
              SoilTestScreen/SoilManagementScreen use -- never a sample
              reading (date, pH, EC, TDS all used to be hardcoded here). */}
      {soilLoading ? <Skeleton height={140} /> : <SoilSummaryBody test={latestSoilTest} />}
    </View>
  );
}
