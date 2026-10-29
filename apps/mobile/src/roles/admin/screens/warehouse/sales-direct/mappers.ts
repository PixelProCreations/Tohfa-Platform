/**
 * Pure mapping functions for the direct / channel sales screens (design module M6/M8).
 *
 * Translates API DTOs (api/sales.ts) into the screen types in ./types.ts.
 * No React, no network. Unit-tested in tests/mappers_sales.test.ts.
 *
 * BR-98: Money stays integer paise end to end. formatSaleMoney / parseQtyGrams /
 * gramsToQtyKg are the only paths from API string to display string.
 * BR-16: No farmerId or GPS in output.
 * BR-92: Buyer name comes from the API's `SaleBuyerDto.name` (masked for WALK_IN).
 */
import { parseMoney, toPaise } from '@tohfa/shared-types';
import type { ChannelOrderListItemDto, SaleDto, SaleListItemDto, SaleProductDto } from '../../../api/sales';
import { t } from '../../../i18n';
import { formatPaise } from '../../../money/paise';
import type { ChannelOrderItem, SaleLine, SaleProduct, SaleRecord } from './types';

// ─── Quantity helpers ─────────────────────────────────────────────────────────

/**
 * Parse a Quantity API string (e.g. "48.250") to integer grams.
 * Returns null if negative, more than 3 decimal places, or not a valid number.
 */
export function parseQtyGrams(qty: string): number | null {
  const trimmed = qty.trim();
  // Must be a non-negative number with at most 3 decimal places
  if (!/^\d+(\.\d{1,3})?$/.test(trimmed)) return null;
  const kg = parseFloat(trimmed);
  if (!Number.isFinite(kg) || kg < 0) return null;
  const grams = Math.round(kg * 1000);
  // Verify round-trip: no more than 3 dp
  if (Math.abs(grams - kg * 1000) > 0.001) return null;
  return grams;
}

/**
 * Convert integer grams to the Quantity API string format (always 3 decimal places).
 */
export function gramsToQtyKg(grams: number): string {
  return (grams / 1000).toFixed(3);
}

// ─── Money helpers ────────────────────────────────────────────────────────────

/**
 * Format an API Money decimal string to a rupee display label (e.g. "₹18,500.50").
 * Returns "—" for null / undefined / malformed values (never "₹0" or "NaN").
 * BR-98: goes through integer paise so there is no float drift.
 */
export function formatSaleMoney(money: string | null | undefined): string {
  if (money === null || money === undefined) return '—';
  try {
    return formatPaise(toPaise(parseMoney(money)));
  } catch {
    return '—';
  }
}

// ─── Grade helpers ────────────────────────────────────────────────────────────

/**
 * i18n display label for an API grade enum (e.g. "GRADE_1" → "Grade 1").
 * Returns the raw enum as a fallback for unknown grades.
 */
export function gradeLabel(grade: string): string {
  const MAP: Record<string, 'salesDirect.grade.GRADE_1' | 'salesDirect.grade.GRADE_2' | 'salesDirect.grade.GRADE_3' | 'salesDirect.grade.REJECT'> = {
    GRADE_1: 'salesDirect.grade.GRADE_1',
    GRADE_2: 'salesDirect.grade.GRADE_2',
    GRADE_3: 'salesDirect.grade.GRADE_3',
    REJECT: 'salesDirect.grade.REJECT',
  };
  const key = MAP[grade];
  return key ? t(key) : grade;
}

/**
 * Convert an API grade enum or display string to the canonical API enum, or null
 * if the value is not a recognised grade. Never defaults an unknown to GRADE_1.
 */
export function toApiGrade(grade: string): 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT' | null {
  const MAP: Record<string, 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT'> = {
    GRADE_1: 'GRADE_1',
    GRADE_2: 'GRADE_2',
    GRADE_3: 'GRADE_3',
    REJECT: 'REJECT',
  };
  return MAP[grade] ?? null;
}

// ─── Status and label helpers ─────────────────────────────────────────────────

/** Display label for a channel order status. */
export function channelOrderStatusLabel(status: string): string {
  const MAP: Partial<Record<string, 'salesDirect.orderStatus.CONFIRMED' | 'salesDirect.orderStatus.PACKED' | 'salesDirect.orderStatus.DISPATCHED' | 'salesDirect.orderStatus.READY_FOR_PICKUP' | 'salesDirect.orderStatus.DELIVERED' | 'salesDirect.orderStatus.PICKED_UP' | 'salesDirect.orderStatus.CANCELLED' | 'salesDirect.orderStatus.RETURNED'>> = {
    CONFIRMED: 'salesDirect.orderStatus.CONFIRMED',
    PACKED: 'salesDirect.orderStatus.PACKED',
    DISPATCHED: 'salesDirect.orderStatus.DISPATCHED',
    READY_FOR_PICKUP: 'salesDirect.orderStatus.READY_FOR_PICKUP',
    DELIVERED: 'salesDirect.orderStatus.DELIVERED',
    PICKED_UP: 'salesDirect.orderStatus.PICKED_UP',
    CANCELLED: 'salesDirect.orderStatus.CANCELLED',
    RETURNED: 'salesDirect.orderStatus.RETURNED',
  };
  const key = MAP[status];
  return key ? t(key) : status;
}

/** Map a channel order status to the screen's bucket. */
export function channelOrderStatusBucket(status: string): 'Processing' | 'Pending' | 'Completed' | 'Confirmed' | 'Paid' {
  if (status === 'CONFIRMED' || status === 'PACKED') return 'Processing';
  if (status === 'PENDING_PAYMENT') return 'Pending';
  if (status === 'DELIVERED' || status === 'PICKED_UP') return 'Completed';
  return 'Confirmed';
}

/** i18n display label for a sale channel. */
export function saleChannelLabel(channel: string): string {
  const MAP: Partial<Record<string, 'salesDirect.channel.DIRECT' | 'salesDirect.channel.MARKET' | 'salesDirect.channel.B2B' | 'salesDirect.channel.HORECA' | 'salesDirect.channel.ONLINE'>> = {
    DIRECT: 'salesDirect.channel.DIRECT',
    MARKET: 'salesDirect.channel.MARKET',
    B2B: 'salesDirect.channel.B2B',
    HORECA: 'salesDirect.channel.HORECA',
    ONLINE: 'salesDirect.channel.ONLINE',
  };
  const key = MAP[channel];
  return key ? t(key) : channel;
}

/** i18n display label for a payment method. */
export function salePaymentMethodLabel(method: string): string {
  const MAP: Partial<Record<string, 'salesDirect.method.CASH' | 'salesDirect.method.UPI' | 'salesDirect.method.WALLET' | 'salesDirect.method.CARD'>> = {
    CASH: 'salesDirect.method.CASH',
    UPI: 'salesDirect.method.UPI',
    WALLET: 'salesDirect.method.WALLET',
    CARD: 'salesDirect.method.CARD',
  };
  const key = MAP[method];
  return key ? t(key) : method;
}

/** i18n display label for a sale payment status. */
export function salePaymentStatusLabel(status: string): string {
  const MAP: Partial<Record<string, 'salesDirect.paymentStatus.PENDING' | 'salesDirect.paymentStatus.PAID' | 'salesDirect.paymentStatus.PARTIALLY_PAID' | 'salesDirect.paymentStatus.REFUNDED' | 'salesDirect.paymentStatus.FAILED' | 'salesDirect.paymentStatus.REFUND_DUE'>> = {
    PENDING: 'salesDirect.paymentStatus.PENDING',
    PAID: 'salesDirect.paymentStatus.PAID',
    PARTIALLY_PAID: 'salesDirect.paymentStatus.PARTIALLY_PAID',
    REFUNDED: 'salesDirect.paymentStatus.REFUNDED',
    FAILED: 'salesDirect.paymentStatus.FAILED',
    REFUND_DUE: 'salesDirect.paymentStatus.REFUND_DUE',
  };
  const key = MAP[status];
  return key ? t(key) : status;
}

/** i18n display label for a sale status. */
function saleStatusLabel(status: string): string {
  const MAP: Partial<Record<string, 'salesDirect.saleStatus.PICKED_UP' | 'salesDirect.saleStatus.CANCELLED' | 'salesDirect.saleStatus.PENDING_PAYMENT'>> = {
    PICKED_UP: 'salesDirect.saleStatus.PICKED_UP',
    CANCELLED: 'salesDirect.saleStatus.CANCELLED',
    PENDING_PAYMENT: 'salesDirect.saleStatus.PENDING_PAYMENT',
  };
  const key = MAP[status];
  return key ? t(key) : status;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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
  const totalText = formatSaleMoney(String(dto.total));
  let totalPaise: number | undefined;
  try {
    totalPaise = toPaise(parseMoney(String(dto.total)));
  } catch {
    totalPaise = undefined;
  }
  return {
    id: dto.id,
    orderNumber: dto.orderNumber,
    channel: dto.channel as 'B2B' | 'HORECA',
    businessName: dto.businessName ?? '—',
    customerCode: dto.customerCode ?? '—',
    status: channelOrderStatusBucket(dto.status),
    itemCountText: `${dto.itemCount} ${dto.itemCount === 1 ? 'Item' : 'Items'}`,
    dateText: formatDate(dto.placedAt),
    amount: totalPaise !== undefined ? totalPaise / 100 : 0,
    warehouseId: dto.warehouseId,
    warehouseName,
    totalPaise,
    totalText,
  };
}

// ─── toSaleRecord ─────────────────────────────────────────────────────────────

/**
 * Map a `SaleListItemDto` (from /admin/sales list) to the `SaleRecord` the
 * `SalesHistoryScreen` and `SaleDetailScreen` render.
 */
export function toSaleRecord(dto: SaleListItemDto, warehouseName: string): SaleRecord {
  let totalPaise: number | undefined;
  try {
    totalPaise = toPaise(parseMoney(String(dto.total)));
  } catch {
    totalPaise = undefined;
  }
  const totalText = formatSaleMoney(String(dto.total));

  return {
    id: dto.id,
    saleNumber: dto.saleNumber,
    customerName: dto.buyer.name,
    customerCode: dto.buyer.customerCode ?? undefined,
    channel: saleChannelLabel(dto.channel),
    channelCode: dto.channel,
    dateText: formatDate(dto.createdAt),
    amount: totalPaise !== undefined ? totalPaise / 100 : 0,
    status: saleStatusLabel(dto.status),
    statusCode: dto.status,
    paymentStatus: salePaymentStatusLabel(dto.paymentStatus),
    paymentStatusCode: dto.paymentStatus,
    itemCountText: `${dto.itemCount} ${dto.itemCount === 1 ? 'Item' : 'Items'}`,
    invoiceNo: dto.invoiceNumber ?? undefined,
    paymentMethod: salePaymentMethodLabel(dto.paymentMethod),
    warehouseId: dto.warehouseId,
    warehouseName,
    totalPaise,
    totalText,
  };
}

/**
 * Map a `SaleDto` (from /admin/sales/{id} detail) to `SaleRecord` for `SaleDetailScreen`.
 */
export function toSaleRecordFromDto(dto: SaleDto, warehouseName?: string): SaleRecord {
  let totalPaise: number | undefined;
  try {
    totalPaise = toPaise(parseMoney(String(dto.totals.total)));
  } catch {
    totalPaise = undefined;
  }
  const totalText = formatSaleMoney(String(dto.totals.total));
  const subtotalText = formatSaleMoney(String(dto.totals.subtotal));
  const gstText = formatSaleMoney(String(dto.totals.gst));
  const changeGivenText = dto.totals.changeGiven != null ? formatSaleMoney(String(dto.totals.changeGiven)) : undefined;

  const lines: SaleLine[] = (dto.items ?? []).map((item) => {
    const qty = typeof item.qtyKg === 'number' ? item.qtyKg : Number(item.qtyKg) || 0;
    const lineTotalText = formatSaleMoney(String(item.lineTotal));
    const unitPriceText = formatSaleMoney(String(item.unitPrice));
    let pricePerUnit = 0;
    try {
      pricePerUnit = toPaise(parseMoney(String(item.unitPrice))) / 100;
    } catch {
      pricePerUnit = 0;
    }
    let lineTotal = 0;
    try {
      lineTotal = toPaise(parseMoney(String(item.lineTotal))) / 100;
    } catch {
      lineTotal = 0;
    }
    return {
      name: item.name,
      grade: gradeLabel(item.grade),
      batch: '—',
      qtyText: `${qty} KG`,
      pricePerUnit,
      lineTotal,
      unitPriceText,
      lineTotalText,
    };
  });

  const timeline = (dto.timeline ?? []).map((entry) => ({
    label: saleStatusLabel(entry.toStatus),
    at: entry.at,
  }));

  return {
    id: dto.id,
    saleNumber: dto.saleNumber,
    customerName: dto.buyer.name,
    customerCode: dto.buyer.customerCode ?? undefined,
    channel: saleChannelLabel(dto.channel),
    channelCode: dto.channel,
    dateText: formatDate(dto.createdAt),
    amount: totalPaise !== undefined ? totalPaise / 100 : 0,
    status: saleStatusLabel(dto.status),
    statusCode: dto.status,
    paymentStatus: dto.payment?.status ? salePaymentStatusLabel(dto.payment.status) : undefined,
    paymentStatusCode: dto.payment?.status,
    itemCountText: `${lines.length} ${lines.length === 1 ? 'Item' : 'Items'}`,
    invoiceNo: dto.invoiceNumber ?? undefined,
    invoiceId: dto.invoiceId ?? undefined,
    paymentMethod: dto.payment?.method ? salePaymentMethodLabel(dto.payment.method) : undefined,
    warehouseId: dto.warehouseId,
    warehouseName,
    totalPaise,
    totalText,
    subtotalText,
    gstText,
    changeGivenText,
    timeline,
    items: lines,
  };
}

// ─── Products & Grades ────────────────────────────────────────────────────────

/**
 * Map an API SaleProductDto to the screen's SaleProduct item.
 *
 * BR-98: unitPrice and availableGrams are stored as integer paise / grams so
 * the sale flow never does float maths on them.
 * BR-90: allow-list only — no farmerId, GPS, or batchId passes through.
 * CLAUDE.md 2.7: status is NOT set here (the threshold belongs in system_config,
 * not in a hard-coded constant in a mapper).
 */
export function toSaleProduct(dto: SaleProductDto, warehouseId?: string): SaleProduct {
  const apiGrade = dto.grade as string;
  let unitPricePaise: number | undefined;
  try {
    unitPricePaise = toPaise(parseMoney(String(dto.unitPrice)));
  } catch {
    unitPricePaise = undefined;
  }
  const availableGrams = parseQtyGrams(String(dto.availableQtyKg)) ?? 0;
  const pricePerKg = unitPricePaise !== undefined ? unitPricePaise / 100 : 0;
  const availableKg = availableGrams / 1000;

  return {
    key: `${dto.productId}|${apiGrade}`,
    id: dto.productId,
    productId: dto.productId,
    name: dto.name,
    grade: apiGrade,
    gradeLabel: gradeLabel(apiGrade),
    unitPrice: String(dto.unitPrice),
    unitPricePaise,
    pricePerKg,
    availableKg,
    availableGrams,
    batch: dto.batchCode ?? undefined,
    location: dto.storageLocation ?? undefined,
    warehouseId,
  };
}
