// Design id: M11-S04
/**
 * Expenses list (BR-62, BR-63): GET /admin/expenses, cursor-paged, gated on
 * finance.expense.log.
 *
 * Scope (BR-30): a Sub admin is pinned to its own warehouse; a Main admin may
 * narrow the list to one warehouse picked from the live GET /warehouses list
 * (uuids only), or see all. The server applies the real scope either way.
 *
 * Filters are only the ones the endpoint applies: category (uuid, from GET
 * /admin/expense-categories), payment method and status. There is no
 * "Pending" status (an expense is recorded, BR-62) and the list carries no
 * totals, so none are invented here.
 */
import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import type { ExpensePaymentMethod, ExpenseStatus } from '../../../api/finance';
import { formatPaise } from '../../../money/paise';
import { t } from '../../../i18n';
import { adminColors, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  ChipGroup,
  InfoNote,
  ScopeHeader,
  WalletButton,
  WalletFooter,
  WalletScreen,
} from '../wallet-cashtopup/WalletParts';
import { ExpenseRow } from './ExpenseRow';
import { FINANCE_CODES, FinanceNotAvailable, scopeLabel, useFinanceWarehousePicker } from './FinanceParts';
import { EXPENSE_PAYMENT_METHODS, expensePaymentMethodLabel, expenseStatusLabel } from './mappers';
import type { ExpenseRecord, WarehouseScreenBaseProps } from './types';
import { useExpenseCategories, useExpenseList } from './useFinanceData';

export interface WarehouseExpensesScreenProps extends WarehouseScreenBaseProps {
  onAddExpense?: (() => void) | undefined;
  onSelectExpense: (expenseId: string) => void;
}

/** '' stands for "no filter" in the chip rows. */
const ALL = '';
const STATUSES: readonly ExpenseStatus[] = ['RECORDED', 'APPROVED', 'REJECTED'];

export function WarehouseExpensesScreen(props: WarehouseExpensesScreenProps) {
  if (!props.can(FINANCE_CODES.expenseLog)) {
    return (
      <FinanceNotAvailable title={t('finance.expenses.title')} message={t('finance.notAvailable.message')} onBack={props.onBack} />
    );
  }
  return <ExpensesBody {...props} />;
}

function ExpensesBody({ scope, can, onBack, onAddExpense, onSelectExpense }: WarehouseExpensesScreenProps) {
  const picker = useFinanceWarehousePicker(scope, can);
  const categories = useExpenseCategories();
  const [categoryId, setCategoryId] = useState<string>(ALL);
  const [paymentMethod, setPaymentMethod] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);

  const list = useExpenseList(picker.warehouseId, {
    categoryId: categoryId === ALL ? undefined : categoryId,
    paymentMethod: EXPENSE_PAYMENT_METHODS.find((m) => m === paymentMethod),
    status: STATUSES.find((s) => s === status),
  });
  const view = queryViewState({ isLoading: list.isLoading, error: list.error, itemCount: list.items.length });

  const header = picker.isMain ? (
    <ScopeHeader
      scope={scope}
      warehouseOptions={picker.options}
      selectedWarehouseId={picker.selectedId}
      onSelectWarehouse={picker.setSelectedId}
    />
  ) : (
    <ScopeHeader scope={scope} label={scopeLabel(scope)} />
  );

  const filters = (
    <View style={styles.filters}>
      {picker.isMain && picker.error != null ? <InfoNote tone="warning">{t('finance.picker.loadError')}</InfoNote> : null}
      {categories.error != null ? (
        <InfoNote tone="warning">{t('finance.expenses.categoriesError')}</InfoNote>
      ) : categories.categories.length > 0 ? (
        <>
          <Text style={styles.filterLabel}>{t('finance.expenses.filter.category')}</Text>
          <ChipGroup<string>
            options={[ALL, ...categories.categories.map((c) => c.id)]}
            value={categoryId}
            onChange={setCategoryId}
            labelOf={(id) =>
              id === ALL ? t('finance.expenses.filter.all') : (categories.categories.find((c) => c.id === id)?.name ?? id)
            }
          />
        </>
      ) : null}
      <Text style={styles.filterLabel}>{t('finance.expenses.filter.paymentMethod')}</Text>
      <ChipGroup<string>
        options={[ALL, ...EXPENSE_PAYMENT_METHODS]}
        value={paymentMethod}
        onChange={setPaymentMethod}
        labelOf={(m) => {
          const method = EXPENSE_PAYMENT_METHODS.find((x) => x === m);
          return method === undefined ? t('finance.expenses.filter.all') : expensePaymentMethodLabel(method as ExpensePaymentMethod);
        }}
      />
      <Text style={styles.filterLabel}>{t('finance.expenses.filter.status')}</Text>
      <ChipGroup<string>
        options={[ALL, ...STATUSES]}
        value={status}
        onChange={setStatus}
        labelOf={(s) => {
          const known = STATUSES.find((x) => x === s);
          return known === undefined ? t('finance.expenses.filter.all') : expenseStatusLabel(known);
        }}
      />
    </View>
  );

  return (
    <WalletScreen
      title={t('finance.expenses.title')}
      onBack={onBack}
      headerExtra={header}
      footer={
        onAddExpense ? (
          <WalletFooter>
            <WalletButton label={t('finance.expenses.add')} onPress={onAddExpense} />
          </WalletFooter>
        ) : undefined
      }
    >
      <FlatList
        data={view === 'ready' ? list.items : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={filters}
        ListEmptyComponent={
          view === 'loading' ? (
            <AdminLoadingState />
          ) : view === 'error' ? (
            <AdminErrorState error={list.error} onRetry={list.refresh} />
          ) : (
            <AdminEmptyState title={t('finance.expenses.empty.title')} subtitle={t('finance.expenses.empty.subtitle')} />
          )
        }
        renderItem={({ item }) => (
          <ExpenseRow
            expense={item}
            subtitle={subtitleOf(item)}
            onPress={() => onSelectExpense(item.id)}
            accessibilityLabel={t('finance.expenses.row.a11y', {
              category: item.categoryName,
              amount: formatPaise(item.amountPaise),
            })}
          />
        )}
        onEndReached={() => {
          if (list.hasMore) list.loadMore();
        }}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={list.isRefreshing} onRefresh={list.refresh} tintColor={adminColors.brand} />}
      />
    </WalletScreen>
  );
}

function subtitleOf(expense: ExpenseRecord): string {
  return expense.vendor ?? expense.description ?? t('finance.expenses.row.noVendor');
}

const styles = StyleSheet.create({
  list: { padding: adminSpacing.lg, gap: adminSpacing.sm, flexGrow: 1 },
  filters: { gap: adminSpacing.xs, marginBottom: adminSpacing.sm },
  filterLabel: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
});
