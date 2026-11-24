/**
 * Admin announcements (BR-213), with BR-35 (the audit row shares the transaction) and BR-65
 * (retiring one removes it from the reader-facing /system-messages view).
 *
 * Layers:
 *  1. request schemas
 *  2. service against a fake repo: the target -> permission table, the DENIED audit row, the
 *     Sub Warehouse Admin's own-warehouse confinement, 404-not-403 for an invisible row,
 *     idempotent retire
 *  3. the router: the any-of gate (refused before any SQL)
 *  4. PostgreSQL: the real repo and SQL inside a transaction that is always rolled back
 */
import type { Server } from 'node:http';
import type pg from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleCode } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import type { Actor } from '../../auth/requireAuth.js';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { randomMobile } from '../../test/dbFixtures.js';
import { aRole, anActor, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import { systemMessagesRepo } from '../system-messages/system-messages.repo.js';
import {
  adminAnnouncementsRepo,
  type AdminAnnouncementRow,
  type AdminAnnouncementsRepo,
} from './admin-announcements.repo.js';
import {
  adminAnnouncement,
  createAdminAnnouncementBody,
  listAdminAnnouncementsQuery,
  retireAdminAnnouncementBody,
  updateAdminAnnouncementBody,
} from './admin-announcements.schema.js';
import { announcementAuthority, createAdminAnnouncementsService } from './admin-announcements.service.js';

const W1 = IDS.warehouseOoty;
const W2 = IDS.warehouseCoonoor;
const NOW = new Date('2026-11-23T10:00:00.000Z');

const actorFor = (code: RoleCode, warehouseId?: string): Actor =>
  anActor({
    userId: newId(),
    roles: [aRole(code, warehouseId === undefined ? {} : { warehouseId })],
    ...(code === RoleCode.FARMER ? { farmerId: IDS.farmer } : {}),
    ...(code === RoleCode.CUSTOMER ? { customerId: IDS.customer } : {}),
  });

async function caught(promise: Promise<unknown>): Promise<AppError> {
  try {
    await promise;
  } catch (err) {
    if (err instanceof AppError) return err;
    throw err;
  }
  throw new Error('expected the call to throw an AppError');
}

/* ---------------------------------------------------------------------------
 * 1. Request schemas
 * ------------------------------------------------------------------------- */

describe('admin announcement request schemas (BR-213)', () => {
  const good = { target: 'SYSTEM_WIDE', title: 'Downtime', body: 'Back at 6pm.' };

  it('BR-213: only SYSTEM_WIDE and WAREHOUSE can be authored; ZONE and ROLE have no create permission', () => {
    expect(createAdminAnnouncementBody.safeParse(good).success).toBe(true);
    expect(createAdminAnnouncementBody.safeParse({ ...good, target: 'ZONE', zoneId: IDS.zoneNorth }).success).toBe(false);
    expect(createAdminAnnouncementBody.safeParse({ ...good, target: 'ROLE' }).success).toBe(false);
  });

  it('BR-213: warehouseId is required for WAREHOUSE and refused for SYSTEM_WIDE', () => {
    expect(createAdminAnnouncementBody.safeParse({ ...good, target: 'WAREHOUSE' }).success).toBe(false);
    expect(createAdminAnnouncementBody.safeParse({ ...good, target: 'WAREHOUSE', warehouseId: W1 }).success).toBe(true);
    expect(createAdminAnnouncementBody.safeParse({ ...good, warehouseId: W1 }).success).toBe(false);
  });

  it('BR-213: endsAt must be after startsAt, and defaults are GENERAL/en', () => {
    const parsed = createAdminAnnouncementBody.parse(good);
    expect(parsed).toMatchObject({ type: 'GENERAL', locale: 'en' });
    expect(
      createAdminAnnouncementBody.safeParse({
        ...good,
        startsAt: '2026-12-01T00:00:00.000Z',
        endsAt: '2026-11-30T00:00:00.000Z',
      }).success,
    ).toBe(false);
  });

  it('BR-213: a patch may not retarget, and must change at least one field', () => {
    expect(updateAdminAnnouncementBody.safeParse({ title: 'New' }).success).toBe(true);
    expect(updateAdminAnnouncementBody.safeParse({ target: 'SYSTEM_WIDE' }).success).toBe(false);
    expect(updateAdminAnnouncementBody.safeParse({ warehouseId: W1 }).success).toBe(false);
    expect(updateAdminAnnouncementBody.safeParse({}).success).toBe(false);
  });

  it('BR-213: the retire body is optional; the list rejects an unknown filter and a forged cursor', () => {
    expect(retireAdminAnnouncementBody.parse(undefined)).toEqual({});
    expect(listAdminAnnouncementsQuery.safeParse({ status: 'RETIRED' }).success).toBe(true);
    expect(listAdminAnnouncementsQuery.safeParse({ nope: '1' }).success).toBe(false);
    expect(listAdminAnnouncementsQuery.safeParse({ cursor: 'not-a-cursor' }).success).toBe(false);
  });
});

/* ---------------------------------------------------------------------------
 * 2. Service against a fake repo
 * ------------------------------------------------------------------------- */

interface AuditRow {
  actionCode: string;
  outcome: string;
  entityId: string | null;
  actorRole?: string | undefined;
}

function aRow(overrides: Partial<AdminAnnouncementRow> = {}): AdminAnnouncementRow {
  return {
    id: newId(),
    scope: 'SYSTEM_WIDE',
    warehouse_id: null,
    zone_id: null,
    role_id: null,
    type: 'GENERAL',
    title: 'Downtime',
    body: 'Back at 6pm.',
    locale: 'en',
    starts_at: new Date('2026-11-01T00:00:00.000Z'),
    ends_at: null,
    deleted_at: null,
    created_by: IDS.userSuperAdmin,
    created_at: new Date('2026-11-01T00:00:00.000Z'),
    updated_at: null,
    ...overrides,
  };
}

/**
 * The fake repo records the audit rows the service writes through the SAME executor, so a test can
 * assert "one audit row, inside the transaction" without a database.
 */
function fakeRepo(stored: AdminAnnouncementRow[] = [], opts: { warehouseExists?: boolean } = {}): {
  repo: AdminAnnouncementsRepo;
  audit: AuditRow[];
  rows: AdminAnnouncementRow[];
} {
  const audit: AuditRow[] = [];
  const rows = [...stored];
  const repo: AdminAnnouncementsRepo = {
    list: async (_db, _authority, query) => ({
      items: rows.slice(0, query.limit),
      nextCursor: null,
      hasMore: false,
    }),
    lockVisibleById: async (_db, _authority, id) => rows.find((row) => row.id === id) ?? null,
    insert: async (_db, input) => {
      const row = aRow({
        scope: input.target,
        warehouse_id: input.warehouseId,
        type: input.type,
        title: input.title,
        body: input.body,
        locale: input.locale,
        starts_at: input.startsAt === null ? NOW : new Date(input.startsAt),
        ends_at: input.endsAt === null ? null : new Date(input.endsAt),
        created_by: input.createdBy,
      });
      rows.push(row);
      return row;
    },
    update: async (_db, id, patch) => {
      const index = rows.findIndex((row) => row.id === id);
      const next: AdminAnnouncementRow = {
        ...(rows[index] as AdminAnnouncementRow),
        ...(patch.title === undefined ? {} : { title: patch.title }),
        ...(patch.type === undefined ? {} : { type: patch.type }),
        ...(patch.endsAt === undefined || patch.endsAt === null ? {} : { ends_at: new Date(patch.endsAt) }),
        updated_at: NOW,
      };
      rows[index] = next;
      return next;
    },
    retire: async (_db, id) => {
      const index = rows.findIndex((row) => row.id === id);
      const next = { ...(rows[index] as AdminAnnouncementRow), deleted_at: NOW, updated_at: NOW };
      rows[index] = next;
      return next;
    },
    findWarehouseId: async (_db, warehouseId) => (opts.warehouseExists === false ? null : warehouseId),
  };

  return { repo, audit, rows };
}

function service(repo: AdminAnnouncementsRepo, tx: Executor): ReturnType<typeof createAdminAnnouncementsService> {
  return createAdminAnnouncementsService({
    repo,
    db: tx,
    transaction: async (fn) => fn(tx),
    now: () => NOW,
  });
}

/** Rebuilds the executor the fake repo's audit recorder listens on. */
function harness(stored: AdminAnnouncementRow[] = [], opts: { warehouseExists?: boolean } = {}) {
  const fake = fakeRepo(stored, opts);
  const audit = fake.audit;
  const tx = {
    query: async (sql: string, params: unknown[] = []) => {
      if (/INSERT INTO audit_log/i.test(sql)) {
        audit.push({
          actionCode: String(params[3]),
          entityId: params[5] === null ? null : String(params[5]),
          outcome: String(params[7]),
          actorRole: params[2] === null ? undefined : String(params[2]),
        });
        return { rows: [{ id: newId() }], rowCount: 1 };
      }
      throw new Error(`unexpected SQL in the fake transaction: ${sql}`);
    },
  } as unknown as Executor;
  return { ...fake, svc: service(fake.repo, tx) };
}

describe('admin announcement service (BR-213)', () => {
  const base = { title: 'Downtime', body: 'Back at 6pm.' };

  it('BR-213a: the target picks the permission — a Super Admin may publish both kinds', async () => {
    const h = harness();
    const authority = announcementAuthority(actorFor(RoleCode.SUPER_ADMIN));

    const wide = await h.svc.create(authority, createAdminAnnouncementBody.parse({ ...base, target: 'SYSTEM_WIDE' }));
    const warehouse = await h.svc.create(
      authority,
      createAdminAnnouncementBody.parse({ ...base, target: 'WAREHOUSE', warehouseId: W1 }),
    );

    expect(wide).toMatchObject({ target: 'SYSTEM_WIDE', warehouseId: null, status: 'ACTIVE', retiredAt: null });
    expect(warehouse).toMatchObject({ target: 'WAREHOUSE', warehouseId: W1 });
    expect(adminAnnouncement.parse(wide)).toEqual(wide);
    expect(h.audit.map((row) => row.actionCode)).toEqual([
      'announcement.system_wide.create',
      'announcement.warehouse.create',
    ]);
    expect(h.audit.every((row) => row.outcome === 'ALLOWED')).toBe(true);
  });

  it('BR-213a: a Main Warehouse Admin holds only the warehouse code — a system-wide attempt is 403 and writes one DENIED audit row, nothing else', async () => {
    const h = harness();
    const authority = announcementAuthority(actorFor(RoleCode.MAIN_WH_ADMIN));

    const error = await caught(
      h.svc.create(authority, createAdminAnnouncementBody.parse({ ...base, target: 'SYSTEM_WIDE' })),
    );

    expect(error.status).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
    expect(h.rows).toHaveLength(0);
    expect(h.audit).toEqual([
      {
        actionCode: 'announcement.system_wide.create',
        entityId: null,
        outcome: 'DENIED',
        actorRole: RoleCode.MAIN_WH_ADMIN,
      },
    ]);

    // ...and the warehouse code it DOES hold still works.
    const ok = await h.svc.create(
      authority,
      createAdminAnnouncementBody.parse({ ...base, target: 'WAREHOUSE', warehouseId: W2 }),
    );
    expect(ok.target).toBe('WAREHOUSE');
  });

  it('BR-213b: a Sub Warehouse Admin (own) may publish to its own warehouse only', async () => {
    const h = harness();
    const authority = announcementAuthority(actorFor(RoleCode.SUB_WH_ADMIN, W1));

    const mine = await h.svc.create(
      authority,
      createAdminAnnouncementBody.parse({ ...base, target: 'WAREHOUSE', warehouseId: W1 }),
    );
    expect(mine.warehouseId).toBe(W1);

    const error = await caught(
      h.svc.create(authority, createAdminAnnouncementBody.parse({ ...base, target: 'WAREHOUSE', warehouseId: W2 })),
    );
    expect(error.status).toBe(403);
    expect(error.code).toBe('WAREHOUSE_SCOPE_VIOLATION');
    expect(h.rows).toHaveLength(1);
    expect(h.audit).toHaveLength(1);
  });

  it('BR-213b: a Sub Warehouse Admin with NO warehouse assigned holds nothing — it is never widened to all warehouses', async () => {
    const h = harness();
    const authority = announcementAuthority(actorFor(RoleCode.SUB_WH_ADMIN));
    expect(authority.warehouse).toBeNull();

    const error = await caught(
      h.svc.create(authority, createAdminAnnouncementBody.parse({ ...base, target: 'WAREHOUSE', warehouseId: W1 })),
    );
    expect(error.status).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
    expect(h.rows).toHaveLength(0);
  });

  it('BR-213b: an unknown warehouse is 422 and writes nothing', async () => {
    const h = harness([], { warehouseExists: false });
    const error = await caught(
      h.svc.create(
        announcementAuthority(actorFor(RoleCode.SUPER_ADMIN)),
        createAdminAnnouncementBody.parse({ ...base, target: 'WAREHOUSE', warehouseId: W2 }),
      ),
    );
    expect(error.status).toBe(422);
    expect(error.code).toBe('VALIDATION_FAILED');
    expect(h.audit).toHaveLength(0);
  });

  it('BR-213c: a row the caller may not manage is 404, never 403 — the repo filter, not a post-hoc check', async () => {
    const hidden = aRow({ scope: 'WAREHOUSE', warehouse_id: W2 });
    // The fake repo's lock ignores authority; the REAL filter is asserted against PostgreSQL below.
    // Here the row is simply absent, which is what the filter produces.
    const h = harness([]);
    const authority = announcementAuthority(actorFor(RoleCode.SUB_WH_ADMIN, W1));

    const patch = await caught(h.svc.update(authority, hidden.id, updateAdminAnnouncementBody.parse({ title: 'x' })));
    expect(patch.status).toBe(404);
    expect(patch.code).toBe('NOT_FOUND');

    const retire = await caught(h.svc.retire(authority, hidden.id, retireAdminAnnouncementBody.parse(undefined)));
    expect(retire.status).toBe(404);
    expect(h.audit).toHaveLength(0);
  });

  it('BR-213d: an edit writes one audit row with before/after images inside the same transaction', async () => {
    const row = aRow();
    const h = harness([row]);
    const authority = announcementAuthority(actorFor(RoleCode.SUPER_ADMIN));

    const updated = await h.svc.update(authority, row.id, updateAdminAnnouncementBody.parse({ title: 'Rescheduled' }));

    expect(updated.title).toBe('Rescheduled');
    expect(updated.updatedAt).not.toBeNull();
    expect(h.audit).toEqual([
      { actionCode: 'announcement.update', entityId: row.id, outcome: 'ALLOWED', actorRole: RoleCode.SUPER_ADMIN },
    ]);
  });

  it('BR-213e: retire sets retiredAt and is idempotent — a replay writes no second audit row and keeps the first retiredAt', async () => {
    const row = aRow();
    const h = harness([row]);
    const authority = announcementAuthority(actorFor(RoleCode.SUPER_ADMIN));

    const first = await h.svc.retire(authority, row.id, retireAdminAnnouncementBody.parse(undefined));
    expect(first.status).toBe('RETIRED');
    expect(first.retiredAt).toBe(NOW.toISOString());

    const replay = await h.svc.retire(authority, row.id, retireAdminAnnouncementBody.parse({ reason: 'again' }));
    expect(replay.retiredAt).toBe(first.retiredAt);
    expect(h.audit.map((entry) => entry.actionCode)).toEqual(['announcement.retire']);
  });

  it('BR-213e: a retired announcement cannot be edited (409) and writes nothing', async () => {
    const row = aRow({ deleted_at: new Date('2026-11-20T00:00:00.000Z') });
    const h = harness([row]);

    const error = await caught(
      h.svc.update(
        announcementAuthority(actorFor(RoleCode.SUPER_ADMIN)),
        row.id,
        updateAdminAnnouncementBody.parse({ title: 'x' }),
      ),
    );
    expect(error.status).toBe(409);
    expect(error.code).toBe('INVALID_STATE_TRANSITION');
    expect(h.audit).toHaveLength(0);
  });

  it('BR-213f: status is derived, never stored — retired beats the window', async () => {
    const h = harness([
      aRow({ id: '00000000-0000-4000-8000-0000000000a1', starts_at: new Date('2026-12-01T00:00:00.000Z') }),
      aRow({ id: '00000000-0000-4000-8000-0000000000a2', ends_at: new Date('2026-11-02T00:00:00.000Z') }),
      aRow({ id: '00000000-0000-4000-8000-0000000000a3' }),
      aRow({
        id: '00000000-0000-4000-8000-0000000000a4',
        starts_at: new Date('2026-12-01T00:00:00.000Z'),
        deleted_at: NOW,
      }),
    ]);

    const page = await h.svc.list(
      announcementAuthority(actorFor(RoleCode.SUPER_ADMIN)),
      listAdminAnnouncementsQuery.parse({}),
    );
    expect(page.items.map((item) => item.status)).toEqual(['SCHEDULED', 'EXPIRED', 'ACTIVE', 'RETIRED']);
    expect(page.page).toEqual({ nextCursor: null, hasMore: false });
  });
});

/* ---------------------------------------------------------------------------
 * 3. Router — the any-of gate
 * ------------------------------------------------------------------------- */

describe('admin announcement router gate (BR-213)', () => {
  let server: Server;
  const token = (
    roles: Array<{ code: RoleCode; warehouseId?: string; zoneId?: string }>,
    extra: { farmerId?: string; customerId?: string } = {},
  ): string =>
    `Bearer ${signAccessToken({
      sub: IDS.userSuperAdmin,
      roles,
      farmerId: extra.farmerId ?? null,
      customerId: extra.customerId ?? null,
    })}`;

  beforeAll(() => {
    server = createApp().listen(0);
  });
  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const good = { target: 'SYSTEM_WIDE', title: 'Downtime', body: 'Back at 6pm.' };

  it('BR-213g: 401 without a token on every route', async () => {
    expect((await request(server).get('/v1/admin/announcements')).status).toBe(401);
    expect((await request(server).post('/v1/admin/announcements').send(good)).status).toBe(401);
    expect((await request(server).patch(`/v1/admin/announcements/${newId()}`).send({ title: 'x' })).status).toBe(401);
    expect((await request(server).post(`/v1/admin/announcements/${newId()}/retire`)).status).toBe(401);
  });

  it('BR-213g: a caller holding neither create code is 403 before any SQL', async () => {
    for (const auth of [
      token([{ code: RoleCode.FARMER_ADMIN, zoneId: IDS.zoneNorth }]),
      token([{ code: RoleCode.FARMER }], { farmerId: IDS.farmer }),
      token([{ code: RoleCode.CUSTOMER }], { customerId: IDS.customer }),
    ]) {
      const list = await request(server).get('/v1/admin/announcements').set('Authorization', auth);
      expect(list.status).toBe(403);
      expect(list.body.code).toBe('FORBIDDEN');
      const create = await request(server).post('/v1/admin/announcements').set('Authorization', auth).send(good);
      expect(create.status).toBe(403);
    }
  });

  it('BR-213g: a malformed body is 422 before any SQL', async () => {
    const res = await request(server)
      .post('/v1/admin/announcements')
      .set('Authorization', token([{ code: RoleCode.SUPER_ADMIN }]))
      .send({ ...good, target: 'ZONE' });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });
});

/* ---------------------------------------------------------------------------
 * 4. PostgreSQL
 * ------------------------------------------------------------------------- */

describeIfDatabase('admin announcements (PostgreSQL, rolled back)', () => {
  let pool: pg.Pool;

  beforeAll(async () => {
    expect(await databaseReady('announcements'), 'the database is reachable and migrated').toBe(true);
    ({ pool } = await import('../../db/pool.js'));
  });

  async function inRollback<T>(fn: (tx: pg.PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      return await fn(client);
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  }

  async function anAdmin(tx: pg.PoolClient, role: string, warehouseId: string | null = null): Promise<string> {
    const id = newId();
    await tx.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, 'Publisher', 'ADMIN', 'ACTIVE')`,
      [id, randomMobile()],
    );
    await tx.query(
      `INSERT INTO user_roles (user_id, role_id, warehouse_id, valid_from)
       SELECT $1, r.id, $2::uuid, now() - interval '1 day' FROM roles r WHERE r.code = $3`,
      [id, warehouseId, role],
    );
    return id;
  }

  async function aWarehouseRow(tx: pg.PoolClient): Promise<string> {
    const id = newId();
    await tx.query(`INSERT INTO warehouses (id, code, name, type) VALUES ($1, $2, 'Fixture WH', 'SUB')`, [
      id,
      `WH-${id.slice(0, 8)}`,
    ]);
    return id;
  }

  const svc = (tx: pg.PoolClient) =>
    createAdminAnnouncementsService({
      repo: adminAnnouncementsRepo,
      db: tx,
      transaction: async (fn) => fn(tx),
    });

  const authorityOf = (userId: string, role: RoleCode, warehouseId?: string) =>
    announcementAuthority(
      anActor({
        userId,
        roles: [aRole(role, warehouseId === undefined ? {} : { warehouseId })],
      }),
    );

  it('BR-213a (PostgreSQL): a system-wide announcement is stored with scope SYSTEM_WIDE and leaves exactly one audit row in the same transaction', async () => {
    await inRollback(async (tx) => {
      const actor = await anAdmin(tx, 'SUPER_ADMIN');
      const created = await svc(tx).create(
        authorityOf(actor, RoleCode.SUPER_ADMIN),
        createAdminAnnouncementBody.parse({ target: 'SYSTEM_WIDE', title: 'Downtime', body: 'Back at 6pm.', type: 'MAINTENANCE' }),
      );

      expect(created).toMatchObject({ target: 'SYSTEM_WIDE', type: 'MAINTENANCE', status: 'ACTIVE', retiredAt: null });

      const stored = (
        await tx.query(`SELECT scope, warehouse_id, type, created_by, deleted_at FROM announcements WHERE id = $1`, [
          created.id,
        ])
      ).rows[0];
      expect(stored).toEqual({
        scope: 'SYSTEM_WIDE',
        warehouse_id: null,
        type: 'MAINTENANCE',
        created_by: actor,
        deleted_at: null,
      });

      const audit = (
        await tx.query(`SELECT action_code, outcome, entity_type FROM audit_log WHERE entity_id = $1`, [created.id])
      ).rows;
      expect(audit).toEqual([
        { action_code: 'announcement.system_wide.create', outcome: 'ALLOWED', entity_type: 'announcement' },
      ]);
    });
  });

  it('BR-213c (PostgreSQL): the list is confined by the create grants — a Sub Warehouse Admin sees its own warehouse row and NOT another warehouse\'s or a system-wide one (empty, not 403)', async () => {
    await inRollback(async (tx) => {
      const superAdmin = await anAdmin(tx, 'SUPER_ADMIN');
      const w1 = await aWarehouseRow(tx);
      const w2 = await aWarehouseRow(tx);
      const subAdmin = await anAdmin(tx, 'SUB_WH_ADMIN', w1);

      const wide = await svc(tx).create(
        authorityOf(superAdmin, RoleCode.SUPER_ADMIN),
        createAdminAnnouncementBody.parse({ target: 'SYSTEM_WIDE', title: 'All', body: 'Everyone.' }),
      );
      const mine = await svc(tx).create(
        authorityOf(superAdmin, RoleCode.SUPER_ADMIN),
        createAdminAnnouncementBody.parse({ target: 'WAREHOUSE', warehouseId: w1, title: 'W1', body: 'Ooty only.' }),
      );
      const theirs = await svc(tx).create(
        authorityOf(superAdmin, RoleCode.SUPER_ADMIN),
        createAdminAnnouncementBody.parse({ target: 'WAREHOUSE', warehouseId: w2, title: 'W2', body: 'Coonoor only.' }),
      );

      const subPage = await svc(tx).list(
        authorityOf(subAdmin, RoleCode.SUB_WH_ADMIN, w1),
        listAdminAnnouncementsQuery.parse({ limit: 100 }),
      );
      const subIds = subPage.items.map((item) => item.id);
      expect(subIds).toContain(mine.id);
      expect(subIds).not.toContain(theirs.id);
      expect(subIds).not.toContain(wide.id);

      // ...and a patch on the invisible row is 404, not 403.
      const error = await caught(
        svc(tx).update(
          authorityOf(subAdmin, RoleCode.SUB_WH_ADMIN, w1),
          theirs.id,
          updateAdminAnnouncementBody.parse({ title: 'hijack' }),
        ),
      );
      expect(error.status).toBe(404);
    });
  });

  it('BR-213e / BR-65 (PostgreSQL): retiring an announcement sets deleted_at and removes it from the reader-facing system-message view', async () => {
    await inRollback(async (tx) => {
      const actor = await anAdmin(tx, 'SUPER_ADMIN');
      const authority = authorityOf(actor, RoleCode.SUPER_ADMIN);
      const created = await svc(tx).create(
        authority,
        createAdminAnnouncementBody.parse({ target: 'SYSTEM_WIDE', title: 'Downtime', body: 'Back at 6pm.' }),
      );

      const viewer = {
        userId: actor,
        roleCodes: [RoleCode.SUPER_ADMIN],
        scope: {
          level: 'all' as const,
          permission: 'notification.own.view',
          roleCode: RoleCode.SUPER_ADMIN,
          warehouseIds: [],
          zoneIds: [],
          userId: actor,
        },
      };
      expect(await systemMessagesRepo.findVisibleById(tx, viewer, created.id)).not.toBeNull();

      const retired = await svc(tx).retire(authority, created.id, retireAdminAnnouncementBody.parse({ reason: 'cancelled' }));
      expect(retired.status).toBe('RETIRED');
      expect(retired.retiredAt).not.toBeNull();

      expect(await systemMessagesRepo.findVisibleById(tx, viewer, created.id)).toBeNull();

      const audit = (
        await tx.query(`SELECT action_code FROM audit_log WHERE entity_id = $1 ORDER BY created_at`, [created.id])
      ).rows;
      expect(audit.map((row: { action_code: string }) => row.action_code)).toEqual([
        'announcement.system_wide.create',
        'announcement.retire',
      ]);
    });
  });

  it('BR-213b (PostgreSQL): a Sub Warehouse Admin publishing to another warehouse is refused and writes nothing', async () => {
    await inRollback(async (tx) => {
      const w1 = await aWarehouseRow(tx);
      const w2 = await aWarehouseRow(tx);
      const subAdmin = await anAdmin(tx, 'SUB_WH_ADMIN', w1);

      const error = await caught(
        svc(tx).create(
          authorityOf(subAdmin, RoleCode.SUB_WH_ADMIN, w1),
          createAdminAnnouncementBody.parse({ target: 'WAREHOUSE', warehouseId: w2, title: 'Nope', body: 'Nope.' }),
        ),
      );
      expect(error.status).toBe(403);
      expect(error.code).toBe('WAREHOUSE_SCOPE_VIOLATION');
      expect((await tx.query(`SELECT count(*)::int AS n FROM announcements WHERE warehouse_id = $1`, [w2])).rows[0]).toEqual({
        n: 0,
      });
    });
  });
});
