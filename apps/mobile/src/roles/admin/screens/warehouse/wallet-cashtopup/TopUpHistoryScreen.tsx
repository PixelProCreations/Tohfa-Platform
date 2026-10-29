// Design id: M8-S07
/**
 * Top-Up History: read-only list of cash top-ups. Rows are limited to the own
 * warehouse when scope.warehouseId is set; the all-warehouses selector (and a
 * per-row warehouse label) appears only for Main (scope.warehouseId undefined).
 * Opening a row is the flow's TopUpDetails route (it used to be nested here).
 *
 * Absorbs dashboard/MainWarehouseTopUpHistoryScreen: its per-row warehouse
 * label and Success / Failed counters are the Main (all-warehouses) view here.
 */
import React, { useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminOverlay, adminRadius, adminSpacing, adminType } from '../../../theme';
import type { TopUpHistoryRow, TopUpStatus, WalletTransactionRecord, WarehouseScope, WarehouseScreenBaseProps } from './types';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import {
  EmptyState,
  HeaderIconButton,
  KpiRow,
  ScopeHeader,
  SearchBar,
  SlidersIcon,
  StatusBadge,
  WalletScreen,
  WarehouseTabBar,
  inScope,
  isAllWarehouses,
  walletLayout,
} from './WalletParts';

export interface TopUpHistoryScreenProps extends WarehouseScreenBaseProps {
  rows?: readonly TopUpHistoryRow[] | undefined;
  /** Warehouses for the Main all-warehouses selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  onSelectTransaction: (transaction: WalletTransactionRecord) => void;
}

const PAGE = 2;
const STATUS_TONE: Record<TopUpStatus, 'success' | 'warning' | 'danger'> = {
  Completed: 'success',
  Pending: 'warning',
  Failed: 'danger',
};

const EMPTY_ROWS: readonly TopUpHistoryRow[] = [];

/** The history row as a top-up record for the details screen (mock balances). */
export function toTopUpRecord(row: TopUpHistoryRow, scope: WarehouseScope, warehouseName?: string): WalletTransactionRecord {
  return {
    customerName: row.customerName,
    customerId: row.customerId,
    previousBalance: '—',
    amount: row.amount,
    newBalance: '—',
    transactionId: row.id,
    // Negative rule: Wallet totals (credited/used) and transaction status -> '—' or hide row
    status: '—',
    type: 'Cash Top-Up',
    fiscalCashTag: row.fiscalTag,
    dateTime: `${row.date}, ${row.time}`,
    processedBy: scope.warehouseName ?? (scope.warehouseId ? 'Sub Admin' : 'Main Admin'),
    createdAt: `${row.date}, ${row.time}`,
    warehouseId: row.warehouseId,
    warehouseName: warehouseName ?? row.warehouseId,
  };
}

const STATUS_FILTERS = ['All', 'Completed', 'Pending', 'Failed'] as const;
type StatusFilterType = (typeof STATUS_FILTERS)[number];

export function TopUpHistoryScreen({
  scope,
  onBack,
  onTabChange,
  rows = EMPTY_ROWS,
  warehouseOptions,
  onSelectTransaction,
}: TopUpHistoryScreenProps) {
  const { options: fetchedWarehouses } = useWarehouseOptions();
  const effectiveWarehouseOptions =
    warehouseOptions && warehouseOptions.length > 0 ? warehouseOptions : fetchedWarehouses;
  const [search, setSearch] = useState('');
  const [itemsCount, setItemsCount] = useState(PAGE);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('All');
  const [tempStatusFilter, setTempStatusFilter] = useState<StatusFilterType>('All');
  const [tempWarehouseId, setTempWarehouseId] = useState<string | undefined>(undefined);
  const allWarehouses = isAllWarehouses(scope);

  const scoped = useMemo(
    () => rows.filter((row) => inScope(scope, row.warehouseId, selectedWarehouseId)),
    [rows, scope, selectedWarehouseId],
  );
  const query = search.trim().toLowerCase();
  const filtered = scoped
    .filter((row) => (statusFilter === 'All' ? true : row.status === statusFilter))
    .slice(0, itemsCount)
    .filter(
      (row) =>
        row.id.toLowerCase().includes(query) ||
        row.customerName.toLowerCase().includes(query) ||
        row.customerId.toLowerCase().includes(query) ||
        row.fiscalTag.toLowerCase().includes(query),
    );
  const completed = scoped.filter((row) => row.status === 'Completed').length;
  const failed = scoped.filter((row) => row.status === 'Failed').length;

  const openFilter = () => {
    setTempStatusFilter(statusFilter);
    setTempWarehouseId(selectedWarehouseId);
    setShowFilterModal(true);
  };

  const applyFilter = () => {
    setStatusFilter(tempStatusFilter);
    if (allWarehouses) {
      setSelectedWarehouseId(tempWarehouseId);
    }
    setShowFilterModal(false);
  };

  const resetFilter = () => {
    setTempStatusFilter('All');
    setTempWarehouseId(undefined);
    setStatusFilter('All');
    if (allWarehouses) {
      setSelectedWarehouseId(undefined);
    }
    setShowFilterModal(false);
  };

  return (
    <WalletScreen
      title="Top-Up History"
      onBack={onBack}
      headerRight={
        <HeaderIconButton
          accessibilityLabel="Filter top-ups"
          onPress={openFilter}
        >
          <SlidersIcon />
        </HeaderIconButton>
      }
      headerExtra={
        <ScopeHeader
          scope={scope}
          warehouseOptions={effectiveWarehouseOptions}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={(id) => {
            setSelectedWarehouseId(id);
            setItemsCount(PAGE);
          }}
        />
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        {allWarehouses ? (
          <KpiRow
            items={[
              { value: String(scoped.length), label: 'TOP-UPS' },
              { value: String(completed), label: 'SUCCESS', tone: 'success' },
              { value: String(failed), label: 'FAILED', tone: 'danger' },
            ]}
          />
        ) : (
          <KpiRow
            items={[
              { value: '24', label: 'TODAY' },
              { value: '186', label: 'THIS MONTH' },
              { value: '₹1,42,500', label: 'CASH COLLECTED' },
            ]}
          />
        )}

        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search Customer ID / Transaction ID / Fiscal Tag"
          onFilterPress={openFilter}
        />

        {statusFilter !== 'All' ? (
          <View style={styles.appliedFilterRow}>
            <Text style={styles.appliedFilterText}>Filtered by Status: {statusFilter}</Text>
            <TouchableOpacity onPress={() => setStatusFilter('All')} activeOpacity={0.7}>
              <Text style={styles.clearFilterText}>Clear</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {filtered.length === 0 ? (
          <EmptyState title="No top-ups found" subtitle="Try another search or filter." />
        ) : (
          filtered.map((row) => {
            const whName = effectiveWarehouseOptions.find((w) => w.warehouseId === row.warehouseId)?.warehouseName ?? row.warehouseId;
            return (
              <TouchableOpacity
                key={row.id}
                style={styles.rowCard}
                onPress={() => onSelectTransaction(toTopUpRecord(row, scope, whName))}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <View style={styles.rowTop}>
                  <Text style={styles.rowId}>{row.id}</Text>
                  <StatusBadge label={row.status} tone={STATUS_TONE[row.status]} />
                </View>
                <Text style={styles.rowCustomer}>
                  {row.customerName} · {row.customerId}
                </Text>
                <View style={styles.rowMiddle}>
                  <Text style={styles.rowMeta}>Fiscal Tag: {row.fiscalTag}</Text>
                  <Text style={styles.rowAmount}>{row.amount}</Text>
                </View>
                <View style={styles.rowBottom}>
                  <Text style={styles.rowMeta}>
                    {allWarehouses ? `${row.date} · ${whName}` : row.date}
                  </Text>
                  <Text style={styles.rowMeta}>{row.time}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {itemsCount < scoped.length ? (
          <TouchableOpacity
            style={styles.loadMore}
            onPress={() => setItemsCount((count) => Math.min(count + PAGE, scoped.length))}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Text style={styles.loadMoreText}>Load More ↓</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Top-Ups</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)} activeOpacity={0.7}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.filterSectionTitle}>Status</Text>
            <View style={styles.chipRow}>
              {STATUS_FILTERS.map((st) => {
                const active = tempStatusFilter === st;
                return (
                  <TouchableOpacity
                    key={st}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setTempStatusFilter(st)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{st}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {allWarehouses ? (
              <>
                <Text style={styles.filterSectionTitle}>Warehouse</Text>
                <View style={styles.chipRow}>
                  <TouchableOpacity
                    style={[styles.chip, tempWarehouseId === undefined && styles.chipActive]}
                    onPress={() => setTempWarehouseId(undefined)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, tempWarehouseId === undefined && styles.chipTextActive]}>All</Text>
                  </TouchableOpacity>
                  {effectiveWarehouseOptions.map((wh: WarehouseScope) => {
                    const active = tempWarehouseId === wh.warehouseId;
                    return (
                      <TouchableOpacity
                        key={wh.warehouseId}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setTempWarehouseId(wh.warehouseId)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {wh.warehouseName?.replace(' Warehouse', '') ?? wh.warehouseId}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            ) : null}

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalResetBtn} onPress={resetFilter} activeOpacity={0.8}>
                <Text style={styles.modalResetText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalApplyBtn} onPress={applyFilter} activeOpacity={0.85}>
                <Text style={styles.modalApplyText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  appliedFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: adminColors.warning.bg,
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.sm,
    marginBottom: adminSpacing.sm,
  },
  appliedFilterText: { ...adminType.caption, color: adminColors.warning.text, fontWeight: '600' },
  clearFilterText: { ...adminType.caption, color: adminColors.brand, fontWeight: '700' },
  rowCard: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowId: { ...adminType.rowTitle, color: adminColors.brandDeep },
  rowCustomer: { ...adminType.body, color: adminColors.ink, marginTop: adminSpacing.xs },
  rowMiddle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: adminSpacing.xs },
  rowBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: adminSpacing.xs },
  rowMeta: { ...adminType.rowMeta, color: adminColors.muted },
  rowAmount: { ...adminType.sectionHead, color: adminColors.ink },
  loadMore: { alignItems: 'center', paddingVertical: adminSpacing.md },
  loadMoreText: { ...adminType.rowTitle, color: adminColors.brand },

  modalOverlay: {
    flex: 1,
    backgroundColor: adminOverlay.scrim,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: adminColors.card,
    borderTopLeftRadius: adminRadius.xl,
    borderTopRightRadius: adminRadius.xl,
    padding: adminSpacing.xl,
    paddingBottom: 36,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: adminSpacing.lg,
  },
  modalTitle: { ...adminType.title, color: adminColors.ink },
  modalCloseText: { ...adminType.title, color: adminColors.muted },
  filterSectionTitle: {
    ...adminType.sectionHead,
    color: adminColors.ink,
    marginTop: adminSpacing.md,
    marginBottom: adminSpacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: adminSpacing.sm,
    marginBottom: adminSpacing.md,
  },
  chip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.xs,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  chipActive: {
    backgroundColor: adminColors.brand,
    borderColor: adminColors.brand,
  },
  chipText: { ...adminType.caption, color: adminColors.ink },
  chipTextActive: { ...adminType.caption, color: adminColors.onBrand, fontWeight: '700' },
  modalActionRow: {
    flexDirection: 'row',
    gap: adminSpacing.md,
    marginTop: adminSpacing.lg,
  },
  modalResetBtn: {
    flex: 1,
    height: 44,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalResetText: { ...adminType.sectionHead, color: adminColors.muted },
  modalApplyBtn: {
    flex: 2,
    height: 44,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalApplyText: { ...adminType.sectionHead, color: adminColors.onBrand, fontWeight: '700' },
});
