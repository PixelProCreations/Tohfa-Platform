// Design id: M11-S07
/**
 * Vouchers (BR-75). The API has no voucher list: a voucher is derived by the
 * server from one expense and read with GET /admin/expenses/{id}/voucher. So
 * this list is the expense list (GET /admin/expenses), one voucher per
 * recorded expense; opening a row fetches that expense's voucher, whose
 * number only the server issues. Revenue vouchers do not exist, so the
 * Revenue chip lists none.
 *
 * Every designed element is drawn (KPI row, type chips, search, the filter
 * view). A figure or field the API cannot supply is the dash: the voucher
 * number on a card, its reference and the PENDING / COMPLETED counts (an
 * expense status is not a voucher status, and counting a partly loaded list
 * would show a partial TOTAL, so TOTAL is the dash until every page is in).
 *
 * Gated on finance.expense.log (the voucher endpoint's code). Scope as in the
 * expense list (BR-30): Sub pinned, Main may pick a warehouse from the live
 * list or see all.
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  ChipGroup,
  EmptyState,
  InfoNote,
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
import { EXPENSE_STATUS_TONE } from './ExpenseRow';
import { FilterIcon, FINANCE_CODES, FinanceNotAvailable, scopeLabel, useFinanceWarehousePicker } from './FinanceParts';
import type { PermissionCheck, WarehouseScope, WarehouseScreenBaseProps } from './types';
import { useExpenseList } from './useFinanceData';

export interface VouchersScreenProps extends WarehouseScreenBaseProps {
  /** Open the voucher of this expense. */
  onSelectVoucher: (expenseId: string) => void;
}

export function VouchersScreen(props: VouchersScreenProps) {
  if (!props.can(FINANCE_CODES.expenseLog)) {
    return (
      <FinanceNotAvailable title={t('finance.vouchers.title')} message={t('finance.notAvailable.message')} onBack={props.onBack} />
    );
  }
  return <VouchersBody {...props} />;
}

type VoucherType = 'Expense' | 'Revenue';
type TypeFilter = 'All' | VoucherType;

/** Expense vouchers need finance.expense.log, revenue vouchers finance.sales_income.view. */
function canSeeVoucherType(can: PermissionCheck, type: VoucherType): boolean {
  return can(type === 'Expense' ? FINANCE_CODES.expenseLog : FINANCE_CODES.salesIncome);
}

const TYPE_LABEL_KEY = {
  All: 'finance.vouchers.type.all',
  Expense: 'finance.vouchers.type.expense',
  Revenue: 'finance.vouchers.type.revenue',
} as const;

/** Voucher Type and Warehouse chooser (the filter icon's view). */
function VoucherFilterView({
  options,
  selected,
  selectedWarehouseId,
  warehouseOptions,
  isMain,
  onBack,
  onApply,
}: {
  options: readonly TypeFilter[];
  selected: TypeFilter;
  selectedWarehouseId: string | undefined;
  warehouseOptions: readonly WarehouseScope[];
  isMain: boolean;
  onBack: () => void;
  onApply: (type: TypeFilter, warehouseId: string | undefined) => void;
}) {
  const [draftType, setDraftType] = useState<TypeFilter>(selected);
  const [draftWarehouse, setDraftWarehouse] = useState<string | undefined>(selectedWarehouseId);
  return (
    <WalletScreen
      title={t('finance.vouchers.filter.title')}
      onBack={onBack}
      footer={
        <WalletFooter>
          <WalletButton label={t('finance.vouchers.filter.apply')} onPress={() => onApply(draftType, draftWarehouse)} />
        </WalletFooter>
      }
    >
      <View style={walletLayout.scrollContent}>
        {isMain ? (
          <View style={styles.filterSection}>
            <SectionTitle>{t('finance.vouchers.filter.warehouses')}</SectionTitle>
            <View style={styles.chipGrid}>
              <TouchableOpacity
                style={[styles.filterChip, draftWarehouse === undefined && styles.filterChipActive]}
                onPress={() => setDraftWarehouse(undefined)}
                activeOpacity={0.75}
              >
                <Text style={[styles.filterChipText, draftWarehouse === undefined && styles.filterChipTextActive]}>
                  {t('finance.vouchers.filter.allWarehouses')}
                </Text>
              </TouchableOpacity>
              {warehouseOptions.map((w) => {
                const id = w.warehouseId ?? '';
                const name = (w.warehouseName ?? id).replace(/ Warehouse$/, '');
                const isSelected = draftWarehouse === id;
                return (
                  <TouchableOpacity
                    key={id || name}
                    style={[styles.filterChip, isSelected && styles.filterChipActive]}
                    onPress={() => setDraftWarehouse(id)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>{name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}
        <View>
          <SectionTitle>{t('finance.vouchers.filter.type')}</SectionTitle>
          <ChipGroup options={options} value={draftType} onChange={setDraftType} labelOf={(o) => t(TYPE_LABEL_KEY[o])} />
        </View>
      </View>
    </WalletScreen>
  );
}

function VouchersBody({ scope, can, onBack, onSelectVoucher }: VouchersScreenProps) {
  const picker = useFinanceWarehousePicker(scope, can);
  const list = useExpenseList(picker.warehouseId);
  const view = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.items.length });
  const dash = t('finance.noValue');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  const visibleTypes = (['Expense', 'Revenue'] as const).filter((type) => canSeeVoucherType(can, type));
  const typeOptions: readonly TypeFilter[] = visibleTypes.length > 1 ? ['All', ...visibleTypes] : visibleTypes;
  const activeType: TypeFilter = typeOptions.includes(typeFilter) ? typeFilter : (typeOptions[0] ?? 'All');

  if (showFilter) {
    return (
      <VoucherFilterView
        options={typeOptions}
        selected={activeType}
        selectedWarehouseId={picker.selectedId}
        warehouseOptions={picker.options}
        isMain={picker.isMain}
        onBack={() => setShowFilter(false)}
        onApply={(type, warehouseId) => {
          setTypeFilter(type);
          picker.setSelectedId(warehouseId);
          setShowFilter(false);
        }}
      />
    );
  }

  const query = searchQuery.trim().toLowerCase();
  // Every voucher here is an expense's; there are no revenue vouchers (BR-75).
  const rows = activeType === 'Revenue' ? [] : view === 'ready' ? list.items : [];
  const visible = rows.filter(
    (item) =>
      query === '' ||
      item.categoryName.toLowerCase().includes(query) ||
      item.statusLabel.toLowerCase().includes(query) ||
      (item.vendor ?? '').toLowerCase().includes(query),
  );
  const selectedWarehouseName = picker.options.find((w) => w.warehouseId === picker.selectedId)?.warehouseName;
  const totalLabel = view === 'ready' && !list.hasMore ? String(list.items.length) : dash;

  return (
    <WalletScreen
      title={t('finance.vouchers.title')}
      onBack={onBack}
      headerExtra={!picker.isMain ? <ScopeHeader scope={scope} label={scopeLabel(scope)} /> : undefined}
    >
      <ScrollView contentContainerStyle={walletLayout.scrollContent} showsVerticalScrollIndicator={false}>
        <KpiRow
          items={[
            { label: t('finance.vouchers.kpi.total'), value: totalLabel },
            { label: t('finance.vouchers.kpi.pending'), value: dash, tone: 'warning' },
            { label: t('finance.vouchers.kpi.completed'), value: dash, tone: 'success' },
          ]}
        />
        {!picker.isMain ? (
          <View style={styles.filters}>
            <ChipGroup options={typeOptions} value={activeType} onChange={setTypeFilter} labelOf={(o) => t(TYPE_LABEL_KEY[o])} />
          </View>
        ) : null}
        <View style={styles.searchRow}>
          <View style={styles.searchFlex}>
            <SearchBar value={searchQuery} onChangeText={setSearchQuery} placeholder={t('finance.vouchers.searchPlaceholder')} />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilter(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('finance.vouchers.filter.a11y')}
          >
            <FilterIcon />
          </TouchableOpacity>
        </View>
        {picker.isMain && (activeType !== 'All' || picker.selectedId !== undefined) ? (
          <View style={styles.activeFilterRow}>
            <Text style={styles.activeFilterText}>
              {t('finance.vouchers.filter.active', {
                warehouse: picker.selectedId !== undefined ? (selectedWarehouseName ?? dash) : t('finance.vouchers.filter.allWarehouses'),
              })}
              {activeType !== 'All' ? ` · ${t(TYPE_LABEL_KEY[activeType])}` : ''}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setTypeFilter('All');
                picker.setSelectedId(undefined);
              }}
            >
              <Text style={styles.clearFilterText}>{t('finance.vouchers.filter.clear')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <InfoNote tone="info">{t('finance.vouchers.note')}</InfoNote>
        {view === 'loading' ? (
          <AdminLoadingState />
        ) : view === 'error' ? (
          <AdminErrorState error={list.error} onRetry={list.refresh} />
        ) : visible.length === 0 ? (
          <EmptyState title={t('finance.vouchers.empty.title')} subtitle={t('finance.vouchers.empty.subtitle')} />
        ) : (
          <View style={styles.list}>
            {visible.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => onSelectVoucher(item.id)}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={t('finance.vouchers.row.a11y', { category: item.categoryName, amount: formatPaise(item.amountPaise) })}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.voucherId}>{dash}</Text>
                  <StatusBadge label={item.statusLabel} tone={EXPENSE_STATUS_TONE[item.status] ?? 'info'} />
                </View>
                <Text style={styles.title}>{item.categoryName}</Text>
                <View style={styles.detailsRow}>
                  <Text style={styles.amount}>{formatPaise(item.amountPaise)}</Text>
                  <Text style={styles.meta}>{item.vendor ?? dash}</Text>
                </View>
                <Text style={styles.meta}>{item.dateLabel}</Text>
              </TouchableOpacity>
            ))}
            {list.hasMore ? <WalletButton label={t('finance.vouchers.loadMore')} onPress={list.loadMore} /> : null}
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
  filterSection: { marginBottom: adminSpacing.lg },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: adminSpacing.sm, marginTop: adminSpacing.xs },
  filterChip: {
    paddingHorizontal: adminSpacing.md,
    paddingVertical: adminSpacing.sm,
    borderRadius: adminRadius.full,
    borderWidth: 1,
    borderColor: adminColors.border,
    backgroundColor: adminColors.card,
  },
  filterChipActive: { borderColor: adminColors.brand, backgroundColor: adminColors.brandTint },
  filterChipText: { ...adminType.body, color: adminColors.ink },
  filterChipTextActive: { color: adminColors.brandDeep, fontWeight: '600' },
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
  activeFilterText: { ...adminType.caption, color: adminColors.brandDeep },
  clearFilterText: { ...adminType.caption, color: adminColors.brand, fontWeight: '700' },
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
