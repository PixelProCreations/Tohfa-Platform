/**
 * Pieces shared by the stock count (M3S10-M3S12) and stock adjustment
 * (M3S13, M3S14, M3S17) screens, on the admin theme: the batch picker, the
 * picked-batch card, the system/counted/variance tiles and a list row.
 * Everything else comes from the wallet frame (WalletParts), as the
 * transfers screens do.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminSpacing, adminType, type AdminTone } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { EmptyState, InfoCard, KpiRow, StatusBadge, WalletButton } from '../wallet-cashtopup/WalletParts';
import type { BatchRow } from './types';

/** A batch's stock as text, or the shared "no value" mark. */
export function batchAvailableText(batch: Pick<BatchRow, 'availableGrams'>): string {
  return batch.availableGrams === null ? t('inventory.noValue') : formatKg(batch.availableGrams);
}

export interface BatchPickerProps {
  batches: readonly BatchRow[];
  selectedId: string | undefined;
  onSelect: (batch: BatchRow) => void;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  hasMore: boolean;
  onLoadMore: () => void;
}

/** The warehouse's ACTIVE batches as selectable rows (real batches only, never samples). */
export function BatchPicker({ batches, selectedId, onSelect, isLoading, error, onRetry, hasMore, onLoadMore }: BatchPickerProps) {
  const state = queryViewState({ isLoading, error, itemCount: batches.length });
  if (state === 'loading') return <AdminLoadingState />;
  if (state === 'error') return <AdminErrorState error={error} onRetry={onRetry} />;
  if (state === 'empty') return <EmptyState title={t('stockShared.batch.empty')} />;
  return (
    <View style={styles.card}>
      {batches.map((batch) => {
        const active = batch.id === selectedId;
        return (
          <TouchableOpacity
            key={batch.id}
            style={[styles.pickRow, active && styles.pickRowActive]}
            onPress={() => onSelect(batch)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <View style={styles.flex}>
              <Text style={styles.rowTitle}>{batch.batchCode}</Text>
              <Text style={styles.rowMeta}>{t('inventory.product.label', { product: batch.productName, grade: batch.gradeLabel })}</Text>
            </View>
            <Text style={styles.rowTitle}>{batchAvailableText(batch)}</Text>
          </TouchableOpacity>
        );
      })}
      {hasMore ? <WalletButton label={t('stockShared.loadMore')} variant="outline" onPress={onLoadMore} /> : null}
    </View>
  );
}

/** The picked batch: code, product, storage location and what the shelf holds now. */
export function BatchSummaryCard({ batch }: { batch: BatchRow }) {
  return (
    <InfoCard
      rows={[
        [
          { label: t('stockShared.field.batch'), value: batch.batchCode },
          { label: t('stockShared.field.product'), value: t('inventory.product.label', { product: batch.productName, grade: batch.gradeLabel }) },
        ],
        [
          { label: t('stockShared.field.location'), value: batch.storageLocation ?? t('inventory.noValue') },
          { label: t('stockShared.field.available'), value: batchAvailableText(batch) },
        ],
      ]}
    />
  );
}

/** System, counted and variance tiles; the variance in danger/success tone. */
export function VarianceTiles({
  systemText,
  countedText,
  varianceText,
  varianceGrams,
}: {
  systemText: string;
  countedText: string;
  varianceText: string;
  varianceGrams: number | null;
}) {
  const tone: AdminTone | undefined =
    varianceGrams === null ? undefined : varianceGrams === 0 ? 'success' : varianceGrams < 0 ? 'danger' : 'warning';
  const none = t('inventory.noValue');
  return (
    <KpiRow
      items={[
        { value: systemText || none, label: t('stockShared.tile.system') },
        { value: countedText || none, label: t('stockShared.tile.counted') },
        { value: varianceText || none, label: t('stockShared.tile.variance'), tone },
      ]}
    />
  );
}

/** One row of a count or adjustment list. */
export function StockListRow({
  title,
  meta,
  detail,
  badge,
  onPress,
}: {
  title: string;
  meta: string;
  detail?: string | undefined;
  badge: { label: string; tone: AdminTone };
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.listRow} onPress={onPress} activeOpacity={0.75} accessibilityRole="button">
      <View style={styles.listRowTop}>
        <Text style={[styles.rowTitle, styles.flex]}>{title}</Text>
        <StatusBadge label={badge.label} tone={badge.tone} />
      </View>
      <Text style={styles.rowMeta}>{meta}</Text>
      {detail ? <Text style={styles.rowDetail}>{detail}</Text> : null}
    </TouchableOpacity>
  );
}

/** A labelled multi-line input on the admin theme. */
export const stockStyles = StyleSheet.create({
  fieldLabel: { ...adminType.rowTitle, color: adminColors.muted, marginBottom: adminSpacing.xs, marginTop: adminSpacing.md },
  input: {
    ...adminType.body,
    color: adminColors.ink,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.md,
    padding: adminSpacing.md,
  },
  multiline: { minHeight: adminSpacing.xxl * 2, textAlignVertical: 'top' },
  error: { ...adminType.rowMeta, color: adminColors.danger.text, marginTop: adminSpacing.xs },
  actionsRow: { flexDirection: 'row', gap: adminSpacing.sm, marginTop: adminSpacing.md },
  link: { ...adminType.rowTitle, color: adminColors.brand },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginTop: adminSpacing.sm,
  },
  linkText: { ...adminType.sectionHead, color: adminColors.ink },
});

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.sm,
    marginTop: adminSpacing.sm,
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    padding: adminSpacing.md,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.card,
  },
  pickRowActive: { borderColor: adminColors.brand, backgroundColor: adminColors.brandTint },
  rowTitle: { ...adminType.rowTitle, color: adminColors.ink },
  rowMeta: { ...adminType.rowMeta, color: adminColors.muted },
  rowDetail: { ...adminType.body, color: adminColors.ink, marginTop: adminSpacing.xs },
  listRow: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginTop: adminSpacing.sm,
  },
  listRowTop: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm, marginBottom: adminSpacing.xs },
});
