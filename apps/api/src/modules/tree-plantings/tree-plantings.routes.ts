import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  createTreePlantingBody,
  listTreePlantingsQuery,
  treePlantingIdParams,
  updateTreePlantingBody,
} from './tree-plantings.schema.js';
import { treePlantingsService } from './tree-plantings.service.js';

export const treePlantingsRouter: Router = Router();

// GET /v1/farmers/me/tree-plantings
treePlantingsRouter.get(
  '/tree-plantings',
  requireAuth,
  requirePermission('farmer.tree_planting.manage_own'),
  validate({ query: listTreePlantingsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listTreePlantingsQuery);
    res.json(await treePlantingsService.listTreePlantings(scope, query));
  }),
);

// POST /v1/farmers/me/tree-plantings
treePlantingsRouter.post(
  '/tree-plantings',
  requireAuth,
  requirePermission('farmer.tree_planting.manage_own'),
  validate({ body: createTreePlantingBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createTreePlantingBody);
    res.status(201).json(await treePlantingsService.createTreePlanting(scope, body));
  }),
);

// GET /v1/farmers/me/tree-plantings/:id
treePlantingsRouter.get(
  '/tree-plantings/:id',
  requireAuth,
  requirePermission('farmer.tree_planting.manage_own'),
  validate({ params: treePlantingIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', treePlantingIdParams);
    res.json(await treePlantingsService.getTreePlanting(scope, id));
  }),
);

// PATCH /v1/farmers/me/tree-plantings/:id
treePlantingsRouter.patch(
  '/tree-plantings/:id',
  requireAuth,
  requirePermission('farmer.tree_planting.manage_own'),
  validate({ params: treePlantingIdParams, body: updateTreePlantingBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', treePlantingIdParams);
    const body = getValidated(req, 'body', updateTreePlantingBody);
    res.json(await treePlantingsService.updateTreePlanting(scope, id, body));
  }),
);

// DELETE /v1/farmers/me/tree-plantings/:id
treePlantingsRouter.delete(
  '/tree-plantings/:id',
  requireAuth,
  requirePermission('farmer.tree_planting.manage_own'),
  validate({ params: treePlantingIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', treePlantingIdParams);
    await treePlantingsService.deleteTreePlanting(scope, id);
    res.status(204).end();
  }),
);
