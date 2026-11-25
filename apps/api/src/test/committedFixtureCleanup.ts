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
import type { Pool } from 'pg';
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

/**
 * Completely purges one or more test warehouses and all dependent fixture rows across 31 tables:
 * 1. carts, cart_items
 * 2. orders, order_items, order_status_history, deliveries, return_requests, sale_payments, invoices, invoice_lines
 * 3. inventory_batches, stock_ledger, allocations, quality_checks, stock_adjustments, stock_verifications
 * 4. purchase_orders, goods_receipts, goods_receipt_discrepancies
 * 5. delivery_slots, topups, expenses, announcements, audit_log, rejected_goods_disposal, cash_closes,
 *    storage_locations, warehouse_staff, sale_attempts, warehouse_issues, warehouse_documents, user_roles, zones
 * 6. warehouses
 *
 * SAFETY GUARD: Verifies that current_database() ends in '_test'. Disables triggers and FK checks using
 * `SET LOCAL session_replication_role = replica`. THIS MUST NEVER RUN ON PRODUCTION OR NON-TEST DATABASES.
 */
export async function deleteTestWarehouseAndFixtures(
  client: Executor,
  warehouseIds: string | string[],
): Promise<void> {
  const ids = Array.isArray(warehouseIds) ? warehouseIds : [warehouseIds];
  if (ids.length === 0) return;

  const dbCheck = await client.query<{ name: string }>('SELECT current_database() AS name');
  const dbName = dbCheck.rows[0]?.name ?? '';
  if (!dbName || !dbName.endsWith('_test')) {
    throw new Error(
      `SAFETY VIOLATION: refusing to purge fixtures from database "${dbName}". ` +
      `The database name must end in "_test" (e.g. tohfa_test) because this purge executes under ` +
      `session_replication_role = replica and destroys data across 31 tables without FK or trigger checks.`
    );
  }

  await client.query('BEGIN');
  try {
    await client.query('SET LOCAL session_replication_role = replica');

    // 1. Carts
    await client.query(
      `DELETE FROM cart_items WHERE cart_id IN (SELECT id FROM carts WHERE warehouse_id = ANY($1::uuid[]))`,
      [ids],
    );
    await client.query(`DELETE FROM carts WHERE warehouse_id = ANY($1::uuid[])`, [ids]);

    // 2. Orders & children
    const ordRes = await client.query<{ id: string }>(
      `SELECT id FROM orders WHERE warehouse_id = ANY($1::uuid[])`,
      [ids],
    );
    const orderIds = ordRes.rows.map((r) => r.id);
    if (orderIds.length > 0) {
      await client.query(
        `DELETE FROM invoice_lines WHERE invoice_id IN (SELECT id FROM invoices WHERE order_id = ANY($1::uuid[]))`,
        [orderIds],
      );
      await client.query(`DELETE FROM invoices WHERE order_id = ANY($1::uuid[])`, [orderIds]);
      await client.query(`DELETE FROM sale_payments WHERE order_id = ANY($1::uuid[])`, [orderIds]);
      await client.query(`DELETE FROM order_status_history WHERE order_id = ANY($1::uuid[])`, [orderIds]);
      await client.query(`DELETE FROM return_requests WHERE order_id = ANY($1::uuid[])`, [orderIds]);
      await client.query(`DELETE FROM order_items WHERE order_id = ANY($1::uuid[])`, [orderIds]);
      await client.query(`DELETE FROM deliveries WHERE order_id = ANY($1::uuid[])`, [orderIds]);
      await client.query(`DELETE FROM orders WHERE id = ANY($1::uuid[])`, [orderIds]);
    }

    // 3. Batches & Stock
    await client.query(
      `DELETE FROM stock_ledger WHERE warehouse_id = ANY($1::uuid[]) OR batch_id IN (SELECT id FROM inventory_batches WHERE warehouse_id = ANY($1::uuid[]))`,
      [ids],
    );
    await client.query(
      `DELETE FROM allocations WHERE warehouse_id = ANY($1::uuid[]) OR batch_id IN (SELECT id FROM inventory_batches WHERE warehouse_id = ANY($1::uuid[]))`,
      [ids],
    );
    await client.query(`DELETE FROM quality_checks WHERE warehouse_id = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM stock_adjustments WHERE warehouse_id = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM stock_verifications WHERE warehouse_id = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM inventory_batches WHERE warehouse_id = ANY($1::uuid[])`, [ids]);

    // 4. Receipts & POs
    await client.query(`DELETE FROM goods_receipt_discrepancies WHERE warehouse_id = ANY($1::uuid[])`, [ids]);
    await client.query(
      `DELETE FROM goods_receipts WHERE warehouse_id = ANY($1::uuid[]) OR purchase_order_id IN (SELECT id FROM purchase_orders WHERE warehouse_id = ANY($1::uuid[]))`,
      [ids],
    );
    await client.query(`DELETE FROM purchase_orders WHERE warehouse_id = ANY($1::uuid[])`, [ids]);

    // 5. Operations & Staff
    await client.query(`DELETE FROM delivery_slots WHERE warehouse_id = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM market_days WHERE warehouse_id = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM admin_reports WHERE warehouse_id = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM topups WHERE warehouse_id = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM expenses WHERE warehouse_id = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM announcements WHERE warehouse_id = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM audit_log WHERE warehouse_id = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM rejected_goods_disposal WHERE warehouse_id = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM cash_closes WHERE warehouse_id = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM storage_locations WHERE warehouse_id = ANY($1::uuid[])`, [ids]);
    await client.query(
      `DELETE FROM warehouse_staff_bank_accounts WHERE staff_id IN (SELECT id FROM warehouse_staff WHERE warehouse_id = ANY($1::uuid[]))`,
      [ids],
    );
    await client.query(
      `DELETE FROM warehouse_staff_documents WHERE staff_id IN (SELECT id FROM warehouse_staff WHERE warehouse_id = ANY($1::uuid[]))`,
      [ids],
    );
    await client.query(
      `DELETE FROM warehouse_staff_emergency_contacts WHERE staff_id IN (SELECT id FROM warehouse_staff WHERE warehouse_id = ANY($1::uuid[]))`,
      [ids],
    );
    await client.query(`DELETE FROM warehouse_staff WHERE warehouse_id = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM sale_attempts WHERE warehouse_id = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM warehouse_issues WHERE warehouse_id = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM warehouse_documents WHERE warehouse_id = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM user_roles WHERE warehouse_id = ANY($1::uuid[])`, [ids]);
    await client.query(`DELETE FROM zones WHERE warehouse_id = ANY($1::uuid[])`, [ids]);

    // 6. Warehouses
    await client.query(`DELETE FROM warehouses WHERE id = ANY($1::uuid[])`, [ids]);

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
}

/**
 * Removes any non-seed warehouse from the database, keeping only the 4 canonical seed warehouses
 * ('WH-OOTY', 'WH-COON', 'WH-KOTA', 'WH-GUDA'). Destroys all dependent rows in 31 tables for matching warehouses.
 * Refuses to run if database name does not end in '_test'.
 */
export async function purgeNonSeedWarehouses(client: Executor): Promise<number> {
  const dbCheck = await client.query<{ name: string }>('SELECT current_database() AS name');
  const dbName = dbCheck.rows[0]?.name ?? '';
  if (!dbName || !dbName.endsWith('_test')) {
    throw new Error(
      `SAFETY VIOLATION: refusing to purge fixtures from database "${dbName}". ` +
      `The database name must end in "_test" (e.g. tohfa_test).`
    );
  }

  const whRes = await client.query<{ id: string }>(
    `SELECT id FROM warehouses WHERE code NOT IN ('WH-OOTY', 'WH-COON', 'WH-KOTA', 'WH-GUDA')`,
  );
  const whIds = whRes.rows.map((r) => r.id);
  if (whIds.length === 0) return 0;
  await deleteTestWarehouseAndFixtures(client, whIds);
  return whIds.length;
}

export const CANONICAL_SEED_USER_IDS: readonly string[] = Object.freeze([
  // 003_dev_users.sql
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000006',
  // STANDARD_USERS from dbFixtures.ts / golden-thread.e2e.test.ts
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000005',
  '00000000-0000-4000-8000-000000000006',
  // 004_demo.js 12 demo farmers
  ...Array.from({ length: 12 }, (_, i) => `10000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`),
  // 004_demo.js 8 demo customers
  ...Array.from({ length: 8 }, (_, i) => `80000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`),
]);

/**
 * Removes any non-seed users and their dependent test fixtures from the database,
 * keeping only the 31 canonical seed users (dev admins, standard test users, demo farmers & customers).
 * Refuses to run if database name does not end in '_test'.
 */
export async function purgeNonSeedUsers(client: Executor): Promise<number> {
  const dbCheck = await client.query<{ name: string }>('SELECT current_database() AS name');
  const dbName = dbCheck.rows[0]?.name ?? '';
  if (!dbName || !dbName.endsWith('_test')) {
    throw new Error(
      `SAFETY VIOLATION: refusing to purge fixtures from database "${dbName}". ` +
      `The database name must end in "_test" (e.g. tohfa_test).`
    );
  }

  const nonSeedUsersRes = await client.query<{ id: string }>(
    'SELECT id FROM users WHERE NOT (id = ANY($1::uuid[]))',
    [CANONICAL_SEED_USER_IDS],
  );
  const uIds = nonSeedUsersRes.rows.map((r) => r.id);
  if (uIds.length === 0) return 0;

  await client.query('BEGIN');
  try {
    await client.query('SET LOCAL session_replication_role = replica');

    const fRes = await client.query<{ id: string }>('SELECT id FROM farmers WHERE user_id = ANY($1::uuid[])', [uIds]);
    const fIds = fRes.rows.map((r) => r.id);

    const cRes = await client.query<{ id: string }>('SELECT id FROM customers WHERE user_id = ANY($1::uuid[])', [uIds]);
    const cIds = cRes.rows.map((r) => r.id);

    const oRes = await client.query<{ id: string }>('SELECT id FROM orders WHERE customer_id = ANY($1::uuid[])', [cIds]);
    const oIds = oRes.rows.map((r) => r.id);

    const farmRes = await client.query<{ id: string }>('SELECT id FROM farms WHERE farmer_id = ANY($1::uuid[])', [fIds]);
    const farmIds = farmRes.rows.map((r) => r.id);

    const pRes = await client.query<{ id: string }>('SELECT id FROM payouts WHERE farmer_id = ANY($1::uuid[])', [fIds]);
    const pIds = pRes.rows.map((r) => r.id);

    const invRes = await client.query<{ id: string }>(
      'SELECT id FROM invoices WHERE customer_id = ANY($1::uuid[]) OR order_id = ANY($2::uuid[])',
      [cIds, oIds],
    );
    const invIds = invRes.rows.map((r) => r.id);

    if (invIds.length > 0) {
      await client.query('DELETE FROM invoice_lines WHERE invoice_id = ANY($1::uuid[])', [invIds]);
      await client.query('DELETE FROM invoices WHERE id = ANY($1::uuid[])', [invIds]);
    }
    if (oIds.length > 0) {
      await client.query('DELETE FROM sale_payments WHERE order_id = ANY($1::uuid[])', [oIds]);
      await client.query('DELETE FROM deliveries WHERE order_id = ANY($1::uuid[])', [oIds]);
      await client.query(
        'DELETE FROM return_request_items WHERE return_request_id IN (SELECT id FROM return_requests WHERE order_id = ANY($1::uuid[]))',
        [oIds],
      );
      await client.query(
        'DELETE FROM return_request_status_history WHERE return_request_id IN (SELECT id FROM return_requests WHERE order_id = ANY($1::uuid[]))',
        [oIds],
      );
      await client.query('DELETE FROM return_requests WHERE order_id = ANY($1::uuid[])', [oIds]);
      await client.query('DELETE FROM order_status_history WHERE order_id = ANY($1::uuid[])', [oIds]);
      await client.query('DELETE FROM order_items WHERE order_id = ANY($1::uuid[])', [oIds]);
      await client.query('DELETE FROM orders WHERE id = ANY($1::uuid[])', [oIds]);
    }
    if (cIds.length > 0) {
      await client.query('DELETE FROM wallets WHERE customer_id = ANY($1::uuid[])', [cIds]);
      await client.query('DELETE FROM customer_addresses WHERE customer_id = ANY($1::uuid[])', [cIds]);
      await client.query('DELETE FROM customers WHERE id = ANY($1::uuid[])', [cIds]);
    }
    if (pIds.length > 0) {
      await client.query('DELETE FROM payout_items WHERE payout_id = ANY($1::uuid[])', [pIds]);
      await client.query('DELETE FROM payout_approvals WHERE payout_id = ANY($1::uuid[])', [pIds]);
      await client.query('DELETE FROM payouts WHERE id = ANY($1::uuid[])', [pIds]);
    }
    if (fIds.length > 0) {
      await client.query('DELETE FROM wallets WHERE farmer_id = ANY($1::uuid[])', [fIds]);
      await client.query('DELETE FROM farmer_bank_accounts WHERE farmer_id = ANY($1::uuid[])', [fIds]);
      await client.query(
        'DELETE FROM counter_offers WHERE actor_user_id = ANY($1::uuid[]) OR listing_id IN (SELECT id FROM produce_listings WHERE farmer_id = ANY($2::uuid[]))',
        [uIds, fIds],
      );
      await client.query('DELETE FROM produce_listings WHERE farmer_id = ANY($1::uuid[])', [fIds]);
      await client.query('DELETE FROM goods_receipts WHERE farmer_id = ANY($1::uuid[])', [fIds]);
      await client.query('DELETE FROM certifications WHERE farmer_id = ANY($1::uuid[])', [fIds]);
      if (farmIds.length > 0) {
        await client.query('DELETE FROM plots WHERE farm_id = ANY($1::uuid[])', [farmIds]);
        await client.query('DELETE FROM farms WHERE id = ANY($1::uuid[])', [farmIds]);
      }
      await client.query('DELETE FROM farm_ratings WHERE farmer_id = ANY($1::uuid[])', [fIds]);
      // Replica mode skips the ON DELETE CASCADE from farmers, so these would be orphaned (BR-219 copies).
      await client.query('DELETE FROM farmer_documents WHERE farmer_id = ANY($1::uuid[])', [fIds]);
      await client.query('DELETE FROM farmers WHERE id = ANY($1::uuid[])', [fIds]);
    }

    // Clean support tickets for non-seed farmers/users
    const tRes = await client.query<{ id: string }>(
      'SELECT id FROM farmer_support_tickets WHERE farmer_id = ANY($1::uuid[]) OR assigned_to_user_id = ANY($2::uuid[])',
      [fIds, uIds],
    );
    const tIds = tRes.rows.map((r) => r.id);
    if (tIds.length > 0) {
      await client.query('DELETE FROM support_ticket_messages WHERE ticket_id = ANY($1::uuid[])', [tIds]);
      await client.query('DELETE FROM support_ticket_status_history WHERE ticket_id = ANY($1::uuid[])', [tIds]);
      await client.query('DELETE FROM farmer_support_tickets WHERE id = ANY($1::uuid[])', [tIds]);
    }
    await client.query(
      'DELETE FROM support_ticket_messages WHERE ticket_id NOT IN (SELECT id FROM farmer_support_tickets)',
    );
    await client.query(
      'DELETE FROM support_ticket_status_history WHERE ticket_id NOT IN (SELECT id FROM farmer_support_tickets)',
    );

    const nonSeedAppRes = await client.query<{ id: string }>(
      'SELECT id FROM farmer_applications WHERE user_id = ANY($1::uuid[])',
      [uIds],
    );
    const nonSeedAppIds = nonSeedAppRes.rows.map((r) => r.id);
    if (nonSeedAppIds.length > 0) {
      await client.query('DELETE FROM farmer_application_reviews WHERE application_id = ANY($1::uuid[])', [nonSeedAppIds]);
      await client.query('DELETE FROM farmer_application_status_history WHERE application_id = ANY($1::uuid[])', [nonSeedAppIds]);
      await client.query('DELETE FROM farmer_applications WHERE id = ANY($1::uuid[])', [nonSeedAppIds]);
    }

    await client.query('DELETE FROM user_roles WHERE user_id = ANY($1::uuid[])', [uIds]);
    await client.query('DELETE FROM sessions WHERE user_id = ANY($1::uuid[])', [uIds]);
    await client.query('DELETE FROM refresh_tokens WHERE user_id = ANY($1::uuid[])', [uIds]);
    await client.query('DELETE FROM device_tokens WHERE user_id = ANY($1::uuid[])', [uIds]);
    await client.query('DELETE FROM notification_preferences WHERE user_id = ANY($1::uuid[])', [uIds]);
    await client.query('DELETE FROM admin_profiles WHERE user_id = ANY($1::uuid[])', [uIds]);
    await client.query(
      'DELETE FROM promotion_requests WHERE target_user_id = ANY($1::uuid[]) OR requested_by = ANY($1::uuid[])',
      [uIds],
    );
    await client.query('DELETE FROM idempotency_keys WHERE actor_user_id = ANY($1::uuid[])', [uIds]);
    await client.query('DELETE FROM audit_log WHERE actor_id = ANY($1::uuid[])', [uIds]);
    await client.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [uIds]);

    await client.query('COMMIT');
    return uIds.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

export const CANONICAL_SEED_APPLICATION_IDS: readonly string[] = Object.freeze(
  Array.from({ length: 12 }, (_, i) => `11000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`),
);

/**
 * Removes any non-seed farmer applications from the database, keeping only the 12 canonical seed
 * applications ('11000000-0000-0000-0000-000000000001' .. '...12') from 004_demo.js.
 * Refuses to run if database name does not end in '_test'.
 */
export async function purgeNonSeedFarmerApplications(client: Executor): Promise<number> {
  const dbCheck = await client.query<{ name: string }>('SELECT current_database() AS name');
  const dbName = dbCheck.rows[0]?.name ?? '';
  if (!dbName || !dbName.endsWith('_test')) {
    throw new Error(
      `SAFETY VIOLATION: refusing to purge fixtures from database "${dbName}". ` +
      `The database name must end in "_test" (e.g. tohfa_test).`
    );
  }

  const appRes = await client.query<{ id: string }>(
    'SELECT id FROM farmer_applications WHERE NOT (id = ANY($1::uuid[]))',
    [CANONICAL_SEED_APPLICATION_IDS],
  );
  const appIds = appRes.rows.map((r) => r.id);
  // farmer_application_status_history and farmer_application_reviews are append-only (migration
  // 0201, BR-218): their statement-level triggers refuse even a DELETE that matches no row, so
  // every delete here -- the orphan sweep included -- runs under session_replication_role = replica.
  await client.query('BEGIN');
  try {
    await client.query('SET LOCAL session_replication_role = replica');

    await client.query('DELETE FROM farmer_application_reviews WHERE application_id = ANY($1::uuid[])', [appIds]);
    await client.query(
      'DELETE FROM farmer_application_reviews WHERE application_id NOT IN (SELECT id FROM farmer_applications)',
    );
    await client.query('DELETE FROM farmer_application_status_history WHERE application_id = ANY($1::uuid[])', [appIds]);
    await client.query(
      'DELETE FROM farmer_application_status_history WHERE application_id NOT IN (SELECT id FROM farmer_applications)',
    );
    if (appIds.length === 0) {
      await client.query('COMMIT');
      return 0;
    }
    await client.query(
      "DELETE FROM uploads WHERE entity_type = 'farmer_application' AND entity_id = ANY($1::uuid[])",
      [appIds],
    );
    await client.query(
      "DELETE FROM audit_log WHERE entity_type = 'farmer_application' AND entity_id = ANY($1::uuid[])",
      [appIds],
    );
    await client.query('DELETE FROM farmer_applications WHERE id = ANY($1::uuid[])', [appIds]);

    await client.query('COMMIT');
    return appIds.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

export const CANONICAL_SEED_ZONE_CODES: readonly string[] = Object.freeze([
  'ZONE-OOTY',
  'ZONE-COON',
  'ZONE-KOTA',
  'ZONE-GUDA',
  'ZONE-DEMO-01',
]);

/**
 * Removes any non-seed zones from the database, keeping only canonical seed zones.
 * Refuses to run if database name does not end in '_test'.
 */
export async function purgeNonSeedZones(client: Executor): Promise<number> {
  const dbCheck = await client.query<{ name: string }>('SELECT current_database() AS name');
  const dbName = dbCheck.rows[0]?.name ?? '';
  if (!dbName || !dbName.endsWith('_test')) {
    throw new Error(
      `SAFETY VIOLATION: refusing to purge fixtures from database "${dbName}". ` +
      `The database name must end in "_test" (e.g. tohfa_test).`
    );
  }

  const zoneRes = await client.query<{ id: string }>(
    'SELECT id FROM zones WHERE code != ALL($1)',
    [CANONICAL_SEED_ZONE_CODES],
  );
  const zoneIds = zoneRes.rows.map((r) => r.id);
  if (zoneIds.length === 0) return 0;

  await client.query('BEGIN');
  try {
    await client.query('SET LOCAL session_replication_role = replica');

    await client.query('DELETE FROM zone_taluks WHERE zone_id = ANY($1::uuid[])', [zoneIds]);
    await client.query('DELETE FROM user_roles WHERE zone_id = ANY($1::uuid[])', [zoneIds]);
    await client.query('UPDATE farmer_applications SET zone_id = NULL WHERE zone_id = ANY($1::uuid[])', [zoneIds]);
    await client.query('UPDATE farmers SET zone_id = NULL WHERE zone_id = ANY($1::uuid[])', [zoneIds]);
    await client.query('UPDATE farm_ratings SET zone_id = NULL WHERE zone_id = ANY($1::uuid[])', [zoneIds]);
    await client.query('UPDATE audits SET zone_id = NULL WHERE zone_id = ANY($1::uuid[])', [zoneIds]);
    await client.query('UPDATE announcements SET zone_id = NULL WHERE zone_id = ANY($1::uuid[])', [zoneIds]);
    await client.query('DELETE FROM zones WHERE id = ANY($1::uuid[])', [zoneIds]);

    await client.query('COMMIT');
    return zoneIds.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

/**
 * Removes any delivery partners from the test database (0 canonical seed partners).
 * Refuses to run if database name does not end in '_test'.
 */
export async function purgeNonSeedDeliveryPartners(client: Executor): Promise<number> {
  const dbCheck = await client.query<{ name: string }>('SELECT current_database() AS name');
  const dbName = dbCheck.rows[0]?.name ?? '';
  if (!dbName || !dbName.endsWith('_test')) {
    throw new Error(
      `SAFETY VIOLATION: refusing to purge fixtures from database "${dbName}". ` +
      `The database name must end in "_test" (e.g. tohfa_test).`
    );
  }

  const dpRes = await client.query<{ id: string }>('SELECT id FROM delivery_partners');
  const dpIds = dpRes.rows.map((r) => r.id);
  if (dpIds.length === 0) return 0;

  await client.query('BEGIN');
  try {
    await client.query('SET LOCAL session_replication_role = replica');

    await client.query('UPDATE orders SET delivery_partner_id = NULL WHERE delivery_partner_id = ANY($1::uuid[])', [dpIds]);
    await client.query('DELETE FROM delivery_partners WHERE id = ANY($1::uuid[])', [dpIds]);

    await client.query('COMMIT');
    return dpIds.length;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

/**
 * Removes any market days from the test database (0 canonical seed market days).
 * Refuses to run if database name does not end in '_test'.
 */
export async function purgeNonSeedMarketDays(client: Executor): Promise<number> {
  const dbCheck = await client.query<{ name: string }>('SELECT current_database() AS name');
  const dbName = dbCheck.rows[0]?.name ?? '';
  if (!dbName || !dbName.endsWith('_test')) {
    throw new Error(
      `SAFETY VIOLATION: refusing to purge fixtures from database "${dbName}". ` +
      `The database name must end in "_test" (e.g. tohfa_test).`
    );
  }

  const res = await client.query('DELETE FROM market_days');
  return res.rowCount ?? 0;
}

/**
 * Removes any non-seed stock adjustment evidence.
 * Refuses to run if database name does not end in '_test'.
 */
export async function purgeNonSeedStockAdjustmentEvidence(client: Executor): Promise<number> {
  const dbCheck = await client.query<{ name: string }>('SELECT current_database() AS name');
  const dbName = dbCheck.rows[0]?.name ?? '';
  if (!dbName || !dbName.endsWith('_test')) {
    throw new Error(
      `SAFETY VIOLATION: refusing to purge fixtures from database "${dbName}". ` +
      `The database name must end in "_test" (e.g. tohfa_test).`
    );
  }

  const res = await client.query('DELETE FROM stock_adjustment_evidence');
  return res.rowCount ?? 0;
}

export async function purgeNonSeedWarehouseStaffDetails(client: Executor): Promise<void> {
  const dbCheck = await client.query<{ name: string }>('SELECT current_database() AS name');
  const dbName = dbCheck.rows[0]?.name ?? '';
  if (!dbName || !dbName.endsWith('_test')) {
    throw new Error(
      `SAFETY VIOLATION: refusing to purge fixtures from database "${dbName}". ` +
      `The database name must end in "_test" (e.g. tohfa_test).`
    );
  }

  await client.query('DELETE FROM warehouse_staff_bank_accounts');
  await client.query('DELETE FROM warehouse_staff_documents');
  await client.query('DELETE FROM warehouse_staff_emergency_contacts');
}

export async function purgeNonSeedPaymentMethods(client: Executor): Promise<number> {
  const dbCheck = await client.query<{ name: string }>('SELECT current_database() AS name');
  const dbName = dbCheck.rows[0]?.name ?? '';
  if (!dbName || !dbName.endsWith('_test')) {
    throw new Error(
      `SAFETY VIOLATION: refusing to purge fixtures from database "${dbName}". ` +
      `The database name must end in "_test" (e.g. tohfa_test).`
    );
  }

  const res = await client.query('DELETE FROM payment_methods');
  return res.rowCount ?? 0;
}

export async function purgeNonSeedAdminReports(client: Executor): Promise<number> {
  const dbCheck = await client.query<{ name: string }>('SELECT current_database() AS name');
  const dbName = dbCheck.rows[0]?.name ?? '';
  if (!dbName || !dbName.endsWith('_test')) {
    throw new Error(
      `SAFETY VIOLATION: refusing to purge fixtures from database "${dbName}". ` +
      `The database name must end in "_test" (e.g. tohfa_test).`
    );
  }

  const res = await client.query('DELETE FROM admin_reports');
  return res.rowCount ?? 0;
}


/**
 * Removes exactly the given farmer applications and everything a test made hang off them: review
 * decisions, history, uploads, audit rows, and -- for an approved application -- the farmer,
 * its farms and carried-over documents, and an applicant account the approval created (one with
 * no other role than FARMER). Runs under session_replication_role = replica because the history
 * and review tables are append-only (migration 0201). Refuses any database not ending in `_test`.
 */
export async function purgeFarmerApplicationsByIds(
  pgPool: Pool,
  appIds: readonly string[],
  options: { uploadKeys?: readonly string[] } = {},
): Promise<void> {
  // One connection: SET LOCAL and the transaction must live on the same session.
  const conn = await pgPool.connect();
  const db: Executor = conn;
  try {
    const dbCheck = await db.query<{ name: string }>('SELECT current_database() AS name');
    const dbName = dbCheck.rows[0]?.name ?? '';
    if (!dbName.endsWith('_test')) {
      throw new Error(`SAFETY VIOLATION: refusing to purge fixtures from database "${dbName}".`);
    }
    if (appIds.length === 0) return;
    await db.query('BEGIN');
    try {
      await db.query('SET LOCAL session_replication_role = replica');
      const ids = [...appIds];
      const linked = await db.query<{ farmer_id: string | null; user_id: string | null }>(
        'SELECT farmer_id, user_id FROM farmer_applications WHERE id = ANY($1::uuid[])',
        [ids],
      );
      const farmerIds = linked.rows.map((r) => r.farmer_id).filter((v): v is string => v !== null);
      const userIds = linked.rows.map((r) => r.user_id).filter((v): v is string => v !== null);
      await db.query('DELETE FROM farmer_application_reviews WHERE application_id = ANY($1::uuid[])', [ids]);
      await db.query('DELETE FROM farmer_application_status_history WHERE application_id = ANY($1::uuid[])', [ids]);
      await db.query("DELETE FROM uploads WHERE entity_type = 'farmer_application' AND entity_id = ANY($1::uuid[])", [ids]);
      if (options.uploadKeys !== undefined && options.uploadKeys.length > 0) {
        await db.query('DELETE FROM uploads WHERE storage_key = ANY($1::text[])', [[...options.uploadKeys]]);
      }
      await db.query("DELETE FROM audit_log WHERE entity_type = 'farmer_application' AND entity_id = ANY($1::uuid[])", [ids]);
      await db.query('DELETE FROM farmer_applications WHERE id = ANY($1::uuid[])', [ids]);
      if (farmerIds.length > 0) {
        await db.query('DELETE FROM farmer_documents WHERE farmer_id = ANY($1::uuid[])', [farmerIds]);
        await db.query('DELETE FROM farms WHERE farmer_id = ANY($1::uuid[])', [farmerIds]);
        await db.query('DELETE FROM wallets WHERE farmer_id = ANY($1::uuid[])', [farmerIds]);
        await db.query('DELETE FROM farmers WHERE id = ANY($1::uuid[])', [farmerIds]);
      }
      if (userIds.length > 0) {
        // Only accounts that are nothing but a farmer made by this approval; a seeded user that
        // merely owns the application keeps its account.
        const owned = await db.query<{ id: string }>(
          `SELECT u.id FROM users u
            WHERE u.id = ANY($1::uuid[])
              AND u.id <> ALL($2::uuid[])
              AND NOT EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                               WHERE ur.user_id = u.id AND r.code <> 'FARMER')`,
          [userIds, [...CANONICAL_SEED_USER_IDS]],
        );
        const ownedIds = owned.rows.map((r) => r.id);
        if (ownedIds.length > 0) {
          await db.query('DELETE FROM user_roles WHERE user_id = ANY($1::uuid[])', [ownedIds]);
          await db.query('DELETE FROM users WHERE id = ANY($1::uuid[])', [ownedIds]);
        }
      }
      await db.query('COMMIT');
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  } finally {
    conn.release();
  }
}
