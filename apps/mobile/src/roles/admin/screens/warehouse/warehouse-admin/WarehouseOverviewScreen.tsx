// Design id: M1-S05 (Main side; the Sub single-warehouse dashboard is dashboard-home-more/WarehouseSnapshotScreen, a different screen)
/**
 * Warehouse Overview: all four warehouses at a glance, plus the warehouse
 * management the Main admin used to reach through three other screens.
 *
 * Gate (FINAL_LIST 157): Main-only. The screen needs `warehouse.all.view`
 * (MAIN all, SUB none); without it a not-available note renders and
 * WarehouseAdminFlow refuses the route. The 'Manage Warehouses' tile (per-
 * warehouse configuration: low-stock trigger, operating hours, staff, SWA and
 * the Settings / View Hub / Capacity actions) and the Manage SWAs tile need
 * `admin.sub_wh_admin.create`; Settings also needs `warehouse.capacity.set`.
 *
 * Absorbs: MainWarehouseAdminScreen (summary counts, Needs Attention, the
 * Manage SWAs / Warehouse List quick actions), MainWarehouseListScreen
 * (search) and ManageWarehousesScreen (filters, per-warehouse management
 * cards). Dropped: 'Add Warehouse' and 'Provision New Warehouse Hub' (BR-23:
 * four fixed warehouses, no create endpoint or code; SPEC_GAPS W4x-1).
 */
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  adminColors,
  adminRadius,
  adminShadow,
  adminSpacing,
  adminType,
} from '../../../theme';
import {
  EmptyState,
  WalletScreen,
} from '../wallet-cashtopup/WalletParts';
import { t } from '../../../i18n';
import { istDay } from '../../../utils/datetime';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  combineStatus,
  deriveCapacityRows,
  deriveOpenIssues,
  deriveReceiptFigures,
  sectionStatus,
  toOverviewCards,
  type SectionStatus,
} from '../../dashboard/mappers_mainDashboard';
import { nearFullSignalOf, type CapacityTone } from './overviewFigures';
import { useWarehouseNetwork } from './useWarehouseNetwork';
import {
  GearIcon,
  RefreshIcon,
  ScaleIcon,
  TrendIcon,
  WAREHOUSE_ADMIN_CODES,
} from './WarehouseAdminParts';
import type { WarehouseScreenBaseProps } from './types';

/**
 * Card colours per capacity tone. Near full is the server's CAPACITY_NEAR_FULL
 * alert (overviewFigures.ts), never a client percentage; "neutral" keeps the
 * design's green, "over" (available below zero, BR-66b) the danger tone.
 */
const TONE_COLORS: Record<CapacityTone, { bar: string; pillBg: string; pillText: string }> = {
  neutral: { bar: adminColors.success.text, pillBg: adminColors.success.bg, pillText: adminColors.success.text },
  nearFull: { bar: adminColors.warning.text, pillBg: adminColors.warning.bg, pillText: adminColors.warning.text },
  over: { bar: adminColors.danger.text, pillBg: adminColors.danger.bg, pillText: adminColors.danger.text },
};

export interface WarehouseOverviewScreenProps extends WarehouseScreenBaseProps {
  onSelectWarehouse?: ((warehouseId: string) => void) | undefined;
  onOpenSettings?: ((warehouseId: string) => void) | undefined;
  onNavigateComparison?: (() => void) | undefined;
  onNavigatePerformance?: (() => void) | undefined;
  onNavigateCapacitySummary?: (() => void) | undefined;
  onManageWarehouses?: (() => void) | undefined;
  onManageSubWarehouseAdmins?: (() => void) | undefined;
}

export function WarehouseOverviewScreen({
  can,
  onBack,
  onSelectWarehouse,
  onNavigateComparison,
  onNavigatePerformance,
  onNavigateCapacitySummary,
  onManageWarehouses,
}: WarehouseOverviewScreenProps) {
  const canAllView = can(WAREHOUSE_ADMIN_CODES.allView);
  // Live network figures (D02): GET /warehouses, /warehouses/{id}/capacity, /admin/alerts,
  // /warehouses/{id}/issues and today's /admin/goods-receipts, shared with the Home dashboard's cache.
  const today = istDay(new Date());
  const net = useWarehouseNetwork({ can, enabled: canAllView, warehouseId: undefined, today });
  const capacityD = useMemo(
    () => (net.capacitiesQuery.data === undefined ? null : deriveCapacityRows(net.warehouses, net.capacitiesQuery.data)),
    [net.warehouses, net.capacitiesQuery.data],
  );
  const receiptsD = useMemo(
    () => (net.receiptsTodayQuery.data === undefined ? null : deriveReceiptFigures(net.receiptsTodayQuery.data.items)),
    [net.receiptsTodayQuery.data],
  );
  const issuesD = useMemo(
    () => (net.issuesQuery.data === undefined ? null : deriveOpenIssues(net.issuesQuery.data, net.coveredIds)),
    [net.issuesQuery.data, net.coveredIds],
  );
  const derivedStatus = (d: { ok: boolean } | null): SectionStatus => (d !== null && !d.ok ? 'error' : 'ready');
  const cardsStatus = combineStatus([
    sectionStatus(net.warehousesQuery),
    sectionStatus(net.capacitiesQuery),
    derivedStatus(capacityD),
  ]);
  const cardsError = net.warehousesQuery.error ?? net.capacitiesQuery.error;
  const retryCards = () => {
    void net.warehousesQuery.refetch();
    void net.capacitiesQuery.refetch();
  };
  // Cheap to rebuild, and it reads each query's live state, so it is not memoised.
  const cards =
      capacityD === null || !capacityD.ok
        ? []
        : toOverviewCards(
            capacityD.value.rows,
            nearFullSignalOf(net.alertsQuery.data),
            net.access.receipts
              ? {
                  status: combineStatus([sectionStatus(net.receiptsTodayQuery), derivedStatus(receiptsD)]),
                  grams: receiptsD !== null && receiptsD.ok ? receiptsD.value.grossGramsByWarehouse : {},
                  exact: net.receiptsTodayQuery.data?.complete ?? true,
                }
              : null,
            net.access.issues
              ? {
                  status: combineStatus([sectionStatus(net.issuesQuery), derivedStatus(issuesD)]),
                  byWarehouse: issuesD !== null && issuesD.ok ? issuesD.value.byWarehouse : {},
                }
              : null,
          );

  if (!canAllView) {
    return (
      <WalletScreen title="Warehouse Overview" onBack={onBack}>
        <EmptyState title="Not available" subtitle="The all-warehouses overview needs warehouse.all.view." />
      </WalletScreen>
    );
  }

  return (
    <WalletScreen
      title="Warehouse Overview"
      subtitle={net.warehousesQuery.data === undefined ? undefined : t('mainDashboard.overview.subtitle', { count: net.warehouses.length })}
      onBack={onBack}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {cardsStatus === 'loading' ? <AdminLoadingState /> : null}
        {cardsStatus === 'error' ? <AdminErrorState error={cardsError} onRetry={retryCards} /> : null}
        {cardsStatus === 'ready' && cards.length === 0 ? <EmptyState title={t('mainDashboard.overview.none')} /> : null}
        {cardsStatus === 'ready' && cards.map((w) => {
          const tone = TONE_COLORS[w.tone];

          return (
            <TouchableOpacity
              key={w.warehouseId}
              style={styles.card}
              onPress={() => onSelectWarehouse?.(w.warehouseId)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={w.name}
            >
              {/* Header row: Warehouse Name on left, capacity badge on right */}
              <View style={styles.cardHeaderRow}>
                <Text style={styles.whName}>{w.name}</Text>
                {w.capacityLabel !== null ? (
                  <View style={[styles.badge, { backgroundColor: tone.pillBg }]}>
                    <Text style={[styles.badgeText, { color: tone.pillText }]}>{w.capacityLabel}</Text>
                  </View>
                ) : null}
              </View>

              {/* Progress bar directly beneath header */}
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${w.barWidth}%`, backgroundColor: tone.bar }]} />
              </View>

              {/* 3 stats columns: Stock, Receipts, Issues */}
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Stock</Text>
                  <Text style={styles.statValue}>{w.stock}</Text>
                </View>
                {w.receipts !== null ? (
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>Receipts</Text>
                    <Text style={styles.statValue}>{w.receipts}</Text>
                  </View>
                ) : null}
                {w.issues !== null ? (
                  <View style={styles.statCol}>
                    <Text style={styles.statLabel}>Issues</Text>
                    <Text style={styles.statValue}>{w.issues}</Text>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* More Views Section Header */}
        <Text style={styles.sectionTitle}>More Views</Text>

        {/* 2x2 Grid of Views */}
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.tile}
            onPress={onNavigateComparison}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Comparison"
          >
            <ScaleIcon size={26} color={adminColors.brand} />
            <Text style={styles.tileLabel}>Comparison</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tile}
            onPress={onNavigatePerformance}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Performance"
          >
            <TrendIcon size={26} color={adminColors.brand} />
            <Text style={styles.tileLabel}>Performance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tile}
            onPress={onNavigateCapacitySummary}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Capacity Summary"
          >
            <RefreshIcon size={26} color={adminColors.brand} />
            <Text style={styles.tileLabel}>Capacity Summary</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tile}
            onPress={onManageWarehouses}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Manage Warehouses"
          >
            <GearIcon size={26} color={adminColors.brand} />
            <Text style={styles.tileLabel}>Manage Warehouses</Text>
          </TouchableOpacity>
        </View>
        <View style={{ height: adminSpacing.xl }} />
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xxl,
  },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 16,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  whName: {
    ...adminType.title,
    color: adminColors.ink,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: adminRadius.md,
  },
  badgeText: {
    ...adminType.caption,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: adminColors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 4,
  },
  statValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.brandDeep,
    marginTop: 8,
    marginBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  tile: {
    width: '48%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 22,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...adminShadow.sm,
  },
  tileLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    textAlign: 'center',
  },
});
