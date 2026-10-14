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
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import {
  EMPTY_RECEIVING_FILTERS,
  activeFilterCount,
  isMainScope,
  matchesReceivingFilters,
  matchesShipmentTab,
  shipmentsInScope,
} from './fixtures';
import { PermissionNote, RefreshRetryIcon, StepperCheckIcon, TransferArrowsIcon, TruckDeliveryIcon, canViewReceiving, shipmentTone } from './ReceivingParts';
import type { IncomingShipment, ReceivingFilters, ShipmentFilterTab, WarehouseScreenBaseProps } from './types';

const TABS: readonly ShipmentFilterTab[] = ['All', 'Expected', 'Arrived', 'Receiving', 'QC Pending', 'Completed', 'Rejected'];

export interface IncomingShipmentsScreenProps extends WarehouseScreenBaseProps {
  shipments?: IncomingShipment[] | undefined;
  initialTab?: ShipmentFilterTab | undefined;
  /** Facets applied in Search & Filters. */
  filters?: ReceivingFilters | undefined;
  onOpenFilters: () => void;
  onClearFilters?: (() => void) | undefined;
  onSelectShipment: (code: string) => void;
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
    headerExtra: <ScopeHeader scope={scope} label={mainView ? undefined : scope.warehouseName ?? scope.warehouseId} />,
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
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pills}>
          <ChipGroup options={TABS} value={tab} onChange={setTab} />
        </ScrollView>

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

        {rows.map((s) => (
          <TouchableOpacity
            key={s.code}
            style={styles.card}
            onPress={() => onSelectShipment(s.code)}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={styles.rowBetween}>
              <View style={styles.codeRow}>
                {s.type === 'Inter-Warehouse Transfer' ? <TransferArrowsIcon size={16} /> : <TruckDeliveryIcon size={16} color={adminColors.brand} />}
                <Text style={styles.code}>{s.code}</Text>
              </View>
              <StatusBadge label={s.status} tone={shipmentTone(s.status)} />
            </View>
            <Text style={styles.meta}>
              {s.from} → {s.to}
              {mainView ? ` · ${warehouseNameOf(s.warehouseId)}` : ''}
            </Text>
            <Text style={styles.produce}>
              {s.produce} · {s.grade}
            </Text>
            <View style={styles.stats}>
              {cardStats(s).map(([label, value]) => (
                <View key={label} style={styles.statCol}>
                  <Text style={styles.meta}>{label}</Text>
                  <Text style={styles.statValue}>{value}</Text>
                </View>
              ))}
            </View>
            {s.hasReview ? (
              <View style={styles.reviewRow}>
                <Text style={styles.link}>Review &gt;</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  pills: { paddingVertical: adminSpacing.sm },
  appliedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: adminSpacing.sm },
  appliedText: { ...adminType.rowMeta, color: adminColors.muted },
  link: { ...adminType.caption, color: adminColors.brand },
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
  reviewRow: { alignItems: 'flex-end', marginTop: adminSpacing.sm },
});

export interface ReceivingActivityScreenProps {
  onBack: () => void;
  onSelectStep: (stepKey: string) => void;
}

export function ReceivingActivityScreen({ onBack, onSelectStep }: ReceivingActivityScreenProps) {
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
      <StatusBar barStyle="dark-content" backgroundColor="#FAF5EF" />
      <View style={customStyles.lightHeader}>
        <View style={customStyles.lightHeaderTop}>
          <TouchableOpacity onPress={onBack} style={customStyles.backBtn} activeOpacity={0.7} accessibilityLabel="Back">
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#92400E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={customStyles.lightHeaderTitle}>Receiving Activity</Text>
          <TouchableOpacity style={customStyles.lightRefreshBtn} activeOpacity={0.7} accessibilityLabel="Refresh">
            <RefreshRetryIcon size={18} color="#92400E" />
          </TouchableOpacity>
        </View>

        <View style={customStyles.lightSelectorPill}>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <Path d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4M12 3L2 8v1M12 3l10 5v1" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={customStyles.lightSelectorText}>All Warehouses</Text>
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path d="M6 9l6 6 6-6" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                  <StepperCheckIcon size={11} color="#FFFFFF" />
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
      <StatusBar barStyle="dark-content" backgroundColor="#FAF5EF" />
      <View style={customStyles.lightHeader}>
        <View style={customStyles.lightHeaderTop}>
          <TouchableOpacity onPress={onBack} style={customStyles.backBtn} activeOpacity={0.7} accessibilityLabel="Back">
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <Path d="M19 12H5M12 19l-7-7 7-7" stroke="#92400E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={customStyles.lightHeaderTitle}>Pending Queue</Text>
          <TouchableOpacity style={customStyles.lightRefreshBtn} activeOpacity={0.7} accessibilityLabel="Refresh">
            <RefreshRetryIcon size={18} color="#92400E" />
          </TouchableOpacity>
        </View>

        <View style={customStyles.lightSelectorPill}>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <Path d="M3 21h18M3 7v14M21 7v14M6 11h4M6 15h4M14 11h4M14 15h4M12 3L2 8v1M12 3l10 5v1" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
          <Text style={customStyles.lightSelectorText}>All Warehouses</Text>
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path d="M6 9l6 6 6-6" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
          <Svg width={10} height={10} viewBox="0 0 24 24" fill="#9CA3AF">
            <Path d="M16 5l-8 7 8 7V5z" />
          </Svg>
          <View style={customStyles.trackBar}>
            <View style={customStyles.trackThumb} />
          </View>
          <Svg width={10} height={10} viewBox="0 0 24 24" fill="#9CA3AF">
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
              <TruckDeliveryIcon size={20} color="#D97706" />
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
    backgroundColor: '#FAF5EF',
  },
  lightHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#FAF5EF',
  },
  lightHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backBtn: {
    padding: 6,
    marginLeft: -6,
  },
  lightHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#92400E',
    flex: 1,
    marginLeft: 8,
  },
  lightRefreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightSelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  lightSelectorText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 28,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 12,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
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
    backgroundColor: '#E5E7EB',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineCircleDone: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  timelineDash: {
    width: 6,
    height: 2,
    backgroundColor: '#9CA3AF',
  },
  timelineTextDone: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  timelineTextPending: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
  },
  timelineNoticeBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 14,
  },
  timelineNoticeText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#92400E',
    lineHeight: 18,
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  tabPill: {
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  tabPillActive: {
    backgroundColor: '#D97706',
  },
  tabPillInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  tabPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  tabPillTextInactive: {
    color: '#4B5563',
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
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    position: 'relative',
  },
  trackThumb: {
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
  },
  queueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 14,
    marginTop: 8,
  },
  queueCardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  queueCardContent: {
    flex: 1,
  },
  queueCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1F2937',
  },
  queueCardSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 3,
  },
  queueBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  queueBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
});
