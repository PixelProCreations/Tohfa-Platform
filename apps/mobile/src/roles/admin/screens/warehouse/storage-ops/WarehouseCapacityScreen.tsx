/**
 * Warehouse Capacity: storage capacity and occupancy, per location.
 *
 * Gate (FINAL_LIST 140): no rbac code covers viewing capacity (SPEC_GAPS
 * W4u-4), so the screen is view-only for everyone and scope-locked. Nothing is
 * edited here: the capacity edit lives in profile-settings Warehouse Settings,
 * and the "Manage Capacity Limits" link to it shows only with
 * `warehouse.capacity.set` (MAIN all, SUB none) and a host handler.
 *
 * Absorbs Main WarehouseCapacityScreen (pair M4-S07): the occupied / available
 * share, the Warehouse Comparison card (only for the all-warehouses view,
 * scope.warehouseId undefined, with `warehouse.all.view`) and View Capacity
 * History (host). Sub's location list stays for both roles; Main gets the
 * warehouse selector. A location reads 'Occupied' at or above its warehouse's
 * capacity-alert level (warehouse data, not a screen constant) and
 * 'Unavailable' when inactive.
 */
// Design id: M4-S07
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import {
  Card,
  ChipGroup,
  EmptyState,
  InfoNote,
  isAllWarehouses,
  KpiRow,
  LockIcon,
  ScopeHeader,
  SearchBar,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { StatusMetricCard } from '../../../components';
import { capacityAlertPercentOf, locationsInScope, STORAGE_LOCATIONS, STORAGE_WAREHOUSES, storageWarehouseName } from './fixtures';
import { formatKg, HistoryIcon, occupancyPercent, ProgressBar, STORAGE_CODES, WarehouseIcon } from './StorageParts';
import type { CapacityFilter, CapacityState, StorageLocationItem, WarehouseScreenBaseProps } from './types';

function SnowflakeIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M12 6l-2-2m4 0l-2 2M12 18l-2 2m4 0l-2-2M6 12l-2-2m0 4l2-2M18 12l2-2m0 4l-2-2" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function StorageBoxIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M3 10h18M10 14h4" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function LayersIcon({ size = 18, color = adminColors.brand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const FILTERS: readonly CapacityFilter[] = ['All', 'Available', 'Occupied', 'Unavailable'];

const MWA_COMPARISON_ROWS = [
  { name: 'Ooty', percent: '68%' },
  { name: 'Coonoor', percent: '72%' },
  { name: 'Kotagiri', percent: '54%' },
  { name: 'Gudalur Market', percent: '61%' },
];

const STORAGE_AREA_ROWS = [
  { name: 'Cold Storage', percent: '68%' },
  { name: 'Dry Storage', percent: '52%' },
  { name: 'Material Storage', percent: '41%' },
];

const LOCATION_CAPACITY_ROWS = [
  { name: 'Cold Storage · Section A', percent: '72%' },
  { name: 'Cold Storage · Section B', percent: '58%' },
];

const STATE_TONE: Record<CapacityState, 'success' | 'warning' | 'danger'> = {
  Available: 'success',
  Occupied: 'warning',
  Unavailable: 'danger',
};

/** Capacity state of a location: inactive = Unavailable; at/above the warehouse alert level = Occupied. */
export function capacityStateOf(location: StorageLocationItem): CapacityState {
  if (location.status !== 'Active') return 'Unavailable';
  const alertAt = capacityAlertPercentOf(location.warehouseId);
  const percent = occupancyPercent(location.currentKg, location.capacityKg);
  return alertAt !== undefined && percent >= alertAt ? 'Occupied' : 'Available';
}

function totals(locations: readonly StorageLocationItem[]) {
  const capacityKg = locations.reduce((sum, l) => sum + l.capacityKg, 0);
  const currentKg = locations.reduce((sum, l) => sum + l.currentKg, 0);
  return { capacityKg, currentKg, percent: occupancyPercent(currentKg, capacityKg) };
}

export interface WarehouseCapacityScreenProps extends WarehouseScreenBaseProps {
  locations?: readonly StorageLocationItem[] | undefined;
  /** View Capacity History (host: warehouse activity). */
  onViewHistory?: (() => void) | undefined;
  /** Manage Capacity Limits (host: Warehouse Settings); shown only with warehouse.capacity.set. */
  onManageCapacity?: (() => void) | undefined;
}

export function WarehouseCapacityScreen({
  scope,
  can,
  onBack,
  locations = STORAGE_LOCATIONS,
  onViewHistory,
  onManageCapacity,
}: WarehouseCapacityScreenProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CapacityFilter>('All');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);

  const allWarehouses = isAllWarehouses(scope);
  const scoped = useMemo(() => locationsInScope(scope, selectedWarehouseId, locations), [scope, selectedWarehouseId, locations]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return scoped.filter(
      (l) =>
        (filter === 'All' || capacityStateOf(l) === filter) &&
        (q === '' || l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)),
    );
  }, [scoped, filter, query]);

  const sum = totals(scoped);
  const showComparison = allWarehouses && selectedWarehouseId === undefined && can(STORAGE_CODES.allWarehousesView);
  const comparison = STORAGE_WAREHOUSES.filter((w) => w.warehouseId !== undefined).map((w) => ({
    warehouseId: w.warehouseId as string,
    ...totals(locations.filter((l) => l.warehouseId === w.warehouseId)),
  }));
  const canManageCapacity = can(STORAGE_CODES.capacitySet) && onManageCapacity !== undefined;

  return (
    <WalletScreen
      title="Warehouse Capacity"
      onBack={onBack}
      headerExtra={
        allWarehouses ? undefined : (
          <ScopeHeader
            scope={scope}
            label={scope.warehouseName}
            warehouseOptions={STORAGE_WAREHOUSES}
            selectedWarehouseId={selectedWarehouseId}
            onSelectWarehouse={setSelectedWarehouseId}
          />
        )
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {allWarehouses ? (
          <>
            <View style={styles.mwaSummaryCard}>
              <View style={styles.mwaSummaryRow}>
                <View style={styles.mwaSummaryCol}>
                  <Text style={styles.mwaSummaryLabel}>Occupied</Text>
                  <Text style={styles.mwaSummaryValue}>68%</Text>
                </View>
                <View style={styles.mwaSummaryCol}>
                  <Text style={styles.mwaSummaryLabel}>Available</Text>
                  <Text style={styles.mwaSummaryValue}>32%</Text>
                </View>
              </View>
              <View style={styles.mwaStatusGroup}>
                <Text style={styles.mwaSummaryLabel}>Status</Text>
                <Text style={styles.mwaStatusValue}>Operational</Text>
              </View>
            </View>

            <SectionTitle>Warehouse Comparison</SectionTitle>
            <Card>
              {MWA_COMPARISON_ROWS.map((row, index) => (
                <View key={row.name} style={[styles.tableRow, index > 0 && styles.tableRowDivider]}>
                  <Text style={styles.tableRowName}>{row.name}</Text>
                  <Text style={styles.tableRowValue}>{row.percent}</Text>
                </View>
              ))}
            </Card>

            <SectionTitle
              right={
                <TouchableOpacity onPress={onViewHistory} accessibilityRole="button">
                  <Text style={styles.link}>View →</Text>
                </TouchableOpacity>
              }
            >
              Storage Area Capacity
            </SectionTitle>
            <Card>
              {STORAGE_AREA_ROWS.map((row, index) => (
                <View key={row.name} style={[styles.tableRow, index > 0 && styles.tableRowDivider]}>
                  <Text style={styles.tableRowName}>{row.name}</Text>
                  <Text style={styles.tableRowValue}>{row.percent}</Text>
                </View>
              ))}
            </Card>

            <SectionTitle
              right={
                <TouchableOpacity onPress={onViewHistory} accessibilityRole="button">
                  <Text style={styles.link}>View →</Text>
                </TouchableOpacity>
              }
            >
              Location Capacity
            </SectionTitle>
            <Card>
              {LOCATION_CAPACITY_ROWS.map((row, index) => (
                <View key={row.name} style={[styles.tableRow, index > 0 && styles.tableRowDivider]}>
                  <Text style={styles.tableRowName}>{row.name}</Text>
                  <Text style={styles.tableRowValue}>{row.percent}</Text>
                </View>
              ))}
            </Card>

            {canManageCapacity ? (
              <View style={styles.historyButton}>
                <WalletButton label="Manage Capacity Limits" variant="outline" onPress={() => onManageCapacity?.()} />
              </View>
            ) : null}
          </>
        ) : (
          <>
            <View style={styles.kpiRow}>
              <StatusMetricCard
                icon="box"
                value={`${sum.percent}%`}
                label="OCCUPIED"
              />
              <StatusMetricCard
                icon="check"
                value={`${100 - sum.percent}%`}
                label="AVAILABLE"
                tone="success"
              />
            </View>

            {showComparison ? (
              <>
                <SectionTitle>Warehouse Comparison</SectionTitle>
                <Card>
                  {comparison.map((row, index) => (
                    <View key={row.warehouseId} style={[styles.compareRow, index > 0 && styles.compareRowDivider]}>
                      <View style={styles.compareHead}>
                        <Text style={styles.compareName}>{storageWarehouseName(row.warehouseId)}</Text>
                        <Text style={styles.compareValue}>{row.percent}%</Text>
                      </View>
                      <ProgressBar percent={row.percent} />
                    </View>
                  ))}
                </Card>
              </>
            ) : null}

            <SectionTitle>Storage Locations</SectionTitle>
            <View style={styles.kpiRow}>
              <StatusMetricCard
                icon="inventory"
                value={formatKg(sum.capacityKg)}
                label="STORAGE TOTAL"
              />
              <StatusMetricCard
                icon="check"
                value={formatKg(Math.max(0, sum.capacityKg - sum.currentKg))}
                label="AVAILABLE CAPACITY"
                tone="success"
              />
            </View>
            <View style={styles.searchWrap}>
              <SearchBar value={query} onChangeText={setQuery} placeholder="Search storage locations..." />
            </View>
            <View style={styles.chipsWrap}>
              <ChipGroup options={FILTERS} value={filter} onChange={setFilter} />
            </View>

            {visible.length === 0 ? (
              <EmptyState title="No storage locations found" subtitle="Try another filter or search." />
            ) : (
              <View style={styles.cardsList}>
                {visible.map((loc) => {
                  const state = capacityStateOf(loc);
                  const percent = occupancyPercent(loc.currentKg, loc.capacityKg);
                  const isCold = loc.name.toLowerCase().includes('cold');
                  const isDry = loc.name.toLowerCase().includes('dry');
                  const isBulk = loc.name.toLowerCase().includes('bulk');

                  const iconBg = isCold
                    ? adminColors.info.bg
                    : isDry
                      ? adminColors.warning.bg
                      : isBulk
                        ? adminColors.purple.bg
                        : adminColors.brandTint;

                  const iconColor = isCold
                    ? adminColors.info.text
                    : isDry
                      ? adminColors.warning.text
                      : isBulk
                        ? adminColors.purple.text
                        : adminColors.brand;

                  const progressColor =
                    state === 'Unavailable'
                      ? adminColors.danger.text
                      : percent >= 85
                        ? adminColors.danger.text
                        : percent >= 65
                          ? adminColors.warning.text
                          : adminColors.success.text;

                  return (
                    <View key={loc.id} style={styles.locationCard}>
                      <View style={styles.locationHeaderRow}>
                        <View style={[styles.locationIconBox, { backgroundColor: iconBg }]}>
                          {isCold ? (
                            <SnowflakeIcon size={20} color={iconColor} />
                          ) : isDry ? (
                            <StorageBoxIcon size={20} color={iconColor} />
                          ) : isBulk ? (
                            <LayersIcon size={20} color={iconColor} />
                          ) : (
                            <WarehouseIcon size={20} color={iconColor} />
                          )}
                        </View>
                        <View style={styles.locationHeaderInfo}>
                          <Text style={styles.locationName}>{loc.name}</Text>
                          <Text style={styles.locationCode}>Code: {loc.code}</Text>
                        </View>
                        <StatusBadge label={state} tone={STATE_TONE[state]} />
                      </View>

                      <View style={styles.capacityMetaRow}>
                        <Text style={styles.capacityMetaWeight}>
                          <Text style={styles.weightCurrent}>{formatKg(loc.currentKg)}</Text>
                          <Text style={styles.weightTotal}> / {formatKg(loc.capacityKg)}</Text>
                        </Text>
                        <Text style={[styles.capacityMetaPercent, { color: progressColor }]}>
                          {percent}% occupied
                        </Text>
                      </View>

                      <View style={styles.progressBarTrack}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${Math.min(100, Math.max(2, percent))}%`,
                              backgroundColor: progressColor,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {canManageCapacity ? (
              <WalletButton label="Manage Capacity Limits" variant="outline" onPress={() => onManageCapacity?.()} />
            ) : allWarehouses ? (
              <InfoNote tone="warning" icon={<LockIcon size={16} color={adminColors.warning.text} />}>
                View only. Locations are scoped to your assigned warehouse — No capacity editing, storage configuration, or
                quantity allocation here.
              </InfoNote>
            ) : null}
            {onViewHistory ? (
              <TouchableOpacity style={styles.historyBtn} onPress={onViewHistory} accessibilityRole="button">
                <HistoryIcon size={18} color={adminColors.ink} />
                <Text style={styles.historyBtnText}>View Capacity History</Text>
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  mwaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.success.bg,
    borderWidth: 1,
    borderColor: adminColors.success.border,
    borderRadius: adminRadius.lg,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  mwaBannerText: {
    flex: 1,
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.success.text,
    lineHeight: 18,
  },
  mwaSummaryCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  mwaSummaryRow: {
    flexDirection: 'row',
    marginBottom: adminSpacing.md,
  },
  mwaSummaryCol: {
    flex: 1,
  },
  mwaSummaryLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    marginBottom: 4,
  },
  mwaSummaryValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  mwaStatusGroup: {
    marginTop: 2,
  },
  mwaStatusValue: {
    ...adminType.sectionHead,
    color: adminColors.success.text,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: adminSpacing.sm,
  },
  tableRowDivider: {
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  tableRowName: {
    ...adminType.body,
    fontWeight: '600',
    color: adminColors.ink,
  },
  tableRowValue: {
    ...adminType.rowTitle,
    fontWeight: '700',
    color: adminColors.ink,
  },
  link: {
    ...adminType.caption,
    color: adminColors.brand,
  },
  compareRow: { paddingVertical: adminSpacing.sm },
  compareRowDivider: { borderTopWidth: 1, borderTopColor: adminColors.border },
  compareHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  compareName: { ...adminType.body, color: adminColors.ink },
  compareValue: { ...adminType.rowTitle, color: adminColors.ink },
  kpiRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginBottom: adminSpacing.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingHorizontal: adminSpacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...adminShadow.sm,
  },
  kpiValueLarge: {
    fontSize: 26,
    fontWeight: '800',
    color: adminColors.ink,
    lineHeight: 30,
    marginBottom: 4,
  },
  kpiValueMedium: {
    fontSize: 20,
    fontWeight: '800',
    color: adminColors.ink,
    lineHeight: 24,
    marginBottom: 4,
  },
  kpiLabel: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
    letterSpacing: 0.5,
  },
  searchWrap: {
    marginBottom: adminSpacing.xs,
  },
  chipsWrap: {
    marginBottom: adminSpacing.md,
  },
  cardsList: {
    gap: adminSpacing.md,
    marginBottom: adminSpacing.lg,
  },
  locationCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: adminSpacing.md,
  },
  locationIconBox: {
    width: 42,
    height: 42,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  locationHeaderInfo: {
    flex: 1,
    marginRight: adminSpacing.sm,
  },
  locationName: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
    marginBottom: 2,
  },
  locationCode: {
    ...adminType.caption,
    color: adminColors.muted,
  },
  capacityMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.xs,
  },
  capacityMetaWeight: {
    ...adminType.body,
  },
  weightCurrent: {
    fontWeight: '700',
    color: adminColors.ink,
  },
  weightTotal: {
    color: adminColors.muted,
  },
  capacityMetaPercent: {
    ...adminType.caption,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: adminColors.canvas,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: adminRadius.xl,
    paddingVertical: adminSpacing.md,
    marginTop: adminSpacing.xs,
    marginBottom: adminSpacing.xl,
    ...adminShadow.sm,
  },
  historyBtnText: {
    ...adminType.body,
    fontWeight: '700',
    color: adminColors.ink,
  },
  historyButton: { marginTop: adminSpacing.md },
});
