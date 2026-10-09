/**
 * Customer Orders: one customer's orders with status tabs, search and filters.
 *
 * Scope (FINAL_LIST row 13): read-only (customer.list.view + order.list.view_all,
 * SUB grant `own`). A Sub scope lists only orders of its own warehouse; the
 * All-warehouses selector renders only for the Main view (scope.warehouseId
 * undefined). Every row button opens the order (the host's order detail).
 *
 * The filter screen (OrderFiltersScreen, 'order' config) now actually narrows
 * the list; the old screen accepted `appliedFilters` but ignored them.
 */
// Design id: M7-S06
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { adminColors, adminRadius, adminSpacing, adminType, type AdminTone } from '../../../theme';
import { WarehouseSelector } from '../inventory';
import {
  cardStyles,
  ChipRow,
  CustomersScreen,
  EmptyState,
  FilterIcon,
  HeaderIconButton,
  inScope,
  isAllWarehouses,
  SearchField,
  StatusBadge,
} from './CustomersParts';
import { CUSTOMER_WAREHOUSES, DEFAULT_CUSTOMER, INITIAL_CUSTOMER_ORDERS } from './fixtures';
import type { CustomerOrderRecord, CustomerRef, OrderFilterState, WarehouseScope, WarehouseScreenBaseProps } from './types';

export interface CustomerOrdersScreenProps extends WarehouseScreenBaseProps {
  customer?: CustomerRef | undefined;
  appliedFilters?: OrderFilterState | undefined;
  /** Open pre-filtered: a status bucket, a status, or an order type (e.g. from staff "Assign Delivery"). */
  defaultFilter?: string | undefined;
  onOpenFilters?: (() => void) | undefined;
  onOpenOrder?: ((order: CustomerOrderRecord) => void) | undefined;
  /** Warehouses for the Main all-warehouses selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  orders?: readonly CustomerOrderRecord[] | undefined;
}

type OrderTab = 'All' | 'Active' | 'Completed' | 'Cancelled';
const ORDER_TABS: readonly OrderTab[] = ['All', 'Active', 'Completed', 'Cancelled'];

function toneOf(status: string): AdminTone {
  if (status === 'Cancelled') return 'danger';
  if (status === 'Confirmed' || status === 'Packing') return 'warning';
  return 'success';
}

function actionLabelOf(order: CustomerOrderRecord): string {
  if (order.status === 'Ready for Pickup') return 'View Pickup Status';
  if (order.status === 'Completed') return 'View Invoice';
  return 'View Details';
}

function hasActiveFilters(f: OrderFilterState | undefined): boolean {
  if (!f) return false;
  return (
    f.orderStatus !== 'All' ||
    f.orderType !== 'All' ||
    f.paymentStatus !== 'All' ||
    f.datePreset !== 'All Time' ||
    f.searchQuery !== '' ||
    f.warehouseId !== undefined
  );
}

export function CustomerOrdersScreen({
  scope,
  onBack,
  customer,
  appliedFilters,
  defaultFilter,
  onOpenFilters,
  onOpenOrder,
  warehouseOptions = CUSTOMER_WAREHOUSES,
  orders = INITIAL_CUSTOMER_ORDERS,
}: CustomerOrdersScreenProps) {
  const [selectedTab, setSelectedTab] = useState<OrderTab>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const allWarehouses = isAllWarehouses(scope);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(
    allWarehouses ? appliedFilters?.warehouseId : undefined,
  );
  const customerName = customer?.name ?? DEFAULT_CUSTOMER.name;

  const rows = useMemo(() => {
    const query = (searchQuery || appliedFilters?.searchQuery || '').trim().toLowerCase();
    const filterStatus = appliedFilters?.orderStatus ?? 'All';
    return orders.filter((order) => {
      if (!inScope(scope, order.warehouseId)) return false;
      if (allWarehouses && selectedWarehouseId !== undefined && order.warehouseId !== selectedWarehouseId) return false;
      if (
        defaultFilter &&
        defaultFilter !== 'All' &&
        order.statusCategory !== defaultFilter &&
        order.status !== defaultFilter &&
        order.type !== defaultFilter
      ) {
        return false;
      }
      if (selectedTab !== 'All' && order.statusCategory !== selectedTab) return false;
      if (filterStatus !== 'All' && order.statusCategory !== filterStatus && order.status !== filterStatus) return false;
      if (appliedFilters && appliedFilters.orderType !== 'All' && order.type !== appliedFilters.orderType) return false;
      if (appliedFilters && appliedFilters.paymentStatus !== 'All' && order.paymentStatus !== appliedFilters.paymentStatus) {
        return false;
      }
      if (!query) return true;
      return (
        order.orderNo.toLowerCase().includes(query) ||
        (order.products ?? '').toLowerCase().includes(query) ||
        order.items.toLowerCase().includes(query) ||
        order.status.toLowerCase().includes(query)
      );
    });
  }, [orders, scope, allWarehouses, selectedWarehouseId, defaultFilter, selectedTab, appliedFilters, searchQuery]);

  return (
    <CustomersScreen
      title="Customer Orders"
      subtitle={customerName}
      onBack={onBack}
      headerRight={
        <HeaderIconButton label="Open filters" onPress={onOpenFilters} showDot={hasActiveFilters(appliedFilters)}>
          <FilterIcon />
        </HeaderIconButton>
      }
      headerExtra={
        <WarehouseSelector
          scope={scope}
          options={warehouseOptions}
          selectedId={selectedWarehouseId}
          onSelect={setSelectedWarehouseId}
        />
      }
    >
      <ChipRow options={ORDER_TABS} selected={selectedTab} onSelect={setSelectedTab} />
      <SearchField value={searchQuery} onChangeText={setSearchQuery} placeholder="Search by Order ID or product" />

      {rows.length === 0 ? (
        <EmptyState title="No orders found" subtitle="Try adjusting your search query or filter selection." />
      ) : (
        rows.map((order) => (
          <View key={order.id} style={cardStyles.card}>
            <View style={cardStyles.rowBetween}>
              <Text style={cardStyles.code}>{order.orderNo}</Text>
              <StatusBadge label={order.status} tone={toneOf(order.status)} />
            </View>
            <Text style={cardStyles.meta}>
              {order.date} · {order.items}
            </Text>
            <View style={[cardStyles.rowBetween, styles.detailsRow]}>
              <Text style={cardStyles.body}>{order.type}</Text>
              <View style={styles.priceWrap}>
                <Text style={cardStyles.meta}>{order.paymentStatus}</Text>
                <Text style={cardStyles.amount}>{order.price}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.rowAction}
              onPress={() => onOpenOrder?.(order)}
              activeOpacity={0.75}
              accessibilityRole="button"
            >
              <Text style={styles.rowActionText}>{actionLabelOf(order)}</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
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
