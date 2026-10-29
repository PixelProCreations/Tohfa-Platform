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
 * warehouse selector. Inactive locations read 'Unavailable'.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { getWarehouseCapacities } from '../../../api/dashboardFeeds';
import {
  getWarehouseCapacity,
  listStorageLocations,
  type StorageLocationDto,
  type WarehouseCapacityDto,
} from '../../../api/warehouses';
import { formatKg, parseKgToGrams } from '../../../money/quantity';
import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
} from '../shared/AsyncStates';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import {
  Card,
  ChipGroup,
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
import { ProgressBar, STORAGE_CODES, WarehouseIcon } from './StorageParts';
import type {
  CapacityFilter,
  CapacityState,
  StorageLocationItem,
  WarehouseScreenBaseProps,
} from './types';

const FILTERS: readonly CapacityFilter[] = ['All', 'Available', 'Unavailable'];

const STATE_TONE: Record<CapacityState, 'success' | 'warning' | 'danger'> = {
  Available: 'success',
  Occupied: 'warning',
  Unavailable: 'danger',
};

/** Capacity state of a location: inactive = Unavailable; active = Available. */
export function capacityStateOf(location: { isActive?: boolean; status?: string }): CapacityState {
  const active = location.isActive ?? (location.status === 'Active');
  return active ? 'Available' : 'Unavailable';
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
  locations: initialLocations,
  onViewHistory,
  onManageCapacity,
}: WarehouseCapacityScreenProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CapacityFilter>('All');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);

  const { options, scopes } = useWarehouseOptions();
  const allWarehouses = isAllWarehouses(scope);
  const effectiveWarehouseId = scope.warehouseId ?? selectedWarehouseId;
  const isMainOverview = allWarehouses && selectedWarehouseId === undefined;

  // Single warehouse capacity & locations
  const singleCapQuery = useAdminQuery(
    adminKeys.scoped('warehouseCapacity', effectiveWarehouseId),
    (signal) => getWarehouseCapacity(effectiveWarehouseId as string, signal),
    { enabled: !isMainOverview && !!effectiveWarehouseId && can(STORAGE_CODES.capacityView) },
  );

  const singleLocsQuery = useAdminQuery(
    adminKeys.scoped('storageLocations', effectiveWarehouseId, { pageSize: 100 }),
    (signal) => listStorageLocations(effectiveWarehouseId as string, { pageSize: 100 }, signal),
    { enabled: !isMainOverview && !!effectiveWarehouseId && can(STORAGE_CODES.batchView) },
  );

  // Multi-warehouse capacities for Main overview
  const multiCapQuery = useAdminQuery(
    adminKeys.scoped('warehouseCapacities', undefined),
    (signal) => getWarehouseCapacities(options.map((o) => o.warehouseId), signal),
    { enabled: isMainOverview && options.length > 0 && can(STORAGE_CODES.allWarehousesView) },
  );

  const canManageCapacity = can(STORAGE_CODES.capacitySet) && onManageCapacity !== undefined;

  // Derive multi-warehouse metrics
  const multiSummary = useMemo(() => {
    if (!isMainOverview || !multiCapQuery.data) return null;
    let totalUsedGrams = 0;
    let totalCapGrams = 0;
    for (const cap of multiCapQuery.data.values()) {
      const used = parseKgToGrams(cap.usedKg) ?? 0;
      const total = cap.capacityKg ? (parseKgToGrams(cap.capacityKg) ?? 0) : 0;
      totalUsedGrams += used;
      totalCapGrams += total;
    }
    const percent = totalCapGrams > 0 ? Math.round((totalUsedGrams / totalCapGrams) * 100) : null;
    return {
      usedGrams: totalUsedGrams,
      capacityGrams: totalCapGrams,
      percent,
    };
  }, [isMainOverview, multiCapQuery.data]);

  // Derive single warehouse locations & groups
  const locationRows = useMemo((): readonly StorageLocationDto[] => {
    return singleLocsQuery.data?.items ?? [];
  }, [singleLocsQuery.data]);

  const visibleLocations = useMemo(() => {
    const q = query.trim().toLowerCase();
    return locationRows.filter((l) => {
      const state = capacityStateOf(l);
      if (filter !== 'All' && state !== filter) return false;
      if (q !== '' && !l.name.toLowerCase().includes(q) && !l.code.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [locationRows, filter, query]);

  // Storage Area Capacity (grouped by locationType)
  const storageAreaRows = useMemo(() => {
    const groups = new Map<string, { usedGrams: number; capGrams: number }>();
    for (const l of locationRows) {
      const type = l.locationType || 'Other';
      const existing = groups.get(type) ?? { usedGrams: 0, capGrams: 0 };
      const used = parseKgToGrams(l.usedKg) ?? 0;
      const cap = l.capacityKg ? (parseKgToGrams(l.capacityKg) ?? 0) : 0;
      groups.set(type, {
        usedGrams: existing.usedGrams + used,
        capGrams: existing.capGrams + cap,
      });
    }
    return Array.from(groups.entries()).map(([name, data]) => {
      const percent = data.capGrams > 0 ? Math.round((data.usedGrams / data.capGrams) * 100) : 0;
      return { name, percent: `${percent}%` };
    });
  }, [locationRows]);

  // Location Capacity (roots with level === 0)
  const rootLocationRows = useMemo(() => {
    return locationRows
      .filter((l) => l.level === 0)
      .map((l) => {
        const used = parseKgToGrams(l.subtreeUsedKg || l.usedKg) ?? 0;
        const cap = l.capacityKg ? (parseKgToGrams(l.capacityKg) ?? 0) : 0;
        const percent = cap > 0 ? Math.round((used / cap) * 100) : 0;
        return { name: l.name, percent: `${percent}%` };
      });
  }, [locationRows]);

  // Loading & error handling
  const isLoading = isMainOverview
    ? multiCapQuery.isLoading
    : singleCapQuery.isLoading || singleLocsQuery.isLoading;

  const queryError = isMainOverview
    ? multiCapQuery.error
    : singleCapQuery.error || singleLocsQuery.error;

  const handleRetry = () => {
    if (isMainOverview) multiCapQuery.refetch();
    else {
      singleCapQuery.refetch();
      singleLocsQuery.refetch();
    }
  };

  const cap = singleCapQuery.data;
  const singleCapGrams = cap?.capacityKg ? (parseKgToGrams(cap.capacityKg) ?? 0) : 0;
  const singleUsedGrams = cap ? (parseKgToGrams(cap.usedKg) ?? 0) : 0;
  const singleAvailableGrams = Math.max(0, singleCapGrams - singleUsedGrams);
  const singlePercent = cap?.utilizationPercent ?? (singleCapGrams > 0 ? Math.round((singleUsedGrams / singleCapGrams) * 100) : 0);

  return (
    <WalletScreen
      title={t('storageOps.capacity.title')}
      onBack={onBack}
      headerExtra={
        allWarehouses ? (
          <ScopeHeader
            scope={scope}
            warehouseOptions={scopes}
            selectedWarehouseId={selectedWarehouseId}
            onSelectWarehouse={setSelectedWarehouseId}
          />
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <AdminLoadingState />
        ) : queryError ? (
          <AdminErrorState error={queryError} onRetry={handleRetry} />
        ) : isMainOverview ? (
          <>
            <View style={styles.mwaSummaryCard}>
              <View style={styles.mwaSummaryRow}>
                <View style={styles.mwaSummaryCol}>
                  <Text style={styles.mwaSummaryLabel}>{t('storageOps.capacity.occupied')}</Text>
                  <Text style={styles.mwaSummaryValue}>
                    {multiSummary?.percent != null ? `${multiSummary.percent}%` : '—'}
                  </Text>
                </View>
                <View style={styles.mwaSummaryCol}>
                  <Text style={styles.mwaSummaryLabel}>{t('storageOps.capacity.available')}</Text>
                  <Text style={styles.mwaSummaryValue}>
                    {multiSummary ? formatKg(Math.max(0, multiSummary.capacityGrams - multiSummary.usedGrams)) : '—'}
                  </Text>
                </View>
              </View>
              <View style={styles.mwaStatusGroup}>
                <Text style={styles.mwaSummaryLabel}>{t('storageOps.capacity.status')}</Text>
                <Text style={styles.mwaStatusValue}>{t('storageOps.capacity.operational')}</Text>
              </View>
            </View>

            {can(STORAGE_CODES.allWarehousesView) ? (
              <>
                <SectionTitle>{t('storageOps.capacity.warehouseComparison')}</SectionTitle>
                <Card>
                  {options.map((opt, index) => {
                    const c = multiCapQuery.data?.get(opt.warehouseId);
                    const pct = c?.utilizationPercent != null ? `${c.utilizationPercent}%` : '—';
                    return (
                      <View key={opt.warehouseId} style={[styles.tableRow, index > 0 && styles.tableRowDivider]}>
                        <Text style={styles.tableRowName}>{opt.warehouseName}</Text>
                        <Text style={styles.tableRowValue}>{pct}</Text>
                      </View>
                    );
                  })}
                </Card>
              </>
            ) : null}

            {canManageCapacity ? (
              <View style={styles.historyButton}>
                <WalletButton
                  label={t('storageOps.capacity.manageLimits')}
                  variant="outline"
                  onPress={() => onManageCapacity?.()}
                />
              </View>
            ) : null}
          </>
        ) : (
          <>
            <KpiRow
              items={[
                { value: `${singlePercent}%`, label: t('storageOps.capacity.occupied') },
                { value: formatKg(singleAvailableGrams), label: t('storageOps.capacity.available'), tone: 'success' },
              ]}
            />

            {storageAreaRows.length > 0 ? (
              <>
                <SectionTitle>{t('storageOps.capacity.storageAreaCapacity')}</SectionTitle>
                <Card>
                  {storageAreaRows.map((row, index) => (
                    <View key={row.name} style={[styles.tableRow, index > 0 && styles.tableRowDivider]}>
                      <Text style={styles.tableRowName}>{row.name}</Text>
                      <Text style={styles.tableRowValue}>{row.percent}</Text>
                    </View>
                  ))}
                </Card>
              </>
            ) : null}

            {rootLocationRows.length > 0 ? (
              <>
                <SectionTitle>{t('storageOps.capacity.locationCapacity')}</SectionTitle>
                <Card>
                  {rootLocationRows.map((row, index) => (
                    <View key={row.name} style={[styles.tableRow, index > 0 && styles.tableRowDivider]}>
                      <Text style={styles.tableRowName}>{row.name}</Text>
                      <Text style={styles.tableRowValue}>{row.percent}</Text>
                    </View>
                  ))}
                </Card>
              </>
            ) : null}

            <SectionTitle>{t('storageOps.capacity.title')}</SectionTitle>
            <KpiRow
              items={[
                { value: formatKg(singleCapGrams), label: t('storageOps.capacity.storageTotal') },
                { value: formatKg(singleAvailableGrams), label: t('storageOps.capacity.availableCapacity'), tone: 'success' },
              ]}
            />
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder={t('storageOps.capacity.searchPlaceholder')}
            />
            <ChipGroup options={FILTERS} value={filter} onChange={setFilter} />

            {visibleLocations.length === 0 ? (
              <AdminEmptyState
                title={t('storageOps.capacity.empty')}
                subtitle={t('storageOps.capacity.emptyHint')}
              />
            ) : (
              <View style={styles.list}>
                {visibleLocations.map((loc, index) => {
                  const state = capacityStateOf(loc);
                  const usedG = parseKgToGrams(loc.usedKg) ?? 0;
                  const capG = loc.capacityKg ? (parseKgToGrams(loc.capacityKg) ?? 0) : 0;
                  return (
                    <View key={loc.id} style={[styles.item, index > 0 && styles.itemDivider]}>
                      <View style={styles.itemIcon}>
                        <WarehouseIcon />
                      </View>
                      <View style={styles.itemText}>
                        <Text style={styles.itemTitle}>{loc.name}</Text>
                        <Text style={styles.itemSub}>
                          {t('storageOps.capacity.code', {
                            code: loc.code,
                            used: formatKg(usedG),
                            capacity: formatKg(capG),
                          })}
                        </Text>
                      </View>
                      <StatusBadge label={t(`storageOps.capacity.state.${state}`)} tone={STATE_TONE[state]} />
                    </View>
                  );
                })}
              </View>
            )}

            {canManageCapacity ? (
              <WalletButton
                label={t('storageOps.capacity.manageLimits')}
                variant="outline"
                onPress={() => onManageCapacity?.()}
              />
            ) : null}
            {onViewHistory ? (
              <View style={styles.historyButton}>
                <WalletButton
                  label={t('storageOps.capacity.viewHistory')}
                  variant="neutral"
                  onPress={onViewHistory}
                />
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
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