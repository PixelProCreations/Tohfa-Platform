import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { createZoneBody, listZonesQuery, transferZoneFarmersBody, updateZoneBody, zoneIdParams } from './zones.schema.js';
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

// GET /v1/admin/zones — list zones with optional status and warehouseId filters (BR-161a)
adminZonesRouter.get(
  '/',
  requirePermission('zone.view'),
  validate({ query: listZonesQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listZonesQuery);
    const items = await zonesService.list(scope, query);
    res.status(200).json(items);
  }),
);

// POST /v1/admin/zones — create a new zone (BR-240 / D10)
adminZonesRouter.post(
  '/',
  requirePermission('zone.manage'),
  validate({ body: createZoneBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createZoneBody);
    res.status(201).json(await zonesService.create(scope, body));
  }),
);

// GET /v1/admin/zones/:id — zone detail with manager and taluks (BR-161b)
adminZonesRouter.get(
  '/:id',
  requirePermission('zone.view'),
  validate({ params: zoneIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const params = getValidated(req, 'params', zoneIdParams);
    const item = await zonesService.get(scope, params.id);
    res.status(200).json(item);
  }),
);

// PATCH /v1/admin/zones/:id — edit zone metadata / taluks / active status (BR-240 / D10)
adminZonesRouter.patch(
  '/:id',
  requirePermission('zone.manage'),
  validate({ params: zoneIdParams, body: updateZoneBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', zoneIdParams);
    const body = getValidated(req, 'body', updateZoneBody);
    res.status(200).json(await zonesService.update(scope, id, body));
  }),
);

// POST /v1/admin/zones/:id/transfer-farmers — move farmers to another active zone (BR-240 / D10)
adminZonesRouter.post(
  '/:id/transfer-farmers',
  requirePermission('zone.manage'),
  validate({ params: zoneIdParams, body: transferZoneFarmersBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', zoneIdParams);
    const body = getValidated(req, 'body', transferZoneFarmersBody);
    res.status(200).json(await zonesService.transferFarmers(scope, id, body));
  }),
);
