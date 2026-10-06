import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { AppError } from '../../http/problem.js';
import type { Actor } from '../../auth/requireAuth.js';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  aScope,
  aSubWarehouseAdmin,
  anActor,
  databaseReady,
  describeIfDatabase,
  IDS,
} from '../../test/factories.js';
import {
  createGoodsReceiptsService,
} from './goods-receipts.service.js';
import {
  goodsReceiptsRepo,
  type GoodsReceiptsRepo,
  type PurchaseOrderForReceipt,
} from './goods-receipts.repo.js';
import type {
  CreateGoodsReceiptBody,
  GoodsReceiptResponse,
  QualityCheckCreateBody,
  QualityCheckItemInput,
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
    updateGoodsReceiptStatus: async () => {},
    insertQualityCounterOffer: async (_tx, data) => ({
      id: 'co-qc-1',
      goodsReceiptId: data.goodsReceiptId,
      pricePerKg: data.pricePerKg,
      quantityKg: data.quantityKg,
      status: 'PENDING',
      expiresAt: data.expiresAt.toISOString(),
    }),
    listGoodsReceipts: async () => ({
      items: [sampleGRN],
      nextCursor: null,
      hasMore: false,
    }),
    ...overrides,
  });

  const mockTx = { query: async () => ({ rows: [] }) } as unknown as Executor;
  const mockRunTx = async <T>(fn: (tx: Executor) => Promise<T>): Promise<T> => fn(mockTx);
  const mockDb = { query: async () => ({ rows: [] }) } as unknown as Executor;

  const createTestService = (overrides?: Partial<GoodsReceiptsRepo>) =>
    createGoodsReceiptsService(createMockRepo(overrides), mockRunTx, mockDb);

  it('BR-30a: Sub Warehouse Admin creates goods receipt for their assigned warehouse', async () => {
    const service = createTestService();
    const input: CreateGoodsReceiptBody = {
      purchaseOrderId: samplePO.id,
      warehouseId: WH_OOTY,
      grossQtyKg: '250.000',
      vehicleNumber: 'TN43AB1234',
      photos: [],
    };

    const res = await service.createGoodsReceipt(mockActorSubWhOoty, mockScopeSubWhOoty, input);
    expect(res).toBeDefined();
    expect(res.warehouseId).toBe(WH_OOTY);
    expect(res.status).toBe('AWAITING_QC');
  });

  it('BR-30b: Sub Warehouse Admin cannot create goods receipt for an unassigned warehouse (refused)', async () => {
    const service = createTestService();
    const input: CreateGoodsReceiptBody = {
      purchaseOrderId: samplePO.id,
      warehouseId: WH_COONOOR, // Unassigned warehouse
      grossQtyKg: '250.000',
      photos: [],
    };

    await expect(
      service.createGoodsReceipt(mockActorSubWhOoty, mockScopeSubWhOoty, input),
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as AppError;
      expect(e).toBeInstanceOf(AppError);
      expect(e.status).toBe(403);
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
      service.recordQualityCheck(mockActorAdmin, mockScopeAdmin, sampleGRN.id, input),
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
      service.recordQualityCheck(mockActorAdmin, mockScopeAdmin, sampleGRN.id, input),
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

    const res = await service.recordQualityCheck(mockActorAdmin, mockScopeAdmin, sampleGRN.id, input);
    expect(res.qualityCheck).toBeDefined();
    expect(res.qualityCheck.outcome).toBe('ACCEPTED');
    expect(res.qualityCheck.items).toHaveLength(5);
    expect(res.batch).toBeNull(); // S-26 handles inventory batches
    expect(capturedStatus).toBe('ACCEPTED');
  });

  it('BR-10a: Quality counter-offer surface sets 24-hour expiration window', async () => {
    let capturedExpiry: Date | null = null;
    const service = createTestService({
      insertQualityCounterOffer: async (_tx, data) => {
        capturedExpiry = data.expiresAt;
        return { id: 'co-1', expiresAt: data.expiresAt.toISOString() };
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
          goodsReceiptId: grnFields.id,
          round: 1,
          offeredBy: 'ADMIN',
          pricePerKg: '40.00',
          quantityKg: '90.000',
          message: null,
          status: 'PENDING',
          expiresAt: new Date('2026-10-06T08:00:00.123Z'),
        },
      ]),
      {
        goodsReceiptId: grnFields.id,
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
