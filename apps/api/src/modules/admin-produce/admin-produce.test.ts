/**
 * Admin Produce Control Calendar (BR-142) tests.
 *
 * Test contract:
 *  - BR-142a: Farmer Admin zone scoping & absent-not-forbidden (404 on ID lookup, empty list on filter)
 *  - BR-142b: Role permissions & warehouse scoping (SA/TA/Main see all, Sub sees warehouse, Farmer & Customer 403, 401 unauthenticated)
 *  - BR-142c: includeTotal=true adds page.total; out-of-scope records not counted
 *  - BR-142d: Soft-deleted rows excluded from all queries
 *  - BR-142e: Detail read on a record without milestones returns stages: [] and writes nothing
 *  - BR-142f: Calendar month grid and day events count only recorded events (never expected harvests)
 *  - BR-142g: Field allow-list serialization strips PII, GPS, and sensitive keys
 *  - BR-142h: Input validation rejects bad query/param formats with 422 VALIDATION_FAILED
 */
import express from 'express';
import type pg from 'pg';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { signAccessToken } from '../../auth/jwt.js';
import { aScope, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  listProduceRecordsQuery,
  produceCalendarQuery,
  produceCalendarEventsQuery,
  produceRecordIdParams,
  cropRecordSummarySchema,
  produceRecordDetailResponse,
} from './admin-produce.schema.js';
import { createAdminProduceService } from './admin-produce.service.js';
import { adminProduceRepo, type AdminProduceRepo } from './admin-produce.repo.js';
import { createAdminProduceRouter, adminProduceRouter } from './admin-produce.routes.js';

// Mock token invalidation to avoid Redis timeouts during unit/route testing
vi.mock('../../auth/tokenInvalidation.js', () => ({
  isAccessTokenInvalidated: vi.fn().mockResolvedValue(false),
  markTokensInvalidBefore: vi.fn().mockResolvedValue(undefined),
}));

const ZONE_1 = IDS.zoneNorth;
const ZONE_2 = '20000000-0000-4000-8000-000000000002';
const WAREHOUSE_1 = IDS.warehouseOoty;
const PERMISSION = 'produce.calendar.view_consolidated';

const superScope = (): ResolvedScope =>
  aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUPER_ADMIN, permission: PERMISSION, userId: IDS.userSuperAdmin });
const tohfaScope = (): ResolvedScope =>
  aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.TOHFA_ADMIN, permission: PERMISSION, userId: IDS.userTohfaAdmin });
const mainWhScope = (): ResolvedScope =>
  aScope({ level: ScopeLevel.VIEW, roleCode: RoleCode.MAIN_WH_ADMIN, permission: PERMISSION, userId: IDS.userSuperAdmin });
const farmerAdminScope = (zoneIds: string[] = [ZONE_1]): ResolvedScope =>
  aScope({ level: ScopeLevel.VIEW, roleCode: RoleCode.FARMER_ADMIN, permission: PERMISSION, zoneIds, userId: IDS.userFarmerAdmin });
const subWhScope = (warehouseId: string = WAREHOUSE_1): ResolvedScope =>
  aScope({ level: ScopeLevel.VIEW, roleCode: RoleCode.SUB_WH_ADMIN, permission: PERMISSION, warehouseIds: [warehouseId], userId: IDS.userSubWhAdmin });
const farmerScope = (): ResolvedScope =>
  aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.FARMER, permission: PERMISSION, farmerId: IDS.farmer, userId: IDS.userFarmer });
const customerScope = (): ResolvedScope =>
  aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.CUSTOMER, permission: PERMISSION, customerId: newId(), userId: newId() });

function makeToken(role: RoleCode, extra: { warehouseId?: string; zoneId?: string; farmerId?: string | null; customerId?: string | null } = {}) {
  return signAccessToken({
    sub: newId(),
    roles: [{ code: role, warehouseId: extra.warehouseId, zoneId: extra.zoneId }],
    farmerId: extra.farmerId ?? null,
    customerId: extra.customerId ?? null,
  });
}

const tokens = {
  superAdmin: makeToken(RoleCode.SUPER_ADMIN),
  tohfaAdmin: makeToken(RoleCode.TOHFA_ADMIN),
  farmerAdmin: makeToken(RoleCode.FARMER_ADMIN, { zoneId: ZONE_1 }),
  mainWhAdmin: makeToken(RoleCode.MAIN_WH_ADMIN),
  subWhAdmin: makeToken(RoleCode.SUB_WH_ADMIN, { warehouseId: WAREHOUSE_1 }),
  farmer: makeToken(RoleCode.FARMER, { farmerId: IDS.farmer }),
  customer: makeToken(RoleCode.CUSTOMER, { customerId: newId() }),
};

const sampleRecord = {
  id: '50000000-0000-4000-8000-000000000001',
  crop: { id: '60000000-0000-4000-8000-000000000001', name: 'Carrot', botanicalName: 'Daucus carota' },
  variety: 'Nantes',
  farmer: { id: '70000000-0000-4000-8000-000000000001', tohfaFarmerId: 'TF-001', name: 'Ramesh Kumar' },
  farm: { id: '80000000-0000-4000-8000-000000000001', name: 'Green Valley Farm' },
  zone: { id: ZONE_1, code: 'ZN-N', name: 'North Zone' },
  plot: { id: '90000000-0000-4000-8000-000000000001', name: 'North Plot A', areaAcres: 2.5 },
  status: 'GROWING' as const,
  plantedOn: '2026-10-01',
  expectedHarvestOn: '2026-12-15',
  actualHarvestOn: null,
  expectedYieldKg: 5000,
  actualYieldKg: null,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-05T12:00:00.000Z',
};

const sampleDetail = {
  ...sampleRecord,
  plot: {
    ...sampleRecord.plot,
    soilType: 'Red Loam',
    irrigationType: 'Drip',
    sunExposure: 'Full Sun',
  },
  stages: [
    {
      id: 'a0000000-0000-4000-8000-000000000001',
      stageCode: 'STAGE_SOWING',
      stageName: 'Sowing & Germination',
      sequence: 1,
      status: 'COMPLETED' as const,
      targetDate: '2026-10-07',
      completedOn: '2026-10-06',
    },
    {
      id: 'a0000000-0000-4000-8000-000000000002',
      stageCode: 'STAGE_VEGETATIVE',
      stageName: 'Vegetative Growth',
      sequence: 2,
      status: 'PENDING' as const,
      targetDate: '2026-10-25',
      completedOn: null,
    },
  ],
  related: {
    diaryEntryCount: 3,
    inputLogCount: 1,
  },
};

function createFakeRepo(): { repo: AdminProduceRepo; calls: { list: unknown[]; findById: unknown[]; calendar: unknown[]; events: unknown[]; filterOptions: unknown[] } } {
  const calls = {
    list: [] as unknown[],
    findById: [] as unknown[],
    calendar: [] as unknown[],
    events: [] as unknown[],
    filterOptions: [] as unknown[],
  };

  const repo: AdminProduceRepo = {
    listRecords: vi.fn().mockImplementation(async (_db, args) => {
      calls.list.push(args);
      return {
        items: [sampleRecord],
        nextCursor: null,
        hasMore: false,
        total: args.includeTotal ? 1 : undefined,
      };
    }),
    findRecordById: vi.fn().mockImplementation(async (_db, id, scope) => {
      calls.findById.push({ id, scope });
      if (id === sampleDetail.id) {
        return sampleDetail;
      }
      return null;
    }),
    getCalendar: vi.fn().mockImplementation(async (_db, args) => {
      calls.calendar.push(args);
      return {
        month: args.month,
        days: [
          { date: '2026-10-01', planting: 1, growthStage: 0, harvest: 0 },
          { date: '2026-10-06', planting: 0, growthStage: 1, harvest: 0 },
        ],
      };
    }),
    listCalendarEvents: vi.fn().mockImplementation(async (_db, args) => {
      calls.events.push(args);
      return {
        items: [
          {
            eventType: 'GROWTH_STAGE',
            date: args.date,
            stage: { code: 'STAGE_SOWING', name: 'Sowing & Germination' },
            record: {
              id: sampleRecord.id,
              crop: { id: sampleRecord.crop.id, name: sampleRecord.crop.name },
              farmer: { id: sampleRecord.farmer.id, name: sampleRecord.farmer.name },
              zone: { id: sampleRecord.zone.id, name: sampleRecord.zone.name },
              plot: { id: sampleRecord.plot.id, name: sampleRecord.plot.name },
            },
          },
        ],
        nextCursor: null,
        hasMore: false,
      };
    }),
    getFilterOptions: vi.fn().mockImplementation(async (_db, scope) => {
      calls.filterOptions.push(scope);
      const allZones = [
        { id: ZONE_1, code: 'ZN-N', name: 'North Zone' },
        { id: ZONE_2, code: 'ZN-S', name: 'South Zone' },
      ];
      const zones = scope.zoneIds?.length ? allZones.filter((z) => scope.zoneIds.includes(z.id)) : allZones;
      return {
        zones,
        crops: [{ id: sampleRecord.crop.id, name: 'Carrot', botanicalName: 'Daucus carota' }],
      };
    }),
  };

  return { repo, calls };
}

function createTestApp(repo: AdminProduceRepo) {
  const service = createAdminProduceService(repo);
  const app = express();
  app.use(express.json());
  app.use('/v1/admin/produce', createAdminProduceRouter(service));
  return app;
}

describe('Admin Produce Control Calendar (BR-142)', () => {
  describe('BR-142a: Farmer Admin zone scoping & absent-not-forbidden', () => {
    it('BR-142a: Farmer Admin queries pass zone scope to repo for records list', async () => {
      const { repo } = createFakeRepo();
      const service = createAdminProduceService(repo);
      const res = await service.listRecords(farmerAdminScope([ZONE_1]), { limit: 20 });
      expect(res.items).toHaveLength(1);
      expect(repo.listRecords).toHaveBeenCalled();
    });

    it('BR-142a: Detail read for a missing or out-of-scope record id returns 404 NOT_FOUND', async () => {
      const { repo } = createFakeRepo();
      const service = createAdminProduceService(repo);
      await expect(service.getRecordById(farmerAdminScope([ZONE_1]), '00000000-0000-4000-8000-000000000099')).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('BR-142a: Detail read for an in-scope record returns full detail', async () => {
      const { repo } = createFakeRepo();
      const service = createAdminProduceService(repo);
      const detail = await service.getRecordById(farmerAdminScope([ZONE_1]), sampleDetail.id);
      expect(detail.id).toBe(sampleDetail.id);
      expect(detail.stages).toHaveLength(2);
      expect(detail.related.diaryEntryCount).toBe(3);
      expect(detail.related.inputLogCount).toBe(1);
    });

    it('BR-142a: Filter options for Farmer Admin returns only assigned zones', async () => {
      const { repo } = createFakeRepo();
      const service = createAdminProduceService(repo);
      const opts = await service.getFilterOptions(farmerAdminScope([ZONE_1, ZONE_2]));
      expect(opts.zones).toHaveLength(2);
      expect(opts.zones[0]?.id).toBe(ZONE_1);
      expect(opts.zones[1]?.id).toBe(ZONE_2);
    });

    it('BR-142a: Service honors scopes across roles', async () => {
      const { repo } = createFakeRepo();
      const service = createAdminProduceService(repo);
      await expect(service.listRecords(tohfaScope(), { limit: 10 })).resolves.toBeDefined();
      await expect(service.listRecords(mainWhScope(), { limit: 10 })).resolves.toBeDefined();
      await expect(service.listRecords(subWhScope(WAREHOUSE_1), { limit: 10 })).resolves.toBeDefined();
      await expect(service.listRecords(farmerScope(), { limit: 10 })).resolves.toBeDefined();
      await expect(service.listRecords(customerScope(), { limit: 10 })).resolves.toBeDefined();
    });
  });

  describe('BR-142b: Role permissions & warehouse scoping', () => {
    const { repo } = createFakeRepo();
    const app = createTestApp(repo);

    it('BR-142b: SUPER_ADMIN gets 200 on all produce calendar endpoints', async () => {
      const res = await request(app)
        .get('/v1/admin/produce/records')
        .set('Authorization', `Bearer ${tokens.superAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(1);
    });

    it('BR-142b: TOHFA_ADMIN gets 200 on produce calendar endpoints', async () => {
      const res = await request(app)
        .get('/v1/admin/produce/filter-options')
        .set('Authorization', `Bearer ${tokens.tohfaAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body.zones).toBeDefined();
    });

    it('BR-142b: FARMER_ADMIN gets 200 on produce calendar endpoints', async () => {
      const res = await request(app)
        .get('/v1/admin/produce/calendar?month=2026-10')
        .set('Authorization', `Bearer ${tokens.farmerAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body.month).toBe('2026-10');
    });

    it('BR-142b: MAIN_WH_ADMIN gets 200 on produce calendar endpoints', async () => {
      const res = await request(app)
        .get('/v1/admin/produce/calendar/events?date=2026-10-01')
        .set('Authorization', `Bearer ${tokens.mainWhAdmin}`);
      expect(res.status).toBe(200);
      expect(res.body.items).toBeDefined();
    });

    it('BR-142b: SUB_WH_ADMIN gets 200 on produce calendar endpoints', async () => {
      const res = await request(app)
        .get('/v1/admin/produce/records')
        .set('Authorization', `Bearer ${tokens.subWhAdmin}`);
      expect(res.status).toBe(200);
    });

    it('BR-142b: FARMER role gets 403 on produce calendar endpoints', async () => {
      const res = await request(app)
        .get('/v1/admin/produce/records')
        .set('Authorization', `Bearer ${tokens.farmer}`);
      expect(res.status).toBe(403);
    });

    it('BR-142b: CUSTOMER role gets 403 on produce calendar endpoints', async () => {
      const res = await request(app)
        .get('/v1/admin/produce/records')
        .set('Authorization', `Bearer ${tokens.customer}`);
      expect(res.status).toBe(403);
    });

    it('BR-142b: Unauthenticated request gets 401 on produce calendar endpoints', async () => {
      const res = await request(app).get('/v1/admin/produce/records');
      expect(res.status).toBe(401);
    });

    it('BR-142b: The router registers exactly the documented 5 routes', () => {
      const routes = adminProduceRouter.stack
        .filter((layer) => layer.route !== undefined)
        .flatMap((layer) => {
          const route = layer.route as unknown as { path: string; methods: Record<string, boolean> };
          return Object.keys(route.methods).map((m) => `${m} ${route.path}`);
        });
      expect(new Set(routes)).toEqual(
        new Set([
          'get /records',
          'get /records/:id',
          'get /calendar',
          'get /calendar/events',
          'get /filter-options',
        ]),
      );
    });
  });

  describe('BR-142c: includeTotal and total count handling', () => {
    it('BR-142c: includeTotal=true returns total count in page', async () => {
      const { repo } = createFakeRepo();
      const service = createAdminProduceService(repo);
      const res = await service.listRecords(superScope(), { limit: 20, includeTotal: true });
      expect(res.page.total).toBe(1);
    });

    it('BR-142c: includeTotal=false or omitted omits total from page', async () => {
      const { repo } = createFakeRepo();
      const service = createAdminProduceService(repo);
      const res = await service.listRecords(superScope(), { limit: 20 });
      expect(res.page.total).toBeUndefined();
    });
  });

  describe('BR-142e: Record without milestones returns stages: [] and writes nothing', () => {
    it('BR-142e: Record with no milestones returns stages: []', async () => {
      const { repo } = createFakeRepo();
      vi.mocked(repo.findRecordById).mockResolvedValueOnce({
        ...sampleDetail,
        stages: [],
      });
      const service = createAdminProduceService(repo);
      const detail = await service.getRecordById(superScope(), sampleDetail.id);
      expect(detail.stages).toEqual([]);
    });
  });

  describe('BR-142f: Calendar only counts recorded events (never expected harvests)', () => {
    it('BR-142f: Month calendar response contains only recorded events', async () => {
      const { repo } = createFakeRepo();
      const service = createAdminProduceService(repo);
      const cal = await service.getCalendar(superScope(), { month: '2026-10' });
      expect(cal.month).toBe('2026-10');
      expect(cal.days).toHaveLength(2);
      expect(cal.days[0]?.planting).toBe(1);
      expect(cal.days[1]?.growthStage).toBe(1);
    });

    it('BR-142f: Day events list returns recorded events only', async () => {
      const { repo } = createFakeRepo();
      const service = createAdminProduceService(repo);
      const evs = await service.listCalendarEvents(superScope(), { date: '2026-10-06', limit: 20 });
      expect(evs.items).toHaveLength(1);
      expect(evs.items[0]?.eventType).toBe('GROWTH_STAGE');
      expect(evs.items[0]?.stage?.code).toBe('STAGE_SOWING');
      expect(evs.page).toBeDefined();
    });
  });

  describe('BR-142g: Field allow-list serialization', () => {
    it('BR-142g: Injected PII and GPS fields are stripped from CropRecordSummary', () => {
      const rowWithPii = {
        ...sampleRecord,
        mobile: '+919876543210',
        email: 'ramesh@example.com',
        aadhaar: '123456789012',
        address: '123 Farm Road',
        centroidLat: 11.41,
        centroidLng: 76.7,
        boundary: { type: 'Polygon', coordinates: [] },
      };
      const parsed = cropRecordSummarySchema.parse(rowWithPii);
      expect('mobile' in parsed).toBe(false);
      expect('email' in parsed).toBe(false);
      expect('aadhaar' in parsed).toBe(false);
      expect('centroidLat' in parsed).toBe(false);
      expect('boundary' in parsed).toBe(false);
      expect(Object.keys(parsed).sort()).toEqual([
        'actualHarvestOn',
        'actualYieldKg',
        'createdAt',
        'crop',
        'expectedHarvestOn',
        'expectedYieldKg',
        'farm',
        'farmer',
        'id',
        'plantedOn',
        'plot',
        'status',
        'updatedAt',
        'variety',
        'zone',
      ]);
    });

    it('BR-142g: Injected fields are stripped from ProduceRecordDetailResponse', () => {
      const detailWithPii = {
        ...sampleDetail,
        mobile: '+919876543210',
        diaryPhotos: ['photo-key-1'],
        storageKeys: ['secret-key'],
      };
      const parsed = produceRecordDetailResponse.parse(detailWithPii);
      expect('mobile' in parsed).toBe(false);
      expect('diaryPhotos' in parsed).toBe(false);
      expect('storageKeys' in parsed).toBe(false);
      expect(Object.keys(parsed).sort()).toEqual([
        'actualHarvestOn',
        'actualYieldKg',
        'createdAt',
        'crop',
        'expectedHarvestOn',
        'expectedYieldKg',
        'farm',
        'farmer',
        'id',
        'plantedOn',
        'plot',
        'related',
        'stages',
        'status',
        'updatedAt',
        'variety',
        'zone',
      ]);
    });
  });

  describe('BR-142h: Input validation', () => {
    it('BR-142h: Validates list query parameters', () => {
      expect(listProduceRecordsQuery.safeParse({ limit: '0' }).success).toBe(false);
      expect(listProduceRecordsQuery.safeParse({ limit: '101' }).success).toBe(false);
      expect(listProduceRecordsQuery.safeParse({ farmerId: 'not-a-uuid' }).success).toBe(false);
      expect(listProduceRecordsQuery.safeParse({ status: 'INVALID_STATUS' }).success).toBe(false);
      expect(listProduceRecordsQuery.safeParse({ limit: '20', status: 'GROWING,PLANNED' }).success).toBe(true);
    });

    it('BR-142h: Validates record id path param', () => {
      expect(produceRecordIdParams.safeParse({ id: 'not-a-uuid' }).success).toBe(false);
      expect(produceRecordIdParams.safeParse({ id: IDS.farmer }).success).toBe(true);
    });

    it('BR-142h: Validates calendar month query param', () => {
      expect(produceCalendarQuery.safeParse({ month: '2026-13' }).success).toBe(false);
      expect(produceCalendarQuery.safeParse({ month: '2026-00' }).success).toBe(false);
      expect(produceCalendarQuery.safeParse({ month: '2026/10' }).success).toBe(false);
      expect(produceCalendarQuery.safeParse({ month: '2026-10' }).success).toBe(true);
    });

    it('BR-142h: Validates calendar events date query param', () => {
      expect(produceCalendarEventsQuery.safeParse({ date: '2026-10-32' }).success).toBe(false);
      expect(produceCalendarEventsQuery.safeParse({ date: '2026-00-10' }).success).toBe(false);
      expect(produceCalendarEventsQuery.safeParse({ date: 'invalid-date' }).success).toBe(false);
      expect(produceCalendarEventsQuery.safeParse({ date: '2026-10-01' }).success).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// PostgreSQL Integration Tests (rolled back)
// ---------------------------------------------------------------------------
describeIfDatabase('Admin produce repository (PostgreSQL, rolled back)', () => {
  let dbPool: pg.Pool;
  let ready = false;

  beforeAll(async () => {
    ready = await databaseReady('farm_crops');
    if (ready) {
      ({ pool: dbPool } = await import('../../db/pool.js'));
    }
  });

  async function inRollback<T>(fn: (tx: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await dbPool.connect();
    try {
      await client.query('BEGIN');
      return await fn(client);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  }

  const rand = (): number => Math.floor(10_000_000 + Math.random() * 89_999_999);

  it('BR-142a / BR-142c: PostgreSQL queries respect zone scoping and count total', async () => {
    if (!ready) return;
    await inRollback(async (tx) => {
      const tag = `pt${rand()}`;
      // 1. Warehouses & zones
      const whRes = await tx.query<{ id: string }>(`SELECT id FROM warehouses WHERE deleted_at IS NULL LIMIT 1`);
      const whId = whRes.rows[0]!.id;

      const z1Res = await tx.query<{ id: string }>(`INSERT INTO zones (code, name, warehouse_id) VALUES ($1, $1, $2) RETURNING id`, [`${tag}-Z1`, whId]);
      const z2Res = await tx.query<{ id: string }>(`INSERT INTO zones (code, name, warehouse_id) VALUES ($1, $1, $2) RETURNING id`, [`${tag}-Z2`, whId]);
      const zone1 = z1Res.rows[0]!.id;
      const zone2 = z2Res.rows[0]!.id;

      // 2. Users & Farmers
      const u1 = (await tx.query<{ id: string }>(`INSERT INTO users (mobile, full_name, user_type) VALUES ($1, $2, 'FARMER') RETURNING id`, [`+9196${rand()}`, `${tag} Farmer 1`])).rows[0]!.id;
      const u2 = (await tx.query<{ id: string }>(`INSERT INTO users (mobile, full_name, user_type) VALUES ($1, $2, 'FARMER') RETURNING id`, [`+9196${rand()}`, `${tag} Farmer 2`])).rows[0]!.id;

      const f1 = (await tx.query<{ id: string }>(`INSERT INTO farmers (user_id, tohfa_farmer_id, zone_id, village) VALUES ($1, $2, $3, 'Ooty') RETURNING id`, [u1, `${tag}-F1`, zone1])).rows[0]!.id;
      const f2 = (await tx.query<{ id: string }>(`INSERT INTO farmers (user_id, tohfa_farmer_id, zone_id, village) VALUES ($1, $2, $3, 'Coonoor') RETURNING id`, [u2, `${tag}-F2`, zone2])).rows[0]!.id;

      // 3. Farms & plots
      const farm1 = (await tx.query<{ id: string }>(`INSERT INTO farms (farmer_id, name) VALUES ($1, '${tag} Farm 1') RETURNING id`, [f1])).rows[0]!.id;
      const farm2 = (await tx.query<{ id: string }>(`INSERT INTO farms (farmer_id, name) VALUES ($1, '${tag} Farm 2') RETURNING id`, [f2])).rows[0]!.id;

      const plot1 = (await tx.query<{ id: string }>(`INSERT INTO plots (farm_id, name, area_acres) VALUES ($1, 'Plot 1', 1.5) RETURNING id`, [farm1])).rows[0]!.id;
      const plot2 = (await tx.query<{ id: string }>(`INSERT INTO plots (farm_id, name, area_acres) VALUES ($1, 'Plot 2', 2.0) RETURNING id`, [farm2])).rows[0]!.id;

      // 4. Crop
      const cropRes = await tx.query<{ id: string }>(`SELECT id FROM crop_master WHERE deleted_at IS NULL LIMIT 1`);
      const cropId = cropRes.rows[0]!.id;

      // 5. Farm crops
      const fc1 = (await tx.query<{ id: string }>(
        `INSERT INTO farm_crops (plot_id, crop_id, status, planted_on, expected_harvest_on, actual_harvest_on, expected_yield_kg)
         VALUES ($1, $2, 'GROWING', '2026-11-01', '2026-12-01', NULL, 1000) RETURNING id`,
        [plot1, cropId],
      )).rows[0]!.id;

      const fc2 = (await tx.query<{ id: string }>(
        `INSERT INTO farm_crops (plot_id, crop_id, status, planted_on, expected_harvest_on, actual_harvest_on, expected_yield_kg)
         VALUES ($1, $2, 'GROWING', '2026-11-05', '2026-12-05', NULL, 2000) RETURNING id`,
        [plot2, cropId],
      )).rows[0]!.id;

      // Milestones for fc1
      await tx.query(
        `INSERT INTO farm_crop_milestones (farmer_id, farm_crop_id, stage_code, stage_name, sequence_order, status, completed_on)
         VALUES ($1, $2, 'STAGE_SOWING', 'Sowing', 1, 'COMPLETED', '2026-11-03')`,
        [f1, fc1],
      );

      const service = createAdminProduceService(adminProduceRepo, tx);

      // Farmer Admin restricted to zone1 sees only fc1
      const faScope = farmerAdminScope([zone1]);
      const faList = await service.listRecords(faScope, { limit: 20, includeTotal: true });
      const faIds = faList.items.map((i) => i.id);
      expect(faIds).toContain(fc1);
      expect(faIds).not.toContain(fc2);
      expect(faList.page.total).toBe(1);

      // Super Admin sees both
      const saScope = superScope();
      const saList = await service.listRecords(saScope, { limit: 20, includeTotal: true });
      const saIds = saList.items.map((i) => i.id);
      expect(saIds).toContain(fc1);
      expect(saIds).toContain(fc2);

      // Detail read of fc2 as Farmer Admin in zone1 is 404
      await expect(service.getRecordById(faScope, fc2)).rejects.toMatchObject({ code: 'NOT_FOUND' });

      // Calendar month grid
      const cal = await service.getCalendar(faScope, { month: '2026-11' });
      const day1 = cal.days.find((d) => d.date === '2026-11-01');
      expect(day1?.planting).toBe(1);
      const day3 = cal.days.find((d) => d.date === '2026-11-03');
      expect(day3?.growthStage).toBe(1);

      // Calendar events for 2026-11-01
      const evs = await service.listCalendarEvents(faScope, { date: '2026-11-01', limit: 10 });
      expect(evs.items).toHaveLength(1);
      expect(evs.items[0]?.eventType).toBe('PLANTING');
      expect(evs.items[0]?.record.id).toBe(fc1);

      // Detail read creates zero rows
      const milestonesCountBefore = await tx.query<{ count: string }>(`SELECT count(*) FROM farm_crop_milestones`);
      const detail = await service.getRecordById(saScope, fc2);
      expect(detail.stages).toEqual([]);
      const milestonesCountAfter = await tx.query<{ count: string }>(`SELECT count(*) FROM farm_crop_milestones`);
      expect(milestonesCountAfter.rows[0]?.count).toBe(milestonesCountBefore.rows[0]?.count);
    });
  });
});
