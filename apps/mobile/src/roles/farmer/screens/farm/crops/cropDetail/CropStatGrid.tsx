import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { t } from '../../../../../../i18n/farmer';
import { authPalette as P, spacing, typography } from '../../../../theme';
import { heroOverlayColors } from './overlayColors';

export interface CropStatGridProps {
  daysOld: number;
  daysToHarvest: number;
  grade: string;
}

/** The three glassmorphism stat cards at the bottom of the hero banner. */
export function CropStatGrid({ daysOld, daysToHarvest, grade }: CropStatGridProps): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={styles.card}>
        <Text style={styles.value}>{daysOld}</Text>
        <Text style={styles.label}>{t('farmer.cropDetail.stat.daysOld')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.value}>{daysToHarvest}</Text>
        <Text style={styles.label}>{t('farmer.cropDetail.stat.daysToHarvest')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.value}>{grade}</Text>
        <Text style={styles.label}>{t('farmer.cropDetail.stat.expectedGrade')}</Text>
      </View>
    </View>
  );
}

const CARD_GAP = 10;
const CARD_RADIUS = 14;
const LABEL_TOP_GAP = 2;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: CARD_GAP,
  },
  card: {
    flex: 1,
    backgroundColor: heroOverlayColors.statBg,
    borderWidth: 1,
    borderColor: heroOverlayColors.statBorder,
    borderRadius: CARD_RADIUS,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  value: {
    fontSize: typography.title,
    fontWeight: '800',
    color: P.white,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: heroOverlayColors.statLabel,
    marginTop: LABEL_TOP_GAP,
  },
});
