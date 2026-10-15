/**
 * Cursor paging of the three inventory lists: GET /admin/batches, GET /admin/stock-ledger and
 * GET /admin/allocations.
 *
 * Each list is ordered by `created_at DESC` plus an id tie-break, but the cursor used to be the
 * last row's id alone (`b.id > $cursor`, `l.id < $cursor`, `a.id < $cursor`). uuids are not
 * ordered by time, so the next page started at an arbitrary point: rows were skipped or repeated.
 * A cursor that was not a uuid reached the SQL cast and was a 500.
 *
 * The fix is the keyset cursor already used by the wallet and admin-order lists: the cursor carries
 * the row's microsecond `created_at` AND its id, and the predicate is the row-value comparison
 * that matches the ORDER BY exactly. The cursor stays opaque to clients (openapi `CursorParam`).
 *
 * The integration tests run inside one rolled-back transaction on a fixture warehouse, with
 * explicit `created_at` values that tie (same microsecond) and interleave with id order.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type pg from 'pg';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { aScope, databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { listAllocationsQuery } from '../allocations/allocations.schema.js';
import { listBatchesQuery, listStockLedgerQuery } from './inventory.schema.js';

const BAD_CURSORS = ['not-a-cursor', newId(), Buffer.from('["ib","2026-99-99T00:00:00.000000Z","x"]').toString('base64url')];

describe('inventory list cursors are validated (contract: openapi CursorParam is opaque)', () => {
  it('BR-30: a cursor these lists did not produce (garbage, a bare uuid, an impossible timestamp) is refused at validation, never cast in SQL', () => {
    for (const cursor of BAD_CURSORS) {
      expect(listBatchesQuery.safeParse({ cursor }).success, `batches ${cursor}`).toBe(false);
      expect(listStockLedgerQuery.safeParse({ cursor }).success, `ledger ${cursor}`).toBe(false);
      expect(listAllocationsQuery.safeParse({ cursor }).success, `allocations ${cursor}`).toBe(false);
    }
  });
});

describeIfDatabase('inventory list keyset paging (PostgreSQL, rolled back)', () => {
  let ready = false;
  let client: pg.PoolClient;
  let warehouseId = '';
  const scope = aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUPER_ADMIN });

  // Six instants: three rows share T1 to the microsecond, two share T2, one at T3. Row ids are
  // random, so id order interleaves with time order.
  const T1 = '2026-10-13T05:06:07.123456Z';
  const T2 = '2026-10-13T05:06:07.123457Z';
  const T3 = '2026-10-13T05:06:08.000001Z';
  const times = [T1, T2, T1, T3, T1, T2];

  /** Expected order: created_at DESC, id DESC (the ORDER BY of every list). */
  function expectedOrder(rows: Array<{ id: string; at: string }>): string[] {
    return [...rows]
      .sort((a, b) => (a.at === b.at ? (a.id < b.id ? 1 : -1) : a.at < b.at ? 1 : -1))
      .map((r) => r.id);
  }

  async function pageAll(fetch: (cursor: string | undefined) => Promise<{ items: Array<{ id: string }>; page: { nextCursor: string | null } }>): Promise<string[]> {
    const seen: string[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < 20; page += 1) {
      const res = await fetch(cursor);
      seen.push(...res.items.map((item) => item.id));
      if (res.page.nextCursor === null) break;
      cursor = res.page.nextCursor;
    }
    return seen;
  }

  let farmerId = '';
  let cropId = '';

  async function insertBatch(at: string): Promise<string> {
    const id = newId();
    await client.query(
      `INSERT INTO inventory_batches (id, batch_code, warehouse_id, crop_id, grade, source_farmer_id, qty_received, qty_available, status, created_at)
       VALUES ($1, $2, $3, $4, 'GRADE_1', $5, 10, 0, 'ACTIVE', $6::timestamptz)`,
      [id, `B-PG-${id.slice(0, 8)}`, warehouseId, cropId, farmerId, at],
    );
    return id;
  }

  beforeAll(async () => {
    ready = await databaseReady('allocations');
    if (!ready) return;
    const [{ pool }, fx] = await Promise.all([import('../../db/pool.js'), import('../../test/dbFixtures.js')]);
    client = await pool.connect();
    await client.query('BEGIN');
    farmerId = (await fx.insertFarmerWithPlot(client)).farmerId;
    cropId = await fx.insertCrop(client);
    warehouseId = newId();
    await client.query(`INSERT INTO warehouses (id, code, name) VALUES ($1, $2, 'Paging Fixture Warehouse')`, [
      warehouseId,
      `WH-PG-${warehouseId.slice(0, 8)}`,
    ]);
  });

  afterAll(async () => {
    if (!ready) return;
    await client.query('ROLLBACK');
    client.release();
    const [{ closePool }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
    await Promise.allSettled([closePool(), closeRedis()]);
  });

  it('BR-30: the batch list pages through tied and interleaved created_at values with no row skipped or repeated', async () => {
    if (!ready) return;
    const { inventoryRepo } = await import('./inventory.repo.js');
    const rows: Array<{ id: string; at: string }> = [];
    for (const at of times) rows.push({ id: await insertBatch(at), at });

    for (const limit of [1, 2, 4]) {
      const seen = await pageAll((cursor) =>
        inventoryRepo.listBatches(client, scope, listBatchesQuery.parse({ warehouseId, limit, ...(cursor ? { cursor } : {}) })),
      );
      expect(seen, `limit ${limit}`).toEqual(expectedOrder(rows));
    }
  });

  it('BR-37: the stock ledger list pages through tied and interleaved created_at values with no row skipped or repeated', async () => {
    if (!ready) return;
    const { inventoryRepo } = await import('./inventory.repo.js');
    const batchId = await insertBatch(T1);
    const rows: Array<{ id: string; at: string }> = [];
    for (const at of times) {
      const r = await client.query<{ id: string }>(
        `INSERT INTO stock_ledger (batch_id, warehouse_id, movement_type, qty_delta, balance_after, ref_type, remarks, created_at)
         VALUES ($1, $2, 'RECEIPT', 1, 0, 'TEST', 'paging fixture', $3::timestamptz) RETURNING id`,
        [batchId, warehouseId, at],
      );
      rows.push({ id: r.rows[0]!.id, at });
    }

    for (const limit of [1, 2, 4]) {
      const seen = await pageAll((cursor) =>
        inventoryRepo.listStockLedger(client, scope, listStockLedgerQuery.parse({ batchId, limit, ...(cursor ? { cursor } : {}) })),
      );
      expect(seen, `limit ${limit}`).toEqual(expectedOrder(rows));
    }
  });

  it('BR-12: the allocations list pages through tied and interleaved created_at values with no row skipped or repeated', async () => {
    if (!ready) return;
    const { allocationsRepo } = await import('../allocations/allocations.repo.js');
    const rows: Array<{ id: string; at: string }> = [];
    const channels = ['ONLINE', 'LIVE_MARKET', 'RESERVE'];
    for (let b = 0; b < 2; b += 1) {
      const batchId = await insertBatch(T2);
      for (let c = 0; c < channels.length; c += 1) {
        const at = times[b * channels.length + c]!;
        const r = await client.query<{ id: string }>(
          `INSERT INTO allocations (batch_id, warehouse_id, channel, allocated_qty, created_at)
           VALUES ($1, $2, $3, 0, $4::timestamptz) RETURNING id`,
          [batchId, warehouseId, channels[c], at],
        );
        rows.push({ id: r.rows[0]!.id, at });
      }
    }

    for (const limit of [1, 2, 4]) {
      const seen = await pageAll((cursor) =>
        allocationsRepo.listAllocations(client, scope, listAllocationsQuery.parse({ warehouseId, limit, ...(cursor ? { cursor } : {}) })),
      );
      expect(seen, `limit ${limit}`).toEqual(expectedOrder(rows));
    }
  });

  it('BR-30: a malformed cursor that bypassed route validation is a 422 VALIDATION_FAILED from the repo, never a SQL error', async () => {
    if (!ready) return;
    const [{ inventoryRepo }, { allocationsRepo }] = await Promise.all([
      import('./inventory.repo.js'),
      import('../allocations/allocations.repo.js'),
    ]);
    await client.query('SAVEPOINT bad_cursor');
    for (const cursor of BAD_CURSORS) {
      await expect(inventoryRepo.listBatches(client, scope, { limit: 2, cursor })).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
      await expect(inventoryRepo.listStockLedger(client, scope, { limit: 2, cursor })).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
      await expect(allocationsRepo.listAllocations(client, scope, { limit: 2, cursor })).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
    }
    await client.query('ROLLBACK TO SAVEPOINT bad_cursor');
  });
});
