import { useMemo } from 'react';
import type { WarehouseScope } from '../wallet-cashtopup/types';
import { useAdminQuery } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import {
  getSalesReport,
  getInventoryReport,
  getReceivingReport,
  getCustomersReport,
  getCashTopupsReport,
  getReturnsReport,
} from '../../../api/reports';
import { listAdminOrders } from '../../../api/orders';
import { listBatches } from '../../../api/inventory';
import { listGoodsReceipts } from '../../../api/receiving';
import { listCustomers } from '../../../api/customers';
import { listExpenses, getFinanceExpenseReport, listFinanceRevenue } from '../../../api/finance';
import { listReturns } from '../../../api/returns';
import {
  getIstDateRange,
  formatMoney,
  mapSalesReportToSummary,
  mapOrderToReportRow,
  mapBatchToInventoryReportRow,
  mapGoodsReceiptToReceivingReportRow,
  mapCustomerToReportRow,
  mapCashTopupToReportRow,
  mapExpenseToReportRow,
  mapReturnToReportRow,
} from './mappers';

export function resolveWarehouseId(scope: WarehouseScope, selectedWarehouseId?: string): string | undefined {
  if (scope.warehouseId !== undefined) {
    return scope.warehouseId;
  }
  if (!selectedWarehouseId || selectedWarehouseId === 'all') {
    return undefined;
  }
  return selectedWarehouseId;
}

export interface HubKpis {
  todaySales: { amount: string; count: string };
  inventory: { total: string; subtext: string };
  receivedToday: { count: string; subtext: string };
  customersServed: { count: string; subtext: string };
  cashTopUp: { amount: string; count: string };
  expenses: { amount: string; count: string };
  returns: { count: string; subtext: string };
}

export function useHubKpis(scope: WarehouseScope, selectedWarehouseId?: string) {
  const warehouseId = resolveWarehouseId(scope, selectedWarehouseId);
  const { from, to } = getIstDateRange('Today');

  const salesQuery = useAdminQuery(
    adminKeys.scoped('reportsHubSales', warehouseId, { from, to }),
    (signal) => getSalesReport({ from, to, warehouseId }, signal),
  );
  const invQuery = useAdminQuery(
    adminKeys.scoped('reportsHubInventory', warehouseId, {}),
    (signal) => getInventoryReport(warehouseId ? { warehouseId } : undefined, signal),
  );
  const recvQuery = useAdminQuery(
    adminKeys.scoped('reportsHubReceiving', warehouseId, { from, to }),
    (signal) => getReceivingReport({ from, to, warehouseId }, signal),
  );
  const custQuery = useAdminQuery(
    adminKeys.scoped('reportsHubCustomers', warehouseId, { from, to }),
    (signal) => getCustomersReport({ from, to, warehouseId }, signal),
  );
  const topupQuery = useAdminQuery(
    adminKeys.scoped('reportsHubTopup', warehouseId, { from, to }),
    (signal) => getCashTopupsReport({ from, to, warehouseId }, signal),
  );
  const expQuery = useAdminQuery(
    adminKeys.scoped('reportsHubExpenses', warehouseId, { from, to }),
    (signal) => getFinanceExpenseReport({ from, to }, signal),
  );
  const retQuery = useAdminQuery(
    adminKeys.scoped('reportsHubReturns', warehouseId, { from, to }),
    (signal) => getReturnsReport({ from, to, warehouseId }, signal),
  );

  const kpis = useMemo<HubKpis | null>(() => {
    return {
      todaySales: {
        amount: salesQuery.data ? formatMoney(salesQuery.data.total) : '—',
        count: salesQuery.data ? `${salesQuery.data.count} orders` : '—',
      },
      inventory: {
        total: invQuery.data ? `${invQuery.data.items.length} crops` : '—',
        subtext: invQuery.data ? 'In stock' : '—',
      },
      receivedToday: {
        count: recvQuery.data ? `${recvQuery.data.byDay.reduce((s, d) => s + d.count, 0)} receipts` : '—',
        subtext: recvQuery.data ? 'Today' : '—',
      },
      customersServed: {
        count: custQuery.data ? String(custQuery.data.customersWithOrders) : '—',
        subtext: custQuery.data ? 'With orders' : '—',
      },
      cashTopUp: {
        amount: topupQuery.data ? formatMoney(topupQuery.data.total) : '—',
        count: topupQuery.data ? `${topupQuery.data.count} top-ups` : '—',
      },
      expenses: {
        amount: expQuery.data ? formatMoney(expQuery.data.summary.total) : '—',
        count: expQuery.data ? `${expQuery.data.byCategory.length} categories` : '—',
      },
      returns: {
        count: retQuery.data
          ? String(
              retQuery.data.byStatus
                .filter((r) => r.status === 'PENDING')
                .reduce((s, r) => s + r.count, 0),
            )
          : '—',
        subtext: retQuery.data ? 'Open' : '—',
      },
    };
  }, [
    salesQuery.data,
    invQuery.data,
    recvQuery.data,
    custQuery.data,
    topupQuery.data,
    expQuery.data,
    retQuery.data,
  ]);

  const loading =
    salesQuery.isPending ||
    invQuery.isPending ||
    recvQuery.isPending ||
    custQuery.isPending ||
    topupQuery.isPending ||
    expQuery.isPending ||
    retQuery.isPending;

  const error =
    salesQuery.error ||
    invQuery.error ||
    recvQuery.error ||
    custQuery.error ||
    topupQuery.error ||
    expQuery.error ||
    retQuery.error;

  const refresh = () => {
    void salesQuery.refetch();
    void invQuery.refetch();
    void recvQuery.refetch();
    void custQuery.refetch();
    void topupQuery.refetch();
    void expQuery.refetch();
    void retQuery.refetch();
  };

  return { kpis, loading, error, refresh };
}

export function useSalesReportData(scope: WarehouseScope, selectedWarehouseId?: string, period: string = 'Today') {
  const warehouseId = resolveWarehouseId(scope, selectedWarehouseId);
  const { from, to } = getIstDateRange(period);

  const query = useAdminQuery(
    adminKeys.scoped('reportsSales', warehouseId, { from, to }),
    async (signal) => {
      const [reportRes, ordersRes] = await Promise.all([
        getSalesReport({ from, to, warehouseId }, signal),
        listAdminOrders({ warehouseId, limit: 100 }, signal),
      ]);
      const summary = mapSalesReportToSummary(reportRes);
      const orders = ordersRes.items.map(mapOrderToReportRow);
      return { summary, orders };
    },
  );

  return {
    data: query.data ?? null,
    loading: query.isPending,
    error: query.error ? String(query.error) : null,
    refresh: () => {
      void query.refetch();
    },
  };
}

export function useInventoryReportData(scope: WarehouseScope, selectedWarehouseId?: string) {
  const warehouseId = resolveWarehouseId(scope, selectedWarehouseId);

  const query = useAdminQuery(
    adminKeys.scoped('reportsInventory', warehouseId, {}),
    async (signal) => {
      const batchesRes = await listBatches({ warehouseId, limit: 100 }, signal);
      return batchesRes.items.map(mapBatchToInventoryReportRow);
    },
  );

  return {
    items: query.data ?? [],
    loading: query.isPending,
    error: query.error ? String(query.error) : null,
    refresh: () => {
      void query.refetch();
    },
  };
}

export function useReceivingReportData(scope: WarehouseScope, selectedWarehouseId?: string) {
  const warehouseId = resolveWarehouseId(scope, selectedWarehouseId);

  const query = useAdminQuery(
    adminKeys.scoped('reportsReceiving', warehouseId, {}),
    async (signal) => {
      const receiptsRes = await listGoodsReceipts({ warehouseId, limit: 100 }, signal);
      return receiptsRes.items.map(mapGoodsReceiptToReceivingReportRow);
    },
  );

  return {
    items: query.data ?? [],
    loading: query.isPending,
    error: query.error ? String(query.error) : null,
    refresh: () => {
      void query.refetch();
    },
  };
}

export function useCustomerReportData(scope: WarehouseScope, selectedWarehouseId?: string) {
  const warehouseId = resolveWarehouseId(scope, selectedWarehouseId);

  const query = useAdminQuery(
    adminKeys.scoped('reportsCustomers', warehouseId, {}),
    async (signal) => {
      const res = await listCustomers({ limit: 100 }, signal);
      return res.items.map(mapCustomerToReportRow);
    },
  );

  return {
    items: query.data ?? [],
    loading: query.isPending,
    error: query.error ? String(query.error) : null,
    refresh: () => {
      void query.refetch();
    },
  };
}

export function useCashTopupReportData(scope: WarehouseScope, selectedWarehouseId?: string, period: string = 'Today') {
  const warehouseId = resolveWarehouseId(scope, selectedWarehouseId);
  const { from, to } = getIstDateRange(period);

  const query = useAdminQuery(
    adminKeys.scoped('reportsCashTopup', warehouseId, { from, to }),
    async (signal) => {
      const report = await getCashTopupsReport({ from, to, warehouseId }, signal);
      const rows = report.byDay.map((d) =>
        mapCashTopupToReportRow({
          id: d.date,
          customerId: `${d.count} top-ups`,
          warehouseId: warehouseId ?? '',
          amount: d.total,
          notes: `${d.count} transactions on ${d.date}`,
          collectedAt: d.date,
        }),
      );
      return { report, rows };
    },
  );

  return {
    report: query.data?.report,
    items: query.data?.rows ?? [],
    loading: query.isPending,
    error: query.error ? String(query.error) : null,
    refresh: () => {
      void query.refetch();
    },
  };
}

export function useRevenueReportData(scope: WarehouseScope, selectedWarehouseId?: string, period: string = 'Today') {
  const warehouseId = resolveWarehouseId(scope, selectedWarehouseId);
  const { from, to } = getIstDateRange(period);

  const query = useAdminQuery(
    adminKeys.scoped('reportsRevenue', warehouseId, { from, to }),
    async (signal) => {
      const res = await listFinanceRevenue({ from, to, limit: 100 }, signal);
      return res.items.map((r) => ({
        id: r.orderId,
        orderId: r.orderId,
        invoice: `INV-${r.orderId.slice(0, 8)}`,
        type: r.channel === 'ONLINE' ? 'Online Order' : 'Market Sale',
        product: 'Produce',
        quantity: '—',
        order: `Order #${r.orderId.slice(-6)}`,
        amount: formatMoney(r.totalAmount),
        amountNum: Number(r.totalAmount) || 0,
        paymentMethod: r.paymentMethod,
        status: 'Completed',
        dateTime: new Date(r.placedAt).toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        warehouse: warehouseId ? (scope.warehouseName ?? 'Warehouse') : 'Warehouse',
        warehouseId: warehouseId ?? '',
      }));
    },
  );

  return {
    items: query.data ?? [],
    loading: query.isPending,
    error: query.error ? String(query.error) : null,
    refresh: () => {
      void query.refetch();
    },
  };
}

export function useExpenseReportData(scope: WarehouseScope, selectedWarehouseId?: string, period: string = 'Today') {
  const warehouseId = resolveWarehouseId(scope, selectedWarehouseId);
  const { from, to } = getIstDateRange(period);

  const query = useAdminQuery(
    adminKeys.scoped('reportsExpenses', warehouseId, { from, to }),
    async (signal) => {
      const res = await listExpenses({ from, to, warehouseId, limit: 100 }, signal);
      return res.items.map(mapExpenseToReportRow);
    },
  );

  return {
    items: query.data ?? [],
    loading: query.isPending,
    error: query.error ? String(query.error) : null,
    refresh: () => {
      void query.refetch();
    },
  };
}

export function useReturnsReportData(scope: WarehouseScope, selectedWarehouseId?: string, period: string = 'Today') {
  const warehouseId = resolveWarehouseId(scope, selectedWarehouseId);
  const { from, to } = getIstDateRange(period);

  const query = useAdminQuery(
    adminKeys.scoped('reportsReturns', warehouseId, { from, to }),
    async (signal) => {
      const [report, returnsRes] = await Promise.all([
        getReturnsReport({ from, to, warehouseId }, signal),
        listReturns({ limit: 100 }, signal),
      ]);
      const items = returnsRes.items.map(mapReturnToReportRow);
      return { report, items };
    },
  );

  return {
    report: query.data?.report,
    items: query.data?.items ?? [],
    loading: query.isPending,
    error: query.error ? String(query.error) : null,
    refresh: () => {
      void query.refetch();
    },
  };
}

export const useSalesReport = useSalesReportData;
export const useInventoryReport = useInventoryReportData;
export const useReceivingReport = useReceivingReportData;
export const useCustomersReport = useCustomerReportData;
export const useCashTopupsReport = useCashTopupReportData;
export const useRevenueReport = useRevenueReportData;
export const useExpenseReport = useExpenseReportData;
export const useReturnsReport = useReturnsReportData;
