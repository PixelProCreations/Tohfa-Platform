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
import {
  mapCustomerLookupMatchToWalletCustomer,
  mapWalletTransactionDtoToRecord,
  mapWalletTransactionDtoToHistoryRow,
  rupeesFromMoney,
} from './mappers';
import type {
  CashLedgerEntry,
  TopUpHistoryRow,
  WalletCustomer,
  WalletTransactionRecord,
  WarehouseScope,
} from './types';

export function moneyToWholeRupees(val: Money | string | null | undefined): number {
  if (!val) return 0;
  try {
    return Math.floor(toPaise(parseMoney(String(val))) / 100);
  } catch {
    return 0;
  }
}

/** Generates a simple UUID-v4-like idempotency key. */
function generateIdempotencyKey(): string {
  return 'idem-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
}

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
    return new Date().toISOString().split('T')[0] ?? '';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{
    openingCash: number;
    directSales: number;
    cashTopUps: number;
    expenses: number;
    expectedClosing: number;
    cashInEntries: CashLedgerEntry[];
    cashOutEntries: CashLedgerEntry[];
  }>({
    openingCash: 0,
    directSales: 0,
    cashTopUps: 0,
    expenses: 0,
    expectedClosing: 0,
    cashInEntries: [],
    cashOutEntries: [],
  });

  const effectiveWarehouseId = scope.warehouseId ?? selectedWarehouseId;
  const today = getTodayIstString();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const summaryRes = await getDailyCashSummary({
        date: today,
        warehouseId: effectiveWarehouseId,
      });
      const sys = summaryRes.system;

      setData({
        openingCash: moneyToWholeRupees(sys.openingCash),
        directSales: moneyToWholeRupees(sys.cashSales),
        cashTopUps: moneyToWholeRupees(sys.cashTopUps),
        expenses: moneyToWholeRupees(sys.cashExpenses),
        expectedClosing: moneyToWholeRupees(sys.expectedClosing),
        cashInEntries: [],
        cashOutEntries: [],
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load daily cash data');
    } finally {
      setLoading(false);
    }
  }, [effectiveWarehouseId, today]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...data, loading, error, reload: load };
}

export function useCreateCashTopup() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    async (customerId: string, body: CashTopupCreate, idempotencyKey?: string): Promise<WalletTransactionRecord> => {
      setSubmitting(true);
      setError(null);
      const key = idempotencyKey || generateIdempotencyKey();
      try {
        const res = await createCashTopup(customerId, body, key);
        return mapWalletTransactionDtoToRecord(res);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Cash top-up failed';
        setError(msg);
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  return { submit, submitting, error };
}
