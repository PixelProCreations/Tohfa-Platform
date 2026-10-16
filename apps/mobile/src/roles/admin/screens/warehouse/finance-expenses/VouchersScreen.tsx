// Design id: M11-S07
/**
 * Vouchers (BR-75). The API has no voucher list: a voucher is derived by the
 * server from one expense and read with GET /admin/expenses/{id}/voucher. So
 * this list is the expense list (GET /admin/expenses), one voucher per
 * recorded expense; opening a row fetches that expense's voucher, whose
 * number only the server issues. Revenue vouchers do not exist.
 *
 * Gated on finance.expense.log (the voucher endpoint's code). Scope as in the
 * expense list (BR-30): Sub pinned, Main may pick a warehouse from the live
 * list or see all.
 */
import React from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { adminColors, adminSpacing } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { InfoNote, ScopeHeader, WalletScreen } from '../wallet-cashtopup/WalletParts';
import { ExpenseRow } from './ExpenseRow';
import { FINANCE_CODES, FinanceNotAvailable, scopeLabel, useFinanceWarehousePicker } from './FinanceParts';
import type { WarehouseScreenBaseProps } from './types';
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

function VouchersBody({ scope, can, onBack, onSelectVoucher }: VouchersScreenProps) {
  const picker = useFinanceWarehousePicker(scope, can);
  const list = useExpenseList(picker.warehouseId);
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

  return (
    <WalletScreen title={t('finance.vouchers.title')} onBack={onBack} headerExtra={header}>
      <FlatList
        data={view === 'ready' ? list.items : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<InfoNote tone="info">{t('finance.vouchers.note')}</InfoNote>}
        ListEmptyComponent={
          view === 'loading' ? (
            <AdminLoadingState />
          ) : view === 'error' ? (
            <AdminErrorState error={list.error} onRetry={list.refresh} />
          ) : (
            <AdminEmptyState title={t('finance.vouchers.empty.title')} subtitle={t('finance.vouchers.empty.subtitle')} />
          )
        }
        renderItem={({ item }) => (
          <ExpenseRow
            expense={item}
            subtitle={item.vendor ?? t('finance.vouchers.row.open')}
            onPress={() => onSelectVoucher(item.id)}
            accessibilityLabel={t('finance.vouchers.row.a11y', { category: item.categoryName, amount: formatPaise(item.amountPaise) })}
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

const styles = StyleSheet.create({
  list: { padding: adminSpacing.lg, gap: adminSpacing.sm, flexGrow: 1 },
});
