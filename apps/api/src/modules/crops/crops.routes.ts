/**
 * Crops — farmer-facing routes. Mounted at /v1/farmers/me.
 *
 * Middleware order is FIXED: requireAuth -> requirePermission -> validate ->
 * asyncHandler(handler). Handlers only hand (scope, validated input) to the
 * service; ownership (plots -> farms.farmer_id) and BR-46 are enforced in
 * the service + repo, not here.
 *
 * Permission codes (docs/rbac.json, "Crops" module): farmer.crops.view_own,
 * farmer.crops.create_own, farmer.crops.edit_own.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  createFarmCropBody,
  farmCropIdParams,
  listFarmCropsQuery,
  plotIdParams,
  updateFarmCropBody,
} from './crops.schema.js';
import { cropsService } from './crops.service.js';

export const cropsRouter: Router = Router();

// GET /v1/farmers/me/crop-master — active crop types, for the NewCropScreen picker.
// Registered before the /plots/... routes only for readability; there is no path overlap.
cropsRouter.get(
  '/crop-master',
  requireAuth,
  requirePermission('farmer.crops.view_own'),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await cropsService.listCropMaster(scope));
  }),
);

// GET /v1/farmers/me/plots/:plotId/crops
cropsRouter.get(
  '/plots/:plotId/crops',
  requireAuth,
  requirePermission('farmer.crops.view_own'),
  validate({ params: plotIdParams, query: listFarmCropsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { plotId } = getValidated(req, 'params', plotIdParams);
    const query = getValidated(req, 'query', listFarmCropsQuery);
    res.json(await cropsService.listFarmCrops(scope, plotId, query));
  }),
);

// POST /v1/farmers/me/plots/:plotId/crops — plants a new crop on the plot.
cropsRouter.post(
  '/plots/:plotId/crops',
  requireAuth,
  requirePermission('farmer.crops.create_own'),
  validate({ params: plotIdParams, body: createFarmCropBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { plotId } = getValidated(req, 'params', plotIdParams);
    const body = getValidated(req, 'body', createFarmCropBody);
    res.status(201).json(await cropsService.createFarmCrop(scope, plotId, body));
  }),
);

// GET /v1/farmers/me/plots/:plotId/crop-rotation
cropsRouter.get(
  '/plots/:plotId/crop-rotation',
  requireAuth,
  requirePermission('farmer.crops.view_own'),
  validate({ params: plotIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { plotId } = getValidated(req, 'params', plotIdParams);
    res.json(await cropsService.getPlotRotationHistory(scope, plotId));
  }),
);

// GET /v1/farmers/me/crops/:farmCropId
cropsRouter.get(
  '/crops/:farmCropId',
  requireAuth,
  requirePermission('farmer.crops.view_own'),
  validate({ params: farmCropIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmCropId } = getValidated(req, 'params', farmCropIdParams);
    res.json(await cropsService.getFarmCrop(scope, farmCropId));
  }),
);

// PATCH /v1/farmers/me/crops/:farmCropId — status transitions, harvest, seed/grade detail.
cropsRouter.patch(
  '/crops/:farmCropId',
  requireAuth,
  requirePermission('farmer.crops.edit_own'),
  validate({ params: farmCropIdParams, body: updateFarmCropBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmCropId } = getValidated(req, 'params', farmCropIdParams);
    const body = getValidated(req, 'body', updateFarmCropBody);
    res.json(await cropsService.updateFarmCrop(scope, farmCropId, body));
  }),
);
