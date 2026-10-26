import type { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { AppError } from '../../http/problem.js';
import type { Actor } from '../../auth/requireAuth.js';
import type { Executor } from '../../db/pool.js';
import { createInMemoryIdempotencyStore } from '../../test/idempotencyStore.js';
import { loadRbac } from '../../rbac/loadRbac.js';
import { resolveScope, type ResolvedScope } from '../../rbac/requirePermission.js';
import {
  ensureStandardUsers,
  insertCrop,
  insertFarmerWithPlot,
  insertUser,
  requireDatabaseTables,
} from '../../test/dbFixtures.js';
import {
  aScope,
  aSubWarehouseAdmin,
  anActor,
  databaseReady,
  describeIfDatabase,
  IDS,
  newId,
} from '../../test/factories.js';
import {
  createGoodsReceiptsService,
} from './goods-receipts.service.js';
import {
  goodsReceiptsRepo,
  type GoodsReceiptsRepo,
  type PurchaseOrderForReceipt,
} from './goods-receipts.repo.js';
import {
  qcParameters,
  qualityCheckCreateBody,
  type CreateGoodsReceiptBody,
  type GoodsReceiptResponse,
  type QualityCheckCreateBody,
  type QualityCheckItemInput,
} from './goods-receipts.schema.js';

describe('GoodsReceiptsService (Unit & Business Rules S-25)', () => {
  const WH_OOTY = IDS.warehouseOoty;
  const WH_COONOOR = IDS.warehouseCoonoor;

  const mockActorAdmin: Actor = anActor({
    userId: IDS.userSuperAdmin,
    roles: [{ code: RoleCode.SUPER_ADMIN }],
  });

  const mockScopeAdmin: ResolvedScope = aScope({
    level: ScopeLevel.ALL,
    permission: 'inventory.goods_receipt.record',
    roleCode: RoleCode.SUPER_ADMIN,
  });

  const mockActorSubWhOoty: Actor = aSubWarehouseAdmin(WH_OOTY);

  const mockScopeSubWhOoty: ResolvedScope = aScope({
    level: ScopeLevel.OWN,
    permission: 'inventory.goods_receipt.record',
    roleCode: RoleCode.SUB_WH_ADMIN,
    warehouseIds: [WH_OOTY],
    userId: mockActorSubWhOoty.userId,
  });

  const samplePO: PurchaseOrderForReceipt = {
    id: 'po-11111111-1111-1111-1111-111111111111',
    poNumber: 'PO-2026-000001',
    farmerId: IDS.farmer,
    warehouseId: WH_OOTY,
    cropId: 'crop-11111111-1111-1111-1111-111111111111',
    cropName: 'Carrot',
    grade: 'GRADE_1',
    quantityKg: '250.000',
    pricePerKg: '52.00',
    status: 'ISSUED',
  };

  const sampleGRN: GoodsReceiptResponse = {
    id: 'grn-11111111-1111-1111-1111-111111111111',
    grnNumber: 'GRN-2026-000001',
    purchaseOrderId: samplePO.id,
    warehouseId: WH_OOTY,
    farmerId: IDS.farmer,
    grossQtyKg: '250.000',
    acceptedQtyKg: '0.000',
    rejectedQtyKg: '0.000',
    rejectionReason: null,
    vehicleNumber: 'TN43AB1234',
    photos: [],
    status: 'AWAITING_QC',
    receivedBy: mockActorSubWhOoty.userId,
    receivedAt: new Date('2026-08-28T10:00:00Z').toISOString(),
    poNumber: samplePO.poNumber,
    cropName: samplePO.cropName,
    grade: samplePO.grade,
  };

  const valid5PointItems: QualityCheckItemInput[] = [
    { parameter: 'APPEARANCE', score: 8, passed: true, photoKeys: [] },
    { parameter: 'SIZE_UNIFORMITY', score: 9, passed: true, photoKeys: [] },
    { parameter: 'MOISTURE', score: 8, passed: true, measuredValue: 12.5, photoKeys: [] },
    { parameter: 'DAMAGE_PEST', score: 9, passed: true, photoKeys: [] },
    { parameter: 'FRESHNESS', score: 9, passed: true, photoKeys: [] },
  ];

  const mockQualityOffer: GoodsReceiptsRepo['insertQualityCounterOffer'] = async (_tx, data) => ({
    id: 'co-qc-1',
    listingId: data.listingId,
    goodsReceiptId: data.goodsReceiptId,
    round: data.round,
    offeredBy: 'ADMIN',
    offeredByUserId: data.offeredByUserId,
    pricePerKg: data.pricePerKg,
    quantityKg: data.quantityKg,
    message: data.message ?? null,
    status: 'PENDING',
    expiresAt: data.expiresAt.toISOString(),
    respondedAt: null,
  });

  const createMockRepo = (overrides?: Partial<GoodsReceiptsRepo>): GoodsReceiptsRepo => ({
    nextGrnNumber: async () => 'GRN-2026-000001',
    insertGoodsReceipt: async (_tx, data) => ({
      id: sampleGRN.id,
      grn_number: 'GRN-2026-000001',
      purchase_order_id: data.purchaseOrderId,
      warehouse_id: data.warehouseId,
      farmer_id: data.farmerId,
      status: 'AWAITING_QC',
      gross_qty_kg: data.grossQtyKg,
      accepted_qty_kg: '0.000',
      rejected_qty_kg: '0.000',
      rejection_reason: null,
      vehicle_number: data.vehicleNumber ?? null,
      photo_keys: data.photos,
      received_by: data.receivedBy,
      received_at: new Date(),
      created_at: new Date(),
      updated_at: null,
    }),
    findGoodsReceiptById: async (_tx, id, scope) => {
      if (id !== sampleGRN.id) return null;
      if (scope.warehouseIds.length > 0 && !scope.warehouseIds.includes(sampleGRN.warehouseId)) {
        return null;
      }
      return sampleGRN;
    },
    findPurchaseOrderForReceipt: async (_tx, poId) => {
      if (poId === samplePO.id) return samplePO;
      return null;
    },
    insertQualityCheckWithItems: async (_tx, data) => ({
      id: 'qc-1',
      goodsReceiptId: data.goodsReceiptId,
      warehouseId: data.warehouseId,
      assignedGrade: data.assignedGrade,
      listedGrade: data.listedGrade,
      outcome: data.outcome,
      acceptedQtyKg: data.acceptedQtyKg,
      rejectedQtyKg: data.rejectedQtyKg ?? '0.000',
      priceAdjustment: data.priceAdjustment ?? '0.00',
      defectNotes: data.defectNotes ?? null,
      photos: data.photos ?? [],
      checkedBy: data.checkedBy,
      checkedAt: new Date().toISOString(),
      items: data.items.map((it, idx) => ({
        id: `qci-${idx}`,
        qualityCheckId: 'qc-1',
        parameter: it.parameter,
        score: it.score ?? null,
        passed: it.passed,
        measuredValue: it.measuredValue ?? null,
        remarks: it.remarks ?? null,
        photoKeys: it.photoKeys,
      })),
    }),
    findQualityCheckByGoodsReceiptId: async () => null,
    // BR-120 crop mismatch; the real SQL runs in goods-receipts.qc-model.test.ts.
    findCropMismatchContext: async () => ({ purchaseOrderCropId: samplePO.cropId, actualCropExists: true }),
    updateGoodsReceiptStatus: async () => {},
    insertQualityCounterOffer: mockQualityOffer,
    // The quality counter-offer negotiates on the listing behind the receipt; the real SQL of
    // these methods runs in goods-receipts.counter-offer.test.ts.
    findQualityNegotiationTarget: async () => ({
      listingId: '4a1c7b52-0000-4000-8000-0000000000aa',
      listingStatus: 'ACCEPTED',
      listingVersion: 2,
      ownerUserId: IDS.userFarmer,
      agreedPricePerKg: samplePO.pricePerKg,
    }),
    findNegotiationState: async () => ({ maxRound: 0, pendingOfferId: null }),
    // The seeded system_config values (db/seed/001_reference.sql).
    getCounterOfferConfig: async () => ({ windowHours: 24, roundLimit: 3 }),
    markListingCounterOffered: async (_tx, _listingId, expectedVersion) => expectedVersion + 1,
    markGoodsReceiptCounterOffered: async () => {},
    recordAudit: async () => 'audit-1',
    // BR-106 stocking. The real SQL of these runs in goods-receipts.batch.test.ts.
    findStockingSource: async (_tx, goodsReceiptId) => ({
      goodsReceiptId,
      warehouseId: sampleGRN.warehouseId,
      farmerId: sampleGRN.farmerId,
      cropId: samplePO.cropId,
      purchasePricePerKg: samplePO.pricePerKg,
      grossQtyKg: sampleGRN.grossQtyKg,
      existingBatchId: null,
    }),
    findQualityOfferStocking: async () => null,
    nextBatchCode: async () => 'BATCH-2026-000001',
    insertInventoryBatch: async () => 'batch-1',
    insertReceiptMovement: async () => 'ledger-1',
    findBatchView: async (_tx, batchId) => ({
      id: batchId,
      batchCode: 'BATCH-2026-000001',
      warehouseId: sampleGRN.warehouseId,
      cropId: samplePO.cropId,
      grade: 'GRADE_1',
      goodsReceiptId: sampleGRN.id,
      sourceFarmerId: sampleGRN.farmerId,
      qtyReceivedKg: '250.000',
      qtyAvailableKg: '250.000',
      costPerKg: samplePO.pricePerKg,
      storageLocation: null,
      receivedOn: '2026-08-28',
      expiryOn: null,
      status: 'ACTIVE',
    }),
    listGoodsReceipts: async () => ({
      items: [sampleGRN],
      nextCursor: null,
      hasMore: false,
    }),
    // BR-121 reports are not exercised here; see goods-receipts.discrepancies.test.ts.
    insertDiscrepancy: async () => {
      throw new Error('insertDiscrepancy is not used by this suite');
    },
    listDiscrepancies: async () => ({ items: [], nextCursor: null, hasMore: false }),
    ...overrides,
  });

  const mockTx = { query: async () => ({ rows: [] }) } as unknown as Executor;
  const mockRunTx = async <T>(fn: (tx: Executor) => Promise<T>): Promise<T> => fn(mockTx);
  const mockDb = { query: async () => ({ rows: [] }) } as unknown as Executor;

  const noAllocation = async (): Promise<void> => {};
  const createTestService = (overrides?: Partial<GoodsReceiptsRepo>) =>
    createGoodsReceiptsService(createMockRepo(overrides), mockRunTx, mockDb, noAllocation, createInMemoryIdempotencyStore());

  it('BR-30a: Sub Warehouse Admin creates goods receipt for their assigned warehouse', async () => {
    const service = createTestService();
    const input: CreateGoodsReceiptBody = {
      purchaseOrderId: samplePO.id,
      warehouseId: WH_OOTY,
      grossQtyKg: '250.000',
      vehicleNumber: 'TN43AB1234',
      photos: [],
    };

    const res = await service.createGoodsReceipt(mockActorSubWhOoty, mockScopeSubWhOoty, input, randomUUID());
    expect(res).toBeDefined();
    expect(res.warehouseId).toBe(WH_OOTY);
    expect(res.status).toBe('AWAITING_QC');
  });

  // BR-30: cross-warehouse is 404, never 403 (a 403 confirms the warehouse exists). This test
  // asserted 403 before the 2026-10-11 confinement fix; the rule always said 404.
  it('BR-30b: Sub Warehouse Admin cannot create goods receipt for an unassigned warehouse (refused with 404, never 403)', async () => {
    const service = createTestService();
    const input: CreateGoodsReceiptBody = {
      purchaseOrderId: samplePO.id,
      warehouseId: WH_COONOOR, // Unassigned warehouse
      grossQtyKg: '250.000',
      photos: [],
    };

    await expect(
      service.createGoodsReceipt(mockActorSubWhOoty, mockScopeSubWhOoty, input, randomUUID()),
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as AppError;
      expect(e).toBeInstanceOf(AppError);
      expect(e.status).toBe(404);
      expect(e.code).toBe('NOT_FOUND');
      return true;
    });
  });

  it('BR-30b: Sub Warehouse Admin reading another warehouse GRN gets 404 NOT_FOUND (never 403)', async () => {
    const service = createTestService();
    const mockScopeCoonoor: ResolvedScope = aScope({
      level: ScopeLevel.OWN,
      permission: 'inventory.goods_receipt.record',
      roleCode: RoleCode.SUB_WH_ADMIN,
      warehouseIds: [WH_COONOOR],
      userId: IDS.userSubWhAdmin,
    });

    await expect(
      service.getById(mockActorSubWhOoty, mockScopeCoonoor, sampleGRN.id),
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as AppError;
      expect(e).toBeInstanceOf(AppError);
      expect(e.status).toBe(404);
      expect(e.code).toBe('NOT_FOUND');
      return true;
    });
  });

  it('5-Point QC completeness: Refuses a quality check missing any parameter (BR-30)', async () => {
    const service = createTestService();

    // 4 items only (missing FRESHNESS)
    const incompleteItems: QualityCheckItemInput[] = valid5PointItems.slice(0, 4);

    const input: QualityCheckCreateBody = {
      assignedGrade: 'GRADE_1',
      outcome: 'ACCEPTED',
      acceptedQtyKg: '250.000',
      rejectedQtyKg: '0.000',
      items: incompleteItems,
      photos: [],
      priceAdjustment: '0.00',
    };

    await expect(
      service.recordQualityCheck(mockActorAdmin, mockScopeAdmin, sampleGRN.id, input, randomUUID()),
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as AppError;
      expect(e.status).toBe(422);
      expect(e.detail).toContain('missing parameter');
      return true;
    });
  });

  it('Quantity balance check: acceptedQtyKg + rejectedQtyKg cannot exceed grossQtyKg', async () => {
    const service = createTestService();

    // 200 accepted + 60 rejected = 260 > 250 gross
    const input: QualityCheckCreateBody = {
      assignedGrade: 'GRADE_1',
      outcome: 'PARTIALLY_ACCEPTED',
      acceptedQtyKg: '200.000',
      rejectedQtyKg: '60.000',
      rejectionReason: 'Surface damage',
      items: valid5PointItems,
      photos: [],
      priceAdjustment: '0.00',
    };

    await expect(
      service.recordQualityCheck(mockActorAdmin, mockScopeAdmin, sampleGRN.id, input, randomUUID()),
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as AppError;
      expect(e.status).toBe(422);
      expect(e.detail).toContain('cannot exceed grossQtyKg');
      return true;
    });
  });

  it('Accept-full path: Quality check accepted successfully and updates GRN status', async () => {
    let capturedStatus: string | null = null;
    const service = createTestService({
      updateGoodsReceiptStatus: async (_tx, _id, status) => {
        capturedStatus = status;
      },
    });

    const input: QualityCheckCreateBody = {
      assignedGrade: 'GRADE_1',
      outcome: 'ACCEPTED',
      acceptedQtyKg: '250.000',
      rejectedQtyKg: '0.000',
      items: valid5PointItems,
      photos: [],
      priceAdjustment: '0.00',
    };

    const res = await service.recordQualityCheck(mockActorAdmin, mockScopeAdmin, sampleGRN.id, input, randomUUID());
    expect(res.qualityCheck).toBeDefined();
    expect(res.qualityCheck.outcome).toBe('ACCEPTED');
    expect(res.qualityCheck.items).toHaveLength(5);
    // BR-106: accepted goods are stocked; the batch comes back with the check.
    expect(res.batch).toMatchObject({ id: 'batch-1', batchCode: 'BATCH-2026-000001' });
    expect(capturedStatus).toBe('ACCEPTED');
  });

  it('BR-106: the batch, its RECEIPT ledger row, the allocation and the audit run on the SAME transaction executor as the quality check', async () => {
    const txSeen: Record<string, Executor> = {};
    const record =
      (name: string) =>
      (tx: Executor): void => {
        txSeen[name] = tx;
      };
    const outerTx = { query: async () => ({ rows: [] }) } as unknown as Executor;
    const audits: string[] = [];
    const repo = createMockRepo({
      insertQualityCheckWithItems: async (tx, data) => {
        record('qualityCheck')(tx);
        return createMockRepo().insertQualityCheckWithItems(tx, data);
      },
      insertInventoryBatch: async (tx, data) => {
        record('batch')(tx);
        expect(data).toMatchObject({
          grade: 'GRADE_2', // the inspector's grade, not the listed GRADE_1
          qtyReceivedKg: '200.000', // accepted only, never the rejected 50 kg
          costPerKg: '52.00', // the purchase order's price, the -4.00 adjustment NOT applied
          expiryOn: null,
          storageLocation: 'A-04-R2',
          batchCode: 'BATCH-2026-000001',
        });
        return 'batch-1';
      },
      insertReceiptMovement: async (tx, data) => {
        record('ledger')(tx);
        expect(data).toMatchObject({ batchId: 'batch-1', qtyKg: '200.000', goodsReceiptId: sampleGRN.id });
        return 'ledger-1';
      },
      recordAudit: async (tx, entry) => {
        record(`audit:${entry.actionCode}`)(tx);
        audits.push(entry.actionCode);
        return 'audit-1';
      },
    });
    const service = createGoodsReceiptsService(
      repo,
      async (fn) => fn(outerTx),
      mockDb,
      async (_input, tx) => {
        record('allocation')(tx);
      },
      createInMemoryIdempotencyStore(),
    );
    const res = await service.recordQualityCheck(mockActorAdmin, mockScopeAdmin, sampleGRN.id, {
      assignedGrade: 'GRADE_2',
      outcome: 'PARTIALLY_ACCEPTED',
      acceptedQtyKg: '200.000',
      rejectedQtyKg: '50.000',
      rejectionReason: 'Bruised',
      items: valid5PointItems,
      photos: [],
      priceAdjustment: '-4.00',
      storageLocation: 'A-04-R2',
    }, randomUUID());
    expect(res.batch).not.toBeNull();
    expect(Object.keys(txSeen).sort()).toEqual(
      ['allocation', 'audit:inventory.batch.assign', 'audit:inventory.quality_check.perform', 'batch', 'ledger', 'qualityCheck'].sort(),
    );
    for (const tx of Object.values(txSeen)) expect(tx).toBe(outerTx);
    expect(audits).toEqual(['inventory.quality_check.perform', 'inventory.batch.assign']);
  });

  it('BR-106: a failing batch insert fails the whole quality check (the transaction runner sees the error and rolls back)', async () => {
    let runnerSawError = false;
    const service = createGoodsReceiptsService(
      createMockRepo({
        insertInventoryBatch: async () => {
          throw new Error('disk full');
        },
      }),
      async (fn) => {
        try {
          return await fn(mockTx);
        } catch (error) {
          runnerSawError = true;
          throw error;
        }
      },
      mockDb,
      noAllocation,
      createInMemoryIdempotencyStore(),
    );
    await expect(
      service.recordQualityCheck(mockActorAdmin, mockScopeAdmin, sampleGRN.id, {
        assignedGrade: 'GRADE_1',
        outcome: 'ACCEPTED',
        acceptedQtyKg: '250.000',
        rejectedQtyKg: '0.000',
        items: valid5PointItems,
        photos: [],
        priceAdjustment: '0.00',
      }, randomUUID()),
    ).rejects.toThrow('disk full');
    expect(runnerSawError).toBe(true);
  });

  it('BR-106: a REJECTED quality check stocks nothing', async () => {
    let inserted = false;
    const service = createTestService({
      insertInventoryBatch: async () => {
        inserted = true;
        return 'batch-1';
      },
    });
    const res = await service.recordQualityCheck(mockActorAdmin, mockScopeAdmin, sampleGRN.id, {
      assignedGrade: 'GRADE_3',
      outcome: 'REJECTED',
      acceptedQtyKg: '0.000',
      rejectedQtyKg: '250.000',
      rejectionReason: 'Rotten',
      items: valid5PointItems,
      photos: [],
      priceAdjustment: '0.00',
    }, randomUUID());
    expect(res.batch).toBeNull();
    expect(inserted).toBe(false);
  });

  it('BR-10a: Quality counter-offer surface sets 24-hour expiration window', async () => {
    let capturedExpiry: Date | null = null;
    const service = createTestService({
      insertQualityCounterOffer: async (tx, data) => {
        capturedExpiry = data.expiresAt;
        return mockQualityOffer(tx, data);
      },
    });

    const offer = await service.createQualityCounterOffer(
      mockActorAdmin,
      mockScopeAdmin,
      sampleGRN.id,
      {
        pricePerKg: '45.00',
        quantityKg: '250.000',
        message: 'Downgraded to Grade 2 due to size variation; offering Rs 45/kg',
      },
      randomUUID(),
    );

    expect(offer).toBeDefined();
    expect(capturedExpiry).not.toBeNull();
    const hoursDifference = (capturedExpiry!.getTime() - Date.now()) / (1000 * 60 * 60);
    expect(Math.round(hoursDifference)).toBe(24);
  });
});

// RFC 3339 with millisecond precision, e.g. 2026-10-05T07:42:36.490Z. Postgres's own
// text form ("2026-10-05 07:42:36.490266+00") is not date-time and Hermes parses it as NaN.
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

/** Executor whose n-th query() returns the n-th rows array; rows are shaped like pg returns them. */
function fakeExecutor(...results: unknown[][]): Executor {
  let call = 0;
  return {
    query: async () => ({ rows: results[call++] ?? [] }),
  } as unknown as Executor;
}

describe('Goods receipt / QC / counter-offer timestamps are ISO-8601 on the wire (docs/openapi.yaml: format date-time)', () => {
  const allScope = aScope({
    level: ScopeLevel.ALL,
    permission: 'inventory.grn.view',
    roleCode: RoleCode.SUPER_ADMIN,
  });
  const grnFields = {
    id: '4a1c7b52-0000-4000-8000-000000000001',
    grnNumber: 'GRN-2026-000001',
    purchaseOrderId: '4a1c7b52-0000-4000-8000-000000000002',
    warehouseId: IDS.warehouseOoty,
    farmerId: IDS.farmer,
    grossQtyKg: '100.000',
    acceptedQtyKg: '0.000',
    rejectedQtyKg: '0.000',
    rejectionReason: null,
    vehicleNumber: null,
    photos: [],
    status: 'AWAITING_QC',
    receivedBy: IDS.userSuperAdmin,
    poNumber: 'PO-2026-000001',
    cropName: 'Carrot',
    grade: 'GRADE_1',
  };
  const qcFields = {
    id: '4a1c7b52-0000-4000-8000-000000000010',
    goodsReceiptId: grnFields.id,
    warehouseId: IDS.warehouseOoty,
    assignedGrade: 'GRADE_1',
    listedGrade: 'GRADE_1',
    outcome: 'ACCEPTED',
    acceptedQtyKg: '100.000',
    rejectedQtyKg: '0.000',
    priceAdjustment: '0.00',
    defectNotes: null,
    photos: [],
    checkedBy: IDS.userSuperAdmin,
  };

  it('GRN detail receivedAt is ISO-8601 UTC', async () => {
    const tx = fakeExecutor([{ ...grnFields, receivedAt: new Date('2026-10-05T07:42:36.490Z') }]);
    const grn = await goodsReceiptsRepo.findGoodsReceiptById(tx, grnFields.id, allScope);
    expect(grn?.receivedAt).toMatch(ISO_DATE_TIME);
    expect(grn?.receivedAt).toBe('2026-10-05T07:42:36.490Z');
  });

  it('GRN list items carry ISO receivedAt and nextCursor keeps the full microsecond instant', async () => {
    const rows = [
      { ...grnFields, id: 'a', receivedAt: new Date('2026-10-05T07:42:36.490Z'), cursorReceivedAt: '2026-10-05T07:42:36.490266Z' },
      { ...grnFields, id: 'b', receivedAt: new Date('2026-10-04T07:42:36.100Z'), cursorReceivedAt: '2026-10-04T07:42:36.100999Z' },
    ];
    const page = await goodsReceiptsRepo.listGoodsReceipts(fakeExecutor(rows), allScope, { limit: 1 } as never);
    expect(page.items[0]?.receivedAt).toMatch(ISO_DATE_TIME);
    expect(page.nextCursor).toBe('2026-10-05T07:42:36.490266Z');
    expect(page.hasMore).toBe(true);
    expect(Object.keys(page.items[0]!)).not.toContain('cursorReceivedAt');
  });

  it('quality check checkedAt is ISO-8601 UTC when inserted and when read back', async () => {
    const inserted = await goodsReceiptsRepo.insertQualityCheckWithItems(
      fakeExecutor([{ ...qcFields, checkedAt: new Date('2026-10-05T08:00:00.007Z') }]),
      {
        goodsReceiptId: grnFields.id,
        warehouseId: IDS.warehouseOoty,
        listedGrade: 'GRADE_1',
        checkedBy: IDS.userSuperAdmin,
        assignedGrade: 'GRADE_1',
        outcome: 'ACCEPTED',
        acceptedQtyKg: '100.000',
        photos: [],
        items: [],
      } as never,
    );
    expect(inserted.checkedAt).toMatch(ISO_DATE_TIME);
    expect(inserted.checkedAt).toBe('2026-10-05T08:00:00.007Z');

    const found = await goodsReceiptsRepo.findQualityCheckByGoodsReceiptId(
      fakeExecutor([{ ...qcFields, checkedAt: new Date('2026-10-05T08:00:00.007Z') }], []),
      grnFields.id,
    );
    expect(found?.checkedAt).toMatch(ISO_DATE_TIME);
  });

  it('BR-10: counter-offer expiresAt is ISO-8601 UTC', async () => {
    const offer = (await goodsReceiptsRepo.insertQualityCounterOffer(
      fakeExecutor([
        {
          id: 'o1',
          listingId: '4a1c7b52-0000-4000-8000-0000000000aa',
          goodsReceiptId: grnFields.id,
          round: 1,
          offeredBy: 'ADMIN',
          offeredByUserId: IDS.userSuperAdmin,
          pricePerKg: '40.00',
          quantityKg: '90.000',
          message: null,
          status: 'PENDING',
          expiresAt: new Date('2026-10-06T08:00:00.123Z'),
          respondedAt: null,
        },
      ]),
      {
        listingId: '4a1c7b52-0000-4000-8000-0000000000aa',
        goodsReceiptId: grnFields.id,
        round: 1,
        pricePerKg: '40.00',
        quantityKg: '90.000',
        offeredByUserId: IDS.userSuperAdmin,
        expiresAt: new Date('2026-10-06T08:00:00.123Z'),
      },
    )) as { expiresAt: string };
    expect(offer.expiresAt).toMatch(ISO_DATE_TIME);
    expect(offer.expiresAt).toBe('2026-10-06T08:00:00.123Z');
  });

  describeIfDatabase('against PostgreSQL (rolled-back transaction)', () => {
    it('receivedAt/checkedAt read back equal the stored instant; a microsecond cursor loses no row', async () => {
      if (!(await databaseReady('goods_receipts'))) return;
      const { pool } = await import('../../db/pool.js');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const tx = client as unknown as Executor;
        const po = await client.query<{ id: string; farmer_id: string; warehouse_id: string }>(
          'SELECT id, farmer_id, warehouse_id FROM purchase_orders LIMIT 1',
        );
        if (po.rows.length === 0) return; // no PO in this database to borrow
        const { id: poId, farmer_id: farmerId, warehouse_id: warehouseId } = po.rows[0]!;

        // Two receipts one microsecond apart: a cursor truncated to milliseconds would skip the older.
        const ins = async (grn: string, receivedAt: string): Promise<string> => {
          const r = await client.query<{ id: string }>(
            `INSERT INTO goods_receipts (grn_number, purchase_order_id, warehouse_id, farmer_id, gross_qty_kg, received_by, received_at)
             VALUES ($1, $2, $3, $4, 10, $5, $6) RETURNING id`,
            [grn, poId, warehouseId, farmerId, IDS.userSuperAdmin, receivedAt],
          );
          return r.rows[0]!.id;
        };
        const newer = await ins('GRN-TSTEST-NEWER', '2031-03-04T05:06:08.654321Z');
        const older = await ins('GRN-TSTEST-OLDER', '2031-03-04T05:06:08.654320Z');
        await client.query(
          `INSERT INTO quality_checks (goods_receipt_id, warehouse_id, assigned_grade, listed_grade, outcome, accepted_qty_kg, checked_by, checked_at)
           VALUES ($1, $2, 'GRADE_1', 'GRADE_1', 'ACCEPTED', 10, $3, '2031-03-04T05:06:09.007008Z')`,
          [newer, warehouseId, IDS.userSuperAdmin],
        );

        const detail = await goodsReceiptsRepo.findGoodsReceiptById(tx, newer, allScope);
        expect(detail?.receivedAt).toBe('2031-03-04T05:06:08.654Z');
        const qc = await goodsReceiptsRepo.findQualityCheckByGoodsReceiptId(tx, newer);
        expect(qc?.checkedAt).toBe('2031-03-04T05:06:09.007Z');

        const page1 = await goodsReceiptsRepo.listGoodsReceipts(tx, allScope, { limit: 1, purchaseOrderId: poId } as never);
        expect(page1.items.map((i) => i.id)).toEqual([newer]);
        expect(page1.items[0]?.receivedAt).toMatch(ISO_DATE_TIME);
        expect(page1.nextCursor).toBe('2031-03-04T05:06:08.654321Z');
        const page2 = await goodsReceiptsRepo.listGoodsReceipts(tx, allScope, {
          limit: 1,
          purchaseOrderId: poId,
          cursor: page1.nextCursor!,
        } as never);
        expect(page2.items.map((i) => i.id)).toEqual([older]);
      } finally {
        await client.query('ROLLBACK');
        client.release();
      }
    });
  });
});

// ---------------------------------------------------------------------------
// BR-30: warehouse confinement against real PostgreSQL, through the real app router.
// ---------------------------------------------------------------------------

/**
 * docs/rbac.json grants inventory.goods_receipt.record, inventory.quality_check.perform and
 * inventory.quality.counter_offer to SUB_WH_ADMIN at `all`, and `scopedWhere` adds no warehouse
 * clause at `all`. docs/rbac.json `scopeFilters` still says every query of a Sub admin is filtered by
 * its assigned warehouse, so these tests pin that a caller whose scope carries an assigned warehouse
 * is confined to it whatever the grant, and that a foreign id answers exactly like an id that does
 * not exist (a different status or body would confirm that the row exists).
 *
 * Fixtures: one purchase order and one AWAITING_QC receipt in each of the seeded Ooty and Coonoor
 * warehouses. They are committed (the HTTP app reads through its own pool) and deleted in afterAll.
 * Nothing here may write an append-only row; the one success path that does write (audit_log) runs
 * at the service level inside a rolled-back transaction.
 */
describeIfDatabase('BR-30: goods receipts are confined to the caller\'s assigned warehouses (PostgreSQL, real router)', () => {
  const GR_CODES = [
    'inventory.goods_receipt.record',
    'inventory.quality_check.perform',
    'inventory.quality.counter_offer',
  ];
  const QC_BODY = {
    assignedGrade: 'GRADE_1',
    outcome: 'ACCEPTED',
    acceptedQtyKg: '100.000',
    items: qcParameters.map((parameter) => ({ parameter, score: 8, passed: true })),
  };
  const COUNTER_BODY = { pricePerKg: '40.00', quantityKg: '50.000' };

  interface PoFixture {
    purchaseOrderId: string;
    farmerId: string;
    farmerUserId: string;
    issuedBy: string;
    cropId: string;
    fairPriceId: string;
    listingId: string;
  }

  /** The dbFixtures `insertPurchaseOrder` chain, but destined for an existing (seeded) warehouse. */
  async function insertPurchaseOrderAt(db: Executor, warehouseId: string): Promise<PoFixture> {
    const { farmerId, userId: farmerUserId } = await insertFarmerWithPlot(db);
    const issuedBy = await insertUser(db, 'ADMIN', 'Fixture PO Admin');
    const cropId = await insertCrop(db);
    const fairPriceId = newId();
    await db.query(
      `INSERT INTO fair_prices (id, crop_id, grade, ceiling_price, effective_from, set_by)
       VALUES ($1, $2, 'GRADE_1', 100.00, '2026-01-01', $3)`,
      [fairPriceId, cropId, issuedBy],
    );
    const listingId = newId();
    await db.query(
      `INSERT INTO produce_listings (id, listing_number, farmer_id, crop_id, grade, quantity_kg, price_per_kg, fair_price_id)
       VALUES ($1, $2, $3, $4, 'GRADE_1', 100, 50.00, $5)`,
      [listingId, `LST-H2-${listingId.slice(0, 8)}`, farmerId, cropId, fairPriceId],
    );
    const purchaseOrderId = newId();
    await db.query(
      `INSERT INTO purchase_orders
         (id, po_number, farmer_id, listing_id, warehouse_id, crop_id, grade, quantity_kg, price_per_kg, total_amount, issued_by)
       VALUES ($1, $2, $3, $4, $5, $6, 'GRADE_1', 100, 50.00, 5000.00, $7)`,
      [purchaseOrderId, `PO-H2-${purchaseOrderId.slice(0, 8)}`, farmerId, listingId, warehouseId, cropId, issuedBy],
    );
    return { purchaseOrderId, farmerId, farmerUserId, issuedBy, cropId, fairPriceId, listingId };
  }

  async function insertReceipt(db: Executor, po: PoFixture, warehouseId: string): Promise<string> {
    const result = await db.query<{ id: string }>(
      `INSERT INTO goods_receipts (grn_number, purchase_order_id, warehouse_id, farmer_id, status, gross_qty_kg, received_by)
       VALUES ($1, $2, $3, $4, 'AWAITING_QC', 100, $5) RETURNING id`,
      [`GRN-H2-${newId()}`, po.purchaseOrderId, warehouseId, po.farmerId, po.issuedBy],
    );
    return result.rows[0]!.id;
  }

  /** The problem body without the per-request fields, with the requested id(s) masked. */
  function problemShape(body: unknown, ...ids: string[]): Record<string, unknown> {
    const { instance: _instance, traceId: _traceId, ...rest } = body as Record<string, unknown>;
    let text = JSON.stringify(rest);
    for (const id of ids) text = text.split(id).join('<id>');
    return JSON.parse(text) as Record<string, unknown>;
  }

  let server: Server;
  const tokens: Record<string, string> = {};
  const auth = (name: string): string => `Bearer ${tokens[name]!}`;
  let whA = '';
  let whB = '';
  let poA: PoFixture;
  let poB: PoFixture;
  let receiptA = '';
  let receiptB = '';

  beforeAll(async () => {
    expect(await requireDatabaseTables('goods_receipts', 'purchase_orders', 'quality_checks')).toBe(true);
    const { pool } = await import('../../db/pool.js');
    await ensureStandardUsers(pool, 'userSuperAdmin');
    const seeded = await pool.query<{ id: string; code: string }>(
      `SELECT id, code FROM warehouses WHERE code IN ('WH-OOTY', 'WH-COON')`,
    );
    const byCode = new Map(seeded.rows.map((row) => [row.code, row.id]));
    if (!byCode.has('WH-OOTY') || !byCode.has('WH-COON')) {
      throw new Error('seed warehouses WH-OOTY / WH-COON are missing: run db/seed/001_reference.sql');
    }
    whA = byCode.get('WH-OOTY')!;
    whB = byCode.get('WH-COON')!;
    poA = await insertPurchaseOrderAt(pool, whA);
    poB = await insertPurchaseOrderAt(pool, whB);
    receiptA = await insertReceipt(pool, poA, whA);
    receiptB = await insertReceipt(pool, poB, whB);

    // Every token acts as the ensured Super Admin user: if a guard ever let a write through, its
    // audit_log / checked_by foreign keys point at a row that is never deleted.
    const sub = IDS.userSuperAdmin;
    const base = { farmerId: null, customerId: null };
    tokens['subA'] = signAccessToken({ sub, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: whA }], ...base });
    tokens['subB'] = signAccessToken({ sub, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: whB }], ...base });
    tokens['main'] = signAccessToken({ sub, roles: [{ code: RoleCode.MAIN_WH_ADMIN }], ...base });
    tokens['mainA'] = signAccessToken({ sub, roles: [{ code: RoleCode.MAIN_WH_ADMIN, warehouseId: whA }], ...base });
    tokens['superAdmin'] = signAccessToken({ sub, roles: [{ code: RoleCode.SUPER_ADMIN }], ...base });
    tokens['farmerAdmin'] = signAccessToken({ sub, roles: [{ code: RoleCode.FARMER_ADMIN, zoneId: newId() }], ...base });
    tokens['farmer'] = signAccessToken({ sub, roles: [{ code: RoleCode.FARMER }], farmerId: newId(), customerId: null });
    tokens['customer'] = signAccessToken({ sub, roles: [{ code: RoleCode.CUSTOMER }], farmerId: null, customerId: newId() });

    server = createApp().listen(0);
  });

  afterAll(async () => {
    const [{ pool, closePool }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
    const pos = [poA, poB].filter((po): po is PoFixture => po !== undefined);
    const del = async (sql: string, ids: string[]): Promise<void> => {
      if (ids.length > 0) await pool.query(sql, [ids]);
    };
    await del(`DELETE FROM goods_receipts WHERE purchase_order_id = ANY($1::uuid[])`, pos.map((p) => p.purchaseOrderId));
    await del(`DELETE FROM purchase_orders WHERE id = ANY($1::uuid[])`, pos.map((p) => p.purchaseOrderId));
    await del(`DELETE FROM produce_listings WHERE id = ANY($1::uuid[])`, pos.map((p) => p.listingId));
    await del(`DELETE FROM fair_prices WHERE id = ANY($1::uuid[])`, pos.map((p) => p.fairPriceId));
    await del(`DELETE FROM plots WHERE farm_id IN (SELECT id FROM farms WHERE farmer_id = ANY($1::uuid[]))`, pos.map((p) => p.farmerId));
    await del(`DELETE FROM farms WHERE farmer_id = ANY($1::uuid[])`, pos.map((p) => p.farmerId));
    await del(`DELETE FROM farmers WHERE id = ANY($1::uuid[])`, pos.map((p) => p.farmerId));
    await del(`DELETE FROM crop_master WHERE id = ANY($1::uuid[])`, pos.map((p) => p.cropId));
    await del(`DELETE FROM users WHERE id = ANY($1::uuid[])`, pos.flatMap((p) => [p.farmerUserId, p.issuedBy]));
    if (server !== undefined) await new Promise<void>((resolve) => server.close(() => resolve()));
    await Promise.allSettled([closePool(), closeRedis()]);
  });

  /** Everything a goods-receipt write could have changed, measured from `since` (DB clock). */
  async function sideEffects(receiptId: string, warehouseId: string, since: Date): Promise<Record<string, unknown>> {
    const { pool } = await import('../../db/pool.js');
    const result = await pool.query(
      `SELECT
         (SELECT status::text FROM goods_receipts WHERE id = $1) AS status,
         (SELECT updated_at IS NOT NULL FROM goods_receipts WHERE id = $1) AS touched,
         (SELECT count(*)::int FROM quality_checks WHERE goods_receipt_id = $1) AS "qualityChecks",
         (SELECT count(*)::int FROM counter_offers WHERE created_at >= $3) AS "counterOffers",
         (SELECT count(*)::int FROM audit_log WHERE created_at >= $3 AND action_code = ANY($4::text[])) AS "auditRows",
         (SELECT count(*)::int FROM inventory_batches WHERE goods_receipt_id = $1) AS batches,
         (SELECT count(*)::int FROM stock_ledger WHERE warehouse_id = $2 AND created_at >= $3) AS "ledgerRows",
         (SELECT count(*)::int FROM goods_receipts WHERE warehouse_id = $2 AND created_at >= $3) AS "newReceipts"`,
      [receiptId, warehouseId, since, GR_CODES],
    );
    return result.rows[0] as Record<string, unknown>;
  }
  const UNTOUCHED = {
    status: 'AWAITING_QC',
    touched: false,
    qualityChecks: 0,
    counterOffers: 0,
    auditRows: 0,
    batches: 0,
    ledgerRows: 0,
    newReceipts: 0,
  };
  async function dbNow(): Promise<Date> {
    const { pool } = await import('../../db/pool.js');
    return (await pool.query<{ t: Date }>('SELECT clock_timestamp() AS t')).rows[0]!.t;
  }

  it('BR-30: every goods receipt route is 401 without a token and 403 problem+json for FARMER, CUSTOMER and FARMER_ADMIN', async () => {
    const routes: Array<{ method: 'get' | 'post'; path: string; body?: Record<string, unknown> }> = [
      { method: 'get', path: '/v1/admin/goods-receipts' },
      { method: 'get', path: `/v1/admin/goods-receipts/${receiptA}` },
      { method: 'post', path: '/v1/admin/goods-receipts', body: { purchaseOrderId: poA.purchaseOrderId, warehouseId: whA, grossQtyKg: '10.000' } },
      { method: 'post', path: `/v1/admin/goods-receipts/${receiptA}/quality-check`, body: QC_BODY },
      { method: 'post', path: `/v1/admin/goods-receipts/${receiptA}/counter-offer`, body: COUNTER_BODY },
    ];
    const since = await dbNow();
    for (const { method, path, body } of routes) {
      const anonymous = await request(server)[method](path).set('Idempotency-Key', randomUUID()).send(body);
      expect(anonymous.status, `${method} ${path} anonymous`).toBe(401);
      for (const role of ['farmer', 'customer', 'farmerAdmin']) {
        const res = await request(server)[method](path).set('Authorization', auth(role)).set('Idempotency-Key', randomUUID()).send(body);
        expect(res.status, `${method} ${path} as ${role}`).toBe(403);
        expect(res.headers['content-type']).toContain('application/problem+json');
        expect(res.body.code).toBe('FORBIDDEN');
      }
    }
    expect(await sideEffects(receiptA, whA, since)).toEqual(UNTOUCHED);
  });

  it('BR-30: although the Sub grant is `all`, a Sub Warehouse Admin lists only its own warehouse\'s receipts', async () => {
    const rbac = loadRbac();
    for (const code of GR_CODES) expect(rbac.permission(code).grants[RoleCode.SUB_WH_ADMIN], code).toBe(ScopeLevel.ALL);

    const listA = await request(server).get('/v1/admin/goods-receipts?limit=100').set('Authorization', auth('subA'));
    expect(listA.status).toBe(200);
    const idsA = (listA.body.items as GoodsReceiptResponse[]).map((r) => r.id);
    expect(idsA).toContain(receiptA);
    expect(idsA).not.toContain(receiptB);
    expect((listA.body.items as GoodsReceiptResponse[]).every((r) => r.warehouseId === whA)).toBe(true);

    const foreignPo = await request(server)
      .get(`/v1/admin/goods-receipts?purchaseOrderId=${poB.purchaseOrderId}`)
      .set('Authorization', auth('subA'));
    expect(foreignPo.status).toBe(200);
    expect(foreignPo.body.items).toEqual([]);

    const listB = await request(server).get('/v1/admin/goods-receipts?limit=100').set('Authorization', auth('subB'));
    expect(listB.status).toBe(200);
    const idsB = (listB.body.items as GoodsReceiptResponse[]).map((r) => r.id);
    expect(idsB).toContain(receiptB);
    expect(idsB).not.toContain(receiptA);
  });

  it('BR-30: a Sub Warehouse Admin reading another warehouse\'s receipt gets the same 404 as an id that does not exist; its own is 200', async () => {
    const own = await request(server).get(`/v1/admin/goods-receipts/${receiptA}`).set('Authorization', auth('subA'));
    expect(own.status).toBe(200);
    expect(own.body.id).toBe(receiptA);

    const random = newId();
    const foreign = await request(server).get(`/v1/admin/goods-receipts/${receiptB}`).set('Authorization', auth('subA'));
    const missing = await request(server).get(`/v1/admin/goods-receipts/${random}`).set('Authorization', auth('subA'));
    expect(foreign.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(foreign.headers['content-type']).toContain('application/problem+json');
    expect(problemShape(foreign.body, receiptB)).toEqual(problemShape(missing.body, random));
  });

  it('BR-30: a Sub Warehouse Admin cannot quality-check or counter-offer another warehouse\'s receipt: the same 404 as a nonexistent id, and nothing is written', async () => {
    const since = await dbNow();
    const random = newId();
    for (const [action, body] of [['quality-check', QC_BODY], ['counter-offer', COUNTER_BODY]] as const) {
      const foreign = await request(server)
        .post(`/v1/admin/goods-receipts/${receiptB}/${action}`)
        .set('Authorization', auth('subA'))
        .set('Idempotency-Key', randomUUID())
        .send(body);
      const missing = await request(server)
        .post(`/v1/admin/goods-receipts/${random}/${action}`)
        .set('Authorization', auth('subA'))
        .set('Idempotency-Key', randomUUID())
        .send(body);
      expect(foreign.status, `${action} ${JSON.stringify(foreign.body)}`).toBe(404);
      expect(missing.status, action).toBe(404);
      expect(problemShape(foreign.body, receiptB)).toEqual(problemShape(missing.body, random));
    }
    expect(await sideEffects(receiptB, whB, since)).toEqual(UNTOUCHED);
  });

  it('BR-30: a warehouseId list filter naming another warehouse is an empty 200 page (never 403, never a leak), identical to an unknown warehouse, for a confined caller; its own warehouse filters normally', async () => {
    const random = newId();
    const foreign = await request(server).get(`/v1/admin/goods-receipts?warehouseId=${whB}`).set('Authorization', auth('subA'));
    const unknown = await request(server).get(`/v1/admin/goods-receipts?warehouseId=${random}`).set('Authorization', auth('subA'));
    expect(foreign.status, JSON.stringify(foreign.body)).toBe(200);
    expect(unknown.status).toBe(200);
    expect(foreign.body.items).toEqual([]);
    expect(foreign.body).toEqual(unknown.body);

    const own = await request(server).get(`/v1/admin/goods-receipts?warehouseId=${whA}&limit=100`).set('Authorization', auth('subA'));
    expect(own.status).toBe(200);
    expect((own.body.items as GoodsReceiptResponse[]).map((r) => r.id)).toContain(receiptA);
  });

  it('BR-30: creating a receipt against another warehouse\'s purchase order, or for another warehouse, is the same 404 as a nonexistent one, and nothing is written', async () => {
    const since = await dbNow();
    const randomPo = newId();
    const randomWh = newId();
    const post = (body: Record<string, unknown>) =>
      request(server).post('/v1/admin/goods-receipts').set('Authorization', auth('subA')).set('Idempotency-Key', randomUUID()).send({ grossQtyKg: '10.000', ...body });

    // Own warehouse named, foreign purchase order: must not disclose the order or its warehouse.
    const foreignPo = await post({ purchaseOrderId: poB.purchaseOrderId, warehouseId: whA });
    const missingPo = await post({ purchaseOrderId: randomPo, warehouseId: whA });
    expect(foreignPo.status, JSON.stringify(foreignPo.body)).toBe(404);
    expect(missingPo.status).toBe(404);
    expect(JSON.stringify(foreignPo.body)).not.toContain(whB);
    expect(problemShape(foreignPo.body, poB.purchaseOrderId)).toEqual(problemShape(missingPo.body, randomPo));

    // Another warehouse named: the same 404 as a warehouse that does not exist.
    const foreignWh = await post({ purchaseOrderId: poB.purchaseOrderId, warehouseId: whB });
    const missingWh = await post({ purchaseOrderId: randomPo, warehouseId: randomWh });
    expect(foreignWh.status, JSON.stringify(foreignWh.body)).toBe(404);
    expect(missingWh.status).toBe(404);
    expect(problemShape(foreignWh.body, whB)).toEqual(problemShape(missingWh.body, randomWh));

    expect(await sideEffects(receiptB, whB, since)).toEqual(UNTOUCHED);
    expect((await sideEffects(receiptA, whA, since))['newReceipts']).toBe(0);
  });

  it('BR-30: a Main Warehouse Admin with no assigned warehouse, and the Super Admin, see and open both warehouses\' receipts', async () => {
    for (const role of ['main', 'superAdmin']) {
      for (const [po, receipt, warehouse] of [[poA, receiptA, whA], [poB, receiptB, whB]] as const) {
        const list = await request(server)
          .get(`/v1/admin/goods-receipts?purchaseOrderId=${po.purchaseOrderId}`)
          .set('Authorization', auth(role));
        expect(list.status, role).toBe(200);
        expect((list.body.items as GoodsReceiptResponse[]).map((r) => r.id), role).toEqual([receipt]);

        const filtered = await request(server)
          .get(`/v1/admin/goods-receipts?warehouseId=${warehouse}&purchaseOrderId=${po.purchaseOrderId}`)
          .set('Authorization', auth(role));
        expect(filtered.status, role).toBe(200);
        expect((filtered.body.items as GoodsReceiptResponse[]).map((r) => r.id), role).toEqual([receipt]);

        const detail = await request(server).get(`/v1/admin/goods-receipts/${receipt}`).set('Authorization', auth(role));
        expect(detail.status, role).toBe(200);
        expect(detail.body.warehouseId, role).toBe(warehouse);
      }
    }
  });

  it('BR-30: a Main Warehouse Admin confined to one warehouse sees and acts only within it', async () => {
    const since = await dbNow();
    const random = newId();
    const list = await request(server)
      .get(`/v1/admin/goods-receipts?purchaseOrderId=${poB.purchaseOrderId}`)
      .set('Authorization', auth('mainA'));
    expect(list.status).toBe(200);
    expect(list.body.items).toEqual([]);

    const filter = await request(server).get(`/v1/admin/goods-receipts?warehouseId=${whB}`).set('Authorization', auth('mainA'));
    expect(filter.status).toBe(200);
    expect(filter.body.items).toEqual([]);

    const foreign = await request(server).get(`/v1/admin/goods-receipts/${receiptB}`).set('Authorization', auth('mainA'));
    const missing = await request(server).get(`/v1/admin/goods-receipts/${random}`).set('Authorization', auth('mainA'));
    expect(foreign.status).toBe(404);
    expect(problemShape(foreign.body, receiptB)).toEqual(problemShape(missing.body, random));

    const qc = await request(server)
      .post(`/v1/admin/goods-receipts/${receiptB}/quality-check`)
      .set('Authorization', auth('mainA'))
      .set('Idempotency-Key', randomUUID())
      .send(QC_BODY);
    expect(qc.status).toBe(404);
    expect(await sideEffects(receiptB, whB, since)).toEqual(UNTOUCHED);

    const own = await request(server).get(`/v1/admin/goods-receipts/${receiptA}`).set('Authorization', auth('mainA'));
    expect(own.status).toBe(200);
  });

  it('BR-30: at the real `all` grant a Sub Warehouse Admin still records a receipt and its quality check for its own warehouse (real SQL, rolled back)', async () => {
    const { pool } = await import('../../db/pool.js');
    const actor = anActor({ userId: IDS.userSuperAdmin, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: whA }] });
    const recordScope = resolveScope(actor, 'inventory.goods_receipt.record');
    const qcScope = resolveScope(actor, 'inventory.quality_check.perform');
    expect(recordScope?.level).toBe(ScopeLevel.ALL);
    expect(qcScope?.level).toBe(ScopeLevel.ALL);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const tx = client as unknown as Executor;
      const service = createGoodsReceiptsService(goodsReceiptsRepo, (fn) => fn(tx), tx);

      const created = await service.createGoodsReceipt(actor, recordScope!, {
        purchaseOrderId: poA.purchaseOrderId,
        warehouseId: whA,
        grossQtyKg: '100.000',
        photos: [],
      }, randomUUID());
      expect(created.warehouseId).toBe(whA);
      expect(created.status).toBe('AWAITING_QC');

      const listed = await service.list(actor, recordScope!, { limit: 100 });
      const ids = listed.items.map((r) => r.id);
      expect(ids).toEqual(expect.arrayContaining([created.id, receiptA]));
      expect(ids).not.toContain(receiptB);

      const checked = await service.recordQualityCheck(actor, qcScope!, created.id, qualityCheckCreateBody.parse(QC_BODY), randomUUID());
      expect(checked.qualityCheck.goodsReceiptId).toBe(created.id);
      expect(checked.qualityCheck.items).toHaveLength(5);
      const after = await service.getById(actor, recordScope!, created.id);
      expect(after.status).toBe('ACCEPTED');
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });
});
