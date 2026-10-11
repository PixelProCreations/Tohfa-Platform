/**
 * Migration 0064: `order_number_seq` is owned by a migration, not created lazily by the order and
 * sale repos inside their transactions. These checks read the catalog and the sequence state only;
 * they never call nextval (a sequence is not transactional, so a test must not consume numbers).
 */
import { afterAll, beforeAll, expect, it } from 'vitest';
import { describeIfDatabase } from '../test/factories.js';
import { requireDatabaseTables } from '../test/dbFixtures.js';

describeIfDatabase('order_number_seq (migration 0064)', () => {
  let ready = false;

  beforeAll(async () => {
    ready = await requireDatabaseTables('orders');
  });

  afterAll(async () => {
    if (!ready) return;
    const { closePool } = await import('./pool.js');
    await closePool();
  });

  it('exists as a sequence owned by orders.order_number', async (ctx) => {
    if (!ready) return ctx.skip();
    const { pool } = await import('./pool.js');
    const res = await pool.query<{ kind: string | null; owner: string | null }>(
      `SELECT c.relkind::text AS kind,
              (SELECT a.attname::text
                 FROM pg_depend d
                 JOIN pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
                WHERE d.objid = c.oid AND d.refobjid = 'public.orders'::regclass AND d.deptype = 'a') AS owner
         FROM pg_class c
        WHERE c.oid = to_regclass('public.order_number_seq')`,
    );
    expect(res.rows).toHaveLength(1);
    expect(res.rows[0]).toEqual({ kind: 'S', owner: 'order_number' });
  });

  it('will never reissue a number already used by an order (next value is above every TOH-YYYY-NNNNNN suffix)', async (ctx) => {
    if (!ready) return ctx.skip();
    const { pool } = await import('./pool.js');
    const res = await pool.query<{ next_value: string; max_used: string }>(
      `SELECT (CASE WHEN s.is_called THEN s.last_value + 1 ELSE s.last_value END)::text AS next_value,
              COALESCE((SELECT max((regexp_match(order_number, '^TOH-[0-9]{4}-([0-9]+)$'))[1]::bigint) FROM orders), 0)::text AS max_used
         FROM order_number_seq s`,
    );
    const row = res.rows[0]!;
    expect(BigInt(row.next_value) > BigInt(row.max_used)).toBe(true);
  });
});
