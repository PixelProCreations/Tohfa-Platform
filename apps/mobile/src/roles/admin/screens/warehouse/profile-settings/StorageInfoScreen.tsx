// Design id: M4-S03
/**
 * Storage Information for the Main and Sub warehouse admins (FINAL_LIST #85).
 *
 * Was roles/subwarehouse SubWarehouseStorageInfoScreen. InventoryFlow's
 * 'M3S08' route renders this screen too.
 *
 * Live (plan phase 8): the capacity card is GET /warehouses/{id}/capacity
 * (BR-66b: used kg derived from ACTIVE batches; over capacity is shown as
 * sent, never clamped), and the locations are GET
 * /warehouses/{id}/storage-locations (BR-79), paged by page number, filtered
 * on the server by status (isActive) and the search text (q). A Sub admin
 * reads only its own warehouse.
 *
 * Read-only for both roles: warehouse.capacity.set and
 * warehouse.storage_location.manage are `none` for a Sub admin, and Main's
 * capacity edit lives in Warehouse Settings.
 *
 * Hidden, because the API has no data for them: each location's current
 * occupancy and the Occupied / Empty counts (inventory_batches.storage_location
 * is free text and is not linked to these rows, BR-79), the "Storage Sections"
 * fill levels and the Main "Storage Hierarchy" tree.
 */
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  Card,
  ChipGroup,
  InfoNote,
  isAllWarehouses,
  KpiRow,
  SearchBar,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletScreen,
  WarehouseTabBar,
} from '../wallet-cashtopup/WalletParts';
import type { CapacityView, StorageLocationView, WarehouseScreenBaseProps, WarehouseSelectionProps } from './types';
import { FillBar, singleWarehouseId, SingleWarehouseHeader, warehouseProfileLayout } from './WarehouseProfileParts';

export type StorageStatusFilter = 'All' | 'Active' | 'Inactive';
const STATUS_FILTERS: readonly StorageStatusFilter[] = ['All', 'Active', 'Inactive'];

export interface StorageInfoScreenProps extends WarehouseScreenBaseProps, WarehouseSelectionProps {
  /** Open a location's detail (host-owned). Without it the cards are not tappable. */
  onSelectLocation?: ((locationId: string) => void) | undefined;
  /** The loaded locations (every page so far). */
  locations?: readonly StorageLocationView[] | undefined;
  /** The server's total for the current filter; null while unknown. */
  total?: number | null | undefined;
  /** GET /warehouses/{id}/capacity; undefined while loading or on failure. */
  capacity?: CapacityView | undefined;
  statusFilter?: StorageStatusFilter | undefined;
  onStatusFilterChange?: ((filter: StorageStatusFilter) => void) | undefined;
  searchQuery?: string | undefined;
  onSearchQueryChange?: ((query: string) => void) | undefined;
  /** There is no warehouse the API knows to ask for (Main with a sample selection). */
  unavailable?: boolean | undefined;
  isLoading?: boolean | undefined;
  error?: unknown;
  onRetry?: (() => void) | undefined;
  onRefresh?: (() => void) | undefined;
  isRefreshing?: boolean | undefined;
  onLoadMore?: (() => void) | undefined;
  hasMore?: boolean | undefined;
}

export function StorageInfoScreen({
  scope,
  onBack,
  onTabChange,
  onSelectLocation,
  warehouseOptions,
  selectedWarehouseId,
  onSelectWarehouse,
  locations = [],
  total = null,
  capacity,
  statusFilter = 'All',
  onStatusFilterChange,
  searchQuery = '',
  onSearchQueryChange,
  unavailable = false,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onLoadMore,
  hasMore = false,
}: StorageInfoScreenProps) {
  const isMain = isAllWarehouses(scope);
  const headerWarehouseId = singleWarehouseId(scope, selectedWarehouseId, warehouseOptions);
  const listState = queryViewState({ isLoading, error, itemCount: locations.length });
  const noValue = t('profile.noValue');

  return (
    <WalletScreen
      title="Storage Information"
      onBack={onBack}
      headerExtra={
        <SingleWarehouseHeader scope={scope} warehouseId={headerWarehouseId} options={warehouseOptions} onSelect={onSelectWarehouse} />
      }
      footer={onTabChange ? <WarehouseTabBar onTabChange={onTabChange} onBack={onBack} /> : undefined}
    >
      {unavailable ? (
        <AdminEmptyState title={t('profile.warehouse.unavailable')} />
      ) : (
        <ScrollView
          contentContainerStyle={warehouseProfileLayout.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} /> : undefined}
        >
          <KpiRow items={[{ value: total === null ? noValue : String(total), label: 'STORAGE LOCATIONS' }]} />

          <SectionTitle>Storage Capacity</SectionTitle>
          <Card>
            <View style={styles.capacityHead}>
              <Text style={styles.capacityLabel}>Capacity Used</Text>
              <Text style={styles.capacityPercent}>{capacity?.utilizationLabel ?? noValue}</Text>
            </View>
            <FillBar percent={capacity?.fillPercent ?? 0} />
            <View style={styles.capacityGrid}>
              <CapacityCell
                label="Total Capacity"
                value={capacity?.capacityGrams === null || capacity === undefined ? noValue : formatKg(capacity.capacityGrams)}
              />
              <CapacityCell label="Current Occupancy" value={capacity === undefined ? noValue : formatKg(capacity.usedGrams)} />
              <CapacityCell
                label="Available Capacity"
                value={capacity?.availableGrams === null || capacity === undefined ? noValue : formatKg(capacity.availableGrams)}
              />
            </View>
          </Card>
          <View style={warehouseProfileLayout.gap} />
          <InfoNote>
            {isMain
              ? 'Capacity is displayed here, not edited. Capacity limits are set in Warehouse Settings.'
              : 'Capacity is displayed, never editable by SWA.'}
          </InfoNote>

          <SectionTitle>Storage Locations</SectionTitle>
          <ChipGroup options={STATUS_FILTERS} value={statusFilter} onChange={(next) => onStatusFilterChange?.(next)} />
          <View style={warehouseProfileLayout.gap} />
          <SearchBar
            value={searchQuery}
            onChangeText={(next) => onSearchQueryChange?.(next)}
            placeholder="Location name, code, storage type"
          />
          <View style={warehouseProfileLayout.gap} />
          {listState === 'loading' ? (
            <AdminLoadingState />
          ) : listState === 'error' ? (
            <AdminErrorState error={error} onRetry={onRetry} />
          ) : listState === 'empty' ? (
            <AdminEmptyState title="No storage locations" subtitle="Try another filter or search." />
          ) : (
            <>
              {locations.map((loc) => {
                const content = (
                  <>
                    <View style={styles.cardTop}>
                      <Text style={styles.cardTitle}>{loc.name}</Text>
                      <StatusBadge label={loc.statusLabel} tone={loc.isActive ? 'success' : 'warning'} />
                    </View>
                    <Text style={styles.cardMeta}>
                      {loc.code}
                      {loc.type !== null ? ` · ${loc.type}` : ''}
                    </Text>
                    <View style={styles.locStats}>
                      <CapacityCell label="Capacity" value={loc.capacityGrams === null ? noValue : formatKg(loc.capacityGrams)} />
                    </View>
                  </>
                );
                return onSelectLocation ? (
                  <TouchableOpacity
                    key={loc.id}
                    style={styles.sectionCard}
                    onPress={() => onSelectLocation(loc.id)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={loc.name}
                  >
                    {content}
                  </TouchableOpacity>
                ) : (
                  <View key={loc.id} style={styles.sectionCard}>
                    {content}
                  </View>
                );
              })}
              {hasMore && onLoadMore ? <WalletButton label={t('profile.loadMore')} variant="outline" onPress={onLoadMore} /> : null}
            </>
          )}
        </ScrollView>
      )}
    </WalletScreen>
  );
}

function CapacityCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.capacityCell}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={styles.cellValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  capacityHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  capacityLabel: { ...adminType.rowTitle, color: adminColors.ink },
  capacityPercent: { ...adminType.sectionHead, color: adminColors.brand },
  capacityGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: adminSpacing.md, rowGap: adminSpacing.md },
  capacityCell: { minWidth: '50%', flexGrow: 1 },
  cellLabel: { ...adminType.rowMeta, color: adminColors.muted },
  cellValue: { ...adminType.rowTitle, color: adminColors.ink, marginTop: 2 },

  sectionCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    marginBottom: adminSpacing.md,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: adminSpacing.sm },
  cardTitle: { ...adminType.rowTitle, color: adminColors.ink, flex: 1 },
  cardMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  locStats: { flexDirection: 'row', marginTop: adminSpacing.md },
});
