/**
 * Customers list: the entry of the customer area.
 *
 * Scope (FINAL_LIST row 16): customer.list.view is `own` for both warehouse
 * roles. A Sub scope lists only its own warehouse's customers; the Main scope
 * (scope.warehouseId undefined, `own` = all four warehouses) lists rows across
 * warehouses with a per-row Warehouse label and the All-warehouses selector.
 * No Add Customer button: customer.record.create is SA/TA only.
 *
 * Absorbs Main CustomerListScreen (pair M7-S01: "MWA list shows Ooty/Coonoor
 * rows across warehouses; SW single-warehouse list w/ stat tiles"): its four
 * KPI tiles (incl. With Orders / With Issues), the per-row warehouse label and
 * purchases total, and the header search button render for the Main view.
 */
// Design id: M7-S01
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { WarehouseSelector } from '../inventory';
import {
  BellIcon,
  cardStyles,
  CustomersScreen,
  EmptyState,
  FilterIcon,
  HeaderIconButton,
  inScope,
  isAllWarehouses,
  SearchField,
  SearchIcon,
  StatTiles,
  StatusBadge,
  UsersIcon,
} from './CustomersParts';
import { CUSTOMER_WAREHOUSES, INITIAL_CUSTOMERS, MAIN_CUSTOMER_KPIS, SUB_CUSTOMER_KPIS } from './fixtures';
import type { CustomerRecord, WarehouseScope, WarehouseScreenBaseProps } from './types';
import { adminColors } from '../../../theme';

export interface CustomersListScreenProps extends WarehouseScreenBaseProps {
  onSelectCustomer?: ((customer: CustomerRecord) => void) | undefined;
  onNavigateToSearch?: (() => void) | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
  /** Warehouses for the Main all-warehouses selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** Customer rows; defaults to the mock set until the customer API is wired. */
  customers?: readonly CustomerRecord[] | undefined;
}

export function CustomersListScreen({
  scope,
  can,
  onBack,
  onSelectCustomer,
  onNavigateToSearch,
  onNavigateToNotifications,
  warehouseOptions = CUSTOMER_WAREHOUSES,
  customers = INITIAL_CUSTOMERS,
}: CustomersListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const allWarehouses = isAllWarehouses(scope);

  if (!can('customer.list.view')) {
    return (
      <CustomersScreen title="Customers" onBack={onBack}>
        <EmptyState title="Customer list not available" subtitle="Your role does not include viewing customers." />
      </CustomersScreen>
    );
  }

  const query = searchQuery.trim().toLowerCase();
  const rows = customers.filter((cust) => {
    if (!inScope(scope, cust.warehouseId)) return false;
    if (allWarehouses && selectedWarehouseId !== undefined && cust.warehouseId !== selectedWarehouseId) return false;
    if (!query) return true;
    return (
      cust.name.toLowerCase().includes(query) ||
      cust.code.toLowerCase().includes(query) ||
      cust.phone.toLowerCase().includes(query)
    );
  });

  const headerRight = allWarehouses ? (
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
      subtitle={allWarehouses ? 'All Warehouses' : scope.warehouseName}
      onBack={onBack}
      titleIcon={<UsersIcon />}
      headerRight={headerRight}
      headerExtra={
        <WarehouseSelector
          scope={scope}
          options={warehouseOptions}
          selectedId={selectedWarehouseId}
          onSelect={setSelectedWarehouseId}
        />
      }
    >
      <StatTiles items={allWarehouses ? MAIN_CUSTOMER_KPIS : SUB_CUSTOMER_KPIS} columns={allWarehouses ? 2 : undefined} />

      <SearchField
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={allWarehouses ? 'Search by name, Customer ID or mobile' : 'Search customers...'}
        onFocus={onNavigateToSearch}
        right={
          <TouchableOpacity onPress={onNavigateToSearch} accessibilityRole="button" accessibilityLabel="Open search">
            <FilterIcon color={adminColors.muted} />
          </TouchableOpacity>
        }
      />

      {rows.length === 0 ? (
        <EmptyState title="No customers found" subtitle="Try a different name, ID or mobile number." />
      ) : (
        rows.map((customer) => (
          <TouchableOpacity
            key={customer.id}
            style={cardStyles.card}
            activeOpacity={0.8}
            onPress={() => onSelectCustomer?.(customer)}
            accessibilityRole="button"
          >
            <View style={cardStyles.rowBetween}>
              <Text style={cardStyles.title}>{customer.name}</Text>
              <StatusBadge label={customer.status} tone={customer.status === 'Active' ? 'success' : 'danger'} />
            </View>
            <Text style={cardStyles.meta}>
              {customer.code} · {customer.phone}
            </Text>
            <View style={cardStyles.divider} />
            {allWarehouses ? (
              <View style={cardStyles.rowBetween}>
                <Text style={cardStyles.meta}>
                  Orders {customer.ordersCount}
                  {customer.totalPurchases ? ` · Purchases ${customer.totalPurchases}` : ''}
                </Text>
                {/* Main only: which warehouse the customer belongs to. */}
                <Text style={cardStyles.code}>{customer.warehouseName ?? ''}</Text>
              </View>
            ) : (
              <View style={cardStyles.rowBetween}>
                <View>
                  <Text style={cardStyles.meta}>Orders</Text>
                  <Text style={cardStyles.body}>{customer.ordersCount}</Text>
                </View>
                <View>
                  <Text style={cardStyles.meta}>Last Purchase</Text>
                  <Text style={cardStyles.body}>{customer.lastPurchase}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))
      )}
    </CustomersScreen>
  );
}
