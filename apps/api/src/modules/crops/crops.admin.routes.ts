/**
 * Crops — admin crop taxonomy management. Mounted at /v1/admin/crop-master.
 *
 * Middleware order is FIXED: requireAuth -> requirePermission -> validate ->
 * asyncHandler(handler). `admin.crop_taxonomy.manage` is granted only to
 * SUPER_ADMIN/TOHFA_ADMIN in docs/rbac.json, so FARMER/CUSTOMER are rejected
 * with 403 by requirePermission before any handler runs. The audit row for
 * every mutation is written by the service inside the same transaction.
 *
 * Mirrors farm-diary.admin.routes.ts's taxonomy pattern: deactivation is a
 * generic `PATCH .../:id` with `isActive: false` in the body, not a separate
 * endpoint — crop_master has no sub-resource (unlike the diary's category /
 * sub-activity pair), so this is GET + POST + PATCH only.
 *
 * Shares crops.schema.ts / crops.service.ts / crops.repo.ts with the
 * farmer-facing router.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  adminFarmerCropParams,
  adminFarmerPlotCropsParams,
  createCropMasterBody,
  createFarmCropBody,
  cropMasterIdParams,
  listFarmCropsQuery,
  updateCropMasterBody,
  updateFarmCropBody,
} from './crops.schema.js';
import { adminFarmerCropsService, cropTaxonomyAdminService } from './crops.service.js';

export const adminCropMasterRouter: Router = Router();
export const adminFarmerCropsRouter: Router = Router();

const MANAGE = 'admin.crop_taxonomy.manage';

// GET /v1/admin/crop-master — every crop, active and inactive.
adminCropMasterRouter.get(
  '/',
  requireAuth,
  requirePermission(MANAGE),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await cropTaxonomyAdminService.list(scope));
  }),
);

// POST /v1/admin/crop-master
adminCropMasterRouter.post(
  '/',
  requireAuth,
  requirePermission(MANAGE),
  validate({ body: createCropMasterBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createCropMasterBody);
    res.status(201).json(await cropTaxonomyAdminService.create(scope, body));
  }),
);

// PATCH /v1/admin/crop-master/:id — includes isActive=false to deactivate.
adminCropMasterRouter.patch(
  '/:id',
  requireAuth,
  requirePermission(MANAGE),
  validate({ params: cropMasterIdParams, body: updateCropMasterBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', cropMasterIdParams);
    const body = getValidated(req, 'body', updateCropMasterBody);
    res.json(await cropTaxonomyAdminService.update(scope, id, body));
  }),
);

// GET /v1/admin/farmers/:farmerId/plots/:plotId/crops
adminFarmerCropsRouter.get(
  '/:farmerId/plots/:plotId/crops',
  requireAuth,
  requirePermission('farmer.farm_records.manage'),
  validate({ params: adminFarmerPlotCropsParams, query: listFarmCropsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmerId, plotId } = getValidated(req, 'params', adminFarmerPlotCropsParams);
    const query = getValidated(req, 'query', listFarmCropsQuery);
    res.json(await adminFarmerCropsService.listFarmCrops(scope, farmerId, plotId, query));
  }),
);

// POST /v1/admin/farmers/:farmerId/plots/:plotId/crops
adminFarmerCropsRouter.post(
  '/:farmerId/plots/:plotId/crops',
  requireAuth,
  requirePermission('farmer.farm_records.manage'),
  validate({ params: adminFarmerPlotCropsParams, body: createFarmCropBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmerId, plotId } = getValidated(req, 'params', adminFarmerPlotCropsParams);
    const body = getValidated(req, 'body', createFarmCropBody);
    res.status(201).json(await adminFarmerCropsService.createFarmCrop(scope, farmerId, plotId, body));
  }),
);

// PATCH /v1/admin/farmers/:farmerId/crops/:farmCropId
adminFarmerCropsRouter.patch(
  '/:farmerId/crops/:farmCropId',
  requireAuth,
  requirePermission('farmer.farm_records.manage'),
  validate({ params: adminFarmerCropParams, body: updateFarmCropBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmerId, farmCropId } = getValidated(req, 'params', adminFarmerCropParams);
    const body = getValidated(req, 'body', updateFarmCropBody);
    res.json(await adminFarmerCropsService.updateFarmCrop(scope, farmerId, farmCropId, body));
  }),
);
