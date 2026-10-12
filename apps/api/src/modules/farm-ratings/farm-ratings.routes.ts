/**
 * Middleware order is FIXED: requireAuth -> requirePermission -> validate ->
 * asyncHandler(handler). See CLAUDE.md / apps/api/CLAUDE.md.
 *
 * Read-only: farmer.rating.view is the only permission this module uses.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { farmerIdParams } from './farm-ratings.schema.js';
import { farmRatingsService } from './farm-ratings.service.js';

/** Mounted at /v1/admin/farmers */
export const adminFarmRatingsRouter: Router = Router();

// GET /v1/admin/farmers/:id/rating — 10-category breakdown + overall rating/tier
adminFarmRatingsRouter.get(
  '/:id/rating',
  requireAuth,
  requirePermission('farmer.rating.view'),
  validate({ params: farmerIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', farmerIdParams);
    const result = await farmRatingsService.getAdminRating(scope, id);
    res.json(result);
  }),
);

// There is deliberately NO write route (product decision 2026-10-01): a farm
// rating is created only by completing an INTERNAL audit
// (POST /v1/admin/audits/:id/complete, guarded by audit.conduct). The former
// PUT /:id/rating and its farmer.rating.edit permission were removed; an
// unmatched PUT now falls through to the 404 handler.

/** Mounted at /v1/farmers/me/rating */
export const farmRatingsFarmerRouter: Router = Router();

// GET /v1/farmers/me/rating — the caller's own 10-category breakdown
farmRatingsFarmerRouter.get(
  '/',
  requireAuth,
  requirePermission('farmer.rating.view'),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const result = await farmRatingsService.getMyRating(scope);
    res.json(result);
  }),
);
