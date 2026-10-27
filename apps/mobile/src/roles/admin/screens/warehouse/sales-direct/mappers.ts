/**
 * Pure mapping functions for the direct / channel sales screens (design module M6/M8).
 *
 * Translates API DTOs (api/sales.ts) into the screen types in ./types.ts.
 * No React, no network. Unit-tested in tests/mappers_sales.test.ts.
 *
 * Generate Invoice button → kept visible but disabled ("not available yet") per instructions.
 * BR-16: No farmerId or GPS in output.
 * BR-92: Buyer name comes from the API's `SaleBuyerDto.name` (masked for WALK_IN).
 */
import type { ChannelOrderListItemDto, SaleListItemDto } from '../../../api/sales';
import type { ChannelOrderItem, SaleRecord } from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseMoneyToNumber(money: string): number {
  const n = parseFloat(money as string);
  return Number.isNaN(n) ? 0 : n;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Status labels ────────────────────────────────────────────────────────────

/** Display label for a channel order status. */
export function channelOrderStatusLabel(status: string): string {
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

/** Map a channel order status to the screen's 'Processing' | 'Pending' | 'Completed' bucket. */
export function channelOrderStatusBucket(status: string): 'Processing' | 'Pending' | 'Completed' | 'Confirmed' | 'Paid' {
  if (status === 'CONFIRMED' || status === 'PACKED') return 'Processing';
  if (status === 'PENDING_PAYMENT') return 'Pending';
  if (status === 'DELIVERED' || status === 'PICKED_UP') return 'Completed';
  return 'Confirmed';
}

/** Display label for a sale channel. */
export function saleChannelLabel(channel: string): string {
  const MAP: Record<string, string> = {
    DIRECT: 'Direct Sale',
    MARKET: 'Market Sale',
    B2B: 'B2B',
    HORECA: 'HORECA',
    ONLINE: 'Online',
  };
  return MAP[channel] ?? channel;
}

/** Display label for a payment method. */
export function salePaymentMethodLabel(method: string): string {
  const MAP: Record<string, string> = {
    CASH: 'Cash',
    UPI: 'UPI',
    WALLET: 'Wallet',
    CARD: 'Card',
  };
  return MAP[method] ?? method;
}

// ─── toChannelOrderItem ───────────────────────────────────────────────────────

/**
 * Map a `ChannelOrderListItemDto` to the `ChannelOrderItem` that the
 * `ChannelSalesScreen` renders. `warehouseName` is looked up by the caller.
 *
 * `items` (line details) are not available in the list endpoint; they're
 * populated later from the order detail endpoint or left undefined.
 */
export function toChannelOrderItem(dto: ChannelOrderListItemDto, warehouseName: string): ChannelOrderItem {
  return {
    id: dto.orderNumber,
    channel: dto.channel as 'B2B' | 'HORECA',
    businessName: dto.businessName ?? '—',
    customerCode: dto.customerCode ?? '—',
    status: channelOrderStatusBucket(dto.status),
    itemCountText: `${dto.itemCount} ${dto.itemCount === 1 ? 'Item' : 'Items'}`,
    dateText: formatDate(dto.placedAt),
    amount: parseMoneyToNumber(String(dto.total)),
    warehouseName,
  };
}

// ─── toSaleRecord ─────────────────────────────────────────────────────────────

/**
 * Map a `SaleListItemDto` (from /admin/sales list) to the `SaleRecord` the
 * `SalesHistoryScreen` and `SaleDetailScreen` render.
 */
export function toSaleRecord(dto: SaleListItemDto, warehouseName: string): SaleRecord {
  const saleStatus = (): string => {
    if (dto.status === 'PICKED_UP') return 'Completed';
    if (dto.status === 'CANCELLED') return 'Cancelled';
    return 'Pending';
  };

  return {
    id: dto.saleNumber,
    customerName: dto.buyer.name,
    customerCode: dto.buyer.customerCode ?? undefined,
    channel: saleChannelLabel(dto.channel),
    dateText: formatDate(dto.createdAt),
    amount: parseMoneyToNumber(String(dto.total)),
    status: saleStatus(),
    itemCountText: `${dto.itemCount} ${dto.itemCount === 1 ? 'Item' : 'Items'}`,
    invoiceNo: dto.invoiceNumber ?? undefined,
    paymentMethod: salePaymentMethodLabel(dto.paymentMethod),
    warehouseId: dto.warehouseId,
    warehouseName,
  };
}
