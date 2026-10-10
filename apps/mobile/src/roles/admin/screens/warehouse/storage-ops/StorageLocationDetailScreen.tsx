/**
 * Storage Location: one storage location's capacity, occupancy and stored
 * stock. Read-only (no stock editing here).
 *
 * Gate (FINAL_LIST 137): the View Stock link and the stored-stock rows (which
 * deep-link into Inventory & Stock) need `inventory.batch.view` (MAIN all, SUB
 * own). That code is an approximation; no rbac code covers storage-location
 * master data (SPEC_GAPS W4u-2).
 *
 * Absorbs Main LocationDetailScreen (pair M4-S04): for the Main view, the
 * Location Information card (location id, warehouse, section, rack / shelf)
 * and the occupancy bar. Sub keeps the locked warehouse pill and the capacity
 * alert. The warehouse label comes from scope (Sub) or the location record
 * (Main), never a hard-coded name; the alert level comes from the warehouse
 * record (fixtures), not a screen constant.
 *
 * Scope: a location of another warehouse is "not found" for a Sub viewer (no
 * 403 leak, CLAUDE.md 2.1).
 */
// Design id: M4-S04
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  Card,
  EmptyState,
  inScope,
  InfoCard,
  InfoNote,
  isAllWarehouses,
  ScopeHeader,
  SectionTitle,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { capacityAlertPercentOf, LOCATION_LAYOUT, LOCATION_STOCK, STORAGE_LOCATIONS, storageWarehouseName } from './fixtures';
import { BoxIcon, formatKg, occupancyPercent, ProgressBar, STORAGE_CODES, WarningTriangleIcon } from './StorageParts';
import type { LocationStockItem, StorageLocationItem, WarehouseScreenBaseProps } from './types';

export interface StorageLocationDetailScreenProps extends WarehouseScreenBaseProps {
  locationId?: string | undefined;
  locations?: readonly StorageLocationItem[] | undefined;
  stock?: readonly LocationStockItem[] | undefined;
  /** View Stock: opens Inventory & Stock (host). */
  onViewStock?: (() => void) | undefined;
  /** A stored-stock row: opens that product in Inventory & Stock (host). */
  onViewProductDetail?: ((product: string) => void) | undefined;
}

export function StorageLocationDetailScreen({
  scope,
  can,
  onBack,
  locationId,
  locations = STORAGE_LOCATIONS,
  stock = LOCATION_STOCK,
  onViewStock,
  onViewProductDetail,
}: StorageLocationDetailScreenProps) {
  const location = locations.find((l) => l.id === locationId && inScope(scope, l.warehouseId));
  if (!location) {
    return (
      <WalletScreen title="Storage Location" onBack={onBack} headerExtra={<ScopeHeader scope={scope} />}>
        <EmptyState title="Storage location not found" subtitle="It may belong to another warehouse or have been removed." />
      </WalletScreen>
    );
  }

  const allWarehouses = isAllWarehouses(scope);
  const warehouseName = storageWarehouseName(location.warehouseId);
  const canViewStock = can(STORAGE_CODES.batchView);
  const percent = occupancyPercent(location.currentKg, location.capacityKg);
  const alertAt = capacityAlertPercentOf(location.warehouseId);
  const nearCapacity = alertAt !== undefined && percent >= alertAt;
  const layout = LOCATION_LAYOUT.find((l) => l.locationId === location.id);
  const rows = stock.filter((s) => s.locationId === location.id);

  return (
    <WalletScreen
      title="Storage Location"
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} label={allWarehouses ? warehouseName : undefined} />}
      footer={
        canViewStock && onViewStock ? (
          <WalletFooter>
            <WalletButton label="View Stock" icon={<BoxIcon />} onPress={onViewStock} />
          </WalletFooter>
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.locationTitle}>
          {location.name} — {location.code}
        </Text>

        <InfoCard
          rows={[
            [
              { label: 'Status', value: location.status },
              { label: 'Capacity', value: formatKg(location.capacityKg) },
            ],
            [
              { label: 'Current Occupancy', value: formatKg(location.currentKg) },
              { label: 'Available', value: formatKg(Math.max(0, location.capacityKg - location.currentKg)) },
            ],
          ]}
        />

        {nearCapacity ? (
          <InfoNote tone="danger" icon={<WarningTriangleIcon />}>
            Storage Capacity Alert — {location.name} is nearing its configured capacity. Current {formatKg(location.currentKg)} of{' '}
            {formatKg(location.capacityKg)}. This is informational only.
          </InfoNote>
        ) : null}

        {allWarehouses ? (
          <>
            <SectionTitle>Location Information</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: 'Location ID', value: location.id },
                  { label: 'Warehouse', value: warehouseName },
                ],
                [
                  { label: 'Section', value: layout?.section ?? '—' },
                  { label: 'Rack / Shelf', value: layout?.rackShelf ?? '—' },
                ],
              ]}
            />
            <SectionTitle>Occupancy</SectionTitle>
            <Card>
              <ProgressBar percent={percent} tone={nearCapacity ? 'danger' : 'brand'} />
              <Text style={styles.occupancyText}>Current {percent}%</Text>
            </Card>
          </>
        ) : null}

        <SectionTitle>Location Usage</SectionTitle>
        {rows.length === 0 ? (
          <EmptyState title="Nothing stored here" />
        ) : (
          <View style={styles.usageCard}>
            {rows.map((row, index) => {
              const tappable = canViewStock && onViewProductDetail !== undefined;
              return (
                <TouchableOpacity
                  key={row.id}
                  style={[styles.usageRow, index > 0 && styles.usageRowDivider]}
                  onPress={() => onViewProductDetail?.(row.product)}
                  disabled={!tappable}
                  activeOpacity={0.7}
                  accessibilityRole={tappable ? 'button' : undefined}
                >
                  <Text style={styles.usageName}>{row.product}</Text>
                  <Text style={styles.usageQty}>{formatKg(row.quantityKg)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <InfoNote tone="brandSoft">
          Read-only. Stock is never edited here; View Stock and the product rows open Inventory & Stock.
        </InfoNote>
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  locationTitle: { ...adminType.title, color: adminColors.ink, marginBottom: adminSpacing.md },
  occupancyText: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.sm },
  usageCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.lg,
    marginBottom: adminSpacing.lg,
  },
  usageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  usageRowDivider: { borderTopWidth: 1, borderTopColor: adminColors.border },
  usageName: { ...adminType.body, color: adminColors.ink },
  usageQty: { ...adminType.rowTitle, color: adminColors.ink },
});
