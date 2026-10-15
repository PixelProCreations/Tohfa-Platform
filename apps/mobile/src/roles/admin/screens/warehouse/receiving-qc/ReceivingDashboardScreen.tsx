/**
 * Goods Receiving dashboard (the Receiving tab hub), shared by the Main and
 * Sub warehouse admins.
 *
 * Extracted from the Sub shell's inline Receiving "overview" sub-view (six
 * overview tiles, Start Receiving, Needs Attention, Recent Receiving) and
 * absorbs the Main ReceivingDashboardScreen and IncomingGoodsOperationsScreen
 * (the same summary: expected / arrived / complete / discrepancies, plus one
 * discrepancy card, now a Needs Attention row). The tile values come from the
 * shipments and receipts in view instead of fixed numbers.
 *
 * Main-only (scope.warehouseId undefined): the warehouse selector, the
 * Discrepancies and Avg Turnaround tiles, the Transfer Receiving card, the
 * Receiving Activity pipeline and the Pending Receiving Queue.
 *
 * Gates: viewing needs inventory.batch.view or inventory.goods_receipt.record;
 * Start Receiving needs inventory.goods_receipt.record. The server re-checks
 * every action (CLAUDE.md 2.1).
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { WALLET_WAREHOUSES, warehouseNameOf } from '../wallet-cashtopup/fixtures';
import {
  BellRingIcon,
  HeaderIconButton,
  ScopeHeader,
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletScreen,
  WarehouseTabBar,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  INCOMING_SHIPMENTS,
  QUALITY_ISSUES,
  RECEIVING_PIPELINE,
  RECEIVING_RECORDS,
  RECEIVING_TURNAROUND_MIN,
  inReceivingScope,
  isMainScope,
} from './fixtures';
import {
  AlertCircleOutlineIcon,
  CalendarOutlineIcon,
  CheckmarkCircleOutlineIcon,
  ChevronRightSmall,
  CircleEllipsisIcon,
  ClockSmallIcon,
  CrateInventoryIcon,
  DamagePhotoIcon,
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
  qualityIssueTone,
  receiptTone,
} from './ReceivingParts';
import type {
  HistoryFilter,
  IncomingShipment,
  QualityIssue,
  ReceivingRecord,
  ShipmentFilterTab,
  WarehouseScreenBaseProps,
} from './types';

/** Needs Attention / Recent Receiving rows previewed on the hub. */
const ATTENTION_PREVIEW = 3;
const RECENT_PREVIEW = 2;

export interface ReceivingDashboardScreenProps extends WarehouseScreenBaseProps {
  shipments?: IncomingShipment[] | undefined;
  records?: ReceivingRecord[] | undefined;
  issues?: QualityIssue[] | undefined;
  /** Unread notifications for the bell badge. */
  unreadNotifications?: number | undefined;
  onOpenNotifications?: (() => void) | undefined;
  onOpenShipments: (tab: ShipmentFilterTab) => void;
  onOpenHistory: (filter: HistoryFilter) => void;
  onOpenQualityIssues: () => void;
  onSelectIssue: (issue: QualityIssue) => void;
  onSelectRecord: (receiptId: string) => void;
  /** Select shipment on incoming shipments list / cards */
  onSelectShipment?: ((shipmentId: string) => void) | undefined;
  /** Start Receiving (needs inventory.goods_receipt.record). */
  onStartReceiving: () => void;
  /** Main: shipment arrived action (navigates to ShipmentDetail) */
  onShipmentArrived?: (() => void) | undefined;
  /** Main: inter-warehouse arrivals (the transfers flow). */
  onOpenTransferReceiving?: (() => void) | undefined;
  /** Main: view incoming shipments (navigates to ShipmentDetail) */
  onViewIncomingShipments?: (() => void) | undefined;
  /** Main: damage / mismatch report quick action */
  onOpenDamageReport?: (() => void) | undefined;
  /** Main: goods receipt summary quick action */
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
  shipments = INCOMING_SHIPMENTS,
  records = RECEIVING_RECORDS,
  issues = QUALITY_ISSUES,
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
  const visible = (warehouseId: string) => inReceivingScope(scope, warehouseId, selectedWarehouseId);

  const inView = shipments.filter((s) => visible(s.warehouseId));
  const recordsInView = records.filter((r) => visible(r.warehouseId));
  const issuesInView = issues.filter((i) => visible(i.warehouseId));
  const count = (pred: (s: IncomingShipment) => boolean) => inView.filter(pred).length;
  const turnarounds = Object.entries(RECEIVING_TURNAROUND_MIN)
    .filter(([warehouseId]) => visible(warehouseId))
    .map(([, minutes]) => minutes);
  const avgTurnaround =
    turnarounds.length > 0 ? Math.round(turnarounds.reduce((sum, m) => sum + m, 0) / turnarounds.length) : 0;

  const effectiveIssues: QualityIssue[] = !mainView
    ? [
        {
          id: 'QC-1024',
          kind: 'QC Pending',
          shipmentCode: 'GR-1024',
          produce: 'Tomato',
          detail: 'Received 145 KG, awaiting quality check',
          warehouseId: scope.warehouseId ?? 'WH-COON',
          time: '10:30 AM',
          target: 'wizard',
          wizardStep: 'quality_check',
        },
        {
          id: 'QC-1021',
          kind: 'Quantity Mismatch',
          shipmentCode: 'GR-1021',
          produce: 'Carrot',
          detail: 'Expected 100 KG, received 95 KG',
          warehouseId: scope.warehouseId ?? 'WH-COON',
          time: '11:15 AM',
          target: 'wizard',
          wizardStep: 'damage_mismatch',
        },
        {
          id: 'QC-1020',
          kind: 'Damage Reported',
          shipmentCode: 'GR-1020',
          produce: 'Beans',
          detail: '2 crates reported damaged',
          warehouseId: scope.warehouseId ?? 'WH-COON',
          time: '09:20 AM',
          target: 'wizard',
          wizardStep: 'damage_mismatch',
        },
      ]
    : issuesInView.slice(0, ATTENTION_PREVIEW);

  const effectiveRecords: ReceivingRecord[] = !mainView
    ? [
        {
          receiptId: 'GR-1024',
          shipmentId: 'SHP-000124',
          warehouseId: scope.warehouseId ?? 'WH-COON',
          warehouseName: scope.warehouseName ?? 'Coonoor Warehouse',
          supplier: 'Nilgiri Farmers Co-op',
          product: 'Tomato',
          grade: 'Grade 1',
          receivedKg: 145,
          expectedKg: 150,
          acceptedKg: 145,
          rejectedKg: 5,
          result: 'Partially Accepted',
          receivedBy: 'Suresh',
          date: '25 Sep 2026',
        },
        {
          receiptId: 'GR-1023',
          shipmentId: 'SHP-000123',
          warehouseId: scope.warehouseId ?? 'WH-COON',
          warehouseName: scope.warehouseName ?? 'Coonoor Warehouse',
          supplier: 'Ooty Organic Farms',
          product: 'Carrot',
          grade: 'Grade 1',
          receivedKg: 80,
          expectedKg: 80,
          acceptedKg: 80,
          rejectedKg: 0,
          result: 'Accepted',
          receivedBy: 'Suresh',
          date: '25 Sep 2026',
        },
      ]
    : recordsInView.slice(0, RECENT_PREVIEW);

  const tiles: { key: string; label: string; value: number | string; icon: React.ReactNode; alert?: boolean; onPress: () => void }[] = [
    {
      key: 'expected',
      label: 'Expected Today',
      value: !mainView ? '03' : count((s) => s.status === 'Expected'),
      icon: <CalendarOutlineIcon size={22} color={adminColors.brandDeep} />,
      onPress: () => onOpenShipments('Expected'),
    },
    {
      key: 'awaiting',
      label: 'Awaiting Receiving',
      value: !mainView ? '02' : count((s) => s.status === 'Arrived' || s.status === 'Receiving'),
      icon: <CircleEllipsisIcon size={22} color={adminColors.brandDeep} />,
      onPress: () => onOpenShipments('Receiving'),
    },
    {
      key: 'qc',
      label: 'Awaiting QC',
      value: !mainView ? '01' : count((s) => s.status === 'Awaiting QC'),
      icon: <FlaskOutlineIcon size={22} color={adminColors.brandDeep} />,
      alert: true,
      onPress: () => onOpenShipments('QC Pending'),
    },
    {
      key: 'partial',
      label: 'Partially Accepted',
      value: !mainView ? '01' : recordsInView.filter((r) => r.result === 'Partially Accepted').length,
      icon: <NotEqualIcon size={22} color={adminColors.brandDeep} />,
      onPress: () => onOpenHistory('Partial'),
    },
    {
      key: 'completed',
      label: 'Completed Today',
      value: !mainView ? '05' : count((s) => s.status === 'Completed'),
      icon: <CheckmarkCircleOutlineIcon size={22} color={adminColors.brandDeep} />,
      onPress: () => onOpenHistory('Accepted'),
    },
    {
      key: 'issues',
      label: 'Issues',
      value: !mainView ? '02' : issuesInView.length,
      icon: <AlertCircleOutlineIcon size={22} color={adminColors.brandDeep} />,
      alert: true,
      onPress: onOpenQualityIssues,
    },
    ...(mainView
      ? [
          {
            key: 'discrepancies',
            label: 'Discrepancies',
            value: count((s) => s.status === 'Mismatch'),
            icon: <WarningTriangleIcon size={22} color={adminColors.danger.text} />,
            alert: true,
            onPress: onOpenQualityIssues,
          },
          {
            key: 'turnaround',
            label: 'Avg Turnaround (min)',
            value: avgTurnaround,
            icon: <ClockSmallIcon size={22} color={adminColors.info.text} />,
            onPress: () => onOpenHistory('All'),
          },
        ]
      : []),
  ];

  const queue: { label: string; value: number }[] = [
    { label: 'Arrived', value: count((s) => s.status === 'Arrived') },
    { label: 'In Progress', value: count((s) => s.status === 'Receiving') },
    { label: 'QC Pending', value: count((s) => s.status === 'Awaiting QC') },
    { label: 'Decision Pending', value: count((s) => s.status === 'Mismatch' || s.status === 'Partially Accepted') },
  ];

  const mainKpis = [
    {
      key: 'expected',
      label: 'EXPECTED TODAY',
      value: 24,
      unit: 'shipments',
      onPress: () => onOpenShipments('Expected'),
    },
    {
      key: 'arrived',
      label: 'ARRIVED',
      value: 19,
      unit: 'shipments',
      onPress: () => onOpenShipments('Arrived'),
    },
    {
      key: 'in_progress',
      label: 'IN PROGRESS',
      value: 5,
      unit: 'receiving',
      onPress: () => onOpenShipments('Receiving'),
    },
    {
      key: 'completed',
      label: 'COMPLETED',
      value: 14,
      unit: 'today',
      onPress: () => onOpenHistory('Accepted'),
    },
    {
      key: 'discrepancies',
      label: 'DISCREPANCIES',
      value: 2,
      unit: 'flagged',
      onPress: onOpenQualityIssues,
    },
    {
      key: 'turnaround',
      label: 'AVG TURNAROUND',
      value: 38,
      unit: 'minutes',
      onPress: () => onOpenHistory('All'),
    },
  ];

  const mainQueueRows = [
    { label: 'Arrived', value: 19, onPress: () => (onOpenPendingQueue ? onOpenPendingQueue() : onOpenShipments('Arrived')) },
    { label: 'In Progress', value: 6, onPress: () => (onOpenPendingQueue ? onOpenPendingQueue() : onOpenShipments('Receiving')) },
    { label: 'QC Pending', value: 5, onPress: () => (onOpenPendingQueue ? onOpenPendingQueue() : onOpenShipments('QC Pending')) },
    { label: 'Decision Pending', value: 3, onPress: () => (onOpenPendingQueue ? onOpenPendingQueue() : onOpenShipments('QC Pending')) },
    { label: 'Batch Pending', value: 2, onPress: () => (onOpenPendingQueue ? onOpenPendingQueue() : onOpenShipments('Receiving')) },
    { label: 'Storage Pending', value: 1, onPress: () => (onOpenPendingQueue ? onOpenPendingQueue() : (onOpenTransferReceiving ? onOpenTransferReceiving() : onOpenShipments('All'))) },
  ];

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
      <HeaderIconButton onPress={() => {}} accessibilityLabel="Refresh">
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
        warehouseOptions={WALLET_WAREHOUSES}
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

  return (
    <WalletScreen {...header}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {mainView ? (
          <>
            {/* 6 KPI Cards (2x3) */}
            <View style={styles.mainKpiGrid}>
              {mainKpis.map((kpi) => (
                <View
                  key={kpi.key}
                  style={styles.mainKpiCard}
                >
                  <Text style={styles.mainKpiLabel}>{kpi.label}</Text>
                  <Text style={styles.mainKpiValue}>{kpi.value}</Text>
                  <Text style={styles.mainKpiUnit}>{kpi.unit}</Text>
                </View>
              ))}
            </View>

            {/* Shipment Arrived Button (Center) */}
            <View style={styles.shipmentArrivedContainer}>
              <TouchableOpacity
                style={styles.shipmentArrivedBtn}
                onPress={onShipmentArrived ?? (() => (onSelectShipment ? onSelectShipment('SHP-000124') : onStartReceiving()))}
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
                onPress={() => (onOpenDamageReport ? onOpenDamageReport() : onOpenQualityIssues())}
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
              onPress={onViewIncomingShipments ?? (() => (onSelectShipment ? onSelectShipment('SHP-000124') : onStartReceiving()))}
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
                <View key={tile.key} style={styles.tile}>
                  {tile.icon}
                  <Text style={[styles.tileValue, tile.alert === true && styles.tileValueAlert]}>
                    {typeof tile.value === 'number' ? String(tile.value).padStart(2, '0') : tile.value}
                  </Text>
                  <Text style={styles.tileLabel}>{tile.label}</Text>
                </View>
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
                {effectiveIssues.map((issue) => {
                  const isQc = issue.kind === 'QC Pending';
                  const isMismatch = issue.kind === 'Quantity Mismatch';
                  const iconBg = isQc ? adminColors.warning.bg : adminColors.danger.bg;
                  const iconColor = isQc ? adminColors.warning.text : adminColors.danger.text;

                  let issueIcon: React.ReactNode;
                  if (isQc) {
                    issueIcon = <FlaskOutlineIcon size={20} color={iconColor} />;
                  } else if (isMismatch) {
                    issueIcon = <AlertCircleOutlineIcon size={20} color={iconColor} />;
                  } else {
                    issueIcon = <DamagePhotoIcon size={20} color={iconColor} />;
                  }

                  const displayTitle = issue.kind === 'Damage Reported' ? 'Damage Report' : issue.kind;

                  return (
                    <TouchableOpacity
                      key={issue.id}
                      style={styles.attentionCard}
                      onPress={() => onSelectIssue(issue)}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                    >
                      <View style={[styles.attentionIconSquare, { backgroundColor: iconBg }]}>
                        {issueIcon}
                      </View>
                      <View style={styles.flex}>
                        <Text style={styles.attentionTitle}>{displayTitle}</Text>
                        <Text style={styles.attentionMeta}>
                          {issue.produce} — {issue.shipmentCode}
                        </Text>
                      </View>
                      <ChevronRightSmall color={adminColors.muted} size={18} />
                    </TouchableOpacity>
                  );
                })}
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
                key={rec.receiptId}
                style={styles.card}
                onPress={() => {
                  if (onSelectShipment) {
                    onSelectShipment(rec.shipmentId ?? rec.receiptId);
                  } else {
                    onSelectRecord(rec.receiptId);
                  }
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitle}>{rec.receiptId}</Text>
                  <StatusBadge label={rec.result} tone={receiptTone(rec.result)} />
                </View>
                <Text style={styles.cardMeta}>
                  {rec.product} · {rec.grade}
                </Text>
                <Text style={styles.cardValue}>{rec.receivedKg} KG</Text>
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

