/**
 * BR-80: `PATCH /v1/warehouses/{id}` (contact phone and operating hours). Wiring only.
 * Mounted by app.ts at /v1/warehouses through `warehouseOpsRouter`. There is deliberately no
 * POST or DELETE on /v1/warehouses anywhere: the four warehouses are fixed (BR-23).
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { warehouseIdParams } from './storage-locations.schema.js';
import { updateWarehouseProfileBody } from './warehouse-profile.schema.js';
import { warehouseProfileService } from './warehouse-profile.service.js';

export const warehouseProfileRouter: Router = Router();

warehouseProfileRouter.patch(
  '/:id',
  requireAuth,
  requirePermission('warehouse.profile.edit'),
  validate({ params: warehouseIdParams, body: updateWarehouseProfileBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', warehouseIdParams);
    const body = getValidated(req, 'body', updateWarehouseProfileBody);
    res.json(await warehouseProfileService.update(scope, id, body));
  }),
);
