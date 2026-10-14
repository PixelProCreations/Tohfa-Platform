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
import { FINANCE_WAREHOUSES, SAMPLE_VOUCHERS } from './fixtures';
import { canSeeVoucherType, FilterIcon, FinanceNotAvailable, rupees, scopeLabel } from './FinanceParts';
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
}

/** Voucher Type chooser (was MainWarehouseVouchersFilterScreen). */
function VoucherTypeFilterView({
  options,
  selected,
  onBack,
  onApply,
}: {
  options: readonly TypeFilter[];
  selected: TypeFilter;
  onBack: () => void;
  onApply: (type: TypeFilter) => void;
}) {
  const [draft, setDraft] = useState<TypeFilter>(selected);
  return (
    <WalletScreen
      title="Vouchers"
      onBack={onBack}
      footer={
        <WalletFooter>
          <WalletButton label="Apply" onPress={() => onApply(draft)} />
        </WalletFooter>
      }
    >
      <View style={walletLayout.scrollContent}>
        <SectionTitle>Voucher Type</SectionTitle>
        <ChipGroup options={options} value={draft} onChange={setDraft} />
      </View>
    </WalletScreen>
  );
}

export function VouchersScreen({
  scope,
  can,
  onBack,
  onTabChange,
  vouchers = SAMPLE_VOUCHERS,
  warehouseOptions = FINANCE_WAREHOUSES,
  onSelectVoucher,
}: VouchersScreenProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
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
      <VoucherTypeFilterView
        options={typeOptions}
        selected={activeType}
        onBack={() => setShowFilter(false)}
        onApply={(type) => {
          setTypeFilter(type);
          setShowFilter(false);
        }}
      />
    );
  }

  const query = searchQuery.trim().toLowerCase();
  const visible = vouchers.filter((vch) => {
    if (!canSeeVoucherType(can, vch.type)) return false;
    if (!inScope(scope, vch.warehouseId, selectedWarehouseId)) return false;
    if (activeType !== 'All' && vch.type !== activeType) return false;
    return (
      !query ||
      vch.id.toLowerCase().includes(query) ||
      vch.referenceId.toLowerCase().includes(query) ||
      vch.title.toLowerCase().includes(query) ||
      vch.status.toLowerCase().includes(query)
    );
  });

  const scoped = vouchers.filter((v) => canSeeVoucherType(can, v.type) && inScope(scope, v.warehouseId, selectedWarehouseId));
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
        <ScopeHeader
          scope={scope}
          label={isAllWarehouses(scope) ? undefined : scopeLabel(scope)}
          warehouseOptions={warehouseOptions}
          selectedWarehouseId={selectedWarehouseId}
          onSelectWarehouse={setSelectedWarehouseId}
        />
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

        <View style={styles.filters}>
          <ChipGroup options={typeOptions} value={activeType} onChange={setTypeFilter} />
        </View>

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
  voucherId: { ...adminType.rowTitle, color: adminColors.brandDeep },
  title: { ...adminType.body, color: adminColors.ink },
  detailsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amount: { ...adminType.sectionHead, color: adminColors.ink },
  meta: { ...adminType.rowMeta, color: adminColors.muted },
});
