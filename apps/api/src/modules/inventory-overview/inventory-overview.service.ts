/**
 * BR-116: the admin inventory overview. Read-only; takes the resolved scope (never a Request) and
 * hands it to every repo call, which confine in SQL. Out-of-scope data is simply absent: there is no
 * 403 path here (BR-30).
 *
 * Thresholds come from system_config through the alerts' own reader. A missing or unusable threshold
 * reports its count as `null` ("not computed"), never as a hard-coded fallback.
 * No audit row: nothing is written.
 */
import { pool, type Executor } from '../../db/pool.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import { inventoryOverviewRepo, type InventoryOverviewRepo } from './inventory-overview.repo.js';
import { inventoryOverviewResponse, type InventoryOverview } from './inventory-overview.schema.js';

export interface InventoryOverviewService {
  get(scope: ResolvedScope): Promise<InventoryOverview>;
}

export function createInventoryOverviewService(
  deps: { repo?: InventoryOverviewRepo; db?: Executor } = {},
): InventoryOverviewService {
  const repo = deps.repo ?? inventoryOverviewRepo;
  const db = deps.db ?? pool;

  return {
    async get(scope) {
      const thresholds = await repo.getThresholds(db);
      const [warehouses, backlog, alerts] = await Promise.all([
        repo.warehouseStock(db, scope),
        repo.backlogCounts(db, scope),
        repo.alertConditionCounts(db, scope, thresholds),
      ]);

      // Allow-list: every key is named here; the strict parse is the second fence.
      return inventoryOverviewResponse.parse({
        warehouses: warehouses.map((row) => ({
          warehouseId: row.warehouseId,
          name: row.name,
          availableQtyKg: row.availableQtyKg,
        })),
        nearExpiryBatchCount: thresholds.expiryDays === null ? null : alerts.nearExpiryBatches,
        lowStockCount: thresholds.lowStockKg === null ? null : alerts.lowStockGroups,
        pendingAdjustmentCount: backlog.pendingAdjustments,
        unreconciledVerificationCount: backlog.recordedVerifications,
        varianceUnreconciledVerificationCount: backlog.recordedVerificationsWithVariance,
        thresholds: {
          nearExpiryDays: thresholds.expiryDays,
          lowStockThresholdKg: thresholds.lowStockKg,
        },
      });
    },
  };
}

export const inventoryOverviewService: InventoryOverviewService = createInventoryOverviewService();
