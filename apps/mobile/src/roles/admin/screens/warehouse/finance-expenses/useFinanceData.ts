/**
 * Live queries and mutations for warehouse finance & expenses.
 */
import { useMemo } from 'react';
import {
  createExpense,
  getExpense,
  getExpenseVoucher,
  getFinanceRevenue,
  listExpenseCategories,
  listExpenses,
  listFinanceRevenue,
  type ExpenseCategoryDto,
  type ExpenseCreateDto,
  type ExpenseDto,
  type FinanceRevenueItemDto,
  type ListExpensesParams,
  type ListRevenueParams,
} from '../../../api/finance';
import { useAdminMutation, useAdminQuery, useIdempotencyKey } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import {
  mapExpenseCategoryDtoToItem,
  mapExpenseDtoToRecord,
  mapExpenseVoucherDtoToRecord,
  mapRevenueDetailDtoToDetail,
  mapRevenueItemDtoToRecord,
} from './mappers';
import type {
  ExpenseCategoryItem,
  ExpenseRecord,
  RevenueDetail,
  RevenueRecord,
  VoucherRecord,
} from './types';

export const FINANCE_MODULE = 'finance';

export function useExpenses(params: ListExpensesParams = {}, enabled = true) {
  const query = useAdminQuery(
    adminKeys.scoped(FINANCE_MODULE, params.warehouseId, { type: 'expenses', ...params }),
    (signal) => listExpenses(params, signal),
    { enabled },
  );

  const expenses: ExpenseRecord[] = useMemo(() => {
    if (!query.data?.items) return [];
    return query.data.items.map((dto: ExpenseDto) => mapExpenseDtoToRecord(dto));
  }, [query.data]);

  return {
    expenses,
    summary: query.data?.summary,
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}

export function useExpenseDetail(expenseId: string, enabled = true) {
  const query = useAdminQuery(
    adminKeys.scoped(FINANCE_MODULE, undefined, { expenseId }),
    (signal) => getExpense(expenseId, signal),
    { enabled: enabled && Boolean(expenseId) },
  );

  const expense = useMemo(() => {
    if (!query.data) return undefined;
    return mapExpenseDtoToRecord(query.data);
  }, [query.data]);

  return {
    expense,
    rawDto: query.data,
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}

export function useExpenseCategories(enabled = true) {
  const query = useAdminQuery(
    adminKeys.scoped(FINANCE_MODULE, undefined, { type: 'categories' }),
    (signal) => listExpenseCategories(signal),
    { enabled },
  );

  const categories: ExpenseCategoryItem[] = useMemo(() => {
    if (!query.data?.items) return [];
    return query.data.items.map((dto: ExpenseCategoryDto) => mapExpenseCategoryDtoToItem(dto));
  }, [query.data]);

  return {
    categories,
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}

export function useRevenueList(params: ListRevenueParams = {}, enabled = true) {
  const query = useAdminQuery(
    adminKeys.scoped(FINANCE_MODULE, undefined, { type: 'revenue', ...params }),
    (signal) => listFinanceRevenue(params, signal),
    { enabled },
  );

  const revenueRecords: RevenueRecord[] = useMemo(() => {
    if (!query.data?.items) return [];
    return query.data.items.map((dto: FinanceRevenueItemDto) => mapRevenueItemDtoToRecord(dto));
  }, [query.data]);

  return {
    revenueRecords,
    summary: query.data?.summary,
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}

export function useRevenueDetail(orderId: string, enabled = true) {
  const query = useAdminQuery(
    adminKeys.scoped(FINANCE_MODULE, undefined, { orderId }),
    (signal) => getFinanceRevenue(orderId, signal),
    { enabled: enabled && Boolean(orderId) },
  );

  const detail: RevenueDetail | undefined = useMemo(() => {
    if (!query.data) return undefined;
    return mapRevenueDetailDtoToDetail(query.data);
  }, [query.data]);

  return {
    detail,
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}

export function useExpenseVoucher(expenseId: string, enabled = true) {
  const query = useAdminQuery(
    adminKeys.scoped(FINANCE_MODULE, undefined, { type: 'voucher', expenseId }),
    (signal) => getExpenseVoucher(expenseId, signal),
    { enabled: enabled && Boolean(expenseId) },
  );

  const voucher: VoucherRecord | undefined = useMemo(() => {
    if (!query.data) return undefined;
    return mapExpenseVoucherDtoToRecord(query.data);
  }, [query.data]);

  return {
    voucher,
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
  };
}

export function useCreateExpense() {
  const keyCache = useIdempotencyKey();
  return useAdminMutation({
    mutationFn: (body: ExpenseCreateDto) => {
      const idempotencyKey = keyCache.keyFor(body);
      return createExpense(body, idempotencyKey);
    },
    invalidates: [adminKeys.module(FINANCE_MODULE)],
  });
}
