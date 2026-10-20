/**
 * Live queries and mutations for the warehouse direct and channel sales screens
 * (M6). Thin TanStack Query wrappers over roles/admin/api/sales.ts; every
 * decision (mapping, request bodies, payment checks) lives in ./mappers.ts,
 * which is tested.
 *
 * Keys are adminKeys.scoped('sales', warehouseId, ...), so one warehouse's rows
 * never answer another warehouse's query (BR-30). Every write invalidates the
 * whole 'sales' module and 'inventory' (a sale moves stock).
 */
import { useCallback, useMemo } from 'react';
import type { QueryKey } from '@tanstack/react-query';
import {
  cancelSale,
  confirmSaleUpiPayment,
  createSale,
  getSale,
  getSalesMarketDay,
  getSalesSummary,
  listSaleProducts,
  listSales,
  listSalesB2b,
  listSalesHoreca,
  lookupSaleCustomer,
  quoteSale,
  type ChannelOrderListItemDto,
  type SaleCancelDto,
  type SaleCreateDto,
  type SaleListItemDto,
  type SalePaymentMethod,
  type SalePaymentStatus,
  type SaleProductDto,
  type SaleQuoteRequestDto,
  type SaleStatus,
  type SaleUpiConfirmDto,
} from '../../../api/sales';
import { getAdminOrder } from '../../../api/orders';
import { useAdminMutation, useAdminQuery, useCursorList, type CursorList } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { warehouseOptionName } from '../../../api/warehouseList';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import type { PermissionCheck, WarehouseScope } from './types';
import {
  customerLookupParams,
  mapChannelOrderDetail,
  mapChannelOrderListItem,
  mapSale,
  mapSaleCustomerMatch,
  mapSaleListItem,
  mapSaleProduct,
  mapSaleQuote,
  mapSalesMarketDay,
  mapSalesSummary,
  type ChannelOrderDetailView,
  type ChannelOrderRow,
  type SaleCustomerView,
  type SaleDetailView,
  type SaleListRow,
  type SaleProductView,
  type SalesMarketDayView,
  type SalesSummaryView,
} from './mappers';

export const SALES_MODULE = 'sales';
const WRITE_INVALIDATES: readonly QueryKey[] = [adminKeys.module(SALES_MODULE), adminKeys.module('inventory')];

export interface LiveQueryState {
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
  isRefreshing: boolean;
}

function queryState(
  query: { isPending: boolean; error: unknown; refetch: () => unknown; isRefetching: boolean },
  enabled = true,
): LiveQueryState {
  return {
    isLoading: enabled && query.isPending,
    error: query.error,
    refresh: () => {
      void query.refetch();
    },
    isRefreshing: query.isRefetching,
  };
}

/** Sellable products for the sale's channel and warehouse, page by page (BR-95). */
export function useSaleProducts(
  channel: 'DIRECT' | 'MARKET',
  warehouseId: string | undefined,
  q: string,
  options: { enabled?: boolean | undefined } = {},
): CursorList<SaleProductView> {
  const map = useCallback((dto: SaleProductDto) => mapSaleProduct(dto), []);
  const search = q.trim();
  return useCursorList(
    adminKeys.scoped(SALES_MODULE, warehouseId, { resource: 'products', channel, q: search }),
    (cursor, signal) =>
      listSaleProducts({ channel, warehouseId, q: search === '' ? undefined : search, cursor }, signal),
    map,
    { enabled: options.enabled ?? true },
  );
}

/** Counter customer search: mobile, or a name / code / digits `q` (BR-91, BR-92). */
export function useSaleCustomerLookup(input: string): LiveQueryState & { customers: SaleCustomerView[]; searched: boolean } {
  const params = customerLookupParams(input);
  const enabled = params !== null;
  const query = useAdminQuery(
    adminKeys.scoped(SALES_MODULE, undefined, { resource: 'customer-lookup', ...(params ?? {}) }),
    (signal) => lookupSaleCustomer(params ?? { q: '' }, signal),
    { enabled },
  );
  const customers = useMemo(() => (query.data?.items ?? []).map(mapSaleCustomerMatch), [query.data]);
  return { ...queryState(query, enabled), customers, searched: enabled };
}

export function useQuoteSaleMutation() {
  return useAdminMutation({
    mutationFn: async (body: SaleQuoteRequestDto) => mapSaleQuote(await quoteSale(body)),
  });
}

export function useCreateSaleMutation() {
  return useAdminMutation({
    mutationFn: async ({ body, idempotencyKey }: { body: SaleCreateDto; idempotencyKey: string }) =>
      mapSale(await createSale(body, idempotencyKey)),
    invalidates: WRITE_INVALIDATES,
  });
}

export function useConfirmSaleUpiPaymentMutation() {
  return useAdminMutation({
    mutationFn: async ({
      saleId,
      body,
      idempotencyKey,
    }: {
      saleId: string;
      body: SaleUpiConfirmDto;
      idempotencyKey: string;
    }) => mapSale(await confirmSaleUpiPayment(saleId, body, idempotencyKey)),
    invalidates: WRITE_INVALIDATES,
  });
}

export function useCancelSaleMutation() {
  return useAdminMutation({
    mutationFn: async ({ saleId, body, idempotencyKey }: { saleId: string; body: SaleCancelDto; idempotencyKey: string }) =>
      mapSale(await cancelSale(saleId, body, idempotencyKey)),
    invalidates: WRITE_INVALIDATES,
  });
}

export interface SaleListFilters {
  channel?: 'DIRECT' | 'MARKET' | undefined;
  status?: SaleStatus | undefined;
  paymentStatus?: SalePaymentStatus | undefined;
  paymentMethod?: SalePaymentMethod | undefined;
  q?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

export function useSalesList(
  warehouseId: string | undefined,
  filters: SaleListFilters = {},
  options: { enabled?: boolean | undefined } = {},
): CursorList<SaleListRow> {
  const map = useCallback((dto: SaleListItemDto) => mapSaleListItem(dto), []);
  const q = filters.q?.trim() ? filters.q.trim() : undefined;
  const clean = { ...filters, q };
  return useCursorList(
    adminKeys.scoped(SALES_MODULE, warehouseId, { resource: 'sales-list', ...clean }),
    (cursor, signal) => listSales({ ...clean, warehouseId, cursor }, signal),
    map,
    { enabled: options.enabled ?? true },
  );
}

export function useSale(saleId: string | undefined): LiveQueryState & { sale: SaleDetailView | undefined } {
  const enabled = saleId !== undefined && saleId !== '';
  const query = useAdminQuery(
    adminKeys.scoped(SALES_MODULE, undefined, { resource: 'sale-detail', id: saleId ?? null }),
    (signal) => getSale(saleId ?? '', signal),
    { enabled },
  );
  const sale = useMemo(() => (query.data ? mapSale(query.data) : undefined), [query.data]);
  return { ...queryState(query, enabled), sale };
}

/** Paid-and-completed sales summary (BR-96). from / to omitted = today (server default). */
export function useSalesSummary(
  warehouseId: string | undefined,
  range: { from?: string | undefined; to?: string | undefined } = {},
  options: { enabled?: boolean | undefined } = {},
): LiveQueryState & { summary: SalesSummaryView | undefined } {
  const enabled = options.enabled ?? true;
  const query = useAdminQuery(
    adminKeys.scoped(SALES_MODULE, warehouseId, { resource: 'summary', from: range.from ?? null, to: range.to ?? null }),
    (signal) => getSalesSummary({ warehouseId, from: range.from, to: range.to }, signal),
    { enabled },
  );
  const summary = useMemo(() => (query.data ? mapSalesSummary(query.data) : undefined), [query.data]);
  return { ...queryState(query, enabled), summary };
}

export function useSalesMarketDay(
  warehouseId: string | undefined,
  date?: string | undefined,
  options: { enabled?: boolean | undefined } = {},
): LiveQueryState & { marketDay: SalesMarketDayView | undefined } {
  const enabled = options.enabled ?? true;
  const query = useAdminQuery(
    adminKeys.scoped(SALES_MODULE, warehouseId, { resource: 'market-day', date: date ?? 'today' }),
    (signal) => getSalesMarketDay({ warehouseId, date }, signal),
    { enabled },
  );
  const marketDay = useMemo(() => (query.data ? mapSalesMarketDay(query.data) : undefined), [query.data]);
  return { ...queryState(query, enabled), marketDay };
}

/** Read-only HORECA or B2B orders in the caller's scope (BR-85h). The API takes no warehouse filter. */
export function useChannelOrders(
  channel: 'HORECA' | 'B2B',
  options: { enabled?: boolean | undefined } = {},
): CursorList<ChannelOrderRow> {
  const map = useCallback((dto: ChannelOrderListItemDto) => mapChannelOrderListItem(dto), []);
  return useCursorList(
    adminKeys.scoped(SALES_MODULE, undefined, { resource: channel === 'HORECA' ? 'horeca' : 'b2b' }),
    (cursor, signal) => (channel === 'HORECA' ? listSalesHoreca({ cursor }, signal) : listSalesB2b({ cursor }, signal)),
    map,
    { enabled: options.enabled ?? true },
  );
}

/** One HORECA / B2B order through the general admin order detail (order.list.view_all, BR-99). */
export function useChannelOrderDetail(
  orderId: string | undefined,
  options: { enabled?: boolean | undefined } = {},
): LiveQueryState & { order: ChannelOrderDetailView | undefined } {
  const enabled = (options.enabled ?? true) && orderId !== undefined && orderId !== '';
  const query = useAdminQuery(
    adminKeys.scoped(SALES_MODULE, undefined, { resource: 'channel-order', id: orderId ?? null }),
    (signal) => getAdminOrder(orderId ?? '', signal),
    { enabled },
  );
  const order = useMemo(() => (query.data ? mapChannelOrderDetail(query.data) : undefined), [query.data]);
  return { ...queryState(query, enabled), order };
}

/**
 * Real warehouse uuids for a Main / all-scope picker, from GET /warehouses
 * (warehouse.all.view). A Sub admin does not hold it and is never sent there:
 * its only warehouse is scope.warehouseId (BR-30), so `options` stays empty.
 */
export function useSalesWarehouseOptions(scope: WarehouseScope, can: PermissionCheck) {
  const enabled = scope.warehouseId === undefined && can('warehouse.all.view');
  const list = useWarehouseOptions({ enabled });
  const nameOf = useCallback(
    (warehouseId: string | undefined): string | undefined =>
      warehouseId === undefined
        ? undefined
        : warehouseId === scope.warehouseId
          ? scope.warehouseName
          : warehouseOptionName(list.options, warehouseId),
    [list.options, scope.warehouseId, scope.warehouseName],
  );
  return { ...list, nameOf };
}
