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
import { SWABottomNav } from '../../swa/components';
import { WarehouseSelector } from '../inventory';
import { INITIAL_RETURN_HISTORY } from './fixtures';
import { inScope, isAllWarehouses, ReturnsScreen } from './ReturnsParts';
import type { ReturnHistoryRecord, WarehouseScope, WarehouseScreenBaseProps } from './types';

export interface ReturnHistoryScreenProps extends WarehouseScreenBaseProps {
  onSelectRecord: (record: ReturnHistoryRecord) => void;
  /** Warehouses for the Main all-warehouses selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** History rows; defaults to the mock set until the RMA API is wired. */
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

export function ReturnHistoryScreen({
  scope,
  onBack,
  onTabChange,
  onSelectRecord,
  warehouseOptions,
  records = INITIAL_RETURN_HISTORY,
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
      footer={<SWABottomNav activeTab="More" onTabChange={onTabChange} />}
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  searchInput: { ...adminType.body, flex: 1, color: adminColors.ink, paddingVertical: 0 },
  chipsRow: { flexDirection: 'row', gap: adminSpacing.sm, marginBottom: adminSpacing.lg },
  chipBtn: {
    paddingHorizontal: adminSpacing.lg,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  chipBtnActive: { borderColor: adminColors.brand, backgroundColor: adminColors.brandTint },
  chipText: { ...adminType.body, color: adminColors.muted },
  chipTextActive: { ...adminType.sectionHead, color: adminColors.brand },
  cardsList: { gap: adminSpacing.md },
  rmaCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.xl,
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
  rmaIdText: { ...adminType.sectionHead, color: adminColors.brandDeep },
  statusBadge: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.success.bg,
  },
  statusBadgeRejected: { backgroundColor: adminColors.danger.bg },
  statusBadgeText: { ...adminType.caption, color: adminColors.success.text },
  statusBadgeTextRejected: { color: adminColors.danger.text },
  customerName: { ...adminType.rowTitle, color: adminColors.ink, marginBottom: 2 },
  orderId: { ...adminType.rowMeta, color: adminColors.muted, marginBottom: adminSpacing.md },
  tagAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: adminSpacing.sm,
  },
  reasonTag: {
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: 2,
    borderRadius: adminRadius.full,
  },
  reasonTagText: { ...adminType.caption, color: adminColors.warning.text },
  refundText: { ...adminType.sectionHead, color: adminColors.success.text },
  dateText: { ...adminType.rowMeta, color: adminColors.muted },
  emptyText: { ...adminType.body, color: adminColors.muted, textAlign: 'center', padding: adminSpacing.xxl },
});
