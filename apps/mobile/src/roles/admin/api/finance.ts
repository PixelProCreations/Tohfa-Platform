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
 * DTOs mirror apps/api/src/modules/finance/*.schema.ts (the server's zod
 * response schemas) field for field.
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
/** Always RECORDED through the API (BR-62: no approval workflow); the others are legacy values. */
export type ExpenseStatus = 'RECORDED' | 'APPROVED' | 'REJECTED';

/**
 * A revenue row's channel: orders.channel (BR-15). The finance repo returns the
 * raw column, which since migration 0059 can also be 'DIRECT' (an at-counter
 * sale, BR-85), although docs/openapi.yaml FinanceChannelTotal /
 * FinanceRevenueItem and finance.schema.ts `salesChannels` still list only the
 * four below (SPEC mismatch, reported). The client accepts DIRECT on reads.
 */
export type RevenueChannel = 'ONLINE' | 'MARKET' | 'HORECA' | 'B2B' | 'DIRECT';
/**
 * What GET /admin/finance/revenue accepts as `?channel=`: its query schema
 * (finance.schema.ts listRevenueQuery) still refuses DIRECT with a 422, so the
 * client can never send it.
 */
export type RevenueChannelFilter = Exclude<RevenueChannel, 'DIRECT'>;
export type RevenuePaymentMethod = 'WALLET' | 'UPI' | 'CARD' | 'NETBANKING' | 'CASH';

/** docs/openapi.yaml `ExpenseCategory`: only ACTIVE categories are listed. */
export interface ExpenseCategoryDto {
  id: string;
  name: string;
}

/**
 * docs/openapi.yaml `ExpenseCreate` (additionalProperties: false, so a stray
 * field is a 422). There is no receipt / attachment field: the API stores no
 * expense receipt (see SPEC gap in the finance screens).
 */
export interface ExpenseCreateDto {
  categoryId: string;
  expenseDate: string;
  amount: Money | string;
  paymentMethod: ExpensePaymentMethod;
  vendor?: string | undefined;
  description?: string | undefined;
  warehouseId?: string | undefined;
}

/** docs/openapi.yaml `Expense`. */
export interface ExpenseDto {
  id: string;
  warehouseId: string | null;
  /** Null on rows recorded before migration 0047; `category` (the name) is always present. */
  categoryId: string | null;
  category: string;
  amount: Money | string;
  expenseDate: string;
  paymentMethod: ExpensePaymentMethod | null;
  vendor: string | null;
  description: string | null;
  status: ExpenseStatus;
  recordedBy: string;
  createdAt: string;
}

/** docs/openapi.yaml `FinanceTotal`. */
export interface FinanceTotalDto {
  count: number;
  total: Money | string;
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

/** docs/openapi.yaml `ExpenseVoucher` (BR-75): derived from one expense, never allocated. */
export interface ExpenseVoucherDto {
  voucherNumber: string;
  voucherType: 'EXPENSE';
  expenseId: string;
  warehouse: { id: string; code: string; name: string } | null;
  category: string;
  amount: Money | string;
  expenseDate: string;
  paymentMethod: ExpensePaymentMethod | null;
  vendor: string | null;
  description: string | null;
  status: ExpenseStatus;
  recordedBy: { id: string; name: string };
}

/** docs/openapi.yaml `FinanceRevenueItem`. */
export interface FinanceRevenueItemDto {
  orderId: string;
  channel: RevenueChannel;
  paymentMethod: RevenuePaymentMethod;
  paymentStatus: string;
  status: string;
  totalAmount: Money | string;
  gstAmount: Money | string;
  placedAt: string;
  completedAt: string;
  warehouseId: string;
}

/** docs/openapi.yaml `FinanceChannelTotal`. */
export interface FinanceChannelTotalDto {
  channel: RevenueChannel;
  count: number;
  total: Money | string;
}

export interface ListRevenueResponseDto {
  items: FinanceRevenueItemDto[];
  summary: FinanceTotalDto & { byChannel: FinanceChannelTotalDto[] };
  page: PageMeta;
}

/** GET /admin/finance/revenue has no warehouseId: the server scopes it to the caller (BR-63). */
export interface ListRevenueParams {
  from?: string | undefined;
  to?: string | undefined;
  channel?: RevenueChannelFilter | undefined;
  paymentMethod?: RevenuePaymentMethod | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

/** docs/openapi.yaml `FinanceRevenueDetail`. */
export interface FinanceRevenueDetailDto extends FinanceRevenueItemDto {
  invoiceNumber: string | null;
  invoiceStatus: string | null;
}

/** docs/openapi.yaml `SystemCashFigures`: computed by the server, never typed in (BR-74). */
export interface SystemCashFiguresDto {
  openingCash: Money | string;
  openingFrom: string | null;
  cashSales: Money | string;
  cashTopUps: Money | string;
  cashExpenses: Money | string;
  expectedClosing: Money | string;
}

export interface CashFiguresTotalDto {
  warehouseCount: number;
  openingCash: Money | string;
  cashSales: Money | string;
  cashTopUps: Money | string;
  cashExpenses: Money | string;
  expectedClosing: Money | string;
}

/** docs/openapi.yaml `DailyCashSummary`: the figures live under `system`. */
export interface DailyCashSummaryDto {
  warehouseId: string;
  date: string;
  system: SystemCashFiguresDto;
  closed: CashCloseDto | null;
  totalAcrossWarehouses?: CashFiguresTotalDto | undefined;
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
  warehouseId: string;
  date: string;
  openingCash: Money | string;
  openingFrom: string | null;
  cashSales: Money | string;
  cashTopUps: Money | string;
  cashExpenses: Money | string;
  expectedClosing: Money | string;
  countedCash: Money | string;
  difference: Money | string;
  note: string | null;
  closedBy: string;
  createdAt: string;
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

interface DayTotalDto {
  date: string;
  count: number;
  total: Money | string;
}

/** docs/openapi.yaml `FinanceRevenueReport`. */
export interface FinanceRevenueReportDto {
  from: string;
  to: string;
  summary: FinanceTotalDto;
  byDay: DayTotalDto[];
  byChannel: FinanceChannelTotalDto[];
  byPaymentMethod: { paymentMethod: RevenuePaymentMethod; count: number; total: Money | string }[];
}

/** docs/openapi.yaml `FinanceExpenseReport`. */
export interface FinanceExpenseReportDto {
  from: string;
  to: string;
  summary: FinanceTotalDto;
  byDay: DayTotalDto[];
  byCategory: { category: string; count: number; total: Money | string }[];
  byPaymentMethod: { paymentMethod: ExpensePaymentMethod | null; count: number; total: Money | string }[];
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
  // Rebuilt field by field: the server's ExpenseCreate is strict, so anything
  // else the caller holds (a receipt key, a reference) would be a 422.
  const payload: ExpenseCreateDto = {
    categoryId: body.categoryId,
    expenseDate: body.expenseDate,
    amount: body.amount,
    paymentMethod: body.paymentMethod,
    ...(body.vendor === undefined ? {} : { vendor: body.vendor }),
    ...(body.description === undefined ? {} : { description: body.description }),
    ...(body.warehouseId === undefined ? {} : { warehouseId: body.warehouseId }),
  };
  return adminPost<ExpenseDto>('/admin/expenses', payload, { idempotencyKey, signal });
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

