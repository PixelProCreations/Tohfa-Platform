/**
 * Live queries and mutations for the warehouse finance screens (BR-62, BR-63, BR-74, BR-75).
 * Built on TanStack Query hooks via roles/admin/api/hooks.ts.
 */
import { useCallback, useMemo } from 'react';
import {
  createCashClose,
  createExpense,
  getDailyCashSummary,
  getExpense,
  getExpenseVoucher,
  getFinanceRevenue,
  listCashCloses,
  listExpenseCategories,
  listExpenses,
  listFinanceRevenue,
  type CashCloseCreateDto,
  type CashCloseDto,
  type ExpenseCreateDto,
  type ExpenseDto,
  type ExpensePaymentMethod,
  type ExpenseStatus,
  type ExpenseVoucherDto,
  type FinanceRevenueDetailDto,
  type FinanceRevenueItemDto,
  type RevenueChannel,
  type RevenuePaymentMethod,
} from '../../../api/finance';
import { useAdminMutation, useAdminQuery, useCursorList, type CursorList } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import {
  mapCashClose,
  mapDailyCashSummary,
  mapExpenseCategory,
  mapExpenseRecord,
  mapExpenseVoucher,
  mapRevenueDetail,
  mapRevenueRecord,
  type CashCloseMapped,
  type DailyCashSummaryMapped,
} from './mappers';
import type { ExpenseCategoryItem, ExpenseRecord, RevenueDetail, RevenueRecord, VoucherRecord } from './types';

const FINANCE = 'finance';

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

export function useExpenseCategories(): LiveQueryState & { categories: ExpenseCategoryItem[] } {
  const query = useAdminQuery(
    adminKeys.scoped(FINANCE, undefined, { resource: 'categories' }),
    (signal) => listExpenseCategories(signal),
  );
  const categories = useMemo(
    () => (query.data?.items ?? []).map(mapExpenseCategory),
    [query.data],
  );
  return { ...queryState(query), categories };
}

export interface ExpenseListFilters {
  categoryId?: string | undefined;
  paymentMethod?: ExpensePaymentMethod | undefined;
  status?: ExpenseStatus | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

export function useExpenseList(
  warehouseId: string | undefined,
  filters: ExpenseListFilters = {},
): CursorList<ExpenseRecord> {
  const map = useCallback((dto: ExpenseDto) => mapExpenseRecord(dto), []);
  return useCursorList(
    adminKeys.scoped(FINANCE, warehouseId, { resource: 'expenses', ...filters }),
    (cursor, signal) => listExpenses({ ...filters, warehouseId, cursor }, signal),
    map,
  );
}

export function useExpense(expenseId: string | undefined): LiveQueryState & { expense: ExpenseRecord | undefined } {
  const query = useAdminQuery(
    adminKeys.scoped(FINANCE, undefined, { resource: 'expense', id: expenseId ?? null }),
    (signal) => getExpense(expenseId ?? '', signal),
    { enabled: expenseId !== undefined },
  );
  const expense = useMemo(() => (query.data ? mapExpenseRecord(query.data) : undefined), [query.data]);
  return { ...queryState(query), isLoading: expenseId !== undefined && query.isPending, expense };
}

export function useExpenseVoucher(expenseId: string | undefined): LiveQueryState & { voucher: VoucherRecord | undefined } {
  const query = useAdminQuery(
    adminKeys.scoped(FINANCE, undefined, { resource: 'voucher', id: expenseId ?? null }),
    (signal) => getExpenseVoucher(expenseId ?? '', signal),
    { enabled: expenseId !== undefined },
  );
  const voucher = useMemo(() => (query.data ? mapExpenseVoucher(query.data) : undefined), [query.data]);
  return { ...queryState(query), isLoading: expenseId !== undefined && query.isPending, voucher };
}

export interface RevenueListFilters {
  channel?: RevenueChannel | undefined;
  paymentMethod?: RevenuePaymentMethod | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

export function useRevenueList(
  warehouseId: string | undefined,
  filters: RevenueListFilters = {},
): CursorList<RevenueRecord> {
  const map = useCallback((dto: FinanceRevenueItemDto) => mapRevenueRecord(dto), []);
  return useCursorList(
    adminKeys.scoped(FINANCE, warehouseId, { resource: 'revenue', ...filters }),
    (cursor, signal) => listFinanceRevenue({ ...filters, cursor }, signal),
    map,
  );
}

export function useRevenueDetail(orderId: string | undefined): LiveQueryState & { revenue: RevenueDetail | undefined } {
  const query = useAdminQuery(
    adminKeys.scoped(FINANCE, undefined, { resource: 'revenue-detail', id: orderId ?? null }),
    (signal) => getFinanceRevenue(orderId ?? '', signal),
    { enabled: orderId !== undefined },
  );
  const revenue = useMemo(() => (query.data ? mapRevenueDetail(query.data) : undefined), [query.data]);
  return { ...queryState(query), isLoading: orderId !== undefined && query.isPending, revenue };
}

export function useDailyCashSummary(
  warehouseId: string | undefined,
  date: string,
): LiveQueryState & { summary: DailyCashSummaryMapped | undefined } {
  const query = useAdminQuery(
    adminKeys.scoped(FINANCE, warehouseId, { resource: 'daily-summary', date }),
    (signal) => getDailyCashSummary({ warehouseId, date }, signal),
    { enabled: !!date },
  );
  const summary = useMemo(() => (query.data ? mapDailyCashSummary(query.data) : undefined), [query.data]);
  return { ...queryState(query), summary };
}

export function useCreateExpenseMutation() {
  return useAdminMutation({
    mutationFn: ({ body, idempotencyKey }: { body: ExpenseCreateDto; idempotencyKey: string }) =>
      createExpense(body, idempotencyKey),
    invalidates: [adminKeys.module(FINANCE)],
  });
}

export function useCreateCashCloseMutation() {
  return useAdminMutation({
    mutationFn: ({ body, idempotencyKey }: { body: CashCloseCreateDto; idempotencyKey: string }) =>
      createCashClose(body, idempotencyKey),
    invalidates: [adminKeys.module(FINANCE)],
  });
}
