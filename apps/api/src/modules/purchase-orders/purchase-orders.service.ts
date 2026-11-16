import { fromPaise, parseMoney, toPaise } from '@tohfa/shared-types';
import { writeAuditLog } from '../../audit/auditLog.js';
import type { Actor } from '../../auth/requireAuth.js';
import { pool, type Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { amountForGramsPaise, gramsToKg, kgToGrams } from '../sales/sales.math.js';
import {
  purchaseOrdersRepo,
  type PurchaseOrdersRepo,
  type PurchaseOrderRow,
} from './purchase-orders.repo.js';
import type {
  ListPurchaseOrdersQuery,
  ListPurchaseOrdersResponse,
  ProduceGrade,
  PurchaseOrderDetailResponse,
  PurchaseOrderResponse,
} from './purchase-orders.schema.js';

export interface ListingForApproval {
  id: string;
  farmerId: string;
  cropId: string;
  grade: ProduceGrade;
  quantityKg: string;
  askingPricePerKg: string;
  finalPricePerKg?: string | null;
  finalQuantityKg?: string | null;
}

export interface ApproveListingInput {
  warehouseId: string;
  expectedDeliveryDate?: string | null;
  note?: string;
}

export interface PurchaseOrdersService {
  createForListing(
    tx: Executor,
    actor: Actor,
    scope: ResolvedScope,
    listing: ListingForApproval,
    input: ApproveListingInput,
  ): Promise<PurchaseOrderResponse>;

  getById(
    actor: Actor,
    scope: ResolvedScope,
    id: string,
  ): Promise<PurchaseOrderDetailResponse>;

  list(
    actor: Actor,
    scope: ResolvedScope,
    query: ListPurchaseOrdersQuery,
  ): Promise<ListPurchaseOrdersResponse>;
}

export function formatPoRowToResponse(row: PurchaseOrderRow): PurchaseOrderResponse {
  return {
    id: row.id,
    poNumber: row.po_number,
    farmerId: row.farmer_id,
    listingId: row.listing_id,
    warehouseId: row.warehouse_id,
    cropId: row.crop_id,
    grade: row.grade,
    quantityKg: Number(row.quantity_kg).toFixed(3),
    pricePerKg: Number(row.price_per_kg).toFixed(2),
    totalAmount: Number(row.total_amount).toFixed(2),
    status: row.status,
    expectedDeliveryDate: row.expected_delivery_date,
    issuedAt: row.issued_at instanceof Date ? row.issued_at.toISOString() : String(row.issued_at),
    // BR-119: joined by the insert and by the existing-order read; null when the crop is missing.
    cropName: row.crop_name ?? null,
  };
}

export function calculateTotalAmountPaise(pricePerKg: string, quantityKg: string): string {
  // Compute in integer paise to eliminate floating point inaccuracy (BR-30, Money)
  const pricePaise = toPaise(parseMoney(pricePerKg));
  const qtyGrams = kgToGrams(quantityKg);
  const totalPaise = amountForGramsPaise(pricePaise, qtyGrams);
  return fromPaise(totalPaise);
}

export function createPurchaseOrdersService(
  repo: PurchaseOrdersRepo = purchaseOrdersRepo,
): PurchaseOrdersService {
  return {
    async createForListing(
      tx: Executor,
      actor: Actor,
      scope: ResolvedScope,
      listing: ListingForApproval,
      input: ApproveListingInput,
    ): Promise<PurchaseOrderResponse> {
      // 1. Idempotency check: if PO already exists for this listing, return it
      const existing = await repo.findPurchaseOrderByListingId(tx, listing.id);
      if (existing !== null) {
        return formatPoRowToResponse(existing);
      }

      // 2. Adopt negotiated terms if present, otherwise fall back to original asking terms
      const effectivePricePerKg = listing.finalPricePerKg ?? listing.askingPricePerKg;
      const effectiveQuantityKg = listing.finalQuantityKg ?? listing.quantityKg;

      // 3. Compute total in integer paise via Money
      const totalAmount = calculateTotalAmountPaise(effectivePricePerKg, effectiveQuantityKg);

      // 4. Insert PO record
      const poRow = await repo.insertPurchaseOrder(tx, {
        farmerId: listing.farmerId,
        listingId: listing.id,
        warehouseId: input.warehouseId,
        cropId: listing.cropId,
        grade: listing.grade,
        pricePerKg: parseMoney(effectivePricePerKg),
        quantityKg: gramsToKg(kgToGrams(effectiveQuantityKg)),
        totalAmount,
        issuedBy: actor.userId,
        expectedDeliveryDate: input.expectedDeliveryDate,
      });

      // 5. Append-only audit log inside same transaction (BR-35)
      await writeAuditLog(tx, {
        actorId: actor.userId,
        actorRole: scope.roleCode,
        actionCode: 'purchase.order.create',
        entityType: 'purchase_order',
        entityId: poRow.id,
        warehouseId: input.warehouseId,
        outcome: 'ALLOWED',
        after: poRow,
      });

      return formatPoRowToResponse(poRow);
    },

    async getById(
      _actor: Actor,
      scope: ResolvedScope,
      id: string,
    ): Promise<PurchaseOrderDetailResponse> {
      const po = await repo.findPurchaseOrderById(pool, id, scope);
      if (po === null) {
        // BR-30b: Cross-warehouse reads return 404, never 403
        throw new AppError('NOT_FOUND', {
          detail: `Purchase order "${id}" was not found or is outside your assigned warehouse scope.`,
        });
      }
      return po;
    },

    async list(
      _actor: Actor,
      scope: ResolvedScope,
      query: ListPurchaseOrdersQuery,
    ): Promise<ListPurchaseOrdersResponse> {
      const res = await repo.listPurchaseOrders(pool, scope, query);
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

export const purchaseOrdersService = createPurchaseOrdersService();
