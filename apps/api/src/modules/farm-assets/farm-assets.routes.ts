/**
 * Farm assets — farmer-facing routes. Mounted at /v1/farmers/me.
 *
 * Middleware order is FIXED: requireAuth -> requirePermission -> validate ->
 * asyncHandler(handler). Handlers only hand (scope, validated input) to the
 * service; ownership (farms -> farms.farmer_id) is enforced in the service +
 * repo, not here.
 *
 * Permission codes (docs/rbac.json, "Farm Assets" module):
 * farmer.assets.view_own, farmer.assets.create_own, farmer.assets.edit_own.
 * There is no separate delete permission — retiring an asset (soft delete)
 * is an edit, the same way crops has no separate permission for its status
 * transitions.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  createFarmAssetBody,
  farmAssetIdParams,
  listFarmAssetsQuery,
  updateFarmAssetBody,
} from './farm-assets.schema.js';
import { farmAssetsService } from './farm-assets.service.js';

export const farmAssetsRouter: Router = Router();

// GET /v1/farmers/me/farm-assets
farmAssetsRouter.get(
  '/farm-assets',
  requireAuth,
  requirePermission('farmer.assets.view_own'),
  validate({ query: listFarmAssetsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listFarmAssetsQuery);
    res.json(await farmAssetsService.listFarmAssets(scope, query));
  }),
);

// POST /v1/farmers/me/farm-assets — registers a new tool/equipment/machinery item.
farmAssetsRouter.post(
  '/farm-assets',
  requireAuth,
  requirePermission('farmer.assets.create_own'),
  validate({ body: createFarmAssetBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createFarmAssetBody);
    res.status(201).json(await farmAssetsService.createFarmAsset(scope, body));
  }),
);

// GET /v1/farmers/me/farm-assets/:assetId
farmAssetsRouter.get(
  '/farm-assets/:assetId',
  requireAuth,
  requirePermission('farmer.assets.view_own'),
  validate({ params: farmAssetIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { assetId } = getValidated(req, 'params', farmAssetIdParams);
    res.json(await farmAssetsService.getFarmAsset(scope, assetId));
  }),
);

// PATCH /v1/farmers/me/farm-assets/:assetId
farmAssetsRouter.patch(
  '/farm-assets/:assetId',
  requireAuth,
  requirePermission('farmer.assets.edit_own'),
  validate({ params: farmAssetIdParams, body: updateFarmAssetBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { assetId } = getValidated(req, 'params', farmAssetIdParams);
    const body = getValidated(req, 'body', updateFarmAssetBody);
    res.json(await farmAssetsService.updateFarmAsset(scope, assetId, body));
  }),
);

// DELETE /v1/farmers/me/farm-assets/:assetId — soft delete (deleted_at), e.g. a broken tool being retired.
farmAssetsRouter.delete(
  '/farm-assets/:assetId',
  requireAuth,
  requirePermission('farmer.assets.edit_own'),
  validate({ params: farmAssetIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { assetId } = getValidated(req, 'params', farmAssetIdParams);
    await farmAssetsService.deleteFarmAsset(scope, assetId);
    res.status(204).end();
  }),
);
