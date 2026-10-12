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
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
import { PermissionNote, TransferArrowsIcon, TruckDeliveryIcon, canViewReceiving, shipmentTone } from './ReceivingParts';
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

        {mainView ? (
          <InfoNote tone="brandSoft">
            Shipment Type is limited to two documented contexts: Farmer Admin → Main Warehouse (consolidated produce) and
            Warehouse Transfer — no other type is invented.
          </InfoNote>
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
