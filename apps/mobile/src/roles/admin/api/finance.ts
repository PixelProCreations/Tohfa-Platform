/**
 * Warehouse finance and expenses API (docs/openapi.yaml tag Finance):
 *   GET  /admin/expense-categories           finance.expense.log       (BR-62; read-only)
 *   GET  /admin/expenses                     finance.expense.log       (BR-62, BR-63; Sub = own)
 *   POST /admin/expenses                     finance.expense.log       (BR-62; Idempotency-Key)
 *   GET  /admin/expenses/{id}                finance.expense.log       (BR-62, BR-63)
 *   GET  /admin/expenses/{id}/voucher        finance.expense.log       (BR-75)
 *   GET  /admin/finance/revenue              finance.sales_income.view (BR-63; Sub = own)
 *   GET  /admin/finance/revenue/{id}         finance.sales_income.view (BR-63)
 *   GET  /admin/finance/reports/revenue      finance.sales_income.view (BR-63)
 *   GET  /admin/finance/reports/expenses     finance.expense.log       (BR-62, BR-63)
 *   GET  /admin/finance/daily-summary        finance.cash_close.manage (BR-74)
 *   POST /admin/finance/cash-close           finance.cash_close.manage (BR-74; Idempotency-Key)
 *   GET  /admin/finance/cash-close           finance.cash_close.manage (BR-74)
 *   GET  /admin/finance/cash-close/{id}      finance.cash_close.manage (BR-74)
 *
 * Money stays as the API's decimal string (`Money`); the screens' mappers turn
 * them into integer paise.
 *
 * No UI imports, so the Main Warehouse admin can reuse this module.
 */
import type { ErrorCode, GenericProblemCode, Money } from '@tohfa/shared-types';
import type { PageMeta } from '../../../shell/api/pagination';
import { adminGet, adminPost } from './http';

export type ExpensePaymentMethod = 'CASH' | 'UPI' | 'BANK';
export type ExpenseStatus = 'RECORDED' | 'APPROVED' | 'REJECTED';

export type RevenueChannel = 'ONLINE' | 'DIRECT' | 'MARKET' | 'HORECA' | 'B2B';
export type RevenuePaymentMethod = 'WALLET' | 'UPI' | 'CARD' | 'NETBANKING' | 'CASH';

/** docs/openapi.yaml `ExpenseCategory`. */
export interface ExpenseCategoryDto {
  id: string;
  name: string;
  active: boolean;
}

/** docs/openapi.yaml `ExpenseCreate`. */
export interface ExpenseCreateDto {
  warehouseId?: string | undefined;
  categoryId: string;
  amount: Money | string;
  expenseDate: string;
  paymentMethod: ExpensePaymentMethod;
  referenceNumber?: string | undefined;
  description?: string | undefined;
  receiptStorageKey?: string | undefined;
}

/** docs/openapi.yaml `Expense`. */
export interface ExpenseDto {
  id: string;
  expenseNumber: string;
  warehouseId: string;
  warehouseName?: string | undefined;
  categoryId: string;
  categoryName: string;
  amount: Money | string;
  expenseDate: string;
  paymentMethod: ExpensePaymentMethod;
  status: ExpenseStatus;
  referenceNumber?: string | undefined;
  description?: string | undefined;
  receiptStorageKey?: string | undefined;
  recordedBy: string;
  recordedByName?: string | undefined;
  createdAt: string;
}

export interface FinanceTotalDto {
  totalAmount: Money | string;
  count: number;
}

export interface ListExpensesResponseDto {
  items: ExpenseDto[];
  summary: FinanceTotalDto;
  page: PageMeta;
}

export interface ListExpensesParams {
  categoryId?: string | undefined;
  paymentMethod?: ExpensePaymentMethod | undefined;
  status?: ExpenseStatus | undefined;
  from?: string | undefined;
  to?: string | undefined;
  warehouseId?: string | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

/** docs/openapi.yaml `ExpenseVoucher`. */
export interface ExpenseVoucherDto {
  voucherNumber: string;
  expenseId: string;
  expenseNumber: string;
  warehouseId: string;
  warehouseName?: string | undefined;
  categoryId: string;
  categoryName: string;
  amount: Money | string;
  expenseDate: string;
  paymentMethod: ExpensePaymentMethod;
  status: ExpenseStatus;
  referenceNumber?: string | undefined;
  description?: string | undefined;
  receiptStorageKey?: string | undefined;
  recordedBy: string;
  recordedByName?: string | undefined;
  createdAt: string;
}

/** docs/openapi.yaml `FinanceRevenueItem`. */
export interface FinanceRevenueItemDto {
  id: string;
  orderNumber: string;
  warehouseId: string;
  warehouseName?: string | undefined;
  channel: RevenueChannel;
  paymentMethod: RevenuePaymentMethod;
  amount: Money | string;
  completedAt: string;
}

export interface FinanceChannelTotalDto {
  channel: RevenueChannel;
  totalAmount: Money | string;
  count: number;
}

export interface ListRevenueResponseDto {
  items: FinanceRevenueItemDto[];
  summary: FinanceTotalDto & { byChannel: FinanceChannelTotalDto[] };
  page: PageMeta;
}

export interface ListRevenueParams {
  from?: string | undefined;
  to?: string | undefined;
  channel?: RevenueChannel | undefined;
  paymentMethod?: RevenuePaymentMethod | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

/** docs/openapi.yaml `FinanceRevenueDetail`. */
export interface FinanceRevenueDetailDto extends FinanceRevenueItemDto {
  invoiceNumber?: string | null | undefined;
  invoiceStatus?: string | null | undefined;
}

/** docs/openapi.yaml `DailyCashSummary`. */
export interface DailyCashSummaryDto {
  date: string;
  warehouseId: string;
  openingCash: Money | string;
  openingFrom: string | null;
  cashSales: Money | string;
  cashTopUps: Money | string;
  cashExpenses: Money | string;
  expectedClosing: Money | string;
  closed: CashCloseDto | null;
}

export interface DailyCashSummaryParams {
  date: string;
  warehouseId?: string | undefined;
}

/** docs/openapi.yaml `CashCloseCreate`. */
export interface CashCloseCreateDto {
  date: string;
  warehouseId?: string | undefined;
  countedCash: Money | string;
  note?: string | undefined;
}

/** docs/openapi.yaml `CashClose`. */
export interface CashCloseDto {
  id: string;
  closeNumber: string;
  warehouseId: string;
  date: string;
  openingCash: Money | string;
  cashSales: Money | string;
  cashTopUps: Money | string;
  cashExpenses: Money | string;
  expectedClosing: Money | string;
  countedCash: Money | string;
  difference: Money | string;
  note?: string | null | undefined;
  closedBy: string;
  closedByName?: string | undefined;
  closedAt: string;
}

export interface ListCashClosesParams {
  warehouseId?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface ListCashClosesResponseDto {
  items: CashCloseDto[];
  page: PageMeta;
}

/** docs/openapi.yaml `FinanceRevenueReport`. */
export interface FinanceRevenueReportDto {
  from: string;
  to: string;
  totalAmount: Money | string;
  count: number;
  byDay: { date: string; totalAmount: Money | string; count: number }[];
  byChannel: { channel: RevenueChannel; totalAmount: Money | string; count: number }[];
  byPaymentMethod: { paymentMethod: RevenuePaymentMethod; totalAmount: Money | string; count: number }[];
}

/** docs/openapi.yaml `FinanceExpenseReport`. */
export interface FinanceExpenseReportDto {
  from: string;
  to: string;
  totalAmount: Money | string;
  count: number;
  byDay: { date: string; totalAmount: Money | string; count: number }[];
  byCategory: { categoryId: string; categoryName: string; totalAmount: Money | string; count: number }[];
  byPaymentMethod: { paymentMethod: ExpensePaymentMethod | null; totalAmount: Money | string; count: number }[];
}

/**
 * 401 / 403 / 404 / 409 / 422 / 500 error codes across the finance endpoints.
 */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION_FAILED',
  'IDEMPOTENCY_KEY_REUSED',
  'INTERNAL',
];

export function listExpenseCategories(signal?: AbortSignal): Promise<{ items: ExpenseCategoryDto[] }> {
  return adminGet<{ items: ExpenseCategoryDto[] }>('/admin/expense-categories', undefined, signal);
}

export function listExpenses(params: ListExpensesParams = {}, signal?: AbortSignal): Promise<ListExpensesResponseDto> {
  return adminGet<ListExpensesResponseDto>(
    '/admin/expenses',
    {
      categoryId: params.categoryId,
      paymentMethod: params.paymentMethod,
      status: params.status,
      from: params.from,
      to: params.to,
      warehouseId: params.warehouseId,
      cursor: params.cursor,
      limit: params.limit,
    },
    signal,
  );
}

export function createExpense(
  body: ExpenseCreateDto,
  idempotencyKey: string,
  signal?: AbortSignal,
): Promise<ExpenseDto> {
  return adminPost<ExpenseDto>('/admin/expenses', body, { idempotencyKey, signal });
}

export function getExpense(id: string, signal?: AbortSignal): Promise<ExpenseDto> {
  return adminGet<ExpenseDto>(`/admin/expenses/${encodeURIComponent(id)}`, undefined, signal);
}

export function getExpenseVoucher(id: string, signal?: AbortSignal): Promise<ExpenseVoucherDto> {
  return adminGet<ExpenseVoucherDto>(`/admin/expenses/${encodeURIComponent(id)}/voucher`, undefined, signal);
}

export function listFinanceRevenue(
  params: ListRevenueParams = {},
  signal?: AbortSignal,
): Promise<ListRevenueResponseDto> {
  return adminGet<ListRevenueResponseDto>(
    '/admin/finance/revenue',
    {
      from: params.from,
      to: params.to,
      channel: params.channel,
      paymentMethod: params.paymentMethod,
      cursor: params.cursor,
      limit: params.limit,
    },
    signal,
  );
}

export function getFinanceRevenue(id: string, signal?: AbortSignal): Promise<FinanceRevenueDetailDto> {
  return adminGet<FinanceRevenueDetailDto>(`/admin/finance/revenue/${encodeURIComponent(id)}`, undefined, signal);
}

export function getFinanceRevenueReport(
  params: { from: string; to: string },
  signal?: AbortSignal,
): Promise<FinanceRevenueReportDto> {
  return adminGet<FinanceRevenueReportDto>(
    '/admin/finance/reports/revenue',
    { from: params.from, to: params.to },
    signal,
  );
}

export function getFinanceExpenseReport(
  params: { from: string; to: string },
  signal?: AbortSignal,
): Promise<FinanceExpenseReportDto> {
  return adminGet<FinanceExpenseReportDto>(
    '/admin/finance/reports/expenses',
    { from: params.from, to: params.to },
    signal,
  );
}

export function getDailyCashSummary(
  params: DailyCashSummaryParams,
  signal?: AbortSignal,
): Promise<DailyCashSummaryDto> {
  return adminGet<DailyCashSummaryDto>(
    '/admin/finance/daily-summary',
    { date: params.date, warehouseId: params.warehouseId },
    signal,
  );
}

export function createCashClose(
  body: CashCloseCreateDto,
  idempotencyKey: string,
  signal?: AbortSignal,
): Promise<CashCloseDto> {
  return adminPost<CashCloseDto>('/admin/finance/cash-close', body, { idempotencyKey, signal });
}

export function listCashCloses(
  params: ListCashClosesParams = {},
  signal?: AbortSignal,
): Promise<ListCashClosesResponseDto> {
  return adminGet<ListCashClosesResponseDto>(
    '/admin/finance/cash-close',
    {
      warehouseId: params.warehouseId,
      from: params.from,
      to: params.to,
      cursor: params.cursor,
      limit: params.limit,
    },
    signal,
  );
}

export function getCashClose(id: string, signal?: AbortSignal): Promise<CashCloseDto> {
  return adminGet<CashCloseDto>(`/admin/finance/cash-close/${encodeURIComponent(id)}`, undefined, signal);
}
