/**
 * The admin inventory overview aggregate (docs/openapi.yaml tag Inventory):
 *   GET /admin/inventory/overview   inventory.batch.view   (BR-116, BR-100, BR-77, BR-107, BR-30)
 *
 * One read inside the caller's warehouse scope: per live warehouse the BR-100
 * free shelf of ACTIVE batches, plus network counts (near expiry, low stock,
 * pending adjustments, unreconciled verifications). Out-of-scope data is
 * absent, never 403 (BR-30). A threshold-based count is null when its
 * system_config threshold is unusable: a screen shows the dash, never 0.
 *
 * Quantities stay as the API's kg strings; screens turn them into integer
 * grams (money/quantity.ts). No UI imports.
 */
import type { GenericProblemCode } from '@tohfa/shared-types';
import { adminGet } from './http';
import type { QuantityKg } from './inventory';

/** docs/openapi.yaml `InventoryOverview.warehouses[]`. */
export interface InventoryOverviewWarehouseDto {
  warehouseId: string;
  name: string;
  /** Sum of the BR-100 free shelf over ACTIVE batches. */
  availableQtyKg: QuantityKg;
}

/** docs/openapi.yaml `InventoryOverview`. */
export interface InventoryOverviewDto {
  warehouses: InventoryOverviewWarehouseDto[];
  nearExpiryBatchCount: number | null;
  lowStockCount: number | null;
  pendingAdjustmentCount: number;
  /** Stock verifications in status RECORDED (BR-107). */
  unreconciledVerificationCount: number;
  /** RECORDED verifications with a non-zero variance (BR-107). */
  varianceUnreconciledVerificationCount: number;
  thresholds: { nearExpiryDays: number | null; lowStockThresholdKg: string | null };
}

/** 401, 403 (no inventory.batch.view), 422, 500. */
export const ERROR_CODES: readonly GenericProblemCode[] = ['UNAUTHENTICATED', 'FORBIDDEN', 'VALIDATION_FAILED', 'INTERNAL'];

export function getInventoryOverview(signal?: AbortSignal): Promise<InventoryOverviewDto> {
  return adminGet<InventoryOverviewDto>('/admin/inventory/overview', undefined, signal);
}
