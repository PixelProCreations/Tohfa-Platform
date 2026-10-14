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
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { TOP_UP_HISTORY, WALLET_WAREHOUSES, sampleProcessedBy, warehouseNameOf } from './fixtures';
import type { TopUpHistoryRow, TopUpStatus, WalletTransactionRecord, WarehouseScope, WarehouseScreenBaseProps } from './types';
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

/** The history row as a top-up record for the details screen (mock balances). */
export function toTopUpRecord(row: TopUpHistoryRow, scope: WarehouseScope): WalletTransactionRecord {
  return {
    customerName: row.customerName,
    customerId: row.customerId,
    previousBalance: '₹2,500',
    amount: row.amount,
    newBalance: '₹4,500',
    transactionId: row.id,
    status: row.status,
    type: 'Cash Top-Up',
    fiscalCashTag: row.fiscalTag,
    dateTime: `${row.date}, ${row.time}`,
    processedBy: sampleProcessedBy(scope),
    createdAt: `${row.date}, ${row.time}`,
    warehouseId: row.warehouseId,
    warehouseName: warehouseNameOf(row.warehouseId),
  };
}

export function TopUpHistoryScreen({
  scope,
  onBack,
  onTabChange,
  rows = TOP_UP_HISTORY,
  warehouseOptions = WALLET_WAREHOUSES,
  onSelectTransaction,
}: TopUpHistoryScreenProps) {
  const [search, setSearch] = useState('');
  const [itemsCount, setItemsCount] = useState(PAGE);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const allWarehouses = isAllWarehouses(scope);

  const scoped = useMemo(
    () => rows.filter((row) => inScope(scope, row.warehouseId, selectedWarehouseId)),
    [rows, scope, selectedWarehouseId],
  );
  const query = search.trim().toLowerCase();
  const filtered = scoped
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

  return (
    <WalletScreen
      title="Top-Up History"
      onBack={onBack}
      headerRight={
        <HeaderIconButton
          accessibilityLabel="Filter top-ups"
          onPress={() => Alert.alert('Filter', 'Filter by Date, Amount range or Status.')}
        >
          <SlidersIcon />
        </HeaderIconButton>
      }
      headerExtra={
        <ScopeHeader
          scope={scope}
          warehouseOptions={warehouseOptions}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={(id) => {
            setSelectedWarehouseId(id);
            setItemsCount(PAGE);
          }}
        />
      }
      footer={<WarehouseTabBar onTabChange={onTabChange} onBack={onBack} />}
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
        />

        {filtered.length === 0 ? (
          <EmptyState title="No top-ups found" subtitle="Try another search or warehouse." />
        ) : (
          filtered.map((row) => (
            <TouchableOpacity
              key={row.id}
              style={styles.rowCard}
              onPress={() => onSelectTransaction(toTopUpRecord(row, scope))}
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
                  {allWarehouses ? `${row.date} · ${warehouseNameOf(row.warehouseId)}` : row.date}
                </Text>
                <Text style={styles.rowMeta}>{row.time}</Text>
              </View>
            </TouchableOpacity>
          ))
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
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
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
});
