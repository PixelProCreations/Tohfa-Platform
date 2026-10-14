/**
 * The warehouse admin's view of a customer (docs/openapi.yaml tag Customers):
 *   GET  /admin/customers                                  customer.list.view             (BR-91, BR-92, BR-98)
 *   GET  /admin/customers/{id}                             customer.detail.view           (BR-91, BR-92)
 *   GET  /admin/customers/{id}/purchases                   customer.purchase_history.view (BR-91g, BR-90)
 *   GET  /admin/customers/{id}/orders                      customer.purchase_history.view (BR-91g, BR-90)
 *   GET  /admin/customers/{id}/wallet                      customer.wallet.view           (BR-93)
 *   GET  /admin/customers/{id}/wallet/transactions         customer.wallet.view           (BR-93)
 *   GET  /admin/customers/{id}/wallet/transactions/{txnId} customer.wallet.view           (BR-93d)
 *   GET  /admin/customers/{id}/issues                      customer.issues.view           (BR-91h)
 *   GET  /admin/customers/{id}/support-tickets             customer.support_history.view  (BR-97)
 *   GET  /admin/customers/{id}/support-tickets/{ticketId}  customer.support_history.view  (BR-97)
 *   POST /admin/customers/{id}/support-tickets/{ticketId}/replies
 *        support.ticket.respond + customer.support_history.view (BR-97, double gate)
 *
 * Scope is the server's (BR-91): an `own` actor (the Sub Warehouse Admin) sees
 * only customers with an order or a top-up at its warehouse, or who prefer it;
 * any other id is 404, never 403. No route takes a warehouseId (the list query
 * is strict, so one would be a 422), so this module never sends one (BR-30).
 *
 * Masking is the server's too (BR-92): for an `own` actor every customer
 * carries `piiMasked: true`, `mobileMasked` and NO `mobile`, `email` or
 * `addresses` key. The types keep those keys optional; the mappers show the
 * masked mobile as sent and never try to recover the full number.
 *
 * Read-only wallet (BR-93): there is no credit, debit, adjustment or top-up
 * route under /admin/customers, and this module exports none. The cash top-up
 * is a separate surface (POST /wallet/topups/cash, plan phase 9).
 *
 * The reply takes no Idempotency-Key: the spec defines none for it (it moves
 * no money). A retried reply after a timeout can therefore be stored twice
 * (server gap); the screen re-reads the thread before offering a retry.
 *
 * Money stays as the API's decimal string (`Money`) and weights as kg strings;
 * the screens' mappers turn them into integer paise and grams. Ids are uuids;
 * `customerCode` ('CUS-…') is the human code and never a key.
 *
 * No UI imports, so the Main Warehouse admin can reuse this module.
 */
import type { ErrorCode, GenericProblemCode, Money } from '@tohfa/shared-types';
import type { Page } from '../../../shell/api/pagination';
import { adminGet, adminPost } from './http';
import type { Grade, QuantityKg } from './inventory';
import type { AdminOrderStatus, AdminPaymentMethod, OrderPaymentStatus, SalesChannel } from './orders';

/** docs/openapi.yaml AdminCustomerListItem.status (derived from the BR-98 window). */
export type CustomerStatus = 'ACTIVE' | 'INACTIVE';

/** docs/openapi.yaml CustomerStatusFilterParam: the list's `status` filter (NEW = created within the window). */
export type CustomerStatusFilter = 'ACTIVE' | 'INACTIVE' | 'NEW';

/** docs/openapi.yaml AdminCustomerListItem.customerType. */
export type CustomerType = 'RETAIL' | 'B2B' | 'HORECA';

/** docs/openapi.yaml AdminCustomerWalletSummary.status (the wallets.status CHECK). */
export type WalletStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';

/** docs/openapi.yaml WalletTransactionType. */
export type WalletTransactionType =
  | 'TOPUP_CASH'
  | 'TOPUP_DIGITAL'
  | 'ORDER_DEBIT'
  | 'ORDER_REFUND'
  | 'PAYOUT_DEBIT'
  | 'SALE_CREDIT'
  | 'SUBSCRIPTION_DEBIT'
  | 'ADJUSTMENT';

/** docs/openapi.yaml ReturnStatus (an issue is a return request today). */
export type ReturnStatus = 'PENDING' | 'INSPECTED' | 'APPROVED' | 'REJECTED' | 'REFUND_PENDING_BANK' | 'REFUNDED';

/** docs/openapi.yaml AdminCustomerSupportTicket.status (the stored INVESTIGATING is sent as IN_PROGRESS). */
export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

/** docs/openapi.yaml AdminCustomerSupportTicket.categoryCode. */
export type SupportTicketCategory = 'QUALITY' | 'QUANTITY' | 'MISSING' | 'WRONG_ITEM' | 'DAMAGED' | 'LATE' | 'PAYMENT' | 'OTHER';

/** docs/openapi.yaml AdminCustomerSupportTicket.priority. */
export type SupportTicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

/** docs/openapi.yaml AdminCustomerListItem: an allow-list with no farm field (BR-16). */
export interface AdminCustomerListItemDto {
  id: string;
  customerCode: string;
  name: string;
  /** MaskedMobile, e.g. `******1234` (BR-92). Always present. */
  mobileMasked: string;
  /** Present only when piiMasked is false (scope `all`). */
  mobile?: string;
  /** Present only when piiMasked is false (scope `all`). */
  email?: string | null;
  customerType: CustomerType;
  status: CustomerStatus;
  isNew: boolean;
  preferredWarehouseId: string | null;
  totalOrders: number;
  lastActivityAt: string | null;
  /** True when the caller's scope is `own` (BR-92). */
  piiMasked: boolean;
  createdAt: string;
}

/** docs/openapi.yaml AdminCustomerListResponse.summary: counts over the whole visible set (BR-91e). */
export interface CustomerListSummaryDto {
  total: number;
  active: number;
  new: number;
}

/** docs/openapi.yaml AdminCustomerListResponse: a cursor page plus the summary. */
export interface CustomerListPage extends Page<AdminCustomerListItemDto> {
  summary: CustomerListSummaryDto;
}

/** One address of AdminCustomerDetail; present only when piiMasked is false. */
export interface AdminCustomerAddressDto {
  id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string | null;
  pincode: string;
  isDefault: boolean;
}

/** docs/openapi.yaml AdminCustomerDetail: an allow-list with no farm field (BR-16, BR-92). */
export interface AdminCustomerDetailDto {
  id: string;
  customerCode: string;
  name: string;
  mobileMasked: string;
  mobile?: string;
  email?: string | null;
  addresses?: AdminCustomerAddressDto[];
  customerType: CustomerType;
  businessName: string | null;
  status: CustomerStatus;
  isNew: boolean;
  preferredWarehouseId: string | null;
  totalOrders: number;
  /** Confined to the caller's warehouse for `own` (BR-91g). */
  lifetimeValue: Money;
  /** Sum of the wallet ledger; `0.00` when the customer has no wallet. */
  walletBalance: Money;
  lastOrderAt: string | null;
  lastActivityAt: string | null;
  piiMasked: boolean;
  createdAt: string;
}

/** docs/openapi.yaml AdminCustomerPurchase: one purchased order LINE, farm-anonymous (BR-16, BR-90). */
export interface AdminCustomerPurchaseDto {
  orderId: string;
  orderNumber: string;
  channel: SalesChannel;
  warehouseId: string;
  productId: string;
  productName: string;
  grade: Grade;
  qtyKg: QuantityKg;
  unitPrice: Money;
  lineTotal: Money;
  purchasedAt: string;
}

/** docs/openapi.yaml AdminCustomerOrder: every channel, farm-anonymous (BR-16, BR-90). */
export interface AdminCustomerOrderDto {
  id: string;
  orderNumber: string;
  channel: SalesChannel;
  /** Every value of the database order_status enum (the AdminOrderDetail enum). */
  status: AdminOrderStatus;
  paymentStatus: OrderPaymentStatus;
  paymentMethod: AdminPaymentMethod | null;
  warehouseId: string;
  itemCount: number;
  totalAmount: Money;
  /** Latest non-cancelled sale invoice of the order; null when none. */
  invoiceNumber: string | null;
  placedAt: string;
  completedAt: string | null;
}

/** docs/openapi.yaml AdminCustomerWalletSummary: read-only (BR-93). */
export interface AdminCustomerWalletSummaryDto {
  customerId: string;
  walletId: string;
  /** Equals the sum of the ledger exactly (BR-93e). */
  balance: Money;
  currency: 'INR';
  status: WalletStatus;
  transactionCount: number;
  lastTransactionAt: string | null;
}

/** docs/openapi.yaml WalletTransaction: one ledger row; every key always present. */
export interface WalletTransactionDto {
  id: string;
  walletId: string;
  txnType: WalletTransactionType;
  /** Signed: negative for debits. */
  amount: Money;
  balanceAfter: Money;
  refType: string | null;
  refId: string | null;
  /** Present on cash top-ups (BR-18). */
  fiscalCashTag: string | null;
  warehouseId: string | null;
  performedBy: string | null;
  performedAt: string;
  remarks: string | null;
}

/** docs/openapi.yaml AdminCustomerIssue: a return request; `reference`, `refundAmount`, `resolvedAt` are derived (BR-91h). */
export interface AdminCustomerIssueDto {
  /** The return request id: the only key. */
  id: string;
  kind: 'RETURN';
  /** Display label `RET-` + 8 hex of the id; NOT unique, never a key. */
  reference: string;
  orderId: string | null;
  orderNumber: string | null;
  status: ReturnStatus;
  reason: string | null;
  /** ABSENT (not null) until an inspection recorded an accepted quantity. */
  refundAmount?: Money;
  createdAt: string;
  resolvedAt: string | null;
}

/** docs/openapi.yaml AdminCustomerSupportTicket: no farmer field, no customer contact (BR-97, BR-92). */
export interface AdminCustomerSupportTicketDto {
  id: string;
  ticketNumber: string;
  categoryCode: SupportTicketCategory;
  /** Farmer-identifying text replaced by `[redacted]` for an `own` actor (BR-97). */
  subject: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  messageCount: number;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** docs/openapi.yaml AdminCustomerSupportMessage: one append-only thread message (BR-97). */
export interface AdminCustomerSupportMessageDto {
  id: string;
  ticketId: string;
  senderUserId: string | null;
  /** Derived: CUSTOMER for the ticket's customer, otherwise the sender's role code. */
  senderRole: string;
  message: string;
  isInternal: boolean;
  /** True when the server replaced farmer-identifying text (BR-97). */
  redacted: boolean;
  /** A storage key, not a signed URL. */
  attachmentUrl: string | null;
  createdAt: string;
}

/** docs/openapi.yaml AdminCustomerSupportTicketDetail: the ticket plus its thread, oldest first. */
export interface AdminCustomerSupportTicketDetailDto extends AdminCustomerSupportTicketDto {
  description: string;
  messages: AdminCustomerSupportMessageDto[];
}

/** docs/openapi.yaml AdminCustomerSupportReplyRequest. */
export interface SupportReplyBody {
  /** 1-2000 characters after trimming. */
  message: string;
  /** A storage key, 1-2048 characters. */
  attachmentUrl?: string;
}

export interface ListCustomersParams {
  /** Name or customer code (mobile only for scope `all`, BR-92h); 1-100 characters after trimming. */
  q?: string | undefined;
  status?: CustomerStatusFilter | undefined;
  cursor?: string | undefined;
  /** 1-100, server default 20. */
  limit?: number | undefined;
}

export interface CustomerPageParams {
  cursor?: string | undefined;
  limit?: number | undefined;
}

/**
 * Problem codes these endpoints document: 401/403/404/422/500 on every route
 * (404 for a customer, ticket or transaction outside the scope, BR-91c/BR-93d),
 * and 409 CONFLICT on a reply to a CLOSED ticket (BR-97i). A reply naming a
 * farmer identity is 422 VALIDATION_FAILED with errors["body.message"] (BR-97c).
 */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION_FAILED',
  'INTERNAL',
];

const BASE = '/admin/customers';

function customerPath(customerId: string): string {
  return `${BASE}/${encodeURIComponent(customerId)}`;
}

/** Only cursor and limit: a sub-resource takes nothing else (no warehouseId, BR-30). */
function pageQuery(params: CustomerPageParams): { cursor: string | undefined; limit: number | undefined } {
  return { cursor: params.cursor, limit: params.limit };
}

/** A page of the visible customers plus the summary of the whole visible set (BR-91, BR-91e). */
export function listCustomers(params: ListCustomersParams = {}, signal?: AbortSignal): Promise<CustomerListPage> {
  return adminGet<CustomerListPage>(
    BASE,
    { q: params.q, status: params.status, cursor: params.cursor, limit: params.limit },
    signal,
  );
}

/** One customer; 404 outside the caller's scope (BR-91c). Masked for `own` (BR-92). */
export function getCustomer(customerId: string, signal?: AbortSignal): Promise<AdminCustomerDetailDto> {
  return adminGet<AdminCustomerDetailDto>(customerPath(customerId), undefined, signal);
}

/** Purchased order lines, newest first; confined to the caller's warehouse for `own` (BR-91g). */
export function listCustomerPurchases(
  customerId: string,
  params: CustomerPageParams = {},
  signal?: AbortSignal,
): Promise<Page<AdminCustomerPurchaseDto>> {
  return adminGet<Page<AdminCustomerPurchaseDto>>(`${customerPath(customerId)}/purchases`, pageQuery(params), signal);
}

/** The customer's orders of every channel, newest first; confined like purchases (BR-91g). */
export function listCustomerOrders(
  customerId: string,
  params: CustomerPageParams = {},
  signal?: AbortSignal,
): Promise<Page<AdminCustomerOrderDto>> {
  return adminGet<Page<AdminCustomerOrderDto>>(`${customerPath(customerId)}/orders`, pageQuery(params), signal);
}

/** The wallet summary (read-only, BR-93). */
export function getCustomerWallet(customerId: string, signal?: AbortSignal): Promise<AdminCustomerWalletSummaryDto> {
  return adminGet<AdminCustomerWalletSummaryDto>(`${customerPath(customerId)}/wallet`, undefined, signal);
}

/** The wallet ledger, newest first (read-only, BR-93). */
export function listCustomerWalletTxns(
  customerId: string,
  params: CustomerPageParams = {},
  signal?: AbortSignal,
): Promise<Page<WalletTransactionDto>> {
  return adminGet<Page<WalletTransactionDto>>(`${customerPath(customerId)}/wallet/transactions`, pageQuery(params), signal);
}

/** One ledger row; 404 when it belongs to another customer's wallet (BR-93d). */
export function getCustomerWalletTxn(customerId: string, txnId: string, signal?: AbortSignal): Promise<WalletTransactionDto> {
  return adminGet<WalletTransactionDto>(
    `${customerPath(customerId)}/wallet/transactions/${encodeURIComponent(txnId)}`,
    undefined,
    signal,
  );
}

/** The customer's issues (return requests), newest first (BR-91h). */
export function listCustomerIssues(
  customerId: string,
  params: CustomerPageParams = {},
  signal?: AbortSignal,
): Promise<Page<AdminCustomerIssueDto>> {
  return adminGet<Page<AdminCustomerIssueDto>>(`${customerPath(customerId)}/issues`, pageQuery(params), signal);
}

/** The customer's support tickets, newest first (BR-97). */
export function listCustomerSupportTickets(
  customerId: string,
  params: CustomerPageParams = {},
  signal?: AbortSignal,
): Promise<Page<AdminCustomerSupportTicketDto>> {
  return adminGet<Page<AdminCustomerSupportTicketDto>>(`${customerPath(customerId)}/support-tickets`, pageQuery(params), signal);
}

/** One ticket and its thread, oldest first; redacted for `own` (BR-97). */
export function getCustomerSupportTicket(
  customerId: string,
  ticketId: string,
  signal?: AbortSignal,
): Promise<AdminCustomerSupportTicketDetailDto> {
  return adminGet<AdminCustomerSupportTicketDetailDto>(
    `${customerPath(customerId)}/support-tickets/${encodeURIComponent(ticketId)}`,
    undefined,
    signal,
  );
}

/**
 * Append a reply to the thread (201, the stored message). Sends the reply body
 * only, built field by field, so nothing else a caller holds (a customer id,
 * an internal flag, a farm name) can ride along (BR-97). 409 on a CLOSED
 * ticket; 422 when the text names a farmer identity (BR-97c).
 */
export function replyToSupportTicket(
  customerId: string,
  ticketId: string,
  body: SupportReplyBody,
): Promise<AdminCustomerSupportMessageDto> {
  const payload: SupportReplyBody =
    body.attachmentUrl === undefined ? { message: body.message } : { message: body.message, attachmentUrl: body.attachmentUrl };
  return adminPost<AdminCustomerSupportMessageDto>(
    `${customerPath(customerId)}/support-tickets/${encodeURIComponent(ticketId)}/replies`,
    payload,
  );
}
