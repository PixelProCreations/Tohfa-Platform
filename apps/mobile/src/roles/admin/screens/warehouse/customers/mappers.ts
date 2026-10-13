/**
 * The customers API rows -> the customer screens' types. Pure (no React), so
 * plain-Node vitest covers every rule (../../../tests/mappers_customers.test.ts).
 *
 * Money becomes integer paise (parseMoney/toPaise through the order area's
 * moneyToPaise) and weight integer grams (parseKgToGrams), read as text and
 * never through a float. A figure the server did not send shows as "no value",
 * never as 0.
 *
 * What the server decides is shown as sent, never recomputed here:
 *  - the masked mobile (BR-92). For a masked (`own`) profile no full mobile or
 *    e-mail is kept at all, even if a response carried one, and the call and
 *    e-mail actions are off (contactActions);
 *  - the issue reference (BR-91h), a label only; the id is the key;
 *  - the wallet balance (BR-93e).
 *
 * Every mapper is an allow-list: it copies named fields only, so a farm or
 * farmer field a future server might add can never reach a screen (BR-16).
 * Statuses go through exhaustive tables with an 'unknown' fallback.
 */
import { type Paise } from '@tohfa/shared-types';
import type {
  AdminCustomerDetailDto,
  AdminCustomerIssueDto,
  AdminCustomerListItemDto,
  AdminCustomerOrderDto,
  AdminCustomerPurchaseDto,
  AdminCustomerSupportMessageDto,
  AdminCustomerSupportTicketDetailDto,
  AdminCustomerSupportTicketDto,
  AdminCustomerWalletSummaryDto,
  CustomerListSummaryDto,
  CustomerStatus,
  CustomerType,
  ReturnStatus,
  SupportReplyBody,
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
  WalletStatus,
  WalletTransactionDto,
  WalletTransactionType,
} from '../../../api/customers';
import type { SalesChannel } from '../../../api/orders';
import { t, type TranslationKey } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import { formatKg, parseKgToGrams } from '../../../money/quantity';
import type { AdminTone } from '../../../theme';
import { formatAdminDate, formatAdminDay } from '../../../utils/datetime';
import { gradeLabel } from '../inventory/mappers';
import { detailStatusOf, moneyToPaise, orderStatusLabel, orderStatusTone } from '../orders/mappers';
import type { OrderStatusTone, OrderUiStatus } from '../orders/types';
import type { WalletTransactionRecord } from '../wallet-cashtopup/types';
import type {
  CustomerContactActions,
  CustomerIssueRow,
  CustomerOrderCategory,
  CustomerOrderRow,
  CustomerProfileView,
  CustomerRow,
  CustomerSummary,
  CustomerUiStatus,
  IssueUiStatus,
  PurchaseLineRow,
  SupportMessageView,
  SupportTicketDetailView,
  SupportTicketRow,
  TicketUiStatus,
  WalletTxnRow,
  WalletTxnUiType,
  WalletUiStatus,
  CustomerWalletView,
} from './types';

function has<K extends string>(table: Readonly<Record<K, unknown>>, key: string): key is K {
  return Object.prototype.hasOwnProperty.call(table, key);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** docs/openapi.yaml AdminCustomerSupportReplyRequest.message maxLength. */
const REPLY_MAX_LENGTH = 2000;
/** docs/openapi.yaml listAdminCustomers `q` maxLength. */
const SEARCH_MAX_LENGTH = 100;

function noValue(): string {
  return t('customers.noValue');
}

function paiseLabel(paise: Paise | null): string {
  return paise === null ? noValue() : formatPaise(paise);
}

function countOf(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function dateLabel(iso: string | null | undefined, now: Date): string {
  if (typeof iso !== 'string') return noValue();
  return formatAdminDate(iso, now) || noValue();
}

function dayLabel(iso: string | null | undefined): string {
  if (typeof iso !== 'string') return noValue();
  return formatAdminDay(iso) || noValue();
}

function textOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

// ─── Ids and search ──────────────────────────────────────────────────────────

/**
 * A customer uuid, or undefined. Deep links and the wallet search still carry
 * a human code ('CUS-00291'); that is not an id the API can look up, so the
 * screen shows "not found" instead of sending it.
 */
export function customerIdParam(value: unknown): string | undefined {
  return uuidParam(value);
}

/** Any uuid route value (a ticket id), or undefined. */
export function uuidParam(value: unknown): string | undefined {
  return typeof value === 'string' && UUID_RE.test(value) ? value : undefined;
}

/**
 * The list's `q`: trimmed, never blank (a whitespace-only q is a 422) and at
 * most 100 characters (BR-92h). undefined means "no search".
 */
export function customerSearchQuery(text: string): string | undefined {
  const trimmed = text.trim();
  if (trimmed === '') return undefined;
  return trimmed.slice(0, SEARCH_MAX_LENGTH);
}

// ─── Customer status and type ────────────────────────────────────────────────

/** docs/openapi.yaml AdminCustomerListItem.status, every value. */
export const CUSTOMER_STATUS_TABLE: Readonly<Record<CustomerStatus, CustomerUiStatus>> = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

const CUSTOMER_STATUS_LABEL: Readonly<Record<CustomerUiStatus, TranslationKey>> = {
  active: 'customers.status.active',
  inactive: 'customers.status.inactive',
  unknown: 'customers.status.unknown',
};

const CUSTOMER_STATUS_TONE: Readonly<Record<CustomerUiStatus, AdminTone>> = {
  active: 'success',
  inactive: 'danger',
  unknown: 'brandSoft',
};

export function customerStatusOf(status: string): CustomerUiStatus {
  return has(CUSTOMER_STATUS_TABLE, status) ? CUSTOMER_STATUS_TABLE[status] : 'unknown';
}

/** docs/openapi.yaml AdminCustomerListItem.customerType, every value. */
export const CUSTOMER_TYPE_TABLE: Readonly<Record<CustomerType, TranslationKey>> = {
  RETAIL: 'customers.type.RETAIL',
  B2B: 'customers.type.B2B',
  HORECA: 'customers.type.HORECA',
};

function customerTypeLabel(type: string): string {
  return has(CUSTOMER_TYPE_TABLE, type) ? t(CUSTOMER_TYPE_TABLE[type]) : noValue();
}

// ─── List ────────────────────────────────────────────────────────────────────

export function toCustomerRecord(dto: AdminCustomerListItemDto, now: Date): CustomerRow {
  const status = customerStatusOf(dto.status);
  return {
    id: dto.id,
    code: dto.customerCode,
    name: dto.name,
    mobileMasked: dto.mobileMasked,
    piiMasked: dto.piiMasked,
    status,
    statusLabel: t(CUSTOMER_STATUS_LABEL[status]),
    tone: CUSTOMER_STATUS_TONE[status],
    isNew: dto.isNew === true,
    customerTypeLabel: customerTypeLabel(dto.customerType),
    totalOrders: countOf(dto.totalOrders),
    lastActivityLabel: dto.lastActivityAt === null ? noValue() : relativeDay(dto.lastActivityAt, now),
  };
}

/** "Today", "Yesterday" or the IST date: the list shows the day of the last activity. */
function relativeDay(iso: string, now: Date): string {
  const label = formatAdminDate(iso, now);
  if (label === '') return noValue();
  const day = formatAdminDay(iso);
  const today = formatAdminDay(now);
  const yesterday = formatAdminDay(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  if (day === today) return t('datetime.today');
  if (day === yesterday) return t('datetime.yesterday');
  return day;
}

/** The list KPIs from the server summary; null until the first page loads (no value, never 0). */
export function customerSummary(summary: CustomerListSummaryDto | undefined): CustomerSummary | null {
  if (summary === undefined) return null;
  const total = countOf(summary.total);
  const active = countOf(summary.active);
  const fresh = countOf(summary.new);
  if (total === null || active === null || fresh === null) return null;
  return { total, active, new: fresh };
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export function toCustomerProfile(dto: AdminCustomerDetailDto, now: Date): CustomerProfileView {
  const status = customerStatusOf(dto.status);
  const lifetimeValuePaise = moneyToPaise(dto.lifetimeValue);
  const walletBalancePaise = moneyToPaise(dto.walletBalance);
  // Masked means masked: full values are dropped here even if a response carried them (BR-92).
  const masked = dto.piiMasked !== false;
  return {
    id: dto.id,
    code: dto.customerCode,
    name: dto.name,
    mobileMasked: dto.mobileMasked,
    piiMasked: masked,
    contact: masked ? { mobile: null, email: null } : { mobile: textOrNull(dto.mobile), email: textOrNull(dto.email) },
    status,
    statusLabel: t(CUSTOMER_STATUS_LABEL[status]),
    tone: CUSTOMER_STATUS_TONE[status],
    isNew: dto.isNew === true,
    customerTypeLabel: customerTypeLabel(dto.customerType),
    businessName: textOrNull(dto.businessName),
    totalOrders: countOf(dto.totalOrders),
    lifetimeValuePaise,
    lifetimeValueLabel: paiseLabel(lifetimeValuePaise),
    walletBalancePaise,
    walletBalanceLabel: paiseLabel(walletBalancePaise),
    lastOrderLabel: dateLabel(dto.lastOrderAt, now),
    lastActivityLabel: dateLabel(dto.lastActivityAt, now),
    registeredLabel: dayLabel(dto.createdAt),
  };
}

/** Call and e-mail only for an unmasked profile whose server sent the value (BR-92, BR-92a). */
export function contactActions(profile: Pick<CustomerProfileView, 'piiMasked' | 'contact'>): CustomerContactActions {
  if (profile.piiMasked) return { call: false, email: false };
  return { call: profile.contact.mobile !== null, email: profile.contact.email !== null };
}

/** The mobile to show: the masked one exactly as sent, unless the server sent the full one (scope `all`). */
export function mobileLabel(profile: Pick<CustomerProfileView, 'piiMasked' | 'contact' | 'mobileMasked'>): string {
  if (!profile.piiMasked && profile.contact.mobile !== null) return profile.contact.mobile;
  return profile.mobileMasked;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

/** The customer-order tab of every order status the app knows; unknown is listed under All only. */
export const ORDER_CATEGORY_TABLE: Readonly<Record<OrderUiStatus, CustomerOrderCategory | null>> = {
  pendingPayment: 'Active',
  confirmed: 'Active',
  packed: 'Active',
  readyForPickup: 'Active',
  dispatched: 'Active',
  outForDelivery: 'Active',
  delivered: 'Completed',
  pickedUp: 'Completed',
  cancelled: 'Cancelled',
  returned: 'Cancelled',
  unknown: null,
};

const TONE_OF_ORDER: Readonly<Record<OrderStatusTone, AdminTone>> = {
  warning: 'warning',
  success: 'success',
  danger: 'danger',
  info: 'info',
  neutral: 'brandSoft',
};

/** docs/openapi.yaml SalesChannel, every value. */
export const CHANNEL_TABLE: Readonly<Record<SalesChannel, TranslationKey>> = {
  ONLINE: 'customers.channel.ONLINE',
  MARKET: 'customers.channel.MARKET',
  HORECA: 'customers.channel.HORECA',
  B2B: 'customers.channel.B2B',
  DIRECT: 'customers.channel.DIRECT',
};

function channelLabel(channel: string): string {
  return has(CHANNEL_TABLE, channel) ? t(CHANNEL_TABLE[channel]) : noValue();
}

const PAYMENT_STATUS_LABEL: Readonly<Record<string, TranslationKey>> = {
  PENDING: 'orders.payment.status.PENDING',
  PAID: 'orders.payment.status.PAID',
  PARTIALLY_PAID: 'orders.payment.status.PARTIALLY_PAID',
  REFUNDED: 'orders.payment.status.REFUNDED',
  FAILED: 'orders.payment.status.FAILED',
};

function paymentStatusLabel(status: string): string {
  const key = has(PAYMENT_STATUS_LABEL, status) ? PAYMENT_STATUS_LABEL[status] : undefined;
  return key === undefined ? noValue() : t(key);
}

function itemsLabel(count: number | null): string {
  if (count === null) return noValue();
  return count === 1 ? t('orders.items.one') : t('orders.items.many', { count });
}

export function toCustomerOrderRow(dto: AdminCustomerOrderDto, now: Date): CustomerOrderRow {
  const status = detailStatusOf(dto.status);
  const totalPaise = moneyToPaise(dto.totalAmount);
  return {
    id: dto.id,
    orderNumber: dto.orderNumber,
    status,
    statusLabel: orderStatusLabel(status),
    tone: TONE_OF_ORDER[orderStatusTone(status)],
    category: ORDER_CATEGORY_TABLE[status],
    channelLabel: channelLabel(dto.channel),
    paymentStatusLabel: paymentStatusLabel(dto.paymentStatus),
    itemsLabel: itemsLabel(countOf(dto.itemCount)),
    totalPaise,
    amountLabel: paiseLabel(totalPaise),
    placedLabel: dateLabel(dto.placedAt, now),
    invoiceNumber: textOrNull(dto.invoiceNumber),
    warehouseId: dto.warehouseId,
  };
}

// ─── Purchases (line level) ──────────────────────────────────────────────────

export function toPurchaseRow(dto: AdminCustomerPurchaseDto, now: Date): PurchaseLineRow {
  const qtyGrams = typeof dto.qtyKg === 'string' ? parseKgToGrams(dto.qtyKg) : null;
  const unitPricePaise = moneyToPaise(dto.unitPrice);
  const lineTotalPaise = moneyToPaise(dto.lineTotal);
  return {
    key: `${dto.orderId}:${dto.productId}:${dto.grade}:${dto.purchasedAt}`,
    orderId: dto.orderId,
    orderNumber: dto.orderNumber,
    channelLabel: channelLabel(dto.channel),
    productName: dto.productName,
    lineLabel: t('inventory.product.label', { product: dto.productName, grade: gradeLabel(dto.grade) }),
    qtyGrams,
    qtyDetail: t('orders.line.qtyDetail', {
      qty: qtyGrams === null ? noValue() : formatKg(qtyGrams),
      price: paiseLabel(unitPricePaise),
    }),
    unitPricePaise,
    lineTotalPaise,
    amountLabel: paiseLabel(lineTotalPaise),
    purchasedLabel: dateLabel(dto.purchasedAt, now),
  };
}

// ─── Wallet ──────────────────────────────────────────────────────────────────

/** docs/openapi.yaml AdminCustomerWalletSummary.status, every value. */
export const WALLET_STATUS_TABLE: Readonly<Record<WalletStatus, WalletUiStatus>> = {
  ACTIVE: 'active',
  FROZEN: 'frozen',
  CLOSED: 'closed',
};

const WALLET_STATUS_LABEL: Readonly<Record<WalletUiStatus, TranslationKey>> = {
  active: 'customers.wallet.status.active',
  frozen: 'customers.wallet.status.frozen',
  closed: 'customers.wallet.status.closed',
  unknown: 'customers.wallet.status.unknown',
};

export function walletStatusOf(status: string): WalletUiStatus {
  return has(WALLET_STATUS_TABLE, status) ? WALLET_STATUS_TABLE[status] : 'unknown';
}

export function toCustomerWallet(dto: AdminCustomerWalletSummaryDto, now: Date): CustomerWalletView {
  const status = walletStatusOf(dto.status);
  const balancePaise = moneyToPaise(dto.balance);
  return {
    walletId: dto.walletId,
    status,
    statusLabel: t(WALLET_STATUS_LABEL[status]),
    balancePaise,
    balanceLabel: paiseLabel(balancePaise),
    transactionCount: countOf(dto.transactionCount),
    lastTransactionLabel: dateLabel(dto.lastTransactionAt, now),
  };
}

/** docs/openapi.yaml WalletTransactionType, every value. */
export const WALLET_TXN_TYPE_TABLE: Readonly<Record<WalletTransactionType, WalletTxnUiType>> = {
  TOPUP_CASH: 'topupCash',
  TOPUP_DIGITAL: 'topupDigital',
  ORDER_DEBIT: 'orderDebit',
  ORDER_REFUND: 'orderRefund',
  PAYOUT_DEBIT: 'payoutDebit',
  SALE_CREDIT: 'saleCredit',
  SUBSCRIPTION_DEBIT: 'subscriptionDebit',
  ADJUSTMENT: 'adjustment',
};

const WALLET_TXN_LABEL: Readonly<Record<WalletTxnUiType, TranslationKey>> = {
  topupCash: 'customers.wallet.txn.TOPUP_CASH',
  topupDigital: 'customers.wallet.txn.TOPUP_DIGITAL',
  orderDebit: 'customers.wallet.txn.ORDER_DEBIT',
  orderRefund: 'customers.wallet.txn.ORDER_REFUND',
  payoutDebit: 'customers.wallet.txn.PAYOUT_DEBIT',
  saleCredit: 'customers.wallet.txn.SALE_CREDIT',
  subscriptionDebit: 'customers.wallet.txn.SUBSCRIPTION_DEBIT',
  adjustment: 'customers.wallet.txn.ADJUSTMENT',
  unknown: 'customers.wallet.txn.unknown',
};

export function walletTxnTypeOf(type: string): WalletTxnUiType {
  return has(WALLET_TXN_TYPE_TABLE, type) ? WALLET_TXN_TYPE_TABLE[type] : 'unknown';
}

/**
 * One ledger row. The amount keeps the server's sign (negative = debit). The
 * previous balance is balanceAfter - amount in integer paise, which is exact
 * for a ledger row (the stored balance is the sum of the rows, BR-93e).
 */
export function toWalletTxnRow(dto: WalletTransactionDto, now: Date): WalletTxnRow {
  const type = walletTxnTypeOf(dto.txnType);
  const amountPaise = moneyToPaise(dto.amount);
  const balanceAfterPaise = moneyToPaise(dto.balanceAfter);
  const previousBalancePaise =
    amountPaise === null || balanceAfterPaise === null ? null : ((balanceAfterPaise - amountPaise) as Paise);
  return {
    id: dto.id,
    type,
    typeLabel: t(WALLET_TXN_LABEL[type]),
    direction: amountPaise !== null && amountPaise < 0 ? 'debit' : 'credit',
    amountPaise,
    amountLabel: paiseLabel(amountPaise),
    balanceAfterPaise,
    balanceAfterLabel: paiseLabel(balanceAfterPaise),
    previousBalancePaise,
    previousBalanceLabel: paiseLabel(previousBalancePaise),
    performedLabel: dateLabel(dto.performedAt, now),
    warehouseId: dto.warehouseId,
    reference: textOrNull(dto.fiscalCashTag) ?? textOrNull(dto.remarks),
  };
}

/**
 * A ledger row as the wallet screens' record (display strings, as the wallet
 * area's screens take them; the strings come from paise, never from a float).
 * Only fields the API has are set, so the screen shows nothing invented.
 */
export function toWalletScreenTransaction(row: WalletTxnRow): WalletTransactionRecord {
  return {
    transactionId: row.id,
    type: row.typeLabel,
    amount: row.amountLabel,
    previousBalance: row.previousBalanceLabel,
    newBalance: row.balanceAfterLabel,
    dateTime: row.performedLabel,
    ...(row.reference === null ? {} : { referenceId: row.reference }),
    ...(row.warehouseId === null ? {} : { warehouseId: row.warehouseId }),
  };
}

// ─── Issues ──────────────────────────────────────────────────────────────────

/** docs/openapi.yaml ReturnStatus, every value. */
export const ISSUE_STATUS_TABLE: Readonly<Record<ReturnStatus, IssueUiStatus>> = {
  PENDING: 'pending',
  INSPECTED: 'inspected',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  REFUND_PENDING_BANK: 'refundPendingBank',
  REFUNDED: 'refunded',
};

const ISSUE_STATUS_LABEL: Readonly<Record<IssueUiStatus, TranslationKey>> = {
  pending: 'customers.issue.status.pending',
  inspected: 'customers.issue.status.inspected',
  approved: 'customers.issue.status.approved',
  rejected: 'customers.issue.status.rejected',
  refundPendingBank: 'customers.issue.status.refundPendingBank',
  refunded: 'customers.issue.status.refunded',
  unknown: 'customers.issue.status.unknown',
};

const ISSUE_STATUS_TONE: Readonly<Record<IssueUiStatus, AdminTone>> = {
  pending: 'info',
  inspected: 'warning',
  approved: 'warning',
  rejected: 'danger',
  refundPendingBank: 'warning',
  refunded: 'success',
  unknown: 'brandSoft',
};

export function issueStatusOf(status: string): IssueUiStatus {
  return has(ISSUE_STATUS_TABLE, status) ? ISSUE_STATUS_TABLE[status] : 'unknown';
}

export function toCustomerIssueRow(dto: AdminCustomerIssueDto, now: Date): CustomerIssueRow {
  const status = issueStatusOf(dto.status);
  // ABSENT until an inspection (BR-91h): no refund figure, not a zero one.
  const refundPaise = dto.refundAmount === undefined ? null : moneyToPaise(dto.refundAmount);
  return {
    id: dto.id,
    reference: dto.reference,
    orderId: dto.orderId,
    orderNumber: textOrNull(dto.orderNumber),
    status,
    statusLabel: t(ISSUE_STATUS_LABEL[status]),
    tone: ISSUE_STATUS_TONE[status],
    reason: textOrNull(dto.reason),
    refundPaise,
    refundLabel: refundPaise === null ? null : formatPaise(refundPaise),
    createdLabel: dateLabel(dto.createdAt, now),
    resolvedLabel: dto.resolvedAt === null ? null : dateLabel(dto.resolvedAt, now),
  };
}

// ─── Support tickets ─────────────────────────────────────────────────────────

/** docs/openapi.yaml AdminCustomerSupportTicket.status, every value. */
export const TICKET_STATUS_TABLE: Readonly<Record<SupportTicketStatus, TicketUiStatus>> = {
  OPEN: 'open',
  IN_PROGRESS: 'inProgress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

const TICKET_STATUS_LABEL: Readonly<Record<TicketUiStatus, TranslationKey>> = {
  open: 'customers.support.status.open',
  inProgress: 'customers.support.status.inProgress',
  resolved: 'customers.support.status.resolved',
  closed: 'customers.support.status.closed',
  unknown: 'customers.support.status.unknown',
};

const TICKET_STATUS_TONE: Readonly<Record<TicketUiStatus, AdminTone>> = {
  open: 'info',
  inProgress: 'warning',
  resolved: 'success',
  closed: 'brandSoft',
  unknown: 'brandSoft',
};

/** docs/openapi.yaml AdminCustomerSupportTicket.categoryCode, every value. */
export const TICKET_CATEGORY_TABLE: Readonly<Record<SupportTicketCategory, TranslationKey>> = {
  QUALITY: 'customers.support.category.QUALITY',
  QUANTITY: 'customers.support.category.QUANTITY',
  MISSING: 'customers.support.category.MISSING',
  WRONG_ITEM: 'customers.support.category.WRONG_ITEM',
  DAMAGED: 'customers.support.category.DAMAGED',
  LATE: 'customers.support.category.LATE',
  PAYMENT: 'customers.support.category.PAYMENT',
  OTHER: 'customers.support.category.OTHER',
};

/** docs/openapi.yaml AdminCustomerSupportTicket.priority, every value. */
export const TICKET_PRIORITY_TABLE: Readonly<Record<SupportTicketPriority, TranslationKey>> = {
  LOW: 'customers.support.priority.LOW',
  NORMAL: 'customers.support.priority.NORMAL',
  HIGH: 'customers.support.priority.HIGH',
  URGENT: 'customers.support.priority.URGENT',
};

export function ticketStatusOf(status: string): TicketUiStatus {
  return has(TICKET_STATUS_TABLE, status) ? TICKET_STATUS_TABLE[status] : 'unknown';
}

export function toSupportTicketRow(dto: AdminCustomerSupportTicketDto, now: Date): SupportTicketRow {
  const status = ticketStatusOf(dto.status);
  return {
    id: dto.id,
    ticketNumber: dto.ticketNumber,
    subject: dto.subject,
    categoryLabel: has(TICKET_CATEGORY_TABLE, dto.categoryCode) ? t(TICKET_CATEGORY_TABLE[dto.categoryCode]) : noValue(),
    priorityLabel: has(TICKET_PRIORITY_TABLE, dto.priority) ? t(TICKET_PRIORITY_TABLE[dto.priority]) : noValue(),
    status,
    statusLabel: t(TICKET_STATUS_LABEL[status]),
    tone: TICKET_STATUS_TONE[status],
    createdLabel: dateLabel(dto.createdAt, now),
    resolvedLabel: dto.resolvedAt === null ? null : dateLabel(dto.resolvedAt, now),
  };
}

function toMessage(dto: AdminCustomerSupportMessageDto, now: Date): SupportMessageView {
  // senderRole is derived and free text; the screen only needs customer vs. staff.
  const fromCustomer = dto.senderRole === 'CUSTOMER';
  return {
    id: dto.id,
    senderLabel: t(fromCustomer ? 'customers.support.sender.customer' : 'customers.support.sender.staff'),
    fromCustomer,
    body: dto.message,
    isInternal: dto.isInternal === true,
    redacted: dto.redacted === true,
    hasAttachment: textOrNull(dto.attachmentUrl) !== null,
    atLabel: dateLabel(dto.createdAt, now),
  };
}

/** A ticket and its thread, in the server's order (oldest first). */
export function toSupportTicketDetail(dto: AdminCustomerSupportTicketDetailDto, now: Date): SupportTicketDetailView {
  const row = toSupportTicketRow(dto, now);
  return {
    ...row,
    description: dto.description,
    messages: dto.messages.map((message) => toMessage(message, now)),
    canReply: row.status !== 'closed',
  };
}

/**
 * The reply body: the trimmed message only (BR-97), or null when there is
 * nothing to send (blank) or the server would refuse it (over 2000 characters).
 */
export function supportReplyBody(text: string): SupportReplyBody | null {
  const message = text.trim();
  if (message === '' || message.length > REPLY_MAX_LENGTH) return null;
  return { message };
}
