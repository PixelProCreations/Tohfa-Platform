import { useCallback, useEffect, useState } from 'react';
import type { AdminScope } from '../../../types';
import { getSalesReport, getInventoryReport, getReceivingReport, getCustomersReport, getCashTopupsReport, getReturnsReport } from '../../../api/reports';
import { listOrders } from '../../../api/orders';
import { listBatches } from '../../../api/inventory';
import { listGoodsReceipts } from '../../../api/receiving';
import { listCustomers } from '../../../api/customers';
import { listCashTopups } from '../../../api/wallet';
import { listExpenses, getFinanceExpenseReport, listFinanceRevenue, getFinanceRevenueReport } from '../../../api/finance';
import { listReturns } from '../../../api/returns';
import {
  getIstDateRange,
  formatInr,
  formatKg,
  mapSalesReportToSummary,
  mapOrderToReportRow,
  mapBatchToInventoryReportRow,
  mapGoodsReceiptToReceivingReportRow,
  mapCustomerToReportRow,
  mapCashTopupToReportRow,
  mapExpenseToReportRow,
  mapReturnToReportRow,
} from './mappers';

export function resolveWarehouseId(scope: AdminScope, selectedWarehouseId?: string): string | undefined {
  if (scope.type === 'sub') {
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

export function useHubKpis(scope: AdminScope, selectedWarehouseId?: string) {
  const [kpis, setKpis] = useState<HubKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const warehouseId = resolveWarehouseId(scope, selectedWarehouseId);
    const { from, to } = getIstDateRange('Today');

    try {
      const [sales, inv, recv, cust, topup, exp, ret] = await Promise.allSettled([
        getSalesReport({ from, to, warehouseId }),
        getInventoryReport(warehouseId),
        getReceivingReport({ date: to, warehouseId }),
        getCustomersReport({ from, to, warehouseId }),
        getCashTopupsReport({ from, to, warehouseId }),
        getFinanceExpenseReport({ from, to }),
        getReturnsReport({ from, to, warehouseId }),
      ]);

      const salesVal = sales.status === 'fulfilled' ? sales.value : null;
      const invVal = inv.status === 'fulfilled' ? inv.value : null;
      const recvVal = recv.status === 'fulfilled' ? recv.value : null;
      const custVal = cust.status === 'fulfilled' ? cust.value : null;
      const topupVal = topup.status === 'fulfilled' ? topup.value : null;
      const expVal = exp.status === 'fulfilled' ? exp.value : null;
      const retVal = ret.status === 'fulfilled' ? ret.value : null;

      const totalSalesAmt = salesVal ? formatInr(salesVal.total) : '₹0';
      const totalSalesCount = salesVal ? `${salesVal.count} orders` : '0 orders';

      const invTotalWeight = invVal ? `${Math.round(invVal.totalWeightKg).toLocaleString('en-IN')} kg` : '0 kg';
      const invCrops = invVal ? `${invVal.items.length} crops` : '0 crops';

      const recvCount = recvVal ? `${recvVal.summary.total} receipts` : '0 receipts';
      const recvWeight = recvVal ? `${recvVal.summary.acceptedWeightKg} kg accepted` : '0 kg accepted';

      const custCount = custVal ? `${custVal.activeInPeriod}` : '0';

      const topupAmt = topupVal ? formatInr(topupVal.total) : '₹0';
      const topupCount = topupVal ? `${topupVal.count} top-ups` : '0 top-ups';

      const expAmt = expVal ? formatInr(expVal.total) : '₹0';
      const expCount = expVal ? `${expVal.byCategory.length} categories` : '0 categories';

      const retCount = retVal ? `${retVal.total}` : '0';

      setKpis({
        todaySales: { amount: totalSalesAmt, count: totalSalesCount },
        inventory: { total: invTotalWeight, subtext: invCrops },
        receivedToday: { count: recvCount, subtext: recvWeight },
        customersServed: { count: custCount, subtext: 'Active today' },
        cashTopUp: { amount: topupAmt, count: topupCount },
        expenses: { amount: expAmt, count: expCount },
        returns: { count: retCount, subtext: 'Open RMA' },
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [scope, selectedWarehouseId]);

  useEffect(() => {
    load();
  }, [load]);

  return { kpis, loading, error, refresh: load };
}

export function useSalesReportData(scope: AdminScope, selectedWarehouseId?: string, period: string = 'Today') {
  const [data, setData] = useState<{
    summary: ReturnType<typeof mapSalesReportToSummary>;
    orders: ReturnType<typeof mapOrderToReportRow>[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const warehouseId = resolveWarehouseId(scope, selectedWarehouseId);
    const { from, to } = getIstDateRange(period);

    try {
      const [reportRes, ordersRes] = await Promise.all([
        getSalesReport({ from, to, warehouseId }),
        listOrders({ warehouseId, limit: 100 }),
      ]);
      const summary = mapSalesReportToSummary(reportRes);
      const orders = ordersRes.items.map(mapOrderToReportRow);
      setData({ summary, orders });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [scope, selectedWarehouseId, period]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}

export function useInventoryReportData(scope: AdminScope, selectedWarehouseId?: string) {
  const [items, setItems] = useState<ReturnType<typeof mapBatchToInventoryReportRow>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const warehouseId = resolveWarehouseId(scope, selectedWarehouseId);

    try {
      const batchesRes = await listBatches({ warehouseId, limit: 100 });
      setItems(batchesRes.items.map(mapBatchToInventoryReportRow));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [scope, selectedWarehouseId]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, refresh: load };
}

export function useReceivingReportData(scope: AdminScope, selectedWarehouseId?: string) {
  const [items, setItems] = useState<ReturnType<typeof mapGoodsReceiptToReceivingReportRow>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const warehouseId = resolveWarehouseId(scope, selectedWarehouseId);

    try {
      const receiptsRes = await listGoodsReceipts({ warehouseId, limit: 100 });
      setItems(receiptsRes.items.map(mapGoodsReceiptToReceivingReportRow));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [scope, selectedWarehouseId]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, refresh: load };
}

export function useCustomerReportData(scope: AdminScope, selectedWarehouseId?: string) {
  const [items, setItems] = useState<ReturnType<typeof mapCustomerToReportRow>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await listCustomers({ limit: 100 });
      setItems(res.items.map(mapCustomerToReportRow));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [scope, selectedWarehouseId]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, refresh: load };
}

export function useCashTopupReportData(scope: AdminScope, selectedWarehouseId?: string) {
  const [items, setItems] = useState<ReturnType<typeof mapCashTopupToReportRow>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const warehouseId = resolveWarehouseId(scope, selectedWarehouseId);

    try {
      const res = await listCashTopups({ warehouseId, limit: 100 });
      setItems(res.items.map(mapCashTopupToReportRow));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [scope, selectedWarehouseId]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, refresh: load };
}

export function useRevenueReportData(scope: AdminScope, selectedWarehouseId?: string, period: string = 'Today') {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { from, to } = getIstDateRange(period);

    try {
      const res = await listFinanceRevenue({ from, to, limit: 100 });
      setItems(
        res.items.map((r) => ({
          id: r.id,
          orderId: r.orderId,
          invoice: `INV-${r.id.slice(0, 8)}`,
          type: r.channel === 'ONLINE' ? 'Online Order' : 'Market Sale',
          product: 'Produce',
          quantity: '—',
          order: `Order #${r.orderId.slice(-6)}`,
          amount: formatInr(r.amount),
          amountNum: typeof r.amount === 'string' ? parseFloat(r.amount) : Number(r.amount),
          paymentMethod: r.paymentMethod,
          status: 'Completed',
          dateTime: new Date(r.recordedAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
          warehouse: 'Warehouse',
          warehouseId: '',
        })),
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [scope, selectedWarehouseId, period]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, refresh: load };
}

export function useExpenseReportData(scope: AdminScope, selectedWarehouseId?: string, period: string = 'Today') {
  const [items, setItems] = useState<ReturnType<typeof mapExpenseToReportRow>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const warehouseId = resolveWarehouseId(scope, selectedWarehouseId);
    const { from, to } = getIstDateRange(period);

    try {
      const res = await listExpenses({ from, to, warehouseId, limit: 100 });
      setItems(res.items.map(mapExpenseToReportRow));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [scope, selectedWarehouseId, period]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, refresh: load };
}

export function useReturnsReportData(scope: AdminScope, selectedWarehouseId?: string) {
  const [items, setItems] = useState<ReturnType<typeof mapReturnToReportRow>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await listReturns({ limit: 100 });
      setItems(res.items.map(mapReturnToReportRow));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [scope, selectedWarehouseId]);

  useEffect(() => {
    load();
  }, [load]);
  return { items, loading, error, refresh: load };
}

export const useSalesReport = useSalesReportData;
export const useInventoryReport = useInventoryReportData;
export const useReceivingReport = useReceivingReportData;
export const useCustomersReport = useCustomerReportData;
export const useCashTopupsReport = useCashTopupReportData;
export const useReturnsReport = useReturnsReportData;
