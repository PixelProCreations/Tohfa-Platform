/**
 * Returns & Issues: warehouse scoping against the REAL schema (BR-30, BR-36).
 *
 * The service tests in returnRequests.test.ts drive a stateful fake repo, so the real
 * `scopedWhere` SQL was never exercised. That is how this leak shipped: a Sub Warehouse
 * Admin holds `rma.request.process` and `inventory.quality_check.perform` at `all`, and
 * `scopedWhere` adds no warehouse clause at `all`, so a Sub could list, read, inspect,
 * approve, reject and refund the returns of ANY warehouse. These tests run the real repo
 * and the real service inside one transaction that is always rolled back.
 *
 * `session_replication_role = replica` switches off FK and trigger enforcement for this
 * transaction only, so the fixture does not have to build users and farmers just to get an
 * order. Everything rolls back.
 */
import { afterAll, beforeAll, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { requireDatabaseTables } from '../../test/dbFixtures.js';
import { aScope, anActor, describeIfDatabase, newId } from '../../test/factories.js';
import { createReturnRequestsService } from './returnRequests.service.js';

class RollbackFixture extends Error {}

interface World {
  ooty: string;
  coon: string;
  returnOoty: string;
  returnCoon: string;
}

describeIfDatabase('Returns warehouse scoping (PostgreSQL)', () => {
  let ready = false;

  beforeAll(async () => {
    ready = await requireDatabaseTables('return_requests', 'orders', 'customers', 'warehouses');
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
      throw new RollbackFixture();
    }).catch((error: unknown) => {
      if (!(error instanceof RollbackFixture)) throw error;
    });
  }

  /** One order and one PENDING return in each of two warehouses. */
  async function seedWorld(tx: Executor): Promise<World> {
    await tx.query(`SET LOCAL session_replication_role = replica`);
    const stamp = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
    const wh = await tx.query<{ id: string; code: string }>(`SELECT id, code FROM warehouses`);
    const byCode = new Map(wh.rows.map((r) => [r.code, r.id]));
    const ooty = byCode.get('WH-OOTY')!;
    const coon = byCode.get('WH-COON')!;

    const returnIn = async (label: string, warehouse: string): Promise<string> => {
      const customer = await tx.query<{ id: string }>(
        `INSERT INTO customers (user_id, customer_code, preferred_warehouse_id)
         VALUES ($1, $2, $3) RETURNING id`,
        [newId(), `C-${label}-${stamp}`, warehouse],
      );
      const order = await tx.query<{ id: string }>(
        `INSERT INTO orders (order_number, customer_id, warehouse_id, channel, status, total_amount, placed_at)
         VALUES ($1, $2, $3, 'ONLINE', 'DELIVERED', 100, now()) RETURNING id`,
        [`O-${label}-${stamp}`, customer.rows[0]!.id, warehouse],
      );
      const ret = await tx.query<{ id: string }>(
        `INSERT INTO return_requests (order_id, customer_id, status, reason)
         VALUES ($1, $2, 'PENDING', $3) RETURNING id`,
        [order.rows[0]!.id, customer.rows[0]!.id, `fixture-${label}`],
      );
      return ret.rows[0]!.id;
    };

    return {
      ooty,
      coon,
      returnOoty: await returnIn('ooty', ooty),
      returnCoon: await returnIn('coon', coon),
    };
  }

  /** The real service over the real repo, inside the caller's transaction. */
  function serviceOn(tx: Executor): ReturnType<typeof createReturnRequestsService> {
    return createReturnRequestsService({ db: tx });
  }

  /** A warehouse admin whose grant on the return permissions is `all` (docs/rbac.json). */
  function subScope(warehouseId: string): ResolvedScope {
    return aScope({
      level: ScopeLevel.ALL,
      permission: 'rma.request.process',
      roleCode: RoleCode.SUB_WH_ADMIN,
      warehouseIds: [warehouseId],
    });
  }

  const mainScope = (): ResolvedScope =>
    aScope({ level: ScopeLevel.ALL, permission: 'rma.request.process', roleCode: RoleCode.MAIN_WH_ADMIN });

  const superScope = (): ResolvedScope =>
    aScope({ level: ScopeLevel.ALL, permission: 'rma.request.process', roleCode: RoleCode.SUPER_ADMIN });

  const statusOf = async (tx: Executor, id: string): Promise<string> =>
    (await tx.query<{ status: string }>(`SELECT status FROM return_requests WHERE id = $1`, [id])).rows[0]!.status;

  it('BR-30: a Sub Warehouse Admin holding the `all` grant lists only its own warehouse\'s returns', async (ctx) => {
    if (!ready) return ctx.skip();
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const svc = serviceOn(tx);
      const ootyList = await svc.list(subScope(w.ooty), { limit: 100 } as never);
      const ids = ootyList.items.map((r) => r.id);
      expect(ids).toContain(w.returnOoty);
      expect(ids).not.toContain(w.returnCoon);
      const coonList = await svc.list(subScope(w.coon), { limit: 100 } as never);
      expect(coonList.items.map((r) => r.id)).toContain(w.returnCoon);
      expect(coonList.items.map((r) => r.id)).not.toContain(w.returnOoty);
    });
  });

  it('BR-30: reading another warehouse\'s return by id is the same NOT_FOUND as an unknown id (get and history)', async (ctx) => {
    if (!ready) return ctx.skip();
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const svc = serviceOn(tx);
      const sub = subScope(w.ooty);
      const caught = async (fn: () => Promise<unknown>): Promise<{ code: string; status: number }> => {
        try {
          await fn();
        } catch (error) {
          const e = error as { code?: string; status?: number };
          return { code: e.code ?? 'none', status: e.status ?? 0 };
        }
        return { code: 'RESOLVED', status: 200 };
      };
      const foreignGet = await caught(() => svc.getById(sub, w.returnCoon));
      const unknownGet = await caught(() => svc.getById(sub, newId()));
      expect(foreignGet).toEqual({ code: 'NOT_FOUND', status: 404 });
      expect(unknownGet).toEqual(foreignGet);
      const foreignHistory = await caught(() => svc.getHistory(sub, w.returnCoon));
      expect(foreignHistory).toEqual(foreignGet);
      // its own warehouse's return is readable
      expect((await svc.getById(sub, w.returnOoty)).id).toBe(w.returnOoty);
    });
  });

  it('BR-30: inspect, approve, reject and both refunds on another warehouse\'s return are NOT_FOUND and change nothing', async (ctx) => {
    if (!ready) return ctx.skip();
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const svc = serviceOn(tx);
      const sub = subScope(w.ooty);
      const actor = anActor();
      const auditBefore = Number(
        (await tx.query<{ n: string }>(`SELECT count(*)::text AS n FROM audit_log`)).rows[0]!.n,
      );
      const attempts: Array<[string, () => Promise<unknown>]> = [
        ['inspect', () => svc.inspect(actor, sub, w.returnCoon, { items: [], note: 'x' } as never)],
        ['approve', () => svc.approve(actor, sub, w.returnCoon)],
        ['reject', () => svc.reject(actor, sub, w.returnCoon, { reason: 'x' } as never)],
        ['refundWallet', () => svc.refundWallet(actor, sub, w.returnCoon, 'key-1')],
        ['refundBank', () => svc.refundBank(actor, sub, w.returnCoon, 'key-2')],
      ];
      for (const [name, attempt] of attempts) {
        const error = await attempt().then(
          () => null,
          (e: unknown) => e as { code?: string; status?: number },
        );
        expect(error, `${name} must be refused`).not.toBeNull();
        expect(error?.code, name).toBe('NOT_FOUND');
        expect(error?.status, name).toBe(404);
      }
      expect(await statusOf(tx, w.returnCoon)).toBe('PENDING');
      const auditAfter = Number(
        (await tx.query<{ n: string }>(`SELECT count(*)::text AS n FROM audit_log`)).rows[0]!.n,
      );
      expect(auditAfter).toBe(auditBefore);
    });
  });

  it('BR-30: a Main or Super Admin with no assigned warehouse sees both warehouses\' returns', async (ctx) => {
    if (!ready) return ctx.skip();
    await inRolledBackTx(async (tx) => {
      const w = await seedWorld(tx);
      const svc = serviceOn(tx);
      for (const scope of [mainScope(), superScope()]) {
        const ids = (await svc.list(scope, { limit: 100 } as never)).items.map((r) => r.id);
        expect(ids, scope.roleCode).toContain(w.returnOoty);
        expect(ids, scope.roleCode).toContain(w.returnCoon);
        expect((await svc.getById(scope, w.returnCoon)).id).toBe(w.returnCoon);
      }
    });
  });
});
