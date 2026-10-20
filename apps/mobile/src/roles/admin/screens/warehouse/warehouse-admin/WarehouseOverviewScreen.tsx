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
import React from 'react';
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
import { adminWarehouseLabel, WAREHOUSE_ADMIN_ROWS } from './fixtures';
import {
  GearIcon,
  RefreshIcon,
  ScaleIcon,
  TrendIcon,
  utilizationPercent,
  WAREHOUSE_ADMIN_CODES,
} from './WarehouseAdminParts';
import type { WarehouseAdminRow, WarehouseScreenBaseProps } from './types';

export interface WarehouseOverviewScreenProps extends WarehouseScreenBaseProps {
  warehouses?: readonly WarehouseAdminRow[] | undefined;
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
  warehouses = WAREHOUSE_ADMIN_ROWS,
  onSelectWarehouse,
  onNavigateComparison,
  onNavigatePerformance,
  onNavigateCapacitySummary,
  onManageWarehouses,
}: WarehouseOverviewScreenProps) {
  if (!can(WAREHOUSE_ADMIN_CODES.allView)) {
    return (
      <WalletScreen title="Warehouse Overview" onBack={onBack}>
        <EmptyState title="Not available" subtitle="The all-warehouses overview needs warehouse.all.view." />
      </WalletScreen>
    );
  }

  return (
    <WalletScreen
      title="Warehouse Overview"
      subtitle={`All ${warehouses.length} warehouses at a glance`}
      onBack={onBack}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {warehouses.map((w) => {
          const pct = utilizationPercent(w.stockKg, w.capacityKg);
          // Ooty (82%) and Kotagiri (74%) are amber/warning tones; Coonoor (68%) and Gudalur (61%) are green/teal tones
          const isAmber = pct >= 70;
          const barColor = isAmber ? adminColors.warning.text : adminColors.success.text;
          const pillBg = isAmber ? adminColors.warning.bg : adminColors.success.bg;
          const pillText = isAmber ? adminColors.warning.text : adminColors.success.text;

          return (
            <TouchableOpacity
              key={w.warehouseId}
              style={styles.card}
              onPress={() => onSelectWarehouse?.(w.warehouseId)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${adminWarehouseLabel(w.warehouseId)} warehouse`}
            >
              {/* Header row: Warehouse Name on left, capacity badge on right */}
              <View style={styles.cardHeaderRow}>
                <Text style={styles.whName}>{adminWarehouseLabel(w.warehouseId)}</Text>
                <View style={[styles.badge, { backgroundColor: pillBg }]}>
                  <Text style={[styles.badgeText, { color: pillText }]}>{`${pct}% capacity`}</Text>
                </View>
              </View>

              {/* Progress bar directly beneath header */}
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: barColor }]} />
              </View>

              {/* 3 stats columns: Stock, Receipts, Issues */}
              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Stock</Text>
                  <Text style={styles.statValue}>{formatKgUpper(w.stockKg)}</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Receipts</Text>
                  <Text style={styles.statValue}>{formatKgUpper(w.receiptsTodayKg)}</Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Issues</Text>
                  <Text style={styles.statValue}>{String(w.openIssues)}</Text>
                </View>
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

function formatKgUpper(kg: number): string {
  return `${kg.toLocaleString('en-IN')} KG`;
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
    ...adminType.rowTitle,
    fontSize: 18,
    color: adminColors.ink,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: adminRadius.md,
  },
  badgeText: {
    ...adminType.caption,
    fontSize: 11,
    fontWeight: '700',
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
    fontSize: 11,
    fontWeight: '500',
    color: adminColors.muted,
    marginBottom: 4,
  },
  statValue: {
    ...adminType.rowTitle,
    fontSize: 15,
    color: adminColors.ink,
  },
  sectionTitle: {
    ...adminType.sectionHead,
    fontSize: 15,
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
    fontSize: 13,
    color: adminColors.ink,
    textAlign: 'center',
  },
});
