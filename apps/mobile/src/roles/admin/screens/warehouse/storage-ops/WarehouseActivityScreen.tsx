/**
 * Warehouse Activity: the live activity feed, GET /warehouses/{id}/activity
 * (warehouse.activity.view, Sub own; BR-104), newest first, cursor-paged with
 * "Load more".
 *
 * The chips are exactly the API's event types (stock movements, goods
 * receipts, transfers, issues, returns, documents). The old Cash / QC /
 * Orders / Staff / Material chips and the free-text search are gone: the API
 * has no such types and no search, and filtering only the rows loaded so far
 * would hide matches on later pages. The Today preset sends today's IST date
 * as from/to. The CSV export was a fake alert and is not offered.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { ChipGroup, StatusBadge, WalletButton, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import { ACTIVITY_FILTERS, activityFilterLabel, type ActivityFilter, type ActivityRow } from './mappers';
import type { StorageWarehouse } from './StorageWarehouse';
import { useActivityList } from './useStorageData';
import type { ActivityPreset, WarehouseScreenBaseProps } from './types';

const PRESETS: readonly ActivityPreset[] = ['Today', 'All'];

export function activityPresetLabel(preset: ActivityPreset): string {
  return t(preset === 'Today' ? 'storageOps.activity.preset.today' : 'storageOps.activity.preset.all');
}

export interface WarehouseActivityScreenProps extends WarehouseScreenBaseProps {
  warehouse: StorageWarehouse;
  initialPreset?: ActivityPreset | undefined;
  onSelectActivity: (row: ActivityRow) => void;
}

/** One feed row; shared with the hub's Recent Activity. */
export function ActivityRowCard({ row, onPress }: { row: ActivityRow; onPress?: (() => void) | undefined }) {
  const meta = [row.reference, row.quantity, row.directionLabel].filter((v): v is string => v !== undefined).join(' · ');
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      disabled={onPress === undefined}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${row.typeLabel} ${row.reference}`}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardTitle}>{row.typeLabel}</Text>
        {row.statusLabel !== undefined ? <StatusBadge label={row.statusLabel} tone={row.statusTone} /> : null}
      </View>
      <Text style={styles.cardSubtitle}>{meta}</Text>
      <Text style={styles.cardTime}>{row.when}</Text>
    </TouchableOpacity>
  );
}

export function WarehouseActivityScreen({ onBack, warehouse, initialPreset = 'All', onSelectActivity }: WarehouseActivityScreenProps) {
  const [preset, setPreset] = useState<ActivityPreset>(initialPreset);
  const [filter, setFilter] = useState<ActivityFilter>('ALL');
  const list = useActivityList(warehouse.warehouseId, filter, preset);
  const view = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.items.length });

  return (
    <WalletScreen title={t('storageOps.activity.title')} onBack={onBack} headerExtra={warehouse.header}>
      {warehouse.placeholder ?? (
        <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
          <ChipGroup options={PRESETS} value={preset} onChange={setPreset} labelOf={activityPresetLabel} />
          <View style={styles.chips}>
            <ChipGroup options={ACTIVITY_FILTERS} value={filter} onChange={setFilter} labelOf={activityFilterLabel} />
          </View>
          {view === 'loading' ? <AdminLoadingState /> : null}
          {view === 'error' ? <AdminErrorState error={list.error} onRetry={list.refresh} /> : null}
          {view === 'empty' ? (
            <AdminEmptyState title={t('storageOps.activity.empty')} subtitle={t('storageOps.activity.emptyHint')} />
          ) : null}
          {view === 'ready' ? list.items.map((row) => <ActivityRowCard key={row.key} row={row} onPress={() => onSelectActivity(row)} />) : null}
          {view === 'ready' && list.hasMore ? (
            <WalletButton label={t('storageOps.loadMore')} variant="neutral" onPress={list.loadMore} />
          ) : null}
        </ScrollView>
      )}
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  chips: { marginTop: adminSpacing.sm, marginBottom: adminSpacing.md },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: adminSpacing.xs },
  cardTitle: { ...adminType.rowTitle, color: adminColors.ink, flex: 1 },
  cardSubtitle: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.xs },
  cardTime: { ...adminType.caption, color: adminColors.muted },
});
