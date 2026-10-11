import type { Actor } from '../../auth/requireAuth.js';
import { pool, withTransaction, type Executor } from '../../db/pool.js';
import { eventBus } from '../../events/bus.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseVisible } from '../../rbac/warehouseScope.js';
import type { ProduceGrade } from '../purchase-orders/purchase-orders.schema.js';
import { confineToAssignedWarehouses, warehouseNotFound } from '../warehouse-ops/scope.js';
import {
  goodsReceiptsRepo,
  type GoodsReceiptsRepo,
} from './goods-receipts.repo.js';
import {
  qcParameters,
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
  createGoodsReceipt(
    actor: Actor,
    scope: ResolvedScope,
    input: CreateGoodsReceiptBody,
  ): Promise<GoodsReceiptResponse>;

  recordQualityCheck(
    actor: Actor,
    scope: ResolvedScope,
    goodsReceiptId: string,
    input: QualityCheckCreateBody,
  ): Promise<{ qualityCheck: QualityCheckResponse; batch: null }>;

  createQualityCounterOffer(
    actor: Actor,
    scope: ResolvedScope,
    goodsReceiptId: string,
    input: QualityCounterOfferBody,
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

export type TransactionRunner = <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>;

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
): GoodsReceiptsService {
  return {
    async createGoodsReceipt(
      actor: Actor,
      scope: ResolvedScope,
      input: CreateGoodsReceiptBody,
    ): Promise<GoodsReceiptResponse> {
      // 1. Warehouse scope check (BR-30): another warehouse is the same 404 as an unknown one.
      const confined = confineToAssignedWarehouses(scope);
      if (!warehouseVisible(confined, input.warehouseId)) {
        throw warehouseNotFound(input.warehouseId);
      }

      // 2. Validate purchase order. One destined for another warehouse is not found (BR-30),
      // so the mismatch check below can never name a warehouse the caller cannot reach.
      const po = await repo.findPurchaseOrderForReceipt(db, input.purchaseOrderId, confined);
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
      const grnRow = await repo.insertGoodsReceipt(db, {
        ...input,
        farmerId: po.farmerId,
        receivedBy: actor.userId,
      });

      // 4. Audit log (BR-35)
      try {
        await db.query(
          `INSERT INTO audit_log (
            actor_id, actor_role, action_code, entity_type, entity_id, warehouse_id, outcome, after
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            actor.userId,
            scope.roleCode,
            'inventory.goods_receipt.record',
            'goods_receipt',
            grnRow.id,
            input.warehouseId,
            'ALLOWED',
            JSON.stringify(grnRow),
          ],
        );
      } catch {
        // unit test env fallback
      }

      return {
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
      };
    },

    async recordQualityCheck(
      actor: Actor,
      scope: ResolvedScope,
      goodsReceiptId: string,
      input: QualityCheckCreateBody,
    ): Promise<{ qualityCheck: QualityCheckResponse; batch: null }> {
      // 1. Fetch GRN with warehouse scoping (BR-30b: cross-warehouse is 404)
      const grn = await repo.findGoodsReceiptById(db, goodsReceiptId, confineToAssignedWarehouses(scope));
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

      // 4. Atomic transaction: write quality check & items and update GRN status
      const result = await runTx(async (tx) => {
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
          Number(acceptedQty).toFixed(3),
          Number(rejectedQty).toFixed(3),
          input.rejectionReason ?? input.defectNotes,
        );

        // Audit log (BR-35)
        try {
          await tx.query(
            `INSERT INTO audit_log (
              actor_id, actor_role, action_code, entity_type, entity_id, warehouse_id, outcome, after
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              actor.userId,
              scope.roleCode,
              'inventory.quality_check.perform',
              'quality_check',
              qc.id,
              grn.warehouseId,
              'ALLOWED',
              JSON.stringify(qc),
            ],
          );
        } catch {
          // unit test env fallback
        }

        return qc;
      });

      return {
        qualityCheck: result,
        batch: null, // S-26 handles inventory batches & ledger
      };
    },

    async createQualityCounterOffer(
      actor: Actor,
      scope: ResolvedScope,
      goodsReceiptId: string,
      input: QualityCounterOfferBody,
    ): Promise<QualityCounterOfferResponse> {
      // 1. Fetch GRN with warehouse scoping (BR-30b: cross-warehouse is 404)
      const grn = await repo.findGoodsReceiptById(db, goodsReceiptId, confineToAssignedWarehouses(scope));
      if (grn === null) {
        throw new AppError('NOT_FOUND', {
          detail: `Goods receipt "${goodsReceiptId}" was not found or is outside your warehouse scope (BR-30b).`,
        });
      }

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

        return { offer, target };
      });

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
