/**
 * Pure mapping between the OpenAPI sales DTOs (roles/admin/api/sales.ts) and the
 * view models the sales screens render, plus the request builders. No React and
 * no react-native import, so plain-Node vitest covers every decision here.
 *
 * Rules:
 *   - Money is never a float (root CLAUDE.md 2.2). Amounts are integer paise in
 *     the view models; request bodies carry `Money` strings built from paise.
 *     The quote's own `totals.total` string is echoed back as `expectedTotal`
 *     untouched (BR-89), never recomputed on the phone.
 *   - Quantities are integer grams; request bodies carry 3-dp kg strings.
 *   - Status, grade, channel and method stay as the API's enum codes. Screens
 *     turn them into words through ./salesLabels.ts (i18n keys), so nothing
 *     here is user-facing English.
 *   - Server totals and GST are preserved, never recomputed (BR-89, BR-98).
 */
import { fromPaise, type Money, type Paise } from '@tohfa/shared-types';
import type {
  ChannelOrderListItemDto,
  ChannelOrderStatus,
  Grade,
  SaleBuyerDto,
  SaleCreateDto,
  SaleCustomerLookupParams,
  SaleCustomerMatchDto,
  SaleDto,
  SaleItemRequestDto,
  SaleLineDto,
  SaleListItemDto,
  SalePaymentMethod,
  SalePaymentRowStatus,
  SalePaymentStatus,
  SaleProductDto,
  SaleQuoteDto,
  SaleQuoteRequestDto,
  SalesDashboardSummaryDto,
  SalesMarketDayDto,
  SaleStatus,
} from '../../../api/sales';
import type { AdminOrderDetailDto } from '../../../api/orders';
import { parseRupeesToPaise } from '../../../money/paise';
import { gramsToKgString, parseKgToGrams } from '../../../money/quantity';

/** Every payment method, in the order the screens list them. */
export const SALE_PAYMENT_METHODS: readonly SalePaymentMethod[] = ['CASH', 'UPI', 'CARD', 'WALLET'];
/** The two channels the history / summary carry. */
export const SALE_CHANNELS: readonly ('DIRECT' | 'MARKET')[] = ['DIRECT', 'MARKET'];

/** The warehouse a sales query is for: a Sub admin's own, else the Main admin's pick (undefined = all). */
export function salesWarehouseFilter(
  scope: { warehouseId?: string | undefined },
  selectedWarehouseId?: string | undefined,
): string | undefined {
  return scope.warehouseId ?? selectedWarehouseId;
}

/** API money string -> integer paise. A missing or malformed value is 0 (never NaN). */
export function moneyToPaise(val: Money | string | null | undefined): Paise {
  if (val === null || val === undefined) return 0;
  return parseRupeesToPaise(String(val)) ?? 0;
}

function qtyToGrams(val: string | null | undefined): number {
  if (val === null || val === undefined) return 0;
  return parseKgToGrams(String(val)) ?? 0;
}

// ─── Products ────────────────────────────────────────────────────────────────

export interface SaleProductView {
  productId: string;
  name: string;
  grade: Grade;
  unitPricePaise: Paise;
  availableGrams: number;
  batchCode: string | null;
  storageLocation: string | null;
}

export function mapSaleProduct(dto: SaleProductDto): SaleProductView {
  return {
    productId: dto.productId,
    name: dto.name,
    grade: dto.grade,
    unitPricePaise: moneyToPaise(dto.unitPrice),
    availableGrams: qtyToGrams(dto.availableQtyKg),
    batchCode: dto.batchCode,
    storageLocation: dto.storageLocation,
  };
}

/** One cart line: a product + grade and the kg the cashier picked (in grams). */
export interface CartLine {
  productId: string;
  name: string;
  grade: Grade;
  unitPricePaise: Paise;
  availableGrams: number;
  qtyGrams: number;
}

/** Products are one line per productId + grade (the API refuses a repeat, 422). */
export function cartLineKey(line: { productId: string; grade: Grade }): string {
  return `${line.productId}:${line.grade}`;
}

/**
 * Set a line's quantity: 0 (or less) removes it, anything above the product's
 * available stock is clamped to it. The server re-checks stock on quote and
 * create (409 SALE_STOCK_CHANGED, BR-89); this only stops an obvious mistake.
 */
export function setCartQty(cart: readonly CartLine[], product: SaleProductView, qtyGrams: number): CartLine[] {
  const key = cartLineKey(product);
  const rest = cart.filter((l) => cartLineKey(l) !== key);
  const qty = Math.min(Math.max(0, Math.round(qtyGrams)), product.availableGrams);
  if (qty <= 0) return rest;
  const line: CartLine = {
    productId: product.productId,
    name: product.name,
    grade: product.grade,
    unitPricePaise: product.unitPricePaise,
    availableGrams: product.availableGrams,
    qtyGrams: qty,
  };
  const idx = cart.findIndex((l) => cartLineKey(l) === key);
  if (idx < 0) return [...rest, line];
  const out = [...cart];
  out[idx] = line;
  return out;
}

export function cartItemRequests(cart: readonly CartLine[]): SaleItemRequestDto[] {
  return cart
    .filter((l) => l.qtyGrams > 0)
    .map((l) => ({ productId: l.productId, grade: l.grade, qtyKg: gramsToKgString(l.qtyGrams) }));
}

// ─── Customers ───────────────────────────────────────────────────────────────

export interface SaleCustomerView {
  customerId: string;
  customerCode: string;
  name: string;
  mobileMasked: string;
  walletBalancePaise: Paise;
}

export function mapSaleCustomerMatch(dto: SaleCustomerMatchDto): SaleCustomerView {
  return {
    customerId: dto.customerId,
    customerCode: dto.customerCode,
    name: dto.name,
    mobileMasked: dto.mobileMasked,
    walletBalancePaise: moneyToPaise(dto.walletBalance),
  };
}

/**
 * What the counter search box sends: 10-15 digits (optionally with +) is a
 * mobile lookup, 2+ other characters is a free-text `q` (name / code / mobile
 * digits). Anything shorter is no lookup at all (the API would 422).
 */
export function customerLookupParams(input: string): SaleCustomerLookupParams | null {
  const text = input.trim();
  const compact = text.replace(/[\s-]/g, '');
  if (/^\+?[0-9]{10,15}$/.test(compact)) return { mobile: compact };
  if (text.length >= 2) return { q: text.slice(0, 100) };
  return null;
}

/**
 * A walk-in mobile as the API wants it (E.164, `^\+[1-9][0-9]{7,14}$`).
 * A bare 10-digit Indian number gets +91. Empty input is `undefined` (the
 * mobile is optional); anything else unparseable is null (show an error).
 */
export function normalizeWalkInMobile(input: string): string | undefined | null {
  const compact = input.trim().replace(/[\s-]/g, '');
  if (compact === '') return undefined;
  if (/^[6-9][0-9]{9}$/.test(compact)) return `+91${compact}`;
  if (/^\+[1-9][0-9]{7,14}$/.test(compact)) return compact;
  return null;
}

// ─── Quote ───────────────────────────────────────────────────────────────────

export interface SaleLineView {
  productId: string;
  name: string;
  grade: Grade;
  qtyGrams: number;
  unitPricePaise: Paise;
  lineTotalPaise: Paise;
}

function mapLine(l: SaleLineDto): SaleLineView {
  return {
    productId: l.productId,
    name: l.name,
    grade: l.grade,
    qtyGrams: qtyToGrams(l.qtyKg),
    unitPricePaise: moneyToPaise(l.unitPrice),
    lineTotalPaise: moneyToPaise(l.lineTotal),
  };
}

export interface SaleQuoteView {
  channel: string;
  lines: SaleLineView[];
  subtotalPaise: Paise;
  gstPaise: Paise;
  totalPaise: Paise;
  /** The server's `totals.total`, echoed back verbatim as `expectedTotal` (BR-89). */
  expectedTotal: Money;
  gstRatePercent: string;
  quotedAt: string;
}

export function mapSaleQuote(dto: SaleQuoteDto): SaleQuoteView {
  return {
    channel: dto.channel,
    lines: dto.lines.map(mapLine),
    subtotalPaise: moneyToPaise(dto.totals.subtotal),
    gstPaise: moneyToPaise(dto.totals.gst),
    totalPaise: moneyToPaise(dto.totals.total),
    expectedTotal: String(dto.totals.total) as Money,
    gstRatePercent: dto.gstRatePercent,
    quotedAt: dto.quotedAt,
  };
}

export function buildQuoteRequest(
  channel: 'DIRECT' | 'MARKET',
  cart: readonly CartLine[],
  warehouseId: string | undefined,
): SaleQuoteRequestDto {
  return { channel, items: cartItemRequests(cart), ...(warehouseId ? { warehouseId } : {}) };
}

// ─── Create sale ─────────────────────────────────────────────────────────────

export type SaleBuyerInput =
  | { kind: 'CUSTOMER'; customer: SaleCustomerView }
  | { kind: 'WALK_IN'; name: string; mobile?: string | undefined };

export type SalePaymentInput =
  | { method: 'CASH'; receivedInput: string }
  | { method: 'CARD'; cardRef: string }
  | { method: 'UPI' }
  | { method: 'WALLET' };

/** Why the Payment screen may not submit yet; each maps to an i18n key in salesLabels.ts. */
export type SalePaymentBlock =
  | 'EMPTY_CART'
  | 'NO_QUOTE'
  | 'WALK_IN_NAME_REQUIRED'
  | 'WALK_IN_MOBILE_INVALID'
  | 'WALKIN_WALLET_NOT_ALLOWED'
  | 'WALLET_INSUFFICIENT'
  | 'CASH_AMOUNT_INVALID'
  | 'CASH_AMOUNT_INSUFFICIENT'
  | 'CARD_REF_REQUIRED';

export interface PaymentCheck {
  block: SalePaymentBlock | null;
  /** CASH: change to hand back once the received amount covers the total; else 0. */
  changePaise: Paise;
  /** WALLET: how much the wallet is short by; else 0. */
  shortfallPaise: Paise;
}

/**
 * The client-side checks the API also makes (BR-86 walk-in wallet, BR-94 cash /
 * card, BR-88 wallet balance), so the cashier sees the problem before a round
 * trip. UX only: the server stays the authority and re-checks everything.
 */
export function checkSalePayment(args: {
  cart: readonly CartLine[];
  quote: SaleQuoteView | null;
  buyer: SaleBuyerInput;
  payment: SalePaymentInput;
}): PaymentCheck {
  const { cart, quote, buyer, payment } = args;
  const none = { changePaise: 0, shortfallPaise: 0 };
  if (cartItemRequests(cart).length === 0) return { block: 'EMPTY_CART', ...none };
  if (quote === null) return { block: 'NO_QUOTE', ...none };
  if (buyer.kind === 'WALK_IN') {
    if (buyer.name.trim() === '') return { block: 'WALK_IN_NAME_REQUIRED', ...none };
    if (buyer.mobile !== undefined && normalizeWalkInMobile(buyer.mobile) === null) {
      return { block: 'WALK_IN_MOBILE_INVALID', ...none };
    }
  }
  const total = quote.totalPaise;
  switch (payment.method) {
    case 'WALLET': {
      if (buyer.kind === 'WALK_IN') return { block: 'WALKIN_WALLET_NOT_ALLOWED', ...none };
      const shortfallPaise = Math.max(0, total - buyer.customer.walletBalancePaise);
      return { block: shortfallPaise > 0 ? 'WALLET_INSUFFICIENT' : null, changePaise: 0, shortfallPaise };
    }
    case 'CASH': {
      const received = parseRupeesToPaise(payment.receivedInput);
      if (received === null) return { block: 'CASH_AMOUNT_INVALID', ...none };
      if (received < total) return { block: 'CASH_AMOUNT_INSUFFICIENT', ...none };
      return { block: null, changePaise: received - total, shortfallPaise: 0 };
    }
    case 'CARD':
      return { block: payment.cardRef.trim() === '' ? 'CARD_REF_REQUIRED' : null, ...none };
    case 'UPI':
      return { block: null, ...none };
  }
}

/**
 * The POST /admin/sales body, or null while checkSalePayment still blocks it.
 * Exactly one of customer / walkIn (BR-86); expectedTotal is the quote's own
 * total (BR-89); cash `amountReceived` is a Money string built from paise.
 */
export function buildSaleCreateRequest(args: {
  channel: 'DIRECT' | 'MARKET';
  warehouseId: string | undefined;
  cart: readonly CartLine[];
  quote: SaleQuoteView | null;
  buyer: SaleBuyerInput;
  payment: SalePaymentInput;
}): SaleCreateDto | null {
  const { channel, warehouseId, cart, quote, buyer, payment } = args;
  if (checkSalePayment({ cart, quote, buyer, payment }).block !== null || quote === null) return null;
  const body: SaleCreateDto = {
    channel,
    items: cartItemRequests(cart),
    expectedTotal: quote.expectedTotal,
    payment: { method: payment.method },
  };
  if (warehouseId) body.warehouseId = warehouseId;
  if (buyer.kind === 'CUSTOMER') {
    body.customer = { customerId: buyer.customer.customerId };
  } else {
    const mobile = buyer.mobile === undefined ? undefined : normalizeWalkInMobile(buyer.mobile);
    body.walkIn = mobile ? { name: buyer.name.trim(), mobile } : { name: buyer.name.trim() };
  }
  if (payment.method === 'CASH') {
    const received = parseRupeesToPaise(payment.receivedInput);
    if (received === null) return null;
    body.payment.amountReceived = fromPaise(received);
  } else if (payment.method === 'CARD') {
    body.payment.cardRef = payment.cardRef.trim();
  }
  return body;
}

/** A UPI transaction reference as typed by the cashier (1-120 chars, trimmed), or null. */
export function upiTxnRefInput(input: string): string | null {
  const ref = input.trim();
  return ref.length >= 1 && ref.length <= 120 ? ref : null;
}

// ─── Sales (list + detail) ───────────────────────────────────────────────────

export interface SaleBuyerView {
  kind: 'CUSTOMER' | 'WALK_IN';
  customerId: string | null;
  customerCode: string | null;
  name: string;
  mobileMasked: string | null;
}

function mapBuyer(b: SaleBuyerDto): SaleBuyerView {
  return {
    kind: b.kind,
    customerId: b.customerId,
    customerCode: b.customerCode,
    name: b.name,
    mobileMasked: b.mobileMasked,
  };
}

export interface SaleListRow {
  id: string;
  saleNumber: string;
  channel: 'DIRECT' | 'MARKET';
  status: SaleStatus;
  paymentStatus: SalePaymentStatus;
  paymentMethod: SalePaymentMethod;
  warehouseId: string;
  buyer: SaleBuyerView;
  itemCount: number;
  totalPaise: Paise;
  invoiceNumber: string | null;
  createdAt: string;
  completedAt: string | null;
}

export function mapSaleListItem(dto: SaleListItemDto): SaleListRow {
  return {
    id: dto.id,
    saleNumber: dto.saleNumber,
    channel: dto.channel,
    status: dto.status,
    paymentStatus: dto.paymentStatus,
    paymentMethod: dto.paymentMethod,
    warehouseId: dto.warehouseId,
    buyer: mapBuyer(dto.buyer),
    itemCount: dto.itemCount,
    totalPaise: moneyToPaise(dto.total),
    invoiceNumber: dto.invoiceNumber,
    createdAt: dto.createdAt,
    completedAt: dto.completedAt,
  };
}

export interface SaleDetailView {
  id: string;
  saleNumber: string;
  channel: 'DIRECT' | 'MARKET';
  status: SaleStatus;
  paymentStatus: SalePaymentStatus;
  warehouseId: string;
  buyer: SaleBuyerView;
  items: SaleLineView[];
  subtotalPaise: Paise;
  gstPaise: Paise;
  totalPaise: Paise;
  changeGivenPaise: Paise | null;
  payment: {
    method: SalePaymentMethod;
    status: SalePaymentRowStatus;
    amountPaise: Paise;
    amountReceivedPaise: Paise | null;
    cardRef: string | null;
    upiTxnRef: string | null;
    confirmedAt: string | null;
  };
  invoiceNumber: string | null;
  /** The billing invoice uuid; null until the sale completes (pending UPI). */
  invoiceId: string | null;
  timeline: { fromStatus: string | null; toStatus: string; at: string }[];
  createdAt: string;
  completedAt: string | null;
}

export function mapSale(dto: SaleDto): SaleDetailView {
  const changeGiven = dto.totals.changeGiven;
  return {
    id: dto.id,
    saleNumber: dto.saleNumber,
    channel: dto.channel,
    status: dto.status,
    paymentStatus: dto.paymentStatus,
    warehouseId: dto.warehouseId,
    buyer: mapBuyer(dto.buyer),
    items: (dto.items ?? []).map(mapLine),
    subtotalPaise: moneyToPaise(dto.totals.subtotal),
    gstPaise: moneyToPaise(dto.totals.gst),
    totalPaise: moneyToPaise(dto.totals.total),
    changeGivenPaise: changeGiven === null || changeGiven === undefined ? null : moneyToPaise(changeGiven),
    payment: {
      method: dto.payment.method,
      status: dto.payment.status,
      amountPaise: moneyToPaise(dto.payment.amount),
      amountReceivedPaise: dto.payment.amountReceived === null ? null : moneyToPaise(dto.payment.amountReceived),
      cardRef: dto.payment.cardRef,
      upiTxnRef: dto.payment.upiTxnRef,
      confirmedAt: dto.payment.confirmedAt,
    },
    invoiceNumber: dto.invoiceNumber,
    invoiceId: dto.invoiceId,
    timeline: dto.timeline ?? [],
    createdAt: dto.createdAt,
    completedAt: dto.completedAt,
  };
}

/** A UPI sale created pending (BR-94): it still needs a confirm (or a cancel). */
export function isPendingUpiSale(sale: Pick<SaleDetailView, 'status' | 'payment'>): boolean {
  return sale.status === 'PENDING_PAYMENT' && sale.payment.method === 'UPI' && sale.payment.status === 'PENDING';
}

// ─── Dashboard summary ───────────────────────────────────────────────────────

export interface CountRevenue {
  count: number;
  revenuePaise: Paise;
}

export interface SalesSummaryView {
  from: string;
  to: string;
  count: number;
  revenuePaise: Paise;
  byChannel: Record<'DIRECT' | 'MARKET', CountRevenue>;
  byMethod: Record<SalePaymentMethod, CountRevenue>;
  needsAttention: SalesDashboardSummaryDto['needsAttention'];
  /** paymentPending + failedSales + invoiceIssues (stockIssues is a subset of failedSales, not added twice). */
  needsAttentionTotal: number;
}

const ZERO_CR: CountRevenue = { count: 0, revenuePaise: 0 };

function byKey<K extends string>(
  keys: readonly K[],
  rows: readonly { count: number; revenue: Money | string }[],
  keyOf: (row: never) => string,
): Record<K, CountRevenue> {
  const out = {} as Record<K, CountRevenue>;
  for (const k of keys) out[k] = ZERO_CR;
  for (const row of rows) {
    const k = keyOf(row as never) as K;
    if (keys.includes(k)) out[k] = { count: row.count, revenuePaise: moneyToPaise(row.revenue) };
  }
  return out;
}

export function mapSalesSummary(dto: SalesDashboardSummaryDto): SalesSummaryView {
  const na = dto.needsAttention;
  return {
    from: dto.from,
    to: dto.to,
    count: dto.count,
    revenuePaise: moneyToPaise(dto.revenue),
    byChannel: byKey(SALE_CHANNELS, dto.byChannel, (r: { channel: string }) => r.channel),
    byMethod: byKey(SALE_PAYMENT_METHODS, dto.byPaymentMethod, (r: { method: string }) => r.method),
    needsAttention: na,
    needsAttentionTotal: na.paymentPending + na.failedSales + na.invoiceIssues,
  };
}

// ─── Market day ──────────────────────────────────────────────────────────────

export interface MarketDayAllocationView {
  productId: string;
  name: string;
  grade: Grade;
  allocatedGrams: number;
  soldGrams: number;
  remainingGrams: number;
}

export interface SalesMarketDayView {
  date: string;
  warehouseId: string | null;
  count: number;
  revenuePaise: Paise;
  byMethod: Record<SalePaymentMethod, CountRevenue>;
  allocation: MarketDayAllocationView[];
  items: SaleListRow[];
}

export function mapSalesMarketDay(dto: SalesMarketDayDto): SalesMarketDayView {
  return {
    date: dto.date,
    warehouseId: dto.warehouseId,
    count: dto.totals.count,
    revenuePaise: moneyToPaise(dto.totals.revenue),
    byMethod: byKey(SALE_PAYMENT_METHODS, dto.byPaymentMethod ?? [], (r: { method: string }) => r.method),
    allocation: dto.allocation.map((a) => ({
      productId: a.productId,
      name: a.name,
      grade: a.grade,
      allocatedGrams: qtyToGrams(a.allocatedQtyKg),
      soldGrams: qtyToGrams(a.soldQtyKg),
      remainingGrams: qtyToGrams(a.remainingQtyKg),
    })),
    items: (dto.items ?? []).map(mapSaleListItem),
  };
}

// ─── HORECA / B2B (read-only) ────────────────────────────────────────────────

export interface ChannelOrderRow {
  id: string;
  orderNumber: string;
  channel: 'HORECA' | 'B2B';
  status: ChannelOrderStatus;
  paymentStatus: SalePaymentStatus;
  warehouseId: string;
  customerCode: string | null;
  businessName: string | null;
  itemCount: number;
  totalPaise: Paise;
  placedAt: string;
}

export function mapChannelOrderListItem(dto: ChannelOrderListItemDto): ChannelOrderRow {
  return {
    id: dto.id,
    orderNumber: dto.orderNumber,
    channel: dto.channel,
    status: dto.status,
    paymentStatus: dto.paymentStatus,
    warehouseId: dto.warehouseId,
    customerCode: dto.customerCode,
    businessName: dto.businessName,
    itemCount: dto.itemCount,
    totalPaise: moneyToPaise(dto.total),
    placedAt: dto.placedAt,
  };
}

/** Status groups for the channel KPI tiles, counted over the rows loaded so far. */
export type ChannelStatusGroup = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED';

const CHANNEL_GROUP: Record<ChannelOrderStatus, ChannelStatusGroup> = {
  PENDING_PAYMENT: 'PENDING',
  CONFIRMED: 'PENDING',
  PACKED: 'IN_PROGRESS',
  DISPATCHED: 'IN_PROGRESS',
  READY_FOR_PICKUP: 'IN_PROGRESS',
  OUT_FOR_DELIVERY: 'IN_PROGRESS',
  DELIVERED: 'COMPLETED',
  PICKED_UP: 'COMPLETED',
  CANCELLED: 'CLOSED',
  RETURNED: 'CLOSED',
};

export function channelStatusGroup(status: ChannelOrderStatus): ChannelStatusGroup {
  return CHANNEL_GROUP[status] ?? 'PENDING';
}

export interface ChannelOrderTally {
  orders: number;
  byGroup: Record<ChannelStatusGroup, number>;
  /** Sum of non-cancelled, non-returned rows, integer paise. */
  valuePaise: Paise;
}

export function tallyChannelOrders(rows: readonly ChannelOrderRow[]): ChannelOrderTally {
  const byGroup: Record<ChannelStatusGroup, number> = { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0, CLOSED: 0 };
  let valuePaise = 0;
  for (const r of rows) {
    const g = channelStatusGroup(r.status);
    byGroup[g] += 1;
    if (g !== 'CLOSED') valuePaise += r.totalPaise;
  }
  return { orders: rows.length, byGroup, valuePaise };
}

/**
 * A HORECA / B2B order opened from the list, from GET /admin/orders/{orderId}
 * (order.list.view_all, BR-99). The sales API has no channel-order detail of
 * its own; this is the general admin order detail, which also names the
 * order's invoice (null until one exists).
 */
export interface ChannelOrderDetailView {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  warehouseName: string;
  buyerName: string;
  customerCode: string | null;
  items: { productId: string; name: string; grade: string; qtyGrams: number; unitPricePaise: Paise; lineTotalPaise: Paise }[];
  subtotalPaise: Paise;
  gstPaise: Paise;
  totalPaise: Paise;
  invoiceId: string | null;
  invoiceNumber: string | null;
  placedAt: string;
}

export function mapChannelOrderDetail(dto: AdminOrderDetailDto): ChannelOrderDetailView {
  return {
    id: dto.id,
    orderNumber: dto.orderNumber,
    status: dto.status,
    paymentStatus: dto.paymentStatus,
    paymentMethod: dto.paymentMethod,
    warehouseName: dto.warehouse.name,
    buyerName: dto.buyer.name,
    customerCode: dto.buyer.customerCode,
    items: dto.items.map((l) => ({
      productId: l.productId,
      name: l.name,
      grade: l.grade,
      qtyGrams: qtyToGrams(l.qtyKg),
      unitPricePaise: moneyToPaise(l.unitPrice),
      lineTotalPaise: moneyToPaise(l.lineTotal),
    })),
    subtotalPaise: moneyToPaise(dto.totals.subtotal),
    gstPaise: moneyToPaise(dto.totals.gst),
    totalPaise: moneyToPaise(dto.totals.total),
    invoiceId: dto.invoice?.id ?? null,
    invoiceNumber: dto.invoice?.invoiceNumber ?? null,
    placedAt: dto.placedAt,
  };
}
