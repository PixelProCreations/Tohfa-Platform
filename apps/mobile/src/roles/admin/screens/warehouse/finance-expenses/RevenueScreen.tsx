// Design id: M11-S02
/**
 * Revenue: the sales-income list, read-only. Serves both warehouse roles (it
 * was SubWarehouseRevenueScreen and absorbs MainWarehouseRevenueScreen).
 *
 * Scope (finance.sales_income.view: MAIN all, SUB own): a Sub scope lists only
 * its own warehouse's rows under a locked pill (the old hard-wired 'Coonoor
 * Warehouse · Today' now comes from scope.warehouseName); Main (warehouseId
 * undefined) gets the all-warehouses selector. The server applies the real
 * filter (CLAUDE.md 2.1).
 *
 * Main-only content ported: Main's list opened the record inside itself
 * (embedded RevenueDetail). Without `onSelectRevenue` this screen does the
 * same, so a host that just mounts the list (Finance Reports) still gets the
 * detail; FinanceFlow passes `onSelectRevenue` and pushes the detail instead.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import {
  ChipGroup,
  EmptyState,
  inScope,
  isAllWarehouses,
  KpiRow,
  ScopeHeader,
  SearchBar,
  StatusBadge,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { FINANCE_WAREHOUSES, SAMPLE_REVENUE_RECORDS } from './fixtures';
import { FINANCE_CODES, FinanceNotAvailable, rupees, scopeLabel } from './FinanceParts';
import { RevenueDetailScreen } from './RevenueDetailScreen';
import type { RevenueRecord, WarehouseScope, WarehouseScreenBaseProps } from './types';

const CATEGORY_FILTERS = ['All', 'Orders', 'Direct Sales', 'Other'] as const;
type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

export interface RevenueScreenProps extends WarehouseScreenBaseProps {
  records?: readonly RevenueRecord[] | undefined;
  /** Warehouses for the Main all-warehouses selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** Open a record. Without it the record opens inside this screen (Main's embedded detail). */
  onSelectRevenue?: ((record: RevenueRecord) => void) | undefined;
  onViewOrder?: (() => void) | undefined;
  onViewInvoice?: (() => void) | undefined;
}

/** A list row as revenue-detail props. */
export function revenueDetailOf(record: RevenueRecord) {
  return {
    revenueId: record.id,
    finalAmount: record.amount.toLocaleString('en-IN'),
    paymentMethod: record.paymentMethod,
    paymentStatus: record.status,
    salesChannel: record.orderRef.split('·')[0]?.trim(),
    transactionDate: record.timestamp,
    warehouseName: record.warehouseName,
  };
}

export function RevenueScreen({
  scope,
  can,
  onBack,
  onTabChange,
  records = SAMPLE_REVENUE_RECORDS,
  warehouseOptions = FINANCE_WAREHOUSES,
  onSelectRevenue,
  onViewOrder,
  onViewInvoice,
}: RevenueScreenProps) {
  const [selectedFilter, setSelectedFilter] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const [openRecord, setOpenRecord] = useState<RevenueRecord | null>(null);

  if (!can(FINANCE_CODES.salesIncome)) {
    return <FinanceNotAvailable title="Revenue" message="Your role does not include sales income." onBack={onBack} />;
  }

  if (openRecord) {
    return (
      <RevenueDetailScreen
        scope={scope}
        can={can}
        onBack={() => setOpenRecord(null)}
        onTabChange={onTabChange}
        onViewOrder={onViewOrder}
        onViewInvoice={onViewInvoice}
        {...revenueDetailOf(openRecord)}
      />
    );
  }

  const query = searchQuery.trim().toLowerCase();
  const visible = records.filter((rec) => {
    if (!inScope(scope, rec.warehouseId, selectedWarehouseId)) return false;
    if (selectedFilter !== 'All' && rec.category !== selectedFilter) return false;
    return (
      !query ||
      rec.id.toLowerCase().includes(query) ||
      rec.orderRef.toLowerCase().includes(query) ||
      rec.paymentMethod.toLowerCase().includes(query)
    );
  });

  const openRevenue = (record: RevenueRecord) => {
    if (onSelectRevenue) onSelectRevenue(record);
    else setOpenRecord(record);
  };

  return (
    <WalletScreen
      title="Revenue"
      onBack={onBack}
      headerExtra={
        <ScopeHeader
          scope={scope}
          label={isAllWarehouses(scope) ? undefined : `${scopeLabel(scope)} · Today`}
          warehouseOptions={warehouseOptions}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={setSelectedWarehouseId}
        />
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <KpiRow
          items={[
            { label: 'TOTAL REVENUE', value: '₹1,84,500' },
            { label: "TODAY'S REVENUE", value: '₹24,850' },
          ]}
        />
        <KpiRow
          items={[
            { label: 'ONLINE / ORDER', value: '₹12,400' },
            { label: 'MARKET SALES', value: '₹9,850' },
          ]}
        />

        <View style={styles.filters}>
          <ChipGroup options={CATEGORY_FILTERS} value={selectedFilter} onChange={setSelectedFilter} />
        </View>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Revenue ID, Order ID, Invoice or Customer"
        />

        {visible.length === 0 ? (
          <EmptyState title="No revenue found" subtitle="Try a different search or category." />
        ) : (
          <View style={styles.list}>
            {visible.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => openRevenue(item)}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.recordId}>{item.id}</Text>
                  <StatusBadge label={item.status} tone={item.status === 'Completed' ? 'success' : 'warning'} />
                </View>
                <Text style={styles.orderRef}>{item.orderRef}</Text>
                <View style={styles.amountRow}>
                  <Text style={styles.amount}>{rupees(item.amount)}</Text>
                  <Text style={styles.meta}>{item.paymentMethod}</Text>
                </View>
                <Text style={styles.meta}>
                  {item.timestamp}
                  {isAllWarehouses(scope) && item.warehouseName ? ` · ${item.warehouseName}` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  filters: { marginBottom: adminSpacing.md },
  list: { gap: adminSpacing.md },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    gap: adminSpacing.xs,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recordId: { ...adminType.rowTitle, color: adminColors.brandDeep },
  orderRef: { ...adminType.body, color: adminColors.ink },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amount: { ...adminType.sectionHead, color: adminColors.success.text },
  meta: { ...adminType.rowMeta, color: adminColors.muted },
});
