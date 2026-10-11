/**
 * SWA Module 6 (Direct / Market sales), READ side: all business logic.
 *
 * Takes a `ResolvedScope`, never a `Request`. Throws `AppError` with a domain `ErrorCode`.
 *
 *  - Scope (BR-30): every read is narrowed in SQL by `warehouseScopeFilter` (see the repo). A Sub
 *    Warehouse Admin naming another warehouse gets 404, never 403; a sale of another warehouse is
 *    404 with the same body as an unknown id. MAIN_WH_ADMIN's `own` grant with no warehouse sees
 *    all four warehouses (owner, 2026-10-11).
 *  - Dashboard (BR-96): only PAID + PICKED_UP + completed DIRECT/MARKET sales, by the Asia/Kolkata
 *    day of `completed_at`, summed in exact integer paise.
 *  - Allow-list (BR-90): every response object below is built by naming each documented key. A
 *    field added to a repo record (or a farm column joined in later) cannot reach a response.
 *  - Masking (BR-92): a sale response never carries a full mobile (docs/openapi.yaml SaleBuyer),
 *    so the buyer mobile is masked for every scope, not only `own`.
 */
import { fromPaise, ScopeLevel, toPaise, type Money } from '@tohfa/shared-types';
import { pool, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  decodeCursorParts,
  encodeCursor,
  failValidation,
  invalidCursor,
  MICRO_TS,
  pageOf,
  UUID,
} from '../finance/finance.shared.js';
import {
  SALES_TIME_ZONE,
  salesReadRepo,
  type BuyerRecord,
  type ChannelOrderRecord,
  type DayWindow,
  type MethodTotalRow,
  type OrderCursor,
  type SaleDetailRecord,
  type SaleListFilters,
  type SaleListRecord,
  type SalePaymentRecord,
  type SalesReadRepo,
  type WarehouseNarrowing,
} from './sales-read.repo.js';
import {
  saleChannels,
  salePaymentMethods,
  type ChannelOrderListItem,
  type ChannelOrdersQuery,
  type ListChannelOrdersResponse,
  type ListSalesQuery,
  type ListSalesResponse,
  type MarketDayQuery,
  type SaleBuyer,
  type SaleListItem,
  type SalePayment,
  type SalePaymentMethod,
  type SaleResponse,
  type SalesMarketDayResponse,
  type SalesSummaryQuery,
  type SalesSummaryResponse,
} from './sales-read.schema.js';

export interface SalesReadServiceDeps {
  repo: SalesReadRepo;
  db: Executor;
  /** Injectable clock: "today" is the Asia/Kolkata day of `now()` (BR-96d). */
  now: () => Date;
}

export interface SalesReadService {
  summary(scope: ResolvedScope, query: SalesSummaryQuery): Promise<SalesSummaryResponse>;
  list(scope: ResolvedScope, query: ListSalesQuery): Promise<ListSalesResponse>;
  get(scope: ResolvedScope, saleId: string): Promise<SaleResponse>;
  marketDay(scope: ResolvedScope, query: MarketDayQuery): Promise<SalesMarketDayResponse>;
  listChannel(scope: ResolvedScope, channel: 'HORECA' | 'B2B', query: ChannelOrdersQuery): Promise<ListChannelOrdersResponse>;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const KOLKATA_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: SALES_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** The Asia/Kolkata calendar day of `instant`, YYYY-MM-DD (en-CA formats as ISO). */
export function kolkataDay(instant: Date): string {
  return KOLKATA_DAY.format(instant);
}

/**
 * BR-92: `*` for every character but the last four, e.g. `+919876543210` -> `*********3210`. A value
 * of four characters or fewer is masked fully (BR-92e). The result matches `MaskedMobile`.
 */
export function maskMobile(mobile: string | null): string | null {
  if (mobile === null) return null;
  if (mobile.length <= 4) return '*'.repeat(Math.max(mobile.length, 1));
  return `${'*'.repeat(mobile.length - 4)}${mobile.slice(-4)}`;
}

function notFound(what: string, id: string): AppError {
  // Same detail for "unknown" and "not yours": a different one would confirm the row exists.
  return new AppError('NOT_FOUND', { detail: `${what} "${id}" not found.` });
}

function encodeOrderCursor(cursor: OrderCursor): string {
  return encodeCursor([cursor.placedAt, cursor.id]);
}

function decodeOrderCursor(raw: string | undefined): OrderCursor | undefined {
  if (raw === undefined) return undefined;
  const [placedAt, id] = decodeCursorParts(raw, 2);
  // Validated here so a forged cursor is a 422, not a failed ::timestamptz cast (500) in SQL.
  if (!MICRO_TS.test(placedAt ?? '') || !UUID.test(id ?? '')) return invalidCursor();
  return { placedAt: placedAt as string, id: id as string };
}

function spanDays(window: DayWindow): number {
  return (Date.parse(`${window.to}T00:00:00Z`) - Date.parse(`${window.from}T00:00:00Z`)) / MS_PER_DAY;
}

function sumMoney(values: readonly Money[]): Money {
  return fromPaise(values.reduce((sum, value) => sum + toPaise(value), 0));
}

/** Every counter method, in the documented order, zero-filled (the dashboard shows all four tiles). */
function byMethod(rows: readonly MethodTotalRow[]): Array<{ method: SalePaymentMethod; count: number; revenue: Money }> {
  return salePaymentMethods.map((method) => {
    const row = rows.find((r) => r.method === method);
    return { method, count: row?.count ?? 0, revenue: row?.revenue ?? fromPaise(0) };
  });
}

// ---------------------------------------------------------------------------
// Allow-list serializers (BR-90). Each names every documented key and nothing else.
// ---------------------------------------------------------------------------
function toBuyer(buyer: BuyerRecord): SaleBuyer {
  if (buyer.customerId !== null) {
    return {
      kind: 'CUSTOMER',
      customerId: buyer.customerId,
      customerCode: buyer.customerCode,
      name: buyer.customerName ?? '',
      mobileMasked: maskMobile(buyer.customerMobile),
    };
  }
  return {
    kind: 'WALK_IN',
    customerId: null,
    customerCode: null,
    name: buyer.walkInName ?? '',
    mobileMasked: maskMobile(buyer.walkInMobile),
  };
}

function toListItem(record: SaleListRecord): SaleListItem {
  return {
    id: record.id,
    saleNumber: record.orderNumber,
    channel: record.channel,
    status: record.status,
    paymentStatus: record.paymentStatus,
    paymentMethod: record.paymentMethod,
    warehouseId: record.warehouseId,
    buyer: toBuyer(record.buyer),
    itemCount: record.itemCount,
    total: record.total,
    invoiceNumber: record.invoiceNumber,
    createdAt: record.placedAt,
    completedAt: record.completedAt,
  };
}

/**
 * The payment a sale shows: the CONFIRMED one when it exists (a UPI retry leaves an earlier FAILED
 * row behind), else the latest. A sale with no `sale_payments` row (not written by the sales write
 * path, but possible for a hand-entered row) is shown from the order itself.
 */
function pickPayment(record: SaleDetailRecord): SalePaymentRecord {
  const confirmed = record.payments.find((p) => p.status === 'CONFIRMED');
  const latest = record.payments[record.payments.length - 1];
  const chosen = confirmed ?? latest;
  if (chosen !== undefined) return chosen;
  const status: SalePaymentRecord['status'] =
    record.paymentStatus === 'PAID' ? 'CONFIRMED' : record.paymentStatus === 'FAILED' ? 'FAILED' : 'PENDING';
  return {
    method: record.paymentMethod,
    status,
    amount: record.total,
    amountReceived: null,
    changeGiven: null,
    cardRef: null,
    upiTxnRef: null,
    confirmedAt: status === 'CONFIRMED' ? record.completedAt : null,
    createdAt: record.placedAt,
  };
}

function toPayment(payment: SalePaymentRecord): SalePayment {
  return {
    method: payment.method,
    status: payment.status,
    amount: payment.amount,
    amountReceived: payment.amountReceived,
    cardRef: payment.cardRef,
    upiTxnRef: payment.upiTxnRef,
    confirmedAt: payment.confirmedAt,
  };
}

function toSale(record: SaleDetailRecord): SaleResponse {
  const payment = pickPayment(record);
  return {
    id: record.id,
    saleNumber: record.orderNumber,
    channel: record.channel,
    status: record.status,
    paymentStatus: record.paymentStatus,
    warehouseId: record.warehouseId,
    buyer: toBuyer(record.buyer),
    items: record.items.map((line) => ({
      productId: line.productId,
      name: line.name,
      grade: line.grade,
      qtyKg: line.qtyKg,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal,
    })),
    totals: {
      subtotal: record.subtotal,
      gst: record.gst,
      total: record.total,
      changeGiven: payment.method === 'CASH' ? payment.changeGiven : null,
    },
    payment: toPayment(payment),
    invoiceNumber: record.invoiceNumber,
    invoiceId: record.invoiceId,
    // Status changes only: the free-text note is internal and may name a person (BR-90).
    timeline: record.timeline.map((entry) => ({ fromStatus: entry.fromStatus, toStatus: entry.toStatus, at: entry.at })),
    createdAt: record.placedAt,
    completedAt: record.completedAt,
  };
}

function toChannelOrder(record: ChannelOrderRecord): ChannelOrderListItem {
  return {
    id: record.id,
    orderNumber: record.orderNumber,
    channel: record.channel,
    status: record.status,
    paymentStatus: record.paymentStatus,
    warehouseId: record.warehouseId,
    customerCode: record.customerCode,
    businessName: record.businessName,
    itemCount: record.itemCount,
    total: record.total,
    placedAt: record.placedAt,
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
export function createSalesReadService(deps: Partial<SalesReadServiceDeps> = {}): SalesReadService {
  const repo = deps.repo ?? salesReadRepo;
  const db = deps.db ?? pool;
  const now = deps.now ?? (() => new Date());

  const today = (): string => kolkataDay(now());

  /** The report span cap (`system_config.report_max_range_days`, as the reports module, BR-64). */
  async function assertSpan(window: DayWindow): Promise<void> {
    if (window.from > window.to) failValidation({ 'query.to': ['"from" must be earlier than or equal to "to".'] });
    const maxDays = await repo.getReportMaxRangeDays(db);
    if (spanDays(window) > maxDays) failValidation({ 'query.to': [`Date range cannot exceed ${maxDays} days.`] });
  }

  /**
   * A `warehouseId` query parameter narrows the read; outside the scope (or unknown) it is 404,
   * never 403 (BR-30). The repo applies the same scope predicate as every other query.
   */
  async function narrowing(scope: ResolvedScope, warehouseId: string | undefined): Promise<WarehouseNarrowing> {
    if (warehouseId === undefined) return {};
    if (!(await repo.warehouseVisible(db, scope, warehouseId))) throw notFound('Warehouse', warehouseId);
    return { warehouseId };
  }

  /** The warehouse a response reports: the one asked for, else the actor's only one, else null (all). */
  function reportedWarehouse(scope: ResolvedScope, narrow: WarehouseNarrowing): string | null {
    if (narrow.warehouseId !== undefined) return narrow.warehouseId;
    if (scope.level === ScopeLevel.ALL || scope.level === ScopeLevel.CONDITIONAL) return null;
    return scope.warehouseIds.length === 1 ? (scope.warehouseIds[0] as string) : null;
  }

  return {
    async summary(scope, query) {
      // `to` defaults to today and `from` to `to` (openapi SalesFromParam / SalesToParam).
      const to = query.to ?? today();
      const window: DayWindow = { from: query.from ?? to, to };
      await assertSpan(window);
      const narrow = await narrowing(scope, query.warehouseId);

      const [channels, methods, attention] = await Promise.all([
        repo.totalsByChannel(db, scope, window, narrow),
        repo.totalsByMethod(db, scope, window, narrow),
        repo.needsAttention(db, scope, window, narrow),
      ]);

      const byChannel = saleChannels.map((channel) => {
        const row = channels.find((r) => r.channel === channel);
        return { channel, count: row?.count ?? 0, revenue: row?.revenue ?? fromPaise(0) };
      });

      return {
        from: window.from,
        to: window.to,
        warehouseId: reportedWarehouse(scope, narrow),
        count: byChannel.reduce((sum, row) => sum + row.count, 0),
        revenue: sumMoney(byChannel.map((row) => row.revenue)),
        byChannel,
        byPaymentMethod: byMethod(methods),
        needsAttention: {
          paymentPending: attention.paymentPending,
          stockIssues: attention.stockIssues,
          failedSales: attention.failedSales,
          invoiceIssues: attention.invoiceIssues,
        },
      };
    },

    async list(scope, query) {
      const cursor = decodeOrderCursor(query.cursor);
      // Days default to today, except for a search (q or customerId) with no dates at all, which
      // looks across every day: a counter looks a past sale up by its number.
      const searching = query.q !== undefined || query.customerId !== undefined;
      const undated = searching && query.from === undefined && query.to === undefined;
      const filters: SaleListFilters = {
        channel: query.channel,
        status: query.status,
        paymentStatus: query.paymentStatus,
        paymentMethod: query.paymentMethod,
        customerId: query.customerId,
        q: query.q,
      };
      if (!undated) {
        const day = today();
        const to = query.to ?? day;
        const window: DayWindow = { from: query.from ?? to, to };
        await assertSpan(window);
        filters.from = window.from;
        filters.to = window.to;
      }
      const page = await repo.listSales(db, scope, filters, query.limit, cursor);
      return { items: page.items.map(toListItem), page: pageOf(page.next, encodeOrderCursor) };
    },

    async get(scope, saleId) {
      const record = await repo.findSale(db, scope, saleId);
      if (record === null) throw notFound('Sale', saleId);
      return toSale(record);
    },

    async marketDay(scope, query) {
      const cursor = decodeOrderCursor(query.cursor);
      const date = query.date ?? today();
      const narrow = await narrowing(scope, query.warehouseId);
      const window: DayWindow = { from: date, to: date };

      const [allocation, methods, page] = await Promise.all([
        repo.marketAllocation(db, scope, narrow),
        repo.totalsByMethod(db, scope, window, { ...narrow, channel: 'MARKET', venueOnly: true }),
        repo.listSales(db, scope, { ...narrow, channel: 'MARKET', from: date, to: date, venueOnly: true }, query.limit, cursor),
      ]);
      const split = byMethod(methods);

      return {
        date,
        warehouseId: reportedWarehouse(scope, narrow),
        totals: {
          count: split.reduce((sum, row) => sum + row.count, 0),
          revenue: sumMoney(split.map((row) => row.revenue)),
        },
        byPaymentMethod: split,
        allocation: allocation.map((row) => ({
          productId: row.productId,
          name: row.name,
          grade: row.grade,
          allocatedQtyKg: row.allocatedQtyKg,
          soldQtyKg: row.soldQtyKg,
          remainingQtyKg: row.remainingQtyKg,
        })),
        items: page.items.map(toListItem),
        page: pageOf(page.next, encodeOrderCursor),
      };
    },

    async listChannel(scope, channel, query) {
      const cursor = decodeOrderCursor(query.cursor);
      const page = await repo.listChannelOrders(db, scope, channel, query.limit, cursor);
      return { items: page.items.map(toChannelOrder), page: pageOf(page.next, encodeOrderCursor) };
    },
  };
}

/** The production instance. */
export const salesReadService: SalesReadService = createSalesReadService();
