/**
 * Goods Receiving dashboard (the Receiving tab hub), shared by the Main and
 * Sub warehouse admins.
 *
 * Extracted from the Sub shell's inline Receiving "overview" sub-view and
 * absorbs the Main ReceivingDashboardScreen and IncomingGoodsOperationsScreen.
 * Live since integration phase 4: the tiles are counted from the warehouse's
 * purchase orders and goods receipts (ReceivingFlow fetches them), the Needs
 * Attention rows are the receipts still awaiting their quality check, and
 * Recent Receiving is the newest receipts.
 *
 * Tiles with no API behind them are gone: the issue count (no issue API beyond
 * QC pending, which has its own tile), and the Main-only discrepancy and
 * average-turnaround tiles. The Main warehouse selector is not offered (its
 * options were fixture codes; the rows carry uuids).
 *
 * Main-only (scope.warehouseId undefined): the Transfer Receiving card (when
 * the host passes it), the Receiving Activity pipeline and the Pending
 * Receiving Queue.
 *
 * Gates: viewing needs inventory.batch.view or inventory.goods_receipt.record;
 * Start Receiving needs inventory.goods_receipt.record. The server re-checks
 * every action (CLAUDE.md 2.1).
 */
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { formatKg } from '../../../money/quantity';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType, ADMIN_BUTTON_HEIGHT } from '../../../theme';
import { formatAdminDay } from '../../../utils/datetime';
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
  CheckmarkCircleOutlineIcon,
  ChevronRightSmall,
  ClockSmallIcon,
  CrateInventoryIcon,
  NotEqualIcon,
  PermissionNote,
  RECEIVING_CODES,
  RECEIVING_PIPELINE,
  TruckDeliveryIcon,
  canViewReceiving,
  qualityIssueTone,
  receiptTone,
} from './ReceivingParts';
import type {
  HistoryFilter,
  IncomingShipment,
  QualityIssue,
  ReceivingLiveStateProps,
  ReceivingRecord,
  ShipmentFilterTab,
  WarehouseScreenBaseProps,
} from './types';

/** Needs Attention / Recent Receiving rows previewed on the hub. */
const ATTENTION_PREVIEW = 3;
const RECENT_PREVIEW = 2;

export interface ReceivingDashboardScreenProps extends WarehouseScreenBaseProps, ReceivingLiveStateProps {
  /** The warehouse's purchase orders, with progress from their receipts. */
  shipments?: readonly IncomingShipment[] | undefined;
  /** The warehouse's goods receipts, newest first. */
  records?: readonly ReceivingRecord[] | undefined;
  /** Receipts awaiting their quality check. */
  issues?: readonly QualityIssue[] | undefined;
  /** False when a list stopped early, so the counts may be partial. */
  complete?: boolean | undefined;
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
  const mainView = isMainScope(scope);
  const canView = canViewReceiving(can);
  const canRecord = can(RECEIVING_CODES.receiptRecord);

  const count = (pred: (s: IncomingShipment) => boolean) => shipments.filter(pred).length;
  const today = formatAdminDay(new Date());
  // Receipts recorded today (IST) that have been through their quality check.
  const checkedToday = records.filter(
    (r) => r.result !== 'Awaiting QC' && r.result !== 'Unknown' && formatAdminDay(r.receivedAt) === today,
  ).length;

  const tiles: { key: string; label: string; value: number; icon: React.ReactNode; alert?: boolean; onPress: () => void }[] = [
    {
      key: 'expected',
      label: t('receiving.tile.expected'),
      value: count((s) => s.status === 'Expected'),
      icon: <ClockSmallIcon size={20} color={adminColors.brand} />,
      onPress: () => onOpenShipments('Expected'),
    },
    {
      key: 'awaiting',
      label: t('receiving.tile.partlyReceived'),
      value: count((s) => s.status === 'Receiving'),
      icon: <TruckDeliveryIcon size={20} color={adminColors.brand} />,
      onPress: () => onOpenShipments('Receiving'),
    },
    {
      key: 'qc',
      label: 'Awaiting QC',
      value: issues.length,
      icon: <CrateInventoryIcon size={20} color={adminColors.danger.text} />,
      alert: true,
      onPress: onOpenQualityIssues,
    },
    {
      key: 'partial',
      label: 'Partially Accepted',
      value: records.filter((r) => r.result === 'Partially Accepted').length,
      icon: <NotEqualIcon size={20} color={adminColors.warning.text} />,
      onPress: () => onOpenHistory('Partial'),
    },
    {
      key: 'completed',
      label: 'Completed Today',
      value: checkedToday,
      icon: <CheckmarkCircleOutlineIcon size={20} />,
      onPress: () => onOpenHistory('All'),
    },
  ];

  const queue: { label: string; value: number }[] = [
    { label: t('receiving.tile.expected'), value: count((s) => s.status === 'Expected') },
    { label: 'In Progress', value: count((s) => s.status === 'Receiving') },
    { label: 'QC Pending', value: issues.length },
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
    headerExtra: <ScopeHeader scope={scope} label={mainView ? undefined : scope.warehouseName ?? scope.warehouseId} />,
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

  const hasData = shipments.length > 0 || records.length > 0;
  if (!hasData && isLoading) {
    return (
      <WalletScreen {...header}>
        <AdminLoadingState />
      </WalletScreen>
    );
  }
  if (!hasData && error !== null && error !== undefined) {
    return (
      <WalletScreen {...header}>
        <AdminErrorState error={error} onRetry={onRetry} />
      </WalletScreen>
    );
  }

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
        <SectionTitle
          right={
            <TouchableOpacity onPress={() => onOpenShipments('All')} activeOpacity={0.7} accessibilityRole="button">
              <Text style={styles.link}>View Details</Text>
            </TouchableOpacity>
          }
        >
          {"Today's Receiving Overview"}
        </SectionTitle>
        {!complete ? <InfoNote tone="brandSoft">{t('receiving.totals.incomplete')}</InfoNote> : null}
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
                {String(tile.value).padStart(2, '0')}
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

        {issues.length > 0 ? (
          <>
            <SectionTitle>
              Needs Attention
            </SectionTitle>
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
        {records.length === 0 ? <Text style={styles.cardMeta}>{t('receiving.empty.receipts')}</Text> : null}
        {records.slice(0, RECENT_PREVIEW).map((rec) => (
          <TouchableOpacity
            key={rec.id}
            style={styles.card}
            onPress={() => onSelectRecord(rec.id)}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{rec.receiptId}</Text>
              <StatusBadge label={rec.resultLabel} tone={receiptTone(rec.result)} />
            </View>
            <Text style={styles.cardMeta}>
              {rec.product}
              {rec.grade !== '' ? ` · ${rec.grade}` : ''}
            </Text>
            <Text style={styles.cardValue}>{rec.receivedGrams === null ? t('inventory.noValue') : formatKg(rec.receivedGrams)}</Text>
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
  link: { ...adminType.caption, color: adminColors.brand, fontWeight: '700', fontSize: 13 },
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
