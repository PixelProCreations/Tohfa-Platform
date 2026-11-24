import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { listZonesQuery, zoneIdParams } from './zones.schema.js';
import { zonesService } from './zones.service.js';

export const adminZonesRouter: Router = Router();

export const publicZonesRouter: Router = Router();

// GET /v1/zones — list zones for public applicant picker (BR-143)
publicZonesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await zonesService.listPublic();
    res.status(200).json(items);
  }),
);

adminZonesRouter.use(requireAuth);
adminZonesRouter.use(requirePermission('zone.view'));

// GET /v1/admin/zones — list zones with optional status and warehouseId filters (BR-161a)
adminZonesRouter.get(
  '/',
  validate({ query: listZonesQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listZonesQuery);
    const items = await zonesService.list(scope, query);
    res.status(200).json(items);
  }),
);

// GET /v1/admin/zones/:id — zone detail with manager and taluks (BR-161b)
adminZonesRouter.get(
  '/:id',
  validate({ params: zoneIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const params = getValidated(req, 'params', zoneIdParams);
    const item = await zonesService.get(scope, params.id);
    res.status(200).json(item);
  }),
);
