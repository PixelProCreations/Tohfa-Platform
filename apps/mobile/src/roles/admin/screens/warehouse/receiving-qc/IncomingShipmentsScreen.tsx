/**
 * Incoming Shipments list, shared by the Main and Sub warehouse admins.
 *
 * Extracted from the Sub shell's inline Receiving "incoming_shipments"
 * sub-view (status pills, shipment cards with per-status figures, Review link)
 * and absorbs the Main IncomingShipmentsScreen: the all-warehouse list with the
 * shipment-type icon, the warehouse in each card, and the note that only the
 * two documented shipment contexts exist (Main-only, scope.warehouseId
 * undefined). The Search & Filters facets come back through `filters`.
 *
 * Read-only. Gate: inventory.batch.view or inventory.goods_receipt.record.
 */
import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { warehouseNameOf } from '../wallet-cashtopup/fixtures';
import {
  ChipGroup,
  EmptyState,
  HeaderIconButton,
  InfoNote,
  ScopeHeader,
  SlidersIcon,
  StatusBadge,
  WarehouseTabBar,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { WarehouseSelector } from '../inventory';
import {
  EMPTY_RECEIVING_FILTERS,
  activeFilterCount,
  isMainScope,
  matchesReceivingFilters,
  matchesShipmentTab,
  shipmentsInScope,
} from './fixtures';
import { PermissionNote, RefreshRetryIcon, StepperCheckIcon, TransferArrowsIcon, TruckDeliveryIcon, canViewReceiving, shipmentTone } from './ReceivingParts';
import type { IncomingShipment, ReceivingFilters, ShipmentFilterTab, WarehouseScreenBaseProps, WarehouseTab } from './types';

const TABS: readonly ShipmentFilterTab[] = ['All', 'Expected', 'Arrived', 'Receiving', 'QC Pending', 'Completed', 'Rejected'];

export interface IncomingShipmentsScreenProps extends WarehouseScreenBaseProps {
  shipments?: IncomingShipment[] | undefined;
  initialTab?: ShipmentFilterTab | undefined;
  /** Facets applied in Search & Filters. */
  filters?: ReceivingFilters | undefined;
  onOpenFilters: () => void;
  onClearFilters?: (() => void) | undefined;
  onSelectShipment: (code: string) => void;
  onTabChange?: ((tab: WarehouseTab) => void) | undefined;
}

/** The two figures a card shows, by status (as the Sub shell's inline cards). */
function cardStats(s: IncomingShipment): [string, string][] {
  switch (s.status) {
    case 'Completed':
      return [['Received', `${s.receivedQty ?? s.expectedQty} KG`], ['Accepted', `${s.acceptedQty ?? s.expectedQty} KG`]];
    case 'Rejected':
      return [['Received', `${s.receivedQty ?? s.expectedQty} KG`], ['Rejected', `${s.rejectedQty ?? s.expectedQty} KG`]];
    case 'Mismatch':
      return [['Expected', `${s.expectedQty} KG`], ['Received', `${s.receivedQty ?? 0} KG`]];
    case 'Expected':
      return [['Expected', `${s.expectedQty} KG`], ['Dispatch', s.dispatchStatus ?? s.dispatchDate]];
    default:
      return [['Expected', `${s.expectedQty} KG`], ['Arrived', s.actualArrival?.split('·')[1]?.trim() ?? s.actualArrival ?? '—']];
  }
}

export function IncomingShipmentsScreen({
  scope,
  can,
  onBack,
  shipments,
  initialTab = 'All',
  filters = EMPTY_RECEIVING_FILTERS,
  onOpenFilters,
  onClearFilters,
  onSelectShipment,
  onTabChange,
}: IncomingShipmentsScreenProps) {
  const [tab, setTab] = useState<ShipmentFilterTab>(initialTab);
  const mainView = isMainScope(scope);
  const applied = activeFilterCount(filters);

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

  if (!canViewReceiving(can)) {
    return (
      <WalletScreen {...header}>
        <View style={walletLayout.scrollContent}>
          <PermissionNote message="You do not have permission to view incoming shipments." />
        </View>
      </WalletScreen>
    );
  }

  const rows = shipmentsInScope(scope, shipments).filter(
    (s) => matchesShipmentTab(s.status, tab) && matchesReceivingFilters(s, filters),
  );

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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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

        {rows.length === 0 ? <EmptyState title="No shipments" subtitle="Nothing matches this status and these filters." /> : null}

        {rows.map((s) => {
          const stats = cardStats(s);
          const tone = shipmentTone(s.status);
          const badgeColors = adminColors[tone];

          return (
            <TouchableOpacity
              key={s.code}
              style={styles.card}
              onPress={() => onSelectShipment(s.code)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <View style={styles.cardHeader}>
                <Text style={styles.code}>{s.code}</Text>
                <View style={[styles.badge, { backgroundColor: badgeColors.bg }]}>
                  <Text style={[styles.badgeText, { color: badgeColors.text }]}>{s.status}</Text>
                </View>
              </View>

              <Text style={styles.route}>
                {`→ ${s.from} → ${s.to}`}
                {mainView ? ` · ${warehouseNameOf(s.warehouseId)}` : ''}
              </Text>

              <Text style={styles.produce}>
                {s.produce} · {s.grade}
              </Text>

              <View style={styles.statsRow}>
                {stats.map(([label, value]) => (
                  <View key={label} style={styles.statCol}>
                    <Text style={styles.statLabel}>{label}</Text>
                    <Text style={styles.statValue}>{value}</Text>
                  </View>
                ))}
                {s.hasReview ? (
                  <TouchableOpacity
                    style={styles.reviewButton}
                    onPress={() => onSelectShipment(s.code)}
                    accessibilityRole="button"
                  >
                    <Text style={styles.reviewText}>Review &gt;</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
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
  onBack: () => void;
  onSelectStep: (stepKey: string) => void;
}

export function ReceivingActivityScreen({ onBack, onSelectStep }: ReceivingActivityScreenProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const steps = [
    { key: 'shipment_detail', label: 'Shipment Created', done: true },
    { key: 'shipment_detail', label: 'Shipment Arrived', done: true },
    { key: 'start_receiving', label: 'Receiving Started', done: true },
    { key: 'quantity_verification', label: 'Quantity Checked', done: true },
    { key: 'quality_check', label: 'Quality Checked', done: false },
    { key: 'receiving_decision', label: 'Decision Made', done: false },
    { key: 'batch_assignment', label: 'Batch Assigned', done: false },
    { key: 'storage_assignment', label: 'Storage Assigned', done: false },
    { key: 'receipt_confirmation', label: 'Receipt Completed', done: false },
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
          <Text style={customStyles.selectorText}>All Warehouses</Text>
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
              <View style={[customStyles.timelineCircle, step.done && customStyles.timelineCircleDone]}>
                {step.done ? (
                  <StepperCheckIcon size={11} color={adminColors.onBrand} />
                ) : (
                  <View style={customStyles.timelineDash} />
                )}
              </View>
              <Text style={step.done ? customStyles.timelineTextDone : customStyles.timelineTextPending}>
                {step.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export interface PendingQueueScreenProps {
  onBack: () => void;
  onSelectShipment: (shipmentId: string) => void;
}

export function PendingQueueScreen({ onBack, onSelectShipment }: PendingQueueScreenProps) {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const [selectedTab, setSelectedTab] = useState<'Arrived' | 'In Progress' | 'QC Pending' | 'Decision Pending'>('Arrived');

  const tabs: ('Arrived' | 'In Progress' | 'QC Pending' | 'Decision Pending')[] = [
    'Arrived',
    'In Progress',
    'QC Pending',
    'Decision Pending',
  ];

  const queueItems = [
    {
      code: 'SHP-000124',
      warehouse: 'Coonoor',
      produce: 'Tomato',
      qty: '500 KG',
      status: 'Arrived',
    },
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
          <Text style={customStyles.headerTitle}>Pending Queue</Text>
          <TouchableOpacity style={customStyles.refreshBtn} activeOpacity={0.7} accessibilityLabel="Refresh">
            <RefreshRetryIcon size={18} color={adminColors.onBrand} />
          </TouchableOpacity>
        </View>

        <View style={customStyles.selectorPill}>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <Path d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4M12 3L2 8v1M12 3l10 5v1" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={customStyles.selectorText}>All Warehouses</Text>
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path d="M6 9l6 6 6-6" stroke={adminColors.onBrand} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </View>
      </View>

      <ScrollView contentContainerStyle={customStyles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={customStyles.sectionHeading}>Pending Receiving Queue</Text>

        {/* Tab Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={customStyles.pillsContainer}>
          {tabs.map((tab) => {
            const isSelected = selectedTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[customStyles.tabPill, isSelected ? customStyles.tabPillActive : customStyles.tabPillInactive]}
                onPress={() => setSelectedTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[customStyles.tabPillText, isSelected ? customStyles.tabPillTextActive : customStyles.tabPillTextInactive]}>
                  {tab}
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

        {/* Cards */}
        {queueItems.map((item) => (
          <TouchableOpacity
            key={item.code}
            style={customStyles.queueCard}
            onPress={() => onSelectShipment(item.code)}
            activeOpacity={0.8}
          >
            <View style={customStyles.queueCardIconBox}>
              <TruckDeliveryIcon size={20} color={adminColors.warning.text} />
            </View>
            <View style={customStyles.queueCardContent}>
              <Text style={customStyles.queueCardTitle}>{item.code}</Text>
              <Text style={customStyles.queueCardSubtitle}>{item.warehouse} · {item.produce} · {item.qty}</Text>
            </View>
            <View style={customStyles.queueBadge}>
              <Text style={customStyles.queueBadgeText}>{item.status}</Text>
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
