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
import { farmerIdParams } from './livestock.schema.js';
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
