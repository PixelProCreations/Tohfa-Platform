// Design id: M11-S07
/**
 * Vouchers: the voucher list, read-only. Serves both warehouse roles (it was
 * SubWarehouseVouchersScreen and absorbs MainWarehouseVouchersScreen and
 * MainWarehouseVouchersFilterScreen).
 *
 * NO rbac code covers vouchers (SPEC_GAPS, FINAL_LIST #43). Interim gate by
 * voucher type: expense vouchers are listed only with finance.expense.log,
 * revenue vouchers only with finance.sales_income.view; the type chips offer
 * only the types the viewer can see.
 *
 * Scope: Sub lists its own warehouse's vouchers (locked pill, the old
 * `warehouseName` prop is scope.warehouseName); Main (warehouseId undefined)
 * gets the all-warehouses selector.
 *
 * Main-only content ported: the filter icon opened a separate "Voucher Type"
 * filter screen; it is folded in as an in-screen filter view.
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
  SectionTitle,
  StatusBadge,
  WalletButton,
  WalletFooter,
  WalletScreen,
  walletLayout,
} from '../wallet-cashtopup/WalletParts';
import { canSeeVoucherType, FilterIcon, FinanceNotAvailable, rupees, scopeLabel } from './FinanceParts';
import { useExpenses, useRevenueList } from './useFinanceData';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import type { VoucherRecord, VoucherType, WarehouseScope, WarehouseScreenBaseProps } from './types';
import { VoucherDetailScreen } from './VoucherDetailScreen';

type TypeFilter = 'All' | VoucherType;
const VOUCHER_TYPES: readonly VoucherType[] = ['Expense', 'Revenue'];

export interface VouchersScreenProps extends WarehouseScreenBaseProps {
  vouchers?: readonly VoucherRecord[] | undefined;
  /** Warehouses for the Main all-warehouses selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** Open a voucher. Without it the voucher opens inside this screen. */
  onSelectVoucher?: ((voucher: VoucherRecord) => void) | undefined;
  initialWarehouseId?: string | undefined;
  hideWarehouseFilter?: boolean | undefined;
}

/** Voucher Type & Warehouse chooser (was MainWarehouseVouchersFilterScreen). */
interface VoucherFilterViewProps {
  options: readonly TypeFilter[];
  selected: TypeFilter;
  selectedWarehouseId?: string | undefined;
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  isMain: boolean;
  hideWarehouseFilter?: boolean | undefined;
  onBack: () => void;
  onApply: (type: TypeFilter, warehouseId?: string | undefined) => void;
}

function VoucherFilterView({
  options,
  selected,
  selectedWarehouseId,
  warehouseOptions = [],
  isMain,
  hideWarehouseFilter = false,
  onBack,
  onApply,
}: VoucherFilterViewProps) {
  const [draftType, setDraftType] = useState<TypeFilter>(selected);
  const [draftWarehouse, setDraftWarehouse] = useState<string | undefined>(selectedWarehouseId);

  return (
    <WalletScreen
      title="Filter Vouchers"
      onBack={onBack}
      footer={
        <WalletFooter>
          <WalletButton label="Apply Filters" onPress={() => onApply(draftType, draftWarehouse)} />
        </WalletFooter>
      }
    >
      <View style={walletLayout.scrollContent}>
        {isMain && !hideWarehouseFilter ? (
          <View style={{ marginBottom: adminSpacing.lg }}>
            <SectionTitle>Warehouses</SectionTitle>
            <View style={styles.chipGrid}>
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  (!draftWarehouse || draftWarehouse === 'All') && styles.filterChipActive,
                ]}
                onPress={() => setDraftWarehouse(undefined)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    (!draftWarehouse || draftWarehouse === 'All') && styles.filterChipTextActive,
                  ]}
                >
                  All Warehouses
                </Text>
              </TouchableOpacity>
              {warehouseOptions.map((w) => {
                const id = w.warehouseId ?? '';
                const name = (w.warehouseName ?? id).replace(/ Warehouse$/, '');
                const isSelected = draftWarehouse === id || draftWarehouse === w.warehouseName;
                return (
                  <TouchableOpacity
                    key={id || name}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    onPress={() => setDraftWarehouse(id || name)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                      {name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        <View>
          <SectionTitle>Voucher Type</SectionTitle>
          <ChipGroup options={options} value={draftType} onChange={setDraftType} />
        </View>
      </View>
    </WalletScreen>
  );
}

export function VouchersScreen({
  scope,
  can,
  onBack,
  onTabChange,
  vouchers: initialVouchers,
  warehouseOptions: initialWarehouseOptions,
  onSelectVoucher,
  initialWarehouseId,
  hideWarehouseFilter = false,
}: VouchersScreenProps) {
  const isMain = isAllWarehouses(scope);
  const { options: liveWarehouseOptions } = useWarehouseOptions();
  const warehouseOptions = initialWarehouseOptions ?? liveWarehouseOptions;
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(initialWarehouseId);

  const effectiveWarehouseId = isMain
    ? (selectedWarehouseId && selectedWarehouseId !== 'All' ? selectedWarehouseId : undefined)
    : scope.warehouseId;
  const { expenses } = useExpenses({ warehouseId: effectiveWarehouseId });
  const { revenueRecords } = useRevenueList({});

  const liveExpenseVouchers: VoucherRecord[] = expenses.map((e) => ({
    id: `VCH-${e.id.replace('EXP-', '')}`,
    type: 'Expense',
    title: `Expense Voucher · ${e.categoryRef.split('·')[0]?.trim() || 'Expense'}`,
    amount: e.amount,
    referenceId: e.id,
    date: e.timestamp,
    status: e.status === 'Approved' ? 'Completed' : e.status === 'Pending' ? 'Pending' : 'Recorded',
    warehouseId: e.warehouseId,
    warehouseName: e.warehouseName,
  }));

  const liveRevenueVouchers: VoucherRecord[] = revenueRecords.map((r) => ({
    id: `VCH-${r.id.replace('REV-', '').replace('ORD-', '')}`,
    type: 'Revenue',
    title: `Revenue Voucher · ${r.orderRef}`,
    amount: r.amount,
    referenceId: r.id,
    date: r.timestamp,
    status: r.status === 'Completed' ? 'Completed' : 'Pending',
    warehouseId: r.warehouseId,
    warehouseName: r.warehouseName,
    paymentMethod: r.paymentMethod,
  }));

  const allLiveVouchers = [...liveExpenseVouchers, ...liveRevenueVouchers];
  const vouchers = initialVouchers ?? allLiveVouchers;

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [openVoucher, setOpenVoucher] = useState<VoucherRecord | null>(null);

  const visibleTypes = VOUCHER_TYPES.filter((type) => canSeeVoucherType(can, type));
  if (visibleTypes.length === 0) {
    return (
      <FinanceNotAvailable
        title="Vouchers"
        message="Your role includes neither the expense log nor sales income."
        onBack={onBack}
      />
    );
  }
  const typeOptions: readonly TypeFilter[] = visibleTypes.length > 1 ? ['All', ...visibleTypes] : visibleTypes;
  const activeType: TypeFilter = typeOptions.includes(typeFilter) ? typeFilter : (typeOptions[0] ?? 'All');

  if (openVoucher) {
    return (
      <VoucherDetailScreen scope={scope} can={can} onBack={() => setOpenVoucher(null)} onTabChange={onTabChange} voucher={openVoucher} />
    );
  }

  if (showFilter) {
    return (
      <VoucherFilterView
        options={typeOptions}
        selected={activeType}
        selectedWarehouseId={selectedWarehouseId}
        warehouseOptions={warehouseOptions}
        isMain={isMain}
        hideWarehouseFilter={hideWarehouseFilter}
        onBack={() => setShowFilter(false)}
        onApply={(type, whId) => {
          setTypeFilter(type);
          setSelectedWarehouseId(whId);
          setShowFilter(false);
        }}
      />
    );
  }

  const query = searchQuery.trim().toLowerCase();
  const visible = vouchers.filter((vch) => {
    if (!canSeeVoucherType(can, vch.type)) return false;
    if (isMain) {
      if (selectedWarehouseId && selectedWarehouseId !== 'All') {
        if (vch.warehouseId !== selectedWarehouseId && vch.warehouseName !== selectedWarehouseId) {
          return false;
        }
      }
    } else {
      if (!inScope(scope, vch.warehouseId, selectedWarehouseId)) return false;
    }
    if (activeType !== 'All' && vch.type !== activeType) return false;
    return (
      !query ||
      vch.id.toLowerCase().includes(query) ||
      vch.referenceId.toLowerCase().includes(query) ||
      vch.title.toLowerCase().includes(query) ||
      vch.status.toLowerCase().includes(query)
    );
  });

  const scoped = vouchers.filter((v) => {
    if (!canSeeVoucherType(can, v.type)) return false;
    if (isMain) {
      if (selectedWarehouseId && selectedWarehouseId !== 'All') {
        return v.warehouseId === selectedWarehouseId || v.warehouseName === selectedWarehouseId;
      }
      return true;
    }
    return inScope(scope, v.warehouseId, selectedWarehouseId);
  });
  const pending = scoped.filter((v) => v.status === 'Pending').length;
  const completed = scoped.filter((v) => v.status === 'Completed').length;

  const openOne = (voucher: VoucherRecord) => {
    if (onSelectVoucher) onSelectVoucher(voucher);
    else setOpenVoucher(voucher);
  };

  return (
    <WalletScreen
      title="Vouchers"
      onBack={onBack}
      headerExtra={
        !isMain ? (
          <ScopeHeader
            scope={scope}
            label={scopeLabel(scope)}
            warehouseOptions={warehouseOptions}
            selectedWarehouseId={selectedWarehouseId}
            onSelectWarehouse={setSelectedWarehouseId}
          />
        ) : undefined
      }
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <KpiRow
          items={[
            { label: 'TOTAL', value: String(scoped.length) },
            { label: 'PENDING', value: String(pending), tone: 'warning' },
            { label: 'COMPLETED', value: String(completed), tone: 'success' },
          ]}
        />

        {/* Removed above search bar for Main Warehouse; kept only for Sub Warehouse */}
        {!isMain && (
          <View style={styles.filters}>
            <ChipGroup options={typeOptions} value={activeType} onChange={setTypeFilter} />
          </View>
        )}

        <View style={styles.searchRow}>
          <View style={styles.searchFlex}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Voucher ID, Expense ID, Revenue ID..."
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilter(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Filter vouchers"
          >
            <FilterIcon />
          </TouchableOpacity>
        </View>

        {isMain && (activeType !== 'All' || (selectedWarehouseId !== undefined && selectedWarehouseId !== 'All')) && (
          <View style={styles.activeFilterRow}>
            <Text style={styles.activeFilterText}>
              Filter:{' '}
              {selectedWarehouseId && selectedWarehouseId !== 'All'
                ? warehouseOptions.find((w) => w.warehouseId === selectedWarehouseId || w.warehouseName === selectedWarehouseId)?.warehouseName ?? selectedWarehouseId
                : 'All Warehouses'}
              {activeType !== 'All' ? ` · ${activeType}` : ''}
            </Text>
            <TouchableOpacity onPress={() => { setTypeFilter('All'); if (!hideWarehouseFilter) setSelectedWarehouseId(undefined); }}>
              <Text style={styles.clearFilterText}>Clear</Text>
            </TouchableOpacity>
          </View>
        )}

        {visible.length === 0 ? (
          <EmptyState title="No vouchers found" subtitle="Try a different search or voucher type." />
        ) : (
          <View style={styles.list}>
            {visible.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => openOne(item)}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.voucherId}>{item.id}</Text>
                  <StatusBadge
                    label={item.status}
                    tone={item.status === 'Completed' ? 'success' : item.status === 'Pending' ? 'warning' : 'brandSoft'}
                  />
                </View>
                <Text style={styles.title}>{item.title}</Text>
                <View style={styles.detailsRow}>
                  <Text style={styles.amount}>{rupees(item.amount)}</Text>
                  <Text style={styles.meta}>{item.referenceId}</Text>
                </View>
                <Text style={styles.meta}>
                  {item.date}
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

const SEARCH_HEIGHT = 46;

const styles = StyleSheet.create({
  filters: { marginBottom: adminSpacing.md },
  searchRow: { flexDirection: 'row', gap: adminSpacing.sm },
  searchFlex: { flex: 1 },
  filterButton: {
    width: SEARCH_HEIGHT,
    height: SEARCH_HEIGHT,
    borderRadius: adminRadius.md,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm, marginTop: adminSpacing.xs },
  filterChip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  filterChipActive: {
    borderColor: adminColors.brand,
    backgroundColor: adminColors.brandTint,
  },
  filterChipText: {
    ...adminType.body,
    color: adminColors.ink,
  },
  filterChipTextActive: {
    color: adminColors.brandDeep,
    fontWeight: '600',
  },
  activeFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: adminSpacing.sm,
    paddingVertical: adminSpacing.xs,
    backgroundColor: adminColors.brandTint,
    borderRadius: adminRadius.sm,
    marginTop: adminSpacing.sm,
    marginBottom: adminSpacing.xs,
  },
  activeFilterText: {
    ...adminType.caption,
    color: adminColors.brandDeep,
  },
  clearFilterText: {
    ...adminType.caption,
    color: adminColors.brand,
    fontWeight: '700',
  },
  list: { gap: adminSpacing.md, marginTop: adminSpacing.sm },
  card: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    gap: adminSpacing.xs,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  voucherId: { ...adminType.rowTitle, color: adminColors.brandDeep },
  title: { ...adminType.body, color: adminColors.ink },
  detailsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amount: { ...adminType.sectionHead, color: adminColors.ink },
  meta: { ...adminType.rowMeta, color: adminColors.muted },
});
