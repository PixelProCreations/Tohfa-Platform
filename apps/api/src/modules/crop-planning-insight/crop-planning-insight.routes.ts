import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { cropPlanningInsightService } from './crop-planning-insight.service.js';

export const cropPlanningInsightRouter: Router = Router();

// GET /v1/farmers/me/crop-planning-insight
cropPlanningInsightRouter.get(
  '/crop-planning-insight',
  requireAuth,
  requirePermission('farmer.crops.view_own'),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await cropPlanningInsightService.getCropPlanningInsight(scope));
  }),
);
