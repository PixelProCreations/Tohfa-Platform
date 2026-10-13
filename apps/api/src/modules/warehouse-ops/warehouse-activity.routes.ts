/**
 * BR-104: `GET /v1/warehouses/{id}/activity`. Wiring only.
 * Mounted by app.ts at /v1/warehouses through `warehouseOpsRouter`. There is deliberately no write
 * route: the feed is a read over records owned by other modules.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { warehouseIdParams } from './storage-locations.schema.js';
import { activityQuery } from './warehouse-activity.schema.js';
import { warehouseActivityService } from './warehouse-activity.service.js';

export const warehouseActivityRouter: Router = Router();

warehouseActivityRouter.get(
  '/:id/activity',
  requireAuth,
  requirePermission('warehouse.activity.view'),
  validate({ params: warehouseIdParams, query: activityQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', warehouseIdParams);
    const query = getValidated(req, 'query', activityQuery);
    res.json(await warehouseActivityService.list(scope, id, query));
  }),
);
