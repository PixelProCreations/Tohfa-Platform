/**
 * BR-133 (owner request 2026-10-27, "Group D" D6c): GET /admin/finance/daily-summary carries
 * `totalAcrossWarehouses`, the same five cash figures summed over every warehouse the CALLER may see
 * (warehouseScopeFilter: an all-scope caller every active warehouse, a Sub admin only its own),
 * for the same Asia/Kolkata day and with the same definitions as the per-warehouse figures (BR-74).
 * Each row is converted to integer paise in SQL before it is summed; the per-warehouse figures are
 * unchanged. Naming and the active-only reading are UNCONFIRMED.
 *
 * Service + real SQL inside rolled-back transactions, on a far-past day no other suite uses.
 */
import { afterAll, beforeAll, expect, it } from 'vitest';
import { fromPaise, RoleCode, ScopeLevel, toPaise, type Money } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { aScope, databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { cashCloseRepo } from './cash-close.repo.js';
import { dailySummaryResponse } from './cash-close.schema.js';
import { createCashCloseService } from './cash-close.service.js';

const DAY = '1949-08-17';
const IN_DAY = '1949-08-17T05:00:00Z'; // 10:30 IST on DAY

class RollbackFixture extends Error {}

afterAll(async () => {
  if (process.env['DATABASE_URL'] === undefined) return;
  const [{ closePool }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
  await Promise.allSettled([closePool(), closeRedis()]);
});

describeIfDatabase('daily cash summary total across warehouses (PostgreSQL, rolled back) — BR-133', () => {
  let ready = false;

  beforeAll(async () => {
    ready = await databaseReady('cash_closes');
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

  const service = (tx: Executor) => createCashCloseService({ repo: cashCloseRepo, db: tx, runTx: async (fn) => fn(tx) });
  const main = (userId: string): ResolvedScope =>
    aScope({ level: ScopeLevel.ALL, roleCode: RoleCode.MAIN_WH_ADMIN, permission: 'finance.cash_close.manage', userId });
  const sub = (warehouseId: string, userId: string): ResolvedScope =>
    aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.SUB_WH_ADMIN, permission: 'finance.cash_close.manage', warehouseIds: [warehouseId], userId });

  interface Fixture { closer: string; customerId: string; walletId: string; category: string; byCode: Map<string, string> }

  async function seed(tx: Executor): Promise<Fixture> {
    const { insertUser } = await import('../../test/dbFixtures.js');
    const closer = await insertUser(tx, 'ADMIN', 'BR-133 closer');
    const customerUser = await insertUser(tx, 'CUSTOMER', 'BR-133 customer');
    const customer = await tx.query<{ id: string }>(`INSERT INTO customers (user_id, customer_code) VALUES ($1, $2) RETURNING id`, [customerUser, `CUST-133-${newId().slice(0, 8)}`]);
    const wallet = await tx.query<{ id: string }>(`INSERT INTO wallets (owner_type, customer_id) VALUES ('CUSTOMER', $1) RETURNING id`, [customer.rows[0]!.id]);
    const category = await tx.query<{ id: string }>(`SELECT id FROM expense_categories WHERE name = 'Transport'`);
    const wh = await tx.query<{ id: string; code: string }>(`SELECT id, code FROM warehouses WHERE code IN ('WH-OOTY', 'WH-COON', 'WH-KOTA', 'WH-GUDA')`);
    return { closer, customerId: customer.rows[0]!.id, walletId: wallet.rows[0]!.id, category: category.rows[0]!.id, byCode: new Map(wh.rows.map((w) => [w.code, w.id])) };
  }

  const order = (tx: Executor, f: Fixture, warehouseId: string, total: string) =>
    tx.query(
      `INSERT INTO orders (order_number, customer_id, warehouse_id, channel, total_amount, payment_method, payment_status, status, placed_at, completed_at)
       VALUES ($1, $2, $3, 'MARKET', $4, 'CASH'::payment_method, 'PAID', 'PICKED_UP'::order_status, $5::timestamptz - interval '1 hour', $5::timestamptz)`,
      [`CI133-${newId()}`, f.customerId, warehouseId, total, IN_DAY],
    );
  const topUp = (tx: Executor, f: Fixture, warehouseId: string, amount: string) =>
    tx.query(
      `INSERT INTO topups (wallet_id, customer_id, channel, amount, fiscal_cash_tag, warehouse_id, processed_by, status, created_at)
       VALUES ($1, $2, 'CASH'::topup_channel, $3, $4, $5, $6, 'SUCCESS', $7::timestamptz)`,
      [f.walletId, f.customerId, amount, `TAG-133-${newId()}`, warehouseId, f.closer, IN_DAY],
    );
  const expense = (tx: Executor, f: Fixture, warehouseId: string, amount: string) =>
    tx.query(
      `INSERT INTO expenses (warehouse_id, category, category_id, amount, expense_date, payment_method, status, recorded_by)
       VALUES ($1, 'Transport', $2, $3, $4::date, 'CASH', 'RECORDED', $5)`,
      [warehouseId, f.category, amount, DAY, f.closer],
    );
  const earlierClose = (tx: Executor, f: Fixture, warehouseId: string, date: string, counted: string) =>
    tx.query(
      `INSERT INTO cash_closes (warehouse_id, close_date, opening_cash, cash_sales, cash_top_ups, cash_expenses, expected_closing, counted_cash, difference, closed_by)
       VALUES ($1, $2::date, 0, $3, 0, 0, $3, $3, 0, $4)`,
      [warehouseId, date, counted, f.closer],
    );

  const FIGURES = ['openingCash', 'cashSales', 'cashTopUps', 'cashExpenses', 'expectedClosing'] as const;

  it('BR-133a: an all-scope caller gets the sum over every active warehouse, exactly, beside the unchanged per-warehouse figures; an inactive warehouse is left out', async (ctx) => {
    if (!ready) return ctx.skip();
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const ooty = f.byCode.get('WH-OOTY')!;
      const coonoor = f.byCode.get('WH-COON')!;
      const gudalur = f.byCode.get('WH-GUDA')!;
      await order(tx, f, ooty, '100.10');
      await order(tx, f, ooty, '0.20');
      await topUp(tx, f, ooty, '0.10');
      await expense(tx, f, ooty, '0.30');
      await order(tx, f, coonoor, '30.00');
      await topUp(tx, f, coonoor, '800.00');
      await expense(tx, f, coonoor, '800.00');
      await earlierClose(tx, f, gudalur, '1949-08-01', '5.55');
      // An inactive warehouse's cash is not in the total (its own summary is refused, BR-74f).
      const closedWh = newId();
      await tx.query(`INSERT INTO warehouses (id, code, name, type, is_active) VALUES ($1, $2, 'BR-133 inactive', 'SUB', false)`, [closedWh, `WH-T133-${closedWh.slice(0, 6)}`]);
      await expense(tx, f, closedWh, '1000.00');

      const summary = await service(tx).dailySummary(main(f.closer), { date: DAY, warehouseId: ooty });
      // Per-warehouse figures unchanged.
      expect(summary.system).toEqual({ openingCash: '0.00', openingFrom: null, cashSales: '100.30', cashTopUps: '0.10', cashExpenses: '0.30', expectedClosing: '100.10' });
      const active = await tx.query<{ n: number }>(`SELECT count(*)::int AS n FROM warehouses WHERE is_active AND deleted_at IS NULL`);
      expect(summary.totalAcrossWarehouses).toEqual({
        warehouseCount: active.rows[0]!.n,
        openingCash: '5.55',
        cashSales: '130.30',
        cashTopUps: '800.10',
        cashExpenses: '800.30',
        // 5.55 + 130.30 + 800.10 - 800.30
        expectedClosing: '135.65',
      });
      expect(dailySummaryResponse.safeParse(summary).success).toBe(true);

      // The total is the same whichever warehouse is asked for, and equals the sum of every active
      // warehouse's own summary.
      const fromCoonoor = await service(tx).dailySummary(main(f.closer), { date: DAY, warehouseId: coonoor });
      expect(fromCoonoor.totalAcrossWarehouses).toEqual(summary.totalAcrossWarehouses);
      const ids = await tx.query<{ id: string }>(`SELECT id FROM warehouses WHERE is_active AND deleted_at IS NULL`);
      const sums = Object.fromEntries(FIGURES.map((k) => [k, 0]));
      for (const { id } of ids.rows) {
        const own = (await service(tx).dailySummary(main(f.closer), { date: DAY, warehouseId: id })).system;
        for (const k of FIGURES) sums[k]! += toPaise(own[k] as Money);
      }
      for (const k of FIGURES) expect(summary.totalAcrossWarehouses[k], k).toBe(fromPaise(sums[k]!));
    });
  });

  it('BR-133b: a Sub admin\'s total covers only its own warehouse and equals its own figures', async (ctx) => {
    if (!ready) return ctx.skip();
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const ooty = f.byCode.get('WH-OOTY')!;
      await order(tx, f, ooty, '12.34');
      await expense(tx, f, ooty, '2.34');
      await order(tx, f, f.byCode.get('WH-COON')!, '999.99');
      await earlierClose(tx, f, ooty, '1949-08-02', '1.01');
      const summary = await service(tx).dailySummary(sub(ooty, f.closer), { date: DAY });
      expect(summary.warehouseId).toBe(ooty);
      const { openingFrom: _openingFrom, ...own } = summary.system;
      expect(summary.totalAcrossWarehouses).toEqual({ warehouseCount: 1, ...own });
      expect(summary.totalAcrossWarehouses.cashSales).toBe('12.34');
      expect(summary.totalAcrossWarehouses.expectedClosing).toBe('11.01');
    });
  });

  it('BR-133c: a day with no cash anywhere totals 0.00 for every figure', async (ctx) => {
    if (!ready) return ctx.skip();
    await inRolledBackTx(async (tx) => {
      const f = await seed(tx);
      const summary = await service(tx).dailySummary(main(f.closer), { date: '1949-01-03', warehouseId: f.byCode.get('WH-KOTA')! });
      for (const k of FIGURES) expect(summary.totalAcrossWarehouses[k], k).toBe('0.00');
    });
  });
});
