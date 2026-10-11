/**
 * Returns & Issues (RMA). See CLAUDE.md for the four-file module pattern.
 *
 * <name>.service.ts holds the business logic and is the ONLY layer that makes
 * authorization decisions beyond "does the actor hold this permission".
 * Rules:
 *  - Take the `ResolvedScope` produced by `requirePermission`, never a Request.
 *    That keeps the service callable from a job, a script or a test.
 *  - Cross-scope rows come back EMPTY/404, never 403 — see
 *    requirePermission.ts for why.
 *  - Wrap multi-statement writes in `withTransaction` and write the audit row
 *    with the same client.
 *  - Throw `AppError` with a domain `ErrorCode`; never return an error shape.
 *
 * BR-61 state machine (see docs/rules.md):
 *
 *   PENDING --inspect--> INSPECTED --approve--> APPROVED --refund/wallet--> REFUNDED
 *      |                     |                     \--refund/bank--> REFUND_PENDING_BANK
 *      \--reject------------/--reject-->  REJECTED
 *
 * Both refund endpoints require status APPROVED to START a refund — once a
 * return has left APPROVED there is no path back into it, which is what makes
 * "refunded at most once" true by construction rather than by a flag.
 */
import { ScopeLevel, parseMoney } from '@tohfa/shared-types';
import type { Actor } from '../../auth/requireAuth.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { walletService, type WalletService } from '../wallet/wallet.service.js';
import {
  returnRequestsRepo,
  type OrderForReturn,
  type ReturnRequestsRepo,
  type ReturnSummaryRowShape,
} from './returnRequests.repo.js';
import type {
  CreateReturnRequestBody,
  InspectReturnBody,
  ListReturnsQuery,
  ListReturnsResponse,
  RejectReturnBody,
  ReturnHistoryResponse,
  ReturnRefundResponse,
  ReturnRequestItemResponse,
  ReturnRequestResponse,
  ReturnStatus,
} from './returnRequests.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface ReturnRequestsServiceDeps {
  repo: ReturnRequestsRepo;
  db: Executor;
  runTx: TransactionRunner;
  walletSvc: WalletService;
}

/**
 * A row is visible to a non-`all`/`conditional` scope only when it matches the
 * caller's own customer id or one of their assigned warehouse ids. Mirrors
 * `scopedWhere`'s column-matching logic for a row already loaded by id (rather
 * than filtered in SQL), including the fail-closed default.
 */
function orderVisible(scope: ResolvedScope, order: OrderForReturn): boolean {
  if (scope.level === ScopeLevel.ALL || scope.level === ScopeLevel.CONDITIONAL) return true;
  if (scope.customerId !== undefined) return order.customerId === scope.customerId;
  if (scope.warehouseIds.length > 0) return scope.warehouseIds.includes(order.warehouseId);
  return false;
}

function notFound(id: string): AppError {
  // NOTE: 404 rather than 403 when the row exists but is out of scope.
  // Returning 403 would confirm the row's existence to an actor who is not
  // allowed to know about it (root CLAUDE.md §2.1).
  return new AppError('NOT_FOUND', { detail: `No return request with id ${id} is visible to you.` });
}

function invalidTransition(id: string, current: ReturnStatus, detail: string): AppError {
  return new AppError('INVALID_STATE_TRANSITION', {
    status: 409,
    detail: `Return ${id} is ${current}; ${detail} (BR-61).`,
  });
}

export function createReturnRequestsService(
  deps: Partial<ReturnRequestsServiceDeps> = {},
): ReturnRequestsService {
  const repo = deps.repo ?? returnRequestsRepo;
  const db = deps.db ?? pool;
  const runTx = deps.runTx ?? (deps.db ? <T>(fn: (tx: Executor) => Promise<T>) => fn(deps.db!) : withTransaction);
  const walletSvc = deps.walletSvc ?? walletService;

  async function loadVisible(scope: ResolvedScope, id: string): Promise<ReturnRequestResponse> {
    const found = await repo.findById(db, id, scope);
    if (found === null) throw notFound(id);
    return found;
  }

  return {
    async createReturnRequest(actor, scope, orderId, input): Promise<ReturnRequestResponse> {
      const order = await repo.findOrderForReturn(db, orderId);
      if (order === null || !orderVisible(scope, order)) {
        throw new AppError('NOT_FOUND', {
          detail: `No order with id ${orderId} is visible to you.`,
        });
      }

      const orderItemIds = input.items.map((item) => item.orderItemId);
      const orderItems = await repo.findOrderItemsByIds(db, orderId, orderItemIds);
      const byId = new Map(orderItems.map((item) => [item.id, item]));

      for (const item of input.items) {
        const orderItem = byId.get(item.orderItemId);
        if (orderItem === undefined) {
          throw new AppError('VALIDATION_FAILED', {
            detail: `Order item ${item.orderItemId} does not belong to order ${orderId}.`,
          });
        }
        if (orderItem.status === 'RETURNED' || orderItem.status === 'CANCELLED') {
          throw new AppError('INVALID_STATE_TRANSITION', {
            status: 409,
            detail: `Order item ${item.orderItemId} is already ${orderItem.status} and cannot be returned again.`,
          });
        }
        if (Number(item.qty) > Number(orderItem.qtyKg) + 0.001) {
          throw new AppError('VALIDATION_FAILED', {
            detail: `Requested return quantity (${item.qty}) exceeds the ordered quantity (${orderItem.qtyKg}) for item ${item.orderItemId}.`,
          });
        }
      }

      const { returnRow, items } = await runTx(async (tx) => {
        const inserted = await repo.insertReturnRequest(tx, {
          orderId,
          customerId: order.customerId,
          reason: input.reason,
          note: input.note ?? null,
        });

        const insertedItems = await repo.insertReturnRequestItems(
          tx,
          inserted.id,
          input.items.map((item) => ({ orderItemId: item.orderItemId, requestedQty: item.qty })),
        );

        await repo.insertStatusHistory(tx, {
          returnRequestId: inserted.id,
          fromStatus: null,
          toStatus: 'PENDING',
          changedBy: actor.userId,
        });

        await writeAuditLog(tx, {
          actorId: actor.userId,
          actorRole: scope.roleCode,
          actionCode: 'rma.request.process',
          entityType: 'return_request',
          entityId: inserted.id,
          warehouseId: order.warehouseId,
          after: { status: 'PENDING', orderId, items: insertedItems },
        });

        return { returnRow: inserted, items: insertedItems };
      });

      return toResponse(returnRow, order.warehouseId, items);
    },

    async list(scope, query): Promise<ListReturnsResponse> {
      const result = await repo.list(db, { filters: query, scope });
      return {
        items: result.items,
        page: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      };
    },

    async getById(scope, id): Promise<ReturnRequestResponse> {
      return loadVisible(scope, id);
    },

    async inspect(actor, scope, id, input): Promise<ReturnRequestResponse> {
      const existing = await loadVisible(scope, id);
      if (existing.status !== 'PENDING') {
        throw invalidTransition(id, existing.status, 'only a PENDING return can be inspected');
      }

      const knownItemIds = new Set(existing.items.map((item) => item.orderItemId));
      for (const item of input.items) {
        if (!knownItemIds.has(item.orderItemId)) {
          throw new AppError('VALIDATION_FAILED', {
            detail: `Order item ${item.orderItemId} is not part of return ${id}.`,
          });
        }
      }

      await runTx(async (tx) => {
        await repo.updateInspectionItems(tx, id, input.items);
        await repo.updateStatus(tx, id, 'INSPECTED');
        await repo.insertStatusHistory(tx, {
          returnRequestId: id,
          fromStatus: 'PENDING',
          toStatus: 'INSPECTED',
          changedBy: actor.userId,
        });
        await writeAuditLog(tx, {
          actorId: actor.userId,
          actorRole: scope.roleCode,
          actionCode: 'inventory.quality_check.perform',
          entityType: 'return_request',
          entityId: id,
          warehouseId: existing.warehouseId,
          before: { status: 'PENDING' },
          after: { status: 'INSPECTED', items: input.items },
        });
      });

      return loadVisible(scope, id);
    },

    async approve(actor, scope, id): Promise<ReturnRequestResponse> {
      const existing = await loadVisible(scope, id);
      if (existing.status !== 'INSPECTED') {
        throw invalidTransition(id, existing.status, 'only an INSPECTED return can be approved');
      }

      await runTx(async (tx) => {
        await repo.updateStatus(tx, id, 'APPROVED');
        await repo.markOrderItemsReturned(tx, existing.items.map((item) => item.orderItemId));
        await repo.insertStatusHistory(tx, {
          returnRequestId: id,
          fromStatus: 'INSPECTED',
          toStatus: 'APPROVED',
          changedBy: actor.userId,
        });
        await writeAuditLog(tx, {
          actorId: actor.userId,
          actorRole: scope.roleCode,
          actionCode: 'rma.refund.approve',
          entityType: 'return_request',
          entityId: id,
          warehouseId: existing.warehouseId,
          before: { status: 'INSPECTED' },
          after: { status: 'APPROVED' },
        });
      });

      return loadVisible(scope, id);
    },

    async reject(actor, scope, id, input): Promise<ReturnRequestResponse> {
      const existing = await loadVisible(scope, id);
      if (existing.status !== 'PENDING' && existing.status !== 'INSPECTED') {
        throw invalidTransition(id, existing.status, 'only a PENDING or INSPECTED return can be rejected');
      }

      await runTx(async (tx) => {
        await repo.updateStatus(tx, id, 'REJECTED');
        await repo.insertStatusHistory(tx, {
          returnRequestId: id,
          fromStatus: existing.status,
          toStatus: 'REJECTED',
          changedBy: actor.userId,
          note: input.reason,
        });
        await writeAuditLog(tx, {
          actorId: actor.userId,
          actorRole: scope.roleCode,
          actionCode: 'rma.refund.approve',
          entityType: 'return_request',
          entityId: id,
          warehouseId: existing.warehouseId,
          before: { status: existing.status },
          after: { status: 'REJECTED', reason: input.reason },
        });
      });

      return loadVisible(scope, id);
    },

    async refundWallet(actor, scope, id, idempotencyKey): Promise<ReturnRefundResponse> {
      if (idempotencyKey === undefined || idempotencyKey.trim().length === 0) {
        throw new AppError('VALIDATION_FAILED', {
          status: 422,
          detail: 'Idempotency-Key header is required for a wallet refund.',
        });
      }

      const existing = await loadVisible(scope, id);
      if (existing.status !== 'APPROVED' && existing.status !== 'REFUNDED') {
        throw invalidTransition(id, existing.status, 'a wallet refund requires status APPROVED');
      }

      const amount = parseMoney(await repo.sumAcceptedAmount(db, id));

      // The wallet-side idempotency key is DERIVED from the return id, not
      // taken verbatim from the client header. A client that forgets its own
      // header value and retries with a brand-new one must still hit the same
      // `wallet_transactions.idempotency_key` row — otherwise a second,
      // differently-keyed call would credit the wallet twice, which is exactly
      // what BR-61 forbids. The header is still required above so the
      // contract matches every other money-moving endpoint (root CLAUDE.md
      // §2.4); it is echoed into the audit log for traceability.
      const walletIdempotencyKey = `return_refund_wallet_${id}`;

      const walletTxn = await runTx(async (tx) => {
        const txn = await walletSvc.move(
          scope,
          {
            customerId: existing.customerId,
            direction: 'CREDIT',
            type: 'ORDER_REFUND',
            amount,
            refType: 'return_request',
            refId: id,
            idempotencyKey: walletIdempotencyKey,
            remarks: `Wallet refund for return ${id}`,
            createdBy: actor.userId,
          },
          tx,
        );

        // Only the FIRST call to actually move the row out of APPROVED writes
        // history/audit; a replay (status already REFUNDED) is a no-op here —
        // wallet.move already guaranteed it did not credit twice above.
        const advanced = await repo.updateStatusIfCurrent(tx, id, 'APPROVED', 'REFUNDED');
        if (advanced) {
          await repo.insertStatusHistory(tx, {
            returnRequestId: id,
            fromStatus: 'APPROVED',
            toStatus: 'REFUNDED',
            changedBy: actor.userId,
            note: `wallet txn ${txn.id}`,
          });
          await writeAuditLog(tx, {
            actorId: actor.userId,
            actorRole: scope.roleCode,
            actionCode: 'rma.refund.wallet_process',
            entityType: 'return_request',
            entityId: id,
            warehouseId: existing.warehouseId,
            before: { status: 'APPROVED' },
            after: { status: 'REFUNDED', walletTxnId: txn.id, amount, clientIdempotencyKey: idempotencyKey },
          });
        }

        return txn;
      });

      const updated = await loadVisible(scope, id);
      return { returnRequest: updated, walletTransactionId: walletTxn.id, amount };
    },

    async refundBank(actor, scope, id, idempotencyKey): Promise<ReturnRefundResponse> {
      if (idempotencyKey === undefined || idempotencyKey.trim().length === 0) {
        throw new AppError('VALIDATION_FAILED', {
          status: 422,
          detail: 'Idempotency-Key header is required for a bank refund.',
        });
      }

      const existing = await loadVisible(scope, id);
      if (existing.status !== 'APPROVED' && existing.status !== 'REFUND_PENDING_BANK') {
        throw invalidTransition(id, existing.status, 'a bank refund requires status APPROVED');
      }

      const amount = parseMoney(await repo.sumAcceptedAmount(db, id));

      await runTx(async (tx) => {
        // No ledger write here — a bank refund is a manual 2-4 day hand-off to
        // SA/TA outside TOHFA's own rails (docs/rbac.json
        // rma.refund.bank_process; the resolved "Process returns (RMA) for
        // MW/SW" contradiction in docs/rules.md). The status-history row IS
        // the record for SA/TA to action; the conditional UPDATE makes a
        // replay of this call a no-op rather than a second record.
        const advanced = await repo.updateStatusIfCurrent(tx, id, 'APPROVED', 'REFUND_PENDING_BANK');
        if (advanced) {
          await repo.insertStatusHistory(tx, {
            returnRequestId: id,
            fromStatus: 'APPROVED',
            toStatus: 'REFUND_PENDING_BANK',
            changedBy: actor.userId,
            note: `Bank refund of ${amount} initiated; action manually (Idempotency-Key ${idempotencyKey}).`,
          });
          await writeAuditLog(tx, {
            actorId: actor.userId,
            actorRole: scope.roleCode,
            actionCode: 'rma.refund.bank_process',
            entityType: 'return_request',
            entityId: id,
            warehouseId: existing.warehouseId,
            before: { status: 'APPROVED' },
            after: { status: 'REFUND_PENDING_BANK', amount, clientIdempotencyKey: idempotencyKey },
          });
        }
      });

      const updated = await loadVisible(scope, id);
      return { returnRequest: updated, walletTransactionId: null, amount };
    },

    async getHistory(scope, id): Promise<ReturnHistoryResponse> {
      // Confirms visibility (404, not leak-via-history) before reading the trail.
      await loadVisible(scope, id);
      const items = await repo.getHistory(db, id);
      return { items };
    },
  };
}

function toResponse(
  row: ReturnSummaryRowShape,
  warehouseId: string,
  items: ReturnRequestItemResponse[],
): ReturnRequestResponse {
  return {
    id: row.id,
    orderId: row.orderId,
    customerId: row.customerId,
    warehouseId,
    status: row.status,
    reason: row.reason,
    note: row.note,
    items,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt === null ? null : row.updatedAt.toISOString(),
  };
}

export interface ReturnRequestsService {
  createReturnRequest(
    actor: Actor,
    scope: ResolvedScope,
    orderId: string,
    input: CreateReturnRequestBody,
  ): Promise<ReturnRequestResponse>;
  list(scope: ResolvedScope, query: ListReturnsQuery): Promise<ListReturnsResponse>;
  getById(scope: ResolvedScope, id: string): Promise<ReturnRequestResponse>;
  inspect(
    actor: Actor,
    scope: ResolvedScope,
    id: string,
    input: InspectReturnBody,
  ): Promise<ReturnRequestResponse>;
  approve(actor: Actor, scope: ResolvedScope, id: string): Promise<ReturnRequestResponse>;
  reject(
    actor: Actor,
    scope: ResolvedScope,
    id: string,
    input: RejectReturnBody,
  ): Promise<ReturnRequestResponse>;
  refundWallet(
    actor: Actor,
    scope: ResolvedScope,
    id: string,
    idempotencyKey: string | undefined,
  ): Promise<ReturnRefundResponse>;
  refundBank(
    actor: Actor,
    scope: ResolvedScope,
    id: string,
    idempotencyKey: string | undefined,
  ): Promise<ReturnRefundResponse>;
  getHistory(scope: ResolvedScope, id: string): Promise<ReturnHistoryResponse>;
}

/** The production instance. */
export const returnRequestsService: ReturnRequestsService = createReturnRequestsService();
