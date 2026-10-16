/**
 * Live queries and mutations for the warehouse finance screens (BR-62, BR-63,
 * BR-74, BR-75), on TanStack Query via roles/admin/api/hooks.ts. Thin
 * wrappers: every decision is in ./mappers.ts, which plain-Node vitest covers.
 *
 * Keys are scoped by warehouse (BR-30) so one warehouse's data never answers
 * another's. Writes carry an Idempotency-Key held by the caller through
 * useIdempotencyKey (root CLAUDE.md 2.4).
 */
import { useCallback, useMemo } from 'react';
import {
  createCashClose,
  createExpense,
  getDailyCashSummary,
  getExpense,
  getExpenseVoucher,
  getFinanceExpenseReport,
  getFinanceRevenue,
  getFinanceRevenueReport,
  listExpenseCategories,
  listExpenses,
  listFinanceRevenue,
  type CashCloseCreateDto,
  type CashCloseDto,
  type ExpenseCreateDto,
  type ExpenseDto,
  type ExpensePaymentMethod,
  type ExpenseStatus,
  type FinanceRevenueItemDto,
  type RevenueChannel,
  type RevenuePaymentMethod,
} from '../../../api/finance';
import { useAdminMutation, useAdminQuery, useCursorList, type CursorList } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import {
  mapDailyCashSummary,
  mapExpenseCategory,
  mapExpenseRecord,
  mapExpenseReport,
  mapExpenseVoucher,
  mapRevenueDetail,
  mapRevenueRecord,
  mapRevenueReport,
  type DailyCashSummaryMapped,
  type FinanceReportTotals,
} from './mappers';
import type { ExpenseCategoryItem, ExpenseRecord, RevenueDetail, RevenueRecord, VoucherRecord } from './types';

export const FINANCE_MODULE = 'finance';

export interface LiveQueryState {
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
  isRefreshing: boolean;
}

function queryState(query: { isPending: boolean; error: unknown; refetch: () => unknown; isRefetching: boolean }, enabled = true): LiveQueryState {
  return {
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
    isRefreshing: query.isRefetching,
  };
}

/** GET /admin/expense-categories (active ones only; read-only, BR-62). */
export function useExpenseCategories(enabled = true): LiveQueryState & { categories: ExpenseCategoryItem[] } {
  const query = useAdminQuery(
    adminKeys.scoped(FINANCE_MODULE, undefined, { resource: 'categories' }),
    (signal) => listExpenseCategories(signal),
    { enabled },
  );
  const categories = useMemo(() => (query.data?.items ?? []).map(mapExpenseCategory), [query.data]);
  return { ...queryState(query, enabled), categories };
}

export interface ExpenseListFilters {
  categoryId?: string | undefined;
  paymentMethod?: ExpensePaymentMethod | undefined;
  status?: ExpenseStatus | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

/**
 * GET /admin/expenses, cursor-paged. `warehouseId` from financeWarehouseFilter (BR-30).
 * `enabled: false` fetches nothing (a role without finance.expense.log would get 403).
 */
export function useExpenseList(
  warehouseId: string | undefined,
  filters: ExpenseListFilters = {},
  enabled = true,
): CursorList<ExpenseRecord> {
  const map = useCallback((dto: ExpenseDto) => mapExpenseRecord(dto), []);
  return useCursorList(
    adminKeys.scoped(FINANCE_MODULE, warehouseId, { resource: 'expenses', ...filters }),
    (cursor, signal) => listExpenses({ ...filters, warehouseId, cursor }, signal),
    map,
    { enabled },
  );
}

/** GET /admin/expenses/{id}; out of scope or unknown is 404 (BR-63). */
export function useExpense(expenseId: string | undefined): LiveQueryState & { expense: ExpenseRecord | undefined } {
  const enabled = expenseId !== undefined;
  const query = useAdminQuery(
    adminKeys.scoped(FINANCE_MODULE, undefined, { resource: 'expense', id: expenseId ?? null }),
    (signal) => getExpense(expenseId ?? '', signal),
    { enabled },
  );
  const expense = useMemo(() => (query.data ? mapExpenseRecord(query.data) : undefined), [query.data]);
  return { ...queryState(query, enabled), expense };
}

/** GET /admin/expenses/{id}/voucher (BR-75): the only voucher endpoint; there is no voucher list. */
export function useExpenseVoucher(expenseId: string | undefined): LiveQueryState & { voucher: VoucherRecord | undefined } {
  const enabled = expenseId !== undefined;
  const query = useAdminQuery(
    adminKeys.scoped(FINANCE_MODULE, undefined, { resource: 'voucher', id: expenseId ?? null }),
    (signal) => getExpenseVoucher(expenseId ?? '', signal),
    { enabled },
  );
  const voucher = useMemo(() => (query.data ? mapExpenseVoucher(query.data) : undefined), [query.data]);
  return { ...queryState(query, enabled), voucher };
}

export interface RevenueListFilters {
  channel?: RevenueChannel | undefined;
  paymentMethod?: RevenuePaymentMethod | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

/**
 * GET /admin/finance/revenue, cursor-paged. The endpoint takes no warehouse:
 * the server scopes it to the caller (Sub = own, Main = all, BR-63).
 * `warehouseKey` only keys the cache. `enabled: false` fetches nothing.
 */
export function useRevenueList(
  warehouseKey: string | undefined,
  filters: RevenueListFilters = {},
  enabled = true,
): CursorList<RevenueRecord> {
  const map = useCallback((dto: FinanceRevenueItemDto) => mapRevenueRecord(dto), []);
  return useCursorList(
    adminKeys.scoped(FINANCE_MODULE, warehouseKey, { resource: 'revenue', ...filters }),
    (cursor, signal) => listFinanceRevenue({ ...filters, cursor }, signal),
    map,
    { enabled },
  );
}

/** GET /admin/finance/revenue/{orderId}. */
export function useRevenueDetail(orderId: string | undefined): LiveQueryState & { revenue: RevenueDetail | undefined } {
  const enabled = orderId !== undefined;
  const query = useAdminQuery(
    adminKeys.scoped(FINANCE_MODULE, undefined, { resource: 'revenue-detail', id: orderId ?? null }),
    (signal) => getFinanceRevenue(orderId ?? '', signal),
    { enabled },
  );
  const revenue = useMemo(() => (query.data ? mapRevenueDetail(query.data) : undefined), [query.data]);
  return { ...queryState(query, enabled), revenue };
}

/**
 * GET /admin/finance/daily-summary (BR-74, finance.cash_close.manage). A Main
 * admin must name a warehouse (it is not assigned to one), so the query waits
 * for one; a Sub admin passes its own.
 */
export function useDailyCashSummary(
  warehouseId: string | undefined,
  date: string,
  enabled = true,
): LiveQueryState & { summary: DailyCashSummaryMapped | undefined } {
  const on = enabled && date !== '' && warehouseId !== undefined;
  const query = useAdminQuery(
    adminKeys.scoped(FINANCE_MODULE, warehouseId, { resource: 'daily-summary', date }),
    (signal) => getDailyCashSummary({ warehouseId, date }, signal),
    { enabled: on },
  );
  const summary = useMemo(() => (query.data ? mapDailyCashSummary(query.data) : undefined), [query.data]);
  return { ...queryState(query, on), summary };
}

/** GET /admin/finance/reports/revenue and /expenses for one range (BR-63); each gated by its own code. */
export function useFinanceReports(
  warehouseKey: string | undefined,
  range: { from: string; to: string },
  gates: { revenue: boolean; expenses: boolean },
): {
  revenue: LiveQueryState & { report: FinanceReportTotals | undefined };
  expenses: LiveQueryState & { report: FinanceReportTotals | undefined };
} {
  const revenueQuery = useAdminQuery(
    adminKeys.scoped(FINANCE_MODULE, warehouseKey, { resource: 'report-revenue', ...range }),
    (signal) => getFinanceRevenueReport(range, signal),
    { enabled: gates.revenue },
  );
  const expenseQuery = useAdminQuery(
    adminKeys.scoped(FINANCE_MODULE, warehouseKey, { resource: 'report-expenses', ...range }),
    (signal) => getFinanceExpenseReport(range, signal),
    { enabled: gates.expenses },
  );
  const revenueReport = useMemo(() => (revenueQuery.data ? mapRevenueReport(revenueQuery.data) : undefined), [revenueQuery.data]);
  const expenseReport = useMemo(() => (expenseQuery.data ? mapExpenseReport(expenseQuery.data) : undefined), [expenseQuery.data]);
  return {
    revenue: { ...queryState(revenueQuery, gates.revenue), report: revenueReport },
    expenses: { ...queryState(expenseQuery, gates.expenses), report: expenseReport },
  };
}

/** POST /admin/expenses (BR-62; Idempotency-Key). Refetches every finance read. */
export function useCreateExpenseMutation() {
  return useAdminMutation<{ body: ExpenseCreateDto; idempotencyKey: string }, ExpenseDto>({
    mutationFn: ({ body, idempotencyKey }) => createExpense(body, idempotencyKey),
    invalidates: [adminKeys.module(FINANCE_MODULE)],
  });
}

/** POST /admin/finance/cash-close (BR-74; Idempotency-Key). Refetches every finance read. */
export function useCreateCashCloseMutation() {
  return useAdminMutation<{ body: CashCloseCreateDto; idempotencyKey: string }, CashCloseDto>({
    mutationFn: ({ body, idempotencyKey }) => createCashClose(body, idempotencyKey),
    invalidates: [adminKeys.module(FINANCE_MODULE)],
  });
}
