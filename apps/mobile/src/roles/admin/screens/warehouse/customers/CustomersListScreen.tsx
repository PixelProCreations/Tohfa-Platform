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
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
} from './CustomersParts';
import { CUSTOMER_WAREHOUSES, INITIAL_CUSTOMERS, SUB_CUSTOMER_KPIS } from './fixtures';
import { CustomerFiltersScreen, type CustomerFilterStatus, type CustomerFilterValues } from './CustomerFiltersScreen';
import type { CustomerRecord, WarehouseScope, WarehouseScreenBaseProps } from './types';
import { adminColors, adminRadius, adminShadow, adminType } from '../../../theme';
import { OverviewDashboardCard } from '../../../components';
import { WarehouseSelector } from '../inventory';

export interface CustomersListScreenProps extends WarehouseScreenBaseProps {
  onSelectCustomer?: ((customer: CustomerRecord) => void) | undefined;
  onNavigateToSearch?: (() => void) | undefined;
  onNavigateToNotifications?: (() => void) | undefined;
  onOpenFilters?: (() => void) | undefined;
  /** Warehouses for the Main all-warehouses selector (ignored for a Sub scope). */
  warehouseOptions?: readonly WarehouseScope[] | undefined;
  /** Customer rows; defaults to the mock set until the customer API is wired. */
  customers?: readonly CustomerRecord[] | undefined;
}

export function CustomersListScreen({
  scope,
  can,
  onBack,
  onTabChange: _onTabChange,
  onSelectCustomer,
  onNavigateToSearch,
  onNavigateToNotifications,
  onOpenFilters,
  warehouseOptions = CUSTOMER_WAREHOUSES,
  customers = INITIAL_CUSTOMERS,
}: CustomersListScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerFilterStatus>('All');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | undefined>(undefined);
  const [showFilterScreen, setShowFilterScreen] = useState(false);
  const allWarehouses = isAllWarehouses(scope);

  if (!can('customer.list.view')) {
    return (
      <CustomersScreen title="Customers" onBack={onBack}>
        <EmptyState title="Customer list not available" subtitle="Your role does not include viewing customers." />
      </CustomersScreen>
    );
  }

  const handleOpenFilters = () => {
    if (onOpenFilters) {
      onOpenFilters();
    } else {
      setShowFilterScreen(true);
    }
  };

  if (showFilterScreen) {
    return (
      <CustomerFiltersScreen
        scope={scope}
        can={can}
        initialFilters={{
          searchQuery,
          status: statusFilter,
          warehouseId: selectedWarehouseId,
        }}
        warehouseOptions={allWarehouses ? warehouseOptions : []}
        onBack={() => setShowFilterScreen(false)}
        onApplyFilters={(filters: CustomerFilterValues) => {
          setSearchQuery(filters.searchQuery);
          setStatusFilter(filters.status);
          setSelectedWarehouseId(filters.warehouseId);
          setShowFilterScreen(false);
        }}
      />
    );
  }

  const query = searchQuery.trim().toLowerCase();
  const rows = customers.filter((cust) => {
    if (!inScope(scope, cust.warehouseId)) return false;
    if (allWarehouses && selectedWarehouseId !== undefined && cust.warehouseId !== selectedWarehouseId) return false;
    
    // Status filter
    if (statusFilter === 'Active' && cust.status !== 'Active') return false;
    if (statusFilter === 'Inactive' && cust.status !== 'Inactive') return false;
    if (statusFilter === 'With Orders' && cust.ordersCount <= 0) return false;
    if (statusFilter === 'With Issues' && (cust.openIssues ?? 0) <= 0) return false;

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
      subtitle={allWarehouses ? undefined : scope.warehouseName}
      onBack={onBack}
      headerRight={headerRight}
      headerExtra={
        allWarehouses ? (
          <WarehouseSelector
            scope={scope}
            options={warehouseOptions}
            selectedId={selectedWarehouseId}
            onSelect={setSelectedWarehouseId}
          />
        ) : undefined
      }
    >
      {allWarehouses ? (
        // Main Warehouse 4 KPI Cards (2x2 Grid) - Static
        <View style={styles.mainKpiGrid}>
          <OverviewDashboardCard
            value="1,248"
            title="Total Customers"
            subtitle="All registered"
            icon="pickup"
          />
          <OverviewDashboardCard
            value="1,102"
            title="Active"
            subtitle="Regular buyers"
            icon="orders"
          />
          <OverviewDashboardCard
            value="864"
            title="With Orders"
            subtitle="Active orders"
            icon="sales"
          />
          <OverviewDashboardCard
            value="23"
            title="With Issues"
            subtitle="Needs attention"
            icon="alert"
            tone="danger"
          />
        </View>
      ) : (
        <View style={styles.mainKpiGrid}>
          {SUB_CUSTOMER_KPIS.map((item) => (
            <OverviewDashboardCard
              key={item.label}
              value={item.value}
              title={item.label}
              subtitle="Registered"
              icon={item.label.toLowerCase().includes('active') ? 'pickup' : 'orders'}
            />
          ))}
        </View>
      )}

      <SearchField
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={allWarehouses ? 'Search by name, Customer ID or mobile' : 'Search customers...'}
        onFocus={onNavigateToSearch}
        right={
          <TouchableOpacity
            onPress={handleOpenFilters}
            accessibilityRole="button"
            accessibilityLabel="Open Filters"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FilterIcon color={statusFilter !== 'All' ? adminColors.brand : adminColors.muted} />
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
                {/* Main only: warehouse city/name pill */}
                <Text style={styles.warehouseCityTag}>
                  {customer.warehouseName?.replace(' Warehouse', '').replace(' Market', '') ?? 'Coonoor'}
                </Text>
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

const styles = StyleSheet.create({

  mainKpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 16,
  },
  mainKpiCard: {
    width: '48.5%',
    backgroundColor: adminColors.card,
    borderRadius: adminRadius.lg,
    borderWidth: 1,
    borderColor: adminColors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    ...adminShadow.sm,
  },
  mainKpiLabel: {
    ...adminType.caption,
    color: adminColors.muted,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  mainKpiValue: {
    ...adminType.kpiValue,
    color: adminColors.ink,
  },
  warehouseCityTag: {
    ...adminType.rowTitle,
    color: adminColors.ink,
    fontWeight: '600',
  },
});
