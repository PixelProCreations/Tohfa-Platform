import { beforeAll, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import { inRolledBackTx, loadWarehouseIds, type WarehouseIds } from '../warehouse-ops/testkit.js';
import { createInventoryOverviewService } from './inventory-overview.service.js';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import { aScope } from '../../test/factories.js';

describeIfDatabase('Critical Stock Count & Threshold (BR-165)', () => {
  const app = createApp();
  let ready = false;
  let wh: WarehouseIds;
  let superAdminToken: string;

  beforeAll(async () => {
    ready = await databaseReady('inventory_batches');
    if (!ready) return;

    wh = await loadWarehouseIds(pool);

    const superAdminUserId = newId();
    superAdminToken = signAccessToken({
      sub: superAdminUserId,
      roles: [{ code: 'SUPER_ADMIN' }],
      customerId: null,
      farmerId: null,
    });
  });

  it('BR-165a: GET /v1/admin/inventory/overview returns criticalStockCount and criticalStockThresholdKg', async () => {
    const res = await request(app)
      .get('/v1/admin/inventory/overview')
      .set('Authorization', `Bearer ${superAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('criticalStockCount');
    expect(res.body.thresholds).toHaveProperty('criticalStockThresholdKg');
    expect(typeof res.body.criticalStockCount).toBe('number');
    expect(res.body.thresholds.criticalStockThresholdKg).toBe('10');
  });

  it('BR-165b: criticalStockCount dynamically counts groups below threshold in rolled back transaction', async () => {
    await inRolledBackTx(async (tx) => {
      const svc = createInventoryOverviewService({ db: tx });

      // Get a crop and farmer
      const cropRes = await tx.query<{ id: string }>(`SELECT id FROM crop_master LIMIT 1`);
      const cropId = cropRes.rows[0]!.id;
      const farmerRes = await tx.query<{ id: string }>(`SELECT id FROM farmers LIMIT 1`);
      const farmerId = farmerRes.rows[0]!.id;

      // Ensure critical threshold is 10
      await tx.query(
        `INSERT INTO system_config (key, value) VALUES ('critical_stock_threshold_kg', '10')
         ON CONFLICT (key) DO UPDATE SET value = '10'`,
      );

      const scope = aScope({
        level: ScopeLevel.ALL,
        roleCode: RoleCode.SUPER_ADMIN,
        permission: 'inventory.batch.view',
      });

      const before = await svc.get(scope);
      const initialCritical = before.criticalStockCount ?? 0;

      // Insert a batch with qty 5 (below 10 kg threshold)
      const b1 = newId();
      await tx.query(
        `INSERT INTO inventory_batches (
           id, batch_code, warehouse_id, crop_id, source_farmer_id, grade, qty_received, qty_available, status
         )
         VALUES ($1, 'BATCH-CRIT-1', $2, $3, $4, 'GRADE_1', 5, 5, 'ACTIVE')`,
        [b1, wh.ooty, cropId, farmerId],
      );

      const after = await svc.get(scope);
      expect(after.criticalStockCount).toBe(initialCritical + 1);

      // Now set threshold to 3: the 5 kg batch is no longer below threshold!
      await tx.query(`UPDATE system_config SET value = '3' WHERE key = 'critical_stock_threshold_kg'`);
      const afterLower = await svc.get(scope);
      expect(afterLower.thresholds.criticalStockThresholdKg).toBe('3');
      expect(afterLower.criticalStockCount).toBe(initialCritical);
    });
  });

  it('BR-165c: criticalStockCount is null when threshold is missing from system_config', async () => {
    await inRolledBackTx(async (tx) => {
      const svc = createInventoryOverviewService({ db: tx });
      await tx.query(`DELETE FROM system_config WHERE key = 'critical_stock_threshold_kg'`);

      const scope = aScope({
        level: ScopeLevel.ALL,
        roleCode: RoleCode.SUPER_ADMIN,
        permission: 'inventory.batch.view',
      });

      const res = await svc.get(scope);
      expect(res.criticalStockCount).toBeNull();
      expect(res.thresholds.criticalStockThresholdKg).toBeNull();
    });
  });
});
