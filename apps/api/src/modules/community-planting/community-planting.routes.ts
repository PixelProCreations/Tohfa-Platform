import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { plantingFiltersQuery, plantingSummaryQuery } from './community-planting.schema.js';
import {
  communityPlantingService,
  type CommunityPlantingService,
} from './community-planting.service.js';

/**
 * Community planting summary (BR-135), mounted at /v1/farmers/community.
 * The service is injectable so the route tests can exercise the real middleware chain
 * (401 / 403 / 422) without a database.
 */
export function createCommunityPlantingRouter(
  service: CommunityPlantingService = communityPlantingService,
): Router {
  const router = Router();

  // GET /v1/farmers/community/planting-summary
  router.get(
    '/planting-summary',
    requireAuth,
    requirePermission('farmer.community.view_planting_summary'),
    validate({ query: plantingSummaryQuery }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const query = getValidated(req, 'query', plantingSummaryQuery);
      res.json(await service.getPlantingSummary(scope, query));
    }),
  );

  // GET /v1/farmers/community/planting-filters
  router.get(
    '/planting-filters',
    requireAuth,
    requirePermission('farmer.community.view_planting_summary'),
    validate({ query: plantingFiltersQuery }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      res.json(await service.getPlantingFilters(scope));
    }),
  );

  return router;
}

export const communityPlantingRouter: Router = createCommunityPlantingRouter();
