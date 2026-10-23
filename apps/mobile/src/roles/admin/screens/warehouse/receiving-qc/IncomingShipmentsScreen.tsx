/**
 * Incoming Shipments list, shared by the Main and Sub warehouse admins.
 *
 * Extracted from the Sub shell's inline Receiving "incoming_shipments"
 * sub-view (status pills, shipment cards with per-status figures) and absorbs
 * the Main IncomingShipmentsScreen. Live since integration phase 4: each row
 * is a purchase order of the warehouse (GET /admin/purchase-orders, paged),
 * with its receiving progress derived from the warehouse's goods receipts.
 *
 * A list row carries no farmer or crop name (the API sends none), so a card
 * shows the poNumber, the grade and the quantities; the detail adds the
 * farmer. The status pills filter what is loaded. Search & Filters (Main: the
 * warehouse) is offered when the flow passes onOpenFilters; its pick is sent
 * to the server as `warehouseId` and named in the header pill.
 *
 * Read-only. Gate: inventory.batch.view or inventory.goods_receipt.record.
 */
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { ChipGroup, HeaderIconButton, ScopeHeader, SlidersIcon, StatusBadge, WalletScreen, walletLayout } from '../wallet-cashtopup/WalletParts';
import { isMainScope, matchesShipmentTab } from './mappers';
import { PermissionNote, TruckDeliveryIcon, canViewReceiving, shipmentTone } from './ReceivingParts';
import type { IncomingShipment, ReceivingLiveStateProps, ShipmentFilterTab, WarehouseScreenBaseProps } from './types';

const TABS: readonly ShipmentFilterTab[] = ['All', 'Expected', 'Receiving', 'QC Pending', 'Completed'];

export interface IncomingShipmentsScreenProps extends WarehouseScreenBaseProps, ReceivingLiveStateProps {
  /** The warehouse's purchase orders, page by page. */
  shipments?: readonly IncomingShipment[] | undefined;
  onLoadMore?: (() => void) | undefined;
  hasMore?: boolean | undefined;
  initialTab?: ShipmentFilterTab | undefined;
  /** Main: the warehouse Search & Filters picked, for the header pill (undefined = all). */
  scopeLabel?: string | undefined;
  /** Opens Search & Filters; not offered when undefined. */
  onOpenFilters?: (() => void) | undefined;
  /** Opens a shipment by its purchase order uuid. */
  onSelectShipment: (purchaseOrderId: string) => void;
}

function kg(value: number | null): string {
  return value === null ? t('inventory.noValue') : formatKg(value);
}

/** The two figures a card shows, by status. */
function cardStats(s: IncomingShipment): [string, string][] {
  const ordered: [string, string] = [t('receiving.card.ordered'), kg(s.expectedGrams)];
  if (s.status === 'Expected') {
    return [ordered, [t('receiving.card.expectedOn'), s.expectedArrival === '' ? t('inventory.noValue') : s.expectedArrival]];
  }
  return [ordered, [t('receiving.card.received'), kg(s.receivedGrams)]];
}

export function IncomingShipmentsScreen({
  scope,
  can,
  onBack,
  shipments = [],
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onLoadMore,
  hasMore = false,
  initialTab = 'All',
  scopeLabel,
  onOpenFilters,
  onSelectShipment,
}: IncomingShipmentsScreenProps) {
  const [tab, setTab] = useState<ShipmentFilterTab>(initialTab);
  const mainView = isMainScope(scope);

  const header = {
    title: t('receiving.shipments.title'),
    onBack,
    headerRight: onOpenFilters ? (
      <HeaderIconButton onPress={onOpenFilters} accessibilityLabel={t('receiving.filters.open')}>
        <SlidersIcon />
      </HeaderIconButton>
    ) : undefined,
    headerExtra: <ScopeHeader scope={scope} label={mainView ? scopeLabel : scope.warehouseName ?? scope.warehouseId} />,
  };

  if (!canViewReceiving(can)) {
    return (
      <WalletScreen {...header}>
        <View style={walletLayout.scrollContent}>
          <PermissionNote message="You do not have permission to view incoming shipments." />
        </View>
      </WalletScreen>
    );
  }

  const view = queryViewState({ isLoading, error, itemCount: shipments.length });
  const rows = shipments.filter((s) => matchesShipmentTab(s.status, tab));

  const renderShipment = ({ item: s }: { item: IncomingShipment }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onSelectShipment(s.purchaseOrderId)}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      <View style={styles.rowBetween}>
        <View style={styles.codeRow}>
          <TruckDeliveryIcon size={16} color={adminColors.brand} />
          <Text style={styles.code}>{s.code}</Text>
        </View>
        <StatusBadge label={s.statusLabel} tone={shipmentTone(s.status)} />
      </View>
      {s.from !== '' || s.to !== '' ? (
        <Text style={styles.meta}>{s.from !== '' ? `${s.from} → ${s.to}` : s.to}</Text>
      ) : null}
      <Text style={styles.produce}>
        {/* The code is already the card title, so an unnamed crop shows only its grade here. */}
        {[s.cropName ?? '', s.grade].filter((part) => part !== '').join(' · ') || s.code}
      </Text>
      <View style={styles.stats}>
        {cardStats(s).map(([label, value]) => (
          <View key={label} style={styles.statCol}>
            <Text style={styles.meta}>{label}</Text>
            <Text style={styles.statValue}>{value}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <WalletScreen {...header}>
      <View style={styles.flex}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsBar} contentContainerStyle={styles.pills}>
          <ChipGroup options={TABS} value={tab} onChange={setTab} />
        </ScrollView>

        {view === 'loading' ? (
          <AdminLoadingState />
        ) : view === 'error' ? (
          <AdminErrorState error={error} onRetry={onRetry} />
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(s) => s.purchaseOrderId}
            renderItem={renderShipment}
            contentContainerStyle={walletLayout.scrollContent}
            showsVerticalScrollIndicator={false}
            onEndReached={hasMore ? onLoadMore : undefined}
            onEndReachedThreshold={0.5}
            refreshControl={
              onRefresh ? (
                <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[adminColors.brand]} tintColor={adminColors.brand} />
              ) : undefined
            }
            ListEmptyComponent={<AdminEmptyState title={t('receiving.empty.shipments')} />}
            ListFooterComponent={hasMore ? <ActivityIndicator color={adminColors.brand} /> : null}
          />
        )}
      </View>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pillsBar: { flexGrow: 0, paddingHorizontal: adminSpacing.lg },
  pills: { paddingVertical: adminSpacing.sm },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.xs },
  code: { ...adminType.rowTitle, color: adminColors.ink },
  meta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  produce: { ...adminType.sectionHead, color: adminColors.ink, marginTop: adminSpacing.xs },
  stats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
    marginTop: adminSpacing.sm,
    paddingTop: adminSpacing.sm,
  },
  statCol: { flex: 1 },
  statValue: { ...adminType.rowTitle, color: adminColors.ink, marginTop: 2 },
});
