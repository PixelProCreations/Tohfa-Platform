import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import type {
  CalendarAuditItem,
  CalendarCertificateItem,
  CalendarCropHarvestItem,
  CalendarPlatformEventRecord,
  CalendarRepo,
} from './calendar.repo.js';
import {
  calendarQuery,
  createPlatformEventBody,
  listPlatformEventsQuery,
  updatePlatformEventBody,
} from './calendar.schema.js';
import { createCalendarService } from './calendar.service.js';

const FARMER_A = IDS.farmer;
const FARMER_B = '30000000-0000-4000-8000-000000000002';

function farmerScope(farmerId: string, permission = 'farmer.calendar.view_own'): ResolvedScope {
  return aScope({
    level: ScopeLevel.OWN,
    farmerId,
    userId: newId(),
    roleCode: RoleCode.FARMER,
    permission,
  });
}

function adminScope(): ResolvedScope {
  return aScope({
    level: ScopeLevel.ALL,
    userId: newId(),
    roleCode: RoleCode.TOHFA_ADMIN,
    permission: 'platform.event.manage',
  });
}

interface FakeDbState {
  events: Map<string, CalendarPlatformEventRecord & { deletedAt: string | null }>;
  audits: Array<CalendarAuditItem & { farmerId: string }>;
  certificates: Array<CalendarCertificateItem & { farmerId: string }>;
  cropHarvests: Array<CalendarCropHarvestItem & { farmerId: string }>;
  auditLogs: unknown[][];
  maxRangeDays: number;
  listArgs: Array<{ page: number; limit: number }>;
}

function createFakeRepo(state: FakeDbState): CalendarRepo {
  return {
    async getCalendarMaxRangeDays(_db) {
      return state.maxRangeDays;
    },

    async listPlatformEventsForFarmer(_db, from, to) {
      return Array.from(state.events.values())
        .filter((e) => e.deletedAt === null && e.isPublished && e.eventDate >= from && e.eventDate <= to && (e.targetAudience === 'ALL' || e.targetAudience === 'FARMER'))
        .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    },

    async listAuditsForFarmer(_db, farmerId, from, to) {
      return state.audits
        .filter((a) => a.farmerId === farmerId && a.scheduledFor >= from && a.scheduledFor <= to)
        .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
    },

    async listCertificateExpiriesForFarmer(_db, farmerId, from, to) {
      return state.certificates
        .filter((c) => c.farmerId === farmerId && c.expiresOn >= from && c.expiresOn <= to)
        .sort((a, b) => a.expiresOn.localeCompare(b.expiresOn));
    },

    async listCropHarvestsForFarmer(_db, farmerId, from, to) {
      return state.cropHarvests
        .filter((c) => c.farmerId === farmerId && c.expectedHarvestOn >= from && c.expectedHarvestOn <= to)
        .sort((a, b) => a.expectedHarvestOn.localeCompare(b.expectedHarvestOn));
    },

    async listAllPlatformEvents(_db, args) {
      state.listArgs.push(args);
      const all = Array.from(state.events.values())
        .filter((e) => e.deletedAt === null)
        .sort((a, b) => b.eventDate.localeCompare(a.eventDate));
      const offset = (args.page - 1) * args.limit;
      return { rows: all.slice(offset, offset + args.limit), total: all.length };
    },

    async findPlatformEventById(_db, id) {
      const e = state.events.get(id);
      if (!e || e.deletedAt !== null) return null;
      return { ...e };
    },

    async createPlatformEvent(_db, data) {
      const id = newId();
      const rec: CalendarPlatformEventRecord & { deletedAt: string | null } = {
        id,
        title: data.title,
        description: data.description ?? null,
        eventType: data.eventType,
        eventDate: data.eventDate,
        startTime: data.startTime ?? null,
        endTime: data.endTime ?? null,
        locationName: data.locationName ?? null,
        targetAudience: data.targetAudience ?? 'ALL',
        isPublished: data.isPublished ?? true,
        createdAt: new Date().toISOString(),
        updatedAt: null,
        deletedAt: null,
      };
      state.events.set(id, rec);
      return { ...rec };
    },

    async updatePlatformEvent(_db, id, patch) {
      const e = state.events.get(id);
      if (!e || e.deletedAt !== null) return null;
      if (patch.title !== undefined) e.title = patch.title;
      if ('description' in patch) e.description = patch.description ?? null;
      if (patch.eventType !== undefined) e.eventType = patch.eventType;
      if (patch.eventDate !== undefined) e.eventDate = patch.eventDate;
      if ('startTime' in patch) e.startTime = patch.startTime ?? null;
      if ('endTime' in patch) e.endTime = patch.endTime ?? null;
      if ('locationName' in patch) e.locationName = patch.locationName ?? null;
      if (patch.targetAudience !== undefined) e.targetAudience = patch.targetAudience;
      if (patch.isPublished !== undefined) e.isPublished = patch.isPublished;
      e.updatedAt = new Date().toISOString();
      return { ...e };
    },

    async softDeletePlatformEvent(_db, id) {
      const e = state.events.get(id);
      if (!e || e.deletedAt !== null) return false;
      e.deletedAt = new Date().toISOString();
      return true;
    },
  };
}

function createTestContext() {
  const state: FakeDbState = {
    events: new Map(),
    audits: [],
    certificates: [],
    cropHarvests: [],
    auditLogs: [],
    maxRangeDays: 366,
    listArgs: [],
  };
  const repo = createFakeRepo(state);
  const fakeTx: Executor = {
    query: async (_sql: string, params?: unknown[]) => {
      state.auditLogs.push(params ?? []);
      return { rows: [{ id: newId() }], rowCount: 1 } as never;
    },
  };
  const service = createCalendarService({
    repo,
    db: fakeTx,
    runTx: async (fn) => fn(fakeTx),
  });

  return { state, repo, service, audits: state.auditLogs };
}

describe('Tohfa Calendar (BR-58)', () => {
  it('BR-58a: schema rejects from > to, impossible dates and non-ISO dates', () => {
    expect(calendarQuery.safeParse({ from: '2026-10-15', to: '2026-10-10' }).success).toBe(false);
    // 2026-02-30 matched the old regex and reached Postgres as a 500.
    expect(calendarQuery.safeParse({ from: '2026-02-30', to: '2026-03-10' }).success).toBe(false);
    expect(calendarQuery.safeParse({ from: '2026-03-01', to: '2026-04-31' }).success).toBe(false);
    expect(calendarQuery.safeParse({ from: '2026-3-1', to: '2026-03-10' }).success).toBe(false);
    expect(calendarQuery.safeParse({ from: '2026-10-01', to: '2026-10-31' }).success).toBe(true);
    // The span cap is a system_config value enforced by the service, not the schema.
    expect(calendarQuery.safeParse({ from: '2026-01-01', to: '2028-01-01' }).success).toBe(true);
  });

  it('BR-58a: service rejects a range over the default 366 days with 422 on query.to', async () => {
    const { service } = createTestContext();
    const scope = farmerScope(FARMER_A);

    // 2026-01-01 -> 2027-01-02 is exactly 366 days apart: accepted.
    await expect(
      service.getFarmerCalendar(scope, { from: '2026-01-01', to: '2027-01-02' }),
    ).resolves.toBeDefined();

    // One day more is refused.
    const err = await service
      .getFarmerCalendar(scope, { from: '2026-01-01', to: '2027-01-03' })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).code).toBe('VALIDATION_FAILED');
    expect((err as AppError).errors).toHaveProperty('query.to');
  });

  it('BR-58a: the range boundary follows system_config (30 days)', async () => {
    const { service, state } = createTestContext();
    state.maxRangeDays = 30;
    const scope = farmerScope(FARMER_A);

    await expect(
      service.getFarmerCalendar(scope, { from: '2026-10-01', to: '2026-10-31' }),
    ).resolves.toBeDefined();
    await expect(
      service.getFarmerCalendar(scope, { from: '2026-10-01', to: '2026-11-01' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('BR-58b: aggregates multi-domain events chronologically', async () => {
    const { service, state, repo } = createTestContext();
    const scope = farmerScope(FARMER_A);

    // 1. Audit on 2026-10-12
    state.audits.push({
      id: 'a1',
      farmerId: FARMER_A,
      auditType: 'INTERNAL',
      scheduledFor: '2026-10-12',
      status: 'SCHEDULED',
      farmId: 'f1',
      quarter: 3,
      fiscalYear: '2026-27',
    });

    // 2. Certificate expiry on 2026-10-25
    state.certificates.push({
      id: 'c1',
      farmerId: FARMER_A,
      certType: 'PGS',
      customTypeName: null,
      certNumber: 'PGS-1234',
      expiresOn: '2026-10-25',
    });

    // 3. Crop harvest on 2026-10-08
    state.cropHarvests.push({
      id: 'h1',
      farmerId: FARMER_A,
      cropName: 'Nilgiri Carrot',
      expectedHarvestOn: '2026-10-08',
      status: 'GROWING',
      plotName: 'East Plot',
    });

    // 4. Platform event on 2026-10-18
    await repo.createPlatformEvent({} as Executor, {
      title: 'Farmer Training Workshop',
      eventType: 'TRAINING',
      eventDate: '2026-10-18',
      targetAudience: 'FARMER',
      isPublished: true,
    });

    const calendar = await service.getFarmerCalendar(scope, {
      from: '2026-10-01',
      to: '2026-10-31',
    });

    expect(calendar.items.length).toBe(4);
    // Ordered chronologically:
    expect(calendar.items[0]?.date).toBe('2026-10-08');
    expect(calendar.items[0]?.category).toBe('CROP_HARVEST');

    expect(calendar.items[1]?.date).toBe('2026-10-12');
    expect(calendar.items[1]?.category).toBe('AUDIT');

    expect(calendar.items[2]?.date).toBe('2026-10-18');
    expect(calendar.items[2]?.category).toBe('PLATFORM_EVENT');

    expect(calendar.items[3]?.date).toBe('2026-10-25');
    expect(calendar.items[3]?.category).toBe('CERTIFICATE_EXPIRY');
  });

  it('BR-58c: strictly scopes farmer calendar events to caller farmer profile (BR-36)', async () => {
    const { service, state } = createTestContext();
    const scopeA = farmerScope(FARMER_A);
    const scopeB = farmerScope(FARMER_B);

    // Farmer A audit
    state.audits.push({
      id: 'a1',
      farmerId: FARMER_A,
      auditType: 'INTERNAL',
      scheduledFor: '2026-10-15',
      status: 'SCHEDULED',
      farmId: 'f1',
      quarter: 3,
      fiscalYear: '2026-27',
    });

    // Farmer B audit
    state.audits.push({
      id: 'a2',
      farmerId: FARMER_B,
      auditType: 'EXTERNAL',
      scheduledFor: '2026-10-20',
      status: 'SCHEDULED',
      farmId: 'f2',
      quarter: 3,
      fiscalYear: '2026-27',
    });

    const calA = await service.getFarmerCalendar(scopeA, { from: '2026-10-01', to: '2026-10-31' });
    expect(calA.items.length).toBe(1);
    expect(calA.items[0]?.id).toBe('audit-a1');

    const calB = await service.getFarmerCalendar(scopeB, { from: '2026-10-01', to: '2026-10-31' });
    expect(calB.items.length).toBe(1);
    expect(calB.items[0]?.id).toBe('audit-a2');
  });

  it('BR-58d: rejects non-farmer roles attempting to view farmer calendar with 403', async () => {
    const { service } = createTestContext();
    const admin = adminScope();

    await expect(
      service.getFarmerCalendar(admin, { from: '2026-10-01', to: '2026-10-31' }),
    ).rejects.toThrowError(AppError);
  });

  it('BR-58e: provides admin CRUD for platform events with audit logging and soft delete (BR-35)', async () => {
    const { service, audits } = createTestContext();
    const admin = adminScope();

    const created = await service.createPlatformEvent(admin, {
      title: 'Tohfa Organic Seed Exchange',
      eventType: 'COMMUNITY_MEET',
      eventDate: '2026-11-15',
      targetAudience: 'ALL',
      isPublished: true,
    });
    expect(created.title).toBe('Tohfa Organic Seed Exchange');
    expect(audits.some((a) => a[3] === 'platform_event.create')).toBe(true);

    const updated = await service.updatePlatformEvent(admin, created.id, {
      title: 'Tohfa Organic Seed & Sapling Exchange',
    });
    expect(updated.title).toBe('Tohfa Organic Seed & Sapling Exchange');
    expect(audits.some((a) => a[3] === 'platform_event.update')).toBe(true);

    await service.deletePlatformEvent(admin, created.id);
    expect(audits.some((a) => a[3] === 'platform_event.delete')).toBe(true);

    // After soft-delete, get throws NOT_FOUND
    await expect(service.getPlatformEvent(admin, created.id)).rejects.toThrowError(AppError);
  });
  it('BR-58b: a certificate of type OTHER is titled with its custom type name', async () => {
    const { service, state } = createTestContext();
    state.certificates.push({
      id: 'c-other',
      farmerId: FARMER_A,
      certType: 'OTHER',
      customTypeName: 'Biodynamic Demeter',
      certNumber: 'D-1',
      expiresOn: '2026-10-25',
    });
    state.certificates.push({
      id: 'c-pgs',
      farmerId: FARMER_A,
      certType: 'PGS',
      customTypeName: null,
      certNumber: 'P-1',
      expiresOn: '2026-10-26',
    });
    const cal = await service.getFarmerCalendar(farmerScope(FARMER_A), {
      from: '2026-10-01',
      to: '2026-10-31',
    });
    expect(cal.items[0]?.title).toBe('Certificate Expiry: Biodynamic Demeter');
    expect(cal.items[1]?.title).toBe('Certificate Expiry: PGS');
  });

  it('BR-58h: platform event dates must be real calendar dates', () => {
    const base = { title: 'Workshop', eventType: 'WORKSHOP' as const };
    expect(createPlatformEventBody.safeParse({ ...base, eventDate: '2026-02-30' }).success).toBe(false);
    expect(createPlatformEventBody.safeParse({ ...base, eventDate: '2026-02-28' }).success).toBe(true);
    expect(updatePlatformEventBody.safeParse({ eventDate: '2026-13-01' }).success).toBe(false);
  });

  it('BR-58h: startTime and endTime are HH:MM 24h and end is after start', () => {
    const base = { title: 'Workshop', eventType: 'WORKSHOP' as const, eventDate: '2026-11-01' };
    expect(createPlatformEventBody.safeParse({ ...base, startTime: '09:30' }).success).toBe(true);
    expect(createPlatformEventBody.safeParse({ ...base, startTime: '9am' }).success).toBe(false);
    expect(createPlatformEventBody.safeParse({ ...base, startTime: '24:00' }).success).toBe(false);
    expect(createPlatformEventBody.safeParse({ ...base, endTime: '10:75' }).success).toBe(false);
    expect(
      createPlatformEventBody.safeParse({ ...base, startTime: '10:00', endTime: '11:00' }).success,
    ).toBe(true);
    expect(
      createPlatformEventBody.safeParse({ ...base, startTime: '10:00', endTime: '10:00' }).success,
    ).toBe(false);
    expect(
      createPlatformEventBody.safeParse({ ...base, startTime: '10:00', endTime: '09:00' }).success,
    ).toBe(false);
    expect(
      updatePlatformEventBody.safeParse({ startTime: '10:00', endTime: '09:00' }).success,
    ).toBe(false);
    expect(updatePlatformEventBody.safeParse({ startTime: null, endTime: '09:00' }).success).toBe(true);
  });

  it('BR-58h: an update that moves only endTime before the stored startTime is a 422 on body.endTime', async () => {
    const { service } = createTestContext();
    const admin = adminScope();
    const created = await service.createPlatformEvent(admin, {
      title: 'Seed fair',
      eventType: 'MARKET_DAY',
      eventDate: '2026-11-15',
      startTime: '10:00',
      endTime: '12:00',
      targetAudience: 'ALL',
      isPublished: true,
    });
    const err = await service
      .updatePlatformEvent(admin, created.id, { endTime: '09:00' })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).code).toBe('VALIDATION_FAILED');
    expect((err as AppError).errors).toHaveProperty('body.endTime');

    await expect(
      service.updatePlatformEvent(admin, created.id, { endTime: '13:00' }),
    ).resolves.toMatchObject({ endTime: '13:00' });
  });

  it('BR-58i: platform event list is paged (default 1/20, max 100) and reports the total', async () => {
    expect(listPlatformEventsQuery.parse({})).toEqual({ page: 1, limit: 20 });
    expect(listPlatformEventsQuery.safeParse({ limit: '101' }).success).toBe(false);
    expect(listPlatformEventsQuery.safeParse({ page: '0' }).success).toBe(false);

    const { service } = createTestContext();
    const admin = adminScope();
    for (const day of ['01', '02', '03']) {
      await service.createPlatformEvent(admin, {
        title: `Event ${day}`,
        eventType: 'OTHER',
        eventDate: `2026-12-${day}`,
        targetAudience: 'ALL',
        isPublished: true,
      });
    }
    const page2 = await service.listPlatformEvents(admin, { page: 2, limit: 2 });
    expect(page2.total).toBe(3);
    expect(page2.page).toBe(2);
    expect(page2.limit).toBe(2);
    expect(page2.items).toHaveLength(1);
    expect(page2.items[0]?.title).toBe('Event 01');
  });
});

// ---------------------------------------------------------------------------
// Real-database tests. The fake repo above filters by farmer and audience itself,
// so it cannot prove the SQL does. Every fixture lives in a transaction that is
// rolled back.
// ---------------------------------------------------------------------------

const ROLLBACK = '__rollback_test_fixture__';

describeIfDatabase('calendarRepo (integration)', () => {
  let ready = false;

  beforeAll(async () => {
    ready = await databaseReady('platform_events');
    if (!ready) console.warn('[skip] platform_events not migrated -- run `pnpm db:migrate`');
  });

  afterAll(async () => {
    if (!ready) return;
    const { closePool } = await import('../../db/pool.js');
    await closePool();
  });

  async function inRolledBackTx(fn: (tx: Executor) => Promise<void>): Promise<void> {
    const { withTransaction } = await import('../../db/pool.js');
    await withTransaction(async (tx) => {
      await fn(tx);
      throw new Error(ROLLBACK);
    }).catch((error: unknown) => {
      if (!(error instanceof Error) || error.message !== ROLLBACK) throw error;
    });
  }

  async function insertFarmer(tx: Executor, tag: string): Promise<string> {
    const mobile = `+9198${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`;
    const user = await tx.query<{ id: string }>(
      `INSERT INTO users (mobile, full_name, user_type) VALUES ($1, $2, 'FARMER') RETURNING id`,
      [mobile, `Calendar ${tag}`],
    );
    const farmer = await tx.query<{ id: string }>(
      `INSERT INTO farmers (user_id, tohfa_farmer_id) VALUES ($1, $2) RETURNING id`,
      [user.rows[0]!.id, `CAL-${tag}-${Math.floor(Math.random() * 1e9)}`],
    );
    return farmer.rows[0]!.id;
  }

  async function insertAudit(tx: Executor, farmerId: string, scheduledFor: string, quarter: number): Promise<string> {
    const res = await tx.query<{ id: string }>(
      `INSERT INTO audits (farmer_id, fiscal_year, quarter, audit_type, scheduled_for, created_by)
       VALUES ($1, '2026-27', $2, 'INTERNAL', $3::timestamptz,
               (SELECT user_id FROM farmers WHERE id = $1)) RETURNING id`,
      [farmerId, quarter, scheduledFor],
    );
    return res.rows[0]!.id;
  }

  async function insertEvent(
    tx: Executor,
    title: string,
    over: { audience?: string; published?: boolean; deleted?: boolean; date?: string },
  ): Promise<string> {
    const res = await tx.query<{ id: string }>(
      `INSERT INTO platform_events (title, event_type, event_date, target_audience, is_published, deleted_at)
       VALUES ($1, 'WORKSHOP', $2::date, $3, $4, CASE WHEN $5::boolean THEN now() END) RETURNING id`,
      [title, over.date ?? '2026-10-20', over.audience ?? 'ALL', over.published ?? true, over.deleted ?? false],
    );
    return res.rows[0]!.id;
  }

  it('BR-58c: the SQL returns only the caller farmer\'s audits, certificates and crop harvests', async () => {
    if (!ready) return;
    const { calendarRepo } = await import('./calendar.repo.js');
    await inRolledBackTx(async (tx) => {
      const a = await insertFarmer(tx, 'A');
      const b = await insertFarmer(tx, 'B');
      const crop = await tx.query<{ id: string }>('SELECT id FROM crop_master LIMIT 1');
      const cropId = crop.rows[0]!.id;

      const ids: Record<string, { audit: string; cert: string; crop: string }> = {};
      let quarter = 1;
      for (const [key, farmerId] of [['A', a], ['B', b]] as const) {
        const audit = await insertAudit(tx, farmerId, '2026-10-15T06:00:00Z', quarter++);
        const cert = await tx.query<{ id: string }>(
          `INSERT INTO certifications (farmer_id, cert_type, cert_number, issuing_body, issued_on, expires_on)
           VALUES ($1, 'PGS', $2, 'Body', '2025-10-01', '2026-10-16') RETURNING id`,
          [farmerId, `CAL-${key}-${Math.floor(Math.random() * 1e9)}`],
        );
        const farm = await tx.query<{ id: string }>(
          `INSERT INTO farms (farmer_id, name) VALUES ($1, $2) RETURNING id`,
          [farmerId, `Farm ${key}`],
        );
        const plot = await tx.query<{ id: string }>(
          `INSERT INTO plots (farm_id, name) VALUES ($1, $2) RETURNING id`,
          [farm.rows[0]!.id, `Plot ${key}`],
        );
        const fc = await tx.query<{ id: string }>(
          `INSERT INTO farm_crops (plot_id, crop_id, status, expected_harvest_on)
           VALUES ($1, $2, 'GROWING', '2026-10-17') RETURNING id`,
          [plot.rows[0]!.id, cropId],
        );
        ids[key] = { audit, cert: cert.rows[0]!.id, crop: fc.rows[0]!.id };
      }

      const audits = await calendarRepo.listAuditsForFarmer(tx, a, '2026-10-01', '2026-10-31');
      const certs = await calendarRepo.listCertificateExpiriesForFarmer(tx, a, '2026-10-01', '2026-10-31');
      const crops = await calendarRepo.listCropHarvestsForFarmer(tx, a, '2026-10-01', '2026-10-31');
      expect(audits.map((r) => r.id)).toEqual([ids['A']!.audit]);
      expect(certs.map((r) => r.id)).toEqual([ids['A']!.cert]);
      expect(crops.map((r) => r.id)).toEqual([ids['A']!.crop]);

      const bAudits = await calendarRepo.listAuditsForFarmer(tx, b, '2026-10-01', '2026-10-31');
      expect(bAudits.map((r) => r.id)).toEqual([ids['B']!.audit]);
    });
  });

  it('BR-58c: CUSTOMER-audience, unpublished and deleted platform events never reach the farmer calendar', async () => {
    if (!ready) return;
    const { calendarRepo } = await import('./calendar.repo.js');
    await inRolledBackTx(async (tx) => {
      const all = await insertEvent(tx, 'all', { audience: 'ALL' });
      const farmer = await insertEvent(tx, 'farmer', { audience: 'FARMER' });
      const customer = await insertEvent(tx, 'customer', { audience: 'CUSTOMER' });
      const draft = await insertEvent(tx, 'draft', { published: false });
      const gone = await insertEvent(tx, 'deleted', { deleted: true });

      const rows = await calendarRepo.listPlatformEventsForFarmer(tx, '2026-10-01', '2026-10-31');
      const seen = rows.map((r) => r.id);
      expect(seen).toContain(all);
      expect(seen).toContain(farmer);
      for (const excluded of [customer, draft, gone]) expect(seen).not.toContain(excluded);
      expect(rows.every((r) => r.targetAudience !== 'CUSTOMER')).toBe(true);
    });
  });

  it('BR-58f: audit days are Asia/Kolkata days (20:00 UTC on the 9th is the 10th)', async () => {
    if (!ready) return;
    const { calendarRepo } = await import('./calendar.repo.js');
    await inRolledBackTx(async (tx) => {
      const f = await insertFarmer(tx, 'K');
      // 2026-10-09 20:00 UTC = 2026-10-10 01:30 IST
      const late = await insertAudit(tx, f, '2026-10-09T20:00:00Z', 1);
      // 2026-10-09 18:29:59 UTC = 2026-10-09 23:59:59 IST, the last second of the 9th
      const edge = await insertAudit(tx, f, '2026-10-09T18:29:59Z', 2);

      const on9 = await calendarRepo.listAuditsForFarmer(tx, f, '2026-10-09', '2026-10-09');
      const on10 = await calendarRepo.listAuditsForFarmer(tx, f, '2026-10-10', '2026-10-10');
      expect(on9.map((r) => r.id)).toEqual([edge]);
      expect(on10.map((r) => r.id)).toEqual([late]);
      expect(on10[0]?.scheduledFor).toBe('2026-10-10');
    });
  });

  it('BR-58a: the seeded calendar_max_range_days row exists and is what the repo reads', async () => {
    if (!ready) return;
    const { pool } = await import('../../db/pool.js');
    const { calendarRepo } = await import('./calendar.repo.js');
    const row = await pool.query<{ value: unknown }>(
      `SELECT value FROM system_config WHERE key = 'calendar_max_range_days'`,
    );
    expect(row.rows[0]?.value).toBe(366);
    expect(await calendarRepo.getCalendarMaxRangeDays(pool)).toBe(366);

    await inRolledBackTx(async (tx) => {
      await tx.query(`UPDATE system_config SET value = '30'::jsonb WHERE key = 'calendar_max_range_days'`);
      expect(await calendarRepo.getCalendarMaxRangeDays(tx)).toBe(30);
      await tx.query(`DELETE FROM system_config WHERE key = 'calendar_max_range_days'`);
      expect(await calendarRepo.getCalendarMaxRangeDays(tx)).toBe(366);
    });
  });

  it('BR-58i: listAllPlatformEvents pages in a stable order and counts live rows only', async () => {
    if (!ready) return;
    const { calendarRepo } = await import('./calendar.repo.js');
    await inRolledBackTx(async (tx) => {
      const before = await calendarRepo.listAllPlatformEvents(tx, { page: 1, limit: 100 });
      const a = await insertEvent(tx, 'p-a', { date: '2031-01-03' });
      const b = await insertEvent(tx, 'p-b', { date: '2031-01-02' });
      const c = await insertEvent(tx, 'p-c', { date: '2031-01-01' });
      await insertEvent(tx, 'p-gone', { date: '2031-01-04', deleted: true });

      const p1 = await calendarRepo.listAllPlatformEvents(tx, { page: 1, limit: 2 });
      const p2 = await calendarRepo.listAllPlatformEvents(tx, { page: 2, limit: 2 });
      expect(p1.total).toBe(before.total + 3);
      expect(p1.rows.map((r) => r.id)).toEqual([a, b]);
      expect(p2.rows.map((r) => r.id).slice(0, 1)).toEqual([c]);
    });
  });

  it('BR-58b: a certificate of type OTHER carries its custom type name from the database', async () => {
    if (!ready) return;
    const { calendarRepo } = await import('./calendar.repo.js');
    await inRolledBackTx(async (tx) => {
      const f = await insertFarmer(tx, 'O');
      await tx.query(
        `INSERT INTO certifications (farmer_id, cert_type, custom_type_name, cert_number, issuing_body, issued_on, expires_on)
         VALUES ($1, 'OTHER', 'Biodynamic Demeter', $2, 'Body', '2025-10-01', '2026-10-16')`,
        [f, `CAL-O-${Math.floor(Math.random() * 1e9)}`],
      );
      const certs = await calendarRepo.listCertificateExpiriesForFarmer(tx, f, '2026-10-01', '2026-10-31');
      expect(certs[0]?.certType).toBe('OTHER');
      expect(certs[0]?.customTypeName).toBe('Biodynamic Demeter');
    });
  });
});
