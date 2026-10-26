/**
 * GET /v1/admin/customers: purchase filters (`crop`, `grade`, `from`, `to`), the `sort` allow-list
 * and the per-row `issueCount` / `ticketCount` (BR-115, derived 2026-10-23).
 *
 *  - The filters keep a customer who has at least ONE purchase line (an order that is neither
 *    PENDING_PAYMENT nor CANCELLED, as `/purchases` defines a purchase) matching ALL of them on the
 *    same line; for an `own` actor that line must be at one of its warehouses (BR-91g). They only
 *    narrow the visible set (BR-91d): a filter never reveals an out-of-scope customer.
 *  - `sort` is an allow-list; the keyset cursor carries the sort key's value and the id, and a
 *    cursor minted for another sort is 422. Paging any sort by 1 equals the single full page.
 *  - `issueCount` equals what `/issues` lists for the same actor (return requests, confined to the
 *    actor's warehouses through the order), `ticketCount` what `/support-tickets` lists.
 *
 * Service + real repo inside a transaction that is rolled back (fresh warehouses, so the visible
 * set is exactly what each test created). Skips visibly when no migrated database is configured.
 */
import { describe, expect, it } from 'vitest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, describeIfDatabase, newId } from '../../test/factories.js';
import { insertCrop, insertUser, randomMobile, requireDatabaseTables } from '../../test/dbFixtures.js';
import { encodeNameKey } from './customers.policy.js';
import { customersRepo } from './customers.repo.js';
import { adminCustomerListResponseSchema, customerSorts, listCustomersQuery } from './customers.schema.js';
import { createCustomersService } from './customers.service.js';

// ---------------------------------------------------------------------------
// 1. Query schema (no database)
// ---------------------------------------------------------------------------
describe('customer list query (BR-115)', () => {
  it('BR-115a: sort is an allow-list of keys with an optional "-" for descending; anything else is refused', () => {
    for (const sort of ['name', '-name', 'createdAt', '-createdAt', 'lifetimeValue', '-lifetimeValue', 'totalOrders', '-totalOrders']) {
      expect(listCustomersQuery.safeParse({ sort }).success, sort).toBe(true);
    }
    expect([...customerSorts].sort()).toEqual(
      ['name', '-name', 'createdAt', '-createdAt', 'lifetimeValue', '-lifetimeValue', 'totalOrders', '-totalOrders'].sort(),
    );
    for (const sort of ['mobile', 'email', 'full_name', 'name;drop', '+name', 'NAME', 'lastActivityAt']) {
      expect(listCustomersQuery.safeParse({ sort }).success, sort).toBe(false);
    }
    expect(listCustomersQuery.parse({}).sort).toBe('name');
  });

  it('BR-115a: grade is a produce grade, crop a uuid, from/to real dates with from <= to', () => {
    expect(listCustomersQuery.safeParse({ grade: 'GRADE_2', crop: newId(), from: '2026-10-01', to: '2026-10-31' }).success).toBe(true);
    expect(listCustomersQuery.safeParse({ from: '2026-10-05', to: '2026-10-05' }).success).toBe(true);
    for (const bad of [{ grade: 'A' }, { crop: 'carrot' }, { from: '2026-02-30' }, { to: '2026-13-01' }, { from: '2026-10-31', to: '2026-10-01' }]) {
      expect(listCustomersQuery.safeParse(bad).success, JSON.stringify(bad)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Service + repo against PostgreSQL (rolled back)
// ---------------------------------------------------------------------------
class RollbackFixture extends Error {}

const TABLES = ['customers', 'orders', 'order_items', 'return_requests', 'support_tickets', 'crop_master', 'system_config'];

function dbIt(name: string, fn: () => Promise<void>): void {
  it(name, async (ctx) => {
    if (!(await requireDatabaseTables(...TABLES))) return ctx.skip();
    await fn();
  });
}

interface World {
  tx: Executor;
  whA: string;
  whB: string;
  cropX: string;
  cropY: string;
  svc: ReturnType<typeof createCustomersService>;
  subA: (permission?: string) => ResolvedScope;
  all: (permission?: string) => ResolvedScope;
  tag: string;
  customer: (name: string, opts?: { preferred?: string; createdDaysAgo?: number }) => Promise<string>;
  order: (customerId: string, warehouseId: string, opts?: { status?: string; total?: string; placedAt?: string }) => Promise<string>;
  item: (orderId: string, cropId: string, grade: string) => Promise<void>;
  returnRequest: (orderId: string, customerId: string) => Promise<void>;
  ticket: (customerId: string) => Promise<void>;
}

async function inRolledBackTx(fn: (w: World) => Promise<void>): Promise<void> {
  const { withTransaction } = await import('../../db/pool.js');
  await withTransaction(async (tx) => {
    const adminId = await insertUser(tx, 'ADMIN', 'BR-115 admin');
    const warehouse = async (): Promise<string> => {
      const id = newId();
      await tx.query(`INSERT INTO warehouses (id, code, name) VALUES ($1, $2, 'BR-115 Warehouse')`, [id, `WH-115-${id.slice(0, 8)}`]);
      return id;
    };
    const [whA, whB] = [await warehouse(), await warehouse()];
    const [cropX, cropY] = [await insertCrop(tx), await insertCrop(tx)];
    // Letters only (no digits, no hex-only run), so `q` = tag never hits a mobile or a customer code.
    const tag = `zq${newId().slice(0, 6).replace(/[0-9a-f]/g, (c) => 'ghijklmnopqrstuvwxyz'[parseInt(c, 16)]!)}`;
    const world: World = {
      tx,
      whA,
      whB,
      cropX,
      cropY,
      tag,
      svc: createCustomersService({ repo: customersRepo, db: tx, transaction: async (work) => work(tx) }),
      subA: (permission = 'customer.list.view') =>
        aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, warehouseIds: [whA], permission, userId: adminId }),
      all: (permission = 'customer.list.view') => aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.SUPER_ADMIN, permission, userId: adminId }),
      customer: async (name, opts = {}) => {
        const userId = newId();
        await tx.query(`INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, $3, 'CUSTOMER', 'ACTIVE')`, [
          userId,
          randomMobile(),
          `${tag} ${name}`,
        ]);
        const id = newId();
        await tx.query(
          `INSERT INTO customers (id, user_id, customer_code, preferred_warehouse_id, created_at)
           VALUES ($1, $2, $3, $4, now() - make_interval(days => $5::int))`,
          [id, userId, `CUST-115-${id.slice(0, 8)}`, opts.preferred ?? null, opts.createdDaysAgo ?? 0],
        );
        return id;
      },
      order: async (customerId, warehouseId, opts = {}) => {
        const id = newId();
        await tx.query(
          `INSERT INTO orders (id, order_number, customer_id, warehouse_id, channel, total_amount, payment_method, payment_status, status,
                               placed_at, completed_at, cancellation_reason)
           VALUES ($1, $2, $3, $4, 'DIRECT', $5, 'CASH', 'PAID', $6::order_status, COALESCE($7::timestamptz, now()), now(),
                   CASE WHEN $6::text = 'CANCELLED' THEN 'BR-115 fixture' END)`,
          [id, `ORD-115-${id.slice(0, 8)}`, customerId, warehouseId, opts.total ?? '100.00', opts.status ?? 'PICKED_UP', opts.placedAt ?? null],
        );
        return id;
      },
      item: async (orderId, cropId, grade) => {
        await tx.query(
          `INSERT INTO order_items (order_id, crop_id, grade, qty_kg, unit_price, line_total) VALUES ($1, $2, $3, 1.000, 10.00, 10.00)`,
          [orderId, cropId, grade],
        );
      },
      returnRequest: async (orderId, customerId) => {
        await tx.query(`INSERT INTO return_requests (order_id, customer_id, reason) VALUES ($1, $2, 'Soft')`, [orderId, customerId]);
      },
      ticket: async (customerId) => {
        const id = newId();
        await tx.query(
          `INSERT INTO support_tickets (id, ticket_number, customer_id, category, subject) VALUES ($1, $2, $3, 'QUALITY', 'Soft')`,
          [id, `TKT-115-${id.slice(0, 8)}`, customerId],
        );
      },
    };
    await fn(world);
    throw new RollbackFixture();
  }).catch((error: unknown) => {
    if (!(error instanceof RollbackFixture)) throw error;
  });
}

const names = (items: Array<{ name: string }>, tag: string): string[] => items.map((i) => i.name.replace(`${tag} `, ''));

describeIfDatabase('customer list filters, sort and counts (PostgreSQL) — BR-115', () => {
  dbIt('BR-115b: crop, grade and the IST purchase-date window keep only customers with ONE matching purchase line; unpaid/cancelled orders and another warehouse do not count for an own actor', async () => {
    await inRolledBackTx(async (w) => {
      const ann = await w.customer('Ann');
      const bob = await w.customer('Bob');
      const cat = await w.customer('Cat');
      const dan = await w.customer('Dan', { preferred: w.whA });
      const eve = await w.customer('Eve');
      // Ann: X/GRADE_1 at A on 2031-05-10 IST. Bob: X/GRADE_2 + Y/GRADE_1 at A (no line is X AND GRADE_1).
      await w.item(await w.order(ann, w.whA, { placedAt: '2031-05-10T00:30:00+05:30' }), w.cropX, 'GRADE_1');
      const bobOrder = await w.order(bob, w.whA, { placedAt: '2031-05-12T10:00:00+05:30' });
      await w.item(bobOrder, w.cropX, 'GRADE_2');
      await w.item(bobOrder, w.cropY, 'GRADE_1');
      // Cat: X/GRADE_1 but the order was CANCELLED, and another one is still PENDING_PAYMENT.
      await w.item(await w.order(cat, w.whA, { status: 'CANCELLED' }), w.cropX, 'GRADE_1');
      await w.item(await w.order(cat, w.whA, { status: 'PENDING_PAYMENT' }), w.cropX, 'GRADE_1');
      // Dan: visible at A (preferred) but bought X/GRADE_1 only at B.
      await w.item(await w.order(dan, w.whB), w.cropX, 'GRADE_1');
      // Eve: X/GRADE_1 at B only: not visible to the A admin at all.
      await w.item(await w.order(eve, w.whB), w.cropX, 'GRADE_1');

      const list = async (scope: ResolvedScope, query: Record<string, unknown>) => {
        const res = await w.svc.list(scope, listCustomersQuery.parse({ limit: 100, q: w.tag, ...query }));
        expect(adminCustomerListResponseSchema.parse(res)).toEqual(res);
        return names(res.items, w.tag);
      };

      expect(await list(w.subA(), {})).toEqual(['Ann', 'Bob', 'Cat', 'Dan']);
      expect(await list(w.subA(), { crop: w.cropX })).toEqual(['Ann', 'Bob']);
      expect(await list(w.subA(), { crop: w.cropX, grade: 'GRADE_1' })).toEqual(['Ann']);
      expect(await list(w.subA(), { grade: 'GRADE_1' })).toEqual(['Ann', 'Bob']);
      // 2031-05-10 00:30 IST is 2031-05-09 19:00 UTC: the window is the Asia/Kolkata day.
      expect(await list(w.subA(), { from: '2031-05-10', to: '2031-05-10' })).toEqual(['Ann']);
      expect(await list(w.subA(), { from: '2031-05-11' })).toEqual(['Bob']);
      expect(await list(w.subA(), { to: '2031-05-09' })).toEqual([]);
      // All scope: Dan's and Eve's purchases at B count.
      expect(await list(w.all(), { crop: w.cropX, grade: 'GRADE_1' })).toEqual(['Ann', 'Dan', 'Eve']);
      // The summary still counts the whole visible set (BR-91e), not the filtered page.
      const res = await w.svc.list(w.subA(), listCustomersQuery.parse({ limit: 100, crop: w.cropY }));
      expect(res.summary.total).toBeGreaterThanOrEqual(4);
    });
  });

  dbIt('BR-115c: issueCount and ticketCount equal what /issues and /support-tickets list for the same actor (issues confined to the warehouse for own)', async () => {
    await inRolledBackTx(async (w) => {
      const ann = await w.customer('Ann');
      const atA = await w.order(ann, w.whA);
      const atB = await w.order(ann, w.whB);
      await w.returnRequest(atA, ann);
      await w.returnRequest(atA, ann);
      await w.returnRequest(atB, ann);
      await w.ticket(ann);
      const bob = await w.customer('Bob', { preferred: w.whA });

      for (const [scope, issueCount] of [
        [w.subA(), 2],
        [w.all(), 3],
      ] as const) {
        const res = await w.svc.list(scope, listCustomersQuery.parse({ limit: 100, q: w.tag }));
        const annRow = res.items.find((i) => i.id === ann)!;
        const bobRow = res.items.find((i) => i.id === bob)!;
        expect(annRow).toMatchObject({ issueCount, ticketCount: 1 });
        expect(bobRow).toMatchObject({ issueCount: 0, ticketCount: 0 });
        const issues = await w.svc.listIssues({ ...scope, permission: 'customer.issues.view' }, ann, { limit: 100 });
        expect(issues.items).toHaveLength(annRow.issueCount);
        const tickets = await w.svc.listSupportTickets({ ...scope, permission: 'customer.support_history.view' }, ann, { limit: 100 });
        expect(tickets.items).toHaveLength(annRow.ticketCount);
      }
    });
  });

  dbIt('BR-115d: every sort key in both directions pages by 1 with no skip or repeat, in the documented order; a cursor from another sort is 422', async () => {
    await inRolledBackTx(async (w) => {
      // Ties on purpose: equal created_at days, equal totals and equal order counts, so the id
      // tie-breaker in the keyset is exercised.
      const specs: Array<[string, number, string[]]> = [
        ['Ann', 3, ['50.00']],
        ['Bob', 1, ['50.00']],
        ['Cat', 3, ['20.00', '30.00']],
        ['Dan', 0, []],
        ['Eve', 1, ['999.99']],
      ];
      for (const [name, days, totals] of specs) {
        const id = await w.customer(name, { preferred: w.whA, createdDaysAgo: days });
        for (const total of totals) await w.order(id, w.whA, { total });
      }

      const fullPage = async (sort: string) => {
        const res = await w.svc.list(w.subA(), listCustomersQuery.parse({ limit: 100, q: w.tag, sort }));
        return res.items;
      };
      const pagedByOne = async (sort: string) => {
        const seen: string[] = [];
        let cursor: string | null = null;
        for (let i = 0; i < 10; i += 1) {
          const res = await w.svc.list(w.subA(), listCustomersQuery.parse({ limit: 1, q: w.tag, sort, ...(cursor === null ? {} : { cursor }) }));
          seen.push(...res.items.map((item) => item.id));
          cursor = res.page.nextCursor;
          if (cursor === null) break;
        }
        return seen;
      };

      for (const sort of customerSorts) {
        const full = await fullPage(sort);
        expect(full, sort).toHaveLength(5);
        expect(await pagedByOne(sort), sort).toEqual(full.map((i) => i.id));
        const desc = sort.startsWith('-');
        const key = desc ? sort.slice(1) : sort;
        const value = (i: (typeof full)[number]): string | number =>
          key === 'name' ? i.name : key === 'createdAt' ? i.createdAt : key === 'totalOrders' ? i.totalOrders : -1;
        if (key !== 'lifetimeValue') {
          const values = full.map(value);
          const sorted = [...values].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
          expect(values, sort).toEqual(desc ? sorted.reverse() : sorted);
        }
      }
      // lifetimeValue is compared as a number, not as text ("999.99" > "50.00" > "50.00" > "50.00" (Cat 20+30) > "0.00").
      const byValue = names(await fullPage('-lifetimeValue'), w.tag);
      expect(byValue[0]).toBe('Eve');
      expect(byValue[4]).toBe('Dan');
      expect(names(await fullPage('-totalOrders'), w.tag)[0]).toBe('Cat');

      // A cursor minted for one sort is refused by another (and by the default name sort).
      const first = await w.svc.list(w.subA(), listCustomersQuery.parse({ limit: 1, q: w.tag, sort: 'createdAt' }));
      const err = await w.svc.list(w.subA(), listCustomersQuery.parse({ limit: 1, q: w.tag, sort: '-totalOrders', cursor: first.page.nextCursor! })).then(
        () => null,
        (e: unknown) => e,
      );
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).status).toBe(422);
      const nameCursor = encodeNameKey({ name: 'x', id: newId() });
      await expect(w.svc.list(w.subA(), listCustomersQuery.parse({ limit: 1, sort: '-name', cursor: nameCursor }))).rejects.toMatchObject({ status: 422 });
      await expect(w.svc.list(w.subA(), listCustomersQuery.parse({ limit: 1, cursor: first.page.nextCursor! }))).rejects.toMatchObject({ status: 422 });
    });
  });
});
