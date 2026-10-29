/**
 * Pure business rules for the counter sale flow (design module M6).
 *
 * No React, no network. Unit-tested in tests/sales_flow.test.ts.
 *
 * BR-85: only sales.sale.create + payment.record may create a sale.
 * BR-86: exactly one buyer identity; a walk-in cannot pay by wallet.
 * BR-88: one Idempotency-Key per sale intent; a re-quote is a new intent.
 * BR-89: expectedTotal is always the server quote total, never a client sum.
 * BR-94: CASH sends the tender; CARD sends the reference; UPI sends nothing.
 * BR-95: products are channel-scoped.
 * BR-98: all maths through integer paise.
 */
import { parseMoney, toPaise } from '@tohfa/shared-types';
import type { SaleCreateDto, SaleDto, SaleItemRequestDto, SaleQuoteDto, SaleQuoteRequestDto, SaleCreateChannel, SalePaymentMethod } from '../../../api/sales';
import type { ApiError } from '../../../../../shell/api/client';
import { gramsToQtyKg } from './mappers';

// ─── Types ─────────────────────────────────────────────────────────────────────

/** One line in the cart — productId + grade + integer grams + API unit price string. */
export interface CartLine {
  /** `${productId}|${grade}` — deduplication key. */
  key: string;
  productId: string;
  name: string;
  grade: 'GRADE_1' | 'GRADE_2' | 'GRADE_3' | 'REJECT';
  /** Quantity in integer grams (BR-98). */
  qtyGrams: number;
  /** API Money string (kept for quote requests; never summed client-side). */
  unitPrice: string;
}

/** The buyer identity for a sale: a known customer or a walk-in. */
export type SaleBuyer =
  | { kind: 'CUSTOMER'; customerId: string; name: string; code: string; walletBalance: string }
  | { kind: 'WALK_IN'; name: string; mobile?: string | undefined };

export type PaymentInput =
  | { method: 'CASH'; cashReceived?: string | undefined }
  | { method: 'UPI' }
  | { method: 'WALLET' }
  | { method: 'CARD'; cardRef?: string | undefined; cashReceived?: string | undefined };

export type BuildSaleInput = {
  channel: SaleCreateChannel;
  buyer: SaleBuyer;
  cart: CartLine[];
  quote: SaleQuoteDto;
  payment: PaymentInput;
  warehouseId?: string | undefined;
};

export type BuildSaleResult =
  | { ok: true; body: SaleCreateDto }
  | { ok: false; errorKey: string };

// ─── Permissions ───────────────────────────────────────────────────────────────

/**
 * BR-85: the New Sale flow needs both sales.sale.create AND payment.record.
 * A Main Warehouse Admin (who only has sales.history.view) is never offered it.
 */
export function canCreateSale(can: (code: string) => boolean): boolean {
  return can('sales.sale.create') && can('payment.record');
}

/** Payment methods available for the given buyer. BR-86: walk-in cannot use wallet. */
export function availablePaymentMethods(buyer: SaleBuyer): SalePaymentMethod[] {
  const all: SalePaymentMethod[] = ['CASH', 'UPI', 'CARD', 'WALLET'];
  if (buyer.kind === 'WALK_IN') return all.filter((m) => m !== 'WALLET');
  return all;
}

// ─── Quote ─────────────────────────────────────────────────────────────────────

/**
 * BR-95: the quote request always carries the channel (the server requires it).
 * BR-98: quantities are sent as exact kg strings from integer grams, never a
 * float sum; prices are not sent (the server re-prices).
 */
export function buildQuoteRequest(
  channel: SaleCreateChannel,
  cart: CartLine[],
  warehouseId: string | undefined,
): SaleQuoteRequestDto {
  const items: SaleItemRequestDto[] = cart.map((line) => ({
    productId: line.productId,
    grade: line.grade,
    qtyKg: gramsToQtyKg(line.qtyGrams),
  }));
  return {
    channel,
    items,
    ...(warehouseId !== undefined ? { warehouseId } : {}),
  };
}

/**
 * BR-89: a quote is usable only for the exact cart and channel it priced.
 * Comparing by productId + grade + kg string avoids float comparison.
 */
export function quoteMatchesCart(
  quote: SaleQuoteDto,
  cart: CartLine[],
  channel?: SaleCreateChannel,
): boolean {
  if (channel !== undefined && quote.channel !== channel) return false;
  if (quote.lines.length !== cart.length) return false;
  for (let i = 0; i < cart.length; i++) {
    const qLine = quote.lines[i]!;
    const cLine = cart[i]!;
    if (qLine.productId !== cLine.productId) return false;
    if (qLine.grade !== cLine.grade) return false;
    if (gramsToQtyKg(cLine.qtyGrams) !== String(qLine.qtyKg)) return false;
  }
  return true;
}

// ─── Create body ───────────────────────────────────────────────────────────────

/**
 * Build the POST /admin/sales body or return an error key that the screen shows.
 *
 * Validation order:
 *  1. BR-89: quote must match the current cart (stale? re-quote).
 *  2. BR-86: walk-in cannot pay by wallet.
 *  3. BR-86: walk-in needs a non-blank name.
 *  4. BR-94: CASH tender must be parseable and cover the total.
 *  5. BR-94: CARD needs a non-blank reference.
 */
export function buildCreateSaleBody(input: BuildSaleInput): BuildSaleResult {
  const { channel, buyer, cart, quote, payment, warehouseId } = input;

  // 1. Quote staleness
  if (!quoteMatchesCart(quote, cart, channel)) {
    return { ok: false, errorKey: 'salesDirect.error.quoteStale' };
  }

  // 2. Walk-in + wallet
  if (buyer.kind === 'WALK_IN' && payment.method === 'WALLET') {
    return { ok: false, errorKey: 'admin.error.WALKIN_WALLET_NOT_ALLOWED' };
  }

  // 3. Walk-in name
  if (buyer.kind === 'WALK_IN' && !buyer.name.trim()) {
    return { ok: false, errorKey: 'salesDirect.walkIn.nameRequired' };
  }

  // 4. CASH validation (BR-94)
  let amountReceived: string | undefined;
  if (payment.method === 'CASH') {
    const raw = payment.cashReceived ?? '';
    const cleaned = raw.replace(/,/g, '').trim();
    if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
      return { ok: false, errorKey: 'salesDirect.payment.cashInvalid' };
    }
    let receivedPaise: number;
    try {
      receivedPaise = toPaise(parseMoney(cleaned));
    } catch {
      return { ok: false, errorKey: 'salesDirect.payment.cashInvalid' };
    }
    let totalPaise: number;
    try {
      totalPaise = toPaise(parseMoney(String(quote.totals.total)));
    } catch {
      return { ok: false, errorKey: 'salesDirect.error.quoteStale' };
    }
    if (receivedPaise < totalPaise) {
      return { ok: false, errorKey: 'admin.error.PAYMENT_AMOUNT_INSUFFICIENT' };
    }
    // Format to 2dp for the wire
    amountReceived = (receivedPaise / 100).toFixed(2);
  }

  // 5. CARD reference (BR-94)
  let cardRef: string | undefined;
  if (payment.method === 'CARD') {
    const ref = 'cardRef' in payment ? payment.cardRef?.trim() ?? '' : '';
    if (!ref) {
      return { ok: false, errorKey: 'salesDirect.payment.cardRefRequired' };
    }
    cardRef = ref;
  }

  const paymentBody: SaleCreateDto['payment'] = {
    method: payment.method as SalePaymentMethod,
    ...(amountReceived !== undefined ? { amountReceived } : {}),
    ...(cardRef !== undefined ? { cardRef } : {}),
  };

  const body: SaleCreateDto = {
    channel,
    ...(warehouseId !== undefined ? { warehouseId } : {}),
    ...(buyer.kind === 'CUSTOMER' ? { customer: { customerId: buyer.customerId } } : {}),
    ...(buyer.kind === 'WALK_IN'
      ? {
          walkIn: {
            name: buyer.name.trim(),
            ...(buyer.mobile ? { mobile: buyer.mobile } : {}),
          },
        }
      : {}),
    items: cart.map((line) => ({
      productId: line.productId,
      grade: line.grade,
      qtyKg: gramsToQtyKg(line.qtyGrams),
    })),
    expectedTotal: String(quote.totals.total),
    payment: paymentBody,
  };

  return { ok: true, body };
}

// ─── Cash change ───────────────────────────────────────────────────────────────

/**
 * BR-94b: integer paise change for a cash payment. Returns null when the
 * tender is unparseable, empty, or less than the total (not a valid tender).
 */
export function cashChangePaise(total: string, received: string): number | null {
  const cleaned = received.replace(/,/g, '').trim();
  if (!cleaned) return null;
  try {
    const totalPaise = toPaise(parseMoney(String(total)));
    const receivedPaise = toPaise(parseMoney(cleaned));
    if (receivedPaise < totalPaise) return null;
    return receivedPaise - totalPaise;
  } catch {
    return null;
  }
}

// ─── UPI confirm ───────────────────────────────────────────────────────────────

/** Build the UPI confirm body or return an error key (BR-94). */
export function upiConfirmBody(ref: string): { ok: true; body: { upiTxnRef: string } } | { ok: false; errorKey: string } {
  const trimmed = ref.trim();
  if (!trimmed) return { ok: false, errorKey: 'salesDirect.payment.upiRefRequired' };
  return { ok: true, body: { upiTxnRef: trimmed } };
}

// ─── Conflict parsing ─────────────────────────────────────────────────────────

export type SaleConflict =
  | { kind: 'price'; quote: SaleQuoteDto }
  | { kind: 'stock'; lines: { productId: string; grade: string; requestedQtyKg: string; availableQtyKg: string }[] };

/**
 * Parse a 409 error from createSale into a structured conflict, or null for any
 * other error (network, wrong status, etc.). BR-89.
 */
export function saleConflictFromError(err: unknown): SaleConflict | null {
  if (!(err instanceof Error) || !('problem' in err)) return null;
  const problem = (err as ApiError).problem;
  if (!problem || typeof problem !== 'object') return null;
  const code = (problem as { code?: string }).code;
  const meta = (problem as { meta?: Record<string, unknown> }).meta;
  if (code === 'SALE_PRICE_CHANGED' && meta?.['quote']) {
    return { kind: 'price', quote: meta['quote'] as SaleQuoteDto };
  }
  if (code === 'SALE_STOCK_CHANGED' && Array.isArray(meta?.['lines'])) {
    return {
      kind: 'stock',
      lines: meta['lines'] as { productId: string; grade: string; requestedQtyKg: string; availableQtyKg: string }[],
    };
  }
  return null;
}

// ─── Idempotent submit ─────────────────────────────────────────────────────────

export interface IdempotencyKeys {
  /** Return the idempotency key to use for this body (memoised by fingerprint). */
  keyFor: (body: unknown) => string;
}

/**
 * Submit a sale with idempotency. BR-88: replaying the same body reuses the
 * same key; a re-quoted total (changed `expectedTotal`) gets a new key.
 */
export async function submitSale(
  body: SaleCreateDto,
  keys: IdempotencyKeys,
  send: (body: SaleCreateDto, idempotencyKey: string) => Promise<SaleDto>,
): Promise<SaleDto> {
  const key = keys.keyFor(body);
  return send(body, key);
}

// ─── Customer lookup ─────────────────────────────────────────────────────────

/**
 * Map a raw search string to the correct customerLookupParams variant.
 * 10-digit string → `{ mobile }`. Others ≥ 2 trimmed chars → `{ q }`.
 * Shorter than 2 chars → null (don't bother the server).
 */
export function customerLookupParams(
  input: string,
): { mobile: string } | { q: string } | null {
  const trimmed = input.trim();
  if (/^\d{10}$/.test(trimmed)) return { mobile: trimmed };
  if (trimmed.length >= 2) return { q: trimmed };
  return null;
}
