import { describe, expect, it, vi } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { aScope, IDS } from '../../test/factories.js';
import type { AdminPickupPointRow, AdminPickupPointsRepo } from './pickup-points.admin.repo.js';
import { normalisePhone, updatePickupPointBody } from './pickup-points.admin.schema.js';
import { createAdminPickupPointsService } from './pickup-points.admin.service.js';
import { isOpenNow, parseHours } from './pickup-points.service.js';

const audit = vi.hoisted(() => vi.fn(async () => 'audit-id'));
vi.mock('../../audit/auditLog.js', async (orig) => ({
  ...(await orig<typeof import('../../audit/auditLog.js')>()),
  writeAuditLog: audit,
}));

const day = { closed: false as const, open: '09:00', close: '18:00' };
const HOURS = { mon: day, tue: day, wed: day, thu: day, fri: day, sat: day, sun: { closed: true as const } };

function fakeRepo(initial: Partial<AdminPickupPointRow> = {}) {
  const rows: AdminPickupPointRow[] = [
    { id: IDS.warehouseOoty, name: 'Ooty', address: 'a', public_phone: null, is_public: false, is_active: true, operating_hours: null, ...initial },
    { id: IDS.warehouseCoonoor, name: 'Coonoor', address: 'b', public_phone: null, is_public: false, is_active: true, operating_hours: null },
  ];
  const repo: AdminPickupPointsRepo = {
    async list(_db, f) { return f.params.length ? rows.filter((r) => (f.params[0] as string[]).includes(r.id)) : rows; },
    async lockOne(_db, id, f) {
      const ok = f.params.length === 0 || (f.params[0] as string[]).includes(id);
      return rows.find((r) => r.id === id && ok) ?? null;
    },
    async update(_db, id, p) { const r = rows.find((x) => x.id === id)!; Object.assign(r, p); return r; },
  };
  return repo;
}
const svc = (repo: AdminPickupPointsRepo) =>
  createAdminPickupPointsService({ repo, db: {} as Executor, transaction: (fn) => fn({} as Executor) });
const SA = aScope({ permission: 'pickup_point.manage' });
const SUB = aScope({
  permission: 'pickup_point.manage', level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [IDS.warehouseOoty],
});

describe('BR-185: phone and hours validation', () => {
  it('normalises Indian mobile/landline to E.164 and rejects junk', () => {
    expect(normalisePhone('98765 43210')).toBe('+919876543210');
    expect(normalisePhone('+91-9876543210')).toBe('+919876543210');
    expect(normalisePhone('0423 2441234')).toBe('+914232441234');
    expect(normalisePhone('+14155550123')).toBe('+14155550123');
    for (const bad of ['12345', '+911234567890', 'abc', '+91 98765', '']) expect(normalisePhone(bad)).toBeNull();
  });
  it('body: strict, needs a field, validates hours shape and order', () => {
    expect(updatePickupPointBody.safeParse({}).success).toBe(false);
    expect(updatePickupPointBody.safeParse({ code: 'x' }).success).toBe(false);
    expect(updatePickupPointBody.safeParse({ publicPhone: 'nope' }).success).toBe(false);
    expect(updatePickupPointBody.safeParse({ openingHours: { ...HOURS, mon: { closed: false, open: '9:00', close: '18:00' } } }).success).toBe(false);
    expect(updatePickupPointBody.safeParse({ openingHours: { ...HOURS, mon: { closed: false, open: '18:00', close: '09:00' } } }).success).toBe(false);
    const ok = updatePickupPointBody.parse({ publicPhone: '9876543210', openingHours: HOURS });
    expect(ok.publicPhone).toBe('+919876543210');
  });
  it('accepted hours are exactly what isOpenNow consumes', () => {
    const parsed = updatePickupPointBody.parse({ openingHours: HOURS }).openingHours;
    expect(isOpenNow(parseHours(parsed), new Date('2026-11-16T05:00:00Z'))).toBe(true);
  });
});

describe('BR-185: admin service', () => {
  it('lists non-public points, scoped for a sub admin', async () => {
    const repo = fakeRepo();
    expect((await svc(repo).list(SA)).items).toHaveLength(2);
    const own = await svc(repo).list(SUB);
    expect(own.items.map((i) => i.id)).toEqual([IDS.warehouseOoty]);
    expect(JSON.stringify(own)).not.toMatch(/contact_phone|capacity/);
  });

  it('cross-scope update is 404 and writes no audit row', async () => {
    audit.mockClear();
    await expect(svc(fakeRepo()).update(SUB, IDS.warehouseCoonoor, { isPublic: false })).rejects.toMatchObject({ status: 404 });
    expect(audit).not.toHaveBeenCalled();
  });

  it('cannot make a point public without a phone; can once one is stored', async () => {
    const repo = fakeRepo();
    await expect(svc(repo).update(SA, IDS.warehouseOoty, { isPublic: true })).rejects.toMatchObject({ status: 422 });
    const out = await svc(repo).update(SA, IDS.warehouseOoty, { isPublic: true, publicPhone: '+914232441234' });
    expect(out).toMatchObject({ isPublic: true, publicPhone: '+914232441234' });
    // clearing the phone of a public point is refused too
    await expect(svc(repo).update(SA, IDS.warehouseOoty, { publicPhone: null })).rejects.toMatchObject({ status: 422 });
  });

  it('writes one audit row with before/after of the editable fields only', async () => {
    audit.mockClear();
    await svc(fakeRepo()).update(SUB, IDS.warehouseOoty, { publicPhone: '+914232441234', openingHours: HOURS });
    expect(audit).toHaveBeenCalledTimes(1);
    const e = (audit.mock.calls[0] as unknown as [unknown, Record<string, unknown>])[1];
    expect(e).toMatchObject({
      actionCode: 'pickup_point.manage', entityType: 'warehouse', entityId: IDS.warehouseOoty,
      warehouseId: IDS.warehouseOoty, actorRole: RoleCode.SUB_WH_ADMIN,
      before: { publicPhone: null, isPublic: false, openingHours: null },
      after: { publicPhone: '+914232441234', isPublic: false },
    });
    expect(e.changedFields).toEqual(['publicPhone', 'openingHours']);
    expect(Object.keys(e.after as object).sort()).toEqual(['isPublic', 'openingHours', 'publicPhone']);
  });
});
