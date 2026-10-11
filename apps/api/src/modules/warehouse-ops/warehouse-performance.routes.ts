/**
 * BR-80: `GET /v1/warehouses/{id}/performance?from&to`. Wiring only.
 * Mounted by app.ts at /v1/warehouses through `warehouseOpsRouter`. The permission is
 * `warehouse.all.view`, which is what the designed Warehouse Performance screen is gated on
 * (Super/Tohfa/Main admin; a Sub admin does not hold it).
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { warehouseIdParams } from './storage-locations.schema.js';
import { performanceQuery } from './warehouse-performance.schema.js';
import { warehousePerformanceService } from './warehouse-performance.service.js';

export const warehousePerformanceRouter: Router = Router();

warehousePerformanceRouter.get(
  '/:id/performance',
  requireAuth,
  requirePermission('warehouse.all.view'),
  validate({ params: warehouseIdParams, query: performanceQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', warehouseIdParams);
    const query = getValidated(req, 'query', performanceQuery);
    res.json(await warehousePerformanceService.get(scope, id, query));
  }),
);
