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
import {
  adminFarmerAssetParams,
  createAdminFarmAssetBody,
  farmerIdParams,
  listFarmAssetsQuery,
  updateFarmAssetBody,
} from './farm-assets.schema.js';
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

// POST /v1/admin/farmers/:farmerId/farm-assets
adminFarmAssetsRouter.post(
  '/:farmerId/farm-assets',
  requireAuth,
  requirePermission('farmer.farm_records.manage'),
  validate({ params: farmerIdParams, body: createAdminFarmAssetBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmerId } = getValidated(req, 'params', farmerIdParams);
    const body = getValidated(req, 'body', createAdminFarmAssetBody);
    res.status(201).json(await farmAssetsAdminService.createForFarmer(scope, farmerId, body));
  }),
);

// PATCH /v1/admin/farmers/:farmerId/farm-assets/:assetId
adminFarmAssetsRouter.patch(
  '/:farmerId/farm-assets/:assetId',
  requireAuth,
  requirePermission('farmer.farm_records.manage'),
  validate({ params: adminFarmerAssetParams, body: updateFarmAssetBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmerId, assetId } = getValidated(req, 'params', adminFarmerAssetParams);
    const body = getValidated(req, 'body', updateFarmAssetBody);
    res.json(await farmAssetsAdminService.updateForFarmer(scope, farmerId, assetId, body));
  }),
);

// DELETE /v1/admin/farmers/:farmerId/farm-assets/:assetId
adminFarmAssetsRouter.delete(
  '/:farmerId/farm-assets/:assetId',
  requireAuth,
  requirePermission('farmer.farm_records.manage'),
  validate({ params: adminFarmerAssetParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmerId, assetId } = getValidated(req, 'params', adminFarmerAssetParams);
    await farmAssetsAdminService.deleteForFarmer(scope, farmerId, assetId);
    res.status(204).end();
  }),
);
