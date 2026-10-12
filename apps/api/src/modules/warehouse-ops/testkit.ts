/**
 * Test-only helpers shared by the warehouse-ops test files (never imported by production code).
 *
 * `startHttpHarness` boots the REAL app router against the configured test database and signs one
 * access token per role, so a test proves the permission codes, the 401/403 gates and the scope
 * rules end to end instead of calling a service with a hand-built scope.
 */
import type { Server } from 'node:http';
import { RoleCode } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { IDS, newId } from '../../test/factories.js';
import { ensureStandardUsers } from '../../test/dbFixtures.js';

export interface WarehouseIds {
  ooty: string;
  coonoor: string;
  kotagiri: string;
  gudalur: string;
}

export type HarnessRole =
  | 'superAdmin'
  | 'tohfaAdmin'
  | 'farmerAdmin'
  | 'main'
  | 'subOoty'
  | 'subCoonoor'
  | 'farmer'
  | 'customer';

export interface HttpHarness {
  server: Server;
  warehouse: WarehouseIds;
  /** The users.id every token carries; audit_log.actor_id is a foreign key to it. */
  actorId: string;
  auth(role: HarnessRole): string;
  stop(): Promise<void>;
}

/** Thrown inside a transaction to roll it back after the assertions ran. */
export class RollbackFixture extends Error {}

/** Runs `fn` in a real transaction and always rolls it back, so no fixture row survives. */
export async function inRolledBackTx(fn: (tx: Executor) => Promise<void>): Promise<void> {
  const { withTransaction } = await import('../../db/pool.js');
  await withTransaction(async (tx) => {
    await fn(tx);
    throw new RollbackFixture();
  }).catch((error: unknown) => {
    if (!(error instanceof RollbackFixture)) throw error;
  });
}

export async function loadWarehouseIds(db: Executor): Promise<WarehouseIds> {
  const result = await db.query<{ id: string; code: string }>(
    `SELECT id, code FROM warehouses WHERE code IN ('WH-OOTY', 'WH-COON', 'WH-KOTA', 'WH-GUDA')`,
  );
  const byCode = new Map(result.rows.map((row) => [row.code, row.id]));
  const need = (code: string): string => {
    const id = byCode.get(code);
    if (id === undefined) throw new Error(`seed warehouse ${code} is missing: run the reference seed`);
    return id;
  };
  return { ooty: need('WH-OOTY'), coonoor: need('WH-COON'), kotagiri: need('WH-KOTA'), gudalur: need('WH-GUDA') };
}

export async function startHttpHarness(): Promise<HttpHarness> {
  const [{ createApp }, { signAccessToken }, { pool }] = await Promise.all([
    import('../../app.js'),
    import('../../auth/jwt.js'),
    import('../../db/pool.js'),
  ]);
  await ensureStandardUsers(pool, 'userSuperAdmin');
  const actorId = IDS.userSuperAdmin;
  const warehouse = await loadWarehouseIds(pool);
  const server = createApp().listen(0);

  const base = { farmerId: null, customerId: null };
  const tokens: Record<HarnessRole, string> = {
    superAdmin: signAccessToken({ sub: actorId, roles: [{ code: RoleCode.SUPER_ADMIN }], ...base }),
    tohfaAdmin: signAccessToken({ sub: actorId, roles: [{ code: RoleCode.TOHFA_ADMIN }], ...base }),
    farmerAdmin: signAccessToken({ sub: actorId, roles: [{ code: RoleCode.FARMER_ADMIN, zoneId: newId() }], ...base }),
    main: signAccessToken({ sub: actorId, roles: [{ code: RoleCode.MAIN_WH_ADMIN }], ...base }),
    subOoty: signAccessToken({ sub: actorId, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: warehouse.ooty }], ...base }),
    subCoonoor: signAccessToken({ sub: actorId, roles: [{ code: RoleCode.SUB_WH_ADMIN, warehouseId: warehouse.coonoor }], ...base }),
    farmer: signAccessToken({ sub: actorId, roles: [{ code: RoleCode.FARMER }], farmerId: newId(), customerId: null }),
    customer: signAccessToken({ sub: actorId, roles: [{ code: RoleCode.CUSTOMER }], farmerId: null, customerId: newId() }),
  };

  return {
    server,
    warehouse,
    actorId,
    auth: (role) => `Bearer ${tokens[role]}`,
    async stop() {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      const [{ closePool }, { closeRedis }] = await Promise.all([import('../../db/pool.js'), import('../../redis.js')]);
      await Promise.allSettled([closePool(), closeRedis()]);
    },
  };
}
