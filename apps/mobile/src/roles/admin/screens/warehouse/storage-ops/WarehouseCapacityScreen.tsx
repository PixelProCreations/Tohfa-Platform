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
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
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
import { capacityAlertPercentOf, locationsInScope, STORAGE_LOCATIONS, STORAGE_WAREHOUSES, storageWarehouseName } from './fixtures';
import { formatKg, occupancyPercent, ProgressBar, STORAGE_CODES, WarehouseIcon } from './StorageParts';
import type { CapacityFilter, CapacityState, StorageLocationItem, WarehouseScreenBaseProps } from './types';

const FILTERS: readonly CapacityFilter[] = ['All', 'Available', 'Occupied', 'Unavailable'];

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
        <ScopeHeader
          scope={scope}
          label={allWarehouses ? undefined : scope.warehouseName}
          warehouseOptions={STORAGE_WAREHOUSES}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={setSelectedWarehouseId}
        />
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {allWarehouses ? (
          <KpiRow
            items={[
              { value: `${sum.percent}%`, label: 'OCCUPIED' },
              { value: `${100 - sum.percent}%`, label: 'AVAILABLE', tone: 'success' },
            ]}
          />
        ) : null}

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
        <KpiRow
          items={[
            { value: formatKg(sum.capacityKg), label: 'STORAGE TOTAL' },
            { value: formatKg(Math.max(0, sum.capacityKg - sum.currentKg)), label: 'AVAILABLE CAPACITY', tone: 'success' },
          ]}
        />
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search storage locations..." />
        <ChipGroup options={FILTERS} value={filter} onChange={setFilter} />

        {visible.length === 0 ? (
          <EmptyState title="No storage locations found" subtitle="Try another filter or search." />
        ) : (
          <View style={styles.list}>
            {visible.map((loc, index) => {
              const state = capacityStateOf(loc);
              return (
                <View key={loc.id} style={[styles.item, index > 0 && styles.itemDivider]}>
                  <View style={styles.itemIcon}>
                    <WarehouseIcon />
                  </View>
                  <View style={styles.itemText}>
                    <Text style={styles.itemTitle}>{loc.name}</Text>
                    <Text style={styles.itemSub}>
                      Code: {loc.code} · {formatKg(loc.currentKg)} / {formatKg(loc.capacityKg)}
                      {allWarehouses ? ` · ${storageWarehouseName(loc.warehouseId)}` : ''}
                    </Text>
                  </View>
                  <StatusBadge label={state} tone={STATE_TONE[state]} />
                </View>
              );
            })}
          </View>
        )}

        {canManageCapacity ? (
          <WalletButton label="Manage Capacity Limits" variant="outline" onPress={() => onManageCapacity?.()} />
        ) : (
          <InfoNote tone="warning" icon={<LockIcon size={16} color={adminColors.warning.text} />}>
            View only.{allWarehouses ? '' : ' Locations are scoped to your assigned warehouse —'} No capacity editing, storage configuration, or
            quantity allocation here.
          </InfoNote>
        )}
        {onViewHistory ? (
          <View style={styles.historyButton}>
            <WalletButton label="View Capacity History" variant="neutral" onPress={onViewHistory} />
          </View>
        ) : null}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  compareRow: { paddingVertical: adminSpacing.sm },
  compareRowDivider: { borderTopWidth: 1, borderTopColor: adminColors.border },
  compareHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  compareName: { ...adminType.body, color: adminColors.ink },
  compareValue: { ...adminType.rowTitle, color: adminColors.ink },
  list: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.sm,
    marginBottom: 20,
  },
  item: { flexDirection: 'row', alignItems: 'center', padding: adminSpacing.md },
  itemDivider: { borderTopWidth: 1, borderTopColor: adminColors.border },
  itemIcon: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: adminSpacing.md,
  },
  itemText: { flex: 1, marginRight: adminSpacing.sm },
  itemTitle: { ...adminType.sectionHead, color: adminColors.ink, marginBottom: 2 },
  itemSub: { ...adminType.rowMeta, color: adminColors.muted },
  historyButton: { marginTop: adminSpacing.md },
});
