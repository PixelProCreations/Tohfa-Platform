/**
 * Incoming Shipments list (design M2-02), shared by the Main and Sub
 * warehouse admins.
 *
 * Extracted from the Sub shell's inline Receiving "incoming_shipments"
 * sub-view (status pills, shipment cards with per-status figures) and absorbs
 * the Main IncomingShipmentsScreen (all warehouses, Main-only:
 * scope.warehouseId undefined). The Search & Filters facets come back through
 * `filters` (LiveReceivingFilters).
 *
 * Live data: purchase orders (useShipmentList, server-side q / from / to,
 * BR-122, page by page as the list scrolls) merged with the inbound
 * inter-warehouse transfers (useInboundTransfers, narrowed here by the same
 * facets because their list has none); the Shipment Type facet picks which of
 * the two is read. A row's figures are the live grams (hidden when unknown);
 * the pills follow matchesShipmentTab (no arrival status: "Arrived" lists the
 * orders whose receipt awaits its quality check). The old "Review" link
 * (a quantity variance) has no API and is not rendered.
 *
 * Read-only. Gate: inventory.batch.view or inventory.goods_receipt.record.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  EmptyState,
  HeaderIconButton,
  SlidersIcon,
  WarehouseTabBar,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { PermissionNote, RefreshRetryIcon, TruckDeliveryIcon, canViewReceiving } from './ReceivingParts';
import type { LiveReceivingFilters, LiveShipment } from './liveTypes';
import {
  EMPTY_LIVE_FILTERS,
  activeFilterCount,
  intakeFilterParams,
  isMainScope,
  kgLabel,
  matchesShipmentTab,
  receivingWarehouseFilter,
} from './mappers';
import {
  PENDING_QUEUE_TABS,
  intakeListsFor,
  liveShipmentTone,
  mergeShipments,
  pendingQueueRows,
  shipmentCardStats,
  shipmentProduceLine,
  shipmentRouteText,
  transferMatchesIntake,
  type PendingQueueTab,
} from './receivingLists';
import { pendingQueueOf } from './receivingViews';
import { useInboundTransfers, useReceivingDashboard, useReceivingNaming, useShipmentList } from './useReceivingData';
import type { PermissionCheck, ShipmentFilterTab, WarehouseScope, WarehouseScreenBaseProps, WarehouseTab } from './types';

const TABS: readonly ShipmentFilterTab[] = ['All', 'Expected', 'Arrived', 'Receiving', 'QC Pending', 'Completed', 'Rejected'];

/** Distance from the end of the list (px) at which the next page of orders is fetched. */
const LOAD_MORE_EDGE = 240;
/** How often (ms) the list reports its scroll position, to fetch the next page near the end. */
const LOAD_MORE_THROTTLE_MS = 200;

export interface IncomingShipmentsScreenProps extends WarehouseScreenBaseProps {
  initialTab?: ShipmentFilterTab | undefined;
  /** Facets applied in Search & Filters. */
  filters?: LiveReceivingFilters | undefined;
  onOpenFilters: () => void;
  onClearFilters?: (() => void) | undefined;
  /** A purchase order row (its uuid). */
  onSelectShipment: (purchaseOrderId: string) => void;
  /** An inbound transfer row (its uuid). */
  onSelectTransfer?: ((transferId: string) => void) | undefined;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
}

export function IncomingShipmentsScreen({
  scope,
  can,
  onBack,
  initialTab = 'All',
  filters = EMPTY_LIVE_FILTERS,
  onOpenFilters,
  onClearFilters,
  onSelectShipment,
  onSelectTransfer,
  onTabChange,
}: IncomingShipmentsScreenProps) {
  const [tab, setTab] = useState<ShipmentFilterTab>(initialTab);
  const canView = canViewReceiving(can);
  const applied = activeFilterCount(filters);

  // BR-30: a Sub scope always reads its own warehouse; Main the one picked in Search & Filters, or all.
  const warehouseId = receivingWarehouseFilter(scope, filters.warehouseId);
  const naming = useReceivingNaming(scope, can);
  const lists = intakeListsFor(filters.shipmentType);
  const params = useMemo(() => intakeFilterParams(filters, new Date()), [filters]);
  const orders = useShipmentList(warehouseId, naming.naming, params, canView && lists.purchaseOrders);
  const transfers = useInboundTransfers(warehouseId, naming.naming, can, canView && lists.transfers);

  const now = useMemo(() => new Date(), [orders.items, transfers.shipments]);
  const all = useMemo(
    () =>
      mergeShipments(
        lists.purchaseOrders ? orders.items : [],
        lists.transfers ? transfers.shipments.filter((s) => transferMatchesIntake(s, params)) : [],
      ),
    [lists.purchaseOrders, lists.transfers, orders.items, transfers.shipments, params],
  );
  const rows = all.filter((s) => matchesShipmentTab(s.status, tab));
  const ordersError = lists.purchaseOrders ? orders.error : null;
  const transfersError = lists.transfers ? transfers.error : null;
  const error = ordersError ?? transfersError ?? null;
  // A pill with no match on the loaded pages keeps reading until a match or the end (hidden pagination).
  const morePending = lists.purchaseOrders && orders.hasMore && error === null;
  const view = queryViewState({
    isLoading: (lists.purchaseOrders && orders.isLoading) || (lists.transfers && transfers.isLoading) || (rows.length === 0 && morePending),
    error,
    itemCount: rows.length,
  });
  const loadMore = orders.loadMore;
  useEffect(() => {
    if (rows.length === 0 && morePending) loadMore();
    // loadMore is a new function every render; the inputs that matter are listed.
  }, [rows.length, morePending, orders.items.length]);
  const refresh = () => {
    if (lists.purchaseOrders) orders.refresh();
    if (lists.transfers) transfers.refresh();
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (morePending && layoutMeasurement.height + contentOffset.y >= contentSize.height - LOAD_MORE_EDGE) loadMore();
  };
  const open = (s: LiveShipment) => {
    if (s.kind === 'transfer') onSelectTransfer?.(s.id);
    else onSelectShipment(s.id);
  };

  const header = {
    title: 'Incoming Shipments',
    onBack,
    headerRight: (
      <HeaderIconButton onPress={onOpenFilters} accessibilityLabel="Search and Filters">
        <SlidersIcon size={20} />
      </HeaderIconButton>
    ),
    headerExtra: undefined,
    footer: <WarehouseTabBar activeTab="Receiving" onTabChange={onTabChange} onBack={onBack} />,
  };

  if (!canView) {
    return (
      <WalletScreen {...header}>
        <View style={walletLayout.scrollContent}>
          <PermissionNote message="You do not have permission to view incoming shipments." />
        </View>
      </WalletScreen>
    );
  }

  return (
    <WalletScreen {...header}>
      <View style={styles.pillsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsScroll}>
          {TABS.map((option) => {
            const active = option === tab;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setTab(option)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={LOAD_MORE_THROTTLE_MS}
      >
        {applied > 0 ? (
          <View style={styles.appliedRow}>
            <Text style={styles.appliedText}>
              {applied} filter{applied === 1 ? '' : 's'} applied
            </Text>
            {onClearFilters ? (
              <TouchableOpacity onPress={onClearFilters} accessibilityRole="button">
                <Text style={styles.link}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {view === 'loading' ? <AdminLoadingState /> : null}
        {view === 'error' ? <AdminErrorState error={error} onRetry={refresh} /> : null}
        {view === 'empty' ? <EmptyState title="No shipments" subtitle="Nothing matches this status and these filters." /> : null}

        {rows.map((s) => {
          const stats = shipmentCardStats(s, now);
          const tone = liveShipmentTone(s.status);
          const badgeColors = adminColors[tone];
          const produce = shipmentProduceLine(s);

          return (
            <TouchableOpacity
              key={`${s.kind}-${s.id}`}
              style={styles.card}
              onPress={() => open(s)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <View style={styles.cardHeader}>
                <Text style={styles.code}>{s.code}</Text>
                <View style={[styles.badge, { backgroundColor: badgeColors.bg }]}>
                  <Text style={[styles.badgeText, { color: badgeColors.text }]}>{s.statusLabel}</Text>
                </View>
              </View>

              <Text style={styles.route}>{shipmentRouteText(s)}</Text>

              {produce !== null ? <Text style={styles.produce}>{produce}</Text> : null}

              {stats.length > 0 ? (
                <View style={styles.statsRow}>
                  {stats.map((stat) => (
                    <View key={stat.key} style={styles.statCol}>
                      <Text style={styles.statLabel}>{stat.label}</Text>
                      <Text style={styles.statValue}>{stat.value}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  pillsWrapper: {
    paddingVertical: 12,
  },
  pillsScroll: {
    paddingHorizontal: adminSpacing.lg,
    gap: 8,
    flexDirection: 'row',
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  pillActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  pillText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
  },
  pillTextActive: {
    color: adminColors.onBrand,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingBottom: adminSpacing.xl,
  },
  appliedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.sm,
  },
  appliedText: { ...adminType.rowMeta, color: adminColors.muted },
  link: { ...adminType.caption, color: adminColors.brand },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  code: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: adminRadius.md,
  },
  badgeText: {
    ...adminType.caption,
    fontWeight: '700',
  },
  route: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.muted,
    marginTop: 5,
  },
  produce: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  statCol: {
    minWidth: 80,
    marginRight: 20,
  },
  statLabel: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.muted,
    marginBottom: 2,
  },
  statValue: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  reviewButton: {
    marginLeft: 'auto',
    alignSelf: 'flex-end',
    paddingVertical: 2,
  },
  reviewText: {
    ...adminType.rowTitle,
    color: adminColors.brandDeep,
  },
});


export interface ReceivingActivityScreenProps {
  scope: WarehouseScope;
  onBack: () => void;
  onSelectStep: (stepKey: string) => void;
}

/**
 * The Receiving Activity Timeline (M2-01): a navigation timeline of the
 * receiving stages (design copy), each step opening where that stage is
 * worked on. It is not one shipment's progress, so no step is marked done.
 */
export function ReceivingActivityScreen({ scope, onBack, onSelectStep }: ReceivingActivityScreenProps) {
  const steps = [
    { key: 'shipment_detail', label: 'Shipment Created' },
    { key: 'shipment_detail', label: 'Shipment Arrived' },
    { key: 'start_receiving', label: 'Receiving Started' },
    { key: 'quantity_verification', label: 'Quantity Checked' },
    { key: 'quality_check', label: 'Quality Checked' },
    { key: 'receiving_decision', label: 'Decision Made' },
    { key: 'batch_assignment', label: 'Batch Assigned' },
    { key: 'storage_assignment', label: 'Storage Assigned' },
    { key: 'receipt_confirmation', label: 'Receipt Completed' },
  ];

  return (
    <SafeAreaView style={customStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={customStyles.header}>
        <View style={customStyles.headerTop}>
          <TouchableOpacity onPress={onBack} style={customStyles.backBtn} activeOpacity={0.7} accessibilityLabel="Back">
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke={adminColors.onBrand} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={customStyles.headerTitle}>Receiving Activity</Text>
          <TouchableOpacity style={customStyles.refreshBtn} activeOpacity={0.7} accessibilityLabel="Refresh">
            <RefreshRetryIcon size={18} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>

        <View style={customStyles.selectorPill}>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <Path d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4M12 3L2 8v1M12 3l10 5v1" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={customStyles.selectorText}>{scopeLabel(scope)}</Text>
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path d="M6 9l6 6 6-6" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
      </View>

      <ScrollView contentContainerStyle={customStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={customStyles.sectionHeading}>Receiving Activity Timeline</Text>

        <View style={customStyles.timelineCard}>
          {steps.map((step, idx) => (
            <TouchableOpacity
              key={`${step.label}-${idx}`}
              style={customStyles.timelineRow}
              onPress={() => onSelectStep(step.key)}
              activeOpacity={0.7}
            >
              <View style={customStyles.timelineCircle}>
                <View style={customStyles.timelineDash} />
              </View>
              <Text style={customStyles.timelineTextPending}>{step.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/** The header pill: Main reads every warehouse, a Sub scope its own (BR-30). */
function scopeLabel(scope: WarehouseScope): string {
  return isMainScope(scope) ? t('mainDashboard.allWarehouses') : scope.warehouseName ?? scope.warehouseId ?? '';
}

const QUEUE_TAB_LABEL: Record<PendingQueueTab, 'receiving.dash.queue.arrived' | 'receiving.dash.queue.inProgress' | 'receiving.dash.queue.qcPending'> = {
  Arrived: 'receiving.dash.queue.arrived',
  'In Progress': 'receiving.dash.queue.inProgress',
  'QC Pending': 'receiving.dash.queue.qcPending',
};

export interface PendingQueueScreenProps {
  scope: WarehouseScope;
  can: PermissionCheck;
  onBack: () => void;
  /** A purchase order (its uuid). */
  onSelectShipment: (shipmentId: string) => void;
}

/**
 * The Pending Receiving Queue (M2-01): the orders still to finish, from the
 * same live orders and receipts as the dashboard (pendingQueueOf). No
 * "Decision Pending" tab: the decision is part of the quality check (BR-106).
 */
export function PendingQueueScreen({ scope, can, onBack, onSelectShipment }: PendingQueueScreenProps) {
  const [selectedTab, setSelectedTab] = useState<PendingQueueTab>('Arrived');
  const canView = canViewReceiving(can);
  const naming = useReceivingNaming(scope, can);
  const dashboard = useReceivingDashboard(receivingWarehouseFilter(scope, undefined), naming.naming, canView);
  const sections = useMemo(() => pendingQueueOf(dashboard.shipments), [dashboard.shipments]);
  const queueItems = pendingQueueRows(sections, selectedTab);
  const view = queryViewState({ isLoading: dashboard.isLoading, error: dashboard.error, itemCount: queueItems.length });

  return (
    <SafeAreaView style={customStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={adminColors.brand} />
      <View style={customStyles.header}>
        <View style={customStyles.headerTop}>
          <TouchableOpacity onPress={onBack} style={customStyles.backBtn} activeOpacity={0.7} accessibilityLabel="Back">
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke={adminColors.onBrand} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={customStyles.headerTitle}>Pending Queue</Text>
          <TouchableOpacity style={customStyles.refreshBtn} onPress={dashboard.refresh} activeOpacity={0.7} accessibilityLabel={t('receiving.dash.refresh')}>
            <RefreshRetryIcon size={18} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>

        <View style={customStyles.selectorPill}>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <Path d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4M12 3L2 8v1M12 3l10 5v1" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={customStyles.selectorText}>{scopeLabel(scope)}</Text>
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path d="M6 9l6 6 6-6" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
      </View>

      <ScrollView contentContainerStyle={customStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={customStyles.sectionHeading}>Pending Receiving Queue</Text>

        {/* Tab Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={customStyles.pillsContainer}>
          {PENDING_QUEUE_TABS.map((tab) => {
            const isSelected = selectedTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[customStyles.tabPill, isSelected ? customStyles.tabPillActive : customStyles.tabPillInactive]}
                onPress={() => setSelectedTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[customStyles.tabPillText, isSelected ? customStyles.tabPillTextActive : customStyles.tabPillTextInactive]}>
                  {t(QUEUE_TAB_LABEL[tab])}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Scroll indicator track */}
        <View style={customStyles.trackContainer}>
          <Svg width={10} height={10} viewBox="0 0 24 24" fill={adminColors.muted}>
            <Path d="M16 5l-8 7 8 7V5z" />
          </Svg>
          <View style={customStyles.trackBar}>
            <View style={customStyles.trackThumb} />
          </View>
          <Svg width={10} height={10} viewBox="0 0 24 24" fill={adminColors.muted}>
            <Path d="M8 5l8 7-8 7V5z" />
          </Svg>
        </View>

        {view === 'loading' ? <AdminLoadingState /> : null}
        {view === 'error' ? <AdminErrorState error={dashboard.error} onRetry={dashboard.refresh} /> : null}
        {view === 'empty' ? <AdminEmptyState /> : null}

        {/* Cards */}
        {queueItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={customStyles.queueCard}
            onPress={() => onSelectShipment(item.id)}
            activeOpacity={0.8}
          >
            <View style={customStyles.queueCardIconBox}>
              <TruckDeliveryIcon size={20} color={adminColors.warning.text} />
            </View>
            <View style={customStyles.queueCardContent}>
              <Text style={customStyles.queueCardTitle}>{item.code}</Text>
              <Text style={customStyles.queueCardSubtitle}>
                {[item.to, item.produce, item.expectedGrams === null ? '' : kgLabel(item.expectedGrams)].filter((p) => p !== '').join(' · ')}
              </Text>
            </View>
            <View style={customStyles.queueBadge}>
              <Text style={customStyles.queueBadgeText}>{item.statusLabel}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const customStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: adminColors.canvas,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: adminColors.brand,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backBtn: {
    padding: 6,
    marginLeft: -6,
  },
  headerTitle: {
    ...adminType.title,
    fontWeight: '800',
    color: adminColors.onBrand,
    flex: 1,
    marginLeft: 8,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: adminColors.brandDeep,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  selectorText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  lightHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: adminColors.canvas,
  },
  lightHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  lightHeaderTitle: {
    ...adminType.title,
    fontWeight: '800',
    color: adminColors.brandDeep,
    flex: 1,
    marginLeft: 8,
  },
  lightRefreshBtn: {
    width: 36,
    height: 36,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightSelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: adminColors.warning.bg,
    borderWidth: 1,
    borderColor: adminColors.warning.border,
    borderRadius: adminRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  lightSelectorText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
  },
  sectionHeading: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.brandDeep,
    marginBottom: 12,
  },
  timelineCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 16,
    marginBottom: 14,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: adminColors.border,
    borderWidth: 1.5,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCircleDone: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  timelineDash: {
    width: 6,
    height: 2,
    backgroundColor: adminColors.muted,
  },
  timelineTextDone: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  timelineTextPending: {
    ...adminType.rowTitle,
    color: adminColors.muted,
  },
  timelineNoticeBox: {
    backgroundColor: adminColors.warning.bg,
    borderRadius: adminRadius.md,
    padding: 14,
  },
  timelineNoticeText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.warning.text,
    lineHeight: 18,
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  tabPill: {
    borderRadius: adminRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tabPillActive: {
    backgroundColor: adminColors.brand,
  },
  tabPillInactive: {
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  tabPillText: {
    ...adminType.caption,
    fontWeight: '700',
  },
  tabPillTextActive: {
    color: adminColors.onBrand,
  },
  tabPillTextInactive: {
    color: adminColors.ink,
  },
  trackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 10,
  },
  trackBar: {
    width: 140,
    height: 6,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.border,
    position: 'relative',
  },
  trackThumb: {
    width: 60,
    height: 6,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.muted,
  },
  queueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginTop: 8,
  },
  queueCardIconBox: {
    width: 44,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.warning.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  queueCardContent: {
    flex: 1,
  },
  queueCardTitle: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.ink,
  },
  queueCardSubtitle: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 3,
  },
  queueBadge: {
    backgroundColor: adminColors.success.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: adminRadius.sm,
  },
  queueBadgeText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.success.text,
  },
});
