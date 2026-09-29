/**
 * Farm assets — admin read. Mounted at /v1/admin/farmers.
 *
 * Middleware order is FIXED: requireAuth -> requirePermission -> validate ->
 * asyncHandler(handler). `admin.assets.view_all` is scope `all`, so any
 * `farmerId` may be viewed — there is no farm/asset taxonomy to manage here
 * (unlike crops' crop_master), just a read of one farmer's own register, the
 * same shape adminFarmRatingsRouter's `GET /:id/rating` uses.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { farmerIdParams, listFarmAssetsQuery } from './farm-assets.schema.js';
import { farmAssetsAdminService } from './farm-assets.service.js';

export const adminFarmAssetsRouter: Router = Router();

// GET /v1/admin/farmers/:farmerId/farm-assets
adminFarmAssetsRouter.get(
  '/:farmerId/farm-assets',
  requireAuth,
  requirePermission('admin.assets.view_all'),
  validate({ params: farmerIdParams, query: listFarmAssetsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmerId } = getValidated(req, 'params', farmerIdParams);
    const query = getValidated(req, 'query', listFarmAssetsQuery);
    res.json(await farmAssetsAdminService.listForFarmer(scope, farmerId, query));
  }),
);
