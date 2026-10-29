/**
 * BR-102 (and BR-26): inter-warehouse transfers.
 *
 * All business logic lives here; the service takes a `ResolvedScope`, never a Request.
 *
 *  - Scope. A scope that carries assigned warehouses is confined to them even under an `all` grant
 *    (`confineToAssignedWarehouses`; a Sub admin's receive grant is `all` in rbac.json). A transfer is
 *    visible when EITHER side is reachable; an invisible and an unknown transfer are the same 404.
 *    Receiving additionally needs the DESTINATION: the source's Sub admin already sees the transfer,
 *    so it gets 403 WAREHOUSE_SCOPE_VIOLATION (a 404 would hide nothing).
 *  - Stock moves only through the ledger, in ONE transaction per state change: TRANSFER_OUT rows at
 *    dispatch (creation below the threshold, or approval), TRANSFER_IN rows into new destination
 *    batches at receipt. Batches are row-locked and the BR-100 free-shelf check is repeated at
 *    dispatch. Stock in transit belongs to no warehouse.
 *  - High value. The threshold is a business figure from system_config (CLAUDE.md 2.7). A line with
 *    no cost cannot be valued, so it always forces approval: a missing cost must never let a valuable
 *    transfer slip under the threshold (UNCONFIRMED default in BR-102).
 *  - Idempotency. Create, approve and receive claim the Idempotency-Key in the same transaction as
 *    their writes, so a replay returns the stored response and writes nothing twice.
 *  - Audit. One row per state change, same transaction, masked: ids, status, warehouses, line count,
 *    total paise and the discrepancy flag; never the notes, the cancel reason, the receipt note or
 *    the vehicle number (free text can carry names and phone numbers, BR-35).
 */
import { ScopeLevel, toPaise, type Money } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { pool, withTransaction } from '../../db/pool.js';
import { writeAuditLog } from '../../audit/auditLog.js';
import { beginIdempotent, idempotencyStore, requireIdempotencyKey, type IdempotencyStore } from '../../http/idempotency.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseVisible } from '../../rbac/warehouseScope.js';
import { confineToAssignedWarehouses, warehouseNotFound } from '../warehouse-ops/scope.js';
import { warehouseTransfersRepo, type WarehouseTransfersRepo } from './warehouse-transfers.repo.js';
import {
  kgToGrams,
  type CancelTransferBody,
  type CreateTransferBody,
  type ListTransfersQuery,
  type ListTransfersResponse,
  type ReceiveTransferBody,
  type Transfer,
} from './warehouse-transfers.schema.js';

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

export interface WarehouseTransfersServiceDeps {
  repo: WarehouseTransfersRepo;
  db: Executor;
  runTx: TransactionRunner;
  idempotency: IdempotencyStore;
}

export interface WarehouseTransfersService {
  list(scope: ResolvedScope, query: ListTransfersQuery): Promise<ListTransfersResponse>;
  get(scope: ResolvedScope, id: string): Promise<Transfer>;
  create(scope: ResolvedScope, rawKey: string | undefined, body: CreateTransferBody): Promise<{ transfer: Transfer; replayed: boolean }>;
  approve(scope: ResolvedScope, id: string, rawKey: string | undefined): Promise<Transfer>;
  receive(scope: ResolvedScope, id: string, rawKey: string | undefined, body: ReceiveTransferBody): Promise<Transfer>;
  cancel(scope: ResolvedScope, id: string, body: CancelTransferBody): Promise<Transfer>;
}

const OPERATION = {
  create: 'warehouse-transfer.create',
  approve: 'warehouse-transfer.approve',
  receive: 'warehouse-transfer.receive',
} as const;

const ENTITY_TYPE = 'stock_transfer';

function transferNotFound(id: string): AppError {
  // One body for "no such transfer" and "a transfer of another warehouse" (BR-30, BR-102 rule 7).
  return new AppError('NOT_FOUND', { detail: `No transfer with id ${id} is visible to you.` });
}

function invalidTransition(from: string, action: string): AppError {
  return new AppError('INVALID_STATE_TRANSITION', { detail: `A ${from} transfer cannot be ${action}.`, meta: { status: from } });
}

function validationFailed(detail: string, errors: Record<string, string[]>): AppError {
  return new AppError('VALIDATION_FAILED', { status: 422, detail, errors });
}

function stockUnavailable(batchIds: string[], cause?: unknown): AppError {
  return new AppError('STOCK_UNAVAILABLE', {
    detail: 'A requested quantity exceeds the free shelf stock of its batch.',
    meta: { batchIds },
    ...(cause === undefined ? {} : { cause }),
  });
}

/** Re-throws the ledger trigger's stock guard (23514, hint INSUFFICIENT_STOCK) as the domain conflict it means. */
function mapStockGuard(error: unknown, batchId: string): unknown {
  const pg = error as { code?: string; hint?: string };
  if (pg.code === '23514' && pg.hint === 'code: INSUFFICIENT_STOCK') return stockUnavailable([batchId], error);
  return error;
}

/** The masked audit image: never notes, reason, receipt note or vehicle number. */
function image(t: Transfer): Record<string, unknown> {
  return {
    transferNumber: t.transferNumber,
    status: t.status,
    fromWarehouseId: t.fromWarehouseId,
    toWarehouseId: t.toWarehouseId,
    lineCount: t.lines.length,
    totalValuePaise: toPaise(t.totalValue as Money),
    hasDiscrepancy: t.hasDiscrepancy,
  };
}

/** Either side of the transfer is reachable by the (confined) scope. */
function canSee(confined: ResolvedScope, t: { fromWarehouseId: string; toWarehouseId: string }): boolean {
  return warehouseVisible(confined, t.fromWarehouseId) || warehouseVisible(confined, t.toWarehouseId);
}

/** The warehouse ids a list must be narrowed to, or null for "all". Mirrors `warehouseVisible`. */
function visibleWarehouses(confined: ResolvedScope): string[] | null {
  if (confined.farmerId !== undefined || confined.customerId !== undefined) return [];
  if (confined.level === ScopeLevel.ALL || confined.level === ScopeLevel.CONDITIONAL) return null;
  return confined.warehouseIds.length > 0 ? confined.warehouseIds : null;
}

export function createWarehouseTransfersService(deps: Partial<WarehouseTransfersServiceDeps> = {}): WarehouseTransfersService {
  const repo = deps.repo ?? warehouseTransfersRepo;
  const db = deps.db ?? pool;
  const runTx: TransactionRunner = deps.runTx ?? ((fn) => withTransaction(fn));
  const idempotency = deps.idempotency ?? idempotencyStore;

  /** Loads and row-locks a transfer the scope may see, else the one 404. */
  async function lockVisible(tx: Executor, confined: ResolvedScope, id: string): Promise<Transfer> {
    const transfer = await repo.lockTransfer(tx, id);
    if (transfer === null || !canSee(confined, transfer)) throw transferNotFound(id);
    return transfer;
  }

  /**
   * BR-102 rule 4: one TRANSFER_OUT row per line from the source warehouse, then IN_TRANSIT.
   * `recheck` repeats the lock + free-shelf check (approval happens long after creation; at creation
   * the batches were locked and checked a moment earlier in this same transaction).
   */
  async function dispatch(tx: Executor, transfer: Transfer, actorId: string, approvedBy: string | null, recheck: boolean): Promise<void> {
    if (recheck) {
      const checks = await repo.lockAndCheckBatches(
        tx,
        transfer.lines.map((l) => ({ batchId: l.batchId, qtyKg: l.qtySentKg })),
      );
      const byId = new Map(checks.map((c) => [c.batchId, c]));
      const short = transfer.lines
        .filter((l) => {
          const c = byId.get(l.batchId);
          return c === undefined || c.status !== 'ACTIVE' || c.warehouseId !== transfer.fromWarehouseId || !c.fits;
        })
        .map((l) => l.batchId);
      if (short.length > 0) throw stockUnavailable(short);
    }
    for (const line of transfer.lines) {
      let ledgerId: string;
      try {
        ledgerId = await repo.insertLedger(tx, {
          batchId: line.batchId,
          warehouseId: transfer.fromWarehouseId,
          movementType: 'TRANSFER_OUT',
          qtyDeltaKg: `-${line.qtySentKg}`,
          transferId: transfer.id,
          transferNumber: transfer.transferNumber,
          actorId,
        });
      } catch (error) {
        throw mapStockGuard(error, line.batchId);
      }
      await repo.setOutLedger(tx, line.id, ledgerId);
    }
    await repo.markDispatched(tx, transfer.id, approvedBy);
  }

  async function reload(tx: Executor, id: string): Promise<Transfer> {
    const transfer = await repo.findTransfer(tx, id);
    if (transfer === null) throw new Error(`transfer ${id} vanished inside its own transaction`);
    return transfer;
  }

  return {
    async list(scope, query) {
      const { items, total } = await repo.list(db, query, visibleWarehouses(confineToAssignedWarehouses(scope)));
      return { items, page: query.page, pageSize: query.pageSize, total };
    },

    async get(scope, id) {
      const transfer = await repo.findTransfer(db, id);
      if (transfer === null || !canSee(confineToAssignedWarehouses(scope), transfer)) throw transferNotFound(id);
      return transfer;
    },

    async create(scope, rawKey, body) {
      const key = requireIdempotencyKey(rawKey);
      // BR-26 is the permission; this is BR-30: a scope confined to other warehouses cannot send
      // from this one. Checked before any I/O so a probe never reaches the database.
      const confined = confineToAssignedWarehouses(scope);
      if (!warehouseVisible(confined, body.fromWarehouseId)) throw warehouseNotFound(body.fromWarehouseId);

      return runTx(async (tx) => {
        const idem = await beginIdempotent<Transfer>(idempotency, tx, {
          actorUserId: scope.userId,
          key,
          operation: OPERATION.create,
          request: body,
        });
        if (idem.replay) return { transfer: idem.response, replayed: true };

        // Both warehouses must exist and be active: a body field problem, so 422 on the field.
        const found = new Map((await repo.findWarehouses(tx, [body.fromWarehouseId, body.toWarehouseId])).map((w) => [w.id, w]));
        const warehouseErrors: Record<string, string[]> = {};
        for (const field of ['fromWarehouseId', 'toWarehouseId'] as const) {
          const warehouse = found.get(body[field]);
          if (warehouse === undefined) warehouseErrors[`body.${field}`] = ['Unknown warehouse.'];
          else if (!warehouse.isActive) warehouseErrors[`body.${field}`] = ['The warehouse is not active.'];
        }
        if (Object.keys(warehouseErrors).length > 0) throw validationFailed('A named warehouse cannot take part in a transfer.', warehouseErrors);

        const checks = new Map((await repo.lockAndCheckBatches(tx, body.lines)).map((c) => [c.batchId, c]));
        const lineErrors: Record<string, string[]> = {};
        body.lines.forEach((line, index) => {
          const check = checks.get(line.batchId);
          const field = `body.lines.${index}.batchId`;
          if (check === undefined) lineErrors[field] = ['Unknown batch.'];
          else if (check.warehouseId !== body.fromWarehouseId) lineErrors[field] = ['The batch is not in the source warehouse.'];
          else if (check.status !== 'ACTIVE') lineErrors[field] = [`The batch is ${check.status}, not ACTIVE.`];
        });
        if (Object.keys(lineErrors).length > 0) throw validationFailed('A line names a batch that cannot be transferred.', lineErrors);

        const short = body.lines.filter((l) => checks.get(l.batchId)?.fits !== true).map((l) => l.batchId);
        if (short.length > 0) throw stockUnavailable(short);

        const valued = body.lines.map((l) => checks.get(l.batchId)!);
        const hasUnvaluedLines = valued.some((c) => c.lineValuePaise === null);
        const totalValuePaise = valued.reduce((sum, c) => sum + (c.lineValuePaise ?? 0), 0);
        const threshold = await repo.highValueThresholdPaise(tx);
        const requiresApproval = hasUnvaluedLines || totalValuePaise >= threshold;

        const { id } = await repo.insertTransfer(tx, {
          fromWarehouseId: body.fromWarehouseId,
          toWarehouseId: body.toWarehouseId,
          initiatedBy: scope.userId,
          totalValuePaise,
          hasUnvaluedLines,
          requiresApproval,
          vehicleNumber: body.vehicleNumber ?? null,
          notes: body.notes ?? null,
        });
        await repo.insertItems(
          tx,
          id,
          body.lines.map((l) => {
            const c = checks.get(l.batchId)!;
            return { batchId: l.batchId, qtyKg: l.qtyKg, costPerKg: c.costPerKg, lineValuePaise: c.lineValuePaise };
          }),
        );
        if (!requiresApproval) {
          const created = await repo.lockTransfer(tx, id);
          if (created === null) throw new Error(`transfer ${id} vanished inside its own transaction`);
          await dispatch(tx, created, scope.userId, null, false);
        }

        const transfer = await reload(tx, id);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'transfer.inter_warehouse.initiate',
          entityType: ENTITY_TYPE,
          entityId: id,
          warehouseId: transfer.fromWarehouseId,
          after: image(transfer),
        });
        await idem.complete(transfer);
        return { transfer, replayed: false };
      });
    },

    async approve(scope, id, rawKey) {
      const key = requireIdempotencyKey(rawKey);
      const confined = confineToAssignedWarehouses(scope);
      return runTx(async (tx) => {
        const idem = await beginIdempotent<Transfer>(idempotency, tx, {
          actorUserId: scope.userId,
          key,
          operation: OPERATION.approve,
          request: { id },
        });
        if (idem.replay) return idem.response;

        const current = await lockVisible(tx, confined, id);
        if (current.status !== 'PENDING_APPROVAL') throw invalidTransition(current.status, 'approved');
        // Also a DB CHECK (stock_transfers_no_self_approval_chk); refused here first for a clean 403.
        if (current.initiatedBy === scope.userId) {
          throw new AppError('SELF_APPROVAL_FORBIDDEN', { detail: 'The initiator of a transfer cannot approve it.' });
        }

        await dispatch(tx, current, scope.userId, scope.userId, true);
        const transfer = await reload(tx, id);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'transfer.high_value.approve',
          entityType: ENTITY_TYPE,
          entityId: id,
          warehouseId: transfer.fromWarehouseId,
          before: image(current),
          after: image(transfer),
          changedFields: ['status', 'approvedBy', 'approvedAt', 'dispatchedAt'],
        });
        await idem.complete(transfer);
        return transfer;
      });
    },

    async receive(scope, id, rawKey, body) {
      const key = requireIdempotencyKey(rawKey);
      const confined = confineToAssignedWarehouses(scope);
      return runTx(async (tx) => {
        const idem = await beginIdempotent<Transfer>(idempotency, tx, {
          actorUserId: scope.userId,
          key,
          operation: OPERATION.receive,
          request: { id, body },
        });
        if (idem.replay) return idem.response;

        const current = await lockVisible(tx, confined, id);
        if (!warehouseVisible(confined, current.toWarehouseId)) {
          throw new AppError('WAREHOUSE_SCOPE_VIOLATION', { detail: 'Only the destination warehouse can receive this transfer.' });
        }
        if (current.status !== 'IN_TRANSIT') throw invalidTransition(current.status, 'received');

        // Every line exactly once (the schema already refused duplicates), never more than was sent.
        const sent = new Map(current.lines.map((l) => [l.id, l]));
        const received = new Map<string, string>();
        const errors: Record<string, string[]> = {};
        body.lines.forEach((l, index) => {
          const line = sent.get(l.itemId);
          if (line === undefined) {
            errors[`body.lines.${index}.itemId`] = ['Not a line of this transfer.'];
          } else if (kgToGrams(l.qtyReceivedKg) > kgToGrams(line.qtySentKg)) {
            errors[`body.lines.${index}.qtyReceivedKg`] = [`More than the ${line.qtySentKg} kg sent.`];
          } else {
            received.set(l.itemId, l.qtyReceivedKg);
            // BR-126 (the BR-120 guard): damaged and spoiled are parts of the shortfall, never in
            // addition to what is received, so the destination is credited qtyReceivedKg exactly as
            // before. Integer grams, never floats.
            const shortfall = kgToGrams(line.qtySentKg) - kgToGrams(l.qtyReceivedKg);
            const broken = kgToGrams(l.damagedQtyKg ?? '0') + kgToGrams(l.spoiledQtyKg ?? '0');
            if (broken > shortfall) {
              errors[`body.lines.${index}.damagedQtyKg`] = [
                'damagedQtyKg + spoiledQtyKg cannot exceed the shortfall (qtySentKg - qtyReceivedKg): they are parts of what was not received.',
              ];
            }
          }
        });
        if (current.lines.some((l) => !body.lines.some((b) => b.itemId === l.id))) {
          errors['body.lines'] = ['Every line of the transfer must be received exactly once (0 for nothing arrived).'];
        }

        // BR-126: an actual product must be a live crop; it is stored only (the destination batch
        // keeps the source crop and grade, UNCONFIRMED).
        const productIds = [...new Set(body.lines.flatMap((l) => (l.actualProductId === undefined ? [] : [l.actualProductId])))];
        const liveProducts = new Set(await repo.findLiveCropIds(tx, productIds));
        // BR-126 / BR-125: a location must be a live, ACTIVE location of the DESTINATION; it is
        // share-locked until this transaction ends so it cannot be switched off under the new batch.
        const locationCodes = new Map<string, string>();
        for (const [index, l] of body.lines.entries()) {
          if (l.actualProductId !== undefined && !liveProducts.has(l.actualProductId)) {
            errors[`body.lines.${index}.actualProductId`] = ['Unknown product.'];
          }
          if (l.storageLocationId !== undefined) {
            const location = await repo.findPlaceableLocation(tx, current.toWarehouseId, l.storageLocationId);
            if (location === null) {
              errors[`body.lines.${index}.storageLocationId`] = ['No storage location with that id in the destination warehouse.'];
            } else if (!location.isActive) {
              errors[`body.lines.${index}.storageLocationId`] = ['The storage location is not active.'];
            } else {
              locationCodes.set(location.id, location.code);
            }
          }
        }
        if (Object.keys(errors).length > 0) throw validationFailed('The receipt does not match the transfer.', errors);
        const details = new Map(body.lines.map((l) => [l.itemId, l]));
        const storageLabel = (l: ReceiveTransferBody['lines'][number]): string | null =>
          l.storageLocation ?? (l.storageLocationId === undefined ? null : locationCodes.get(l.storageLocationId) ?? null);

        const hasDiscrepancy = current.lines.some((l) => kgToGrams(received.get(l.id)!) < kgToGrams(l.qtySentKg));
        if (hasDiscrepancy && body.receiptNote === undefined) {
          throw validationFailed('A short receipt needs a receipt note.', {
            'body.receiptNote': ['Required when any line is received short.'],
          });
        }

        for (const line of current.lines) {
          const qtyKg = received.get(line.id)!;
          const given = details.get(line.id)!;
          const recorded = {
            damagedQtyKg: given.damagedQtyKg ?? '0',
            spoiledQtyKg: given.spoiledQtyKg ?? '0',
            condition: given.condition ?? null,
            actualGrade: given.actualGrade ?? null,
            actualCropId: given.actualProductId ?? null,
            storageLocationId: given.storageLocationId ?? null,
            storageLocation: storageLabel(given),
          };
          if (kgToGrams(qtyKg) === 0) {
            await repo.markItemReceived(tx, line.id, { qtyKg, destBatchId: null, inLedgerId: null, ...recorded });
            continue;
          }
          const destBatchId = await repo.insertDestBatch(tx, {
            sourceBatchId: line.batchId,
            warehouseId: current.toWarehouseId,
            qtyKg,
            transferNumber: current.transferNumber,
            storageLocationId: recorded.storageLocationId,
            storageLocation: recorded.storageLocation,
          });
          const inLedgerId = await repo.insertLedger(tx, {
            batchId: destBatchId,
            warehouseId: current.toWarehouseId,
            movementType: 'TRANSFER_IN',
            qtyDeltaKg: qtyKg,
            transferId: current.id,
            transferNumber: current.transferNumber,
            actorId: scope.userId,
          });
          await repo.markItemReceived(tx, line.id, { qtyKg, destBatchId, inLedgerId, ...recorded });
        }
        await repo.markReceived(tx, id, { receivedBy: scope.userId, hasDiscrepancy, receiptNote: body.receiptNote ?? null });

        const transfer = await reload(tx, id);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'transfer.inter_warehouse.receive',
          entityType: ENTITY_TYPE,
          entityId: id,
          warehouseId: transfer.toWarehouseId,
          before: image(current),
          // BR-126: the receipt number and the per-line details, never the note or the location text.
          after: {
            ...image(transfer),
            receiptNumber: transfer.receiptNumber,
            lines: transfer.lines.map((l) => ({
              itemId: l.id,
              qtySentKg: l.qtySentKg,
              qtyReceivedKg: l.qtyReceivedKg,
              damagedQtyKg: l.damagedQtyKg,
              spoiledQtyKg: l.spoiledQtyKg,
              condition: l.condition,
              actualGrade: l.actualGrade,
              actualProductId: l.actualProductId,
              storageLocationId: l.storageLocationId,
              destBatchId: l.destBatchId,
            })),
          },
          changedFields: hasDiscrepancy
            ? ['status', 'receivedBy', 'receivedAt', 'hasDiscrepancy', 'receiptNote']
            : ['status', 'receivedBy', 'receivedAt', ...(body.receiptNote === undefined ? [] : ['receiptNote'])],
        });
        await idem.complete(transfer);
        return transfer;
      });
    },

    async cancel(scope, id, body) {
      const confined = confineToAssignedWarehouses(scope);
      return runTx(async (tx) => {
        const current = await lockVisible(tx, confined, id);
        // Only before dispatch: once stock has left, the transfer can only be received.
        if (current.status !== 'PENDING_APPROVAL') throw invalidTransition(current.status, 'cancelled');
        await repo.markCancelled(tx, id, { cancelledBy: scope.userId, reason: body.reason });
        const transfer = await reload(tx, id);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'transfer.inter_warehouse.cancel',
          entityType: ENTITY_TYPE,
          entityId: id,
          warehouseId: transfer.fromWarehouseId,
          before: image(current),
          after: image(transfer),
          changedFields: ['status', 'cancelledBy', 'cancelledAt', 'cancelReason'],
        });
        return transfer;
      });
    },
  };
}

export const warehouseTransfersService: WarehouseTransfersService = createWarehouseTransfersService();
