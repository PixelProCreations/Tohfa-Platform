/**
 * Real-database coverage of notification inserts. Unit tests mock the repo, so they missed a
 * SQL type error that only EMAIL rows hit (`$3 = 'EMAIL'` against a notification_channel
 * parameter: "operator does not exist"/"inconsistent types deduced for parameter $3"), which
 * silently dropped every email notification. These run the real SQL.
 *
 * Fixture users are committed (the service reads through its own pool) and deleted in afterAll.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { newId } from '../../test/factories.js';
import { insertUser, requireDatabaseTables } from '../../test/dbFixtures.js';
import { notificationsRepo } from './notifications.repo.js';
import { notificationsService } from './notifications.service.js';
import { eventBus } from '../../events/bus.js';

describe('notifications createNotification (real SQL) — BR-185', () => {
  let ready = false;
  let userId = '';
  let pool: typeof import('../../db/pool.js').pool;

  beforeAll(async () => {
    ready = await requireDatabaseTables('notifications', 'notification_templates', 'users');
    if (!ready) return;
    ({ pool } = await import('../../db/pool.js'));
    userId = await insertUser(pool, 'CUSTOMER', 'Notif DB Test');
  });

  afterAll(async () => {
    if (!ready) return;
    await pool.query(`DELETE FROM notifications WHERE user_id = $1`, [userId]);
    await pool.query(`DELETE FROM users WHERE id = $1`, [userId]);
  });

  const it_ = (name: string, fn: () => Promise<void>): void => {
    it(name, async (ctx) => {
      if (!ready) return ctx.skip();
      await fn();
    }, 30_000);
  };

  it_('inserts IN_APP and PUSH rows as DELIVERED with sent_at set', async () => {
    for (const channel of ['IN_APP', 'PUSH'] as const) {
      const row = await notificationsRepo.createNotification(pool, { userId, channel, title: 't', body: `b-${channel}` });
      expect(row).toMatchObject({ channel, status: 'DELIVERED' });
      expect(row?.sent_at).not.toBeNull();
    }
  });

  it_('inserts an EMAIL row as QUEUED with no sent_at (the case the mocks missed)', async () => {
    const row = await notificationsRepo.createNotification(pool, { userId, channel: 'EMAIL', title: 't', body: 'mail' });
    expect(row).toMatchObject({ channel: 'EMAIL', status: 'QUEUED', sent_at: null });
  });

  it_('is idempotent per (user, dedupeKey): a replay inserts nothing and returns null', async () => {
    const params = { userId, channel: 'EMAIL' as const, body: 'once', dedupeKey: `db-test:${newId()}` };
    expect(await notificationsRepo.createNotification(pool, params)).not.toBeNull();
    expect(await notificationsRepo.createNotification(pool, params)).toBeNull();
    const n = await pool.query(`SELECT 1 FROM notifications WHERE user_id = $1 AND provider_message_id = $2`, [userId, params.dedupeKey]);
    expect(n.rowCount).toBe(1);
  });

  it_('publishing order.confirmed on the bus creates the in-app and email rows through the real service', async () => {
    expect(notificationsService).toBeDefined(); // importing the module registers the bus subscribers
    const orderId = newId();
    await eventBus.publish('order.confirmed', { userId, orderId, orderNumber: 'ORD-DB-TEST', totalAmount: '100.00' });
    const rows = await pool.query<{ channel: string; status: string }>(
      `SELECT channel, status FROM notifications WHERE user_id = $1 AND provider_message_id LIKE $2 ORDER BY channel`,
      [userId, `%:order.confirmed:${userId}:${orderId}`],
    );
    const byChannel = Object.fromEntries(rows.rows.map((r) => [r.channel, r.status]));
    expect(byChannel['IN_APP']).toBe('DELIVERED');
    expect(byChannel['EMAIL']).toBe('QUEUED');
    // Replay: same event again adds nothing.
    await eventBus.publish('order.confirmed', { userId, orderId, orderNumber: 'ORD-DB-TEST', totalAmount: '100.00' });
    const again = await pool.query(`SELECT 1 FROM notifications WHERE user_id = $1 AND provider_message_id LIKE $2`, [userId, `%:order.confirmed:${userId}:${orderId}`]);
    expect(again.rowCount).toBe(rows.rowCount);
  });
});
