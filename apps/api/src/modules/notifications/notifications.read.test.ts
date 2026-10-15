/**
 * BR-65 (notifications half): a user reads and marks read only their own notifications.
 *
 * The DB-gated suite goes through the real router, real auth and real SQL, because a mocked
 * repo cannot prove that another user's id is a 404 or that read-all stays inside one user.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';

const app = createApp();

function tokenFor(userId: string): string {
  return signAccessToken({ sub: userId, roles: [{ code: 'MAIN_WH_ADMIN' }], farmerId: null, customerId: null });
}

describe('BR-65a: notification read endpoints require authentication', () => {
  it('BR-65a: GET /v1/notifications/:id without a token is 401', async () => {
    const res = await request(app).get(`/v1/notifications/${newId()}`);
    expect(res.status).toBe(401);
  });

  it('BR-65b: POST /v1/notifications/read-all without a token is 401', async () => {
    const res = await request(app).post('/v1/notifications/read-all');
    expect(res.status).toBe(401);
  });
});

describeIfDatabase('BR-65 notifications (HTTP + PostgreSQL)', () => {
  let ready = false;
  const stamp = String(Date.now()).slice(-8);
  const userA = newId();
  const userB = newId();
  const ids = {
    aUnread1: newId(),
    aUnread2: newId(),
    aPush: newId(),
    aAlreadyRead: newId(),
    bUnread: newId(),
  };
  const alreadyReadAt = '2026-01-01T00:00:00.000Z';

  beforeAll(async () => {
    ready = await databaseReady('notifications');
    if (!ready) return;
    const { pool } = await import('../../db/pool.js');
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES
         ($1, $3, 'BR65 A', 'ADMIN', 'ACTIVE'),
         ($2, $4, 'BR65 B', 'ADMIN', 'ACTIVE')`,
      [userA, userB, `+9161${stamp}`, `+9162${stamp}`],
    );
    await pool.query(
      `INSERT INTO notifications (id, user_id, channel, title, body, status, read_at, created_at) VALUES
         ($1, $6, 'IN_APP', 'a1', 'body a1', 'DELIVERED', NULL, now() - interval '3 minutes'),
         ($2, $6, 'IN_APP', 'a2', 'body a2', 'DELIVERED', NULL, now() - interval '2 minutes'),
         ($3, $6, 'PUSH',   'ap', 'body push', 'DELIVERED', NULL, now() - interval '1 minute'),
         ($4, $6, 'IN_APP', 'ar', 'body read', 'READ', $7, now() - interval '4 minutes'),
         ($5, $8, 'IN_APP', 'b1', 'body b1', 'DELIVERED', NULL, now())`,
      [ids.aUnread1, ids.aUnread2, ids.aPush, ids.aAlreadyRead, ids.bUnread, userA, alreadyReadAt, userB],
    );
  });

  afterAll(async () => {
    if (!ready) return;
    const { pool, closePool } = await import('../../db/pool.js');
    await pool.query(`DELETE FROM notifications WHERE user_id = ANY($1::uuid[])`, [[userA, userB]]);
    await pool.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [[userA, userB]]);
    await closePool();
  });

  it('BR-65a: GET /v1/notifications/:id returns the caller own IN_APP row in the list item shape', async () => {
    if (!ready) return;
    const res = await request(app)
      .get(`/v1/notifications/${ids.aUnread1}`)
      .set('Authorization', `Bearer ${tokenFor(userA)}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: ids.aUnread1,
      channel: 'IN_APP',
      title: 'a1',
      body: 'body a1',
      locale: 'en',
      data: {},
      readAt: null,
    });
    expect(typeof res.body.createdAt).toBe('string');

    const list = await request(app).get('/v1/notifications').set('Authorization', `Bearer ${tokenFor(userA)}`);
    const listed = (list.body.items as Array<{ id: string }>).find((n) => n.id === ids.aUnread1);
    expect(Object.keys(res.body).sort()).toEqual(Object.keys(listed ?? {}).sort());
  });

  it('BR-65a: another user id, a PUSH row, an unknown id are all 404 NOT_FOUND; a malformed id is 422', async () => {
    if (!ready) return;
    const asB = `Bearer ${tokenFor(userB)}`;
    const asA = `Bearer ${tokenFor(userA)}`;

    const foreign = await request(app).get(`/v1/notifications/${ids.aUnread1}`).set('Authorization', asB);
    expect(foreign.status).toBe(404);
    expect(foreign.body.code ?? foreign.body.type).toMatch(/NOT_FOUND|not-found/);
    expect(JSON.stringify(foreign.body)).not.toContain('body a1');

    expect((await request(app).get(`/v1/notifications/${ids.aPush}`).set('Authorization', asA)).status).toBe(404);
    expect((await request(app).get(`/v1/notifications/${newId()}`).set('Authorization', asA)).status).toBe(404);
    expect((await request(app).get('/v1/notifications/not-a-uuid').set('Authorization', asA)).status).toBe(422);
  });

  it('BR-65b: read-all marks only the caller unread IN_APP rows read, leaves other users and PUSH rows alone', async () => {
    if (!ready) return;
    const { pool } = await import('../../db/pool.js');

    const res = await request(app)
      .post('/v1/notifications/read-all')
      .set('Authorization', `Bearer ${tokenFor(userA)}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ updated: 2 });

    const rows = await pool.query<{ id: string; read_at: Date | null; status: string }>(
      `SELECT id, read_at, status FROM notifications WHERE user_id = ANY($1::uuid[])`,
      [[userA, userB]],
    );
    const byId = new Map(rows.rows.map((r) => [r.id, r]));
    expect(byId.get(ids.aUnread1)?.read_at).not.toBeNull();
    expect(byId.get(ids.aUnread1)?.status).toBe('READ');
    expect(byId.get(ids.aUnread2)?.read_at).not.toBeNull();
    expect(byId.get(ids.aPush)?.read_at).toBeNull();
    expect(byId.get(ids.bUnread)?.read_at).toBeNull();
    expect(byId.get(ids.bUnread)?.status).toBe('DELIVERED');
    // A notification that was already read keeps its original read time.
    expect(byId.get(ids.aAlreadyRead)?.read_at?.toISOString()).toBe(alreadyReadAt);
  });

  it('BR-65b: read-all is idempotent: a replay reports 0 and does not move any read time', async () => {
    if (!ready) return;
    const { pool } = await import('../../db/pool.js');
    const asA = `Bearer ${tokenFor(userA)}`;
    const before = await pool.query<{ id: string; read_at: Date | null }>(
      `SELECT id, read_at FROM notifications WHERE user_id = $1 ORDER BY id`,
      [userA],
    );

    const replay = await request(app).post('/v1/notifications/read-all').set('Authorization', asA);

    expect(replay.status).toBe(200);
    expect(replay.body).toEqual({ updated: 0 });
    const after = await pool.query<{ id: string; read_at: Date | null }>(
      `SELECT id, read_at FROM notifications WHERE user_id = $1 ORDER BY id`,
      [userA],
    );
    expect(after.rows).toEqual(before.rows);

    // The unread badge agrees: A has nothing unread IN_APP left, B still has one.
    const listA = await request(app).get('/v1/notifications').set('Authorization', asA);
    expect(listA.body.unreadCount).toBe(0);
    const listB = await request(app).get('/v1/notifications').set('Authorization', `Bearer ${tokenFor(userB)}`);
    expect(listB.body.unreadCount).toBe(1);
  });

  it('BR-65b: POST /v1/notifications/read-all is not captured by the /:id routes (no 422 from id validation)', async () => {
    if (!ready) return;
    const res = await request(app)
      .post('/v1/notifications/read-all')
      .set('Authorization', `Bearer ${tokenFor(userB)}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ updated: 1 });
  });
});
