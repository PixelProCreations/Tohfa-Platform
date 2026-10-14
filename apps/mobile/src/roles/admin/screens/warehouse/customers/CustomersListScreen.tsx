/**
 * Customers list: the entry of the customer area (GET /admin/customers).
 *
 * Scope is the server's (BR-91): customer.list.view is `own` for both
 * warehouse roles, and an `own` actor sees only the customers with an order
 * or a top-up at its warehouse, or who prefer it. The rows come already
 * scoped; nothing is filtered here. No Add Customer button:
 * customer.record.create is SA/TA only.
 *
 * Live (plan phase 6): the KPI tiles are the server's `summary` over the whole
 * visible set (total, active, new; BR-91e), shown as no value until it loads.
 * The search box is the server's `q` (name or customer code; the mobile only
 * for an unmasked actor, BR-92h). Each row shows the masked mobile exactly as
 * sent (BR-92). Pull to refresh; "Load more" pages on.
 *
 * Hidden, because the API cannot do them: the Main all-warehouses selector and
 * the per-row warehouse label (the list takes no warehouseId and carries only
 * a preferred warehouse id), the Main "With Orders" / "With Issues" tiles and
 * the per-row purchases total (no such figures), and the filter shortcut into
 * the old sample search.
 */
// Design id: M7-S01
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { t } from '../../../i18n';
import { adminColors } from '../../../theme';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../shared/AsyncStates';
import { queryViewState } from '../shared/queryViewState';
import {
  BellIcon,
  cardStyles,
  CustomersScreen,
  EmptyState,
  HeaderIconButton,
  isAllWarehouses,
  LinkButton,
  SearchField,
  SearchIcon,
  StatTiles,
  StatusBadge,
} from './CustomersParts';
import type { CustomerRow, CustomersLiveStateProps, CustomerSummary, WarehouseScreenBaseProps } from './types';

export interface CustomersListScreenProps extends WarehouseScreenBaseProps, CustomersLiveStateProps {
  onSelectCustomer?: ((customer: CustomerRow) => void) | undefined;
  onNavigateToSearch?: (() => void) | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
  /** The loaded rows, page by page (already scoped by the server). */
  customers?: readonly CustomerRow[] | undefined;
  /** The server's counts over the whole visible set; null until it loads. */
  summary?: CustomerSummary | null | undefined;
  /** The search box text; the flow sends it as `q`. */
  searchText?: string | undefined;
  onSearchTextChange?: ((text: string) => void) | undefined;
}

function countLabel(value: number | undefined): string | number {
  return value === undefined ? t('customers.noValue') : value;
}

export function CustomersListScreen({
  scope,
  can,
  onBack,
  onSelectCustomer,
  onNavigateToSearch,
  onNavigateToNotifications,
  customers = [],
  summary = null,
  searchText = '',
  onSearchTextChange,
  isLoading = false,
  error,
  onRetry,
  onRefresh,
  isRefreshing = false,
  onLoadMore,
  hasMore = false,
}: CustomersListScreenProps) {
  const allWarehouses = isAllWarehouses(scope);

  if (!can('customer.list.view')) {
    return (
      <CustomersScreen title="Customers" onBack={onBack}>
        <EmptyState title="Customer list not available" subtitle="Your role does not include viewing customers." />
      </CustomersScreen>
    );
  }

  const view = queryViewState({ isLoading, error, itemCount: customers.length });
  const searching = searchText.trim() !== '';

  const headerRight =
    allWarehouses && onNavigateToSearch ? (
      <HeaderIconButton label="Search customers" onPress={onNavigateToSearch}>
        <SearchIcon color={adminColors.onBrand} />
      </HeaderIconButton>
    ) : (
      <HeaderIconButton label="Notifications" onPress={onNavigateToNotifications}>
        <BellIcon />
      </HeaderIconButton>
    );

  return (
    <CustomersScreen
      title="Customers"
      subtitle={allWarehouses ? undefined : scope.warehouseName}
      onBack={onBack}
      headerRight={headerRight}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
    >
      <StatTiles
        items={[
          { label: t('customers.kpi.total'), value: countLabel(summary?.total) },
          { label: t('customers.kpi.active'), value: countLabel(summary?.active) },
          { label: t('customers.kpi.new'), value: countLabel(summary?.new) },
        ]}
      />

      <SearchField
        value={searchText}
        onChangeText={(text) => onSearchTextChange?.(text)}
        placeholder={t('customers.list.searchPlaceholder')}
      />

      {view === 'loading' ? (
        <AdminLoadingState />
      ) : view === 'error' ? (
        <AdminErrorState error={error} onRetry={onRetry} />
      ) : view === 'empty' ? (
        <AdminEmptyState title={t(searching ? 'customers.empty.search' : 'customers.empty.list')} />
      ) : (
        <>
          {customers.map((customer) => (
            <TouchableOpacity
              key={customer.id}
              style={cardStyles.card}
              activeOpacity={0.8}
              onPress={() => onSelectCustomer?.(customer)}
              accessibilityRole="button"
            >
              <View style={cardStyles.rowBetween}>
                <Text style={cardStyles.title}>{customer.name}</Text>
                <StatusBadge label={customer.statusLabel} tone={customer.tone} />
              </View>
              <Text style={cardStyles.meta}>
                {customer.code} · {customer.mobileMasked}
              </Text>
              <View style={cardStyles.divider} />
              <View style={cardStyles.rowBetween}>
                <View>
                  <Text style={cardStyles.meta}>Orders</Text>
                  <Text style={cardStyles.body}>{customer.totalOrders ?? t('customers.noValue')}</Text>
                </View>
                <View>
                  <Text style={cardStyles.meta}>{t('customers.list.lastActivity')}</Text>
                  <Text style={cardStyles.body}>{customer.lastActivityLabel}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {hasMore && onLoadMore ? <LinkButton label={t('customers.loadMore')} onPress={onLoadMore} /> : null}
        </>
      )}
    </CustomersScreen>
  );
}
