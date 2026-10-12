/**
 * Livestock — farmer-facing routes. Mounted at /v1/farmers/me/livestock.
 *
 * Middleware order is FIXED: requireAuth -> requirePermission -> validate ->
 * asyncHandler(handler). Handlers only hand (scope, validated input) to the
 * service; ownership (farms.farmer_id) and BR-47 are enforced in the
 * service + repo, not here.
 *
 * Permission codes (docs/rbac.json, "Livestock" module): farmer.livestock.view_own,
 * farmer.livestock.create_own, farmer.livestock.edit_own.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  animalIdParams,
  createAnimalBody,
  createProductionLogBody,
  listAnimalsQuery,
  listProductionLogsQuery,
  recordLifecycleEventBody,
  updateAnimalBody,
} from './livestock.schema.js';
import { livestockService } from './livestock.service.js';

export const livestockRouter: Router = Router();

// GET /v1/farmers/me/livestock/animals
livestockRouter.get(
  '/animals',
  requireAuth,
  requirePermission('farmer.livestock.view_own'),
  validate({ query: listAnimalsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listAnimalsQuery);
    res.json(await livestockService.listAnimals(scope, query));
  }),
);

// POST /v1/farmers/me/livestock/animals — registers a new animal.
livestockRouter.post(
  '/animals',
  requireAuth,
  requirePermission('farmer.livestock.create_own'),
  validate({ body: createAnimalBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createAnimalBody);
    res.status(201).json(await livestockService.createAnimal(scope, body));
  }),
);

// GET /v1/farmers/me/livestock/animals/:animalId
livestockRouter.get(
  '/animals/:animalId',
  requireAuth,
  requirePermission('farmer.livestock.view_own'),
  validate({ params: animalIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { animalId } = getValidated(req, 'params', animalIdParams);
    res.json(await livestockService.getAnimal(scope, animalId));
  }),
);

// PATCH /v1/farmers/me/livestock/animals/:animalId
livestockRouter.patch(
  '/animals/:animalId',
  requireAuth,
  requirePermission('farmer.livestock.edit_own'),
  validate({ params: animalIdParams, body: updateAnimalBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { animalId } = getValidated(req, 'params', animalIdParams);
    const body = getValidated(req, 'body', updateAnimalBody);
    res.json(await livestockService.updateAnimal(scope, animalId, body));
  }),
);

// POST /v1/farmers/me/livestock/animals/:animalId/lifecycle-events — sold/
// transferred/culled/deceased; ends the animal's active lifecycle (BR-47).
livestockRouter.post(
  '/animals/:animalId/lifecycle-events',
  requireAuth,
  requirePermission('farmer.livestock.edit_own'),
  validate({ params: animalIdParams, body: recordLifecycleEventBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { animalId } = getValidated(req, 'params', animalIdParams);
    const body = getValidated(req, 'body', recordLifecycleEventBody);
    res.status(201).json(await livestockService.recordLifecycleEvent(scope, animalId, body));
  }),
);

// GET /v1/farmers/me/livestock/production-logs
livestockRouter.get(
  '/production-logs',
  requireAuth,
  requirePermission('farmer.livestock.view_own'),
  validate({ query: listProductionLogsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listProductionLogsQuery);
    res.json(await livestockService.listProductionLogs(scope, query));
  }),
);

// POST /v1/farmers/me/livestock/production-logs
livestockRouter.post(
  '/production-logs',
  requireAuth,
  requirePermission('farmer.livestock.create_own'),
  validate({ body: createProductionLogBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createProductionLogBody);
    res.status(201).json(await livestockService.createProductionLog(scope, body));
  }),
);
