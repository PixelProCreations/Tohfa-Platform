// Design id: M1-S05 (Sub side; the Main all-warehouses overview is warehouse-admin/WarehouseOverviewScreen)
/**
 * Warehouse Snapshot: the read-only single-warehouse dashboard (identity,
 * today's snapshot, location, contact, operating hours, storage summary and
 * shortcuts). Was SubWarehouseOverviewScreen ("Warehouse Overview"); renamed
 * because warehouse-admin/WarehouseOverviewScreen is the Main all-warehouses
 * screen of the same title (FINAL_LIST 29 flags the clash).
 *
 * Gate (FINAL_LIST 29): Shared, read-only, scope-locked to scope.warehouseId
 * (the old 'Coonoor Warehouse' / 'COO-WH-001' defaults are gone). Main uses the
 * all-warehouses overview instead, so an all-warehouses scope renders a note.
 * Stock, receipts and the storage summary need `inventory.batch.view`; the
 * order tiles and View Orders need `order.list.view_all` (MAIN all, SUB own).
 * Identity, location, contact and hours come from the profile-settings
 * warehouse fixtures; stock from warehouse-admin rows; today's counts from
 * WAREHOUSE_TODAY_COUNTS. No dashboard summary endpoint exists yet.
 */
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import {
  Card,
  EmptyState,
  InfoCard,
  SectionTitle,
  WalletScreen,
  WarehouseTabBar,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  OPERATING_INFO,
  STORAGE_LOCATIONS,
  WAREHOUSE_CONTACTS,
  WAREHOUSE_PROFILES,
} from '../profile-settings/warehouseFixtures';
import { WAREHOUSE_ADMIN_ROWS } from '../warehouse-admin/fixtures';
import { CapacityBar, formatAdminKg, ViewTile, ViewTileGrid } from '../warehouse-admin/WarehouseAdminParts';
import { WAREHOUSE_TODAY_COUNTS } from './fixtures';
import { HOME_CODES } from './HomeParts';
import type { WarehouseScreenBaseProps } from './types';

function MapPinIcon({ size = 16 }: { size?: number }) {
  const color = adminColors.brand;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 21c4-4 7-7.582 7-11a7 7 0 1 0-14 0c0 3.418 3 7 7 11z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

const ACTION_COLOR = adminColors.brandDeep;

function InventoryActionIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3m18 0v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8m18 0H3m7 4h4" stroke={ACTION_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReceivingActionIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 3v12m0 0l4-4m-4 4l-4-4" stroke={ACTION_COLOR} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function OrdersActionIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6m-6 9h6m-6 4h4"
        stroke={ACTION_COLOR}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function OperationsActionIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={ACTION_COLOR} strokeWidth="2" strokeLinecap="round" />
      <Circle cx="9" cy="7" r="4" stroke={ACTION_COLOR} strokeWidth="2" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={ACTION_COLOR} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

/** Pressable KPI tile of the snapshot grid. */
function SnapshotTile({ value, label, onPress }: { value: string; label: string; onPress?: (() => void) | undefined }) {
  return (
    <TouchableOpacity
      style={styles.snapshotTile}
      onPress={onPress}
      disabled={onPress === undefined}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={styles.snapshotValue}>{value}</Text>
      <Text style={styles.snapshotLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export interface WarehouseSnapshotScreenProps extends WarehouseScreenBaseProps {
  onNavigateToInventory?: (() => void) | undefined;
  onNavigateToReceiving?: (() => void) | undefined;
  onNavigateToOrders?: (() => void) | undefined;
  onNavigateToOperations?: (() => void) | undefined;
}

export function WarehouseSnapshotScreen({
  scope,
  can,
  onBack,
  onTabChange,
  onNavigateToInventory,
  onNavigateToReceiving,
  onNavigateToOrders,
  onNavigateToOperations,
}: WarehouseSnapshotScreenProps) {
  const [showMap, setShowMap] = useState(false);
  const warehouseId = scope.warehouseId;
  const footer = onTabChange !== undefined ? <WarehouseTabBar activeTab="Home" onTabChange={onTabChange} onBack={onBack} /> : undefined;

  if (warehouseId === undefined) {
    return (
      <WalletScreen title="Warehouse Snapshot" onBack={onBack} footer={footer}>
        <EmptyState
          title="Single-warehouse view"
          subtitle="This snapshot is locked to one warehouse. The all-warehouses view is Warehouse Overview."
        />
      </WalletScreen>
    );
  }

  const profile = WAREHOUSE_PROFILES.find((w) => w.warehouseId === warehouseId);
  const row = WAREHOUSE_ADMIN_ROWS.find((w) => w.warehouseId === warehouseId);
  const contact = WAREHOUSE_CONTACTS.find((w) => w.warehouseId === warehouseId);
  const operating = OPERATING_INFO.find((w) => w.warehouseId === warehouseId);
  const today = WAREHOUSE_TODAY_COUNTS[warehouseId];
  const locations = STORAGE_LOCATIONS.filter((l) => l.warehouseId === warehouseId);
  const activeLocations = locations.filter((l) => l.status === 'Active').length;
  const usedKg = locations.reduce((sum, l) => sum + l.currentKg, 0);
  const capacityKg = locations.reduce((sum, l) => sum + l.capacityKg, 0);
  const usedPercent = capacityKg > 0 ? Math.round((usedKg / capacityKg) * 100) : 0;
  const name = profile?.warehouseName ?? scope.warehouseName ?? warehouseId;
  const statusLabel = operating?.status ?? 'Operational';

  const canStock = can(HOME_CODES.batchView);
  const canOrders = can(HOME_CODES.orderList);

  return (
    <WalletScreen title="Warehouse Snapshot" subtitle={`${name} · ${statusLabel}`} onBack={onBack} footer={footer}>
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>Warehouse Identity</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: 'Warehouse Name', value: name },
              { label: 'Warehouse ID', value: profile?.code ?? warehouseId },
            ],
            [
              { label: 'Warehouse Type', value: profile?.kind ?? '—' },
              { label: 'Status', value: statusLabel },
            ],
          ]}
        />

        {canStock || canOrders ? (
          <>
            <SectionTitle>Current Snapshot</SectionTitle>
            <View style={styles.snapshotGrid}>
              {canStock ? (
                <>
                  <SnapshotTile value={row ? formatAdminKg(row.stockKg) : '—'} label="TOTAL STOCK" onPress={onNavigateToInventory} />
                  <SnapshotTile value={today ? String(today.receipts) : '—'} label="TODAY'S RECEIPTS" onPress={onNavigateToReceiving} />
                </>
              ) : null}
              {canOrders ? (
                <>
                  <SnapshotTile value={today ? String(today.ordersToday) : '—'} label="TODAY'S ORDERS" onPress={onNavigateToOrders} />
                  <SnapshotTile
                    value={today ? String(today.pendingFulfilment) : '—'}
                    label="PENDING FULFILLMENT"
                    onPress={onNavigateToOrders}
                  />
                </>
              ) : null}
            </View>
          </>
        ) : null}

        <SectionTitle>Location</SectionTitle>
        <Card>
          <Text style={styles.fieldLabel}>Address</Text>
          <Text style={styles.fieldValue}>{contact?.address ?? profile?.address ?? '—'}</Text>
          {profile !== undefined ? (
            <TouchableOpacity style={styles.mapButton} onPress={() => setShowMap(true)} activeOpacity={0.75} accessibilityRole="button">
              <MapPinIcon />
              <Text style={styles.mapButtonText}>View on Map</Text>
            </TouchableOpacity>
          ) : null}
        </Card>

        {contact !== undefined ? (
          <>
            <SectionTitle>Warehouse Contact</SectionTitle>
            <InfoCard
              rows={[
                [
                  { label: 'Warehouse Contact', value: contact.phone },
                  { label: 'Warehouse Email', value: contact.email },
                ],
              ]}
            />
          </>
        ) : null}

        {operating !== undefined ? (
          <>
            <SectionTitle>Operating Information</SectionTitle>
            <Card>
              {operating.week.map((d, index) => (
                <View key={d.day} style={[styles.operatingRow, index > 0 && styles.operatingDivider]}>
                  <Text style={styles.operatingDay}>{d.day}</Text>
                  <Text style={styles.operatingTime}>{d.hours ?? 'Closed'}</Text>
                </View>
              ))}
            </Card>
          </>
        ) : null}

        {canStock ? (
          <>
            <SectionTitle>Storage Summary</SectionTitle>
            <Card>
              <View style={styles.storageRow}>
                <View style={styles.flex}>
                  <Text style={styles.fieldLabel}>Storage Locations</Text>
                  <Text style={styles.storageNumber}>{locations.length}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.fieldLabel}>Active</Text>
                  <Text style={styles.storageNumber}>{activeLocations}</Text>
                </View>
              </View>
              <View style={styles.barGap} />
              <CapacityBar percent={usedPercent} />
              <View style={styles.storageMetaRow}>
                <Text style={styles.storageMeta}>{formatAdminKg(usedKg)} Occupied</Text>
                <Text style={styles.storageMeta}>{formatAdminKg(Math.max(0, capacityKg - usedKg))} Available</Text>
              </View>
            </Card>
          </>
        ) : null}

        <SectionTitle>Quick Actions</SectionTitle>
        <ViewTileGrid>
          {canStock && onNavigateToInventory !== undefined ? (
            <ViewTile label="View Inventory" icon={<InventoryActionIcon />} onPress={onNavigateToInventory} />
          ) : null}
          {onNavigateToReceiving !== undefined ? (
            <ViewTile label="View Receiving" icon={<ReceivingActionIcon />} onPress={onNavigateToReceiving} />
          ) : null}
          {canOrders && onNavigateToOrders !== undefined ? (
            <ViewTile label="View Orders" icon={<OrdersActionIcon />} onPress={onNavigateToOrders} />
          ) : null}
          {onNavigateToOperations !== undefined ? (
            <ViewTile label="View Operations" icon={<OperationsActionIcon />} onPress={onNavigateToOperations} />
          ) : null}
        </ViewTileGrid>
      </ScrollView>

      {profile !== undefined ? (
        <Modal visible={showMap} transparent animationType="fade" onRequestClose={() => setShowMap(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowMap(false)}>
            <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>Warehouse Location</Text>
              <Text style={styles.modalName}>
                {profile.warehouseName} ({profile.code})
              </Text>
              <Text style={styles.modalAddress}>{profile.mapAddress}</Text>
              <View style={styles.mapPlaceholder}>
                <MapPinIcon size={32} />
                <Text style={styles.modalAddress}>{profile.coordinates}</Text>
              </View>
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowMap(false)} accessibilityRole="button">
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      ) : null}
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  snapshotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm },
  snapshotTile: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.lg,
    alignItems: 'center',
    ...adminShadow.sm,
  },
  snapshotValue: { ...adminType.kpiValue, color: adminColors.brandDeep },
  snapshotLabel: { ...adminType.caption, color: adminColors.muted, marginTop: adminSpacing.xs },
  fieldLabel: { ...adminType.rowMeta, color: adminColors.muted },
  fieldValue: { ...adminType.sectionHead, color: adminColors.ink, marginTop: adminSpacing.xs },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.xs,
    marginTop: adminSpacing.md,
    alignSelf: 'flex-start',
  },
  mapButtonText: { ...adminType.sectionHead, color: adminColors.brand },
  operatingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: adminSpacing.sm },
  operatingDivider: { borderTopWidth: 1, borderTopColor: adminColors.border },
  operatingDay: { ...adminType.body, color: adminColors.ink },
  operatingTime: { ...adminType.sectionHead, color: adminColors.ink },
  storageRow: { flexDirection: 'row' },
  storageNumber: { ...adminType.title, color: adminColors.ink, marginTop: adminSpacing.xs },
  barGap: { height: adminSpacing.md },
  storageMetaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: adminSpacing.sm },
  storageMeta: { ...adminType.rowMeta, color: adminColors.muted },
  // Was a translucent black scrim; no translucent token, so the solid canvas with the card raised by adminShadow.lg.
  modalBackdrop: { flex: 1, backgroundColor: adminColors.canvas, justifyContent: 'center', padding: adminSpacing.lg },
  modalCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
    padding: adminSpacing.lg,
    gap: adminSpacing.sm,
    ...adminShadow.lg,
  },
  modalTitle: { ...adminType.title, color: adminColors.ink },
  modalName: { ...adminType.sectionHead, color: adminColors.ink },
  modalAddress: { ...adminType.body, color: adminColors.muted },
  mapPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    paddingVertical: adminSpacing.xl,
    borderRadius: adminRadius.lg,
    backgroundColor: adminColors.brandTint,
  },
  modalClose: {
    height: ADMIN_BUTTON_HEIGHT,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: { ...adminType.sectionHead, color: adminColors.onBrand },
});
