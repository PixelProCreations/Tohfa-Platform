/**
 * Live queries for warehouse reports (M12).
 * Built on TanStack Query hooks via roles/admin/api/hooks.ts.
 */
import { useMemo } from 'react';
import {
  getCashTopupsReport,
  getCustomersReport,
  getInventoryReport,
  getReceivingReport,
  getReturnsReport,
  getSalesReport,
  type ReportChannel,
} from '../../../api/reports';
import {
  getFinanceExpenseReport,
  getFinanceRevenueReport,
  type FinanceExpenseReportDto,
  type FinanceRevenueReportDto,
} from '../../../api/finance';
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import type { PermissionCheck, WarehouseScope } from '../finance-expenses';
import { REPORT_CODES } from './constants';
import {
  getReportPresetDates,
  mapCashTopupsReport,
  mapCustomersReport,
  mapInventoryReport,
  mapReceivingReport,
  mapReturnsReport,
  mapSalesReport,
  reportsWarehouseFilter,
  validateReportDateRange,
  type MappedCashTopupsReport,
  type MappedCustomersReport,
  type MappedInventoryReport,
  type MappedReceivingReport,
  type MappedReturnsReport,
  type MappedSalesReport,
} from './mappers';
import { formatPaise, parseRupeesToPaise } from '../../../money/paise';

const REPORTS = 'reports';

export interface LiveQueryState {
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
  isRefreshing: boolean;
}

function queryState(query: { isPending: boolean; error: unknown; refetch: () => unknown; isRefetching: boolean }): LiveQueryState {
  return {
    isLoading: query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
    isRefreshing: query.isRefetching,
  };
}

export function useReportsHubData(
  scope: WarehouseScope,
  selectedWarehouseId: string | undefined,
  timeFilter: 'Today' | 'Week' | 'Month',
  can: PermissionCheck,
) {
  const warehouseId = reportsWarehouseFilter(scope, selectedWarehouseId);
  const { from, to } = useMemo(() => getReportPresetDates(timeFilter), [timeFilter]);

  const canSales = can(REPORT_CODES.sales);
  const canInventory = can(REPORT_CODES.inventory);
  const canCustomers = can(REPORT_CODES.customers);
  const canCashTopup = can(REPORT_CODES.cashTopUp);
  const canReturns = can(REPORT_CODES.returns);
  const canExpense = can(REPORT_CODES.expense);

  const salesQuery = useAdminQuery(
    adminKeys.scoped(REPORTS, warehouseId, { report: 'sales', from, to }),
    (signal) => getSalesReport({ from, to, warehouseId }, signal),
    { enabled: canSales },
  );

  const receivingQuery = useAdminQuery(
    adminKeys.scoped(REPORTS, warehouseId, { report: 'receiving', from, to }),
    (signal) => getReceivingReport({ from, to, warehouseId }, signal),
    { enabled: canInventory },
  );

  const inventoryQuery = useAdminQuery(
    adminKeys.scoped(REPORTS, warehouseId, { report: 'inventory', from, to }),
    (signal) => getInventoryReport({ from, to, warehouseId }, signal),
    { enabled: canInventory },
  );

  const customersQuery = useAdminQuery(
    adminKeys.scoped(REPORTS, warehouseId, { report: 'customers', from, to }),
    (signal) => getCustomersReport({ from, to, warehouseId }, signal),
    { enabled: canCustomers },
  );

  const cashTopupsQuery = useAdminQuery(
    adminKeys.scoped(REPORTS, warehouseId, { report: 'cash-topups', from, to }),
    (signal) => getCashTopupsReport({ from, to, warehouseId }, signal),
    { enabled: canCashTopup },
  );

  const returnsQuery = useAdminQuery(
    adminKeys.scoped(REPORTS, warehouseId, { report: 'returns', from, to }),
    (signal) => getReturnsReport({ from, to, warehouseId }, signal),
    { enabled: canReturns },
  );

  const expensesQuery = useAdminQuery(
    adminKeys.scoped('finance', warehouseId, { resource: 'reports-expenses', from, to }),
    (signal) => getFinanceExpenseReport({ from, to }, signal),
    { enabled: canExpense },
  );

  const sales = useMemo(() => (salesQuery.data ? mapSalesReport(salesQuery.data) : null), [salesQuery.data]);
  const receiving = useMemo(() => (receivingQuery.data ? mapReceivingReport(receivingQuery.data) : null), [receivingQuery.data]);
  const inventory = useMemo(() => (inventoryQuery.data ? mapInventoryReport(inventoryQuery.data) : null), [inventoryQuery.data]);
  const customers = useMemo(() => (customersQuery.data ? mapCustomersReport(customersQuery.data) : null), [customersQuery.data]);
  const cashTopups = useMemo(() => (cashTopupsQuery.data ? mapCashTopupsReport(cashTopupsQuery.data) : null), [cashTopupsQuery.data]);
  const returns = useMemo(() => (returnsQuery.data ? mapReturnsReport(returnsQuery.data) : null), [returnsQuery.data]);

  const expensesFormatted = useMemo(() => {
    if (!expensesQuery.data) return '₹0';
    const paise = parseRupeesToPaise(String(expensesQuery.data.totalAmount)) ?? 0;
    return formatPaise(paise);
  }, [expensesQuery.data]);

  const isLoading =
    (canSales && salesQuery.isPending) ||
    (canInventory && (receivingQuery.isPending || inventoryQuery.isPending)) ||
    (canCustomers && customersQuery.isPending) ||
    (canCashTopup && cashTopupsQuery.isPending) ||
    (canReturns && returnsQuery.isPending) ||
    (canExpense && expensesQuery.isPending);

  const isRefreshing =
    salesQuery.isRefetching ||
    receivingQuery.isRefetching ||
    inventoryQuery.isRefetching ||
    customersQuery.isRefetching ||
    cashTopupsQuery.isRefetching ||
    returnsQuery.isRefetching ||
    expensesQuery.isRefetching;

  const refresh = () => {
    if (canSales) void salesQuery.refetch();
    if (canInventory) {
      void receivingQuery.refetch();
      void inventoryQuery.refetch();
    }
    if (canCustomers) void customersQuery.refetch();
    if (canCashTopup) void cashTopupsQuery.refetch();
    if (canReturns) void returnsQuery.refetch();
    if (canExpense) void expensesQuery.refetch();
  };

  const hubKpis = useMemo(() => {
    return [
      { label: "TODAY'S SALES", value: sales ? sales.totalFormatted : '₹0', permission: REPORT_CODES.sales },
      { label: 'INVENTORY', value: inventory ? `${inventory.totalQtyKg} kg` : '0 kg', permission: REPORT_CODES.inventory },
      { label: 'RECEIVED TODAY', value: receiving ? `${receiving.totalReceipts} receipts` : '0 receipts', permission: REPORT_CODES.inventory },
      { label: 'CUSTOMERS SERVED', value: customers ? String(customers.customersWithOrders) : '0', permission: REPORT_CODES.customers },
      { label: 'CASH TOP-UP', value: cashTopups ? cashTopups.totalFormatted : '₹0', permission: REPORT_CODES.cashTopUp },
      { label: 'EXPENSES', value: expensesFormatted, permission: REPORT_CODES.expense },
      { label: 'RETURNS', value: returns ? String(returns.totalReturns) : '0', permission: REPORT_CODES.returns },
    ].filter((k) => can(k.permission));
  }, [sales, inventory, receiving, customers, cashTopups, expensesFormatted, returns, can]);

  return {
    from,
    to,
    sales,
    receiving,
    inventory,
    customers,
    cashTopups,
    returns,
    hubKpis,
    isLoading,
    isRefreshing,
    refresh,
    error:
      salesQuery.error ||
      receivingQuery.error ||
      inventoryQuery.error ||
      customersQuery.error ||
      cashTopupsQuery.error ||
      returnsQuery.error ||
      expensesQuery.error,
  };
}

export function useSalesReportData(
  warehouseId: string | undefined,
  from: string,
  to: string,
  channel?: ReportChannel,
): LiveQueryState & { sales: MappedSalesReport | null } {
  const enabled = validateReportDateRange(from, to);
  const query = useAdminQuery(
    adminKeys.scoped(REPORTS, warehouseId, { report: 'sales', from, to, channel }),
    (signal) => getSalesReport({ from, to, warehouseId, channel }, signal),
    { enabled },
  );
  const sales = useMemo(() => (query.data ? mapSalesReport(query.data) : null), [query.data]);
  return { ...queryState(query), isLoading: enabled && query.isPending, sales };
}

export function useReceivingReportData(
  warehouseId: string | undefined,
  from: string,
  to: string,
): LiveQueryState & { receiving: MappedReceivingReport | null } {
  const enabled = validateReportDateRange(from, to);
  const query = useAdminQuery(
    adminKeys.scoped(REPORTS, warehouseId, { report: 'receiving', from, to }),
    (signal) => getReceivingReport({ from, to, warehouseId }, signal),
    { enabled },
  );
  const receiving = useMemo(() => (query.data ? mapReceivingReport(query.data) : null), [query.data]);
  return { ...queryState(query), isLoading: enabled && query.isPending, receiving };
}

export function useInventoryReportData(
  warehouseId: string | undefined,
  from: string,
  to: string,
): LiveQueryState & { inventory: MappedInventoryReport | null } {
  const enabled = validateReportDateRange(from, to);
  const query = useAdminQuery(
    adminKeys.scoped(REPORTS, warehouseId, { report: 'inventory', from, to }),
    (signal) => getInventoryReport({ from, to, warehouseId }, signal),
    { enabled },
  );
  const inventory = useMemo(() => (query.data ? mapInventoryReport(query.data) : null), [query.data]);
  return { ...queryState(query), isLoading: enabled && query.isPending, inventory };
}

export function useReturnsReportData(
  warehouseId: string | undefined,
  from: string,
  to: string,
): LiveQueryState & { returns: MappedReturnsReport | null } {
  const enabled = validateReportDateRange(from, to);
  const query = useAdminQuery(
    adminKeys.scoped(REPORTS, warehouseId, { report: 'returns', from, to }),
    (signal) => getReturnsReport({ from, to, warehouseId }, signal),
    { enabled },
  );
  const returns = useMemo(() => (query.data ? mapReturnsReport(query.data) : null), [query.data]);
  return { ...queryState(query), isLoading: enabled && query.isPending, returns };
}

export function useCustomersReportData(
  warehouseId: string | undefined,
  from: string,
  to: string,
): LiveQueryState & { customers: MappedCustomersReport | null } {
  const enabled = validateReportDateRange(from, to);
  const query = useAdminQuery(
    adminKeys.scoped(REPORTS, warehouseId, { report: 'customers', from, to }),
    (signal) => getCustomersReport({ from, to, warehouseId }, signal),
    { enabled },
  );
  const customers = useMemo(() => (query.data ? mapCustomersReport(query.data) : null), [query.data]);
  return { ...queryState(query), isLoading: enabled && query.isPending, customers };
}

export function useCashTopupsReportData(
  warehouseId: string | undefined,
  from: string,
  to: string,
): LiveQueryState & { cashTopups: MappedCashTopupsReport | null } {
  const enabled = validateReportDateRange(from, to);
  const query = useAdminQuery(
    adminKeys.scoped(REPORTS, warehouseId, { report: 'cash-topups', from, to }),
    (signal) => getCashTopupsReport({ from, to, warehouseId }, signal),
    { enabled },
  );
  const cashTopups = useMemo(() => (query.data ? mapCashTopupsReport(query.data) : null), [query.data]);
  return { ...queryState(query), isLoading: enabled && query.isPending, cashTopups };
}

export function useRevenueReportData(
  from: string,
  to: string,
): LiveQueryState & { revenue: FinanceRevenueReportDto | null } {
  const enabled = validateReportDateRange(from, to);
  const query = useAdminQuery(
    adminKeys.scoped('finance', undefined, { resource: 'reports-revenue', from, to }),
    (signal) => getFinanceRevenueReport({ from, to }, signal),
    { enabled },
  );
  return { ...queryState(query), isLoading: enabled && query.isPending, revenue: query.data ?? null };
}

export function useExpenseReportData(
  from: string,
  to: string,
): LiveQueryState & { expense: FinanceExpenseReportDto | null } {
  const enabled = validateReportDateRange(from, to);
  const query = useAdminQuery(
    adminKeys.scoped('finance', undefined, { resource: 'reports-expenses', from, to }),
    (signal) => getFinanceExpenseReport({ from, to }, signal),
    { enabled },
  );
  return { ...queryState(query), isLoading: enabled && query.isPending, expense: query.data ?? null };
}
