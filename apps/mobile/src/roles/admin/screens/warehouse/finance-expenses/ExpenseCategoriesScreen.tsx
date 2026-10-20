// Design id: M11-S06
/**
 * Expense categories, read-only: GET /admin/expense-categories (active ones),
 * gated on finance.expense.log. There is no category write endpoint (BR-62),
 * so there is no add or edit here.
 */
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { InfoNote, WalletScreen } from '../wallet-cashtopup/WalletParts';
import { FINANCE_CODES, FinanceNotAvailable } from './FinanceParts';
import type { WarehouseScreenBaseProps } from './types';
import { useExpenseCategories } from './useFinanceData';

export type ExpenseCategoriesScreenProps = WarehouseScreenBaseProps;

export function ExpenseCategoriesScreen(props: ExpenseCategoriesScreenProps) {
  if (!props.can(FINANCE_CODES.expenseLog)) {
    return (
      <FinanceNotAvailable title={t('finance.categories.title')} message={t('finance.notAvailable.message')} onBack={props.onBack} />
    );
  }
  return <CategoriesBody onBack={props.onBack} />;
}

function CategoriesBody({ onBack }: { onBack: () => void }) {
  const { categories, isLoading, error, refresh, isRefreshing } = useExpenseCategories();
  const view = queryViewState({ isLoading, error, itemCount: categories.length });
  return (
    <WalletScreen title={t('finance.categories.title')} onBack={onBack}>
      <FlatList
        data={view === 'ready' ? categories : []}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<InfoNote tone="info">{t('finance.categories.readOnlyNote')}</InfoNote>}
        ListEmptyComponent={
          view === 'loading' ? (
            <AdminLoadingState />
          ) : view === 'error' ? (
            <AdminErrorState error={error} onRetry={refresh} />
          ) : (
            <AdminEmptyState title={t('finance.categories.empty.title')} subtitle={t('finance.categories.empty.subtitle')} />
          )
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.name}>{item.name}</Text>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={adminColors.brand} />}
      />
    </WalletScreen>
  );
}

const styles = StyleSheet.create({
  list: { padding: adminSpacing.lg, gap: adminSpacing.sm, flexGrow: 1 },
  row: {
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: adminSpacing.md,
  },
  name: { ...adminType.rowTitle, color: adminColors.ink },
});
