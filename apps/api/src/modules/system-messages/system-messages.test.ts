/**
 * BR-65 (system messages half): a user reads and marks read only the system messages visible
 * to them (scope + active window); read state is per user; mark-read is idempotent; anything
 * not visible is 404.
 *
 * Part 1 is the service against a mocked repo. Part 2 is the real router + real SQL, because
 * the visibility rule lives in the query and a mocked repo cannot prove it.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import type { Executor } from '../../db/pool.js';
import { aRole, aScope, anActor, databaseReady, describeIfDatabase, IDS, newId } from '../../test/factories.js';
import type {
  SystemMessageRow,
  SystemMessagesRepo,
  SystemMessageViewer,
} from './system-messages.repo.js';
import { listSystemMessagesQuery, systemMessageIdParam } from './system-messages.schema.js';
import { createSystemMessagesService } from './system-messages.service.js';

const DB = {} as Executor;
const MSG_ID = '77777777-7777-4777-8777-777777777777';

function aRow(overrides: Partial<SystemMessageRow> = {}): SystemMessageRow {
  return {
    id: MSG_ID,
    scope: 'SYSTEM_WIDE',
    title: 'Maintenance',
    body: 'Sunday 2am',
    locale: 'en',
    starts_at: new Date('2026-10-01T00:00:00.000Z'),
    ends_at: null,
    created_at: new Date('2026-09-30T00:00:00.000Z'),
    read_at: null,
    ...overrides,
  };
}

interface Calls {
  list: Array<{ viewer: SystemMessageViewer; options: unknown }>;
  find: string[];
  markRead: string[];
}

function mockRepo(state: { row: SystemMessageRow | null; next?: { startsAt: string; id: string } | null }): {
  repo: SystemMessagesRepo;
  calls: Calls;
} {
  const calls: Calls = { list: [], find: [], markRead: [] };
  const repo: SystemMessagesRepo = {
    async list(_db, viewer, options) {
      calls.list.push({ viewer, options });
      return { items: state.row === null ? [] : [state.row], next: state.next ?? null };
    },
    async findVisibleById(_db, _viewer, id) {
      calls.find.push(id);
      return state.row;
    },
    async markRead(_db, _viewer, id) {
      calls.markRead.push(id);
      if (state.row !== null) state.row = { ...state.row, read_at: state.row.read_at ?? new Date('2026-10-02T00:00:00.000Z') };
    },
  };
  return { repo, calls };
}

const subAdmin = anActor({
  userId: IDS.userSubWhAdmin,
  roles: [aRole(RoleCode.SUB_WH_ADMIN, { warehouseId: IDS.warehouseOoty }), aRole(RoleCode.FARMER_ADMIN, { zoneId: IDS.zoneNorth })],
});
const subScope = aScope({
  level: ScopeLevel.ALL,
  permission: 'notification.own.view',
  roleCode: RoleCode.SUB_WH_ADMIN,
  warehouseIds: [IDS.warehouseOoty],
  userId: IDS.userSubWhAdmin,
});

describe('BR-65: system messages request schemas', () => {
  it('BR-65f: the list query defaults to limit 20 and status all, and caps limit at 100', () => {
    expect(listSystemMessagesQuery.parse({})).toEqual({ limit: 20, status: 'all' });
    expect(listSystemMessagesQuery.safeParse({ limit: '101' }).success).toBe(false);
    expect(listSystemMessagesQuery.safeParse({ limit: '0' }).success).toBe(false);
    expect(listSystemMessagesQuery.parse({ limit: '100', status: 'unread' })).toEqual({ limit: 100, status: 'unread' });
  });

  it('BR-65f: the list query is strict: an unknown filter (there is no type/category) and a bad status are rejected', () => {
    expect(listSystemMessagesQuery.safeParse({ type: 'ALERT' }).success).toBe(false);
    expect(listSystemMessagesQuery.safeParse({ status: 'archived' }).success).toBe(false);
  });

  it('BR-65d: the id param must be a uuid', () => {
    expect(systemMessageIdParam.safeParse({ id: 'nope' }).success).toBe(false);
    expect(systemMessageIdParam.safeParse({ id: MSG_ID }).success).toBe(true);
  });
});

describe('BR-65: system messages service (mocked repo)', () => {
  it('BR-65c: list hands the repo the caller id, every role code the caller holds and the resolved scope', async () => {
    const { repo, calls } = mockRepo({ row: aRow() });
    const service = createSystemMessagesService(repo, DB);

    await service.list(subAdmin, subScope, { limit: 20, status: 'all' });

    expect(calls.list).toHaveLength(1);
    expect(calls.list[0]?.viewer).toEqual({
      userId: IDS.userSubWhAdmin,
      roleCodes: [RoleCode.SUB_WH_ADMIN, RoleCode.FARMER_ADMIN],
      scope: subScope,
    });
    expect(calls.list[0]?.options).toEqual({ limit: 20, status: 'all' });
  });

  it('BR-65c: list maps a row to {id, scope, title, body, locale, startsAt, endsAt, createdAt, isRead, readAt} and nothing else', async () => {
    const { repo } = mockRepo({
      row: aRow({ ends_at: new Date('2026-12-01T00:00:00.000Z'), read_at: new Date('2026-10-02T05:00:00.000Z') }),
    });
    const service = createSystemMessagesService(repo, DB);

    const result = await service.list(subAdmin, subScope, { limit: 20, status: 'all' });

    expect(result.items).toEqual([
      {
        id: MSG_ID,
        scope: 'SYSTEM_WIDE',
        title: 'Maintenance',
        body: 'Sunday 2am',
        locale: 'en',
        startsAt: '2026-10-01T00:00:00.000Z',
        endsAt: '2026-12-01T00:00:00.000Z',
        createdAt: '2026-09-30T00:00:00.000Z',
        isRead: true,
        readAt: '2026-10-02T05:00:00.000Z',
      },
    ]);
    expect(result.page).toEqual({ nextCursor: null, hasMore: false });
  });

  it('BR-65f: the repo cursor is exposed opaque and decoded back for the next page; a forged cursor is 422 and never reaches the repo', async () => {
    const stamp = '2026-10-01T00:00:00.000003Z';
    const { repo, calls } = mockRepo({ row: aRow(), next: { startsAt: stamp, id: MSG_ID } });
    const service = createSystemMessagesService(repo, DB);

    const first = await service.list(subAdmin, subScope, { limit: 1, status: 'all' });
    expect(first.page.hasMore).toBe(true);
    expect(first.page.nextCursor).not.toBeNull();
    expect(first.page.nextCursor).not.toContain(MSG_ID);

    await service.list(subAdmin, subScope, { limit: 1, status: 'all', cursor: first.page.nextCursor! });
    expect(calls.list[1]?.options).toEqual({ limit: 1, status: 'all', cursor: { startsAt: stamp, id: MSG_ID } });

    await expect(
      service.list(subAdmin, subScope, { limit: 1, status: 'all', cursor: 'not-a-cursor' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
    expect(calls.list).toHaveLength(2);
  });

  it('BR-65d: get is 404 NOT_FOUND when the message is not visible to the caller', async () => {
    const { repo, calls } = mockRepo({ row: null });
    const service = createSystemMessagesService(repo, DB);

    await expect(service.get(subAdmin, subScope, MSG_ID)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
    expect(calls.find).toEqual([MSG_ID]);
  });

  it('BR-65e: markRead on a message the caller cannot see is 404 and writes nothing', async () => {
    const { repo, calls } = mockRepo({ row: null });
    const service = createSystemMessagesService(repo, DB);

    await expect(service.markRead(subAdmin, subScope, MSG_ID)).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
    expect(calls.markRead).toEqual([]);
  });

  it('BR-65e: markRead records the read and returns the item as read; replaying keeps the first read time', async () => {
    const state = { row: aRow() as SystemMessageRow | null };
    const { repo, calls } = mockRepo(state);
    const service = createSystemMessagesService(repo, DB);

    const first = await service.markRead(subAdmin, subScope, MSG_ID);
    const replay = await service.markRead(subAdmin, subScope, MSG_ID);

    expect(first.isRead).toBe(true);
    expect(first.readAt).toBe('2026-10-02T00:00:00.000Z');
    expect(replay).toEqual(first);
    expect(calls.markRead).toEqual([MSG_ID, MSG_ID]);
  });
});

// ---------------------------------------------------------------------------
// Real router + real SQL
// ---------------------------------------------------------------------------

const app = createApp();

describe('BR-65: system messages endpoints require authentication', () => {
  it('BR-65g: list, get and mark-read without a token are 401', async () => {
    expect((await request(app).get('/v1/system-messages')).status).toBe(401);
    expect((await request(app).get(`/v1/system-messages/${MSG_ID}`)).status).toBe(401);
    expect((await request(app).post(`/v1/system-messages/${MSG_ID}/read`)).status).toBe(401);
  });
});

describeIfDatabase('BR-65 system messages (HTTP + PostgreSQL)', () => {
  let ready = false;
  const stamp = String(Date.now()).slice(-7);
  const users = { main: newId(), subA: newId(), subB: newId(), farmer: newId(), customer: newId() };
  const farmerId = newId();
  const customerId = newId();
  let whA = '';
  let whB = '';
  let zoneId = '';
  const msg: Record<string, string> = {};
  const pagedIds: string[] = [];

  const tokens = (): Record<'main' | 'subA' | 'subB' | 'farmer' | 'customer', string> => ({
    main: signAccessToken({ sub: users.main, roles: [{ code: 'MAIN_WH_ADMIN' }], farmerId: null, customerId: null }),
    subA: signAccessToken({ sub: users.subA, roles: [{ code: 'SUB_WH_ADMIN', warehouseId: whA }], farmerId: null, customerId: null }),
    subB: signAccessToken({ sub: users.subB, roles: [{ code: 'SUB_WH_ADMIN', warehouseId: whB }], farmerId: null, customerId: null }),
    farmer: signAccessToken({ sub: users.farmer, roles: [{ code: 'FARMER' }], farmerId, customerId: null }),
    customer: signAccessToken({ sub: users.customer, roles: [{ code: 'CUSTOMER' }], farmerId: null, customerId }),
  });
  const as = (who: keyof ReturnType<typeof tokens>): string => `Bearer ${tokens()[who]}`;

  async function insertAnnouncement(
    key: string,
    cols: {
      scope?: string;
      warehouseId?: string | null;
      zoneId?: string | null;
      roleCode?: string | null;
      startsAt?: string;
      endsAt?: string | null;
      deleted?: boolean;
    },
  ): Promise<string> {
    const { pool } = await import('../../db/pool.js');
    const result = await pool.query<{ id: string }>(
      `INSERT INTO announcements (scope, warehouse_id, zone_id, role_id, title, body, starts_at, ends_at, created_by, deleted_at)
       VALUES ($1, $2, $3, (SELECT id FROM roles WHERE code = $4), $5, 'body ' || $5,
               COALESCE($6::timestamptz, now() - interval '1 hour'), $7::timestamptz, $8,
               CASE WHEN $9 THEN now() ELSE NULL END)
       RETURNING id`,
      [
        cols.scope ?? 'SYSTEM_WIDE',
        cols.warehouseId ?? null,
        cols.zoneId ?? null,
        cols.roleCode ?? null,
        `BR65-${key}-${stamp}`,
        cols.startsAt ?? null,
        cols.endsAt ?? null,
        users.main,
        cols.deleted === true,
      ],
    );
    const id = result.rows[0]!.id;
    msg[key] = id;
    return id;
  }

  interface Item {
    id: string;
    scope: string;
    title: string;
    body: string;
    locale: string;
    startsAt: string;
    endsAt: string | null;
    createdAt: string;
    isRead: boolean;
    readAt: string | null;
  }

  /** Every fixture message this caller sees, by key, walking pages of 100. */
  async function visibleKeys(who: keyof ReturnType<typeof tokens>, query = ''): Promise<string[]> {
    const res = await request(app).get(`/v1/system-messages?limit=100${query}`).set('Authorization', as(who));
    expect(res.status).toBe(200);
    const byId = new Map(Object.entries(msg).map(([key, id]) => [id, key]));
    return (res.body.items as Item[])
      .map((i) => byId.get(i.id))
      .filter((k): k is string => k !== undefined && !k.startsWith('page'))
      .sort();
  }

  beforeAll(async () => {
    ready = await databaseReady('announcement_reads');
    if (!ready) return;
    const { pool } = await import('../../db/pool.js');
    const whs = await pool.query<{ id: string }>(`SELECT id FROM warehouses WHERE type = 'SUB' ORDER BY code LIMIT 2`);
    whA = whs.rows[0]!.id;
    whB = whs.rows[1]!.id;
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES
         ($1, $6, 'BR65 main', 'ADMIN', 'ACTIVE'),
         ($2, $7, 'BR65 subA', 'ADMIN', 'ACTIVE'),
         ($3, $8, 'BR65 subB', 'ADMIN', 'ACTIVE'),
         ($4, $9, 'BR65 farmer', 'FARMER', 'ACTIVE'),
         ($5, $10, 'BR65 customer', 'CUSTOMER', 'ACTIVE')`,
      [users.main, users.subA, users.subB, users.farmer, users.customer,
        `+9171${stamp}`, `+9172${stamp}`, `+9173${stamp}`, `+9174${stamp}`, `+9175${stamp}`],
    );
    zoneId = (
      await pool.query<{ id: string }>(`INSERT INTO zones (code, name) VALUES ($1, 'BR65 zone') RETURNING id`, [`BR65-${stamp}`])
    ).rows[0]!.id;

    await insertAnnouncement('sys', {});
    await insertAnnouncement('sysEnding', { endsAt: new Date(Date.now() + 86_400_000).toISOString() });
    await insertAnnouncement('whA', { scope: 'WAREHOUSE', warehouseId: whA });
    await insertAnnouncement('whB', { scope: 'WAREHOUSE', warehouseId: whB });
    await insertAnnouncement('roleFarmer', { scope: 'ROLE', roleCode: 'FARMER' });
    await insertAnnouncement('roleSub', { scope: 'ROLE', roleCode: 'SUB_WH_ADMIN' });
    await insertAnnouncement('zone', { scope: 'ZONE', zoneId });
    await insertAnnouncement('expired', {
      startsAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
      endsAt: new Date(Date.now() - 86_400_000).toISOString(),
    });
    await insertAnnouncement('future', { startsAt: new Date(Date.now() + 86_400_000).toISOString() });
    await insertAnnouncement('deleted', { deleted: true });

    // Pagination fixtures: microsecond-apart start times plus an exact tie, all SYSTEM_WIDE.
    const micro = ['10:00:00.000001', '10:00:00.000002', '10:00:00.000003', '10:00:00.000003', '10:00:00.000003'];
    for (const [i, t] of micro.entries()) {
      const id = await insertAnnouncement(`page${i}`, { startsAt: `2026-03-01 ${t}+00` });
      pagedIds.push(id);
    }
  });

  afterAll(async () => {
    if (!ready) return;
    const { pool, closePool } = await import('../../db/pool.js');
    // announcement_reads cascade with their announcement.
    await pool.query(`DELETE FROM announcements WHERE created_by = $1`, [users.main]);
    await pool.query(`DELETE FROM zones WHERE id = $1`, [zoneId]);
    await pool.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [Object.values(users)]);
    await closePool();
  });

  it('BR-65c: a Main Warehouse admin (no assigned warehouse) sees system-wide and ALL warehouse messages, not role-scoped or zone ones', async () => {
    if (!ready) return;
    expect(await visibleKeys('main')).toEqual(['sys', 'sysEnding', 'whA', 'whB'].sort());
  });

  it('BR-65c: a Sub Warehouse admin sees only their own warehouse messages plus messages for the SUB_WH_ADMIN role', async () => {
    if (!ready) return;
    expect(await visibleKeys('subA')).toEqual(['sys', 'sysEnding', 'whA', 'roleSub'].sort());
    expect(await visibleKeys('subB')).toEqual(['sys', 'sysEnding', 'whB', 'roleSub'].sort());
  });

  it('BR-65c: a farmer sees system-wide and FARMER-role messages but never a warehouse message; a customer sees only system-wide', async () => {
    if (!ready) return;
    expect(await visibleKeys('farmer')).toEqual(['sys', 'sysEnding', 'roleFarmer'].sort());
    expect(await visibleKeys('customer')).toEqual(['sys', 'sysEnding'].sort());
  });

  it('BR-65d: expired, not-yet-started and soft-deleted messages are invisible to everybody, and ZONE messages are never shown', async () => {
    if (!ready) return;
    for (const who of ['main', 'subA', 'subB', 'farmer', 'customer'] as const) {
      const keys = await visibleKeys(who);
      for (const hidden of ['expired', 'future', 'deleted', 'zone']) expect(keys).not.toContain(hidden);
    }
  });

  it('BR-65c: the list item has exactly the documented fields and no farm/warehouse/zone/role ids', async () => {
    if (!ready) return;
    const res = await request(app).get('/v1/system-messages?limit=100').set('Authorization', as('subA'));
    const item = (res.body.items as Item[]).find((i) => i.id === msg['whA']);
    expect(item).toBeDefined();
    expect(Object.keys(item!).sort()).toEqual(
      ['id', 'scope', 'title', 'body', 'locale', 'startsAt', 'endsAt', 'createdAt', 'isRead', 'readAt'].sort(),
    );
    expect(item).toMatchObject({ scope: 'WAREHOUSE', title: `BR65-whA-${stamp}`, locale: 'en', isRead: false, readAt: null, endsAt: null });
  });

  it('BR-65d: GET /v1/system-messages/:id is 200 for a visible message and 404 for every hidden, expired, future, deleted, zone or other-scope one', async () => {
    if (!ready) return;
    const ok = await request(app).get(`/v1/system-messages/${msg['whA']}`).set('Authorization', as('subA'));
    expect(ok.status).toBe(200);
    expect(ok.body.id).toBe(msg['whA']);

    const hiddenForSubA = ['whB', 'roleFarmer', 'zone', 'expired', 'future', 'deleted'];
    for (const key of hiddenForSubA) {
      const res = await request(app).get(`/v1/system-messages/${msg[key]}`).set('Authorization', as('subA'));
      expect(res.status, key).toBe(404);
      expect(JSON.stringify(res.body)).not.toContain(`BR65-${key}-${stamp}`);
    }
    expect((await request(app).get(`/v1/system-messages/${msg['whA']}`).set('Authorization', as('farmer'))).status).toBe(404);
    expect((await request(app).get(`/v1/system-messages/${msg['whA']}`).set('Authorization', as('customer'))).status).toBe(404);
    expect((await request(app).get(`/v1/system-messages/${newId()}`).set('Authorization', as('subA'))).status).toBe(404);
    expect((await request(app).get('/v1/system-messages/not-a-uuid').set('Authorization', as('subA'))).status).toBe(422);
  });

  it('BR-65e: POST read on a message the caller cannot see is 404 and leaves no read row behind', async () => {
    if (!ready) return;
    const { pool } = await import('../../db/pool.js');
    for (const key of ['whB', 'expired', 'future', 'deleted', 'zone']) {
      const res = await request(app).post(`/v1/system-messages/${msg[key]}/read`).set('Authorization', as('subA'));
      expect(res.status, key).toBe(404);
    }
    const rows = await pool.query(`SELECT 1 FROM announcement_reads WHERE announcement_id = ANY($1::uuid[])`, [
      ['whB', 'expired', 'future', 'deleted', 'zone'].map((k) => msg[k]),
    ]);
    expect(rows.rowCount).toBe(0);
  });

  it('BR-65e: read state is per user: user A reading a message does not mark it read for user B, and replaying is idempotent', async () => {
    if (!ready) return;
    const { pool } = await import('../../db/pool.js');

    const first = await request(app).post(`/v1/system-messages/${msg['sys']}/read`).set('Authorization', as('subA'));
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({ id: msg['sys'], isRead: true });
    expect(typeof first.body.readAt).toBe('string');

    const replay = await request(app).post(`/v1/system-messages/${msg['sys']}/read`).set('Authorization', as('subA'));
    expect(replay.status).toBe(200);
    expect(replay.body.readAt).toBe(first.body.readAt);
    const rows = await pool.query(`SELECT user_id FROM announcement_reads WHERE announcement_id = $1`, [msg['sys']]);
    expect(rows.rows).toEqual([{ user_id: users.subA }]);

    const asB = await request(app).get(`/v1/system-messages/${msg['sys']}`).set('Authorization', as('subB'));
    expect(asB.body).toMatchObject({ isRead: false, readAt: null });
    const asA = await request(app).get(`/v1/system-messages/${msg['sys']}`).set('Authorization', as('subA'));
    expect(asA.body).toMatchObject({ isRead: true, readAt: first.body.readAt });
  });

  it('BR-65e: the status filter splits the caller list into unread and read, and all returns both', async () => {
    if (!ready) return;
    // Continues from the previous test: subA has read only `sys`.
    expect(await visibleKeys('subA', '&status=read')).toEqual(['sys']);
    expect(await visibleKeys('subA', '&status=unread')).toEqual(['sysEnding', 'whA', 'roleSub'].sort());
    expect(await visibleKeys('subA', '&status=all')).toEqual(['sys', 'sysEnding', 'whA', 'roleSub'].sort());
    // Another user is unaffected.
    expect(await visibleKeys('subB', '&status=read')).toEqual([]);
  });

  it('BR-65f: cursor pagination with microsecond-apart and exactly tied start times neither skips nor repeats a row', async () => {
    if (!ready) return;
    const full = await request(app).get('/v1/system-messages?limit=100').set('Authorization', as('customer'));
    const expected = (full.body.items as Item[]).map((i) => i.id);
    expect(pagedIds.every((id) => expected.includes(id))).toBe(true);
    expect(new Set(expected).size).toBe(expected.length);

    for (const limit of [1, 2]) {
      const walked: string[] = [];
      let cursor: string | null = null;
      for (let guard = 0; guard < 100; guard += 1) {
        const query: string = cursor === null ? `limit=${limit}` : `limit=${limit}&cursor=${encodeURIComponent(cursor)}`;
        const page = await request(app).get(`/v1/system-messages?${query}`).set('Authorization', as('customer'));
        expect(page.status).toBe(200);
        walked.push(...(page.body.items as Item[]).map((i) => i.id));
        if (!page.body.page.hasMore) {
          expect(page.body.page.nextCursor).toBeNull();
          break;
        }
        cursor = page.body.page.nextCursor as string;
      }
      expect(walked, `limit ${limit}`).toEqual(expected);
    }
  });

  it('BR-65f: a forged cursor or an unknown query filter is 422', async () => {
    if (!ready) return;
    expect((await request(app).get('/v1/system-messages?cursor=garbage').set('Authorization', as('main'))).status).toBe(422);
    expect((await request(app).get('/v1/system-messages?type=ALERT').set('Authorization', as('main'))).status).toBe(422);
    expect((await request(app).get('/v1/system-messages?limit=101').set('Authorization', as('main'))).status).toBe(422);
  });
});
