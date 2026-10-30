/**
 * Return History — closed RMAs with search and status filter.
 *
 * Scope (FINAL_LIST row 101): the All-warehouses selector is rendered only for
 * the Main view (scope.warehouseId undefined). A Sub admin sees its own
 * warehouse's history only.
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
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import type { ReturnStatus } from '../../../api/returns';
import type { PermissionCheck } from './types';
import { useCustomer } from '../customers/useCustomerData';
import { useReturnList } from './useReturnData';
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

/**
 * One history row. Loads the real customer name itself (BR-92: masked mobile
 * handled at detail level; the list only needs a name) rather than the
 * mapper's '—' placeholder — there is no bulk customer-name endpoint, so each
 * visible row resolves its own name via the cached per-customer query.
 */
function ReturnHistoryCard({
  item,
  can,
  onPress,
}: {
  item: ReturnHistoryRecord;
  can: PermissionCheck;
  onPress: () => void;
}) {
  const customerQuery = useCustomer(item.customerId, can);
  const customerName = customerQuery.data?.name ?? item.customerName;
  const isRejected = item.status === 'Rejected';
  return (
    <TouchableOpacity
      style={styles.historyCard}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      <View style={styles.cardHeader}>
        <Text style={styles.rmaIdText}>{item.rmaId}</Text>
        <View style={[styles.statusBadge, isRejected ? styles.badgeRejected : styles.badgeCompleted]}>
          <Text style={[styles.statusText, isRejected ? styles.statusTextRejected : styles.statusTextCompleted]}>
            {item.status}
          </Text>
        </View>
      </View>
      <Text style={styles.customerLine}>{customerName} · Order #{item.orderId}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.reasonText}>{item.reasonTag}</Text>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>
    </TouchableOpacity>
  );
}

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
  can,
  onBack,
  onTabChange,
  onSelectRecord,
  warehouseOptions,
  records: passedRecords,
}: ReturnHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>('All');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const allWarehouses = isAllWarehouses(scope);

  const statusParam: ReturnStatus | undefined =
    activeFilter === 'Completed'
      ? 'REFUNDED'
      : activeFilter === 'Rejected'
        ? 'REJECTED'
        : activeFilter === 'Approved'
          ? 'APPROVED'
          : undefined;

  const returnList = useReturnList(scope, can, selectedWarehouseId, statusParam);

  const effectiveRecords: readonly ReturnHistoryRecord[] =
    passedRecords ??
    returnList.items.map((r) => {
      const status: 'Completed' | 'Rejected' | 'Approved' =
        r.status === 'Approved' ? 'Approved' : 'Completed';
      return {
        id: r.id,
        rmaId: r.rmaId,
        orderId: r.orderId,
        customerName: r.customerName,
        reasonTag: r.description,
        status,
        date: r.reportedDate,
        customerId: r.customerId,
        warehouseId: r.warehouseId,
      };
    });

  const filteredItems = effectiveRecords.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    // Customer name is not searchable here: the list has no bulk customer-name
    // endpoint, each row resolves its own name only once rendered (ReturnHistoryCard).
    const matchesSearch =
      !q || item.rmaId.toLowerCase().includes(q) || item.orderId.toLowerCase().includes(q);
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
            placeholder="Search RMA, Order or Customer"
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

        {passedRecords === undefined && returnList.isLoading ? <AdminLoadingState /> : null}
        {passedRecords === undefined && returnList.error ? (
          <AdminErrorState error={returnList.error} onRetry={returnList.refresh} />
        ) : null}

        <View style={styles.cardsList}>
          {filteredItems.map((item) => (
            <ReturnHistoryCard
              key={item.id ?? item.rmaId}
              item={item}
              can={can}
              onPress={() => onSelectRecord(item)}
            />
          ))}
        </View>
      </ScrollView>
    </ReturnsScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingHorizontal: adminSpacing.lg, paddingTop: adminSpacing.sm, paddingBottom: adminSpacing.xl },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: adminSpacing.md,
    height: 44,
    marginBottom: adminSpacing.md,
    gap: adminSpacing.sm,
  },
  searchInput: { flex: 1, ...adminType.body, color: adminColors.ink, padding: 0 },
  chipsRow: { flexDirection: 'row', gap: adminSpacing.sm, marginBottom: adminSpacing.md },
  chipBtn: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    backgroundColor: adminColors.card,
    borderWidth: 1,
    borderColor: adminColors.border,
  },
  chipBtnActive: { backgroundColor: adminColors.brandTint, borderColor: adminColors.brand },
  chipText: { ...adminType.rowMeta, color: adminColors.muted },
  chipTextActive: { color: adminColors.brandDeep, fontWeight: '600' },
  cardsList: { gap: adminSpacing.md },
  historyCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    ...adminShadow.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: adminSpacing.xs },
  rmaIdText: { ...adminType.kpiValue, color: adminColors.ink },
  statusBadge: { paddingHorizontal: adminSpacing.sm, paddingVertical: 2, borderRadius: adminRadius.sm },
  badgeCompleted: { backgroundColor: adminColors.success.bg },
  badgeRejected: { backgroundColor: adminColors.danger.bg },
  statusText: { ...adminType.rowMeta, fontWeight: '600' },
  statusTextCompleted: { color: adminColors.success.text },
  statusTextRejected: { color: adminColors.danger.text },
  customerLine: { ...adminType.body, color: adminColors.ink, marginBottom: adminSpacing.xs },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reasonText: { ...adminType.rowMeta, color: adminColors.muted, flex: 1 },
  dateText: { ...adminType.rowMeta, color: adminColors.muted },
});
