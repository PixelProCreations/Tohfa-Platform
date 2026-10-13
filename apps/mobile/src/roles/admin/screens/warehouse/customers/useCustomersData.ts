/**
 * Live data for the customer area. Thin wrappers over the admin hooks
 * (../../../api/hooks.ts); every decision lives in ./mappers.ts or the API
 * module, which are tested.
 *
 * No customers route takes a warehouse: the server scopes an `own` actor to
 * the customers visible at its warehouse (BR-91). The scope's warehouse is
 * still part of every query key, so one warehouse's cached customers never
 * answer another warehouse's screen (BR-30). Hooks that need a customer take
 * its uuid (customerIdParam); without one nothing is fetched and the screen
 * shows "not found".
 */
import { useCallback, useMemo } from 'react';
import { useAdminMutation, useAdminQuery, useCursorList, type CursorList } from '../../../api/hooks';
import {
  getCustomer,
  getCustomerSupportTicket,
  getCustomerWallet,
  listCustomerIssues,
  listCustomerOrders,
  listCustomerPurchases,
  listCustomerSupportTickets,
  listCustomerWalletTxns,
  listCustomers,
  replyToSupportTicket,
  type AdminCustomerIssueDto,
  type AdminCustomerListItemDto,
  type AdminCustomerOrderDto,
  type AdminCustomerPurchaseDto,
  type AdminCustomerSupportMessageDto,
  type AdminCustomerSupportTicketDto,
  type CustomerListPage,
  type SupportReplyBody,
  type WalletTransactionDto,
} from '../../../api/customers';
import { adminKeys } from '../../../api/queryKeys';
import {
  customerSummary,
  toCustomerIssueRow,
  toCustomerOrderRow,
  toCustomerProfile,
  toCustomerRecord,
  toCustomerWallet,
  toPurchaseRow,
  toSupportTicketDetail,
  toSupportTicketRow,
  toWalletTxnRow,
} from './mappers';
import type {
  CustomerIssueRow,
  CustomerOrderRow,
  CustomerProfileView,
  CustomerRow,
  CustomerSummary,
  CustomerWalletView,
  PurchaseLineRow,
  SupportTicketDetailView,
  SupportTicketRow,
  WalletTxnRow,
} from './types';

const CUSTOMERS = 'customers';

/** What a data screen needs to pick an AsyncState and to refresh. */
export interface LiveQueryState {
  isLoading: boolean;
  error: unknown;
  refresh: () => void;
  isRefreshing: boolean;
}

function queryState(
  query: { isPending: boolean; error: unknown; refetch: () => unknown; isRefetching: boolean },
  enabled: boolean,
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

/** A page fetcher that is never called while its customer id is undefined (`enabled: false`). */
function forCustomer<T>(
  customerId: string | undefined,
  list: (id: string, params: { cursor?: string | undefined }, signal: AbortSignal) => Promise<T>,
) {
  return (cursor: string | undefined, signal: AbortSignal) => list(customerId ?? '', { cursor }, signal);
}

export interface LiveCustomerList extends CursorList<CustomerRow, CustomerListPage> {
  /** The server's counts over the whole visible set; null until the first page loads. */
  summary: CustomerSummary | null;
}

/** The visible customers, page by page; `q` is the server-side search (customerSearchQuery). */
export function useCustomerList(warehouseId: string | undefined, q: string | undefined): LiveCustomerList {
  // The clock is read when a page is mapped, so "Today" is fresh after every fetch.
  const map = useCallback((dto: AdminCustomerListItemDto) => toCustomerRecord(dto, new Date()), []);
  const list = useCursorList<AdminCustomerListItemDto, CustomerRow, CustomerListPage>(
    adminKeys.scoped(CUSTOMERS, warehouseId, { resource: 'list', q: q ?? null }),
    (cursor, signal) => listCustomers({ q, cursor }, signal),
    map,
  );
  return { ...list, summary: customerSummary(list.firstPage?.summary) };
}

export interface LiveCustomer extends LiveQueryState {
  customer: CustomerProfileView | undefined;
}

/** One customer's profile; 404 outside the caller's scope (BR-91c). */
export function useCustomer(warehouseId: string | undefined, customerId: string | undefined): LiveCustomer {
  const enabled = customerId !== undefined;
  const query = useAdminQuery(
    adminKeys.scoped(CUSTOMERS, warehouseId, { resource: 'customer', customerId: customerId ?? null }),
    (signal) => getCustomer(customerId ?? '', signal),
    { enabled },
  );
  const customer = useMemo(() => (query.data === undefined ? undefined : toCustomerProfile(query.data, new Date())), [query.data]);
  return { ...queryState(query, enabled), customer };
}

/** The customer's orders of every channel (BR-91g). */
export function useCustomerOrders(warehouseId: string | undefined, customerId: string | undefined): CursorList<CustomerOrderRow> {
  const map = useCallback((dto: AdminCustomerOrderDto) => toCustomerOrderRow(dto, new Date()), []);
  return useCursorList(
    adminKeys.scoped(CUSTOMERS, warehouseId, { resource: 'orders', customerId: customerId ?? null }),
    forCustomer(customerId, listCustomerOrders),
    map,
    { enabled: customerId !== undefined },
  );
}

/** The customer's purchased lines (line level, BR-91g). */
export function useCustomerPurchases(warehouseId: string | undefined, customerId: string | undefined): CursorList<PurchaseLineRow> {
  const map = useCallback((dto: AdminCustomerPurchaseDto) => toPurchaseRow(dto, new Date()), []);
  return useCursorList(
    adminKeys.scoped(CUSTOMERS, warehouseId, { resource: 'purchases', customerId: customerId ?? null }),
    forCustomer(customerId, listCustomerPurchases),
    map,
    { enabled: customerId !== undefined },
  );
}

export interface LiveCustomerWallet extends LiveQueryState {
  wallet: CustomerWalletView | undefined;
}

/** The read-only wallet summary (BR-93). */
export function useCustomerWallet(warehouseId: string | undefined, customerId: string | undefined): LiveCustomerWallet {
  const enabled = customerId !== undefined;
  const query = useAdminQuery(
    adminKeys.scoped(CUSTOMERS, warehouseId, { resource: 'wallet', customerId: customerId ?? null }),
    (signal) => getCustomerWallet(customerId ?? '', signal),
    { enabled },
  );
  const wallet = useMemo(() => (query.data === undefined ? undefined : toCustomerWallet(query.data, new Date())), [query.data]);
  return { ...queryState(query, enabled), wallet };
}

/** The wallet ledger, newest first (read-only, BR-93). */
export function useCustomerWalletTxns(warehouseId: string | undefined, customerId: string | undefined): CursorList<WalletTxnRow> {
  const map = useCallback((dto: WalletTransactionDto) => toWalletTxnRow(dto, new Date()), []);
  return useCursorList(
    adminKeys.scoped(CUSTOMERS, warehouseId, { resource: 'walletTxns', customerId: customerId ?? null }),
    forCustomer(customerId, listCustomerWalletTxns),
    map,
    { enabled: customerId !== undefined },
  );
}

/** The customer's issues (return requests), newest first (BR-91h). */
export function useCustomerIssues(warehouseId: string | undefined, customerId: string | undefined): CursorList<CustomerIssueRow> {
  const map = useCallback((dto: AdminCustomerIssueDto) => toCustomerIssueRow(dto, new Date()), []);
  return useCursorList(
    adminKeys.scoped(CUSTOMERS, warehouseId, { resource: 'issues', customerId: customerId ?? null }),
    forCustomer(customerId, listCustomerIssues),
    map,
    { enabled: customerId !== undefined },
  );
}

/** The customer's support tickets, newest first (BR-97). */
export function useCustomerSupportTickets(
  warehouseId: string | undefined,
  customerId: string | undefined,
): CursorList<SupportTicketRow> {
  const map = useCallback((dto: AdminCustomerSupportTicketDto) => toSupportTicketRow(dto, new Date()), []);
  return useCursorList(
    adminKeys.scoped(CUSTOMERS, warehouseId, { resource: 'tickets', customerId: customerId ?? null }),
    forCustomer(customerId, listCustomerSupportTickets),
    map,
    { enabled: customerId !== undefined },
  );
}

export interface LiveSupportTicket extends LiveQueryState {
  ticket: SupportTicketDetailView | undefined;
}

function ticketKey(warehouseId: string | undefined, customerId: string | undefined, ticketId: string | undefined) {
  return adminKeys.scoped(CUSTOMERS, warehouseId, { resource: 'ticket', customerId: customerId ?? null, ticketId: ticketId ?? null });
}

/** One ticket and its thread (redacted for `own`, BR-97). */
export function useCustomerSupportTicket(
  warehouseId: string | undefined,
  customerId: string | undefined,
  ticketId: string | undefined,
): LiveSupportTicket {
  const enabled = customerId !== undefined && ticketId !== undefined;
  const query = useAdminQuery(
    ticketKey(warehouseId, customerId, ticketId),
    (signal) => getCustomerSupportTicket(customerId ?? '', ticketId ?? '', signal),
    { enabled },
  );
  const ticket = useMemo(() => (query.data === undefined ? undefined : toSupportTicketDetail(query.data, new Date())), [query.data]);
  return { ...queryState(query, enabled), ticket };
}

export interface LiveSupportReply {
  /** Sends the reply body (supportReplyBody); `onDone` fires after it is stored. */
  run: (body: SupportReplyBody, onDone?: () => void) => void;
  isPending: boolean;
  /** The last failure, for adminErrorKey (409 on a CLOSED ticket, 422 naming a farmer, BR-97c/i). */
  error: unknown;
  reset: () => void;
}

/**
 * The ticket reply (POST .../replies). A success refetches the thread and the
 * customer's ticket list, so the new message and the ticket's counts show. No
 * Idempotency-Key: the spec defines none for this route (see api/customers.ts).
 */
export function useSupportReply(
  warehouseId: string | undefined,
  customerId: string | undefined,
  ticketId: string | undefined,
): LiveSupportReply {
  const mutation = useAdminMutation<SupportReplyBody, AdminCustomerSupportMessageDto>({
    mutationFn: (body) => {
      if (customerId === undefined || ticketId === undefined) return Promise.reject(new Error('No ticket to reply to.'));
      return replyToSupportTicket(customerId, ticketId, body);
    },
    invalidates: [
      ticketKey(warehouseId, customerId, ticketId),
      adminKeys.scoped(CUSTOMERS, warehouseId, { resource: 'tickets', customerId: customerId ?? null }),
    ],
  });
  const { mutate, isPending, error, reset } = mutation;
  return useMemo(
    () => ({
      run: (body: SupportReplyBody, onDone?: () => void) => {
        if (isPending) return;
        if (onDone === undefined) mutate(body);
        else mutate(body, { onSuccess: () => onDone() });
      },
      isPending,
      error,
      reset,
    }),
    [mutate, isPending, error, reset],
  );
}
