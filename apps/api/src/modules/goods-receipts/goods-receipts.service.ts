import type { Actor } from '../../auth/requireAuth.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { eventBus } from '../../events/bus.js';
import {
  beginIdempotent,
  idempotencyStore,
  requireIdempotencyKey,
  type IdempotencyStore,
} from '../../http/idempotency.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseVisible } from '../../rbac/warehouseScope.js';
import { allocationsService, type AllocateBatchInput } from '../allocations/allocations.service.js';
import type { BatchView } from '../inventory/inventory.schema.js';
import type { ProduceGrade } from '../purchase-orders/purchase-orders.schema.js';
import { confineToAssignedWarehouses, warehouseNotFound } from '../warehouse-ops/scope.js';
import {
  goodsReceiptsRepo,
  type GoodsReceiptsRepo,
  type StockingSource,
} from './goods-receipts.repo.js';
import {
  qcParameters,
  type QcOutcome,
  type CreateGoodsReceiptBody,
  type GoodsReceiptResponse,
  type ListGoodsReceiptsQuery,
  type ListGoodsReceiptsResponse,
  type QualityCheckCreateBody,
  type QualityCheckResponse,
  type QualityCounterOfferBody,
  type QualityCounterOfferResponse,
} from './goods-receipts.schema.js';

export interface GoodsReceiptsService {
  /** BR-118: `idempotencyKey` is the required Idempotency-Key header (422 when missing). */
  createGoodsReceipt(
    actor: Actor,
    scope: ResolvedScope,
    input: CreateGoodsReceiptBody,
    idempotencyKey?: string,
  ): Promise<GoodsReceiptResponse>;

  /** BR-118: `idempotencyKey` is the required Idempotency-Key header (422 when missing). */
  recordQualityCheck(
    actor: Actor,
    scope: ResolvedScope,
    goodsReceiptId: string,
    input: QualityCheckCreateBody,
    idempotencyKey?: string,
  ): Promise<QualityCheckResult>;

  /**
   * BR-106 hook: the farmer has just accepted counter-offer `offerId`, on transaction `tx`
   * (counter-offers.service respondAccept). When it is a quality counter-offer whose receipt is not
   * stocked yet, stock it now; otherwise do nothing. Takes the caller's executor rather than a
   * scope: it is a consequence of an acceptance already authorised and audited by the caller, and
   * must commit or roll back with it. Returns the batch it created, or null.
   */
  stockAcceptedQualityCounterOffer(tx: Executor, offerId: string): Promise<BatchView | null>;

  /** BR-118: `idempotencyKey` is the required Idempotency-Key header (422 when missing). */
  createQualityCounterOffer(
    actor: Actor,
    scope: ResolvedScope,
    goodsReceiptId: string,
    input: QualityCounterOfferBody,
    idempotencyKey?: string,
  ): Promise<QualityCounterOfferResponse>;

  getById(
    actor: Actor,
    scope: ResolvedScope,
    id: string,
  ): Promise<GoodsReceiptResponse>;

  list(
    actor: Actor,
    scope: ResolvedScope,
    query: ListGoodsReceiptsQuery,
  ): Promise<ListGoodsReceiptsResponse>;
}

export type QualityCheckResult = { qualityCheck: QualityCheckResponse; batch: BatchView | null };

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

/**
 * The `operation` recorded on an idempotency_keys claim (BR-118). One per endpoint, so a key used on
 * one of them and sent to another is 409 IDEMPOTENCY_KEY_REUSED, never a replay of the wrong thing.
 */
const OPERATION = {
  createReceipt: 'inventory.goods_receipt.record',
  qualityCheck: 'inventory.quality_check.perform',
  qualityCounterOffer: 'inventory.quality.counter_offer',
} as const;

/** BR-12 channel allocation of a new batch, on the caller's transaction. Injected for unit tests. */
export type BatchAllocator = (input: AllocateBatchInput, tx: Executor) => Promise<unknown>;

const allocateNewBatch: BatchAllocator = (input, tx) => allocationsService.allocateBatch(input, tx);

/**
 * BR-106: a quality check stocks its goods when it accepted some (ACCEPTED or PARTIALLY_ACCEPTED,
 * accepted quantity above zero) at a sellable grade. A REJECT grade is never sellable
 * (docs/openapi.yaml recordQualityCheck), so it is never stocked.
 */
function qualityCheckStocks(outcome: QcOutcome, grade: ProduceGrade, acceptedQtyKg: number): boolean {
  return (outcome === 'ACCEPTED' || outcome === 'PARTIALLY_ACCEPTED') && grade !== 'REJECT' && acceptedQtyKg > 0;
}

/** uq_inventory_batches_goods_receipt_id (migration 0070) decided a race the row lock did not see. */
function isReceiptAlreadyStocked(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const pg = error as { code?: string; constraint?: string };
  return pg.code === '23505' && pg.constraint === 'uq_inventory_batches_goods_receipt_id';
}

function receiptAlreadyStocked(goodsReceiptId: string, cause?: unknown): AppError {
  return new AppError('CONFLICT', {
    detail: `Goods receipt "${goodsReceiptId}" has already been stocked as an inventory batch.`,
    ...(cause === undefined ? {} : { cause }),
  });
}

interface StockReceiptInput {
  source: StockingSource;
  /** The inspector's assigned grade (owner decision 3). */
  grade: ProduceGrade;
  qtyKg: string;
  /** Pass-through of the QC's optional values; NULL when not given (owner decision 4). */
  expiryOn: string | null;
  storageLocation: string | null;
  audit:
    | { trigger: 'quality_check'; actorId: string; actorRole: string; qualityCheckId: string }
    | { trigger: 'quality_counter_offer.accepted'; counterOfferId: string };
}

/*
 * Warehouse confinement (BR-30). docs/rbac.json grants inventory.goods_receipt.record,
 * inventory.quality_check.perform and inventory.quality.counter_offer to SUB_WH_ADMIN at `all`,
 * and `scopedWhere` adds no warehouse clause at `all`, so on its own it let a Sub admin list,
 * read and act on every warehouse's receipts. docs/rbac.json `scopeFilters` says every query of a
 * Sub admin is filtered by its assigned warehouse, so every method below first narrows a scope
 * that carries assigned warehouses to them (`confineToAssignedWarehouses`, the same narrowing
 * reports and warehouse-ops use). A scope with no assigned warehouse (Main, Super, Tohfa admin)
 * is left as it is and reaches all four warehouses.
 *
 * Another warehouse's receipt, purchase order or warehouse id is the SAME 404 as one that does
 * not exist, and it is raised before anything is written: a 403 or a different body would
 * confirm that the row exists.
 */

export function createGoodsReceiptsService(
  repo: GoodsReceiptsRepo = goodsReceiptsRepo,
  runTx: TransactionRunner = withTransaction,
  db: Executor = pool,
  allocate: BatchAllocator = allocateNewBatch,
  idempotency: IdempotencyStore = idempotencyStore,
): GoodsReceiptsService {
  /**
   * BR-106: stock an accepted receipt as one batch, on the caller's transaction `tx`: the batch
   * (qty_available 0), one RECEIPT ledger row that fills it through the trigger (never a direct
   * write, CLAUDE.md 2.3), the BR-12 channel allocation, and one audit row. Any failure rolls back
   * the decision that accepted the goods with it.
   *
   * Cost = the purchase order's agreed price as-is: the QC's priceAdjustment is NOT applied, and a
   * quality counter-offer's price is NOT used (owner decision 1).
   */
  async function stockReceipt(tx: Executor, input: StockReceiptInput): Promise<BatchView> {
    const { source } = input;
    const batchCode = await repo.nextBatchCode(tx);
    let batchId: string;
    try {
      batchId = await repo.insertInventoryBatch(tx, {
        batchCode,
        warehouseId: source.warehouseId,
        cropId: source.cropId,
        grade: input.grade,
        goodsReceiptId: source.goodsReceiptId,
        sourceFarmerId: source.farmerId,
        qtyReceivedKg: input.qtyKg,
        costPerKg: source.purchasePricePerKg,
        storageLocation: input.storageLocation,
        expiryOn: input.expiryOn,
      });
    } catch (error) {
      if (isReceiptAlreadyStocked(error)) throw receiptAlreadyStocked(source.goodsReceiptId, error);
      throw error;
    }

    const { audit } = input;
    // The admin who accepted the goods, or null when the system stocks them after a farmer's
    // acceptance (that acceptance is audited by counter-offers.service as the farmer's own action;
    // the stocking that follows is not a farmer exercising an inventory permission).
    const adminId = audit.trigger === 'quality_check' ? audit.actorId : null;
    await repo.insertReceiptMovement(tx, {
      batchId,
      warehouseId: source.warehouseId,
      qtyKg: input.qtyKg,
      goodsReceiptId: source.goodsReceiptId,
      createdBy: adminId,
    });

    await allocate(
      { batchId, warehouseId: source.warehouseId, cropId: source.cropId, qtyReceivedKg: input.qtyKg },
      tx,
    );

    const batch = await repo.findBatchView(tx, batchId);

    // Masked image: ids, codes, grade and quantities; no price and no farmer id.
    await repo.recordAudit(tx, {
      actorId: adminId,
      actorType: audit.trigger === 'quality_check' ? 'USER' : 'SYSTEM',
      ...(audit.trigger === 'quality_check' ? { actorRole: audit.actorRole } : {}),
      actionCode: 'inventory.batch.assign',
      entityType: 'batch',
      entityId: batchId,
      warehouseId: source.warehouseId,
      after: {
        batchCode,
        goodsReceiptId: source.goodsReceiptId,
        grade: input.grade,
        qtyReceivedKg: batch.qtyReceivedKg,
        expiryOn: batch.expiryOn,
        storageLocation: batch.storageLocation,
        trigger: audit.trigger,
        ...(audit.trigger === 'quality_check'
          ? { qualityCheckId: audit.qualityCheckId }
          : { counterOfferId: audit.counterOfferId }),
      },
    });

    return batch;
  }

  return {
    async createGoodsReceipt(
      actor: Actor,
      scope: ResolvedScope,
      input: CreateGoodsReceiptBody,
      idempotencyKey?: string,
    ): Promise<GoodsReceiptResponse> {
      // BR-118: docs/openapi.yaml marks the Idempotency-Key required here; without one a retry
      // cannot be told from a second delivery.
      const key = requireIdempotencyKey(idempotencyKey);

      // One transaction for the claim, the receipt and its audit row (BR-35): a refused or failed
      // request leaves no claim and no row, and a replay returns before anything is written.
      return runTx(async (tx) => {
        const idem = await beginIdempotent<GoodsReceiptResponse>(idempotency, tx, {
          actorUserId: actor.userId,
          key,
          operation: OPERATION.createReceipt,
          request: { body: input },
        });
        if (idem.replay) return idem.response;

        // 1. Warehouse scope check (BR-30): another warehouse is the same 404 as an unknown one.
        const confined = confineToAssignedWarehouses(scope);
        if (!warehouseVisible(confined, input.warehouseId)) {
          throw warehouseNotFound(input.warehouseId);
        }

        // 2. Validate purchase order. One destined for another warehouse is not found (BR-30),
        // so the mismatch check below can never name a warehouse the caller cannot reach.
        const po = await repo.findPurchaseOrderForReceipt(tx, input.purchaseOrderId, confined);
        if (po === null) {
          throw new AppError('NOT_FOUND', {
            detail: `Purchase order "${input.purchaseOrderId}" was not found.`,
          });
        }

        if (po.warehouseId !== input.warehouseId) {
          throw new AppError('VALIDATION_FAILED', {
            detail: `Purchase order destination warehouse (${po.warehouseId}) does not match intake warehouse (${input.warehouseId}).`,
          });
        }

        const grossQty = Number(input.grossQtyKg);
        if (isNaN(grossQty) || grossQty <= 0) {
          throw new AppError('VALIDATION_FAILED', {
            detail: 'Gross quantity must be a positive number.',
          });
        }

        // 3. Insert goods receipt note
        const grnRow = await repo.insertGoodsReceipt(tx, {
          ...input,
          farmerId: po.farmerId,
          receivedBy: actor.userId,
        });

        // 4. Audit log (BR-35), through the shared helper on this transaction. It used to be a raw
        // INSERT on the pool, outside the receipt's transaction, whose failure was swallowed.
        await repo.recordAudit(tx, {
          actorId: actor.userId,
          actorRole: scope.roleCode,
          actionCode: 'inventory.goods_receipt.record',
          entityType: 'goods_receipt',
          entityId: grnRow.id,
          warehouseId: input.warehouseId,
          after: grnRow,
        });

        const response: GoodsReceiptResponse = {
          id: grnRow.id,
          grnNumber: grnRow.grn_number,
          purchaseOrderId: grnRow.purchase_order_id,
          warehouseId: grnRow.warehouse_id,
          farmerId: grnRow.farmer_id,
          grossQtyKg: Number(grnRow.gross_qty_kg).toFixed(3),
          acceptedQtyKg: Number(grnRow.accepted_qty_kg).toFixed(3),
          rejectedQtyKg: Number(grnRow.rejected_qty_kg).toFixed(3),
          rejectionReason: grnRow.rejection_reason,
          vehicleNumber: grnRow.vehicle_number,
          photos: grnRow.photo_keys ?? [],
          status: grnRow.status,
          receivedBy: grnRow.received_by,
          receivedAt: grnRow.received_at instanceof Date ? grnRow.received_at.toISOString() : String(grnRow.received_at),
          poNumber: po.poNumber,
          cropName: po.cropName,
          grade: po.grade,
          // A new receipt awaits its quality check: nothing is stocked yet (BR-106).
          batchId: null,
          batchCode: null,
        };
        await idem.complete(response);
        return response;
      });
    },

    async recordQualityCheck(
      actor: Actor,
      scope: ResolvedScope,
      goodsReceiptId: string,
      input: QualityCheckCreateBody,
      idempotencyKey?: string,
    ): Promise<QualityCheckResult> {
      const key = requireIdempotencyKey(idempotencyKey);

      // BR-118: the key is claimed FIRST, inside the one transaction that records the check. A
      // replay must return the original result before the AWAITING_QC check below (the first call
      // has moved the receipt on, so it would be a spurious 409), and must stock nothing again
      // (BR-106: one receipt, one batch, one RECEIPT ledger row). The checks read on `tx`.
      return runTx(async (tx) => {
        const idem = await beginIdempotent<QualityCheckResult>(idempotency, tx, {
          actorUserId: actor.userId,
          key,
          operation: OPERATION.qualityCheck,
          request: { goodsReceiptId, body: input },
        });
        if (idem.replay) return idem.response;

        // 1. Fetch GRN with warehouse scoping (BR-30b: cross-warehouse is 404)
        const grn = await repo.findGoodsReceiptById(tx, goodsReceiptId, confineToAssignedWarehouses(scope));
        if (grn === null) {
          throw new AppError('NOT_FOUND', {
            detail: `Goods receipt "${goodsReceiptId}" was not found or is outside your warehouse scope (BR-30b).`,
          });
        }

        if (grn.status !== 'AWAITING_QC') {
          throw new AppError('CONFLICT', {
            detail: `Goods receipt "${goodsReceiptId}" is already in status "${grn.status}" and cannot undergo quality check.`,
          });
        }

        // 2. Validate all 5 parameters of the 5-point quality check (BR-30, mandatory)
        const parameterSet = new Set(input.items.map((it) => it.parameter));
        for (const requiredParam of qcParameters) {
          if (!parameterSet.has(requiredParam)) {
            throw new AppError('VALIDATION_FAILED', {
              detail: `5-point quality check is missing parameter: "${requiredParam}". All 5 parameters (APPEARANCE, SIZE_UNIFORMITY, MOISTURE, DAMAGE_PEST, FRESHNESS) are mandatory.`,
            });
          }
        }

        if (input.items.length !== 5) {
          throw new AppError('VALIDATION_FAILED', {
            detail: '5-point quality check must have exactly 5 items.',
          });
        }

        // 3. Validate quantity balance (accepted + rejected <= gross)
        const acceptedQty = Number(input.acceptedQtyKg);
        const rejectedQty = Number(input.rejectedQtyKg ?? '0.000');
        const grossQty = Number(grn.grossQtyKg);

        if (acceptedQty < 0 || rejectedQty < 0) {
          throw new AppError('VALIDATION_FAILED', {
            detail: 'Accepted and rejected quantities must be non-negative.',
          });
        }

        if (acceptedQty + rejectedQty > grossQty + 0.0001) {
          throw new AppError('VALIDATION_FAILED', {
            detail: `acceptedQtyKg (${acceptedQty}) + rejectedQtyKg (${rejectedQty}) cannot exceed grossQtyKg (${grossQty}).`,
          });
        }

        if (rejectedQty > 0 && !input.rejectionReason && !input.defectNotes) {
          throw new AppError('VALIDATION_FAILED', {
            detail: 'A non-zero rejected quantity requires a rejection reason or defect notes.',
          });
        }

        // 4. One transaction: the claim, the quality check & items, the GRN status, the batch the
        // accepted goods are stocked as (BR-106) and the audit rows commit or roll back together.
        const acceptedQtyKg = Number(acceptedQty).toFixed(3);
        const qc = await repo.insertQualityCheckWithItems(tx, {
          ...input,
          goodsReceiptId,
          warehouseId: grn.warehouseId,
          listedGrade: (grn as { grade?: ProduceGrade }).grade ?? input.assignedGrade,
          checkedBy: actor.userId,
        });

        await repo.updateGoodsReceiptStatus(
          tx,
          goodsReceiptId,
          input.outcome,
          acceptedQtyKg,
          Number(rejectedQty).toFixed(3),
          input.rejectionReason ?? input.defectNotes,
        );

        // Audit log (BR-35), through the shared helper on this transaction. It used to be a raw
        // INSERT whose failure was swallowed; on PostgreSQL a failed statement aborts the
        // transaction, so the swallow would have let the batch below fail with a misleading error
        // (or a COMMIT silently become a ROLLBACK).
        await repo.recordAudit(tx, {
          actorId: actor.userId,
          actorRole: scope.roleCode,
          actionCode: 'inventory.quality_check.perform',
          entityType: 'quality_check',
          entityId: qc.id,
          warehouseId: grn.warehouseId,
          after: qc,
        });

        // BR-106: accepted goods become stock now, at the inspector's grade, for the accepted
        // quantity only (never the rejected part). A quality counter-offer sent on this receipt
        // later finds it stocked and stocks nothing again (stockAcceptedQualityCounterOffer).
        let batch: BatchView | null = null;
        if (qualityCheckStocks(input.outcome, input.assignedGrade, acceptedQty)) {
          const source = await repo.findStockingSource(tx, goodsReceiptId);
          if (source === null) {
            throw new AppError('NOT_FOUND', { detail: `Goods receipt "${goodsReceiptId}" was not found.` });
          }
          if (source.existingBatchId !== null) throw receiptAlreadyStocked(goodsReceiptId);
          batch = await stockReceipt(tx, {
            source,
            grade: input.assignedGrade,
            qtyKg: acceptedQtyKg,
            expiryOn: input.expiryOn ?? null,
            storageLocation: input.storageLocation ?? null,
            audit: { trigger: 'quality_check', actorId: actor.userId, actorRole: scope.roleCode, qualityCheckId: qc.id },
          });
        }

        const result: QualityCheckResult = { qualityCheck: qc, batch };
        await idem.complete(result);
        return result;
      });
    },

    async stockAcceptedQualityCounterOffer(tx: Executor, offerId: string): Promise<BatchView | null> {
      const offer = await repo.findQualityOfferStocking(tx, offerId);
      // A listing counter-offer (no goods receipt) has no stock to create.
      if (offer === null) return null;

      const source = await repo.findStockingSource(tx, offer.goodsReceiptId);
      if (source === null) return null;
      // Already stocked by its quality check (the check accepted goods before the offer was sent):
      // one receipt is one batch, so accepting the offer adds nothing (BR-106n).
      if (source.existingBatchId !== null) return null;
      // Counter-offered before any quality check: there is no inspector grade to stock it at
      // (owner decision 3 forbids falling back to the listed grade). UNCONFIRMED gap, BR-106.
      if (offer.qualityCheck === null) return null;
      if (offer.qualityCheck.assignedGrade === 'REJECT') return null;
      if (!(Number(offer.quantityKg) > 0)) return null;

      return stockReceipt(tx, {
        source,
        grade: offer.qualityCheck.assignedGrade,
        qtyKg: offer.quantityKg,
        expiryOn: offer.qualityCheck.expiryOn,
        storageLocation: offer.qualityCheck.storageLocation,
        audit: { trigger: 'quality_counter_offer.accepted', counterOfferId: offerId },
      });
    },

    async createQualityCounterOffer(
      actor: Actor,
      scope: ResolvedScope,
      goodsReceiptId: string,
      input: QualityCounterOfferBody,
      idempotencyKey?: string,
    ): Promise<QualityCounterOfferResponse> {
      const key = requireIdempotencyKey(idempotencyKey);

      /*
       * 2. The offer is a round of the negotiation on the LISTING behind the receipt's purchase
       * order, so the farmer answers it with the existing listing accept / reject / counter
       * endpoints and the BR-10b expiry sweep lapses it. This is an UNCONFIRMED default
       * (docs/rules.md BR-10): the rules list the quality counter-offer as a second surface that
       * is not specified yet. What follows from it:
       *   - the round is the listing's next one under the same ceiling (BR-11), so a lot whose
       *     listing used all its rounds before approval cannot be counter-offered (409);
       *   - one open offer per listing: a second offer while one is PENDING is 409;
       *   - only an ACCEPTED listing (the state a purchase order is raised from) is reopened, to
       *     COUNTER_OFFERED; a reject or a lapse returns it to ACCEPTED (counter-offers.service).
       */
      const outcome = await runTx(async (tx) => {
        // BR-118: claim first. A replay returns the stored offer before the "one open offer per
        // listing" check (the first call's offer IS that open offer), opens no second round and
        // notifies nobody again (the publish below runs only for a fresh offer).
        const idem = await beginIdempotent<QualityCounterOfferResponse>(idempotency, tx, {
          actorUserId: actor.userId,
          key,
          operation: OPERATION.qualityCounterOffer,
          request: { goodsReceiptId, body: input },
        });
        if (idem.replay) return { replayed: true as const, offer: idem.response };

        // 1. Fetch GRN with warehouse scoping (BR-30b: cross-warehouse is 404)
        const grn = await repo.findGoodsReceiptById(tx, goodsReceiptId, confineToAssignedWarehouses(scope));
        if (grn === null) {
          throw new AppError('NOT_FOUND', {
            detail: `Goods receipt "${goodsReceiptId}" was not found or is outside your warehouse scope (BR-30b).`,
          });
        }

        const target = await repo.findQualityNegotiationTarget(tx, goodsReceiptId);
        if (target === null) {
          throw new AppError('NOT_FOUND', {
            detail: `Goods receipt "${goodsReceiptId}" has no live listing to negotiate on.`,
          });
        }

        const state = await repo.findNegotiationState(tx, target.listingId);
        if (state.pendingOfferId !== null) {
          throw new AppError('CONFLICT', {
            detail: 'A counter-offer on this lot is still waiting for the farmer; wait for the response or for it to expire.',
            meta: { pendingOfferId: state.pendingOfferId },
          });
        }
        if (target.listingStatus !== 'ACCEPTED') {
          throw new AppError('INVALID_STATE_TRANSITION', {
            detail: `A quality counter-offer needs the lot's listing to be ACCEPTED (current status: ${target.listingStatus}).`,
          });
        }

        // BR-10 / BR-11: the window and the round budget come from system_config, read by the
        // same helpers as the listing counter-offers, with the same refusal when they are unset.
        const config = await repo.getCounterOfferConfig(tx);
        if (!Number.isFinite(config.windowHours) || config.windowHours <= 0) {
          throw new AppError('INTERNAL', {
            detail: 'system_config.counter_offer_window_hours is missing or invalid.',
          });
        }
        if (!Number.isFinite(config.roundLimit) || config.roundLimit < 1) {
          throw new AppError('INTERNAL', {
            detail: 'system_config.max_counter_rounds is missing or invalid.',
          });
        }
        // Round 1 is the admin's opening counter, so the ceiling is max_counter_rounds + 1.
        const roundCeiling = config.roundLimit + 1;
        const round = state.maxRound + 1;
        if (round > roundCeiling) {
          throw new AppError('COUNTER_LIMIT_REACHED', {
            detail: "This lot's listing has no counter-offer rounds left.",
            meta: { maxRound: state.maxRound, roundCeiling },
          });
        }

        // Server clock only (BR-10): no client-supplied timestamp exists on this path.
        const expiresAt = new Date(Date.now() + config.windowHours * 60 * 60 * 1000);
        let offer: QualityCounterOfferResponse;
        try {
          offer = await repo.insertQualityCounterOffer(tx, {
            listingId: target.listingId,
            goodsReceiptId,
            round,
            pricePerKg: input.pricePerKg,
            quantityKg: input.quantityKg,
            message: input.message,
            offeredByUserId: actor.userId,
            expiresAt,
          });
        } catch (error) {
          // UNIQUE(listing_id, round) decided a race the row lock did not see (BR-11b).
          if (typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505') {
            throw new AppError('CONFLICT', {
              detail: 'This round was submitted concurrently; exactly one counter-offer was recorded.',
              cause: error,
            });
          }
          throw error;
        }

        const listingVersion = await repo.markListingCounterOffered(tx, target.listingId, target.listingVersion);
        if (listingVersion === null) {
          throw new AppError('CONFLICT', {
            detail: 'The listing was modified by another request. Please refresh and try again.',
          });
        }
        await repo.markGoodsReceiptCounterOffered(tx, goodsReceiptId);

        // Masked image: ids, statuses, the round and the expiry; never the message or the price.
        await repo.recordAudit(tx, {
          actorId: actor.userId,
          actorRole: scope.roleCode,
          actionCode: 'inventory.quality.counter_offer',
          entityType: 'counter_offer',
          entityId: offer.id,
          warehouseId: grn.warehouseId,
          before: {
            goodsReceiptStatus: grn.status,
            listingStatus: target.listingStatus,
            listingVersion: target.listingVersion,
          },
          after: {
            goodsReceiptId,
            listingId: target.listingId,
            round,
            status: offer.status,
            goodsReceiptStatus: 'COUNTER_OFFERED',
            listingStatus: 'COUNTER_OFFERED',
            listingVersion,
            expiresAt: offer.expiresAt,
          },
          changedFields: ['status'],
        });

        await idem.complete(offer);
        return { replayed: false as const, offer, target };
      });
      if (outcome.replayed) return outcome.offer;

      // After commit, like the listing counter-offer: a failing subscriber never rolls the offer back.
      await eventBus.publish('counter_offer.received', {
        userId: outcome.target.ownerUserId,
        listingId: outcome.target.listingId,
        offerPrice: outcome.offer.pricePerKg,
        originalPrice: outcome.target.agreedPricePerKg,
      });
      return outcome.offer;
    },

    async getById(
      _actor: Actor,
      scope: ResolvedScope,
      id: string,
    ): Promise<GoodsReceiptResponse> {
      const grn = await repo.findGoodsReceiptById(db, id, confineToAssignedWarehouses(scope));
      if (grn === null) {
        throw new AppError('NOT_FOUND', {
          detail: `Goods receipt "${id}" was not found or is outside your warehouse scope (BR-30b).`,
        });
      }
      return grn;
    },

    async list(
      _actor: Actor,
      scope: ResolvedScope,
      query: ListGoodsReceiptsQuery,
    ): Promise<ListGoodsReceiptsResponse> {
      // A cross-scope LIST is an empty result set, never a 403 and never a leak (root CLAUDE.md
      // section 2.1; golden-thread BR-30 "unauthorized warehouse sees 0 items"). Only reads and
      // writes BY ID are 404. So a warehouse filter the caller cannot reach answers an empty
      // page without touching the database.
      const confined = confineToAssignedWarehouses(scope);
      if (query.warehouseId !== undefined && !warehouseVisible(confined, query.warehouseId)) {
        return { items: [], page: { nextCursor: null, hasMore: false } };
      }
      const res = await repo.listGoodsReceipts(db, confined, query);
      return {
        items: res.items,
        page: {
          nextCursor: res.nextCursor,
          hasMore: res.hasMore,
        },
      };
    },
  };
}

export const goodsReceiptsService = createGoodsReceiptsService();
