/**
 * Warehouse direct and market sales API (docs/openapi.yaml tag Sales):
 *   GET  /admin/sales/products                     sales.sale.create (BR-89, BR-95)
 *   GET  /admin/sales/customers/lookup             sales.sale.create (BR-91, BR-92)
 *   POST /admin/sales/quote                        sales.sale.create (BR-89, BR-98)
 *   POST /admin/sales                              sales.sale.create (BR-86, BR-88, BR-89; Idempotency-Key)
 *   GET  /admin/sales                              sales.history.view (BR-85, BR-90; cursor)
 *   GET  /admin/sales/{saleId}                     sales.history.view (BR-90, BR-92)
 *   GET  /admin/sales/summary                      sales.history.view (BR-96)
 *   GET  /admin/sales/market-day                   sales.market_day.view (BR-95, BR-96)
 *   GET  /admin/sales/horeca                       sales.horeca.view (BR-85h, BR-13; read-only)
 *   GET  /admin/sales/b2b                          sales.b2b.view (BR-85h, BR-13; read-only)
 *   POST /admin/sales/{saleId}/payments/upi/confirm payment.record (BR-94, BR-88g; Idempotency-Key)
 *
 * Money and quantities stay as the API's decimal strings (`Money`, `Quantity`);
 * the screens' mappers turn them into integer paise and grams.
 *
 * No UI imports, so the Main Warehouse admin can reuse this module.
 */
import type { ErrorCode, GenericProblemCode, Money } from '@tohfa/shared-types';
import type { PageMeta } from '../../../shell/api/pagination';
import { adminGet, adminPost } from './http';

export type Quantity = string;

export type Grade = 'Grade 1' | 'Grade 2' | 'Grade 3';
export type SalePaymentMethod = 'CASH' | 'UPI' | 'WALLET' | 'CARD';
export type SaleStatus = 'PENDING_PAYMENT' | 'PICKED_UP' | 'CANCELLED';
export type SalePaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';
export type SaleChannel = 'ONLINE' | 'DIRECT' | 'MARKET' | 'HORECA' | 'B2B';
export type SaleCreateChannel = 'DIRECT' | 'MARKET';

/** docs/openapi.yaml `SaleProduct`. */
export interface SaleProductDto {
  productId: string;
  name: string;
  categoryId: string;
  grade: Grade;
  unitPrice: Money | string;
  availableQtyKg: Quantity | string;
  unit: 'kg';
  photos: string[];
  certificationBadges: string[];
  batchCode: string | null;
  storageLocation: string | null;
}

/** docs/openapi.yaml `SaleCustomerMatch`. */
export interface SaleCustomerMatchDto {
  customerId: string;
  customerCode: string;
  name: string;
  mobileMasked: string | null;
  walletBalance: Money | string;
}

/** docs/openapi.yaml `SaleItemRequest`. */
export interface SaleItemRequestDto {
  productId: string;
  grade: Grade;
  qtyKg: Quantity | string;
}

/** docs/openapi.yaml `SaleQuoteRequest`. */
export interface SaleQuoteRequestDto {
  channel: SaleCreateChannel;
  items: SaleItemRequestDto[];
  warehouseId?: string | undefined;
}

/** docs/openapi.yaml `SaleLine`. */
export interface SaleLineDto {
  productId: string;
  name: string;
  grade: Grade;
  qtyKg: Quantity | string;
  unitPrice: Money | string;
  lineTotal: Money | string;
}

/** docs/openapi.yaml `SaleTotals`. */
export interface SaleTotalsDto {
  subtotal: Money | string;
  gst: Money | string;
  total: Money | string;
  changeGiven?: Money | string | null | undefined;
}

/** docs/openapi.yaml `SaleQuote`. */
export interface SaleQuoteDto {
  channel: SaleCreateChannel;
  lines: SaleLineDto[];
  totals: SaleTotalsDto;
  gstRatePercent: string;
  quotedAt: string;
}

/** docs/openapi.yaml `SaleBuyer`. */
export interface SaleBuyerDto {
  kind: 'CUSTOMER' | 'WALK_IN';
  customerId: string | null;
  customerCode: string | null;
  name: string;
  mobileMasked: string | null;
}

/** docs/openapi.yaml `SalePayment`. */
export interface SalePaymentDto {
  method: SalePaymentMethod;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  amount: Money | string;
  amountReceived: Money | string | null;
  cardRef: string | null;
  upiTxnRef: string | null;
  confirmedAt: string | null;
}

/** docs/openapi.yaml `Sale`. */
export interface SaleDto {
  id: string;
  saleNumber: string;
  channel: SaleChannel;
  status: SaleStatus;
  paymentStatus: SalePaymentStatus;
  warehouseId: string;
  buyer: SaleBuyerDto;
  items: SaleLineDto[];
  totals: SaleTotalsDto;
  payment: SalePaymentDto;
  invoiceNumber: string | null;
  invoiceId: string | null;
  timeline?: { fromStatus: string | null; toStatus: string; at: string }[] | undefined;
  createdAt: string;
  completedAt: string | null;
}

/** docs/openapi.yaml `SaleListItem`. */
export interface SaleListItemDto {
  id: string;
  saleNumber: string;
  channel: SaleChannel;
  status: SaleStatus;
  paymentStatus: SalePaymentStatus;
  paymentMethod: SalePaymentMethod;
  warehouseId: string;
  buyer: SaleBuyerDto;
  itemCount: number;
  total: Money | string;
  invoiceNumber: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ListSalesResponseDto {
  items: SaleListItemDto[];
  page: PageMeta;
}

export interface SalesCountRevenueDto {
  count: number;
  revenue: Money | string;
}

export interface SalesDashboardSummaryDto {
  from: string;
  to: string;
  warehouseId?: string | null | undefined;
  count: number;
  revenue: Money | string;
  byChannel: (SalesCountRevenueDto & { channel: SaleChannel })[];
  byPaymentMethod: (SalesCountRevenueDto & { method: SalePaymentMethod })[];
  needsAttention: {
    paymentPending: number;
    stockIssues: number;
    failedSales: number;
    invoiceIssues: number;
  };
}

export interface MarketDayAllocationItemDto {
  productId: string;
  name: string;
  grade: Grade;
  allocatedQtyKg: Quantity | string;
  soldQtyKg: Quantity | string;
  remainingQtyKg: Quantity | string;
}

export interface SalesMarketDayDto {
  date: string;
  warehouseId: string | null;
  totals: SalesCountRevenueDto;
  byPaymentMethod: (SalesCountRevenueDto & { method: SalePaymentMethod })[];
  allocation: MarketDayAllocationItemDto[];
  items: SaleListItemDto[];
  page: PageMeta;
}

export interface ChannelOrderListItemDto {
  id: string;
  orderNumber: string;
  channel: 'HORECA' | 'B2B';
  status: string;
  paymentStatus: SalePaymentStatus;
  warehouseId: string;
  customerCode: string | null;
  businessName: string | null;
  itemCount: number;
  total: Money | string;
  placedAt: string;
}

export interface ListChannelOrdersResponseDto {
  items: ChannelOrderListItemDto[];
  page: PageMeta;
}

export interface SaleUpiConfirmDto {
  upiTxnRef: string;
}

export interface SaleCreateDto {
  channel: SaleCreateChannel;
  warehouseId?: string | undefined;
  customer?: { customerId: string } | undefined;
  walkIn?: { name: string; mobile?: string | undefined } | undefined;
  items: SaleItemRequestDto[];
  expectedTotal: Money | string;
  payment: {
    method: SalePaymentMethod;
    amountReceived?: Money | string | undefined;
    cardRef?: string | undefined;
  };
}

export interface ListSalesParams {
  channel?: SaleChannel | undefined;
  status?: SaleStatus | undefined;
  from?: string | undefined;
  to?: string | undefined;
  warehouseId?: string | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface SalesSummaryParams {
  from: string;
  to: string;
  warehouseId?: string | undefined;
}

export interface SalesMarketDayParams {
  date?: string | undefined;
  warehouseId?: string | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

/**
 * 400 / 401 / 403 / 404 / 409 / 422 / 500 error codes across sales endpoints.
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

export function listSaleProducts(
  params: { warehouseId?: string | undefined } = {},
  signal?: AbortSignal,
): Promise<{ items: SaleProductDto[] }> {
  return adminGet<{ items: SaleProductDto[] }>(
    '/admin/sales/products',
    { warehouseId: params.warehouseId },
    signal,
  );
}

export function lookupSaleCustomer(
  params: { phone: string; warehouseId?: string | undefined },
  signal?: AbortSignal,
): Promise<{ customer: SaleCustomerMatchDto | null }> {
  return adminGet<{ customer: SaleCustomerMatchDto | null }>(
    '/admin/sales/customers/lookup',
    { phone: params.phone, warehouseId: params.warehouseId },
    signal,
  );
}

export function quoteSale(
  body: SaleQuoteRequestDto,
  signal?: AbortSignal,
): Promise<SaleQuoteDto> {
  return adminPost<SaleQuoteDto>('/admin/sales/quote', body, { signal });
}

export function createSale(
  body: SaleCreateDto,
  idempotencyKey: string,
  signal?: AbortSignal,
): Promise<SaleDto> {
  return adminPost<SaleDto>('/admin/sales', body, { idempotencyKey, signal });
}

export function listSales(
  params: ListSalesParams = {},
  signal?: AbortSignal,
): Promise<ListSalesResponseDto> {
  return adminGet<ListSalesResponseDto>(
    '/admin/sales',
    {
      channel: params.channel,
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

export function getSale(
  saleId: string,
  signal?: AbortSignal,
): Promise<SaleDto> {
  return adminGet<SaleDto>(`/admin/sales/${encodeURIComponent(saleId)}`, undefined, signal);
}

export function getSalesSummary(
  params: SalesSummaryParams,
  signal?: AbortSignal,
): Promise<SalesDashboardSummaryDto> {
  return adminGet<SalesDashboardSummaryDto>(
    '/admin/sales/summary',
    {
      from: params.from,
      to: params.to,
      warehouseId: params.warehouseId,
    },
    signal,
  );
}

export function getSalesMarketDay(
  params: SalesMarketDayParams = {},
  signal?: AbortSignal,
): Promise<SalesMarketDayDto> {
  return adminGet<SalesMarketDayDto>(
    '/admin/sales/market-day',
    {
      date: params.date,
      warehouseId: params.warehouseId,
      cursor: params.cursor,
      limit: params.limit,
    },
    signal,
  );
}

export function listSalesHoreca(
  params: { cursor?: string | undefined; limit?: number | undefined } = {},
  signal?: AbortSignal,
): Promise<ListChannelOrdersResponseDto> {
  return adminGet<ListChannelOrdersResponseDto>(
    '/admin/sales/horeca',
    { cursor: params.cursor, limit: params.limit },
    signal,
  );
}

export function listSalesB2b(
  params: { cursor?: string | undefined; limit?: number | undefined } = {},
  signal?: AbortSignal,
): Promise<ListChannelOrdersResponseDto> {
  return adminGet<ListChannelOrdersResponseDto>(
    '/admin/sales/b2b',
    { cursor: params.cursor, limit: params.limit },
    signal,
  );
}

export function confirmSaleUpiPayment(
  saleId: string,
  body: SaleUpiConfirmDto,
  idempotencyKey: string,
  signal?: AbortSignal,
): Promise<SaleDto> {
  return adminPost<SaleDto>(
    `/admin/sales/${encodeURIComponent(saleId)}/payments/upi/confirm`,
    body,
    { idempotencyKey, signal },
  );
}
