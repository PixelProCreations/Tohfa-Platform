import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  farmCropIdParams,
  listTemplatesQuery,
  milestoneIdParams,
  updateMilestoneBody,
} from './crop-milestones.schema.js';
import { cropMilestonesService } from './crop-milestones.service.js';

export const cropMilestonesRouter: Router = Router();

// GET /v1/farmers/me/crops/:farmCropId/milestones
cropMilestonesRouter.get(
  '/crops/:farmCropId/milestones',
  requireAuth,
  requirePermission('farmer.crop_milestone.manage_own'),
  validate({ params: farmCropIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmCropId } = getValidated(req, 'params', farmCropIdParams);
    res.json(await cropMilestonesService.listMilestones(scope, farmCropId));
  }),
);

// POST /v1/farmers/me/crops/:farmCropId/milestones/initialize
cropMilestonesRouter.post(
  '/crops/:farmCropId/milestones/initialize',
  requireAuth,
  requirePermission('farmer.crop_milestone.manage_own'),
  validate({ params: farmCropIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmCropId } = getValidated(req, 'params', farmCropIdParams);
    // 201 only when this call inserted milestones; a repeat call changes nothing and answers 200.
    const { created, milestones } = await cropMilestonesService.initializeMilestones(scope, farmCropId);
    res.status(created ? 201 : 200).json(milestones);
  }),
);

// PATCH /v1/farmers/me/crops/:farmCropId/milestones/:id
cropMilestonesRouter.patch(
  '/crops/:farmCropId/milestones/:id',
  requireAuth,
  requirePermission('farmer.crop_milestone.manage_own'),
  validate({ params: milestoneIdParams, body: updateMilestoneBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmCropId, id } = getValidated(req, 'params', milestoneIdParams);
    const body = getValidated(req, 'body', updateMilestoneBody);
    res.json(await cropMilestonesService.updateMilestone(scope, farmCropId, id, body));
  }),
);

// GET /v1/farmers/me/crop-milestone-templates
cropMilestonesRouter.get(
  '/crop-milestone-templates',
  requireAuth,
  requirePermission('farmer.crop_milestone.manage_own'),
  validate({ query: listTemplatesQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listTemplatesQuery);
    res.json(await cropMilestonesService.listTemplates(scope, query));
  }),
);
