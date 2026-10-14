/**
 * Live queries and mutations for the warehouse direct and channel sales screens (M6).
 * Built on TanStack Query hooks via roles/admin/api/hooks.ts.
 */
import { useCallback, useMemo } from 'react';
import {
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
  type SaleCreateDto,
  type SaleCustomerMatchDto,
  type SaleDto,
  type SaleListItemDto,
  type SaleProductDto,
  type SaleQuoteDto,
  type SaleQuoteRequestDto,
  type SalesDashboardSummaryDto,
  type SalesMarketDayDto,
  type SaleUpiConfirmDto,
} from '../../../api/sales';
import { useAdminMutation, useAdminQuery, useCursorList, type CursorList } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import {
  mapChannelOrderListItem,
  mapSale,
  mapSaleCustomerMatch,
  mapSaleListItem,
  mapSaleProduct,
  mapSaleQuote,
  mapSalesMarketDay,
  type MappedChannelOrderItem,
  type MappedSale,
  type MappedSaleCustomerMatch,
  type MappedSaleListItem,
  type MappedSaleProduct,
  type MappedSaleQuote,
  type MappedSalesMarketDay,
} from './mappers';

const SALES = 'sales';

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

export function useSaleProducts(warehouseId: string | undefined): LiveQueryState & { products: MappedSaleProduct[] } {
  const query = useAdminQuery(
    adminKeys.scoped(SALES, warehouseId, { resource: 'products' }),
    (signal) => listSaleProducts({ warehouseId }, signal),
  );
  const products = useMemo(
    () => (query.data?.items ?? []).map(mapSaleProduct),
    [query.data],
  );
  return { ...queryState(query), products };
}

export function useSaleCustomerLookup(
  phone: string,
  warehouseId: string | undefined,
): LiveQueryState & { customer: MappedSaleCustomerMatch | null } {
  const cleanPhone = phone.trim();
  const enabled = cleanPhone.length >= 10;
  const query = useAdminQuery(
    adminKeys.scoped(SALES, warehouseId, { resource: 'customer-lookup', phone: cleanPhone }),
    (signal) => lookupSaleCustomer({ phone: cleanPhone, warehouseId }, signal),
    { enabled },
  );
  const customer = useMemo(
    () => (query.data?.customer ? mapSaleCustomerMatch(query.data.customer) : null),
    [query.data],
  );
  return { ...queryState(query), isLoading: enabled && query.isPending, customer };
}

export function useQuoteSaleMutation() {
  return useAdminMutation({
    mutationFn: (body: SaleQuoteRequestDto) => quoteSale(body),
  });
}

export function useCreateSaleMutation() {
  return useAdminMutation({
    mutationFn: ({ body, idempotencyKey }: { body: SaleCreateDto; idempotencyKey: string }) =>
      createSale(body, idempotencyKey),
    invalidates: [adminKeys.module(SALES)],
  });
}

export function useConfirmSaleUpiPaymentMutation() {
  return useAdminMutation({
    mutationFn: ({
      saleId,
      body,
      idempotencyKey,
    }: {
      saleId: string;
      body: SaleUpiConfirmDto;
      idempotencyKey: string;
    }) => confirmSaleUpiPayment(saleId, body, idempotencyKey),
    invalidates: [adminKeys.module(SALES)],
  });
}

export interface SaleListFilters {
  channel?: 'DIRECT' | 'MARKET' | undefined;
  status?: 'PENDING_PAYMENT' | 'PICKED_UP' | 'CANCELLED' | undefined;
  from?: string | undefined;
  to?: string | undefined;
}

export function useSalesList(
  warehouseId: string | undefined,
  filters: SaleListFilters = {},
): CursorList<MappedSaleListItem> {
  const map = useCallback((dto: SaleListItemDto) => mapSaleListItem(dto), []);
  return useCursorList(
    adminKeys.scoped(SALES, warehouseId, { resource: 'sales-list', ...filters }),
    (cursor, signal) => listSales({ ...filters, warehouseId, cursor }, signal),
    map,
  );
}

export function useSale(saleId: string | undefined): LiveQueryState & { sale: MappedSale | undefined } {
  const query = useAdminQuery(
    adminKeys.scoped(SALES, undefined, { resource: 'sale-detail', id: saleId ?? null }),
    (signal) => getSale(saleId ?? '', signal),
    { enabled: saleId !== undefined },
  );
  const sale = useMemo(() => (query.data ? mapSale(query.data) : undefined), [query.data]);
  return { ...queryState(query), isLoading: saleId !== undefined && query.isPending, sale };
}

export function useSalesSummary(
  warehouseId: string | undefined,
  from: string,
  to: string,
): LiveQueryState & { summary: SalesDashboardSummaryDto | undefined } {
  const query = useAdminQuery(
    adminKeys.scoped(SALES, warehouseId, { resource: 'summary', from, to }),
    (signal) => getSalesSummary({ warehouseId, from, to }, signal),
    { enabled: Boolean(from && to) },
  );
  return { ...queryState(query), summary: query.data };
}

export function useSalesMarketDay(
  warehouseId: string | undefined,
  date?: string | undefined,
): LiveQueryState & { marketDay: MappedSalesMarketDay | undefined } {
  const query = useAdminQuery(
    adminKeys.scoped(SALES, warehouseId, { resource: 'market-day', date: date ?? 'today' }),
    (signal) => getSalesMarketDay({ warehouseId, date }, signal),
  );
  const marketDay = useMemo(() => (query.data ? mapSalesMarketDay(query.data) : undefined), [query.data]);
  return { ...queryState(query), marketDay };
}

export function useSalesHorecaList(): CursorList<MappedChannelOrderItem> {
  const map = useCallback((dto: ChannelOrderListItemDto) => mapChannelOrderListItem(dto), []);
  return useCursorList(
    adminKeys.scoped(SALES, undefined, { resource: 'horeca' }),
    (cursor, signal) => listSalesHoreca({ cursor }, signal),
    map,
  );
}

export function useSalesB2bList(): CursorList<MappedChannelOrderItem> {
  const map = useCallback((dto: ChannelOrderListItemDto) => mapChannelOrderListItem(dto), []);
  return useCursorList(
    adminKeys.scoped(SALES, undefined, { resource: 'b2b' }),
    (cursor, signal) => listSalesB2b({ cursor }, signal),
    map,
  );
}
