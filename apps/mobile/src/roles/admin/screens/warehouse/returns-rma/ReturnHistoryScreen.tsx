/**
 * Return History — closed RMAs with search and status filter.
 *
 * Scope (FINAL_LIST row 101): the All-warehouses selector is rendered only for
 * the Main view (scope.warehouseId undefined). A Sub admin sees its own
 * warehouse's history only.
 *
 * Absorbs MainWarehouseReturnHistoryScreen (pair M10-S06): its single
 * hard-coded "Refunded" card is covered by the Sub list. Neither twin's
 * header filter button had a handler, so it is not ported.
 *
 * Gates: none (read-only list).
 */
// Design id: M10-S06
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { WarehouseTabBar } from '../wallet-cashtopup/WalletParts';
import { WarehouseSelector } from '../inventory';
import { inScope, isAllWarehouses, ReturnsScreen } from './ReturnsParts';
import type { ReturnHistoryRecord, WarehouseScope, WarehouseScreenBaseProps } from './types';

export interface ReturnHistoryScreenProps extends WarehouseScreenBaseProps {
  onSelectRecord: (record: ReturnHistoryRecord) => void;
  /** Warehouses for the Main all-warehouses selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** History rows. */
  records?: readonly ReturnHistoryRecord[] | undefined;
}

type HistoryFilter = 'All' | 'Approved' | 'Rejected' | 'Completed';
const FILTERS: readonly HistoryFilter[] = ['All', 'Approved', 'Rejected', 'Completed'];

function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={adminColors.muted} strokeWidth="2" />
      <Path d="M21 21l-4.35-4.35" stroke={adminColors.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function FilterSlidersIcon({ size = 20, color = adminColors.onBrand }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ReturnHistoryScreen({
  scope,
  onBack,
  onTabChange,
  onSelectRecord,
  warehouseOptions,
  records = [],
}: ReturnHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>('All');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const allWarehouses = isAllWarehouses(scope);

  const filteredItems = records.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      item.rmaId.toLowerCase().includes(q) ||
      item.orderId.toLowerCase().includes(q) ||
      item.customerName.toLowerCase().includes(q);
    const matchesFilter = activeFilter === 'All' || item.status === activeFilter;
    const matchesScope = allWarehouses
      ? selectedWarehouseId === undefined || item.warehouseId === undefined || item.warehouseId === selectedWarehouseId
      : inScope(scope, item.warehouseId);
    return matchesSearch && matchesFilter && matchesScope;
  });

  return (
    <ReturnsScreen
      title="Return History"
      onBack={onBack}
      headerRight={
        <TouchableOpacity
          style={styles.headerFilterBtn}
          onPress={() => {}}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Filter returns"
        >
          <FilterSlidersIcon size={20} color={adminColors.onBrand} />
        </TouchableOpacity>
      }
      headerExtra={
        allWarehouses ? (
          <WarehouseSelector
            scope={scope}
            options={warehouseOptions}
            selectedId={selectedWarehouseId}
            onSelect={setSelectedWarehouseId}
          />
        ) : null
      }
      footer={
        !allWarehouses ? (
          <WarehouseTabBar activeTab="More" onTabChange={onTabChange} onBack={onBack} />
        ) : null
      }
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.searchBar}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search RMA, Ticket, Order or Customer"
            placeholderTextColor={adminColors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.chipsRow}>
          {FILTERS.map((chip) => {
            const isActive = activeFilter === chip;
            return (
              <TouchableOpacity
                key={chip}
                style={[styles.chipBtn, isActive && styles.chipBtnActive]}
                onPress={() => setActiveFilter(chip)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{chip}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.cardsList}>
          {filteredItems.map((item) => {
            const isRejected = item.status === 'Rejected';
            return (
              <TouchableOpacity
                key={item.rmaId}
                style={styles.rmaCard}
                onPress={() => onSelectRecord(item)}
                activeOpacity={0.85}
              >
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.rmaIdText}>{item.rmaId}</Text>
                  <View style={[styles.statusBadge, isRejected && styles.statusBadgeRejected]}>
                    <Text style={[styles.statusBadgeText, isRejected && styles.statusBadgeTextRejected]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.customerName}>{item.customerName}</Text>
                <Text style={styles.orderId}>{item.orderId}</Text>
                <View style={styles.tagAmountRow}>
                  <View style={styles.reasonTag}>
                    <Text style={styles.reasonTagText}>{item.reasonTag}</Text>
                  </View>
                  {item.refundAmount ? <Text style={styles.refundText}>Refund {item.refundAmount}</Text> : null}
                </View>
                <Text style={styles.dateText}>{item.date}</Text>
              </TouchableOpacity>
            );
          })}
          {filteredItems.length === 0 ? <Text style={styles.emptyText}>No returns found</Text> : null}
        </View>
      </ScrollView>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.lg, paddingBottom: adminSpacing.xl },
  headerFilterBtn: {
    width: 40,
    height: 40,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.brandDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 48,
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  searchInput: { ...adminType.body, flex: 1, color: adminColors.ink, paddingVertical: 0 },
  chipsRow: { flexDirection: 'row', gap: adminSpacing.sm, marginBottom: adminSpacing.lg },
  chipBtn: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  chipBtnActive: { borderColor: adminColors.brandDeep, backgroundColor: adminColors.brandTint },
  chipText: { ...adminType.rowMeta, color: adminColors.muted },
  chipTextActive: { ...adminType.rowMeta, fontWeight: '700', color: adminColors.brandDeep },
  cardsList: { gap: adminSpacing.md },
  rmaCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.lg,
    ...adminShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  rmaIdText: { ...adminType.rowTitle, color: adminColors.brandDeep },
  statusBadge: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.success.bg,
  },
  statusBadgeRejected: { backgroundColor: adminColors.danger.bg },
  statusBadgeText: { ...adminType.caption, fontWeight: '700', color: adminColors.success.text },
  statusBadgeTextRejected: { color: adminColors.danger.text },
  customerName: { ...adminType.rowTitle, color: adminColors.ink, marginTop: adminSpacing.xs, marginBottom: 2 },
  orderId: { ...adminType.caption, color: adminColors.muted, marginBottom: adminSpacing.sm },
  tagAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.xs,
  },
  reasonTag: {
    backgroundColor: adminColors.brandTint,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 3,
    borderRadius: adminRadius.sm,
  },
  reasonTagText: { ...adminType.caption, fontWeight: '700', color: adminColors.brandDeep },
  refundText: { ...adminType.rowTitle, color: adminColors.success.text },
  dateText: { ...adminType.caption, color: adminColors.muted },
  emptyText: { ...adminType.body, color: adminColors.muted, textAlign: 'center', padding: adminSpacing.xl },
});
