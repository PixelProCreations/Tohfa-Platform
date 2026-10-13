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
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
import type { CustomerRecord, WarehouseScope, WarehouseScreenBaseProps } from './types';
import { adminColors, adminRadius, adminShadow, adminSpacing, adminType } from '../../../theme';
import { WarehouseSelector } from '../inventory';

function BuildingWarehouseIcon({ color = adminColors.onBrand }: { color?: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 21h18M3 10h18M5 10v11M9 10v11M15 10v11M19 10v11M12 3l9 7H3l9-7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownSmallIcon({ color = adminColors.onBrand }: { color?: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckSmallIcon({ color = adminColors.brand }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

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
  onTabChange,
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

  const selectedWarehouseName =
    warehouseOptions.find((w) => w.warehouseId === selectedWarehouseId)?.warehouseName ?? 'All Warehouses';

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
          <View style={styles.mainKpiCard}>
            <Text style={styles.mainKpiLabel}>TOTAL CUSTOMERS</Text>
            <Text style={styles.mainKpiValue}>1,248</Text>
          </View>

          <View style={styles.mainKpiCard}>
            <Text style={styles.mainKpiLabel}>ACTIVE</Text>
            <Text style={styles.mainKpiValue}>1,102</Text>
          </View>

          <View style={styles.mainKpiCard}>
            <Text style={styles.mainKpiLabel}>WITH ORDERS</Text>
            <Text style={styles.mainKpiValue}>864</Text>
          </View>

          <View style={styles.mainKpiCard}>
            <Text style={styles.mainKpiLabel}>WITH ISSUES</Text>
            <Text style={styles.mainKpiValue}>23</Text>
          </View>
        </View>
      ) : (
        <StatTiles items={SUB_CUSTOMER_KPIS} />
      )}

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
