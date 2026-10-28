/**
 * BR-116: `GET /v1/admin/inventory/overview`. Wiring only: requireAuth -> requirePermission ->
 * validate -> handler. Mounted by app.ts at /v1/admin/inventory.
 *
 * The permission is `inventory.batch.view`, the code the inventory batch list and the inventory report
 * already use (Super, TOHFA, Main `all`; Sub `own`; everyone else `none`). The overview aggregates the
 * same batches, so it needs no new code. The service confines a Sub admin to its warehouse.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { inventoryOverviewQuery } from './inventory-overview.schema.js';
import { inventoryOverviewService, type InventoryOverviewService } from './inventory-overview.service.js';

export function createInventoryOverviewRouter(service: InventoryOverviewService = inventoryOverviewService): Router {
  const router: Router = Router();

  router.get(
    '/overview',
    requireAuth,
    requirePermission('inventory.batch.view'),
    validate({ query: inventoryOverviewQuery }),
    asyncHandler(async (req, res) => {
      res.json(await service.get(requireScope(req.scope)));
    }),
  );

  return router;
}

export const inventoryOverviewRouter: Router = createInventoryOverviewRouter();
