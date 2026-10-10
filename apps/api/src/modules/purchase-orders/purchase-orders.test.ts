import { afterAll, describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { AppError } from '../../http/problem.js';
import type { Actor } from '../../auth/requireAuth.js';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  aScope,
  aSubWarehouseAdmin,
  anActor,
  describeIfDatabase,
  IDS,
} from '../../test/factories.js';
import { insertPurchaseOrder, requireDatabaseTables } from '../../test/dbFixtures.js';
import {
  calculateTotalAmountPaise,
  createPurchaseOrdersService,
  formatPoRowToResponse,
  type ListingForApproval,
} from './purchase-orders.service.js';
import {
  purchaseOrdersRepo,
  type InsertPurchaseOrderData,
  type PurchaseOrdersRepo,
  type PurchaseOrderRow,
} from './purchase-orders.repo.js';

describe('PurchaseOrdersService (Unit & Business Rules)', () => {
  const WH_OOTY = IDS.warehouseOoty;
  const WH_COONOOR = IDS.warehouseCoonoor;

  const mockActorAdmin: Actor = anActor({
    userId: IDS.userSuperAdmin,
    roles: [{ code: RoleCode.SUPER_ADMIN }],
  });

  const mockScopeAdmin: ResolvedScope = aScope({
    level: ScopeLevel.ALL,
    permission: 'purchase.order.view',
    roleCode: RoleCode.SUPER_ADMIN,
  });

  const mockActorSubWhOoty: Actor = aSubWarehouseAdmin(WH_OOTY);

  const mockScopeSubWhOoty: ResolvedScope = aScope({
    level: ScopeLevel.OWN,
    permission: 'purchase.order.view',
    roleCode: RoleCode.SUB_WH_ADMIN,
    warehouseIds: [WH_OOTY],
    userId: mockActorSubWhOoty.userId,
  });

  const samplePoRow: PurchaseOrderRow = {
    id: 'po-11111111-1111-1111-1111-111111111111',
    po_number: 'PO-2026-000001',
    farmer_id: IDS.farmer,
    listing_id: 'lst-11111111-1111-1111-1111-111111111111',
    warehouse_id: WH_OOTY,
    crop_id: 'crop-11111111-1111-1111-1111-111111111111',
    grade: 'GRADE_1',
    quantity_kg: '250.000',
    price_per_kg: '52.00',
    total_amount: '13000.00',
    status: 'ISSUED',
    issued_by: IDS.userSuperAdmin,
    issued_at: new Date('2026-08-28T10:00:00Z'),
    expected_delivery_date: '2026-08-30',
    cancelled_by: null,
    cancelled_at: null,
    cancellation_reason: null,
    created_at: new Date('2026-08-28T10:00:00Z'),
    updated_at: null,
  };

  const createMockRepo = (overrides?: Partial<PurchaseOrdersRepo>): PurchaseOrdersRepo => ({
    nextPoNumber: async () => 'PO-2026-000001',
    insertPurchaseOrder: async (_tx, data: InsertPurchaseOrderData) => ({
      ...samplePoRow,
      farmer_id: data.farmerId,
      listing_id: data.listingId,
      warehouse_id: data.warehouseId,
      crop_id: data.cropId,
      grade: data.grade,
      quantity_kg: data.quantityKg,
      price_per_kg: data.pricePerKg,
      total_amount: data.totalAmount,
      issued_by: data.issuedBy,
      expected_delivery_date: data.expectedDeliveryDate ?? null,
    }),
    findPurchaseOrderById: async (_tx, id, scope) => {
      if (id !== samplePoRow.id) return null;
      if (scope.warehouseIds.length > 0 && !scope.warehouseIds.includes(samplePoRow.warehouse_id)) {
        return null;
      }
      return {
        id: samplePoRow.id,
        poNumber: samplePoRow.po_number,
        farmerId: samplePoRow.farmer_id,
        listingId: samplePoRow.listing_id,
        warehouseId: samplePoRow.warehouse_id,
        cropId: samplePoRow.crop_id,
        grade: samplePoRow.grade,
        quantityKg: samplePoRow.quantity_kg,
        pricePerKg: samplePoRow.price_per_kg,
        totalAmount: samplePoRow.total_amount,
        status: samplePoRow.status,
        expectedDeliveryDate: samplePoRow.expected_delivery_date,
        issuedAt: samplePoRow.issued_at.toISOString(),
        farmerName: 'Farmer Murugan',
        tohfaFarmerId: 'TOHFA-F-2026-0001',
        goodsReceipts: [],
      };
    },
    findPurchaseOrderByListingId: async () => null,
    listPurchaseOrders: async () => ({
      items: [formatPoRowToResponse(samplePoRow)],
      nextCursor: null,
      hasMore: false,
    }),
    findGoodsReceiptsByPoId: async () => [],
    ...overrides,
  });

  const createTestService = (overrides?: Partial<PurchaseOrdersRepo>) =>
    createPurchaseOrdersService(createMockRepo(overrides));

  it('Calculates total amount in integer paise Money accurately', () => {
    // 250.000 kg @ Rs 52.00/kg = Rs 13,000.00
    expect(calculateTotalAmountPaise('52.00', '250.000')).toBe('13000.00');

    // 75.500 kg @ Rs 48.75/kg = Rs 3,680.63
    expect(calculateTotalAmountPaise('48.75', '75.500')).toBe('3680.63');
  });

  it('Negotiated terms: Adopts counter-offer final price and quantity over asking terms', async () => {
    let capturedInsert: InsertPurchaseOrderData | null = null;
    const service = createTestService({
      insertPurchaseOrder: async (_tx, data) => {
        capturedInsert = data;
        return {
          ...samplePoRow,
          farmer_id: data.farmerId,
          listing_id: data.listingId,
          warehouse_id: data.warehouseId,
          crop_id: data.cropId,
          grade: data.grade,
          price_per_kg: data.pricePerKg,
          quantity_kg: data.quantityKg,
          total_amount: data.totalAmount,
          issued_by: data.issuedBy,
          expected_delivery_date: data.expectedDeliveryDate ?? null,
          id: 'po-1',
          po_number: 'PO-2026-000001',
        };
      },
    });

    const negotiatedListing: ListingForApproval = {
      id: 'lst-1',
      farmerId: IDS.farmer,
      cropId: 'crop-1',
      grade: 'GRADE_1',
      askingPricePerKg: '100.00',
      quantityKg: '100.000',
      finalPricePerKg: '75.00', // Negotiated down
      finalQuantityKg: '75.000', // Negotiated down
    };

    const po = await service.createForListing(
      {} as unknown as Executor,
      mockActorAdmin,
      mockScopeAdmin,
      negotiatedListing,
      { warehouseId: WH_OOTY, expectedDeliveryDate: '2026-09-01' },
    );

    expect(capturedInsert).not.toBeNull();
    expect(capturedInsert!.pricePerKg).toBe('75.00');
    expect(capturedInsert!.quantityKg).toBe('75.000');
    expect(capturedInsert!.totalAmount).toBe('5625.00'); // 75.00 * 75 = 5625.00

    expect(po.pricePerKg).toBe('75.00');
    expect(po.quantityKg).toBe('75.000');
    expect(po.totalAmount).toBe('5625.00');
  });

  it('Unnegotiated terms: Falls back to asking price and quantity when no counter-offer was negotiated', async () => {
    let capturedInsert: InsertPurchaseOrderData | null = null;
    const service = createTestService({
      insertPurchaseOrder: async (_tx, data) => {
        capturedInsert = data;
        return {
          ...samplePoRow,
          farmer_id: data.farmerId,
          listing_id: data.listingId,
          warehouse_id: data.warehouseId,
          crop_id: data.cropId,
          grade: data.grade,
          price_per_kg: data.pricePerKg,
          quantity_kg: data.quantityKg,
          total_amount: data.totalAmount,
          issued_by: data.issuedBy,
          expected_delivery_date: data.expectedDeliveryDate ?? null,
          id: 'po-2',
          po_number: 'PO-2026-000002',
        };
      },
    });

    const directListing: ListingForApproval = {
      id: 'lst-2',
      farmerId: IDS.farmer,
      cropId: 'crop-1',
      grade: 'GRADE_1',
      askingPricePerKg: '52.00',
      quantityKg: '250.000',
      finalPricePerKg: null,
      finalQuantityKg: null,
    };

    const po = await service.createForListing(
      {} as unknown as Executor,
      mockActorAdmin,
      mockScopeAdmin,
      directListing,
      { warehouseId: WH_OOTY },
    );

    expect(capturedInsert).not.toBeNull();
    expect(capturedInsert!.pricePerKg).toBe('52.00');
    expect(capturedInsert!.quantityKg).toBe('250.000');
    expect(capturedInsert!.totalAmount).toBe('13000.00');
    expect(po.totalAmount).toBe('13000.00');
  });

  it('Idempotent: Calling create twice for the same listing returns the existing PO without renumbering', async () => {
    let insertCalls = 0;
    const existingPoRow: PurchaseOrderRow = {
      ...samplePoRow,
      id: 'existing-po-uuid',
      po_number: 'PO-2026-000042',
    };

    const service = createTestService({
      findPurchaseOrderByListingId: async (_tx, listingId) => {
        if (listingId === 'lst-idempotent') return existingPoRow;
        return null;
      },
      insertPurchaseOrder: async () => {
        insertCalls += 1;
        return samplePoRow;
      },
    });

    const listing: ListingForApproval = {
      id: 'lst-idempotent',
      farmerId: IDS.farmer,
      cropId: 'crop-1',
      grade: 'GRADE_1',
      askingPricePerKg: '50.00',
      quantityKg: '100.000',
    };

    const result = await service.createForListing(
      {} as unknown as Executor,
      mockActorAdmin,
      mockScopeAdmin,
      listing,
      { warehouseId: WH_OOTY },
    );

    expect(insertCalls).toBe(0); // Insert should be skipped
    expect(result.id).toBe('existing-po-uuid');
    expect(result.poNumber).toBe('PO-2026-000042');
  });

  it('BR-30a: Sub Warehouse Admin fetches their assigned warehouse PO successfully', async () => {
    const service = createTestService();
    const result = await service.getById(
      mockActorSubWhOoty,
      mockScopeSubWhOoty,
      samplePoRow.id,
    );

    expect(result).toBeDefined();
    expect(result.id).toBe(samplePoRow.id);
    expect(result.warehouseId).toBe(WH_OOTY);
  });

  it('BR-30b: Sub Warehouse Admin fetching another warehouse PO gets 404 NOT_FOUND (never 403)', async () => {
    const service = createTestService();

    // Scope restricted to Coonoor warehouse
    const mockScopeSubWhCoonoor: ResolvedScope = aScope({
      level: ScopeLevel.OWN,
      permission: 'purchase.order.view',
      roleCode: RoleCode.SUB_WH_ADMIN,
      warehouseIds: [WH_COONOOR],
      userId: IDS.userSubWhAdmin,
    });

    await expect(
      service.getById(mockActorSubWhOoty, mockScopeSubWhCoonoor, samplePoRow.id),
    ).rejects.toSatisfy((err: unknown) => {
      const e = err as AppError;
      expect(e).toBeInstanceOf(AppError);
      expect(e.status).toBe(404);
      expect(e.code).toBe('NOT_FOUND');
      return true;
    });
  });

  it('BR-30c: Super Admin / Main Warehouse Admin can fetch POs across all warehouses', async () => {
    const service = createTestService();
    const result = await service.getById(
      mockActorAdmin,
      mockScopeAdmin,
      samplePoRow.id,
    );

    expect(result).toBeDefined();
    expect(result.id).toBe(samplePoRow.id);
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

describe('Purchase order timestamps are ISO-8601 on the wire (docs/openapi.yaml: format date-time)', () => {
  const allScope = aScope({
    level: ScopeLevel.ALL,
    permission: 'purchase.order.view',
    roleCode: RoleCode.SUPER_ADMIN,
  });
  // pg parses timestamptz into a Date; the repo must serialize it itself.
  const poFields = {
    id: '3f1c7b52-0000-4000-8000-000000000001',
    poNumber: 'PO-2026-000001',
    farmerId: IDS.farmer,
    listingId: '3f1c7b52-0000-4000-8000-000000000002',
    warehouseId: IDS.warehouseOoty,
    cropId: '3f1c7b52-0000-4000-8000-000000000003',
    grade: 'GRADE_1',
    quantityKg: '250.000',
    pricePerKg: '52.00',
    totalAmount: '13000.00',
    status: 'ISSUED',
    expectedDeliveryDate: '2026-08-30',
  };

  it('issuedAt and goods-receipt receivedAt on PO detail are ISO-8601 UTC, not Postgres text', async () => {
    const tx = fakeExecutor(
      [{ ...poFields, issuedAt: new Date('2026-10-05T07:42:36.490Z'), farmerName: 'F', tohfaFarmerId: 'T-1' }],
      [
        {
          id: '3f1c7b52-0000-4000-8000-000000000009',
          grnNumber: 'GRN-2026-000001',
          purchaseOrderId: poFields.id,
          warehouseId: IDS.warehouseOoty,
          grossQtyKg: '100.000',
          acceptedQtyKg: '0.000',
          rejectedQtyKg: '0.000',
          status: 'AWAITING_QC',
          receivedAt: new Date('2026-10-05T09:00:01.250Z'),
        },
      ],
    );

    const detail = await purchaseOrdersRepo.findPurchaseOrderById(tx, poFields.id, allScope);

    expect(detail?.issuedAt).toMatch(ISO_DATE_TIME);
    expect(detail?.issuedAt).toBe('2026-10-05T07:42:36.490Z');
    expect(detail?.goodsReceipts[0]?.receivedAt).toMatch(ISO_DATE_TIME);
    expect(detail?.goodsReceipts[0]?.receivedAt).toBe('2026-10-05T09:00:01.250Z');
    // calendar date stays a plain date
    expect(detail?.expectedDeliveryDate).toBe('2026-08-30');
  });

  it('list items carry ISO issuedAt and nextCursor keeps the full microsecond instant', async () => {
    const rows = [
      { ...poFields, id: 'a', issuedAt: new Date('2026-10-05T07:42:36.490Z'), cursorIssuedAt: '2026-10-05T07:42:36.490266Z' },
      { ...poFields, id: 'b', issuedAt: new Date('2026-10-04T07:42:36.100Z'), cursorIssuedAt: '2026-10-04T07:42:36.100999Z' },
    ];
    const page = await purchaseOrdersRepo.listPurchaseOrders(fakeExecutor(rows), allScope, { limit: 1 } as never);

    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.issuedAt).toMatch(ISO_DATE_TIME);
    // A millisecond-truncated cursor would skip rows created later in the same millisecond.
    expect(page.nextCursor).toBe('2026-10-05T07:42:36.490266Z');
    expect(page.hasMore).toBe(true);
    // the helper column used to build the cursor is not part of the response
    expect(Object.keys(page.items[0]!)).not.toContain('cursorIssuedAt');
  });

  describeIfDatabase('against PostgreSQL (rolled-back transaction)', () => {
    afterAll(async () => {
      const { closePool } = await import('../../db/pool.js');
      await closePool();
    });

    it('issuedAt/receivedAt read back equal the stored instant; a microsecond cursor pages correctly', async (ctx) => {
      if (!(await requireDatabaseTables('purchase_orders', 'goods_receipts', 'produce_listings'))) return ctx.skip();
      const { pool } = await import('../../db/pool.js');
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const tx = client as unknown as Executor;
        // The purchase order (and its farmer, warehouse, crop, fair price, listing and admin
        // user) is created inside this transaction, so the test no longer borrows "any PO in
        // the database" (and silently passes when there is none, as on a fresh database).
        const fixture = await insertPurchaseOrder(tx);
        const { purchaseOrderId: id, farmerId, warehouseId } = fixture;

        await client.query(`UPDATE purchase_orders SET issued_at = '2031-03-04T05:06:07.123456Z' WHERE id = $1`, [id]);
        await client.query(
          `INSERT INTO goods_receipts (grn_number, purchase_order_id, warehouse_id, farmer_id, gross_qty_kg, received_by, created_at)
           VALUES ('GRN-TSTEST-1', $1, $2, $3, 10, $4, '2031-03-04T05:06:08.654321Z')`,
          [id, warehouseId, farmerId, fixture.receivedBy],
        );

        const detail = await purchaseOrdersRepo.findPurchaseOrderById(tx, id, allScope);
        expect(detail?.issuedAt).toBe('2031-03-04T05:06:07.123Z');
        expect(detail?.goodsReceipts[0]?.receivedAt).toBe('2031-03-04T05:06:08.654Z');

        // Strictly-less-than cursor: the exact instant excludes the row, one microsecond later includes it.
        const at = await purchaseOrdersRepo.listPurchaseOrders(tx, allScope, {
          limit: 10,
          cursor: '2031-03-04T05:06:07.123456Z',
        } as never);
        expect(at.items.map((i) => i.id)).not.toContain(id);
        const after = await purchaseOrdersRepo.listPurchaseOrders(tx, allScope, {
          limit: 10,
          cursor: '2031-03-04T05:06:07.123457Z',
        } as never);
        expect(after.items.map((i) => i.id)).toContain(id);
        expect(after.items.find((i) => i.id === id)?.issuedAt).toMatch(ISO_DATE_TIME);
      } finally {
        await client.query('ROLLBACK');
        client.release();
      }
    });
  });
});
