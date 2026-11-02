/**
 * The capacity Review step and its confirmation (design M15-05), shared by
 * the two capacity editors (storage-ops WarehouseCapacityScreen and
 * profile-settings WarehouseSettingsScreen) so neither can PATCH without the
 * admin having seen Current / New / Difference and confirmed. The figures come
 * from ./capacityReview.ts.
 */
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import type { CapacityReview } from './capacityReview';

export function CapacityReviewPanel({ review }: { review: CapacityReview }) {
  const rows = [
    { key: 'current', label: t('capacityChange.review.current'), value: review.currentLabel },
    { key: 'new', label: t('capacityChange.review.new'), value: review.newLabel },
    { key: 'difference', label: t('capacityChange.review.difference'), value: review.differenceLabel },
  ];
  return (
    <View style={styles.panel}>
      <Text style={styles.title} accessibilityRole="header">
        {t('capacityChange.review.title')}
      </Text>
      {rows.map((row, index) => (
        <View key={row.key} style={[styles.row, index > 0 && styles.rowDivider]}>
          <Text style={styles.label}>{row.label}</Text>
          <Text style={styles.value}>{row.value}</Text>
        </View>
      ))}
      {review.unchanged ? <Text style={styles.hint}>{t('capacityChange.review.unchangedHint')}</Text> : null}
    </View>
  );
}

/** "Update warehouse capacity?" with Cancel / Confirm; `onConfirm` sends the PATCH. */
export function confirmCapacityChange(review: CapacityReview, onConfirm: () => void): void {
  Alert.alert(t('capacityChange.confirm.title'), t('capacityChange.confirm.body', { current: review.currentLabel, next: review.newLabel }), [
    { text: t('capacityChange.action.cancel'), style: 'cancel' },
    { text: t('capacityChange.confirm.ok'), onPress: onConfirm },
  ]);
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    gap: adminSpacing.xs,
  },
  title: { ...adminType.sectionHead, color: adminColors.brandDeep, marginBottom: adminSpacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: adminSpacing.sm },
  rowDivider: { borderTopWidth: 1, borderTopColor: adminColors.border },
  label: { ...adminType.rowMeta, color: adminColors.muted },
  value: { ...adminType.rowTitle, color: adminColors.ink },
  hint: { ...adminType.rowMeta, color: adminColors.warning.text },
});
