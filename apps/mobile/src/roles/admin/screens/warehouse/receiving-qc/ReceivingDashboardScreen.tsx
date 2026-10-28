/**
 * Goods Receiving dashboard (the Receiving tab hub, design M2-01), shared by
 * the Main and Sub warehouse admins.
 *
 * Extracted from the Sub shell's inline Receiving "overview" sub-view (six
 * overview tiles, Start Receiving, Needs Attention, Recent Receiving) and
 * absorbs the Main ReceivingDashboardScreen and IncomingGoodsOperationsScreen.
 *
 * Live data: useReceivingDashboard (every purchase order and goods receipt of
 * the warehouse in view) -> receivingOverviewOf; each tile / KPI / queue row
 * shows the figure its label names (./receivingLists.ts). Figures the API has
 * no source for are not rendered: the Main Discrepancies (no network-wide
 * discrepancy list) and Avg Turnaround (no metric) KPIs, and the Decision /
 * Batch / Storage Pending queue rows (one quality-check call decides, batches
 * and locates a receipt, BR-106). Needs Attention lists the receipts awaiting
 * their quality check (the only receiving issue the API backs).
 *
 * Main-only (scope.warehouseId undefined): the live warehouse selector (BR-30:
 * a Sub scope always reads its own warehouse), the Transfer Receiving card,
 * the Receiving Activity pipeline and the Pending Receiving Queue.
 *
 * Gates: viewing needs inventory.batch.view or inventory.goods_receipt.record;
 * Start Receiving needs inventory.goods_receipt.record. The server re-checks
 * every action (CLAUDE.md 2.1).
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t, type TranslationKey } from '../../../i18n';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { OverviewDashboardCard } from '../../../components';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  BellRingIcon,
  HeaderIconButton,
  ScopeHeader,
  StatusBadge,
  WalletScreen,
  WarehouseTabBar,
} from '../wallet-cashtopup/WalletParts';
import {
  AlertCircleOutlineIcon,
  CalendarOutlineIcon,
  CheckmarkCircleOutlineIcon,
  ChevronRightSmall,
  CircleEllipsisIcon,
  ClockSmallIcon,
  CrateInventoryIcon,
  FlaskOutlineIcon,
  NotEqualIcon,
  PermissionNote,
  RECEIVING_CODES,
  ReceiptPaperIcon,
  RefreshRetryIcon,
  ShipmentBoxIcon,
  TransferArrowsIcon,
  TrayDownloadIcon,
  TruckDeliveryIcon,
  WarningTriangleIcon,
  canViewReceiving,
} from './ReceivingParts';
import type { LiveQualityIssue } from './liveTypes';
import { isMainScope, kgLabel, receivingWarehouseFilter } from './mappers';
import { liveReceiptTone, mainKpiValues, mainQueueValues, subTileValues, type MainKpiKey, type MainQueueKey } from './receivingLists';
import { receivingOverviewOf } from './receivingViews';
import { useReceivingDashboard, useReceivingNaming } from './useReceivingData';
import type { HistoryFilter, ShipmentFilterTab, WarehouseScreenBaseProps } from './types';

/** Needs Attention / Recent Receiving rows previewed on the hub. */
const ATTENTION_PREVIEW = 3;
const RECENT_PREVIEW = 2;

/** Copy, unit, icon and target of each Main KPI card the API backs (the figure comes from mainKpiValues). */
const MAIN_KPI_COPY: Record<MainKpiKey, { label: TranslationKey; unit: TranslationKey; icon: string; tab?: ShipmentFilterTab }> = {
  expected: { label: 'receiving.dash.tile.expectedToday', unit: 'receiving.dash.kpi.unitShipments', icon: 'receiving', tab: 'Expected' },
  arrived: { label: 'receiving.dash.kpi.arrived', unit: 'receiving.dash.kpi.unitShipments', icon: 'truck', tab: 'Arrived' },
  in_progress: { label: 'receiving.dash.kpi.inProgress', unit: 'receiving.dash.kpi.unitReceiving', icon: 'orders', tab: 'Receiving' },
  completed: { label: 'receiving.dash.kpi.completed', unit: 'receiving.dash.kpi.unitToday', icon: 'pickup' },
};

/** Copy and list tab of each Main queue row the API backs. */
const MAIN_QUEUE_COPY: Record<MainQueueKey, { label: TranslationKey; tab: ShipmentFilterTab }> = {
  arrived: { label: 'receiving.dash.queue.arrived', tab: 'Arrived' },
  in_progress: { label: 'receiving.dash.queue.inProgress', tab: 'Receiving' },
  qc_pending: { label: 'receiving.dash.queue.qcPending', tab: 'QC Pending' },
};

export interface ReceivingDashboardScreenProps extends WarehouseScreenBaseProps {
  /** Unread notifications for the bell badge. */
  unreadNotifications?: number | undefined;
  onOpenNotifications?: (() => void) | undefined;
  onOpenShipments: (tab: ShipmentFilterTab) => void;
  onOpenHistory: (filter: HistoryFilter) => void;
  onOpenQualityIssues: () => void;
  /** A receipt awaiting its quality check (the host resumes it in the wizard). */
  onSelectIssue: (issue: LiveQualityIssue) => void;
  /** A receipt (uuid). */
  onSelectRecord: (receiptId: string) => void;
  /** A purchase order (uuid) from the recent list. */
  onSelectShipment?: ((shipmentId: string) => void) | undefined;
  /** Start Receiving (needs inventory.goods_receipt.record); the host lists the orders to pick from. */
  onStartReceiving: () => void;
  /** Main: Shipment Arrived (the host lists the expected orders to pick from). */
  onShipmentArrived?: (() => void) | undefined;
  /** Main: inter-warehouse arrivals (the transfers flow). */
  onOpenTransferReceiving?: (() => void) | undefined;
  /** Main: View Incoming Shipments. */
  onViewIncomingShipments?: (() => void) | undefined;
  /** Main: damage / mismatch report quick action (receipt-scoped: the host opens Receiving History). */
  onOpenDamageReport?: (() => void) | undefined;
  /** Main: goods receipt summary quick action (receipt-scoped: the host opens Receiving History). */
  onOpenReceiptSummary?: (() => void) | undefined;
  /** Main: view receiving activity timeline */
  onOpenActivity?: (() => void) | undefined;
  /** Main: view pending receiving queue */
  onOpenPendingQueue?: (() => void) | undefined;
}

export function ReceivingDashboardScreen({
  scope,
  can,
  onBack,
  onTabChange,
  unreadNotifications = 0,
  onOpenNotifications,
  onOpenShipments,
  onOpenHistory,
  onOpenQualityIssues,
  onSelectIssue,
  onSelectRecord,
  onSelectShipment,
  onStartReceiving,
  onShipmentArrived,
  onOpenTransferReceiving,
  onViewIncomingShipments,
  onOpenDamageReport,
  onOpenReceiptSummary,
  onOpenActivity,
  onOpenPendingQueue,
}: ReceivingDashboardScreenProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const mainView = isMainScope(scope);
  const canView = canViewReceiving(can);
  const canRecord = can(RECEIVING_CODES.receiptRecord);

  const naming = useReceivingNaming(scope, can);
  const dashboard = useReceivingDashboard(receivingWarehouseFilter(scope, selectedWarehouseId), naming.naming, canView);
  const overview = useMemo(() => receivingOverviewOf(dashboard.shipments, dashboard.records, new Date()), [dashboard.shipments, dashboard.records]);
  const view = queryViewState({
    isLoading: dashboard.isLoading,
    error: dashboard.error,
    itemCount: dashboard.shipments.length + dashboard.records.length,
  });

  const effectiveIssues = dashboard.issues.slice(0, ATTENTION_PREVIEW);
  const effectiveRecords = dashboard.records.slice(0, RECENT_PREVIEW);
  const sub = subTileValues(overview);

  const tiles: { key: string; label: string; value: number | string; icon: React.ReactNode; alert?: boolean; onPress: () => void }[] = [
    {
      key: 'expected',
      label: t('receiving.dash.tile.expectedToday'),
      value: sub.expected,
      icon: <CalendarOutlineIcon size={22} color={adminColors.brandDeep} />,
      onPress: () => onOpenShipments('Expected'),
    },
    {
      key: 'awaiting',
      label: t('receiving.dash.tile.awaitingReceiving'),
      value: sub.awaiting,
      icon: <CircleEllipsisIcon size={22} color={adminColors.brandDeep} />,
      // Awaiting Receiving counts the open orders with nothing received: the Expected list.
      onPress: () => onOpenShipments('Expected'),
    },
    {
      key: 'qc',
      label: t('receiving.dash.tile.awaitingQc'),
      value: sub.qc,
      icon: <FlaskOutlineIcon size={22} color={adminColors.brandDeep} />,
      alert: true,
      onPress: () => onOpenShipments('QC Pending'),
    },
    {
      key: 'partial',
      label: t('receiving.dash.tile.partiallyAccepted'),
      value: sub.partial,
      icon: <NotEqualIcon size={22} color={adminColors.brandDeep} />,
      onPress: () => onOpenHistory('Partial'),
    },
    {
      key: 'completed',
      label: t('receiving.dash.tile.completedToday'),
      value: sub.completed,
      icon: <CheckmarkCircleOutlineIcon size={22} color={adminColors.brandDeep} />,
      onPress: () => onOpenHistory('Accepted'),
    },
    {
      key: 'issues',
      label: t('receiving.dash.tile.issues'),
      value: sub.issues,
      icon: <AlertCircleOutlineIcon size={22} color={adminColors.brandDeep} />,
      alert: true,
      onPress: onOpenQualityIssues,
    },
  ];

  const mainKpis = mainKpiValues(overview).map(({ key, value }) => {
    const copy = MAIN_KPI_COPY[key];
    const tab = copy.tab;
    return {
      key,
      label: t(copy.label),
      value,
      unit: t(copy.unit),
      icon: copy.icon,
      onPress: tab !== undefined ? () => onOpenShipments(tab) : () => onOpenHistory('Accepted'),
    };
  });

  const mainQueueRows = mainQueueValues(overview).map(({ key, value }) => ({
    label: t(MAIN_QUEUE_COPY[key].label),
    value,
    onPress: () => (onOpenPendingQueue ? onOpenPendingQueue() : onOpenShipments(MAIN_QUEUE_COPY[key].tab)),
  }));

  const header = {
    title: mainView ? (
      <View style={styles.headerTitleRow}>
        <TrayDownloadIcon size={24} color={adminColors.onBrand} />
        <Text style={styles.mainHeaderTitleText}>Receiving Dashboard</Text>
      </View>
    ) : (
      'Goods Receiving'
    ),
    headerLeft: undefined,
    onBack: onBack ?? (() => {}),
    headerRight: mainView ? (
      <HeaderIconButton onPress={dashboard.refresh} accessibilityLabel={t('receiving.dash.refresh')}>
        <RefreshRetryIcon size={20} color={adminColors.onBrand} />
      </HeaderIconButton>
    ) : (
      <HeaderIconButton onPress={onOpenNotifications ?? (() => {})} accessibilityLabel="Notifications">
        <BellRingIcon size={20} color={adminColors.onBrand} />
        {unreadNotifications > 0 ? (
          <View style={styles.bellBadge}>
            <Text style={styles.bellBadgeText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
          </View>
        ) : null}
      </HeaderIconButton>
    ),
    headerExtra: (
      <ScopeHeader
        scope={scope}
        label={
          mainView
            ? undefined
            : scope.warehouseName
            ? scope.warehouseName.includes('Warehouse')
              ? scope.warehouseName
              : `${scope.warehouseName} Warehouse`
            : scope.warehouseId
        }
        warehouseOptions={naming.options}
        selectedWarehouseId={selectedWarehouseId}
        onSelectWarehouse={mainView ? setSelectedWarehouseId : undefined}
      />
    ),
    footer: onTabChange ? <WarehouseTabBar activeTab="Receiving" onTabChange={onTabChange} onBack={onBack} /> : undefined,
  };

  if (!canView) {
    return (
      <WalletScreen {...header}>
        <View style={styles.scrollContent}>
          <PermissionNote message="You do not have permission to view goods receiving." />
        </View>
      </WalletScreen>
    );
  }

  if (view === 'loading' || view === 'error') {
    return (
      <WalletScreen {...header}>
        {view === 'loading' ? <AdminLoadingState /> : <AdminErrorState error={dashboard.error} onRetry={dashboard.refresh} />}
      </WalletScreen>
    );
  }

  return (
    <WalletScreen {...header}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {mainView ? (
          <>
            {/* KPI Cards (2 columns): only the ones the API backs */}
            <View style={styles.mainKpiGrid}>
              {mainKpis.map((kpi) => (
                <OverviewDashboardCard
                  key={kpi.key}
                  value={kpi.value}
                  title={kpi.label}
                  subtitle={kpi.unit}
                  icon={kpi.icon}
                  tone="default"
                  onPress={kpi.onPress}
                />
              ))}
            </View>

            {/* Shipment Arrived Button (Center) */}
            <View style={styles.shipmentArrivedContainer}>
              <TouchableOpacity
                style={styles.shipmentArrivedBtn}
                onPress={onShipmentArrived ?? (() => onOpenShipments('Expected'))}
                activeOpacity={0.85}
              >
                <ShipmentBoxIcon size={22} color={adminColors.onBrand} />
                <Text style={styles.shipmentArrivedBtnText}>Shipment Arrived</Text>
              </TouchableOpacity>
            </View>

            {/* Receiving Activity */}
            <View style={styles.mainSectionHeaderRow}>
              <Text style={styles.mainSectionHeaderTitle}>Receiving Activity</Text>
              <TouchableOpacity onPress={onOpenActivity ?? (() => onOpenHistory('All'))} activeOpacity={0.7}>
                <Text style={styles.mainSectionHeaderLink}>View →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.mainActivityCard}>
              <Text style={styles.mainActivityPipelineText}>
                Shipment Created → Arrived → Receiving Started → Quantity Checked → Quality Checked → Decision → Batch Assigned → Storage Assigned → Receipt Completed
              </Text>
            </View>

            {/* Pending Receiving Queue */}
            <View style={styles.mainSectionHeaderRow}>
              <Text style={styles.mainSectionHeaderTitle}>Pending Receiving Queue</Text>
              <TouchableOpacity onPress={onOpenPendingQueue ?? (() => onOpenShipments('All'))} activeOpacity={0.7}>
                <Text style={styles.mainSectionHeaderLink}>View →</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.mainQueueCard}>
              {mainQueueRows.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.mainQueueRow, idx > 0 && styles.mainQueueRowDivider]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.mainQueueLabel}>{item.label}</Text>
                  <Text style={styles.mainQueueValue}>{item.value}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Actions */}
            <View style={styles.mainSectionHeaderRow}>
              <Text style={styles.mainSectionHeaderTitle}>Quick Actions</Text>
            </View>
            <View style={styles.mainQuickActionsGrid}>
              <TouchableOpacity
                style={styles.mainQuickActionCard}
                onPress={() => (onOpenDamageReport ? onOpenDamageReport() : onOpenHistory('All'))}
                activeOpacity={0.8}
              >
                <AlertCircleOutlineIcon size={24} color={adminColors.brand} />
                <Text style={styles.mainQuickActionText}>Damage / Mismatch Report</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mainQuickActionCard}
                onPress={() => (onOpenReceiptSummary ? onOpenReceiptSummary() : onOpenHistory('All'))}
                activeOpacity={0.8}
              >
                <ReceiptPaperIcon size={24} color={adminColors.brand} />
                <Text style={styles.mainQuickActionText}>Goods Receipt Summary</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mainQuickActionCard}
                onPress={() => onOpenTransferReceiving?.()}
                activeOpacity={0.8}
              >
                <TransferArrowsIcon size={24} color={adminColors.brand} />
                <Text style={styles.mainQuickActionText}>Transfer Receiving</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mainQuickActionCard}
                onPress={() => onOpenHistory('All')}
                activeOpacity={0.8}
              >
                <ClockSmallIcon size={24} color={adminColors.brand} />
                <Text style={styles.mainQuickActionText}>Receiving History</Text>
              </TouchableOpacity>
            </View>

            {/* View Incoming Shipments Button */}
            <TouchableOpacity
              style={styles.viewIncomingBtn}
              onPress={onViewIncomingShipments ?? (() => onOpenShipments('All'))}
              activeOpacity={0.85}
            >
              <TruckDeliveryIcon size={20} color={adminColors.onBrand} />
              <Text style={styles.viewIncomingBtnText}>View Incoming Shipments</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.grid}>
              {tiles.map((tile) => (
                <OverviewDashboardCard
                  key={tile.key}
                  value={typeof tile.value === 'number' ? String(tile.value).padStart(2, '0') : tile.value}
                  title={tile.label}
                  subtitle={tile.alert ? 'Needs attention' : undefined}
                  icon={tile.icon}
                  tone={tile.alert ? 'danger' : 'default'}
                  onPress={tile.onPress}
                />
              ))}
            </View>

            {canRecord ? (
              <TouchableOpacity style={styles.startButton} onPress={onStartReceiving} activeOpacity={0.85} accessibilityRole="button">
                <CrateInventoryIcon size={20} color={adminColors.onBrand} />
                <Text style={styles.startButtonText}>Shipment Arrived</Text>
              </TouchableOpacity>
            ) : (
              <PermissionNote message="Recording a goods receipt needs the goods receipt permission." />
            )}

            {effectiveIssues.length > 0 ? (
              <>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.rowCenterSm}>
                    <WarningTriangleIcon size={18} color={adminColors.warning.text} />
                    <Text style={styles.sectionTitleText}>Needs Attention</Text>
                  </View>
                </View>
                {effectiveIssues.map((issue) => (
                  // The only receiving issue the API backs: a receipt awaiting its quality check.
                  <TouchableOpacity
                    key={issue.id}
                    style={styles.attentionCard}
                    onPress={() => onSelectIssue(issue)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                  >
                    <View style={[styles.attentionIconSquare, { backgroundColor: adminColors.warning.bg }]}>
                      <FlaskOutlineIcon size={20} color={adminColors.warning.text} />
                    </View>
                    <View style={styles.flex}>
                      <Text style={styles.attentionTitle}>{t('receiving.issueKind.qcPending')}</Text>
                      <Text style={styles.attentionMeta}>
                        {issue.produce} — {issue.shipmentCode}
                      </Text>
                    </View>
                    <ChevronRightSmall color={adminColors.muted} size={18} />
                  </TouchableOpacity>
                ))}
              </>
            ) : null}

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitleText}>Incoming Shipments</Text>
              <TouchableOpacity
                onPress={() => onOpenShipments('All')}
                accessibilityRole="button"
              >
                <Text style={styles.viewDetailsLink}>View all</Text>
              </TouchableOpacity>
            </View>
            {effectiveRecords.map((rec) => (
              <TouchableOpacity
                key={rec.id}
                style={styles.card}
                onPress={() => {
                  if (onSelectShipment) {
                    onSelectShipment(rec.purchaseOrderId);
                  } else {
                    onSelectRecord(rec.id);
                  }
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitle}>{rec.receiptId}</Text>
                  <StatusBadge label={rec.resultLabel} tone={liveReceiptTone(rec.result)} />
                </View>
                <Text style={styles.cardMeta}>
                  {rec.grade !== '' ? `${rec.product} · ${rec.grade}` : rec.product}
                </Text>
                {rec.receivedGrams !== null ? <Text style={styles.cardValue}>{kgLabel(rec.receivedGrams)}</Text> : null}
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const ICON_CHIP = 36;
const BADGE = 16;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: adminSpacing.lg,
    paddingTop: adminSpacing.md,
    paddingBottom: adminSpacing.xl,
  },
  spacer: { height: adminSpacing.sm },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.sm,
  },
  rowCenterSm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitleText: {
    ...adminType.sectionHead,
    color: adminColors.ink,
  },
  viewDetailsLink: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.brandDeep,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: adminSpacing.md,
  },
  tile: {
    width: '48.2%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    gap: 4,
  },
  tileValue: {
    ...adminType.title,
    fontWeight: '800',
    color: adminColors.ink,
    marginTop: adminSpacing.xs,
  },
  tileValueAlert: { color: adminColors.danger.text },
  tileLabel: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.muted,
  },
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
  startButtonText: { ...adminType.sectionHead, color: adminColors.onBrand, fontWeight: '700' },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 14,
    marginBottom: 10,
  },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconChip: {
    width: ICON_CHIP,
    height: ICON_CHIP,
    borderRadius: adminRadius.sm,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { ...adminType.rowTitle, color: adminColors.ink },
  cardMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: 2 },
  cardValue: { ...adminType.rowTitle, color: adminColors.ink, marginTop: adminSpacing.xs },
  link: { ...adminType.caption, color: adminColors.brand, fontWeight: '700' },
  attentionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
  },
  attentionIconSquare: {
    width: 40,
    height: 40,
    borderRadius: adminRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionTitle: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  attentionMeta: {
    ...adminType.caption,
    color: adminColors.muted,
    marginTop: 2,
  },
  pipelineText: { ...adminType.body, color: adminColors.ink },
  queueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: adminSpacing.sm },
  queueRowDivider: { borderTopWidth: 1, borderTopColor: adminColors.border },
  queueLabel: { ...adminType.sectionHead, color: adminColors.ink },
  queueValue: { ...adminType.sectionHead, color: adminColors.ink },
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

  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mainHeaderTitleText: {
    ...adminType.title,
    fontWeight: '800',
    color: adminColors.onBrand,
  },
  mainKpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 16,
  },
  mainKpiCard: {
    width: '48.2%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    gap: 2,
  },
  mainKpiLabel: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.muted,
    letterSpacing: 0.3,
  },
  mainKpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
    marginTop: 4,
  },
  mainKpiUnit: {
    ...adminType.caption,
    fontWeight: '500',
    color: adminColors.muted,
  },
  mainSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 10,
  },
  mainSectionHeaderTitle: {
    ...adminType.sectionHead,
    fontWeight: '800',
    color: adminColors.brandDeep,
  },
  mainSectionHeaderLink: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.warning.text,
  },
  mainActivityCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 16,
    marginBottom: 16,
  },
  mainActivityPipelineText: {
    ...adminType.caption,
    fontWeight: '600',
    color: adminColors.ink,
    lineHeight: 18,
  },
  mainQueueCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 16,
  },
  mainQueueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  mainQueueRowDivider: {
    borderTopWidth: 1,
    borderTopColor: adminColors.border,
  },
  mainQueueLabel: {
    ...adminType.rowTitle,
    color: adminColors.ink,
  },
  mainQueueValue: {
    ...adminType.rowTitle,
    fontWeight: '800',
    color: adminColors.ink,
  },
  mainQuickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: 16,
  },
  mainQuickActionCard: {
    width: '48.2%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingVertical: 18,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mainQuickActionText: {
    ...adminType.caption,
    fontWeight: '700',
    color: adminColors.ink,
    textAlign: 'center',
  },
  viewIncomingBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: adminSpacing.lg,
    ...adminShadow.sm,
  },
  viewIncomingBtnText: {
    ...adminType.sectionHead,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
  shipmentArrivedContainer: {
    width: '100%',
    marginTop: 6,
    marginBottom: 10,
  },
  shipmentArrivedBtn: {
    backgroundColor: adminColors.brand,
    borderRadius: adminRadius.md,
    height: ADMIN_BUTTON_HEIGHT,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    ...adminShadow.sm,
  },
  shipmentArrivedBtnText: {
    ...adminType.sectionHead,
    fontWeight: '700',
    color: adminColors.onBrand,
  },
});

