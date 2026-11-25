/**
 * Livestock — admin read route. Mounted at /v1/admin/farmers.
 *
 * There is no admin-manageable livestock taxonomy (species is a fixed small
 * enum, unlike crop_master), so this is a single read-only route:
 * `admin.livestock.view_all` lets an admin/auditor inspect any farmer's herd,
 * e.g. for organic-certification audit purposes. No write path, so no
 * audit_log row is written (mirrors crops' read-only `listCropMaster` admin
 * path).
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  adminFarmerAnimalParams,
  createAnimalBody,
  createProductionLogBody,
  farmerIdParams,
  listProductionLogsQuery,
  recordLifecycleEventBody,
  updateAnimalBody,
} from './livestock.schema.js';
import { livestockAdminService } from './livestock.service.js';

export const livestockAdminRouter: Router = Router();

// GET /v1/admin/farmers/:farmerId/livestock/animals
livestockAdminRouter.get(
  '/:farmerId/livestock/animals',
  requireAuth,
  requirePermission('admin.livestock.view_all'),
  validate({ params: farmerIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmerId } = getValidated(req, 'params', farmerIdParams);
    res.json(await livestockAdminService.listAnimalsForFarmer(scope, farmerId));
  }),
);

// POST /v1/admin/farmers/:farmerId/livestock/animals
livestockAdminRouter.post(
  '/:farmerId/livestock/animals',
  requireAuth,
  requirePermission('farmer.farm_records.manage'),
  validate({ params: farmerIdParams, body: createAnimalBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmerId } = getValidated(req, 'params', farmerIdParams);
    const body = getValidated(req, 'body', createAnimalBody);
    res.status(201).json(await livestockAdminService.createAnimalForFarmer(scope, farmerId, body));
  }),
);

// PATCH /v1/admin/farmers/:farmerId/livestock/animals/:animalId
livestockAdminRouter.patch(
  '/:farmerId/livestock/animals/:animalId',
  requireAuth,
  requirePermission('farmer.farm_records.manage'),
  validate({ params: adminFarmerAnimalParams, body: updateAnimalBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmerId, animalId } = getValidated(req, 'params', adminFarmerAnimalParams);
    const body = getValidated(req, 'body', updateAnimalBody);
    res.json(await livestockAdminService.updateAnimalForFarmer(scope, farmerId, animalId, body));
  }),
);

// POST /v1/admin/farmers/:farmerId/livestock/animals/:animalId/lifecycle-events
livestockAdminRouter.post(
  '/:farmerId/livestock/animals/:animalId/lifecycle-events',
  requireAuth,
  requirePermission('farmer.farm_records.manage'),
  validate({ params: adminFarmerAnimalParams, body: recordLifecycleEventBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmerId, animalId } = getValidated(req, 'params', adminFarmerAnimalParams);
    const body = getValidated(req, 'body', recordLifecycleEventBody);
    res.status(201).json(await livestockAdminService.recordLifecycleEventForFarmer(scope, farmerId, animalId, body));
  }),
);

// GET /v1/admin/farmers/:farmerId/livestock/production-logs
livestockAdminRouter.get(
  '/:farmerId/livestock/production-logs',
  requireAuth,
  requirePermission('farmer.farm_records.manage'),
  validate({ params: farmerIdParams, query: listProductionLogsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmerId } = getValidated(req, 'params', farmerIdParams);
    const query = getValidated(req, 'query', listProductionLogsQuery);
    res.json(await livestockAdminService.listProductionLogsForFarmer(scope, farmerId, query));
  }),
);

// POST /v1/admin/farmers/:farmerId/livestock/production-logs
livestockAdminRouter.post(
  '/:farmerId/livestock/production-logs',
  requireAuth,
  requirePermission('farmer.farm_records.manage'),
  validate({ params: farmerIdParams, body: createProductionLogBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmerId } = getValidated(req, 'params', farmerIdParams);
    const body = getValidated(req, 'body', createProductionLogBody);
    res.status(201).json(await livestockAdminService.createProductionLogForFarmer(scope, farmerId, body));
  }),
);
