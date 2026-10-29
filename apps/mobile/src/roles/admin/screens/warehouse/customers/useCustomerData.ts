/**
 * Live data for the customer area.
 *
 * Hooks over useCursorList, useAdminQuery, and useAdminMutation; mapping is in ./mappers.ts.
 */
import { useCallback, useMemo } from 'react';
import {
  getCustomer,
  getCustomerWallet,
  listCustomerIssues,
  listCustomerOrders,
  listCustomerPurchases,
  listCustomerSupportTickets,
  listCustomers,
  replyToSupportTicket,
  type AdminCustomerDetailDto,
  type AdminCustomerSupportMessageDto,
  type CustomerStatus,
} from '../../../api/customers';
import { useAdminMutation, useAdminQuery, useCursorList, type CursorList } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { useWarehouseOptions } from '../shared/useWarehouseOptions';
import {
  toCustomerIssueRecord,
  toCustomerOrderRecord,
  toCustomerRecord,
  toPurchaseRecord,
  toSupportTicketRecord,
} from './mappers';
import type {
  CustomerIssueRecord,
  CustomerOrderRecord,
  CustomerRecord,
  PermissionCheck,
  PurchaseRecord,
  SupportTicketRecord,
  WarehouseScope,
} from './types';

export { CustomerRecord };

/** The warehouse.all.view code that gates the warehouse picker (Main-only). */
export const CUSTOMER_WAREHOUSE_LIST_CODE = 'warehouse.all.view';

/**
 * The live customer list for the current scope.
 */
export function useCustomerList(
  scope: WarehouseScope,
  can: PermissionCheck,
  selectedWarehouseId?: string | undefined,
  q?: string | undefined,
  status?: CustomerStatus | undefined,
): CursorList<CustomerRecord> {
  const effectiveWarehouseId = scope.warehouseId ?? selectedWarehouseId;

  const warehouses = useWarehouseOptions({
    enabled: can(CUSTOMER_WAREHOUSE_LIST_CODE),
    activeOnly: true,
  });

  const warehouseNames = useMemo((): ReadonlyMap<string, string> => {
    const m = new Map<string, string>();
    for (const o of warehouses.options) m.set(o.warehouseId, o.warehouseName);
    return m;
  }, [warehouses.options]);

  const map = useCallback(
    (dto: Parameters<typeof toCustomerRecord>[0]) => toCustomerRecord(dto, warehouseNames),
    [warehouseNames],
  );

  return useCursorList(
    adminKeys.scoped('customers', effectiveWarehouseId, { resource: 'list', q, status }),
    (cursor, signal) => listCustomers({ cursor, q, status }, signal),
    map,
    { enabled: can('customer.list.view') },
  );
}

/** One customer by UUID */
export function useCustomer(customerId: string | undefined, can: PermissionCheck) {
  return useAdminQuery<AdminCustomerDetailDto>(
    adminKeys.detail('customers', customerId ?? ''),
    (signal) => getCustomer(customerId!, signal),
    { enabled: can('customer.detail.view') && Boolean(customerId) },
  );
}

/** Orders of a customer */
export function useCustomerOrders(customerId: string | undefined, can: PermissionCheck) {
  const query = useAdminQuery(
    adminKeys.detail('customer-orders', customerId ?? ''),
    (signal) => listCustomerOrders(customerId!, {}, signal),
    { enabled: can('customer.purchase_history.view') && Boolean(customerId) },
  );
  const items: CustomerOrderRecord[] = useMemo(
    () => (query.data?.items ?? []).map(toCustomerOrderRecord),
    [query.data?.items],
  );
  return { ...query, items };
}

/** Purchases of a customer */
export function useCustomerPurchases(customerId: string | undefined, can: PermissionCheck) {
  const query = useAdminQuery(
    adminKeys.detail('customer-purchases', customerId ?? ''),
    (signal) => listCustomerPurchases(customerId!, {}, signal),
    { enabled: can('customer.purchase_history.view') && Boolean(customerId) },
  );
  const items: PurchaseRecord[] = useMemo(
    () => (query.data?.items ?? []).map(toPurchaseRecord),
    [query.data?.items],
  );
  return { ...query, items };
}

/** Issues reported by a customer */
export function useCustomerIssues(customerId: string | undefined, can: PermissionCheck) {
  const query = useAdminQuery(
    adminKeys.detail('customer-issues', customerId ?? ''),
    (signal) => listCustomerIssues(customerId!, {}, signal),
    { enabled: can('customer.issues.view') && Boolean(customerId) },
  );
  const items: CustomerIssueRecord[] = useMemo(
    () => (query.data?.items ?? []).map(toCustomerIssueRecord),
    [query.data?.items],
  );
  return { ...query, items };
}

/** Support tickets of a customer */
export function useCustomerSupportTickets(customerId: string | undefined, can: PermissionCheck) {
  const query = useAdminQuery(
    adminKeys.detail('customer-support', customerId ?? ''),
    (signal) => listCustomerSupportTickets(customerId!, {}, signal),
    { enabled: can('customer.support_history.view') && Boolean(customerId) },
  );
  const items: SupportTicketRecord[] = useMemo(
    () => (query.data?.items ?? []).map(toSupportTicketRecord),
    [query.data?.items],
  );
  return { ...query, items };
}

/** Wallet summary of a customer */
export function useCustomerWallet(customerId: string | undefined, can: PermissionCheck) {
  return useAdminQuery(
    adminKeys.detail('customer-wallet', customerId ?? ''),
    (signal) => getCustomerWallet(customerId!, signal),
    { enabled: can('customer.wallet.view') && Boolean(customerId) },
  );
}

/** Reply to a customer support ticket */
export function useReplySupportTicket() {
  return useAdminMutation<
    { customerId: string; ticketId: string; message: string },
    AdminCustomerSupportMessageDto
  >({
    mutationFn: ({ customerId, ticketId, message }) => replyToSupportTicket(customerId, ticketId, { message }),
    invalidates: [adminKeys.module('customers')],
  });
}
