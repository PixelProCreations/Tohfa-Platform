/**
 * Live queries for the warehouse reports (M12), TanStack Query via
 * roles/admin/api/hooks.ts. Every number the reports area shows comes from one
 * of these; there is no sample data.
 *
 *   GET /admin/reports/{sales,receiving,inventory,returns,customers,cash-topups}
 *   GET /admin/finance/reports/{revenue,expenses}   (finance-expenses/useFinanceData.ts)
 *
 * useReportsData runs each report once for the selected range and warehouse,
 * gated by the code its route requires (constants.ts REPORT_CODES), so the hub
 * KPIs, the report views and the summary all read the same queries and a
 * viewer without a code never sends a request that would be a 403.
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
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import type { PermissionCheck, WarehouseScope } from '../finance-expenses';
import type { FinanceReportTotals } from '../finance-expenses/mappers';
import { useFinanceReports } from '../finance-expenses/useFinanceData';
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
import type { ReportPreset } from './types';

export const REPORTS_MODULE = 'reports';

export interface LiveQueryState {
  /** False when the viewer lacks the code (or the range is invalid): nothing is fetched. */
  enabled: boolean;
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
  isRefreshing: boolean;
}

export interface LiveReport<T> extends LiveQueryState {
  data: T | null;
}

type QueryLike<T> = {
  data: T | undefined;
  isPending: boolean;
  error: unknown;
  refetch: () => unknown;
  isRefetching: boolean;
};

function liveReport<D, T>(query: QueryLike<D>, enabled: boolean, mapped: T | null): LiveReport<T> {
  return {
    enabled,
    isLoading: enabled && query.isPending,
    error: enabled ? query.error : null,
    refresh: () => {
      if (enabled) void query.refetch();
    },
    isRefreshing: enabled && query.isRefetching,
    data: mapped,
  };
}

export interface ReportsData {
  from: string;
  to: string;
  /** The uuid sent as warehouseId, or undefined for all of the caller's warehouses. */
  warehouseId: string | undefined;
  sales: LiveReport<MappedSalesReport>;
  inventory: LiveReport<MappedInventoryReport>;
  receiving: LiveReport<MappedReceivingReport>;
  customers: LiveReport<MappedCustomersReport>;
  cashTopups: LiveReport<MappedCashTopupsReport>;
  returns: LiveReport<MappedReturnsReport>;
  revenue: LiveReport<FinanceReportTotals>;
  expense: LiveReport<FinanceReportTotals>;
}

/**
 * Every report for one preset range and warehouse selection.
 * `salesChannel` narrows the sales report only (GET /admin/reports/sales `channel`).
 */
export function useReportsData(
  scope: WarehouseScope,
  selectedWarehouseId: string | undefined,
  preset: ReportPreset,
  can: PermissionCheck,
  salesChannel?: ReportChannel | undefined,
): ReportsData {
  const warehouseId = reportsWarehouseFilter(scope, selectedWarehouseId);
  const { from, to } = useMemo(() => getReportPresetDates(preset), [preset]);
  const rangeOk = validateReportDateRange(from, to);

  const gates = {
    sales: rangeOk && can(REPORT_CODES.sales),
    inventory: can(REPORT_CODES.inventory),
    receiving: rangeOk && can(REPORT_CODES.receiving),
    customers: rangeOk && can(REPORT_CODES.customers),
    cashTopups: rangeOk && can(REPORT_CODES.cashTopUp),
    returns: rangeOk && can(REPORT_CODES.returns),
    revenue: rangeOk && can(REPORT_CODES.revenue),
    expense: rangeOk && can(REPORT_CODES.expense),
  };

  const salesQuery = useAdminQuery(
    adminKeys.scoped(REPORTS_MODULE, warehouseId, { report: 'sales', from, to, channel: salesChannel ?? 'ALL' }),
    (signal) => getSalesReport({ from, to, warehouseId, channel: salesChannel }, signal),
    { enabled: gates.sales },
  );
  // The inventory report is a current snapshot: the server ignores from/to, so none are sent.
  const inventoryQuery = useAdminQuery(
    adminKeys.scoped(REPORTS_MODULE, warehouseId, { report: 'inventory' }),
    (signal) => getInventoryReport({ warehouseId }, signal),
    { enabled: gates.inventory },
  );
  const receivingQuery = useAdminQuery(
    adminKeys.scoped(REPORTS_MODULE, warehouseId, { report: 'receiving', from, to }),
    (signal) => getReceivingReport({ from, to, warehouseId }, signal),
    { enabled: gates.receiving },
  );
  const customersQuery = useAdminQuery(
    adminKeys.scoped(REPORTS_MODULE, warehouseId, { report: 'customers', from, to }),
    (signal) => getCustomersReport({ from, to, warehouseId }, signal),
    { enabled: gates.customers },
  );
  const cashTopupsQuery = useAdminQuery(
    adminKeys.scoped(REPORTS_MODULE, warehouseId, { report: 'cash-topups', from, to }),
    (signal) => getCashTopupsReport({ from, to, warehouseId }, signal),
    { enabled: gates.cashTopups },
  );
  const returnsQuery = useAdminQuery(
    adminKeys.scoped(REPORTS_MODULE, warehouseId, { report: 'returns', from, to }),
    (signal) => getReturnsReport({ from, to, warehouseId }, signal),
    { enabled: gates.returns },
  );
  // The finance reports take no warehouseId: the server scopes them to the
  // caller (a Sub admin's own warehouse, all warehouses for Main). The scope's
  // own warehouse keys the cache, not the Main selection.
  const finance = useFinanceReports(scope.warehouseId, { from, to }, { revenue: gates.revenue, expenses: gates.expense });

  const sales = useMemo(() => (salesQuery.data ? mapSalesReport(salesQuery.data) : null), [salesQuery.data]);
  const inventory = useMemo(() => (inventoryQuery.data ? mapInventoryReport(inventoryQuery.data) : null), [inventoryQuery.data]);
  const receiving = useMemo(() => (receivingQuery.data ? mapReceivingReport(receivingQuery.data) : null), [receivingQuery.data]);
  const customers = useMemo(() => (customersQuery.data ? mapCustomersReport(customersQuery.data) : null), [customersQuery.data]);
  const cashTopups = useMemo(() => (cashTopupsQuery.data ? mapCashTopupsReport(cashTopupsQuery.data) : null), [cashTopupsQuery.data]);
  const returns = useMemo(() => (returnsQuery.data ? mapReturnsReport(returnsQuery.data) : null), [returnsQuery.data]);

  const fromFinance = (part: typeof finance.revenue, enabled: boolean): LiveReport<FinanceReportTotals> => ({
    enabled,
    isLoading: enabled && part.isLoading,
    error: enabled ? part.error : null,
    refresh: () => {
      if (enabled) part.refresh();
    },
    isRefreshing: enabled && part.isRefreshing,
    data: part.report ?? null,
  });

  return {
    from,
    to,
    warehouseId,
    sales: liveReport(salesQuery, gates.sales, sales),
    inventory: liveReport(inventoryQuery, gates.inventory, inventory),
    receiving: liveReport(receivingQuery, gates.receiving, receiving),
    customers: liveReport(customersQuery, gates.customers, customers),
    cashTopups: liveReport(cashTopupsQuery, gates.cashTopups, cashTopups),
    returns: liveReport(returnsQuery, gates.returns, returns),
    revenue: fromFinance(finance.revenue, gates.revenue),
    expense: fromFinance(finance.expenses, gates.expense),
  };
}

/** The report parts of ReportsData (everything but the range and warehouse). */
export type ReportPart = Exclude<keyof ReportsData, 'from' | 'to' | 'warehouseId'>;

/** Every enabled report of `data` (the hub and the summary wait on / retry these together). */
export function enabledReports(data: ReportsData, parts: readonly ReportPart[]): LiveQueryState[] {
  const out: LiveQueryState[] = [];
  for (const key of parts) {
    const part: LiveQueryState = data[key];
    if (part.enabled) out.push(part);
  }
  return out;
}
