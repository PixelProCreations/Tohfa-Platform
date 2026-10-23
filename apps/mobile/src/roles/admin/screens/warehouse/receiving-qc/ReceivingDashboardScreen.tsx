/**
 * Goods Receiving dashboard (the Receiving tab hub, design M2-01), shared by
 * the Main and Sub warehouse admins.
 *
 * Extracted from the Sub shell's inline Receiving "overview" sub-view and
 * absorbs the Main ReceivingDashboardScreen and IncomingGoodsOperationsScreen.
 * Every figure is counted from the warehouse's purchase orders and goods
 * receipts (ReceivingFlow walks both lists) by receivingViews.ts
 * receivingOverviewOf, and each tile says exactly what it counts: the order
 * list has no date filter, so the open-order tile is "Not Yet Received" (every
 * open order with nothing received), never "Expected Today". The Needs
 * Attention rows are the receipts still awaiting their quality check.
 *
 * Not drawn (owner decisions / no API): the Arrived tile, queue row and the
 * "Shipment Arrived" stage (a purchase order has no arrival step: recording a
 * receipt is the arrival), Avg Turnaround and Discrepancies (no API), and the
 * Decision / Batch / Storage Pending queue rows (BR-106 does all three inside
 * the quality check, so they are never pending on their own).
 *
 * Main-only (scope.warehouseId undefined): the warehouse selector (the shared
 * ScopeHeader picker, fed by GET /warehouses; its pick is the same
 * `filterWarehouseId` route param Search & Filters sets, sent as `warehouseId`
 * on both lists), the Receiving Activity preview and the Pending Receiving
 * Queue (each with its own screen), and Quick Actions (only actions whose
 * destination exists). A Sub scope always sends its own warehouse (BR-30).
 *
 * Gates: viewing needs inventory.batch.view or inventory.goods_receipt.record;
 * Start Receiving needs inventory.goods_receipt.record. The server re-checks
 * every action (CLAUDE.md 2.1).
 */
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { OverviewCardsGrid, OverviewDashboardCard } from '../../../components';
import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import {
  BellRingIcon,
  HeaderIconButton,
  InfoNote,
  ScopeHeader,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletScreen,
  WarehouseTabBar,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { isMainScope } from './mappers';
import {
  AlertCircleOutlineIcon,
  ChevronRightSmall,
  CrateInventoryIcon,
  PermissionNote,
  RECEIVING_CODES,
  ReceiptPaperIcon,
  TransferArrowsIcon,
  canViewReceiving,
  qualityIssueTone,
  receiptTone,
} from './ReceivingParts';
import {
  pendingQueueOf,
  receivingActivityOf,
  receivingOverviewOf,
  receivingQuickActions,
  type PendingQueueGroup,
  type ReceivingQuickAction,
} from './receivingViews';
import type {
  HistoryFilter,
  IncomingShipment,
  QualityIssue,
  ReceivingLiveStateProps,
  ReceivingRecord,
  ShipmentFilterTab,
  WarehouseScope,
  WarehouseScreenBaseProps,
} from './types';

/** Needs Attention / activity rows previewed on the hub. */
const ATTENTION_PREVIEW = 3;
const RECENT_PREVIEW = 2;

const QUEUE_LABEL: Record<PendingQueueGroup, 'receiving.queue.awaitingQc' | 'receiving.queue.partlyReceived' | 'receiving.queue.notYetReceived'> = {
  awaitingQc: 'receiving.queue.awaitingQc',
  partlyReceived: 'receiving.queue.partlyReceived',
  notYetReceived: 'receiving.queue.notYetReceived',
};

const QUICK_ACTION_LABEL: Record<ReceivingQuickAction, 'receiving.quickAction.transferReceiving' | 'receiving.quickAction.receivingHistory'> = {
  transferReceiving: 'receiving.quickAction.transferReceiving',
  receivingHistory: 'receiving.quickAction.receivingHistory',
};

export interface ReceivingDashboardScreenProps extends WarehouseScreenBaseProps, ReceivingLiveStateProps {
  /** The warehouse's purchase orders, with progress from their receipts. */
  shipments?: readonly IncomingShipment[] | undefined;
  /** The warehouse's goods receipts, newest first. */
  records?: readonly ReceivingRecord[] | undefined;
  /** Receipts awaiting their quality check. */
  issues?: readonly QualityIssue[] | undefined;
  /** False when a list stopped early, so the counts may be partial. */
  complete?: boolean | undefined;
  /** Main: the warehouses to pick from (GET /warehouses); empty for a Sub scope. */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** Main: the picked warehouse uuid; undefined = all warehouses. */
  selectedWarehouseId?: string | undefined;
  /** Main: pick a warehouse (undefined = all). Never offered to a Sub scope (BR-30). */
  onSelectWarehouse?: ((warehouseId: string | undefined) => void) | undefined;
  /** Unread notifications for the bell badge. */
  unreadNotifications?: number | undefined;
  onOpenNotifications?: (() => void) | undefined;
  onOpenShipments: (tab: ShipmentFilterTab) => void;
  onOpenHistory: (filter: HistoryFilter) => void;
  onOpenQualityIssues: () => void;
  onSelectIssue: (issue: QualityIssue) => void;
  onSelectRecord: (receiptId: string) => void;
  /** Start Receiving (needs inventory.goods_receipt.record): pick an order to receive. */
  onStartReceiving: () => void;
  /** Main: the Receiving Activity screen (the receipts, newest first). */
  onOpenActivity?: (() => void) | undefined;
  /** Main: the Pending Receiving Queue screen (orders still to finish). */
  onOpenPendingQueue?: (() => void) | undefined;
  /** Main: inter-warehouse arrivals (the transfers flow), when the host offers it. */
  onOpenTransferReceiving?: (() => void) | undefined;
}

export function ReceivingDashboardScreen({
  scope,
  can,
  onBack,
  onTabChange,
  shipments = [],
  records = [],
  issues = [],
  complete = true,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  warehouseOptions,
  selectedWarehouseId,
  onSelectWarehouse,
  unreadNotifications = 0,
  onOpenNotifications,
  onOpenShipments,
  onOpenHistory,
  onOpenQualityIssues,
  onSelectIssue,
  onSelectRecord,
  onStartReceiving,
  onOpenActivity,
  onOpenPendingQueue,
  onOpenTransferReceiving,
}: ReceivingDashboardScreenProps) {
  const mainView = isMainScope(scope);
  const canView = canViewReceiving(can);
  const canRecord = can(RECEIVING_CODES.receiptRecord);

  const header = {
    title: t(mainView ? 'receiving.dashboard.title' : 'receiving.dashboard.subTitle'),
    onBack,
    headerRight: onOpenNotifications ? (
      <HeaderIconButton onPress={onOpenNotifications} accessibilityLabel={t('receiving.dashboard.notifications')}>
        <BellRingIcon size={20} color={adminColors.onBrand} />
        {unreadNotifications > 0 ? (
          <View style={styles.bellBadge}>
            <Text style={styles.bellBadgeText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
          </View>
        ) : null}
      </HeaderIconButton>
    ) : undefined,
    headerExtra: (
      <ScopeHeader
        scope={scope}
        label={mainView ? undefined : scope.warehouseName ?? scope.warehouseId}
        warehouseOptions={warehouseOptions}
        selectedWarehouseId={selectedWarehouseId}
        onSelectWarehouse={mainView ? onSelectWarehouse : undefined}
      />
    ),
    footer: onTabChange ? <WarehouseTabBar activeTab="Receiving" onTabChange={onTabChange} onBack={onBack} /> : undefined,
  };

  if (!canView) {
    return (
      <WalletScreen {...header}>
        <View style={walletLayout.scrollContent}>
          <PermissionNote message={t('receiving.dashboard.noViewPermission')} />
        </View>
      </WalletScreen>
    );
  }

  // Every tile is counted from BOTH lists, so nothing is shown until both
  // loaded: one list alone would show the other's tiles as 0.
  if (isLoading) {
    return (
      <WalletScreen {...header}>
        <AdminLoadingState />
      </WalletScreen>
    );
  }
  if (error !== null && error !== undefined) {
    return (
      <WalletScreen {...header}>
        <AdminErrorState error={error} onRetry={onRetry} />
      </WalletScreen>
    );
  }

  const overview = receivingOverviewOf(shipments, records, new Date());
  const tiles = [
    {
      key: 'notYetReceived',
      title: t('receiving.overview.notYetReceived'),
      subtitle: t('receiving.overview.notYetReceivedSub'),
      value: overview.notYetReceived,
      icon: 'truck' as const,
      tone: 'default' as const,
      onPress: () => onOpenShipments('Expected'),
    },
    {
      key: 'partlyReceived',
      title: t('receiving.overview.partlyReceived'),
      subtitle: t('receiving.overview.partlyReceivedSub'),
      value: overview.partlyReceived,
      icon: 'receiving' as const,
      tone: 'default' as const,
      onPress: () => onOpenShipments('Receiving'),
    },
    {
      key: 'awaitingQc',
      title: t('receiving.overview.awaitingQc'),
      subtitle: t('receiving.overview.awaitingQcSub'),
      value: overview.awaitingQc,
      icon: 'alert' as const,
      tone: overview.awaitingQc > 0 ? ('danger' as const) : ('default' as const),
      onPress: onOpenQualityIssues,
    },
    {
      key: 'partiallyAccepted',
      title: t('receiving.overview.partiallyAccepted'),
      subtitle: t('receiving.overview.partiallyAcceptedSub'),
      value: overview.partiallyAccepted,
      icon: 'box' as const,
      tone: 'warning' as const,
      onPress: () => onOpenHistory('Partial'),
    },
    {
      key: 'completedToday',
      title: t('receiving.overview.completedToday'),
      subtitle: t('receiving.overview.completedTodaySub'),
      value: overview.completedToday,
      icon: 'inventory' as const,
      tone: 'success' as const,
      onPress: () => onOpenHistory('All'),
    },
  ];
  const activity = receivingActivityOf(records).slice(0, RECENT_PREVIEW);
  const queue = pendingQueueOf(shipments);
  const quickActions = receivingQuickActions({ transferReceiving: onOpenTransferReceiving !== undefined });
  const openQuickAction = (action: ReceivingQuickAction) => {
    if (action === 'transferReceiving') onOpenTransferReceiving?.();
    else onOpenHistory('All');
  };

  const recordRow = (rec: ReceivingRecord) => (
    <TouchableOpacity key={rec.id} style={styles.card} onPress={() => onSelectRecord(rec.id)} activeOpacity={0.8} accessibilityRole="button">
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle}>{rec.receiptId}</Text>
        <StatusBadge label={rec.resultLabel} tone={receiptTone(rec.result)} />
      </View>
      <Text style={styles.cardMeta}>
        {/* The row's grade is the order's listed grade (the assigned one is the batch's, BR-106). */}
        {[rec.product, rec.grade === '' ? '' : t('receiving.detail.listedGradeValue', { grade: rec.grade }), mainView ? rec.warehouseName : '']
          .filter((part) => part !== '')
          .join(' · ')}
      </Text>
      <View style={styles.rowBetween}>
        <Text style={styles.cardValue}>{rec.receivedGrams === null ? t('inventory.noValue') : formatKg(rec.receivedGrams)}</Text>
        <Text style={styles.cardMeta}>{rec.date}</Text>
      </View>
    </TouchableOpacity>
  );

  const viewLink = (label: string, onPress: (() => void) | undefined) =>
    onPress ? (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button">
        <Text style={styles.link}>{label}</Text>
      </TouchableOpacity>
    ) : undefined;

  return (
    <WalletScreen {...header}>
      <ScrollView
        contentContainerStyle={walletLayout.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[adminColors.brand]} tintColor={adminColors.brand} />
          ) : undefined
        }
      >
        <SectionTitle right={viewLink(t('receiving.overview.viewShipments'), () => onOpenShipments('All'))}>
          {t('receiving.overview.title')}
        </SectionTitle>
        {!complete ? <InfoNote tone="brandSoft">{t('receiving.totals.incomplete')}</InfoNote> : null}
        <OverviewCardsGrid style={styles.grid}>
          {tiles.map((tile) => (
            <OverviewDashboardCard
              key={tile.key}
              title={tile.title}
              subtitle={tile.subtitle}
              value={tile.value}
              icon={tile.icon}
              tone={tile.tone}
              onPress={tile.onPress}
            />
          ))}
        </OverviewCardsGrid>

        {canRecord ? (
          <TouchableOpacity style={styles.startButton} onPress={onStartReceiving} activeOpacity={0.85} accessibilityRole="button">
            <CrateInventoryIcon size={20} color={adminColors.onBrand} />
            <Text style={styles.startButtonText}>{t('receiving.dashboard.startReceiving')}</Text>
          </TouchableOpacity>
        ) : (
          <PermissionNote message={t('receiving.dashboard.noRecordPermission')} />
        )}

        {issues.length > 0 ? (
          <>
            <SectionTitle>{t('receiving.dashboard.needsAttention')}</SectionTitle>
            {issues.slice(0, ATTENTION_PREVIEW).map((issue) => {
              const tone = adminColors[qualityIssueTone(issue.kind)];
              return (
                <TouchableOpacity
                  key={issue.id}
                  style={styles.attentionCard}
                  onPress={() => onSelectIssue(issue)}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                >
                  <View style={[styles.attentionAccent, { backgroundColor: tone.border }]} />
                  <View style={[styles.attentionIcon, { backgroundColor: tone.bg }]}>
                    <AlertCircleOutlineIcon size={18} color={tone.text} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.cardTitle}>{issue.kind}</Text>
                    <Text style={styles.cardMeta}>
                      {issue.produce} — {issue.shipmentCode}
                    </Text>
                  </View>
                  <ChevronRightSmall color={tone.text} />
                </TouchableOpacity>
              );
            })}
          </>
        ) : null}

        {mainView ? (
          <>
            <SectionTitle right={viewLink(t('receiving.dashboard.view'), onOpenActivity)}>{t('receiving.dashboard.activity')}</SectionTitle>
            {activity.length === 0 ? <Text style={styles.cardMeta}>{t('receiving.empty.receipts')}</Text> : activity.map(recordRow)}

            <SectionTitle right={viewLink(t('receiving.dashboard.view'), onOpenPendingQueue)}>{t('receiving.dashboard.queue')}</SectionTitle>
            <View style={styles.card}>
              {queue.map((section, index) => (
                <TouchableOpacity
                  key={section.group}
                  style={[styles.queueRow, index > 0 && styles.queueRowDivider]}
                  onPress={onOpenPendingQueue}
                  disabled={onOpenPendingQueue === undefined}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                >
                  <Text style={styles.queueLabel}>{t(QUEUE_LABEL[section.group])}</Text>
                  <Text style={styles.queueValue}>{section.shipments.length}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <SectionTitle>{t('receiving.dashboard.quickActions')}</SectionTitle>
            <View style={styles.quickGrid}>
              {quickActions.map((action) => (
                <TouchableOpacity
                  key={action}
                  style={styles.quickCard}
                  onPress={() => openQuickAction(action)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  {action === 'transferReceiving' ? (
                    <TransferArrowsIcon size={20} color={adminColors.brand} />
                  ) : (
                    <ReceiptPaperIcon size={20} color={adminColors.brand} />
                  )}
                  <Text style={styles.quickText}>{t(QUICK_ACTION_LABEL[action])}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <>
            <SectionTitle right={viewLink(t('receiving.dashboard.viewAll'), () => onOpenHistory('All'))}>
              {t('receiving.dashboard.recent')}
            </SectionTitle>
            {activity.length === 0 ? <Text style={styles.cardMeta}>{t('receiving.empty.receipts')}</Text> : activity.map(recordRow)}
          </>
        )}

        <View style={styles.spacer} />
        <WalletButton label={t('receiving.dashboard.viewShipments')} variant="outline" onPress={() => onOpenShipments('All')} />
      </ScrollView>
    </WalletScreen>
  );
}

const ICON_CHIP = 36;
const BADGE = 16;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  spacer: { height: adminSpacing.sm },
  grid: { marginBottom: adminSpacing.md },
  startButton: {
    height: ADMIN_BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: adminSpacing.sm,
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    marginBottom: adminSpacing.md,
    ...adminShadow.sm,
  },
  startButtonText: { ...adminType.sectionHead, color: adminColors.onBrand },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { ...adminType.rowTitle, color: adminColors.ink },
  cardMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  cardValue: { ...adminType.rowTitle, color: adminColors.ink, marginTop: adminSpacing.xs },
  link: { ...adminType.caption, color: adminColors.brand, fontWeight: '700' },
  attentionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: adminSpacing.md,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: adminSpacing.md,
    paddingRight: adminSpacing.md,
    marginBottom: adminSpacing.sm,
    overflow: 'hidden',
  },
  attentionAccent: { width: adminSpacing.xs, alignSelf: 'stretch' },
  attentionIcon: {
    width: ICON_CHIP,
    height: ICON_CHIP,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: adminSpacing.sm },
  queueRowDivider: { borderTopWidth: 1, borderTopColor: adminColors.border },
  queueLabel: { ...adminType.sectionHead, color: adminColors.ink },
  queueValue: { ...adminType.sectionHead, color: adminColors.ink },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm, marginBottom: adminSpacing.md },
  quickCard: {
    flexBasis: '45%',
    flexGrow: 1,
    alignItems: 'center',
    gap: adminSpacing.xs,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  quickText: { ...adminType.rowTitle, color: adminColors.ink, textAlign: 'center' },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: BADGE,
    height: BADGE,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.danger.text,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: { ...adminType.caption, color: adminColors.onBrand },
});
