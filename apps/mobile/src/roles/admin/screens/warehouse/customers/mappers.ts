/**
 * Pure mapping functions for the warehouse customer screens (design module M7).
 *
 * These functions translate API DTOs (customers.ts) into the screen types in
 * ./types.ts. No React, no network: they can be unit-tested in plain-Node vitest.
 *
 * BR-92: PII masking is the server's own — mobileMasked is always present; the
 * mapper uses it verbatim and never tries to recover the real number.
 * BR-16: No farm field is passed through. The allow-list DTO structure means
 * only the explicitly mapped keys appear in the output.
 */
import type {
  AdminCustomerDetailDto,
  AdminCustomerIssueDto,
  AdminCustomerListItemDto,
  AdminCustomerOrderDto,
  AdminCustomerPurchaseDto,
  AdminCustomerSupportTicketDto,
  CustomerListSummaryDto,
} from '../../../api/customers';
import type {
  CustomerIssueRecord,
  CustomerOrderRecord,
  CustomerRecord,
  PurchaseRecord,
  SupportTicketRecord,
} from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format an ISO timestamp (or null) to a human display date, e.g. "24 Sep 2026". */
export function formatAdminDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Format a Money string (decimal rupees) to "₹NN,NNN" display. */
export function formatMoney(money: string | null | undefined): string | undefined {
  if (!money) return undefined;
  const n = parseFloat(money);
  if (Number.isNaN(n)) return undefined;
  // Paise are already decimal in Money: "850.00" = ₹850.
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/** BR-92: Returns mobileMasked as-is, or '—' for null. */
export function maskPhone(mobileMasked: string | null | undefined): string {
  return mobileMasked ?? '—';
}

// ─── toCustomerRecord ─────────────────────────────────────────────────────────

/**
 * Map a list-item DTO to the screen's CustomerRecord (the partial shape that
 * every list row needs). warehouseNames is an id→name lookup for the Main view.
 */
export function toCustomerRecord(
  dto: AdminCustomerListItemDto,
  warehouseNames: ReadonlyMap<string, string> | undefined,
): CustomerRecord {
  const warehouseId = dto.preferredWarehouseId ?? undefined;
  return {
    id: dto.id,
    name: dto.name,
    code: dto.customerCode,
    // BR-92: for piiMasked=true the server sends mobileMasked and no mobile field.
    phone: dto.piiMasked ? maskPhone(dto.mobileMasked) : (dto.mobile ?? maskPhone(dto.mobileMasked)),
    email: dto.email ?? undefined,
    status: dto.status === 'ACTIVE' ? 'Active' : 'Inactive',
    warehouseId,
    warehouseName: warehouseId ? (warehouseNames?.get(warehouseId) ?? undefined) : undefined,
    ordersCount: dto.totalOrders,
    lastPurchase: formatAdminDate(dto.lastActivityAt),
    regDate: formatAdminDate(dto.createdAt),
    // The following fields need the detail endpoint; they're absent from the list.
    totalPurchases: undefined,
    walletBalance: undefined,
    openIssues: undefined,
    completedOrders: undefined,
    cancelledOrders: undefined,
  };
}

/**
 * Augment a CustomerRecord with fields from the detail endpoint.
 * Preserves the identity from the list row (no overwrite of id/name/code/phone).
 */
export function augmentCustomerRecord(
  base: CustomerRecord,
  detail: AdminCustomerDetailDto,
  warehouseNames: ReadonlyMap<string, string> | undefined,
): CustomerRecord {
  const warehouseId = detail.preferredWarehouseId ?? undefined;
  return {
    ...base,
    email: detail.email ?? undefined,
    status: detail.status === 'ACTIVE' ? 'Active' : 'Inactive',
    warehouseId,
    warehouseName: warehouseId ? (warehouseNames?.get(warehouseId) ?? undefined) : undefined,
    ordersCount: detail.totalOrders,
    totalPurchases: formatMoney(detail.lifetimeValue),
    walletBalance: formatMoney(detail.walletBalance),
    lastPurchase: formatAdminDate(detail.lastOrderAt ?? detail.lastActivityAt),
    regDate: formatAdminDate(detail.createdAt),
    // open issues count not in detail; keep from base or undefined
  };
}

// ─── toCustomerOrderRecord ────────────────────────────────────────────────────

function orderStatusCategory(status: string): 'Active' | 'Completed' | 'Cancelled' {
  if (status === 'CANCELLED' || status === 'RETURNED') return 'Cancelled';
  if (status === 'DELIVERED' || status === 'PICKED_UP') return 'Completed';
  return 'Active';
}

function orderStatusLabel(status: string): string {
  const MAP: Record<string, string> = {
    PENDING_PAYMENT: 'Pending Payment',
    CONFIRMED: 'Confirmed',
    PACKED: 'Packed',
    DISPATCHED: 'Dispatched',
    READY_FOR_PICKUP: 'Ready for Pickup',
    OUT_FOR_DELIVERY: 'Out for Delivery',
    DELIVERED: 'Delivered',
    PICKED_UP: 'Completed',
    CANCELLED: 'Cancelled',
    RETURNED: 'Returned',
  };
  return MAP[status] ?? status;
}

function paymentStatusLabel(status: string): string {
  const MAP: Record<string, string> = {
    PENDING: 'Pending',
    PAID: 'Paid',
    PARTIALLY_PAID: 'Partial',
    REFUNDED: 'Refunded',
    FAILED: 'Failed',
  };
  return MAP[status] ?? status;
}

export function toCustomerOrderRecord(dto: AdminCustomerOrderDto): CustomerOrderRecord {
  // The API `AdminCustomerOrderDto` doesn't carry fulfilmentType explicitly,
  // so we infer pickup vs delivery from status heuristics.
  // READY_FOR_PICKUP implies a pickup order; otherwise treat as Delivery.
  const type: 'Pickup' | 'Delivery' =
    dto.status === 'READY_FOR_PICKUP' || dto.status === 'PICKED_UP' ? 'Pickup' : 'Delivery';

  return {
    id: dto.id,
    orderNo: dto.orderNumber,
    date: formatAdminDate(dto.placedAt),
    items: `${dto.itemCount} ${dto.itemCount === 1 ? 'Item' : 'Items'}`,
    type,
    paymentStatus: paymentStatusLabel(dto.paymentStatus),
    price: formatMoney(dto.totalAmount) ?? '—',
    status: orderStatusLabel(dto.status),
    statusCategory: orderStatusCategory(dto.status),
    warehouseId: dto.warehouseId,
  };
}

// ─── toPurchaseRecord ─────────────────────────────────────────────────────────

function purchaseChannelLabel(channel: string): string {
  const MAP: Record<string, string> = {
    DIRECT: 'Direct Sale',
    MARKET: 'Market Day',
    ONLINE: 'Online',
    HORECA: 'HORECA',
    B2B: 'B2B',
  };
  return MAP[channel] ?? channel;
}

export function toPurchaseRecord(dto: AdminCustomerPurchaseDto): PurchaseRecord {
  return {
    id: `${dto.orderId}-${dto.productId}`,
    invoiceNo: dto.orderNumber,
    dateText: formatAdminDate(dto.purchasedAt),
    itemsSummary: `${dto.productName} — ${dto.qtyKg} KG`,
    amount: formatMoney(dto.lineTotal) ?? '—',
    status: 'Paid', // Purchase lines are from completed orders; always paid.
    channel: purchaseChannelLabel(dto.channel),
    orderNo: dto.orderNumber,
  };
}

// ─── toCustomerIssueRecord ────────────────────────────────────────────────────

function issueStatusLabel(status: string): 'Open' | 'In Review' | 'Resolved' {
  if (status === 'REFUNDED' || status === 'APPROVED' || status === 'REJECTED') return 'Resolved';
  if (status === 'INSPECTED' || status === 'REFUND_PENDING_BANK') return 'In Review';
  return 'Open';
}

export function toCustomerIssueRecord(dto: AdminCustomerIssueDto): CustomerIssueRecord {
  return {
    id: dto.id,
    issueNo: dto.reference,
    category: 'Return', // BR-91h: issues are return requests today
    orderNo: dto.orderNumber ?? '—',
    dateText: formatAdminDate(dto.createdAt),
    status: issueStatusLabel(dto.status),
    description: dto.reason ?? undefined,
  };
}

// ─── toSupportTicketRecord ────────────────────────────────────────────────────

export function toSupportTicketRecord(dto: AdminCustomerSupportTicketDto): SupportTicketRecord {
  const open = dto.status === 'OPEN' || dto.status === 'IN_PROGRESS';
  return {
    id: dto.id,
    ticketNo: dto.ticketNumber,
    subject: dto.subject,
    orderRef: '—', // AdminCustomerSupportTicketDto has no orderId
    dateText: formatAdminDate(dto.createdAt),
    status: open ? 'Open' : 'Resolved',
    resolvedBy: dto.resolvedAt ? 'Admin' : undefined,
  };
}

// ─── toCustomerKpis ───────────────────────────────────────────────────────────

/** The three-tile KPI row for the customers list header. */
export function toCustomerKpis(summary: CustomerListSummaryDto): readonly { label: string; value: string }[] {
  return [
    { label: 'TOTAL CUSTOMERS', value: summary.total.toLocaleString('en-IN') },
    { label: 'ACTIVE', value: summary.active.toLocaleString('en-IN') },
    { label: 'NEW', value: summary.new.toLocaleString('en-IN') },
  ] as const;
}
