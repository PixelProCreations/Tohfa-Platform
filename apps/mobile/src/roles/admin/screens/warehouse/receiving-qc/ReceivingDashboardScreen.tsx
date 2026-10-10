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
  CheckmarkCircleOutlineIcon,
  ChevronRightSmall,
  ClockSmallIcon,
  CrateInventoryIcon,
  NotEqualIcon,
  PermissionNote,
  RECEIVING_CODES,
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
  /** Start Receiving (needs inventory.goods_receipt.record). */
  onStartReceiving: () => void;
  /** Main: inter-warehouse arrivals (the transfers flow). */
  onOpenTransferReceiving?: (() => void) | undefined;
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
  onStartReceiving,
  onOpenTransferReceiving,
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

  const tiles: { key: string; label: string; value: number | string; icon: React.ReactNode; alert?: boolean; onPress: () => void }[] = [
    {
      key: 'expected',
      label: 'Expected Today',
      value: count((s) => s.status === 'Expected'),
      icon: <ClockSmallIcon size={20} color={adminColors.brand} />,
      onPress: () => onOpenShipments('Expected'),
    },
    {
      key: 'awaiting',
      label: 'Awaiting Receiving',
      value: count((s) => s.status === 'Arrived' || s.status === 'Receiving'),
      icon: <TruckDeliveryIcon size={20} color={adminColors.brand} />,
      onPress: () => onOpenShipments('Receiving'),
    },
    {
      key: 'qc',
      label: 'Awaiting QC',
      value: count((s) => s.status === 'Awaiting QC'),
      icon: <CrateInventoryIcon size={20} color={adminColors.danger.text} />,
      alert: true,
      onPress: () => onOpenShipments('QC Pending'),
    },
    {
      key: 'partial',
      label: 'Partially Accepted',
      value: recordsInView.filter((r) => r.result === 'Partially Accepted').length,
      icon: <NotEqualIcon size={20} color={adminColors.warning.text} />,
      onPress: () => onOpenHistory('Partial'),
    },
    {
      key: 'completed',
      label: 'Completed Today',
      value: count((s) => s.status === 'Completed'),
      icon: <CheckmarkCircleOutlineIcon size={20} />,
      onPress: () => onOpenHistory('Accepted'),
    },
    {
      key: 'issues',
      label: 'Issues',
      value: issuesInView.length,
      icon: <AlertCircleOutlineIcon size={20} color={adminColors.danger.text} />,
      alert: true,
      onPress: onOpenQualityIssues,
    },
    ...(mainView
      ? [
          {
            key: 'discrepancies',
            label: 'Discrepancies',
            value: count((s) => s.status === 'Mismatch'),
            icon: <WarningTriangleIcon size={20} color={adminColors.danger.text} />,
            alert: true,
            onPress: onOpenQualityIssues,
          },
          {
            key: 'turnaround',
            label: 'Avg Turnaround (min)',
            value: avgTurnaround,
            icon: <ClockSmallIcon size={20} color={adminColors.info.text} />,
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

  const header = {
    title: mainView ? 'Receiving Dashboard' : 'Goods Receiving',
    onBack,
    headerRight: onOpenNotifications ? (
      <HeaderIconButton onPress={onOpenNotifications} accessibilityLabel="Notifications">
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
        <View style={walletLayout.scrollContent}>
          <PermissionNote message="You do not have permission to view goods receiving." />
        </View>
      </WalletScreen>
    );
  }

  return (
    <WalletScreen {...header}>
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <SectionTitle>{"Today's Receiving Overview"}</SectionTitle>
        <View style={styles.grid}>
          {tiles.map((tile) => (
            <TouchableOpacity
              key={tile.key}
              style={styles.tile}
              onPress={tile.onPress}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              {tile.icon}
              <Text style={[styles.tileValue, tile.alert === true && styles.tileValueAlert]}>
                {typeof tile.value === 'number' ? String(tile.value).padStart(2, '0') : tile.value}
              </Text>
              <Text style={styles.tileLabel}>{tile.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {canRecord ? (
          <TouchableOpacity style={styles.startButton} onPress={onStartReceiving} activeOpacity={0.85} accessibilityRole="button">
            <CrateInventoryIcon size={20} color={adminColors.onBrand} />
            <Text style={styles.startButtonText}>Start Receiving</Text>
          </TouchableOpacity>
        ) : (
          <PermissionNote message="Recording a goods receipt needs the goods receipt permission." />
        )}

        {mainView && onOpenTransferReceiving ? (
          <TouchableOpacity style={styles.card} onPress={onOpenTransferReceiving} activeOpacity={0.8} accessibilityRole="button">
            <View style={styles.rowCenter}>
              <View style={styles.iconChip}>
                <TruckDeliveryIcon size={18} color={adminColors.onBrand} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>Transfer Receiving</Text>
                <Text style={styles.cardMeta}>Inter-warehouse arrivals</Text>
              </View>
              <Text style={styles.link}>View →</Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {issuesInView.length > 0 ? (
          <>
            <SectionTitle
              right={
                <TouchableOpacity onPress={onOpenQualityIssues} accessibilityRole="button">
                  <Text style={styles.link}>View all</Text>
                </TouchableOpacity>
              }
            >
              Needs Attention
            </SectionTitle>
            {issuesInView.slice(0, ATTENTION_PREVIEW).map((issue) => {
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
                      {mainView ? `${warehouseNameOf(issue.warehouseId)} · ` : ''}
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
            <SectionTitle
              right={
                <TouchableOpacity onPress={() => onOpenHistory('All')} accessibilityRole="button">
                  <Text style={styles.link}>View →</Text>
                </TouchableOpacity>
              }
            >
              Receiving Activity
            </SectionTitle>
            <View style={styles.card}>
              <Text style={styles.pipelineText}>{RECEIVING_PIPELINE.join(' → ')}</Text>
            </View>

            <SectionTitle
              right={
                <TouchableOpacity onPress={() => onOpenShipments('All')} accessibilityRole="button">
                  <Text style={styles.link}>View →</Text>
                </TouchableOpacity>
              }
            >
              Pending Receiving Queue
            </SectionTitle>
            <View style={styles.card}>
              {queue.map((row, index) => (
                <View key={row.label} style={[styles.queueRow, index > 0 && styles.queueRowDivider]}>
                  <Text style={styles.queueLabel}>{row.label}</Text>
                  <Text style={styles.queueValue}>{row.value}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <SectionTitle
          right={
            <TouchableOpacity onPress={() => onOpenHistory('All')} accessibilityRole="button">
              <Text style={styles.link}>View all</Text>
            </TouchableOpacity>
          }
        >
          Recent Receiving
        </SectionTitle>
        {recordsInView.slice(0, RECENT_PREVIEW).map((rec) => (
          <TouchableOpacity
            key={rec.receiptId}
            style={styles.card}
            onPress={() => onSelectRecord(rec.receiptId)}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{rec.receiptId}</Text>
              <StatusBadge label={rec.result} tone={receiptTone(rec.result)} />
            </View>
            <Text style={styles.cardMeta}>
              {mainView ? `${rec.warehouseName} · ` : ''}
              {rec.product} · {rec.grade}
            </Text>
            <Text style={styles.cardValue}>{rec.receivedKg} KG</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.spacer} />
        <WalletButton label="View Incoming Shipments" variant="outline" onPress={() => onOpenShipments('All')} />
      </ScrollView>
    </WalletScreen>
  );
}

const ICON_CHIP = 36;
const BADGE = 16;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  spacer: { height: adminSpacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm, marginBottom: adminSpacing.md },
  tile: {
    flexBasis: '30%',
    flexGrow: 1,
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    gap: adminSpacing.xs,
  },
  tileValue: { ...adminType.kpiValue, color: adminColors.ink },
  tileValueAlert: { color: adminColors.danger.text },
  tileLabel: { ...adminType.caption, color: adminColors.muted },
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
  link: { ...adminType.caption, color: adminColors.brand },
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
  attentionAccent: { width: 4, alignSelf: 'stretch' },
  attentionIcon: {
    width: ICON_CHIP,
    height: ICON_CHIP,
    borderRadius: adminRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
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
});
