/**
 * Finance History: revenue and expenses in one newest-first list.
 *
 * Composed only from real rows: GET /admin/finance/revenue (when the viewer
 * holds finance.sales_income.view) and GET /admin/expenses (when it holds
 * finance.expense.log), merged by mergeFinanceHistory (mappers.ts). A list the
 * viewer may not read is never requested (it would be a 403). There is no
 * combined ledger endpoint, so each list pages on its own and "load more"
 * asks both for their next page.
 *
 * The server scopes both lists (BR-63): Sub sees its own warehouse, Main all.
 */
import React, { useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t, type TranslationKey } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { ChipGroup, InfoNote, ScopeHeader, WalletScreen, WarehouseTabBar } from '../wallet-cashtopup/WalletParts';
import { FINANCE_CODES, FinanceNotAvailable, scopeLabel } from './FinanceParts';
import { financeWarehouseFilter, formatSignedPaise, mergeFinanceHistory, type FinanceHistoryRow } from './mappers';
import type { WarehouseScreenBaseProps } from './types';
import { useExpenseList, useRevenueList } from './useFinanceData';

export interface FinanceHistoryScreenProps extends WarehouseScreenBaseProps {
  onSelectItem: (row: FinanceHistoryRow) => void;
}

type HistoryFilter = 'all' | 'revenue' | 'expense';

const FILTER_LABEL: Readonly<Record<HistoryFilter, TranslationKey>> = {
  all: 'finance.history.filter.all',
  revenue: 'finance.history.filter.revenue',
  expense: 'finance.history.filter.expenses',
};

export function FinanceHistoryScreen(props: FinanceHistoryScreenProps) {
  const canRevenue = props.can(FINANCE_CODES.salesIncome);
  const canExpenses = props.can(FINANCE_CODES.expenseLog);
  if (!canRevenue && !canExpenses) {
    return (
      <FinanceNotAvailable title={t('finance.history.title')} message={t('finance.history.notAvailable')} onBack={props.onBack} />
    );
  }
  return <HistoryBody {...props} canRevenue={canRevenue} canExpenses={canExpenses} />;
}

function HistoryBody({
  scope,
  onBack,
  onTabChange,
  onSelectItem,
  canRevenue,
  canExpenses,
}: FinanceHistoryScreenProps & { canRevenue: boolean; canExpenses: boolean }) {
  const revenue = useRevenueList(scope.warehouseId, {}, canRevenue);
  const expenses = useExpenseList(financeWarehouseFilter(scope), {}, canExpenses);
  const [filter, setFilter] = useState<HistoryFilter>('all');

  const rows = useMemo(() => {
    const merged = mergeFinanceHistory(canRevenue ? revenue.items : [], canExpenses ? expenses.items : []);
    return filter === 'all' ? merged : merged.filter((row) => row.kind === filter);
  }, [revenue.items, expenses.items, canRevenue, canExpenses, filter]);

  const lists = [...(canRevenue ? [revenue] : []), ...(canExpenses ? [expenses] : [])];
  const isLoading = lists.some((l) => l.isLoading);
  const firstError = lists.find((l) => l.error != null)?.error;
  const hasMore = lists.some((l) => l.hasMore);
  const isRefreshing = lists.some((l) => l.isRefreshing);
  const refresh = () => lists.forEach((l) => l.refresh());
  const loadMore = () => lists.forEach((l) => l.hasMore && l.loadMore());

  const view = queryViewState({ isLoading, error: firstError, itemCount: rows.length });
  const filters: HistoryFilter[] = ['all', ...(canRevenue ? (['revenue'] as const) : []), ...(canExpenses ? (['expense'] as const) : [])];

  return (
    <WalletScreen
      title={t('finance.history.title')}
      onBack={onBack}
      headerExtra={<ScopeHeader scope={scope} label={scopeLabel(scope)} />}
      footer={<WarehouseTabBar onTabChange={onTabChange} onBack={onBack} />}
    >
      <FlatList
        data={view === 'ready' ? rows : []}
        keyExtractor={(row) => `${row.kind}:${row.id}`}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            {filters.length > 2 ? (
              <ChipGroup options={filters} value={filter} onChange={setFilter} labelOf={(f) => t(FILTER_LABEL[f])} />
            ) : null}
            {view === 'ready' && firstError != null ? (
              <InfoNote tone="warning">{t('finance.history.partialError')}</InfoNote>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          view === 'loading' ? (
            <AdminLoadingState />
          ) : view === 'error' ? (
            <AdminErrorState error={firstError} onRetry={refresh} />
          ) : (
            <AdminEmptyState title={t('finance.history.empty.title')} subtitle={t('finance.history.empty.subtitle')} />
          )
        }
        ListFooterComponent={
          view === 'ready' && hasMore && isLoading ? <Text style={styles.footer}>{t('finance.history.loadingMore')}</Text> : null
        }
        renderItem={({ item }) => <HistoryRow row={item} onPress={() => onSelectItem(item)} />}
        onEndReached={() => {
          if (hasMore) loadMore();
        }}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={adminColors.brand} />}
      />
    </WalletScreen>
  );
}

function HistoryRow({ row, onPress }: { row: FinanceHistoryRow; onPress: () => void }) {
  const kind = row.kind === 'revenue' ? t('finance.history.kind.revenue') : t('finance.history.kind.expense');
  const amount = formatSignedPaise(row.signedPaise);
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={t('finance.history.rowA11y', { kind, title: row.title, amount, date: row.dateLabel })}
    >
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{row.title}</Text>
        <Text style={styles.rowMeta}>
          {kind} · {row.dateLabel}
        </Text>
      </View>
      <Text style={[styles.amount, row.signedPaise < 0 ? styles.amountOut : styles.amountIn]}>{amount}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  list: { padding: adminSpacing.lg, gap: adminSpacing.sm, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
    gap: adminSpacing.md,
  },
  rowText: { flex: 1 },
  rowTitle: { ...adminType.rowTitle, color: adminColors.ink },
  rowMeta: { ...adminType.rowMeta, color: adminColors.muted, marginTop: adminSpacing.xs },
  amount: { ...adminType.rowTitle },
  amountIn: { color: adminColors.success.text },
  amountOut: { color: adminColors.danger.text },
  footer: { ...adminType.rowMeta, color: adminColors.muted, textAlign: 'center', paddingVertical: adminSpacing.md },
});
