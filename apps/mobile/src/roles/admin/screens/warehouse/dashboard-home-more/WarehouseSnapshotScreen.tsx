// Design id: M1-S05 (Sub side; the Main all-warehouses overview is warehouse-admin/WarehouseOverviewScreen)
/**
 * Warehouse Snapshot: the read-only single-warehouse dashboard, live.
 *
 *   Identity, location, contact   GET /warehouses/{id}                (warehouse.own.view)
 *   Stock + storage summary       GET /warehouses/{id}/capacity        (BR-66b, ACTIVE batches)
 *   Storage location counts       GET /warehouses/{id}/storage-locations `total` (all / active)
 *   Open work                     GET /admin/tasks/summary             (BR-77)
 *   Today's receipts / orders     GET /warehouses/{id}/performance     (BR-80; warehouse.all.view,
 *                                 so only a Main admin viewing one warehouse gets these tiles)
 *
 * Dropped because no endpoint carries them: warehouse email, operating hours
 * (the stored JSON has no specified read format) and the old "pending
 * fulfilment" fixture map.
 *
 * Gate (FINAL_LIST 29): Shared, read-only, scope-locked to scope.warehouseId.
 * An all-warehouses scope renders a note (Main uses the overview instead).
 * Stock / storage need `inventory.batch.view`; order figures `order.list.view_all`.
 */
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { Card, EmptyState, InfoCard, SectionTitle, WalletScreen, WarehouseTabBar, walletLayout } from '../wallet-cashtopup/WalletParts';
import { CapacityBar, ViewTile, ViewTileGrid } from '../warehouse-admin/WarehouseAdminParts';
import { HOME_CODES } from './HomeParts';
import { snapshotCapacity, snapshotToday } from './mappers_dashboardHome';
import { summarizeTaskCounts } from './mappers_tasks';
import type { WarehouseScreenBaseProps } from './types';
import {
  useStorageLocationTotals,
  useTaskSummary,
  useTodayPerformance,
  useWarehouseCapacity,
  useWarehouseProfile,
} from './useDashboardHomeData';

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
  const canStock = can(HOME_CODES.batchView);
  const canOrders = can(HOME_CODES.orderList);
  const canPerformance = can(HOME_CODES.allView);

  const profile = useWarehouseProfile(warehouseId);
  const capacity = useWarehouseCapacity(canStock ? warehouseId : undefined);
  const storage = useStorageLocationTotals(warehouseId, canStock);
  const taskSummary = useTaskSummary(scope);
  const performance = useTodayPerformance(warehouseId, canPerformance);

  const footer = onTabChange !== undefined ? <WarehouseTabBar activeTab="Home" onTabChange={onTabChange} onBack={onBack} /> : undefined;
  const title = t('dashboardHome.snapshot.title');

  if (warehouseId === undefined) {
    return (
      <WalletScreen title={title} onBack={onBack} footer={footer}>
        <EmptyState title={t('dashboardHome.snapshot.singleOnly.title')} subtitle={t('dashboardHome.snapshot.singleOnly.subtitle')} />
      </WalletScreen>
    );
  }
  if (profile.isPending) {
    return (
      <WalletScreen title={title} onBack={onBack} footer={footer}>
        <AdminLoadingState />
      </WalletScreen>
    );
  }
  if (profile.error || profile.data === undefined) {
    return (
      <WalletScreen title={title} onBack={onBack} footer={footer}>
        <AdminErrorState error={profile.error} onRetry={() => void profile.refetch()} />
      </WalletScreen>
    );
  }

  const wh = profile.data;
  const none = t('dashboardHome.noValue');
  const cap = snapshotCapacity(capacity.data);
  const today = snapshotToday(performance.data);
  const tasks = taskSummary.data === undefined ? undefined : summarizeTaskCounts(taskSummary.data);
  const statusLabel = t(wh.isActive ? 'dashboardHome.snapshot.active' : 'dashboardHome.snapshot.inactive');
  const address = [wh.address, wh.city, wh.pincode].filter((p): p is string => typeof p === 'string' && p !== '').join(', ');
  const hasCoordinates = typeof wh.latitude === 'number' && typeof wh.longitude === 'number';

  return (
    <WalletScreen title={title} subtitle={`${wh.name} · ${statusLabel}`} onBack={onBack} footer={footer}>
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>{t('dashboardHome.snapshot.identity')}</SectionTitle>
        <InfoCard
          rows={[
            [
              { label: t('dashboardHome.snapshot.name'), value: wh.name },
              { label: t('dashboardHome.snapshot.code'), value: wh.code },
            ],
            [
              { label: t('dashboardHome.snapshot.type'), value: t(wh.type === 'MAIN' ? 'dashboardHome.snapshot.typeMain' : 'dashboardHome.snapshot.typeSub') },
              { label: t('dashboardHome.snapshot.status'), value: statusLabel },
            ],
          ]}
        />

        <SectionTitle>{t('dashboardHome.snapshot.current')}</SectionTitle>
        <View style={styles.snapshotGrid}>
          {canStock ? (
            <>
              <SnapshotTile value={cap.stock} label={t('dashboardHome.snapshot.totalStock')} onPress={onNavigateToInventory} />
              <SnapshotTile value={cap.utilization} label={t('dashboardHome.snapshot.capacityUsed')} onPress={onNavigateToInventory} />
            </>
          ) : null}
          <SnapshotTile
            value={tasks === undefined ? none : String(tasks.qcPending)}
            label={t('dashboardHome.snapshot.qcPending')}
            onPress={onNavigateToReceiving}
          />
          {canOrders ? (
            <SnapshotTile
              value={tasks === undefined ? none : String(tasks.ordersActionable)}
              label={t('dashboardHome.snapshot.ordersToAction')}
              onPress={onNavigateToOrders}
            />
          ) : null}
          {canPerformance ? (
            <>
              <SnapshotTile value={today.receipts} label={t('dashboardHome.snapshot.receiptsToday')} onPress={onNavigateToReceiving} />
              {canOrders ? (
                <SnapshotTile value={today.ordersPlaced} label={t('dashboardHome.snapshot.ordersToday')} onPress={onNavigateToOrders} />
              ) : null}
            </>
          ) : null}
        </View>

        <SectionTitle>{t('dashboardHome.snapshot.location')}</SectionTitle>
        <Card>
          <Text style={styles.fieldLabel}>{t('dashboardHome.snapshot.address')}</Text>
          <Text style={styles.fieldValue}>{address === '' ? none : address}</Text>
          {hasCoordinates ? (
            <TouchableOpacity style={styles.mapButton} onPress={() => setShowMap(true)} activeOpacity={0.75} accessibilityRole="button">
              <MapPinIcon />
              <Text style={styles.mapButtonText}>{t('dashboardHome.snapshot.viewOnMap')}</Text>
            </TouchableOpacity>
          ) : null}
        </Card>

        {wh.contactPhone ? (
          <>
            <SectionTitle>{t('dashboardHome.snapshot.contact')}</SectionTitle>
            <InfoCard rows={[[{ label: t('dashboardHome.snapshot.phone'), value: wh.contactPhone }]]} />
          </>
        ) : null}

        {canStock ? (
          <>
            <SectionTitle>{t('dashboardHome.snapshot.storage')}</SectionTitle>
            <Card>
              <View style={styles.storageRow}>
                <View style={styles.flex}>
                  <Text style={styles.fieldLabel}>{t('dashboardHome.snapshot.locations')}</Text>
                  <Text style={styles.storageNumber}>{storage.data === undefined ? none : String(storage.data.total)}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.fieldLabel}>{t('dashboardHome.snapshot.activeLocations')}</Text>
                  <Text style={styles.storageNumber}>{storage.data === undefined ? none : String(storage.data.active)}</Text>
                </View>
              </View>
              <View style={styles.barGap} />
              <CapacityBar percent={cap.percent} warning={cap.overCapacity} />
              <View style={styles.storageMetaRow}>
                <Text style={styles.storageMeta}>{t('dashboardHome.snapshot.occupied', { value: cap.occupied })}</Text>
                <Text style={styles.storageMeta}>{t('dashboardHome.snapshot.available', { value: cap.available })}</Text>
              </View>
            </Card>
          </>
        ) : null}

        <SectionTitle>{t('dashboardHome.snapshot.quickActions')}</SectionTitle>
        <ViewTileGrid>
          {canStock && onNavigateToInventory !== undefined ? (
            <ViewTile label={t('dashboardHome.snapshot.viewInventory')} icon={<InventoryActionIcon />} onPress={onNavigateToInventory} />
          ) : null}
          {onNavigateToReceiving !== undefined ? (
            <ViewTile label={t('dashboardHome.snapshot.viewReceiving')} icon={<ReceivingActionIcon />} onPress={onNavigateToReceiving} />
          ) : null}
          {canOrders && onNavigateToOrders !== undefined ? (
            <ViewTile label={t('dashboardHome.snapshot.viewOrders')} icon={<OrdersActionIcon />} onPress={onNavigateToOrders} />
          ) : null}
          {onNavigateToOperations !== undefined ? (
            <ViewTile label={t('dashboardHome.snapshot.viewOperations')} icon={<OperationsActionIcon />} onPress={onNavigateToOperations} />
          ) : null}
        </ViewTileGrid>
      </ScrollView>

      {hasCoordinates ? (
        <Modal visible={showMap} transparent animationType="fade" onRequestClose={() => setShowMap(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowMap(false)}>
            <View style={styles.modalCard} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>{t('dashboardHome.snapshot.mapTitle')}</Text>
              <Text style={styles.modalName}>{t('dashboardHome.snapshot.mapName', { name: wh.name, code: wh.code })}</Text>
              <Text style={styles.modalAddress}>{address}</Text>
              <View style={styles.mapPlaceholder}>
                <MapPinIcon size={32} />
                <Text style={styles.modalAddress}>
                  {t('dashboardHome.snapshot.coordinates', { lat: String(wh.latitude), lng: String(wh.longitude) })}
                </Text>
              </View>
              <TouchableOpacity style={styles.modalClose} onPress={() => setShowMap(false)} accessibilityRole="button">
                <Text style={styles.modalCloseText}>{t('dashboardHome.close')}</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: adminColors.brand,
  },
  modalCloseText: { ...adminType.sectionHead, color: adminColors.onBrand },
});
