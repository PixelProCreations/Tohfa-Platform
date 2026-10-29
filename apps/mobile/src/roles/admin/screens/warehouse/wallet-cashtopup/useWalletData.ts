import { useCallback, useEffect, useState } from 'react';
import { parseMoney, toPaise, type Money } from '@tohfa/shared-types';
import {
  createCashTopup,
  lookupCustomers,
  type CashTopupCreate,
  type SaleCustomerMatchDto,
} from '../../../api/wallet';
import {
  getCustomerWallet,
  listCustomerWalletTxns,
  type AdminCustomerWalletSummaryDto,
  type WalletTransactionDto,
} from '../../../api/customers';
import { getCashTopupsReport, type CashTopupsReportDto } from '../../../api/reports';
import { getDailyCashSummary, type DailyCashSummaryDto } from '../../../api/finance';
import { useAdminMutation, useAdminQuery, useIdempotencyKey } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import { newIdempotencyKey } from '../../../../../shell/api/idempotency';
import {
  mapCustomerLookupMatchToWalletCustomer,
  mapWalletTransactionDtoToRecord,
  mapWalletTransactionDtoToHistoryRow,
} from './mappers';
import type {
  CashLedgerEntry,
  TopUpHistoryRow,
  WalletCustomer,
  WalletTransactionRecord,
  WarehouseScope,
} from './types';

/** Formats today's date in YYYY-MM-DD for IST. */
function getTodayIstString(): string {
  try {
    const d = new Date();
    // format as YYYY-MM-DD
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
    return parts;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function useCustomerLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<WalletCustomer[]>([]);

  const search = useCallback(async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // If trimmed is all digits, treat as mobile, else as customer code
      const isMobile = /^\d+$/.test(trimmed);
      const query = isMobile ? { mobile: trimmed } : { code: trimmed };
      const res = await lookupCustomers(query);
      const mapped = (res.items || []).map(mapCustomerLookupMatchToWalletCustomer);
      setResults(mapped);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lookup failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
}

export function useCustomerWallet(customerId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<AdminCustomerWalletSummaryDto | null>(null);
  const [transactions, setTransactions] = useState<WalletTransactionRecord[]>([]);

  const load = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    setError(null);
    try {
      const [walletRes, txnsRes] = await Promise.all([
        getCustomerWallet(customerId),
        listCustomerWalletTxns(customerId, { limit: 20 }),
      ]);
      setSummary(walletRes);
      setTransactions((txnsRes.items || []).map((t: WalletTransactionDto) => mapWalletTransactionDtoToRecord(t)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    load();
  }, [load]);

  return { summary, transactions, loading, error, reload: load };
}

export function useCashTopupsReport(scope: WarehouseScope, selectedWarehouseId?: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<CashTopupsReportDto | null>(null);

  const effectiveWarehouseId = scope.warehouseId ?? selectedWarehouseId;
  const today = getTodayIstString();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCashTopupsReport({
        from: today,
        to: today,
        warehouseId: effectiveWarehouseId,
      });
      setReport(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load cash top-ups report');
    } finally {
      setLoading(false);
    }
  }, [effectiveWarehouseId, today]);

  useEffect(() => {
    load();
  }, [load]);

  return { report, loading, error, reload: load };
}

export function useDailyCashData(scope: WarehouseScope, selectedWarehouseId?: string) {
  const effectiveWarehouseId = scope.warehouseId ?? selectedWarehouseId;
  const isAll = !effectiveWarehouseId;
  const { options } = useWarehouseOptions({ enabled: isAll });
  const fallbackWarehouseId = options[0]?.warehouseId;
  const requestWarehouseId = effectiveWarehouseId ?? fallbackWarehouseId;
  const today = getTodayIstString();

  const query = useAdminQuery(
    adminKeys.scoped('finance', effectiveWarehouseId ?? 'all', { resource: 'daily-cash', date: today }),
    (signal) => getDailyCashSummary({ date: today, warehouseId: requestWarehouseId }, signal),
    { enabled: Boolean(requestWarehouseId) },
  );

  const summary = query.data;
  const figures = isAll && summary?.totalAcrossWarehouses ? summary.totalAcrossWarehouses : summary?.system;

  const toPaiseSafe = (val: string | Money | null | undefined): number => {
    if (!val) return 0;
    try {
      return toPaise(parseMoney(String(val)));
    } catch {
      return 0;
    }
  };

  const openingPaise = toPaiseSafe(figures?.openingCash);
  const directSalesPaise = toPaiseSafe(figures?.cashSales);
  const cashTopUpsPaise = toPaiseSafe(figures?.cashTopUps);
  const expensesPaise = toPaiseSafe(figures?.cashExpenses);
  const expectedClosingPaise = toPaiseSafe(figures?.expectedClosing);
  const warehouseCount = isAll && summary?.totalAcrossWarehouses ? summary.totalAcrossWarehouses.warehouseCount : undefined;

  return {
    openingPaise,
    directSalesPaise,
    cashTopUpsPaise,
    expensesPaise,
    expectedClosingPaise,
    warehouseCount,
    closed: summary?.closed ?? null,
    summary,
    isLoading: isAll && !fallbackWarehouseId ? true : query.isLoading,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
    // Backward compatibility for existing properties:
    openingCash: openingPaise,
    directSales: directSalesPaise,
    cashTopUps: cashTopUpsPaise,
    expenses: expensesPaise,
    expectedClosing: expectedClosingPaise,
    cashInEntries: [] as CashLedgerEntry[],
    cashOutEntries: [] as CashLedgerEntry[],
    loading: isAll && !fallbackWarehouseId ? true : query.isLoading,
    reload: () => {
      void query.refetch();
    },
  };
}

export function useCreateCashTopup() {
  const keyCache = useIdempotencyKey();
  const mutation = useAdminMutation({
    mutationFn: ({ customerId, body, idempotencyKey }: { customerId: string; body: CashTopupCreate; idempotencyKey?: string | undefined }): Promise<WalletTransactionDto> => {
      const key = idempotencyKey ?? keyCache.keyFor({ customerId, ...body });
      return createCashTopup(customerId, body, key);
    },
    invalidates: [adminKeys.module('wallets'), adminKeys.module('finance')],
  });

  const submit = useCallback(
    async (customerId: string, body: CashTopupCreate, idempotencyKey?: string): Promise<WalletTransactionRecord> => {
      const res = await mutation.mutateAsync({ customerId, body, idempotencyKey });
      keyCache.reset();
      return mapWalletTransactionDtoToRecord(res);
    },
    [mutation, keyCache],
  );

  return { submit, submitting: mutation.isPending, error: mutation.error };
}
