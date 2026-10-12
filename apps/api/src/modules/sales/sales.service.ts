/**
 * SWA Module 6 (Direct / Market sales), write side: sellable products, counter customer lookup,
 * quote, create, and UPI confirm. BR-85 .. BR-90, BR-94, BR-95, BR-98 (and BR-86/87/88 for the
 * write itself). Takes a `ResolvedScope`, never a `Request`.
 *
 * ONE TRANSACTION PER SALE (BR-87). `create` claims the Idempotency-Key, re-prices under row locks,
 * and writes order, items (with batch_id / allocation_id), status history, sale_payments, the wallet
 * debit, SALE stock_ledger rows, the allocation consumption, the invoice (gap-free number) and the
 * audit row on ONE client. Any throw rolls all of it back, and only then is a `sale_attempts` row
 * written through the pool - a different connection - so the evidence of the failure survives the
 * rollback. The response (and the `afterCommit` hook) only happens after COMMIT returned.
 *
 * DECISIONS (also in the final report):
 *  - OWNER DECISION 2026-10-11 (BR-95a/d/i): a DIRECT sale draws from ALL pooled ACTIVE batch stock
 *    at the warehouse, minus what pending UPI sales hold. It is not limited to RESERVE/BUFFER and
 *    is not net of the ONLINE or LIVE_MARKET allocations, and it does not decrement any allocation
 *    row. Consequence (BR-95k): an ONLINE or LIVE_MARKET allocation can then count on stock that is
 *    no longer on the shelf. MARKET reads the shelf too (LEAST in sellableCte), and the ONLINE
 *    checkout's SALE ledger row is refused by trg_stock_ledger_balance and surfaces as 409
 *    STOCK_UNAVAILABLE; stock never goes negative. The allocation available_qty figures (catalog,
 *    cart reserve, allocation dashboard) are NOT reduced by a DIRECT sale and can overstate.
 *  - UPI hold (BR-94): a pending UPI sale's order_items already name the FEFO batches; that quantity
 *    is subtracted from what other sales can draw (see sales.repo.ts HOLDS_CTE) until the confirm
 *    writes the SALE ledger rows. No job releases a hold yet (BR-94i is not implemented).
 *  - A product with neither an active retail price nor an active fair-price ceiling cannot be sold:
 *    it is left out of the product list and a quote/sale for it is 409 CONFLICT (no 50.00 default).
 *  - GST is exclusive and computed once per invoice (BR-98): total = subtotal + gst.
 */
import { fromPaise, parseMoney, toPaise, ScopeLevel, type Money } from '@tohfa/shared-types';
import { writeAuditLog } from '../../audit/auditLog.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import {
  beginIdempotent,
  idempotencyStore,
  requireIdempotencyKey,
  type IdempotencyStore,
} from '../../http/idempotency.js';
import { AppError } from '../../http/problem.js';
import { currentTraceId, logger } from '../../logger.js';
import type { PaymentGateway } from '../../payments/gateway.js';
import { paymentGateway } from '../../payments/index.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { targetWarehouse } from '../finance/finance.shared.js';
import { invoicesService, type InvoicesService } from '../invoices/invoices.service.js';
import { walletService, type WalletService } from '../wallet/wallet.service.js';
import {
  computeTotals,
  drawFefo,
  formatRate,
  gramsToKg,
  kgToGrams,
  maskMobile,
  parseRateBasisPoints,
  splitLineAcrossDraws,
  type Draw,
} from './sales.math.js';
import { salesRepo, type CustomerMatch, type SaleItemRow, type SaleRecord, type SalesRepo } from './sales.repo.js';
import type {
  CustomerLookupQuery,
  CustomerLookupResponse,
  Grade,
  ListSaleProductsQuery,
  ListSaleProductsResponse,
  Sale,
  SaleCancelBody,
  SaleChannel,
  SaleCreateBody,
  SaleCreateChannel,
  SaleLine,
  SaleQuote,
  SaleQuoteBody,
  SaleUpiConfirmBody,
} from './sales.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

/** Verifies a UPI gateway reference for the expected amount. False = not verified (BR-94f). */
export type UpiVerifier = (upiTxnRef: string, expectedAmountPaise: number) => Promise<boolean>;

export interface SalesServiceDeps {
  repo: SalesRepo;
  /** Reads outside a transaction AND the sale_attempts write (a separate connection, BR-87b). */
  db: Executor;
  runTx: TransactionRunner;
  idempotency: IdempotencyStore;
  wallet: Pick<WalletService, 'move'>;
  invoices: Pick<InvoicesService, 'issue'>;
  verifyUpi: UpiVerifier;
  gateway?: PaymentGateway;
  /** Called only after COMMIT (BR-87e). The place a post-sale event/notification belongs. */
  afterCommit?: (sale: Sale) => void;
}

export interface ItemInput {
  productId: string;
  grade: Grade;
  qtyKg: string;
}

export interface CreateSaleResult {
  sale: Sale;
  replayed: boolean;
}

export interface SalesService {
  listProducts(scope: ResolvedScope, query: ListSaleProductsQuery): Promise<ListSaleProductsResponse>;
  lookupCustomers(scope: ResolvedScope, query: CustomerLookupQuery): Promise<CustomerLookupResponse>;
  quote(scope: ResolvedScope, body: SaleQuoteBody): Promise<SaleQuote>;
  /**
   * `paymentScope` is the caller's resolution of `payment.record` (null = not held): taking any
   * payment needs it, and it is checked here before any write (BR-85g).
   */
  create(
    scope: ResolvedScope,
    paymentScope: ResolvedScope | null,
    idempotencyKey: string | undefined,
    body: SaleCreateBody,
  ): Promise<CreateSaleResult>;
  confirmUpi(
    scope: ResolvedScope,
    saleId: string,
    idempotencyKey: string | undefined,
    body: SaleUpiConfirmBody,
  ): Promise<Sale>;
  /** BR-94i: Cancel an unpaid pending UPI sale and release its batch hold. */
  cancel(
    scope: ResolvedScope,
    saleId: string,
    idempotencyKey: string | undefined,
    body?: SaleCancelBody,
  ): Promise<Sale>;
  /** BR-94g: Checks that a sale is confirmed/paid; throws 409 PAYMENT_PENDING if still pending. */
  requirePaid(
    scope: ResolvedScope,
    saleId: string,
  ): Promise<Sale>;
  /** BR-94i: Expire pending UPI sales older than system_config sales.upi_pending_expiry_minutes. */
  expirePendingUpi(limit?: number): Promise<{ expiredCount: number }>;
}

const GST_CONFIG_KEY = 'retail_gst_rate_percent';
/** docs/rules.md BR-98i: the documented default when the system_config row is missing. */
const DEFAULT_GST_BASIS_POINTS = 0;
const CREATE_OPERATION = 'sales.sale.create';
const CONFIRM_OPERATION = 'payment.record.upi_confirm';
const CANCEL_OPERATION = 'sales.sale.cancel';
const UPI_EXPIRY_CONFIG_KEY = 'sales.upi_pending_expiry_minutes';
const UPI_REFUND_MODE_CONFIG_KEY = 'sales.upi_refund_mode';

interface PricedLine {
  productId: string;
  name: string;
  grade: Grade;
  grams: number;
  unitPrice: Money;
  lineTotal: Money;
  draws: Draw[];
  drawTotals: Money[];
}

interface PricedSale {
  lines: PricedLine[];
  subtotal: Money;
  gst: Money;
  total: Money;
  rateBasisPoints: number;
}

/** The warehouses whose rows the scope may touch; null = unrestricted. Fails closed (BR-30). */
export function visibleWarehouses(scope: ResolvedScope): string[] | null {
  if (scope.level === ScopeLevel.ALL || scope.level === ScopeLevel.CONDITIONAL) return null;
  return scope.warehouseIds;
}

function notSupported(channel: SaleCreateChannel): never {
  throw new AppError('SALE_CHANNEL_NOT_SUPPORTED', {
    detail: `${channel} sales cannot be created in Track 1 (BR-13, BR-85e).`,
  });
}

function asSaleChannel(channel: SaleCreateChannel): SaleChannel {
  if (channel === 'DIRECT' || channel === 'MARKET') return channel;
  return notSupported(channel);
}

function saleNotFound(id: string): AppError {
  // Same body for "no such sale" and "another warehouse's sale" (BR-30).
  return new AppError('NOT_FOUND', { detail: `No sale with id ${id} is visible to you.` });
}

/**
 * Re-throws a Postgres CHECK violation (23514) raised while drawing stock as the domain conflict it
 * means. Only the stock-ledger inserts and the allocation consumption run inside the guarded block,
 * so every 23514 there is a stock guard: INSUFFICIENT_STOCK and allocations_not_oversold_chk, but
 * also the ledger trigger's hint-less warehouse-mismatch refusal (a batch no longer at the sale's
 * warehouse). Each of those used to surface as a 500; each means "the stock you priced is not what
 * is on this shelf now", so each is 409 SALE_STOCK_CHANGED.
 */
function mapStockGuard(error: unknown): unknown {
  const pg = error as { code?: string };
  if (pg.code === '23514') {
    return new AppError('SALE_STOCK_CHANGED', { detail: 'Stock changed while the sale was being written. Re-quote and confirm.', cause: error });
  }
  return error;
}

/** True for a unique violation (23505) on the named constraint or unique index. */
function isUniqueViolation(error: unknown, constraint: string): boolean {
  const pg = error as { code?: string; constraint?: string };
  return pg.code === '23505' && pg.constraint === constraint;
}

/** Group order_items (one row per batch drawn) back into one line per product, grade and price. */
export function aggregateLines(items: readonly SaleItemRow[]): SaleLine[] {
  const lines = new Map<string, { line: SaleLine; grams: number; paise: number }>();
  for (const item of items) {
    const key = `${item.productId}|${item.grade}|${item.unitPrice}`;
    const existing = lines.get(key);
    const grams = kgToGrams(item.qtyKg);
    const paise = toPaise(item.lineTotal);
    if (existing === undefined) {
      lines.set(key, {
        line: { productId: item.productId, name: item.name, grade: item.grade, qtyKg: '', unitPrice: item.unitPrice, lineTotal: item.lineTotal },
        grams,
        paise,
      });
    } else {
      existing.grams += grams;
      existing.paise += paise;
    }
  }
  return [...lines.values()].map(({ line, grams, paise }) => ({ ...line, qtyKg: gramsToKg(grams), lineTotal: fromPaise(paise) }));
}

/**
 * THE allow-list serializer for a sale (BR-90). Every key is named here; nothing is spread from a
 * row, so a column added to orders / order_items / inventory_batches cannot reach a response.
 * The buyer mobile is ALWAYS masked: a full mobile is never in a sale response (SaleBuyer).
 */
export function toSale(record: SaleRecord): Sale {
  if (record.payment === null) {
    throw new AppError('INTERNAL', { detail: `Sale ${record.id} has no payment row.` });
  }
  const isCustomer = record.customerId !== null;
  const mobile = isCustomer ? record.customerMobile : record.walkInMobile;
  return {
    id: record.id,
    saleNumber: record.orderNumber,
    channel: record.channel,
    status: record.status as Sale['status'],
    paymentStatus: record.paymentStatus as Sale['paymentStatus'],
    warehouseId: record.warehouseId,
    buyer: {
      kind: isCustomer ? 'CUSTOMER' : 'WALK_IN',
      customerId: record.customerId,
      customerCode: isCustomer ? record.customerCode : null,
      name: (isCustomer ? record.customerName : record.walkInName) ?? '',
      mobileMasked: mobile === null ? null : maskMobile(mobile),
    },
    items: aggregateLines(record.items),
    totals: {
      subtotal: record.subtotal,
      gst: record.gstAmount,
      total: record.totalAmount,
      changeGiven: record.payment.changeGiven,
    },
    payment: {
      method: record.payment.method,
      status: record.payment.status,
      amount: record.payment.amount,
      amountReceived: record.payment.amountReceived,
      cardRef: record.payment.cardRef,
      upiTxnRef: record.payment.upiTxnRef,
      confirmedAt: record.payment.confirmedAt === null ? null : record.payment.confirmedAt.toISOString(),
    },
    invoiceNumber: record.invoiceNumber,
    invoiceId: record.invoiceId,
    createdAt: record.createdAt.toISOString(),
    completedAt: record.completedAt === null ? null : record.completedAt.toISOString(),
  };
}

function encodeCursor(parts: string[]): string {
  return Buffer.from(JSON.stringify(parts), 'utf8').toString('base64url');
}

function decodeProductCursor(raw: string): { name: string; productId: string; grade: Grade } {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (
      Array.isArray(parsed) &&
      parsed.length === 3 &&
      parsed.every((p) => typeof p === 'string') &&
      /^[0-9a-f-]{36}$/i.test(parsed[1] as string) &&
      ['GRADE_1', 'GRADE_2', 'GRADE_3', 'REJECT'].includes(parsed[2] as string)
    ) {
      return { name: parsed[0] as string, productId: parsed[1] as string, grade: parsed[2] as Grade };
    }
  } catch {
    // fall through
  }
  throw new AppError('VALIDATION_FAILED', { detail: 'cursor is not a value returned by this endpoint.', errors: { 'query.cursor': ['Invalid cursor.'] } });
}

/** The default UPI verifier: asks the configured gateway whether the payment was captured. */
export const gatewayUpiVerifier: UpiVerifier = async (upiTxnRef, expectedAmountPaise) => {
  if (paymentGateway.fetchPayment === undefined) return false;
  try {
    const payment = await paymentGateway.fetchPayment(upiTxnRef);
    if (payment === null || payment.status !== 'captured') return false;
    // The mock gateway returns a fixed amount for any reference, so the amount is only checked
    // against a real provider. Tests inject their own verifier.
    // The payment cannot be tied to THIS sale here: the counter collects UPI outside a gateway
    // order, and fetchPayment exposes no notes/receipt that names our sale. That is why the
    // reference is unique across sale_payments (migration 0067) - one payment, one sale.
    if (paymentGateway.provider !== 'mock' && payment.amountPaise !== expectedAmountPaise) return false;
    return true;
  } catch (error) {
    logger.warn({ err: error }, 'sales: UPI gateway verification failed; treating the payment as unverified');
    return false;
  }
};

export function createSalesService(deps: Partial<SalesServiceDeps> = {}): SalesService {
  const repo = deps.repo ?? salesRepo;
  const db = deps.db ?? pool;
  const runTx: TransactionRunner = deps.runTx ?? ((fn) => withTransaction(fn));
  const idempotency = deps.idempotency ?? idempotencyStore;
  const wallet = deps.wallet ?? walletService;
  const invoices = deps.invoices ?? invoicesService;
  const verifyUpi = deps.verifyUpi ?? gatewayUpiVerifier;
  const afterCommit = deps.afterCommit;

  async function resolveWarehouse(executor: Executor, scope: ResolvedScope, requested: string | undefined, field: string): Promise<string> {
    const warehouseId = targetWarehouse(scope, requested, field);
    if (!(await repo.activeWarehouseExists(executor, warehouseId))) {
      throw new AppError('NOT_FOUND', { detail: `Warehouse "${warehouseId}" not found.` });
    }
    return warehouseId;
  }

  /** BR-98, BR-98i: the rate comes from system_config; a missing or malformed row falls back to 0 and is logged. */
  async function gstRate(executor: Executor): Promise<number> {
    const raw = await repo.configValue(executor, GST_CONFIG_KEY);
    if (raw === undefined) {
      logger.warn({ key: GST_CONFIG_KEY }, 'sales: system_config row missing; using the documented default GST rate 0');
      return DEFAULT_GST_BASIS_POINTS;
    }
    const parsed = parseRateBasisPoints(raw);
    if (parsed === null) {
      logger.warn({ key: GST_CONFIG_KEY }, 'sales: system_config value is not a valid rate; using the documented default GST rate 0');
      return DEFAULT_GST_BASIS_POINTS;
    }
    return parsed;
  }

  async function upiPendingExpiryMinutes(executor: Executor): Promise<number | null> {
    const raw = await repo.configValue(executor, UPI_EXPIRY_CONFIG_KEY);
    if (typeof raw === 'number' && Number.isInteger(raw) && raw > 0) return raw;
    if (typeof raw === 'string') {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return null;
  }

  async function upiRefundMode(executor: Executor): Promise<'manual' | 'auto'> {
    const raw = await repo.configValue(executor, UPI_REFUND_MODE_CONFIG_KEY);
    return raw === 'auto' ? 'auto' : 'manual';
  }

  /**
   * The ONE pricing and stock path used by quote and create (BR-89). With `lock`, the candidate
   * batches (and for MARKET the LIVE_MARKET allocations) are row-locked first, so the availability
   * read and the draws are made on stock nobody else can take before this transaction ends.
   */
  async function priceSale(
    executor: Executor,
    warehouseId: string,
    channel: SaleChannel,
    items: readonly ItemInput[],
    lock: boolean,
  ): Promise<PricedSale> {
    const rateBasisPoints = await gstRate(executor);
    // Lock in a stable order (product id, grade) so two counters selling the same products never
    // deadlock; report in the request's order.
    const order = items
      .map((item, index) => ({ item, index }))
      .sort((a, b) => (a.item.productId + a.item.grade < b.item.productId + b.item.grade ? -1 : 1));

    const priced: Array<Omit<PricedLine, 'lineTotal' | 'drawTotals'> | null> = items.map(() => null);
    const shortages: Array<{ productId: string; grade: Grade; requestedQtyKg: string; availableQtyKg: string }> = [];

    for (const { item, index } of order) {
      if (item.grade === 'REJECT') {
        throw new AppError('VALIDATION_FAILED', {
          detail: 'REJECT grade produce is never sellable.',
          errors: { [`body.items.${index}.grade`]: ['REJECT is not sellable.'] },
        });
      }
      const product = await repo.findActiveProduct(executor, item.productId);
      // BR-95h: a product this warehouse has never stocked is 404, like any id outside the scope.
      if (product === null || !(await repo.warehouseStocksProduct(executor, warehouseId, item.productId, item.grade))) {
        throw new AppError('NOT_FOUND', { detail: `Product ${item.productId} (${item.grade}) is not stocked at this warehouse.` });
      }
      const unitPrice = await repo.activePrice(executor, item.productId, item.grade);
      if (unitPrice === null) {
        throw new AppError('CONFLICT', {
          detail: `${product.name} (${item.grade}) has no active retail price or fair price ceiling, so it cannot be sold.`,
          meta: { reason: 'PRICE_NOT_SET', productId: item.productId, grade: item.grade },
        });
      }
      if (lock) await repo.lockStock(executor, warehouseId, channel, item.productId, item.grade);
      const batches = (await repo.sellableBatches(executor, warehouseId, channel, item.productId, item.grade)).map((b) => ({
        batchId: b.batchId,
        allocationId: b.allocationId,
        sellableGrams: kgToGrams(b.sellableQtyKg),
      }));
      const grams = kgToGrams(item.qtyKg);
      const draws = drawFefo(batches, grams);
      if (draws === null) {
        const available = batches.reduce((acc, b) => acc + Math.max(0, b.sellableGrams), 0);
        shortages.push({ productId: item.productId, grade: item.grade, requestedQtyKg: gramsToKg(grams), availableQtyKg: gramsToKg(available) });
        continue;
      }
      priced[index] = { productId: item.productId, name: product.name, grade: item.grade, grams, unitPrice, draws };
    }

    if (shortages.length > 0) {
      const first = shortages[0]!;
      throw new AppError('SALE_STOCK_CHANGED', {
        detail: `Only ${first.availableQtyKg} kg of ${first.productId} / ${first.grade} can be sold on ${channel} now.`,
        meta: { lines: shortages },
      });
    }

    const lines = priced as Array<Omit<PricedLine, 'lineTotal' | 'drawTotals'>>;
    const totals = computeTotals(lines.map((l) => ({ unitPrice: l.unitPrice, grams: l.grams })), rateBasisPoints);
    return {
      lines: lines.map((line, i) => ({
        ...line,
        lineTotal: totals.lineTotals[i]!,
        drawTotals: splitLineAcrossDraws(line.unitPrice, line.draws),
      })),
      subtotal: totals.subtotal,
      gst: totals.gst,
      total: totals.total,
      rateBasisPoints,
    };
  }

  function toQuote(channel: SaleChannel, priced: PricedSale): SaleQuote {
    return {
      channel,
      lines: priced.lines.map((line) => ({
        productId: line.productId,
        name: line.name,
        grade: line.grade,
        qtyKg: gramsToKg(line.grams),
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      })),
      totals: { subtotal: priced.subtotal, gst: priced.gst, total: priced.total, changeGiven: null },
      gstRatePercent: formatRate(priced.rateBasisPoints),
      quotedAt: new Date().toISOString(),
    };
  }

  /**
   * BR-87b: the failure record. Written through `db` (the pool), i.e. NOT on the rolled-back
   * client, so it commits on its own. The payload is an allow-list: no name, no mobile, no card or
   * UPI reference, no farm identity.
   */
  async function recordAttempt(
    scope: ResolvedScope,
    warehouseId: string,
    error: unknown,
    context: Record<string, unknown>,
  ): Promise<void> {
    const reasonCode = error instanceof AppError ? error.code : 'INTERNAL';
    const meta = error instanceof AppError ? error.meta : undefined;
    const payload: Record<string, unknown> = {
      ...context,
      status: error instanceof AppError ? error.status : 500,
      traceId: currentTraceId() ?? null,
    };
    if (meta !== undefined) {
      const safeMeta: Record<string, unknown> = {};
      for (const key of ['lines', 'expectedTotal', 'currentTotal', 'total', 'amountReceived', 'reason'] as const) {
        if (key in meta) safeMeta[key] = meta[key];
      }
      payload['meta'] = safeMeta;
    }
    try {
      await repo.insertAttempt(db, { warehouseId, actorId: scope.userId, reasonCode, payload });
    } catch (attemptError) {
      // Never mask the real failure with a logging failure.
      logger.error({ err: attemptError, reasonCode }, 'sales: could not record the sale_attempts row');
    }
  }

  async function issueInvoice(
    tx: Executor,
    args: { orderId: string; customerId: string | null; actorId: string; lines: SaleLine[]; gst: Money; total: Money; rateBasisPoints: number },
  ): Promise<void> {
    await invoices.issue(tx, {
      invoiceType: 'SALE_RETAIL',
      customerId: args.customerId,
      orderId: args.orderId,
      issuedBy: args.actorId,
      totalAmount: args.total,
      gstInclusive: false,
      invoiceGst: args.gst,
      // BR-16b / BR-90c: product and grade only; the seller is TOHFA.
      lines: args.lines.map((line, i) => ({
        lineNo: i + 1,
        description: `${line.name} - ${line.grade}`,
        qty: Number(line.qtyKg),
        unitPrice: parseMoney(line.unitPrice),
        gstRate: args.rateBasisPoints / 100,
        total: parseMoney(line.lineTotal),
      })),
    });
  }

  return {
    async listProducts(scope, query) {
      const warehouseId = await resolveWarehouse(db, scope, query.warehouseId, 'query.warehouseId');
      const after = query.cursor === undefined ? undefined : decodeProductCursor(query.cursor);
      const rows = await repo.listProducts(db, { warehouseId, channel: query.channel, q: query.q, limit: query.limit, after });
      const hasMore = rows.length > query.limit;
      const page = hasMore ? rows.slice(0, query.limit) : rows;
      const last = page[page.length - 1];
      return {
        // Allow-list (BR-90): every key named, nothing spread from the row.
        items: page.map((row) => ({
          productId: row.productId,
          name: row.name,
          categoryId: row.categoryId,
          grade: row.grade,
          unitPrice: row.unitPrice,
          availableQtyKg: gramsToKg(kgToGrams(row.availableQtyKg)),
          unit: 'kg' as const,
          photos: [],
          certificationBadges: [],
          batchCode: row.batchCode,
          storageLocation: row.storageLocation,
        })),
        page: {
          nextCursor: hasMore && last !== undefined ? encodeCursor([last.name, last.productId, last.grade]) : null,
          hasMore,
        },
      };
    },

    async lookupCustomers(scope, query) {
      let match: CustomerMatch;
      if (query.mobile !== undefined) match = { kind: 'mobile', digits: query.mobile.replace(/[^0-9]/g, '') };
      else if (query.code !== undefined) match = { kind: 'code', code: query.code.trim() };
      else match = { kind: 'q', text: query.q ?? '' };
      const rows = await repo.lookupCustomers(db, match, visibleWarehouses(scope));
      return {
        // BR-92g: masked mobile, no e-mail, no address. The field is a MaskedMobile for every scope.
        items: rows.map((row) => ({
          customerId: row.customerId,
          customerCode: row.customerCode,
          name: row.name,
          mobileMasked: maskMobile(row.mobile),
          walletBalance: row.walletBalance,
        })),
      };
    },

    async quote(scope, body) {
      const channel = asSaleChannel(body.channel);
      const warehouseId = await resolveWarehouse(db, scope, body.warehouseId, 'body.warehouseId');
      // Stateless: no transaction, no lock, no write of any kind (BR-89f).
      const priced = await priceSale(db, warehouseId, channel, body.items, false);
      return toQuote(channel, priced);
    },

    async create(scope, paymentScope, rawKey, body) {
      // Order matters: these three refuse before anything is written, not even a sale_attempts row
      // (BR-85e, BR-85g, BR-88a).
      const channel = asSaleChannel(body.channel);
      if (paymentScope === null) {
        throw new AppError('FORBIDDEN', { detail: 'Your roles do not grant "payment.record".', meta: { permission: 'payment.record' } });
      }
      const key = requireIdempotencyKey(rawKey);
      const warehouseId = await resolveWarehouse(db, scope, body.warehouseId, 'body.warehouseId');
      const attemptContext = {
        channel,
        paymentMethod: body.payment.method,
        buyerKind: body.customer === undefined ? 'WALK_IN' : 'CUSTOMER',
        expectedTotal: body.expectedTotal,
        items: body.items.map((i) => ({ productId: i.productId, grade: i.grade, qtyKg: i.qtyKg })),
      };

      let result: CreateSaleResult;
      try {
        result = await runTx(async (tx) => {
          const idem = await beginIdempotent<Sale>(idempotency, tx, {
            actorUserId: scope.userId,
            key,
            operation: CREATE_OPERATION,
            request: { warehouseId, body },
          });
          if (idem.replay) return { sale: idem.response, replayed: true };

          const method = body.payment.method;
          // BR-86: a walk-in has no wallet.
          if (body.walkIn !== undefined && method === 'WALLET') {
            throw new AppError('WALKIN_WALLET_NOT_ALLOWED', { detail: 'A walk-in sale cannot be paid by WALLET. Choose CASH, UPI or CARD.' });
          }
          const customer =
            body.customer === undefined
              ? null
              : await repo.findCustomerForSale(tx, body.customer.customerId, visibleWarehouses(scope));
          if (body.customer !== undefined && customer === null) {
            throw new AppError('NOT_FOUND', { detail: `No customer with id ${body.customer.customerId} is visible to you.` });
          }

          const priced = await priceSale(tx, warehouseId, channel, body.items, true);
          // BR-89: the server total is the only one; the client's is compared, never stored.
          if (toPaise(priced.total) !== toPaise(parseMoney(body.expectedTotal))) {
            throw new AppError('SALE_PRICE_CHANGED', {
              detail: `The total is now ${priced.total}, not ${body.expectedTotal}. Re-quote and confirm.`,
              meta: { expectedTotal: body.expectedTotal, currentTotal: priced.total, quote: toQuote(channel, priced) },
            });
          }
          if (toPaise(priced.total) === 0) {
            throw new AppError('VALIDATION_FAILED', { detail: 'A sale must have a total above zero.', errors: { 'body.items': ['The quantities price to zero.'] } });
          }

          let amountReceived: Money | null = null;
          let changeGiven: Money | null = null;
          if (method === 'CASH') {
            amountReceived = parseMoney(body.payment.amountReceived);
            const changePaise = toPaise(amountReceived) - toPaise(priced.total);
            if (changePaise < 0) {
              throw new AppError('PAYMENT_AMOUNT_INSUFFICIENT', {
                detail: `Received ${amountReceived} but the total is ${priced.total}.`,
                meta: { total: priced.total, amountReceived },
              });
            }
            changeGiven = fromPaise(changePaise);
          }

          // UPI is the one method the server cannot confirm in this transaction (BR-94).
          const completed = method !== 'UPI';
          const orderNumber = await repo.nextSaleNumber(tx);
          const orderId = await repo.insertOrder(tx, {
            orderNumber,
            customerId: customer?.id ?? null,
            walkInName: body.walkIn?.name.trim() ?? null,
            walkInMobile: body.walkIn?.mobile ?? null,
            warehouseId,
            channel,
            subtotal: priced.subtotal,
            gstAmount: priced.gst,
            totalAmount: priced.total,
            paymentMethod: method,
            completed,
          });

          const rate = formatRate(priced.rateBasisPoints);
          for (const line of priced.lines) {
            for (const [i, draw] of line.draws.entries()) {
              await repo.insertOrderItem(tx, {
                orderId,
                productId: line.productId,
                grade: line.grade,
                qtyKg: gramsToKg(draw.grams),
                unitPrice: line.unitPrice,
                gstRatePercent: rate,
                lineTotal: line.drawTotals[i]!,
                batchId: draw.batchId,
                allocationId: draw.allocationId,
                completed,
              });
            }
          }
          await repo.insertStatusHistory(
            tx,
            orderId,
            null,
            completed ? 'PICKED_UP' : 'PENDING_PAYMENT',
            scope.userId,
            completed ? `Counter sale (${channel}) paid by ${method}` : `Counter sale (${channel}) awaiting UPI confirmation`,
          );

          if (method === 'WALLET') {
            try {
              // BR-88: backend-only debit, on THIS client, keyed from the sale's own key.
              await wallet.move(
                scope,
                {
                  customerId: customer!.id,
                  direction: 'DEBIT',
                  type: 'ORDER_DEBIT',
                  amount: priced.total,
                  refType: 'ORDER',
                  refId: orderId,
                  idempotencyKey: `sale_debit:${scope.userId}:${key}`,
                  remarks: `Payment for sale ${orderNumber}`,
                  createdBy: scope.userId,
                },
                tx,
              );
            } catch (error) {
              if (error instanceof AppError && error.code === 'WALLET_INSUFFICIENT') {
                // docs/openapi.yaml SalePaymentInvalid: 422 on this route.
                throw new AppError('WALLET_INSUFFICIENT', { status: 422, detail: 'Insufficient wallet balance for this sale.', cause: error });
              }
              throw error;
            }
          }

          try {
            await repo.insertPayment(tx, {
              orderId,
              method,
              amount: priced.total,
              amountReceived,
              changeGiven,
              cardRef: method === 'CARD' ? (body.payment.cardRef ?? '').trim() : null,
              status: completed ? 'CONFIRMED' : 'PENDING',
              idempotencyKey: `sale:${scope.userId}:${key}`,
              createdBy: scope.userId,
            });
          } catch (error) {
            // The idempotency claim is only retained 24 hours, but sale_payments keeps the key for
            // ever. A key replayed after the retention passes the claim and lands here: that sale
            // was already made, so refuse it (409) rather than 500 or make it twice. The whole
            // transaction rolls back, including any wallet movement above.
            if (isUniqueViolation(error, 'uq_sale_payments_idempotency_key')) {
              throw new AppError('IDEMPOTENCY_KEY_REUSED', {
                detail: 'This Idempotency-Key already made a sale (more than 24 hours ago). Use a new key for a new sale.',
                cause: error,
              });
            }
            throw error;
          }

          if (completed) {
            try {
              for (const line of priced.lines) {
                for (const draw of line.draws) {
                  const qtyKg = gramsToKg(draw.grams);
                  await repo.insertSaleLedger(tx, { batchId: draw.batchId, warehouseId, qtyKg, orderId, actorId: scope.userId });
                  if (channel === 'MARKET' && draw.allocationId !== null) await repo.consumeAllocation(tx, draw.allocationId, qtyKg);
                }
              }
            } catch (error) {
              throw mapStockGuard(error);
            }
            await issueInvoice(tx, {
              orderId,
              customerId: customer?.id ?? null,
              actorId: scope.userId,
              lines: toQuote(channel, priced).lines,
              gst: priced.gst,
              total: priced.total,
              rateBasisPoints: priced.rateBasisPoints,
            });
          }

          const record = await repo.loadSale(tx, orderId);
          if (record === null) throw new AppError('INTERNAL', { detail: 'The sale vanished inside its own transaction.' });
          const sale = toSale(record);

          // BR-35 / BR-87d: ids and amounts only. No buyer name, no mobile, no card or UPI reference.
          await writeAuditLog(tx, {
            actorId: scope.userId,
            actorRole: scope.roleCode,
            actionCode: CREATE_OPERATION,
            entityType: 'order',
            entityId: orderId,
            warehouseId,
            after: {
              orderId,
              saleNumber: orderNumber,
              channel,
              buyerKind: customer === null ? 'WALK_IN' : 'CUSTOMER',
              customerId: customer?.id ?? null,
              paymentMethod: method,
              paymentStatus: sale.paymentStatus,
              subtotal: priced.subtotal,
              gst: priced.gst,
              total: priced.total,
              lineCount: priced.lines.length,
              invoiceId: sale.invoiceId,
            },
          });

          await idem.complete(sale);
          return { sale, replayed: false };
        });
      } catch (error) {
        await recordAttempt(scope, warehouseId, error, attemptContext);
        throw error;
      }

      // Only now, after COMMIT, may anything outside the database hear about the sale (BR-87e).
      if (!result.replayed) afterCommit?.(result.sale);
      return result;
    },

    async confirmUpi(scope, saleId, rawKey, body) {
      const key = requireIdempotencyKey(rawKey);
      const visible = visibleWarehouses(scope);
      const header = await repo.findSaleHeader(db, saleId, visible);
      if (header === null) throw saleNotFound(saleId);
      const upiTxnRef = body.upiTxnRef.trim();
      const context = { saleId, paymentMethod: header.paymentMethod, operation: CONFIRM_OPERATION };

      // Verify with the gateway BEFORE opening the transaction (no row lock held across a network
      // call). A sale already confirmed is not re-verified: the confirm below is then a no-op.
      if (header.paymentMethod === 'UPI' && header.paymentStatusDetail === 'PENDING') {
        const verified = await verifyUpi(upiTxnRef, toPaise(header.totalAmount));
        if (!verified) {
          const error = new AppError('VALIDATION_FAILED', {
            detail: 'The UPI payment could not be verified with the gateway. The sale stays pending.',
            errors: { 'body.upiTxnRef': ['Not a captured payment for this sale amount.'] },
            meta: { reason: 'UPI_NOT_VERIFIED' },
          });
          await recordAttempt(scope, header.warehouseId, error, context);
          throw error;
        }
      }

      let outcome: { sale: Sale; changed: boolean };
      try {
        outcome = await runTx(async (tx) => {
          const idem = await beginIdempotent<Sale>(idempotency, tx, {
            actorUserId: scope.userId,
            key,
            operation: CONFIRM_OPERATION,
            request: { saleId, upiTxnRef },
          });
          if (idem.replay) return { sale: idem.response, changed: false };

          const locked = await repo.lockSale(tx, saleId, visible);
          if (locked === null) throw saleNotFound(saleId);

          const load = async (): Promise<Sale> => {
            const record = await repo.loadSale(tx, saleId);
            if (record === null) throw saleNotFound(saleId);
            return toSale(record);
          };

          if (locked.paymentMethod !== 'UPI') {
            throw new AppError('CONFLICT', { detail: 'This sale was not paid by UPI; there is nothing to confirm.' });
          }
          // BR-88g: already confirmed (by any key) - return it unchanged, no second effect.
          if (locked.paymentStatusDetail === 'CONFIRMED') {
            const sale = await load();
            await idem.complete(sale);
            return { sale, changed: false };
          }
          if (locked.paymentStatusDetail !== 'PENDING' || locked.status !== 'PENDING_PAYMENT' || locked.paymentId === null) {
            throw new AppError('CONFLICT', { detail: 'This sale\'s UPI payment is not pending; it cannot be confirmed.' });
          }

          const items = await repo.saleItems(tx, saleId);
          try {
            for (const item of items) {
              if (item.batchId === null) continue;
              await repo.insertSaleLedger(tx, { batchId: item.batchId, warehouseId: locked.warehouseId, qtyKg: item.qtyKg, orderId: saleId, actorId: scope.userId });
              if (locked.channel === 'MARKET' && item.allocationId !== null) await repo.consumeAllocation(tx, item.allocationId, item.qtyKg);
            }
          } catch (error) {
            throw mapStockGuard(error);
          }
          await repo.completeOrder(tx, saleId);
          try {
            await repo.confirmPayment(tx, locked.paymentId, upiTxnRef);
          } catch (error) {
            // BR-94, migration 0067: a UPI reference confirms one sale. The gateway payment names
            // no sale of ours, so a captured reference of the same amount would otherwise confirm
            // every pending sale it is typed into. Everything above rolls back with this throw.
            if (isUniqueViolation(error, 'uq_sale_payments_upi_txn_ref')) {
              throw new AppError('CONFLICT', {
                detail: 'This UPI reference has already confirmed another sale. Check the reference; the sale stays pending.',
                meta: { reason: 'UPI_TXN_REF_ALREADY_USED' },
                cause: error,
              });
            }
            throw error;
          }
          await repo.insertStatusHistory(tx, saleId, 'PENDING_PAYMENT', 'PICKED_UP', scope.userId, 'UPI payment confirmed');

          const lines = aggregateLines(items);
          // The rate the sale was priced at (stored on its lines at create), not today's config.
          const rateBasisPoints = parseRateBasisPoints(items[0]?.gstRatePercent ?? '0') ?? DEFAULT_GST_BASIS_POINTS;
          await issueInvoice(tx, {
            orderId: saleId,
            customerId: locked.customerId,
            actorId: scope.userId,
            lines,
            gst: locked.gstAmount,
            total: locked.totalAmount,
            rateBasisPoints,
          });

          const sale = await load();
          await writeAuditLog(tx, {
            actorId: scope.userId,
            actorRole: scope.roleCode,
            actionCode: 'payment.record',
            entityType: 'order',
            entityId: saleId,
            warehouseId: locked.warehouseId,
            before: { orderId: saleId, status: 'PENDING_PAYMENT', paymentStatus: 'PENDING' },
            after: { orderId: saleId, status: sale.status, paymentStatus: sale.paymentStatus, total: sale.totals.total, invoiceId: sale.invoiceId },
            changedFields: ['status', 'paymentStatus'],
          });
          await idem.complete(sale);
          return { sale, changed: true };
        });
      } catch (error) {
        if (error instanceof AppError && error.code === 'SALE_STOCK_CHANGED') {
          // BR-94i: The UPI money was verified/captured, but the stock commit failed.
          // Cancel the sale (releases the hold), set payment to REFUND_DUE, and attempt auto-refund if configured.
          let refundStatus: 'REFUND_DUE' | 'REFUNDED' = 'REFUND_DUE';
          await runTx(async (cancelTx) => {
            await repo.cancelSale(cancelTx, saleId, {
              reason: 'Stock unavailable at confirmation',
              paymentStatus: 'REFUND_DUE',
            });
            await repo.settlePayment(cancelTx, header.paymentId!, 'REFUND_DUE', upiTxnRef);
            await repo.insertStatusHistory(
              cancelTx,
              saleId,
              'PENDING_PAYMENT',
              'CANCELLED',
              scope.userId,
              'Stock unavailable at confirmation; refund due',
            );
            await writeAuditLog(cancelTx, {
              actorId: scope.userId,
              actorRole: scope.roleCode,
              actionCode: 'order.cancel',
              entityType: 'order',
              entityId: saleId,
              warehouseId: header.warehouseId,
              before: { orderId: saleId, status: 'PENDING_PAYMENT', paymentStatus: 'PENDING' },
              after: { orderId: saleId, status: 'CANCELLED', paymentStatus: 'REFUND_DUE' },
              changedFields: ['status', 'paymentStatus'],
            });
          });

          const mode = await upiRefundMode(db);
          const activeGateway = deps.gateway ?? paymentGateway;
          if (mode === 'auto' && activeGateway.refundPayment) {
            try {
              const refundRes = await activeGateway.refundPayment({
                gatewayPaymentId: upiTxnRef,
                amountPaise: toPaise(header.totalAmount),
                idempotencyKey: `sale_refund:${header.paymentId}`,
              });
              await runTx(async (refundTx) => {
                await repo.markRefunded(refundTx, header.paymentId!, refundRes.refundId);
                await writeAuditLog(refundTx, {
                  actorId: scope.userId,
                  actorRole: scope.roleCode,
                  actionCode: 'payment.refund',
                  entityType: 'sale_payments',
                  entityId: header.paymentId!,
                  warehouseId: header.warehouseId,
                  after: { status: 'REFUNDED', refundRef: refundRes.refundId },
                });
              });
              refundStatus = 'REFUNDED';
            } catch (refundErr) {
              logger.error({ err: refundErr, saleId, upiTxnRef }, 'sales: automatic UPI refund failed; keeping REFUND_DUE');
            }
          }

          const wrappedError = new AppError('SALE_STOCK_CHANGED', {
            detail: 'Stock unavailable to complete sale. The sale has been cancelled and payment marked for refund.',
            meta: { reason: 'UPI_REFUND_DUE', refundStatus },
            cause: error,
          });
          await recordAttempt(scope, header.warehouseId, wrappedError, context);
          throw wrappedError;
        }

        await recordAttempt(scope, header.warehouseId, error, context);
        throw error;
      }

      if (outcome.changed) afterCommit?.(outcome.sale);
      return outcome.sale;
    },

    async cancel(scope, saleId, rawKey, body) {
      const key = requireIdempotencyKey(rawKey);
      const visible = visibleWarehouses(scope);
      const header = await repo.findSaleHeader(db, saleId, visible);
      if (header === null) throw saleNotFound(saleId);
      if (header.paymentMethod !== 'UPI') {
        throw new AppError('CONFLICT', { detail: 'Only a pending UPI sale can be cancelled.' });
      }

      const reason = body?.reason?.trim() || 'Cancelled by operator';
      const outcome = await runTx(async (tx) => {
        const idem = await beginIdempotent<Sale>(idempotency, tx, {
          actorUserId: scope.userId,
          key,
          operation: CANCEL_OPERATION,
          request: { saleId, reason },
        });
        if (idem.replay) return idem.response;

        const locked = await repo.lockSale(tx, saleId, visible);
        if (locked === null) throw saleNotFound(saleId);

        const load = async (): Promise<Sale> => {
          const record = await repo.loadSale(tx, saleId);
          if (record === null) throw saleNotFound(saleId);
          return toSale(record);
        };

        if (locked.status === 'CANCELLED') {
          const sale = await load();
          await idem.complete(sale);
          return sale;
        }

        if (locked.status !== 'PENDING_PAYMENT' || locked.paymentStatusDetail !== 'PENDING' || locked.paymentId === null) {
          throw new AppError('CONFLICT', { detail: 'This sale is no longer pending payment; it cannot be cancelled.' });
        }

        await repo.cancelSale(tx, saleId, { reason, paymentStatus: 'FAILED' });
        await repo.settlePayment(tx, locked.paymentId, 'FAILED', null);
        await repo.insertStatusHistory(tx, saleId, 'PENDING_PAYMENT', 'CANCELLED', scope.userId, reason);

        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'order.cancel',
          entityType: 'order',
          entityId: saleId,
          warehouseId: locked.warehouseId,
          before: { status: 'PENDING_PAYMENT', paymentStatus: 'PENDING' },
          after: { status: 'CANCELLED', paymentStatus: 'FAILED' },
          changedFields: ['status', 'paymentStatus'],
        });

        const sale = await load();
        await idem.complete(sale);
        return sale;
      });

      return outcome;
    },

    async requirePaid(scope, saleId) {
      const visible = visibleWarehouses(scope);
      const header = await repo.findSaleHeader(db, saleId, visible);
      if (header === null) throw saleNotFound(saleId);
      if (header.status === 'PENDING_PAYMENT' || header.paymentStatusDetail === 'PENDING') {
        throw new AppError('PAYMENT_PENDING', {
          detail: 'This sale has an unconfirmed payment; action cannot be performed while payment is pending.',
          meta: { saleId, paymentStatus: header.paymentStatus },
        });
      }
      const record = await repo.loadSale(db, saleId);
      if (record === null) throw saleNotFound(saleId);
      return toSale(record);
    },

    async expirePendingUpi(limit = 100) {
      const minutes = await upiPendingExpiryMinutes(db);
      if (minutes === null) return { expiredCount: 0 };

      const expired = await repo.listExpiredPendingUpi(db, minutes, limit);
      let expiredCount = 0;

      for (const row of expired) {
        try {
          await runTx(async (tx) => {
            const locked = await repo.lockSale(tx, row.saleId, null);
            if (locked === null || locked.status !== 'PENDING_PAYMENT' || locked.paymentStatusDetail !== 'PENDING' || locked.paymentId === null) {
              return;
            }
            const reason = `Pending UPI payment expired after ${minutes} minutes`;
            await repo.cancelSale(tx, row.saleId, { reason, paymentStatus: 'FAILED' });
            await repo.settlePayment(tx, locked.paymentId, 'FAILED', null);
            await repo.insertStatusHistory(tx, row.saleId, 'PENDING_PAYMENT', 'CANCELLED', null, reason);
            await writeAuditLog(tx, {
              actorId: null,
              actorType: 'JOB',
              actionCode: 'order.cancel',
              entityType: 'order',
              entityId: row.saleId,
              warehouseId: locked.warehouseId,
              before: { status: 'PENDING_PAYMENT', paymentStatus: 'PENDING' },
              after: { status: 'CANCELLED', paymentStatus: 'FAILED' },
              changedFields: ['status', 'paymentStatus'],
            });
            expiredCount++;
          });
        } catch (err) {
          logger.warn({ err, saleId: row.saleId }, 'sales: error expiring pending UPI sale');
        }
      }

      return { expiredCount };
    },
  };
}

export const salesService: SalesService = createSalesService();
