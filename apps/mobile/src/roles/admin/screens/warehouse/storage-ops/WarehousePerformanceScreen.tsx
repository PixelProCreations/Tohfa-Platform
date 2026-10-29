/**
 * Warehouse Performance: throughput across the warehouses (Main only).
 *
 * Gate: the screen needs `warehouse.all.view` (MAIN all, SUB none).
 * StorageFlow refuses the route without it and the screen renders a
 * not-available note if opened directly.
 *
 * Server contract: performance deliberately carries no score, rate, SLA, target or
 * ranking (the data model has no column for them).
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { getWarehousePerformances } from '../../../api/dashboardFeeds';
import { t } from '../../../i18n';
import { formatKg, parseKgToGrams } from '../../../money/quantity';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import {
  ChipGroup,
  EmptyState,
  SectionHint,
  SectionTitle,
  WalletButton,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import { getIstDateRange } from '../reports/mappers';
import { STORAGE_CODES, TrendingUpIcon } from './StorageParts';
import type { PerformancePeriod, WarehouseScreenBaseProps } from './types';

const PERIODS: readonly PerformancePeriod[] = ['Today', 'This Week', 'This Month'];

export interface WarehousePerformanceScreenProps extends WarehouseScreenBaseProps {
  /** A warehouse card: the host opens that warehouse (by display name, as the Main shell keys it). */
  onSelectWarehouse?: ((warehouseName: string) => void) | undefined;
  onViewOperationsHistory?: (() => void) | undefined;
}

export function WarehousePerformanceScreen({
  can,
  onBack,
  onSelectWarehouse,
  onViewOperationsHistory,
}: WarehousePerformanceScreenProps) {
  const [period, setPeriod] = useState<PerformancePeriod>('Today');

  const canViewAll = can(STORAGE_CODES.allWarehousesView);

  const { options, isLoading: optionsLoading, error: optionsError, refresh: refetchOptions } = useWarehouseOptions({
    enabled: canViewAll,
    activeOnly: true,
  });

  const range = useMemo(() => {
    const periodKey = period === 'This Week' ? 'Week' : period === 'This Month' ? 'Month' : 'Today';
    return getIstDateRange(periodKey);
  }, [period]);

  const warehouseIds = useMemo(() => options.map((o) => o.warehouseId), [options]);

  const query = useAdminQuery(
    adminKeys.scoped('warehousePerformance', undefined, { from: range.from, to: range.to, count: warehouseIds.length }),
    (signal) => getWarehousePerformances(warehouseIds, range, signal),
    { enabled: canViewAll && warehouseIds.length > 0 },
  );

  if (!canViewAll) {
    return (
      <WalletScreen title={t('storageOps.performance.title')} onBack={onBack}>
        <EmptyState
          title={t('storageOps.performance.notAvailable.title')}
          subtitle={t('storageOps.performance.notAvailable.subtitle')}
        />
      </WalletScreen>
    );
  }

  const isLoading = optionsLoading || query.isPending;
  const error = optionsError ?? query.error;

  const performances = query.data ?? [];

  // Aggregates across warehouses
  const totals = useMemo(() => {
    let grossGrams = 0;
    let rejectedGrams = 0;
    let ordersPlaced = 0;
    let ordersFulfilled = 0;
    let returnsRequested = 0;

    for (const p of performances) {
      grossGrams += parseKgToGrams(p.receiving?.grossQtyKg ?? '0') ?? 0;
      rejectedGrams += parseKgToGrams(p.receiving?.rejectedQtyKg ?? '0') ?? 0;
      ordersPlaced += p.orders?.placed ?? 0;
      ordersFulfilled += p.orders?.fulfilled ?? 0;
      returnsRequested += p.returns?.requested ?? 0;
    }

    return {
      receiptsGross: formatKg(grossGrams),
      receiptsRejected: formatKg(rejectedGrams),
      ordersRatio: `${ordersFulfilled}/${ordersPlaced}`,
      returnsCount: String(returnsRequested),
    };
  }, [performances]);

  return (
    <WalletScreen
      title={t('storageOps.performance.title')}
      subtitle={t('storageOps.performance.subtitle')}
      onBack={onBack}
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <ChipGroup options={PERIODS} value={period} onChange={setPeriod} />

        {isLoading ? (
          <AdminLoadingState />
        ) : error ? (
          <AdminErrorState
            error={error}
            onRetry={() => {
              refetchOptions();
              void query.refetch();
            }}
          />
        ) : performances.length === 0 ? (
          <AdminEmptyState
            title={t('storageOps.performance.empty')}
            subtitle={t('storageOps.performance.emptyHint')}
          />
        ) : (
          <>
            <View style={styles.metricsGridCard}>
              <View style={styles.twoByTwoRow}>
                <View style={styles.twoByTwoCol}>
                  <Text style={styles.twoByTwoLabel}>{t('storageOps.performance.receipts')}</Text>
                  <Text style={styles.twoByTwoVal}>{totals.receiptsGross}</Text>
                </View>
                <View style={styles.twoByTwoCol}>
                  <Text style={styles.twoByTwoLabel}>{t('storageOps.performance.orders')}</Text>
                  <Text style={styles.twoByTwoVal}>{totals.ordersRatio}</Text>
                </View>
              </View>
              <View style={[styles.twoByTwoRow, { marginTop: adminSpacing.lg }]}>
                <View style={styles.twoByTwoCol}>
                  <Text style={styles.twoByTwoLabel}>{t('storageOps.performance.rejected')}</Text>
                  <Text style={styles.twoByTwoVal}>{totals.receiptsRejected}</Text>
                </View>
                <View style={styles.twoByTwoCol}>
                  <Text style={styles.twoByTwoLabel}>{t('storageOps.performance.returns')}</Text>
                  <Text style={styles.twoByTwoVal}>{totals.returnsCount}</Text>
                </View>
              </View>
            </View>

            <SectionTitle
              right={
                <SectionHint>
                  {t('storageOps.performance.hubsMonitored', { count: performances.length })}
                </SectionHint>
              }
            >
              {t('storageOps.performance.hubBreakdown')}
            </SectionTitle>

            {performances.map((wh) => {
              const opt = options.find((o) => o.warehouseId === wh.warehouseId);
              const name = opt ? opt.warehouseName : wh.warehouseId;
              const inboundKg = formatKg(parseKgToGrams(wh.receiving?.grossQtyKg ?? '0') ?? 0);
              const ordersText = `${wh.orders?.fulfilled ?? 0}/${wh.orders?.placed ?? 0}`;
              const rejectedKg = formatKg(parseKgToGrams(wh.receiving?.rejectedQtyKg ?? '0') ?? 0);

              return (
                <TouchableOpacity
                  key={wh.warehouseId}
                  style={styles.whCard}
                  onPress={() => onSelectWarehouse?.(name)}
                  disabled={onSelectWarehouse === undefined}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={name}
                >
                  <View style={styles.whHead}>
                    <Text style={styles.whTitle}>{name}</Text>
                  </View>
                  <View style={styles.statsRow}>
                    <View style={styles.stat}>
                      <Text style={styles.statLabel}>{t('storageOps.performance.inbound')}</Text>
                      <Text style={styles.statValue}>{inboundKg}</Text>
                    </View>
                    <View style={[styles.stat, styles.statDivider]}>
                      <Text style={styles.statLabel}>{t('storageOps.performance.orders')}</Text>
                      <Text style={styles.statValue}>{ordersText}</Text>
                    </View>
                    <View style={[styles.stat, styles.statDivider]}>
                      <Text style={styles.statLabel}>{t('storageOps.performance.rejected')}</Text>
                      <Text style={styles.statValue}>{rejectedKg}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {onViewOperationsHistory ? (
              <WalletButton
                label={t('storageOps.performance.operationsLog')}
                variant="outline"
                icon={<TrendingUpIcon />}
                onPress={onViewOperationsHistory}
              />
            ) : null}
          </>
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  whCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  whHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: adminSpacing.md },
  whTitle: { ...adminType.sectionHead, color: adminColors.ink, flex: 1, marginRight: adminSpacing.sm },
  statsRow: { flexDirection: 'row', marginTop: adminSpacing.xs },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { borderLeftWidth: 1, borderLeftColor: adminColors.border },
  statLabel: { ...adminType.caption, color: adminColors.muted },
  statValue: { ...adminType.sectionHead, color: adminColors.ink, marginTop: 2 },
  metricsGridCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  twoByTwoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  twoByTwoCol: {
    flex: 1,
  },
  twoByTwoLabel: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  twoByTwoVal: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
  },
});
