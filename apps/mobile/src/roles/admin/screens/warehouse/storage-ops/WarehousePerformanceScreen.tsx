/**
 * Warehouse Performance, live from GET /warehouses/{id}/performance?from&to
 * (warehouse.all.view: Main, Super, Tohfa; a Sub admin does not hold it and
 * StorageFlow refuses the route; BR-80), for one warehouse picked in the
 * header and an IST date range (today, last 7 or last 30 days).
 *
 * It shows only the exact counts and kg sums the API returns: orders placed /
 * fulfilled / cancelled, goods receipts with gross / accepted / rejected kg,
 * return requests and stock-ledger movements per type, plus the warehouse's
 * capacity utilisation (GET .../capacity). The old SLA, putaway time,
 * accuracy, efficiency scores, hub ranking and Top Performing Staff were
 * example data: the API defines none of them, so they are gone.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { ChipGroup, SectionTitle, WalletButton, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import {
  PERFORMANCE_PERIOD_LABEL,
  PERFORMANCE_PERIODS,
  performanceRange,
  toCapacityView,
  toPerformanceView,
  type PerformancePeriodCode,
} from './mappers';
import { ProgressBar, STORAGE_CODES, TrendingUpIcon } from './StorageParts';
import type { StorageWarehouse } from './StorageWarehouse';
import { useCapacity, usePerformance } from './useStorageData';
import type { WarehouseScreenBaseProps } from './types';

export interface WarehousePerformanceScreenProps extends WarehouseScreenBaseProps {
  warehouse: StorageWarehouse;
  /** The warehouse card: the host opens that warehouse (by display name, as the Main shell keys it). */
  onSelectWarehouse?: ((warehouseName: string) => void) | undefined;
  onViewOperationsHistory?: (() => void) | undefined;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export function WarehousePerformanceScreen({
  can,
  onBack,
  warehouse,
  onSelectWarehouse,
  onViewOperationsHistory,
}: WarehousePerformanceScreenProps) {
  const [period, setPeriod] = useState<PerformancePeriodCode>('TODAY');
  const allowed = can(STORAGE_CODES.allWarehousesView);
  const range = performanceRange(period, new Date());
  const performance = usePerformance(warehouse.warehouseId, range, allowed);
  const capacity = useCapacity(allowed ? warehouse.warehouseId : undefined);

  if (!allowed) {
    return (
      <WalletScreen title={t('storageOps.performance.title')} onBack={onBack}>
        <AdminEmptyState title={t('storageOps.performance.notAvailable')} subtitle={t('storageOps.performance.notAvailableHint')} />
      </WalletScreen>
    );
  }

  const data = performance.performance === undefined ? undefined : toPerformanceView(performance.performance);
  const cap = capacity.capacity === undefined ? undefined : toCapacityView(capacity.capacity);
  const name = warehouse.warehouseName;

  return (
    <WalletScreen title={t('storageOps.performance.title')} onBack={onBack} headerExtra={warehouse.header}>
      {warehouse.placeholder ?? (
        <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
          <ChipGroup options={PERFORMANCE_PERIODS} value={period} onChange={setPeriod} labelOf={(p) => t(PERFORMANCE_PERIOD_LABEL[p])} />
          <Text style={styles.muted}>{t('storageOps.performance.range', { from: range.from, to: range.to })}</Text>

          {cap !== undefined ? (
            <TouchableOpacity
              style={styles.card}
              onPress={() => (name !== undefined ? onSelectWarehouse?.(name) : undefined)}
              disabled={onSelectWarehouse === undefined || name === undefined}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <View style={styles.head}>
                <Text style={styles.title}>{t('storageOps.performance.utilization')}</Text>
                <Text style={styles.title}>{cap.utilizationLabel ?? t('storageOps.location.capacityNotSet')}</Text>
              </View>
              {cap.utilizationPercent !== null ? (
                <ProgressBar percent={cap.utilizationPercent} tone={cap.overCapacity ? 'danger' : 'brand'} />
              ) : null}
              <Text style={styles.muted}>
                {t('storageOps.performance.capacityLine', { used: cap.used, capacity: cap.capacity ?? t('storageOps.location.capacityNotSet') })}
              </Text>
            </TouchableOpacity>
          ) : null}

          {data === undefined ? (
            performance.isLoading ? (
              <AdminLoadingState />
            ) : (
              <AdminErrorState error={performance.error} onRetry={performance.refresh} />
            )
          ) : (
            <>
              <SectionTitle>{t('storageOps.performance.orders')}</SectionTitle>
              <View style={styles.statsRow}>
                <Stat label={t('storageOps.performance.placed')} value={String(data.ordersPlaced)} />
                <Stat label={t('storageOps.performance.fulfilled')} value={String(data.ordersFulfilled)} />
                <Stat label={t('storageOps.performance.cancelled')} value={String(data.ordersCancelled)} />
              </View>

              <SectionTitle>{t('storageOps.performance.receiving')}</SectionTitle>
              <View style={styles.statsRow}>
                <Stat label={t('storageOps.performance.receipts')} value={String(data.goodsReceipts)} />
                <Stat label={t('storageOps.performance.gross')} value={data.grossReceived} />
              </View>
              <View style={styles.statsRow}>
                <Stat label={t('storageOps.performance.accepted')} value={data.accepted} />
                <Stat label={t('storageOps.performance.rejected')} value={data.rejected} />
              </View>

              <SectionTitle>{t('storageOps.performance.returns')}</SectionTitle>
              <View style={styles.statsRow}>
                <Stat label={t('storageOps.performance.requested')} value={String(data.returnsRequested)} />
              </View>

              <SectionTitle>{t('storageOps.performance.movements')}</SectionTitle>
              {data.movements.length === 0 ? (
                <Text style={styles.muted}>{t('storageOps.performance.noMovements')}</Text>
              ) : (
                <View style={styles.card}>
                  {data.movements.map((m) => (
                    <View key={m.type} style={styles.head}>
                      <Text style={styles.body}>{t('storageOps.performance.movementLine', { label: m.label, entries: m.entries })}</Text>
                      <Text style={styles.body}>{m.quantity}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {onViewOperationsHistory ? (
            <WalletButton label={t('storageOps.performance.history')} variant="outline" icon={<TrendingUpIcon />} onPress={onViewOperationsHistory} />
          ) : null}
        </ScrollView>
      )}
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginVertical: adminSpacing.sm,
    gap: adminSpacing.sm,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: adminSpacing.sm },
  title: { ...adminType.sectionHead, color: adminColors.ink },
  body: { ...adminType.body, color: adminColors.ink },
  muted: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  statsRow: { flexDirection: 'row', gap: adminSpacing.sm, marginBottom: adminSpacing.sm },
  stat: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  statLabel: { ...adminType.caption, color: adminColors.muted },
  statValue: { ...adminType.kpiValue, color: adminColors.ink },
});
