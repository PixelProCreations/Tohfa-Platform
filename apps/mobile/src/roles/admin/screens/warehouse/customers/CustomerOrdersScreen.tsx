/**
 * Customer Orders: one customer's orders with status tabs and search
 * (GET /admin/customers/{id}/orders, every channel, newest first).
 *
 * Scope (FINAL_LIST row 13): read-only (customer.purchase_history.view, SUB
 * grant `own`). For an `own` actor the server returns only orders at its
 * warehouse (BR-91g); nothing is filtered by warehouse here. Every row opens
 * the order (the host's order detail) by the order uuid.
 *
 * The tabs (All / Active / Completed / Cancelled) and the search box narrow
 * the rows already loaded, by status bucket and by order or invoice number:
 * the API has no status filter or search for this list. "Load more" pages on.
 *
 * Hidden, because the API cannot do them: the filter screen (order type,
 * payment status, date range) and the Main warehouse selector; the
 * pickup/delivery type, which this list does not carry (the channel is shown).
 */
// Design id: M7-S06
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { t } from '../../../i18n';
import { adminColors, adminRadius, adminSpacing, adminType } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import { cardStyles, ChipRow, CustomersScreen, LinkButton, SearchField, StatusBadge } from './CustomersParts';
import type {
  CustomerOrderCategory,
  CustomerOrderRow,
  CustomerRef,
  CustomersLiveStateProps,
  WarehouseScreenBaseProps,
} from './types';

export interface CustomerOrdersScreenProps extends WarehouseScreenBaseProps, CustomersLiveStateProps {
  customer?: CustomerRef | undefined;
  /** Open on a status bucket tab ('Active', 'Completed' or 'Cancelled'); anything else opens All. */
  defaultFilter?: string | undefined;
  onOpenOrder?: ((order: CustomerOrderRow) => void) | undefined;
  /** The loaded rows, page by page. */
  orders?: readonly CustomerOrderRow[] | undefined;
  /** The route carried no customer uuid: nothing can be looked up. */
  notFound?: boolean | undefined;
}

type OrderTab = 'All' | CustomerOrderCategory;
const ORDER_TABS: readonly OrderTab[] = ['All', 'Active', 'Completed', 'Cancelled'];

function initialTab(defaultFilter: string | undefined): OrderTab {
  return ORDER_TABS.find((tab) => tab === defaultFilter) ?? 'All';
}

export function CustomerOrdersScreen({
  onBack,
  customer,
  defaultFilter,
  onOpenOrder,
  orders = [],
  notFound = false,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onLoadMore,
  hasMore = false,
}: CustomerOrdersScreenProps) {
  const [selectedTab, setSelectedTab] = useState<OrderTab>(() => initialTab(defaultFilter));
  const [searchQuery, setSearchQuery] = useState('');
  const view = notFound ? 'notFound' : queryViewState({ isLoading, error, itemCount: orders.length });

  const rows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      if (selectedTab !== 'All' && order.category !== selectedTab) return false;
      if (!query) return true;
      return order.orderNumber.toLowerCase().includes(query) || (order.invoiceNumber ?? '').toLowerCase().includes(query);
    });
  }, [orders, selectedTab, searchQuery]);

  return (
    <CustomersScreen title="Customer Orders" subtitle={customer?.name} onBack={onBack} onRefresh={notFound ? undefined : onRefresh} isRefreshing={isRefreshing}>
      <ChipRow options={ORDER_TABS} selected={selectedTab} onSelect={setSelectedTab} />
      <SearchField value={searchQuery} onChangeText={setSearchQuery} placeholder={t('customers.orders.searchPlaceholder')} />

      {view === 'loading' ? (
        <AdminLoadingState />
      ) : view === 'error' ? (
        <AdminErrorState error={error} onRetry={onRetry} />
      ) : view === 'notFound' ? (
        <AdminEmptyState title={t('customers.empty.notFound')} />
      ) : rows.length === 0 ? (
        <AdminEmptyState title={t(orders.length === 0 ? 'customers.empty.orders' : 'customers.empty.filtered')} />
      ) : (
        rows.map((order) => (
          <View key={order.id} style={cardStyles.card}>
            <View style={cardStyles.rowBetween}>
              <Text style={cardStyles.code}>{order.orderNumber}</Text>
              <StatusBadge label={order.statusLabel} tone={order.tone} />
            </View>
            <Text style={cardStyles.meta}>
              {order.placedLabel} · {order.itemsLabel}
            </Text>
            {order.invoiceNumber !== null ? (
              <Text style={cardStyles.meta}>{t('customers.orders.invoice', { number: order.invoiceNumber })}</Text>
            ) : null}
            <View style={[cardStyles.rowBetween, styles.detailsRow]}>
              <Text style={cardStyles.body}>{order.channelLabel}</Text>
              <View style={styles.priceWrap}>
                <Text style={cardStyles.meta}>{order.paymentStatusLabel}</Text>
                <Text style={cardStyles.amount}>{order.amountLabel}</Text>
              </View>
            </View>
            {onOpenOrder ? (
              <TouchableOpacity
                style={styles.rowAction}
                onPress={() => onOpenOrder(order)}
                activeOpacity={0.75}
                accessibilityRole="button"
              >
                <Text style={styles.rowActionText}>View Details</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))
      )}
      {view === 'ready' && hasMore && onLoadMore ? <LinkButton label={t('customers.loadMore')} onPress={onLoadMore} /> : null}
    </CustomersScreen>
  );
}

const styles = StyleSheet.create({
  detailsRow: { marginTop: adminSpacing.sm },
  priceWrap: { flexDirection: 'row', alignItems: 'center', gap: adminSpacing.sm },
  rowAction: {
    marginTop: adminSpacing.md,
    borderRadius: adminRadius.md,
    backgroundColor: adminColors.brandTint,
    paddingVertical: adminSpacing.sm,
    alignItems: 'center',
  },
  rowActionText: { ...adminType.rowTitle, color: adminColors.brandDeep },
});
