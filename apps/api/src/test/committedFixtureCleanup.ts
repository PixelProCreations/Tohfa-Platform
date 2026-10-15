/**
 * Removes the COMMITTED fixture rows of an HTTP / shared-pool test file (sales, order detail).
 *
 * Why this exists: a file whose handler reads through the shared pool cannot run inside a
 * rolled-back transaction, so its fixtures are committed. Left behind, an ACTIVE batch at a seeded
 * warehouse leaks into every later file that reads "all stock at WH-COON" (reports.test.ts BR-64a
 * inventory snapshot asserts an exact item list) and makes the full suite order-dependent.
 *
 * Everything is deleted in ONE transaction under `session_replication_role = replica`, which
 * disables the append-only triggers (stock_ledger, sale_attempts, audit_log, order_status_history,
 * wallet_transactions) and the FK triggers, exactly as the other committed-fixture cleanups in this
 * repo do. Because FKs are not checked, every table that can hold a row pointing at the fixtures
 * is listed explicitly, so no orphan is left. Only rows reachable from the ids handed in are
 * touched: fixture warehouses, crops, customers, users and farmers that the calling file created.
 */
import type { Executor } from '../db/pool.js';

export interface CommittedFixtures {
  /** Warehouses the file created itself (never a seeded warehouse). Everything stocked or sold there goes. */
  warehouseIds?: string[];
  cropIds?: string[];
  customerIds?: string[];
  /** Users the file created (admins, customers' users, farmers' users). */
  userIds?: string[];
  farmerIds?: string[];
  /** Orders created at a SEEDED warehouse that must go too. */
  orderIds?: string[];
  /** Idempotency keys the file sent under a SEEDED actor (e.g. the standard Super Admin), by prefix. */
  idempotencyKeyPrefix?: string;
}

export async function removeCommittedFixtures(
  withTx: <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>,
  fx: CommittedFixtures,
): Promise<void> {
  const wh = fx.warehouseIds ?? [];
  const crops = fx.cropIds ?? [];
  const customers = fx.customerIds ?? [];
  const users = fx.userIds ?? [];
  const farmers = fx.farmerIds ?? [];
  const explicitOrders = fx.orderIds ?? [];

  await withTx(async (tx) => {
    await tx.query(`SET LOCAL session_replication_role = replica`);

    const orders = (
      await tx.query<{ id: string }>(
        `SELECT id FROM orders
          WHERE warehouse_id = ANY($1::uuid[]) OR customer_id = ANY($2::uuid[]) OR id = ANY($3::uuid[])
             OR id IN (SELECT order_id FROM order_items WHERE crop_id = ANY($4::uuid[]))`,
        [wh, customers, explicitOrders, crops],
      )
    ).rows.map((r) => r.id);
    const batches = (
      await tx.query<{ id: string }>(
        `SELECT id FROM inventory_batches
          WHERE warehouse_id = ANY($1::uuid[]) OR crop_id = ANY($2::uuid[]) OR source_farmer_id = ANY($3::uuid[])`,
        [wh, crops, farmers],
      )
    ).rows.map((r) => r.id);
    const wallets = (
      await tx.query<{ id: string }>(`SELECT id FROM wallets WHERE customer_id = ANY($1::uuid[]) OR farmer_id = ANY($2::uuid[])`, [
        customers,
        farmers,
      ])
    ).rows.map((r) => r.id);
    const invoices = (
      await tx.query<{ id: string }>(`SELECT id FROM invoices WHERE order_id = ANY($1::uuid[]) OR customer_id = ANY($2::uuid[])`, [
        orders,
        customers,
      ])
    ).rows.map((r) => r.id);

    const run = (sql: string, params: unknown[]): Promise<unknown> => tx.query(sql, params);
    // Order-side.
    await run(`DELETE FROM invoice_lines WHERE invoice_id = ANY($1::uuid[])`, [invoices]);
    await run(`DELETE FROM invoices WHERE id = ANY($1::uuid[])`, [invoices]);
    await run(`DELETE FROM sale_payments WHERE order_id = ANY($1::uuid[])`, [orders]);
    await run(`DELETE FROM order_status_history WHERE order_id = ANY($1::uuid[])`, [orders]);
    await run(`DELETE FROM order_items WHERE order_id = ANY($1::uuid[]) OR batch_id = ANY($2::uuid[]) OR crop_id = ANY($3::uuid[])`, [
      orders,
      batches,
      crops,
    ]);
    await run(`DELETE FROM orders WHERE id = ANY($1::uuid[])`, [orders]);
    await run(`DELETE FROM sale_attempts WHERE warehouse_id = ANY($1::uuid[]) OR actor_id = ANY($2::uuid[])`, [wh, users]);
    // Stock-side.
    await run(`DELETE FROM stock_ledger WHERE batch_id = ANY($1::uuid[]) OR warehouse_id = ANY($2::uuid[])`, [batches, wh]);
    await run(`DELETE FROM allocations WHERE batch_id = ANY($1::uuid[]) OR warehouse_id = ANY($2::uuid[])`, [batches, wh]);
    await run(`DELETE FROM inventory_batches WHERE id = ANY($1::uuid[])`, [batches]);
    await run(`DELETE FROM fair_prices WHERE crop_id = ANY($1::uuid[])`, [crops]);
    await run(`DELETE FROM retail_prices WHERE crop_id = ANY($1::uuid[])`, [crops]);
    await run(`DELETE FROM crop_master WHERE id = ANY($1::uuid[])`, [crops]);
    // Money-side.
    await run(`DELETE FROM topups WHERE wallet_id = ANY($1::uuid[]) OR customer_id = ANY($2::uuid[])`, [wallets, customers]);
    await run(`DELETE FROM wallet_transactions WHERE wallet_id = ANY($1::uuid[])`, [wallets]);
    await run(`DELETE FROM wallets WHERE id = ANY($1::uuid[])`, [wallets]);
    // Audit and idempotency rows written by or about the fixtures.
    await run(
      `DELETE FROM audit_log WHERE warehouse_id = ANY($1::uuid[]) OR actor_id = ANY($2::uuid[]) OR entity_id = ANY($3::uuid[])`,
      [wh, users, orders],
    );
    await run(`DELETE FROM idempotency_keys WHERE actor_user_id = ANY($1::uuid[])`, [users]);
    if (fx.idempotencyKeyPrefix !== undefined) {
      await run(`DELETE FROM idempotency_keys WHERE idempotency_key LIKE $1`, [`${fx.idempotencyKeyPrefix}%`]);
    }
    // People and places.
    await run(`DELETE FROM customers WHERE id = ANY($1::uuid[])`, [customers]);
    await run(`DELETE FROM plots WHERE farm_id IN (SELECT id FROM farms WHERE farmer_id = ANY($1::uuid[]))`, [farmers]);
    await run(`DELETE FROM farms WHERE farmer_id = ANY($1::uuid[])`, [farmers]);
    await run(`DELETE FROM farmers WHERE id = ANY($1::uuid[])`, [farmers]);
    await run(`DELETE FROM user_roles WHERE user_id = ANY($1::uuid[]) OR warehouse_id = ANY($2::uuid[])`, [users, wh]);
    await run(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [users]);
    await run(`DELETE FROM warehouses WHERE id = ANY($1::uuid[])`, [wh]);
  });
}
