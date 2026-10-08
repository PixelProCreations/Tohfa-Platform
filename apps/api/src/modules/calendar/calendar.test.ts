import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, IDS, newId } from '../../test/factories.js';
import type {
  CalendarAuditItem,
  CalendarCertificateItem,
  CalendarCropHarvestItem,
  CalendarPlatformEventRecord,
  CalendarRepo,
} from './calendar.repo.js';
import { calendarQuery } from './calendar.schema.js';
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
}

function createFakeRepo(state: FakeDbState): CalendarRepo {
  return {
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

    async listAllPlatformEvents(_db) {
      return Array.from(state.events.values())
        .filter((e) => e.deletedAt === null)
        .sort((a, b) => b.eventDate.localeCompare(a.eventDate));
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
  it('BR-58a schema rejects from > to or date ranges over 366 days', () => {
    // from > to fails
    const invalidOrder = calendarQuery.safeParse({ from: '2026-10-15', to: '2026-10-10' });
    expect(invalidOrder.success).toBe(false);

    // Range over 366 days fails
    const tooLong = calendarQuery.safeParse({ from: '2026-01-01', to: '2027-02-01' });
    expect(tooLong.success).toBe(false);

    // Valid range passes
    const valid = calendarQuery.safeParse({ from: '2026-10-01', to: '2026-10-31' });
    expect(valid.success).toBe(true);
  });

  it('BR-58b aggregates multi-domain events chronologically', async () => {
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
      certType: 'PGS_GREEN',
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

  it('BR-58c strictly scopes farmer calendar events to caller farmer profile (BR-36)', async () => {
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

  it('BR-58d rejects non-farmer roles attempting to view farmer calendar with 403', async () => {
    const { service } = createTestContext();
    const admin = adminScope();

    await expect(
      service.getFarmerCalendar(admin, { from: '2026-10-01', to: '2026-10-31' }),
    ).rejects.toThrowError(AppError);
  });

  it('BR-58e provides admin CRUD for platform events with audit logging and soft delete (BR-35)', async () => {
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
});
