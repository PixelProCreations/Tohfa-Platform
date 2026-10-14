/**
 * Purchase History: one customer's purchased lines
 * (GET /admin/customers/{id}/purchases, newest first).
 *
 * Gates (FINAL_LIST row 18): read-only (customer.purchase_history.view). For
 * an `own` actor the server returns only lines of orders at its warehouse
 * (BR-91g). Tapping a line opens its order (the host's order detail) by the
 * order uuid.
 *
 * The API is line level, and so is this list: one card per purchased line
 * (product and grade, quantity × unit price, line total, order number,
 * channel). No invoice-level row is built from the lines. The search box
 * narrows the lines already loaded by product or order number. "Load more"
 * pages on.
 *
 * Hidden, because the API cannot do them: the filter screen (status, grade,
 * crop, date range, sort), the KPI tiles (the API has no purchase summary; a
 * sum of the loaded pages would be partial) and the paid / pending badge (a
 * line carries no payment status).
 */
// Design id: M7-S04
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminSpacing } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { cardStyles, CustomersScreen, LinkButton, SearchField } from './CustomersParts';
import type { CustomerRef, CustomersLiveStateProps, PurchaseLineRow, WarehouseScreenBaseProps } from './types';

export interface PurchaseHistoryScreenProps extends WarehouseScreenBaseProps, CustomersLiveStateProps {
  customer?: CustomerRef | undefined;
  onSelectPurchase?: ((purchase: PurchaseLineRow) => void) | undefined;
  /** The loaded lines, page by page. */
  purchases?: readonly PurchaseLineRow[] | undefined;
  /** The route carried no customer uuid: nothing can be looked up. */
  notFound?: boolean | undefined;
}

export function PurchaseHistoryScreen({
  onBack,
  customer,
  onSelectPurchase,
  purchases = [],
  notFound = false,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onLoadMore,
  hasMore = false,
}: PurchaseHistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const view = notFound ? 'notFound' : queryViewState({ isLoading, error, itemCount: purchases.length });
  const query = searchQuery.trim().toLowerCase();
  const rows =
    query === ''
      ? purchases
      : purchases.filter((p) => p.productName.toLowerCase().includes(query) || p.orderNumber.toLowerCase().includes(query));

  return (
    <CustomersScreen title="Purchase History" subtitle={customer?.name} onBack={onBack} onRefresh={notFound ? undefined : onRefresh} isRefreshing={isRefreshing}>
      <SearchField value={searchQuery} onChangeText={setSearchQuery} placeholder={t('customers.purchases.searchPlaceholder')} />

      {view === 'loading' ? (
        <AdminLoadingState />
      ) : view === 'error' ? (
        <AdminErrorState error={error} onRetry={onRetry} />
      ) : view === 'notFound' ? (
        <AdminEmptyState title={t('customers.empty.notFound')} />
      ) : rows.length === 0 ? (
        <AdminEmptyState title={t(purchases.length === 0 ? 'customers.empty.purchases' : 'customers.empty.filtered')} />
      ) : (
        rows.map((purchase, index) => (
          <TouchableOpacity
            key={`${index}:${purchase.key}`}
            style={cardStyles.card}
            activeOpacity={0.8}
            onPress={() => onSelectPurchase?.(purchase)}
            disabled={onSelectPurchase === undefined}
            accessibilityRole="button"
          >
            <View style={cardStyles.rowBetween}>
              <Text style={cardStyles.code}>{purchase.orderNumber}</Text>
              <Text style={cardStyles.meta}>{purchase.channelLabel}</Text>
            </View>
            <Text style={cardStyles.meta}>{purchase.purchasedLabel}</Text>
            <View style={styles.bottomRow}>
              <View style={styles.lineText}>
                <Text style={cardStyles.body} numberOfLines={2}>
                  {purchase.lineLabel}
                </Text>
                <Text style={cardStyles.meta}>{purchase.qtyDetail}</Text>
              </View>
              <Text style={cardStyles.amount}>{purchase.amountLabel}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
      {view === 'ready' && hasMore && onLoadMore ? <LinkButton label={t('customers.loadMore')} onPress={onLoadMore} /> : null}
    </CustomersScreen>
  );
}

const styles = StyleSheet.create({
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: adminSpacing.sm,
  },
  lineText: {
    flex: 1,
    paddingRight: adminSpacing.md,
  },
});
