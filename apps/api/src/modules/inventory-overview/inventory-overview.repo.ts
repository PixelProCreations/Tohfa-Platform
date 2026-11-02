/**
 * BR-116: SQL for the admin inventory overview. Read-only aggregates, each ONE statement over the
 * whole scope (never a query per warehouse or batch). Every function takes an `Executor` so a test can
 * run it inside a rolled-back transaction.
 *
 * Nothing here re-derives a definition another module owns:
 *  - "available on the shelf" is `shelfFreeSql` (BR-100), the fragment every availability read uses;
 *  - near-expiry and low-stock are the BR-77 alert branches, counted by `countAlertConditions`;
 *  - the warehouse confinement is `warehouseScopeFilter`, the shared warehouse-admin scope predicate.
 *
 * BR-107: `DISPUTED` is a legal stored verification status that no route writes. The counts below
 * name `RECORDED` explicitly and never name `DISPUTED`; the test asserts no statement issued here does.
 * BR-16: no farmer column is selected.
 */
import type { Executor } from '../../db/pool.js';
import { shelfFreeSql } from '../../db/shelfAvailability.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { warehouseScopeFilter } from '../../rbac/warehouseScope.js';
import {
  countAlertConditions,
  tasksAlertsRepo,
  type AlertThresholds,
} from '../tasks-alerts/tasks-alerts.repo.js';

export interface WarehouseStockRow {
  warehouseId: string;
  name: string;
  /** numeric(14,3) as text. */
  availableQtyKg: string;
}

export interface BacklogCounts {
  pendingAdjustments: number;
  recordedVerifications: number;
  recordedVerificationsWithVariance: number;
}

export interface AlertConditionCounts {
  nearExpiryBatches: number;
  lowStockGroups: number;
}

export interface InventoryOverviewRepo {
  /** `alert_batch_expiry_days` and `low_stock_threshold_kg` (and the capacity one), read exactly as the alerts do. */
  getThresholds(db: Executor): Promise<AlertThresholds>;
  warehouseStock(db: Executor, scope: ResolvedScope): Promise<WarehouseStockRow[]>;
  backlogCounts(db: Executor, scope: ResolvedScope): Promise<BacklogCounts>;
  /** Counts of the BATCH_NEAR_EXPIRY and LOW_STOCK conditions; a type with an unusable threshold counts 0 here (the service reports null). */
  alertConditionCounts(db: Executor, scope: ResolvedScope, thresholds: AlertThresholds): Promise<AlertConditionCounts>;
}

export const inventoryOverviewRepo: InventoryOverviewRepo = {
  getThresholds(db) {
    return tasksAlertsRepo.getAlertThresholds(db);
  },

  async warehouseStock(db, scope) {
    const filter = warehouseScopeFilter(scope, 'w.id', 1);
    // LEFT JOIN so a warehouse with no ACTIVE batch is still listed, at 0.000. On such a row `b` is
    // all NULL: the shelf fragment's GREATEST then yields 0, and SUM over it stays exact NUMERIC.
    const result = await db.query<{ warehouse_id: string; name: string; available_qty_kg: string }>(
      `SELECT w.id AS warehouse_id, w.name,
              COALESCE(SUM(CASE WHEN b.id IS NULL THEN 0 ELSE ${shelfFreeSql('b')} END), 0)::numeric(14,3)::text AS available_qty_kg
         FROM warehouses w
         LEFT JOIN inventory_batches b ON b.warehouse_id = w.id AND b.status = 'ACTIVE'
        WHERE w.deleted_at IS NULL AND ${filter.sql}
        GROUP BY w.id, w.name
        ORDER BY w.name, w.id`,
      filter.params,
    );
    return result.rows.map((row) => ({ warehouseId: row.warehouse_id, name: row.name, availableQtyKg: row.available_qty_kg }));
  },

  async backlogCounts(db, scope) {
    // One parameter list shared by the three subqueries: each filter starts at $1 and has the same
    // parameters, only the column differs.
    const adjustments = warehouseScopeFilter(scope, 'a.warehouse_id', 1);
    const verifications = warehouseScopeFilter(scope, 'v.warehouse_id', 1);
    // Batch-level counts only, as the verification list shows (it inner-joins the batch).
    const result = await db.query<{ pending_adjustments: number; recorded: number; recorded_with_variance: number }>(
      `SELECT
         (SELECT count(*)::int FROM stock_adjustments a
           WHERE a.status = 'PENDING' AND ${adjustments.sql}) AS pending_adjustments,
         (SELECT count(*)::int FROM stock_verifications v
           WHERE v.status = 'RECORDED' AND v.batch_id IS NOT NULL AND ${verifications.sql}) AS recorded,
         (SELECT count(*)::int FROM stock_verifications v
           WHERE v.status = 'RECORDED' AND v.batch_id IS NOT NULL AND v.variance_qty <> 0 AND ${verifications.sql}) AS recorded_with_variance`,
      adjustments.params,
    );
    const row = result.rows[0];
    return {
      pendingAdjustments: row?.pending_adjustments ?? 0,
      recordedVerifications: row?.recorded ?? 0,
      recordedVerificationsWithVariance: row?.recorded_with_variance ?? 0,
    };
  },

  async alertConditionCounts(db, scope, thresholds) {
    const counts = await countAlertConditions(db, { scope, types: ['BATCH_NEAR_EXPIRY', 'LOW_STOCK'], thresholds });
    return { nearExpiryBatches: counts.BATCH_NEAR_EXPIRY ?? 0, lowStockGroups: counts.LOW_STOCK ?? 0 };
  },
};
