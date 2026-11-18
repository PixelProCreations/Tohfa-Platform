/** Admin pickup-point management (BR-185). Mounted at /v1/admin/pickup-points. Wiring only. */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { pickupPointIdParams, updatePickupPointBody } from './pickup-points.admin.schema.js';
import { adminPickupPointsService } from './pickup-points.admin.service.js';

export const adminPickupPointsRouter: Router = Router();

adminPickupPointsRouter.get(
  '/',
  requireAuth,
  requirePermission('pickup_point.manage'),
  asyncHandler(async (req, res) => {
    res.json(await adminPickupPointsService.list(requireScope(req.scope)));
  }),
);

adminPickupPointsRouter.patch(
  '/:warehouseId',
  requireAuth,
  requirePermission('pickup_point.manage'),
  validate({ params: pickupPointIdParams, body: updatePickupPointBody }),
  asyncHandler(async (req, res) => {
    const { warehouseId } = getValidated(req, 'params', pickupPointIdParams);
    const body = getValidated(req, 'body', updatePickupPointBody);
    res.json(await adminPickupPointsService.update(requireScope(req.scope), warehouseId, body));
  }),
);
