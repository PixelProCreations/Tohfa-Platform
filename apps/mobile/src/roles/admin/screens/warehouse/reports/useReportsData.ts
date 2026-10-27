import { useCallback, useEffect, useState } from 'react';
import {
  getCashTopupsReport,
  getCustomersReport,
  getInventoryReport,
  getReceivingReport,
  getReturnsReport,
  getSalesReport,
  type CashTopupsReportDto,
  type CustomersReportDto,
  type DateWarehouseReportQuery,
  type InventoryReportDto,
  type InventoryReportQuery,
  type ReceivingReportDto,
  type ReturnsReportDto,
  type SalesReportDto,
  type SalesReportQuery,
} from '../../../api/reports';
import {
  mapCashTopupsReportDto,
  mapCustomersReportDto,
  mapInventoryReportDto,
  mapReceivingReportDto,
  mapReturnsReportDto,
  mapSalesReportDto,
} from './mappers';

export function useSalesReport(query: SalesReportQuery, enabled = true) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReturnType<typeof mapSalesReportDto> | null>(null);

  const fetchReport = useCallback(async () => {
    if (!enabled || !query.from || !query.to) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getSalesReport(query);
      setData(mapSalesReportDto(res));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load sales report');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, query.from, query.to, query.warehouseId, query.channel]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  return { data, loading, error, refetch: fetchReport };
}

export function useInventoryReport(query: InventoryReportQuery = {}, enabled = true) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReturnType<typeof mapInventoryReportDto> | null>(null);

  const fetchReport = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getInventoryReport(query);
      setData(mapInventoryReportDto(res));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory report');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, query.from, query.to, query.warehouseId]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  return { data, loading, error, refetch: fetchReport };
}

export function useReceivingReport(query: DateWarehouseReportQuery, enabled = true) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReturnType<typeof mapReceivingReportDto> | null>(null);

  const fetchReport = useCallback(async () => {
    if (!enabled || !query.from || !query.to) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getReceivingReport(query);
      setData(mapReceivingReportDto(res));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load receiving report');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, query.from, query.to, query.warehouseId]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  return { data, loading, error, refetch: fetchReport };
}

export function useReturnsReport(query: DateWarehouseReportQuery, enabled = true) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReturnType<typeof mapReturnsReportDto> | null>(null);

  const fetchReport = useCallback(async () => {
    if (!enabled || !query.from || !query.to) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getReturnsReport(query);
      setData(mapReturnsReportDto(res));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load returns report');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, query.from, query.to, query.warehouseId]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  return { data, loading, error, refetch: fetchReport };
}

export function useCustomersReport(query: DateWarehouseReportQuery, enabled = true) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReturnType<typeof mapCustomersReportDto> | null>(null);

  const fetchReport = useCallback(async () => {
    if (!enabled || !query.from || !query.to) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getCustomersReport(query);
      setData(mapCustomersReportDto(res));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load customers report');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, query.from, query.to, query.warehouseId]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  return { data, loading, error, refetch: fetchReport };
}

export function useCashTopupsReport(query: DateWarehouseReportQuery, enabled = true) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ReturnType<typeof mapCashTopupsReportDto> | null>(null);

  const fetchReport = useCallback(async () => {
    if (!enabled || !query.from || !query.to) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getCashTopupsReport(query);
      setData(mapCashTopupsReportDto(res));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load cash top-up report');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, query.from, query.to, query.warehouseId]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  return { data, loading, error, refetch: fetchReport };
}
