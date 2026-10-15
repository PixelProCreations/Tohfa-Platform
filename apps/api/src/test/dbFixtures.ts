/**
 * Self-contained fixtures for integration tests.
 *
 * WHY THIS FILE EXISTS: several suites used to depend on rows that only ANOTHER
 * test file (golden-thread.e2e) happened to create and commit (the IDS users,
 * a farmer, a plot, a purchase order ...). On a freshly migrated + seeded
 * database they failed with FK violations or silently returned early, and
 * their result depended on file order. Every helper here creates what the test
 * needs itself, so a file passes alone on an empty database AND after any other
 * file has run.
 *
 * Two flavours:
 *   - `insert*`  : always-new rows with random ids/mobiles; meant for a
 *                  transaction the test rolls back, so nothing is left behind.
 *   - `ensure*`  : idempotent, deterministic-id upserts for tests that go
 *                  through the HTTP app or a service on the shared pool, where
 *                  a rollback is impossible. They are `ON CONFLICT DO NOTHING`
 *                  (never UPDATE), so they cannot disturb another suite's row.
 */
import { randomInt } from 'node:crypto';
import type { Executor } from '../db/pool.js';
import { IDS, databaseReady, newId } from './factories.js';

/**
 * True when setup.ts had to invent DATABASE_URL because nothing was configured
 * (a laptop with no .env and no Docker). In that mode an unreachable database
 * is an expected, VISIBLY skipped situation. When DATABASE_URL was configured
 * explicitly (CI, a developer who exported it) an unreachable or unmigrated
 * database is a failure, never a pass.
 */
const databaseUrlWasDefaulted = (): boolean => process.env['TOHFA_TEST_DATABASE_URL_DEFAULTED'] === '1';

/**
 * Resolves true when every table is reachable. Throws loudly when a DATABASE_URL
 * was configured but the database is unreachable / not migrated. Resolves false
 * ONLY in the no-DATABASE_URL-configured case; the caller must then
 * `context.skip()` so the report shows a skip, not a silent pass.
 */
export async function requireDatabaseTables(...tables: string[]): Promise<boolean> {
  const missing: string[] = [];
  for (const table of tables) {
    if (!(await databaseReady(table))) missing.push(table);
  }
  if (missing.length === 0) return true;
  if (databaseUrlWasDefaulted()) {
    console.warn(
      `[skip] no DATABASE_URL configured and table(s) ${missing.join(', ')} not reachable; ` +
        'run `pnpm db:migrate && pnpm db:seed` against a local Postgres to exercise this test.',
    );
    return false;
  }
  throw new Error(
    `DATABASE_URL is configured but table(s) ${missing.join(', ')} are not reachable or not migrated. ` +
      'Refusing to silently skip an integration test: run `pnpm db:migrate && pnpm db:seed` first.',
  );
}

/** A random +91 mobile that cannot collide with the fixed mobiles other suites use. */
export function randomMobile(): string {
  return `+9190${randomInt(10_000_000, 99_999_999)}`;
}

// ---------------------------------------------------------------------------
// ensure* — idempotent, deterministic (for HTTP / shared-pool tests)
// ---------------------------------------------------------------------------

/**
 * The mobiles are the ones golden-thread.e2e.test.ts already uses for the same
 * ids, so whichever file runs first the row is identical (and a later
 * `ON CONFLICT (id) DO UPDATE` there is harmless).
 */
const STANDARD_USERS = {
  userSuperAdmin: { mobile: '+919800000099', fullName: 'Super Admin', userType: 'ADMIN' },
  userSubWhAdmin: { mobile: '+919800000091', fullName: 'Ooty Sub WH Admin', userType: 'ADMIN' },
  userTohfaAdmin: { mobile: '+919800000095', fullName: 'Tohfa Platform Admin', userType: 'ADMIN' },
  userFarmerAdmin: { mobile: '+919800000093', fullName: 'Farmer Desk Admin', userType: 'ADMIN' },
  userFarmer: { mobile: '+919876543210', fullName: 'Ramesh Farmer', userType: 'FARMER' },
} as const;

export type StandardUserKey = keyof typeof STANDARD_USERS;

/**
 * Make sure `IDS[key]` exists in `users`. Needed by anything that stamps the
 * well-known actor id into an FK column (audit_log.actor_id, set_by, created_by,
 * received_by ...) while going through the shared pool.
 */
export async function ensureStandardUsers(db: Executor, ...keys: StandardUserKey[]): Promise<void> {
  for (const key of keys) {
    const user = STANDARD_USERS[key];
    await db.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status)
       VALUES ($1, $2, $3, $4, 'ACTIVE')
       ON CONFLICT DO NOTHING`,
      [IDS[key], user.mobile, user.fullName, user.userType],
    );
    const present = await db.query('SELECT 1 FROM users WHERE id = $1', [IDS[key]]);
    if (present.rowCount !== 1) {
      throw new Error(
        `fixture user ${key} (${IDS[key]}) could not be created: its mobile ${user.mobile} is held by another row`,
      );
    }
  }
}

// ---------------------------------------------------------------------------
// insert* — always-new rows (for a rolled-back transaction)
// ---------------------------------------------------------------------------

export async function insertUser(
  db: Executor,
  userType: 'ADMIN' | 'FARMER' | 'CUSTOMER' = 'FARMER',
  fullName = 'Fixture User',
): Promise<string> {
  const id = newId();
  await db.query(
    `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES ($1, $2, $3, $4, 'ACTIVE')`,
    [id, randomMobile(), fullName, userType],
  );
  return id;
}

export interface FarmerFixture {
  userId: string;
  farmerId: string;
  farmId: string;
  plotId: string;
}

/** user -> farmer -> farm -> plot, all new. */
export async function insertFarmerWithPlot(db: Executor): Promise<FarmerFixture> {
  const userId = await insertUser(db, 'FARMER', 'Fixture Farmer');
  const farmerId = newId();
  await db.query(`INSERT INTO farmers (id, user_id, tohfa_farmer_id) VALUES ($1, $2, $3)`, [
    farmerId,
    userId,
    `TOHFA-FX-${farmerId.slice(0, 8)}`,
  ]);
  const farmId = newId();
  await db.query(
    `INSERT INTO farms (id, farmer_id, name, district) VALUES ($1, $2, 'Fixture Farm', 'The Nilgiris')`,
    [farmId, farmerId],
  );
  const plotId = newId();
  await db.query(`INSERT INTO plots (id, farm_id, name) VALUES ($1, $2, 'Fixture Zone')`, [plotId, farmId]);
  return { userId, farmerId, farmId, plotId };
}

/**
 * A brand-new crop_master row. Using a private crop (rather than "the first
 * seeded one") means a fair-price window in the test can never overlap a price
 * another test or a real operator already created for a seeded crop.
 */
export async function insertCrop(db: Executor): Promise<string> {
  const category = await db.query<{ id: string }>('SELECT id FROM categories ORDER BY created_at LIMIT 1');
  const categoryId = category.rows[0]?.id;
  if (categoryId === undefined) {
    throw new Error('no row in `categories`: run `pnpm db:seed` (db/seed/001_reference.sql) first');
  }
  const id = newId();
  await db.query(`INSERT INTO crop_master (id, slug, name, category_id) VALUES ($1, $2, $3, $4)`, [
    id,
    `fx-crop-${id.slice(0, 8)}`,
    'Fixture Crop',
    categoryId,
  ]);
  return id;
}

export interface PurchaseOrderFixture {
  purchaseOrderId: string;
  farmerId: string;
  warehouseId: string;
  issuedBy: string;
  receivedBy: string;
}

/** A purchase order with every parent row (farmer, warehouse, crop, fair price, listing). */
export async function insertPurchaseOrder(db: Executor): Promise<PurchaseOrderFixture> {
  const { farmerId } = await insertFarmerWithPlot(db);
  const issuedBy = await insertUser(db, 'ADMIN', 'Fixture PO Admin');
  const cropId = await insertCrop(db);

  const warehouseId = newId();
  await db.query(`INSERT INTO warehouses (id, code, name) VALUES ($1, $2, 'Fixture Warehouse')`, [
    warehouseId,
    `WH-FX-${warehouseId.slice(0, 8)}`,
  ]);

  const fairPriceId = newId();
  await db.query(
    `INSERT INTO fair_prices (id, crop_id, grade, ceiling_price, effective_from, set_by)
     VALUES ($1, $2, 'GRADE_1', 100.00, '2026-01-01', $3)`,
    [fairPriceId, cropId, issuedBy],
  );

  const listingId = newId();
  await db.query(
    `INSERT INTO produce_listings (id, listing_number, farmer_id, crop_id, grade, quantity_kg, price_per_kg, fair_price_id)
     VALUES ($1, $2, $3, $4, 'GRADE_1', 100, 50.00, $5)`,
    [listingId, `LST-FX-${listingId.slice(0, 8)}`, farmerId, cropId, fairPriceId],
  );

  const purchaseOrderId = newId();
  await db.query(
    `INSERT INTO purchase_orders
       (id, po_number, farmer_id, listing_id, warehouse_id, crop_id, grade, quantity_kg, price_per_kg, total_amount, issued_by)
     VALUES ($1, $2, $3, $4, $5, $6, 'GRADE_1', 100, 50.00, 5000.00, $7)`,
    [purchaseOrderId, `PO-FX-${purchaseOrderId.slice(0, 8)}`, farmerId, listingId, warehouseId, cropId, issuedBy],
  );

  return { purchaseOrderId, farmerId, warehouseId, issuedBy, receivedBy: issuedBy };
}
