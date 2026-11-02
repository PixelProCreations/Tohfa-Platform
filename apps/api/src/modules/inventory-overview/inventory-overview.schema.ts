/**
 * BR-116: `GET /admin/inventory/overview`. Zod schemas matching docs/openapi.yaml `InventoryOverview`
 * exactly. The response schema is `.strict()` at every depth so an extra key (a farmer or batch id, a
 * DISPUTED bucket) fails the parse in the service instead of reaching the wire.
 */
import { z } from 'zod';

/** No parameters: the overview is always the caller's whole scope. An unknown parameter is 422. */
export const inventoryOverviewQuery = z.object({}).strict();
export type InventoryOverviewQuery = z.infer<typeof inventoryOverviewQuery>;

const quantityKg = z.string().regex(/^-?[0-9]{1,9}(\.[0-9]{1,3})?$/);
const count = z.number().int().min(0);

export const inventoryOverviewResponse = z
  .object({
    warehouses: z.array(
      z
        .object({
          warehouseId: z.string().uuid(),
          name: z.string(),
          availableQtyKg: quantityKg,
        })
        .strict(),
    ),
    nearExpiryBatchCount: count.nullable(),
    lowStockCount: count.nullable(),
    pendingAdjustmentCount: count,
    unreconciledVerificationCount: count,
    varianceUnreconciledVerificationCount: count,
    thresholds: z
      .object({
        nearExpiryDays: count.nullable(),
        lowStockThresholdKg: z.string().nullable(),
      })
      .strict(),
  })
  .strict();
export type InventoryOverview = z.infer<typeof inventoryOverviewResponse>;
