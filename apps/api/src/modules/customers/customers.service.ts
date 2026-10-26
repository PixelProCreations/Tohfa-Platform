/**
 * SWA Module 7 (Customers): business logic. Takes a ResolvedScope, never a Request.
 *
 * Rules enforced here:
 *  - BR-91  visibility: every route first asks the repo whether the customer is inside the
 *           actor's access; outside is 404 with ONE detail string for "unknown" and "not yours".
 *  - BR-92  masking: serializers are allow-lists built from the access (`masked`), never a role.
 *  - BR-90  purchases/orders/issues are built field by field; a column added to a repo row cannot
 *           reach a response.
 *  - BR-93  the wallet is read-only; this service has no wallet write at all.
 *  - BR-97  support threads: for a masked actor, internal notes naming a farmer are dropped and
 *           farmer text elsewhere is redacted; a reply naming a farmer is refused 422 for every
 *           actor; the reply and its audit row share one transaction (BR-35).
 *  - BR-92a / BR-97g  the same masked actor never sees the customer's own stored mobile (no run of
 *           more than four of its digits) or e-mail in ticket text either: a customer types them
 *           into tickets ("call me on ..."), and the ticket shapes are otherwise contact-free.
 *  - BR-98  the active window is read from system_config on every request.
 */
import { parseMoney } from '@tohfa/shared-types';
import { writeAuditLog } from '../../audit/auditLog.js';
import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { logger } from '../../logger.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  buildRedactor,
  composeRedactors,
  customerAccess,
  decodeNameKey,
  decodeSortKey,
  decodeTimeKey,
  encodeSortKey,
  encodeTimeKey,
  maskMobile,
  type CustomerAccess,
  type Redactor,
  type TimeKey,
} from './customers.policy.js';
import {
  customersRepo,
  type CustomerListRow,
  type CustomersRepo,
  type Fetched,
  type IssueRow,
  type MessageRow,
  type OrderRow,
  type PurchaseRow,
  type TicketRow,
} from './customers.repo.js';
import type {
  AdminCustomerDetail,
  AdminCustomerIssue,
  AdminCustomerListItem,
  AdminCustomerListResponse,
  AdminCustomerOrder,
  AdminCustomerPurchase,
  AdminCustomerSupportMessage,
  AdminCustomerSupportTicket,
  AdminCustomerSupportTicketDetail,
  AdminCustomerWalletSummary,
  AdminTicketStatus,
  AdminWalletTransaction,
  ListCustomersQuery,
  PageMeta,
  PageQuery,
  Paged,
  ReplyBody,
} from './customers.schema.js';

/**
 * BR-98i: the documented fallback when `system_config.active_customer_window_days` is missing or
 * invalid. The configured value always wins; this is never used while the row exists.
 */
export const DEFAULT_ACTIVE_CUSTOMER_WINDOW_DAYS = 90;

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface CustomersServiceDeps {
  repo: CustomersRepo;
  db: Executor;
  transaction: TransactionRunner;
  /** Warning sink for the BR-98i fallback. */
  log: (message: string, context: Record<string, unknown>) => void;
}

export interface CustomersService {
  list(scope: ResolvedScope, query: ListCustomersQuery): Promise<AdminCustomerListResponse>;
  get(scope: ResolvedScope, customerId: string): Promise<AdminCustomerDetail>;
  listPurchases(scope: ResolvedScope, customerId: string, page: PageQuery): Promise<Paged<AdminCustomerPurchase>>;
  listOrders(scope: ResolvedScope, customerId: string, page: PageQuery): Promise<Paged<AdminCustomerOrder>>;
  getWallet(scope: ResolvedScope, customerId: string): Promise<AdminCustomerWalletSummary>;
  listWalletTransactions(scope: ResolvedScope, customerId: string, page: PageQuery): Promise<Paged<AdminWalletTransaction>>;
  getWalletTransaction(scope: ResolvedScope, customerId: string, txnId: string): Promise<AdminWalletTransaction>;
  listIssues(scope: ResolvedScope, customerId: string, page: PageQuery): Promise<Paged<AdminCustomerIssue>>;
  listSupportTickets(scope: ResolvedScope, customerId: string, page: PageQuery): Promise<Paged<AdminCustomerSupportTicket>>;
  getSupportTicket(scope: ResolvedScope, customerId: string, ticketId: string): Promise<AdminCustomerSupportTicketDetail>;
  /**
   * `respondScope` is `support.ticket.respond` (authorises the write, names the actor);
   * `visibilityScope` is `customer.support_history.view` (decides which customers are visible).
   */
  reply(
    respondScope: ResolvedScope,
    visibilityScope: ResolvedScope,
    customerId: string,
    ticketId: string,
    body: ReplyBody,
  ): Promise<AdminCustomerSupportMessage>;
}

// ---------------------------------------------------------------------------
// Errors. One detail per resource for "unknown" and "outside your scope" (BR-91c).
// ---------------------------------------------------------------------------
const customerNotFound = (): AppError =>
  new AppError('NOT_FOUND', { detail: 'No customer with that id is visible to you.' });
const walletNotFound = (): AppError => new AppError('NOT_FOUND', { detail: 'This customer has no wallet.' });
const txnNotFound = (): AppError =>
  new AppError('NOT_FOUND', { detail: "No wallet transaction with that id on this customer's wallet." });
const ticketNotFound = (): AppError =>
  new AppError('NOT_FOUND', { detail: 'No support ticket with that id for this customer.' });

// ---------------------------------------------------------------------------
// Serializers (allow-lists)
// ---------------------------------------------------------------------------
function listItem(row: CustomerListRow, masked: boolean): AdminCustomerListItem {
  const item: AdminCustomerListItem = {
    id: row.id,
    customerCode: row.customerCode,
    name: row.fullName,
    mobileMasked: maskMobile(row.mobile),
    customerType: row.customerType,
    status: row.isActive ? 'ACTIVE' : 'INACTIVE',
    isNew: row.isNew,
    preferredWarehouseId: row.preferredWarehouseId,
    totalOrders: row.totalOrders,
    lastActivityAt: row.lastActivityAt,
    piiMasked: masked,
    createdAt: row.createdAt,
    issueCount: row.issueCount,
    ticketCount: row.ticketCount,
  };
  // BR-92: for a masked actor the keys are ABSENT, not null.
  if (!masked) {
    item.mobile = row.mobile;
    item.email = row.email;
  }
  return item;
}

const purchase = (r: PurchaseRow): AdminCustomerPurchase => ({
  orderId: r.orderId,
  orderNumber: r.orderNumber,
  channel: r.channel as AdminCustomerPurchase['channel'],
  warehouseId: r.warehouseId,
  productId: r.productId,
  productName: r.productName,
  grade: r.grade as AdminCustomerPurchase['grade'],
  qtyKg: r.qtyKg,
  unitPrice: parseMoney(r.unitPrice),
  lineTotal: parseMoney(r.lineTotal),
  purchasedAt: r.purchasedAt,
});

const order = (r: OrderRow): AdminCustomerOrder => ({
  id: r.id,
  orderNumber: r.orderNumber,
  channel: r.channel as AdminCustomerOrder['channel'],
  status: r.status as AdminCustomerOrder['status'],
  paymentStatus: r.paymentStatus as AdminCustomerOrder['paymentStatus'],
  paymentMethod: r.paymentMethod as AdminCustomerOrder['paymentMethod'],
  warehouseId: r.warehouseId,
  itemCount: r.itemCount,
  totalAmount: parseMoney(r.totalAmount),
  invoiceNumber: r.invoiceNumber,
  placedAt: r.placedAt,
  completedAt: r.completedAt,
});

/**
 * `return_requests` has no number column, so `reference` is derived: `RET-` + the first 8 hex
 * characters of the id, upper-cased (openapi `AdminCustomerIssue.reference`). It is a display
 * label, not an identifier (`id` is). `refundAmount` is present only once an inspection has
 * accepted a quantity.
 */
function issue(r: IssueRow): AdminCustomerIssue {
  const out: AdminCustomerIssue = {
    id: r.id,
    kind: 'RETURN',
    reference: `RET-${r.id.slice(0, 8).toUpperCase()}`,
    orderId: r.orderId,
    orderNumber: r.orderNumber,
    status: r.status as AdminCustomerIssue['status'],
    reason: r.reason,
    createdAt: r.createdAt,
    resolvedAt: r.resolvedAt,
  };
  if (r.refundAmount !== null) out.refundAmount = parseMoney(r.refundAmount);
  return out;
}

/**
 * support_tickets.status stores INVESTIGATING where every admin support API (this one and
 * /admin/support-tickets) says IN_PROGRESS; documented in openapi and BR-97.
 */
function ticketStatus(dbStatus: string): AdminTicketStatus {
  return dbStatus === 'INVESTIGATING' ? 'IN_PROGRESS' : (dbStatus as AdminTicketStatus);
}

/**
 * What a masked (`own`) actor's ticket text goes through. `farmer` alone decides whether an
 * internal note is dropped (BR-97); `text` (farmer identity + the customer's own contact details,
 * BR-92a) is what every shown string is redacted with. null = scope `all`, nothing is redacted.
 */
interface TicketRedaction {
  farmer: Redactor;
  text: Redactor;
}

/** No `closedAt`: support_tickets records no close time, so the shape has no such key. */
function ticket(r: TicketRow, messageCount: number, redaction: TicketRedaction | null): AdminCustomerSupportTicket {
  return {
    id: r.id,
    ticketNumber: r.ticketNumber,
    categoryCode: r.category as AdminCustomerSupportTicket['categoryCode'],
    subject: redaction === null ? r.subject : redaction.text.redact(r.subject).text,
    status: ticketStatus(r.status),
    priority: r.priority as AdminCustomerSupportTicket['priority'],
    messageCount,
    resolvedAt: r.resolvedAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

/**
 * BR-97 for one message. `redaction === null` means scope `all`: the thread is returned as stored.
 * For a masked actor an internal note that names a farmer is dropped entirely (null); any other
 * message has farmer text and the customer's own contact details replaced and is flagged
 * `redacted` (BR-92a).
 */
function message(m: MessageRow, redaction: TicketRedaction | null): AdminCustomerSupportMessage | null {
  let body = m.body;
  let attachment = m.attachmentKey;
  let redacted = false;
  if (redaction !== null) {
    const namesFarmer = redaction.farmer.matches(m.body);
    const attachmentNamesFarmer = attachment !== null && redaction.farmer.matches(attachment);
    if (m.isInternal && (namesFarmer || attachmentNamesFarmer)) return null;
    const bodyOut = redaction.text.redact(m.body);
    const attachmentRedacted = attachment !== null && redaction.text.matches(attachment);
    body = bodyOut.text;
    if (attachmentRedacted) attachment = null;
    redacted = bodyOut.changed || attachmentRedacted;
  }
  return {
    id: m.id,
    ticketId: m.ticketId,
    senderUserId: m.senderUserId,
    senderRole: m.senderRole,
    message: body,
    isInternal: m.isInternal,
    redacted,
    attachmentUrl: attachment,
    createdAt: m.createdAt,
  };
}

function page<T, R>(fetchedRows: Fetched<T>, map: (row: T) => R, key: (row: T) => string): Paged<R> {
  const last = fetchedRows.rows[fetchedRows.rows.length - 1];
  const meta: PageMeta =
    fetchedRows.hasMore && last !== undefined
      ? { nextCursor: key(last), hasMore: true }
      : { nextCursor: null, hasMore: false };
  return { items: fetchedRows.rows.map(map), page: meta };
}

const timeCursor = (row: { cursorTs: string }, id: string): string => encodeTimeKey({ ts: row.cursorTs, id });
const afterTime = (cursor: string | undefined): TimeKey | undefined =>
  cursor === undefined ? undefined : decodeTimeKey(cursor);

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
export function createCustomersService(deps: Partial<CustomersServiceDeps> = {}): CustomersService {
  const repo = deps.repo ?? customersRepo;
  const db = deps.db ?? pool;
  const transaction: TransactionRunner = deps.transaction ?? ((fn) => withTransaction(fn));
  const log = deps.log ?? ((msg, context) => logger.warn(context, msg));

  async function windowDays(executor: Executor): Promise<number> {
    const configured = await repo.readActiveWindowDays(executor);
    if (configured !== null) return configured;
    log('system_config.active_customer_window_days is missing or invalid; using the documented default', {
      fallback: DEFAULT_ACTIVE_CUSTOMER_WINDOW_DAYS,
    });
    return DEFAULT_ACTIVE_CUSTOMER_WINDOW_DAYS;
  }

  /** BR-91: resolves the access and throws the shared 404 when the customer is not visible. */
  async function visibleAccess(executor: Executor, scope: ResolvedScope, customerId: string): Promise<CustomerAccess> {
    const access = customerAccess(scope);
    if (!(await repo.isVisible(executor, customerId, access))) throw customerNotFound();
    return access;
  }

  /** The redactor for this customer's farmers (BR-97), shared by the masked read and the reply check. */
  async function farmerRedactor(executor: Executor, customerId: string, orderIds: string[]): Promise<Redactor> {
    const identity = await repo.farmerIdentityTerms(executor, customerId, orderIds);
    return buildRedactor(identity.terms, identity.personNames, { phones: identity.phones ?? [] });
  }

  /** null for an unmasked actor (no redaction); farmer identity + the customer's contact otherwise. */
  async function redactionFor(access: CustomerAccess, customerId: string, orderIds: string[]): Promise<TicketRedaction | null> {
    if (!access.masked) return null;
    const farmer = await farmerRedactor(db, customerId, orderIds);
    const contact = await repo.customerContact(db, customerId);
    const contactRedactor = buildRedactor([], [], {
      phones: contact === null ? [] : [contact.mobile],
      emails: contact === null || contact.email === null ? [] : [contact.email],
    });
    return { farmer, text: composeRedactors(farmer, contactRedactor) };
  }

  return {
    async list(scope, query) {
      const access = customerAccess(scope);
      const days = await windowDays(db);
      // BR-115: the default `name` sort keeps its original cursor (`after`); every other sort
      // pages on (sort value, id) and refuses a cursor minted for another sort (422).
      const sort = query.sort ?? 'name';
      const cursorArgs =
        query.cursor === undefined
          ? {}
          : sort === 'name'
            ? { after: decodeNameKey(query.cursor) }
            : { afterSort: decodeSortKey(query.cursor, sort) };
      const fetchedRows = await repo.listCustomers(db, {
        access,
        windowDays: days,
        limit: query.limit,
        ...(query.q === undefined ? {} : { q: query.q }),
        ...(query.status === undefined ? {} : { status: query.status }),
        ...(query.crop === undefined ? {} : { crop: query.crop }),
        ...(query.grade === undefined ? {} : { grade: query.grade }),
        ...(query.from === undefined ? {} : { from: query.from }),
        ...(query.to === undefined ? {} : { to: query.to }),
        ...(sort === 'name' ? {} : { sort }),
        ...cursorArgs,
      });
      // BR-91e: the summary counts the whole visible set (not the page, not the filters).
      const summary = await repo.summarize(db, access, days);
      const paged = page(
        fetchedRows,
        (row) => listItem(row, access.masked),
        (row) => encodeSortKey({ sort, value: sort === 'name' ? row.fullName : row.sortCursor, id: row.id }),
      );
      return { ...paged, summary };
    },

    async get(scope, customerId) {
      const access = customerAccess(scope);
      const row = await repo.findCustomer(db, customerId, access, await windowDays(db));
      if (row === null) throw customerNotFound();
      const wallet = await repo.findWallet(db, customerId);
      const detail: AdminCustomerDetail = {
        id: row.id,
        customerCode: row.customerCode,
        name: row.fullName,
        mobileMasked: maskMobile(row.mobile),
        customerType: row.customerType,
        businessName: row.businessName,
        status: row.isActive ? 'ACTIVE' : 'INACTIVE',
        isNew: row.isNew,
        preferredWarehouseId: row.preferredWarehouseId,
        totalOrders: row.totalOrders,
        lifetimeValue: parseMoney(row.lifetimeValue),
        walletBalance: parseMoney(wallet?.ledgerBalance ?? '0'),
        lastOrderAt: row.lastOrderAt,
        lastActivityAt: row.lastActivityAt,
        piiMasked: access.masked,
        createdAt: row.createdAt,
      };
      if (!access.masked) {
        detail.mobile = row.mobile;
        detail.email = row.email;
        detail.addresses = await repo.listAddresses(db, customerId);
      }
      return detail;
    },

    async listPurchases(scope, customerId, query) {
      const access = await visibleAccess(db, scope, customerId);
      const rows = await repo.listPurchases(db, customerId, { access, limit: query.limit, ...optionalAfter(query.cursor) });
      return page(rows, purchase, (r) => timeCursor(r, r.itemId));
    },

    async listOrders(scope, customerId, query) {
      const access = await visibleAccess(db, scope, customerId);
      const rows = await repo.listOrders(db, customerId, { access, limit: query.limit, ...optionalAfter(query.cursor) });
      return page(rows, order, (r) => timeCursor(r, r.id));
    },

    async getWallet(scope, customerId) {
      await visibleAccess(db, scope, customerId);
      const wallet = await repo.findWallet(db, customerId);
      if (wallet === null) throw walletNotFound();
      return {
        customerId,
        walletId: wallet.walletId,
        balance: parseMoney(wallet.ledgerBalance),
        currency: 'INR',
        status: wallet.status as AdminCustomerWalletSummary['status'],
        transactionCount: wallet.transactionCount,
        lastTransactionAt: wallet.lastTransactionAt,
      };
    },

    async listWalletTransactions(scope, customerId, query) {
      await visibleAccess(db, scope, customerId);
      const wallet = await repo.findWallet(db, customerId);
      if (wallet === null) throw walletNotFound();
      const rows = await repo.listWalletTransactions(db, wallet.walletId, afterTime(query.cursor), query.limit);
      return page(rows, (r) => r.txn, (r) => timeCursor(r, r.txn.id));
    },

    async getWalletTransaction(scope, customerId, txnId) {
      await visibleAccess(db, scope, customerId);
      const wallet = await repo.findWallet(db, customerId);
      if (wallet === null) throw txnNotFound();
      const txn = await repo.findWalletTransaction(db, wallet.walletId, txnId);
      if (txn === null) throw txnNotFound();
      return txn;
    },

    async listIssues(scope, customerId, query) {
      const access = await visibleAccess(db, scope, customerId);
      const rows = await repo.listIssues(db, customerId, { access, limit: query.limit, ...optionalAfter(query.cursor) });
      return page(rows, issue, (r) => timeCursor(r, r.id));
    },

    async listSupportTickets(scope, customerId, query) {
      const access = await visibleAccess(db, scope, customerId);
      const rows = await repo.listTickets(db, customerId, afterTime(query.cursor), query.limit);
      const ticketIds = rows.rows.map((t) => t.id);
      const orderIds = rows.rows.flatMap((t) => (t.orderId === null ? [] : [t.orderId]));
      const redaction = await redactionFor(access, customerId, orderIds);
      const messages = await repo.listMessages(db, ticketIds);
      const visibleCount = new Map<string, number>();
      for (const m of messages) {
        if (message(m, redaction) !== null) visibleCount.set(m.ticketId, (visibleCount.get(m.ticketId) ?? 0) + 1);
      }
      return page(rows, (t) => ticket(t, visibleCount.get(t.id) ?? 0, redaction), (t) => timeCursor(t, t.id));
    },

    async getSupportTicket(scope, customerId, ticketId) {
      const access = await visibleAccess(db, scope, customerId);
      const row = await repo.findTicket(db, customerId, ticketId);
      if (row === null) throw ticketNotFound();
      const redaction = await redactionFor(access, customerId, row.orderId === null ? [] : [row.orderId]);
      const messages = (await repo.listMessages(db, [row.id]))
        .map((m) => message(m, redaction))
        .filter((m): m is AdminCustomerSupportMessage => m !== null);
      const description = row.description ?? '';
      return {
        ...ticket(row, messages.length, redaction),
        description: redaction === null ? description : redaction.text.redact(description).text,
        messages,
      };
    },

    async reply(respondScope, visibilityScope, customerId, ticketId, body) {
      return transaction(async (tx) => {
        const access = customerAccess(visibilityScope);
        if (!(await repo.isVisible(tx, customerId, access))) throw customerNotFound();
        const row = await repo.findTicket(tx, customerId, ticketId, true);
        if (row === null) throw ticketNotFound();
        if (row.status === 'CLOSED') {
          throw new AppError('CONFLICT', { detail: 'The ticket is closed; a closed ticket takes no further replies.' });
        }

        // BR-97c / BR-16: a reply is customer-facing, so it may never carry a farmer identity,
        // whatever the actor's scope. Refused, not silently rewritten: the author must know.
        const redactor = await farmerRedactor(tx, customerId, row.orderId === null ? [] : [row.orderId]);
        const attachmentKey = body.attachmentUrl ?? null;
        if (redactor.matches(body.message) || (attachmentKey !== null && redactor.matches(attachmentKey))) {
          throw new AppError('VALIDATION_FAILED', {
            detail: 'The reply names a farmer or farm. Remove it before sending (BR-97, BR-16).',
            errors: { 'body.message': ['Must not name a farmer, farm, village or location.'] },
          });
        }

        const stored = await repo.insertMessage(tx, {
          ticketId: row.id,
          senderUserId: respondScope.userId,
          body: body.message,
          attachmentKey,
        });

        // BR-35 / BR-97f: one audit row, ids only, on the same transaction as the insert.
        const [warehouseId] = visibilityScope.warehouseIds;
        await writeAuditLog(tx, {
          actorId: respondScope.userId,
          actorRole: respondScope.roleCode,
          actionCode: 'support.ticket.respond',
          entityType: 'support_message',
          entityId: stored.id,
          ...(warehouseId === undefined ? {} : { warehouseId }),
          after: { messageId: stored.id, ticketId: row.id, customerId },
        });

        return {
          id: stored.id,
          ticketId: row.id,
          senderUserId: respondScope.userId,
          senderRole: respondScope.roleCode,
          message: body.message,
          isInternal: false,
          redacted: false,
          attachmentUrl: attachmentKey,
          createdAt: stored.createdAt,
        };
      });
    },
  };
}

function optionalAfter(cursor: string | undefined): { after?: TimeKey } {
  return cursor === undefined ? {} : { after: decodeTimeKey(cursor) };
}

/** The production instance. */
export const customersService: CustomersService = createCustomersService();
