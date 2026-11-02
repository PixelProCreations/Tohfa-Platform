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
 * Tapping a row opens the Shipment Quick View (design M2-02), a bottom sheet
 * of the fields the order row carries (receivingViews.ts
 * shipmentQuickViewRows, an allow-list with no farmer identity), with View
 * Details and, when the order can be received, Start Receiving. There is no
 * Arrived pill: neither a purchase order nor a transfer has an arrival step
 * (owner decision).
 *
 * The design's two shipment types (M2-02 notice, M2-03 Shipment Type): with
 * transfer.inter_warehouse.view the list also carries the inbound transfers
 * awaiting receipt (GET /warehouse-transfers, IN_TRANSIT), first, as transfer
 * rows, and a Shipment Type chip row picks purchase orders, transfers or both
 * (incomingTransfers.ts). The facet sits on the list rather than in Search &
 * Filters so a Sub admin, who is not offered Search & Filters (BR-30: it has
 * no warehouse to pick), has it too. A transfer row shows what the list
 * header carries (route, number, value, status, day); the quantity and the
 * produce are on its lines, which only the transfer read returns, so the row
 * opens the transfer receiving screen (transfer.inter_warehouse.receive, at a
 * destination the scope covers) where they are shown.
 *
 * Read-only (Start Receiving only opens the wizard). Gate: inventory.batch.view
 * or inventory.goods_receipt.record; Start Receiving also needs
 * inventory.goods_receipt.record, resuming a receipt awaiting QC also
 * inventory.quality_check.perform.
 */
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  ChipGroup,
  HeaderIconButton,
  InfoCard,
  InfoNote,
  ScopeHeader,
  SlidersIcon,
  StatusBadge,
  WalletButton,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { transferActions } from '../transfers/mappers';
import { TransferRow } from '../transfers/TransferParts';
import type { TransferListItem } from '../transfers/types';
import { SHIPMENT_TYPE_FILTERS, incomingRows, shipmentTypeLabel, type IncomingRow } from './incomingTransfers';
import { isMainScope, isReceivable } from './mappers';
import { PermissionNote, RECEIVING_CODES, TruckDeliveryIcon, canViewReceiving, shipmentTone } from './ReceivingParts';
import { shipmentQuickViewRows } from './receivingViews';
import type {
  IncomingShipment,
  ReceivingLiveStateProps,
  ShipmentFilterTab,
  ShipmentTypeFilter,
  WarehouseScreenBaseProps,
} from './types';

const TABS: readonly ShipmentFilterTab[] = ['All', 'Expected', 'Receiving', 'QC Pending', 'Completed'];

const TAB_LABEL: Record<
  ShipmentFilterTab,
  'receiving.shipmentTab.all' | 'receiving.shipmentTab.expected' | 'receiving.shipmentTab.receiving' | 'receiving.shipmentTab.qcPending' | 'receiving.shipmentTab.completed'
> = {
  All: 'receiving.shipmentTab.all',
  Expected: 'receiving.shipmentTab.expected',
  Receiving: 'receiving.shipmentTab.receiving',
  'QC Pending': 'receiving.shipmentTab.qcPending',
  Completed: 'receiving.shipmentTab.completed',
};

/** Two quick-view fields per row, as InfoCard lays them out. */
function pairs<T>(items: readonly T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += 2) out.push(items.slice(i, i + 2));
  return out;
}

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
  /** Quick View Start Receiving, or resume the receipt awaiting QC (`resume`); the host opens the wizard. */
  onStartReceiving?: ((shipment: IncomingShipment, resume: boolean) => void) | undefined;
  /** Inbound transfers awaiting receipt; undefined when the viewer may not see transfers (no facet, no rows). */
  transfers?: readonly TransferListItem[] | undefined;
  /** The Shipment Type facet (the flow keeps it in the route params). */
  shipmentType?: ShipmentTypeFilter | undefined;
  onChangeShipmentType?: ((type: ShipmentTypeFilter) => void) | undefined;
  /** Opens the transfer receiving screen for a transfer uuid. */
  onSelectTransfer?: ((transferId: string) => void) | undefined;
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
  onStartReceiving,
  transfers,
  shipmentType = 'All',
  onChangeShipmentType,
  onSelectTransfer,
}: IncomingShipmentsScreenProps) {
  const [tab, setTab] = useState<ShipmentFilterTab>(initialTab);
  const [quickView, setQuickView] = useState<IncomingShipment | null>(null);
  const mainView = isMainScope(scope);
  const canRecord = can(RECEIVING_CODES.receiptRecord);
  const canQc = can(RECEIVING_CODES.qualityCheck);

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
          <PermissionNote message={t('receiving.shipments.noPermission')} />
        </View>
      </WalletScreen>
    );
  }

  const view = queryViewState({ isLoading, error, itemCount: shipments.length + (transfers?.length ?? 0) });
  const rows = incomingRows({ shipments, transfers: transfers ?? [], type: shipmentType, tab });
  const offersType = transfers !== undefined && onChangeShipmentType !== undefined;

  /** A transfer opens the receiving screen only where the scope may receive it (the server checks again). */
  const renderTransfer = (transfer: TransferListItem) => (
    <TransferRow
      transfer={transfer}
      onPress={
        onSelectTransfer !== undefined && transferActions(scope, can, transfer).receive ? () => onSelectTransfer(transfer.id) : undefined
      }
    />
  );

  const renderShipment = ({ item: s }: { item: IncomingShipment }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setQuickView(s)}
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

  const renderRow = ({ item }: { item: IncomingRow }) =>
    item.kind === 'transfer' ? renderTransfer(item.transfer) : renderShipment({ item: item.shipment });

  return (
    <WalletScreen {...header}>
      <View style={styles.flex}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsBar} contentContainerStyle={styles.pills}>
          <ChipGroup options={TABS} value={tab} onChange={setTab} labelOf={(option) => t(TAB_LABEL[option])} />
        </ScrollView>
        {offersType ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsBar} contentContainerStyle={styles.typePills}>
            <ChipGroup options={SHIPMENT_TYPE_FILTERS} value={shipmentType} onChange={onChangeShipmentType} labelOf={shipmentTypeLabel} />
          </ScrollView>
        ) : null}
        <View style={styles.notice}>
          <InfoNote tone="brandSoft">
            {t(transfers !== undefined ? 'receiving.shipments.typeNoticeWithTransfers' : 'receiving.shipments.typeNotice')}
          </InfoNote>
        </View>

        {view === 'loading' ? (
          <AdminLoadingState />
        ) : view === 'error' ? (
          <AdminErrorState error={error} onRetry={onRetry} />
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(row) => `${row.kind}:${row.key}`}
            renderItem={renderRow}
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

      {/* Shipment Quick View (M2-02). No translucent scrim token exists, so the
          backdrop stays clear and the sheet carries the token shadow. */}
      <Modal visible={quickView !== null} transparent animationType="slide" onRequestClose={() => setQuickView(null)}>
        <TouchableOpacity
          style={styles.sheetBackdrop}
          activeOpacity={1}
          onPress={() => setQuickView(null)}
          accessibilityLabel={t('receiving.quickView.close')}
        >
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            {quickView === null ? null : (
              <QuickViewBody
                shipment={quickView}
                canStart={canRecord && isReceivable(quickView.status)}
                canResume={canRecord && canQc && quickView.status === 'Awaiting QC' && quickView.pendingReceiptId !== undefined}
                onViewDetails={() => {
                  setQuickView(null);
                  onSelectShipment(quickView.purchaseOrderId);
                }}
                onStartReceiving={
                  onStartReceiving === undefined
                    ? undefined
                    : (resume) => {
                        setQuickView(null);
                        onStartReceiving(quickView, resume);
                      }
                }
                onClose={() => setQuickView(null)}
              />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </WalletScreen>
  );
}

function QuickViewBody({
  shipment,
  canStart,
  canResume,
  onViewDetails,
  onStartReceiving,
  onClose,
}: {
  shipment: IncomingShipment;
  canStart: boolean;
  canResume: boolean;
  onViewDetails: () => void;
  onStartReceiving?: ((resume: boolean) => void) | undefined;
  onClose: () => void;
}) {
  const rows = shipmentQuickViewRows(shipment);
  return (
    <>
      <View style={styles.rowBetween}>
        <Text style={styles.sheetTitle}>{t('receiving.quickView.title')}</Text>
        <StatusBadge label={shipment.statusLabel} tone={shipmentTone(shipment.status)} />
      </View>
      <InfoCard rows={pairs(rows.map((row) => ({ label: row.label, value: row.value })))} />
      <WalletButton label={t('receiving.quickView.viewDetails')} variant="outline" onPress={onViewDetails} />
      {onStartReceiving !== undefined && (canResume || canStart) ? (
        <WalletButton
          label={t(canResume ? 'receiving.detail.resumeReceiving' : 'receiving.dashboard.startReceiving')}
          onPress={() => onStartReceiving(canResume)}
        />
      ) : null}
      <WalletButton label={t('receiving.quickView.close')} variant="neutral" onPress={onClose} />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pillsBar: { flexGrow: 0, paddingHorizontal: adminSpacing.lg },
  pills: { paddingVertical: adminSpacing.sm },
  typePills: { paddingBottom: adminSpacing.sm },
  notice: { paddingHorizontal: adminSpacing.lg },
  sheetBackdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    gap: adminSpacing.md,
    ...adminShadow.lg,
  },
  sheetTitle: { ...adminType.sectionHead, color: adminColors.brandDeep },
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
