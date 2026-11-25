import { Router } from 'express';
import { z } from 'zod';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  listAllocationsQuery,
  updateAllocationConfigBody,
} from './allocations.schema.js';
import { allocationsService } from './allocations.service.js';

export const adminAllocationsRouter: Router = Router();
export const adminAllocationConfigRouter: Router = Router();

const getAllocationConfigQuery = z
  .object({
    warehouseId: z.string().uuid('warehouseId must be a UUID').optional(),
    cropId: z.string().uuid('cropId must be a UUID').optional(),
    grade: z.string().optional(),
  })
  .strict();

adminAllocationsRouter.get(
  '/',
  requireAuth,
  requirePermission('allocation.dashboard.view'),
  validate({ query: listAllocationsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const filters = getValidated(req, 'query', listAllocationsQuery);
    res.json(await allocationsService.listAllocations(scope, filters));
  }),
);

adminAllocationConfigRouter.get(
  '/',
  requireAuth,
  requirePermission('allocation.channel_percentage.set'),
  validate({ query: getAllocationConfigQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', getAllocationConfigQuery);
    res.json(await allocationsService.getAllocationConfig(scope, query));
  }),
);

adminAllocationConfigRouter.patch(
  '/',
  requireAuth,
  requirePermission('allocation.channel_percentage.set'),
  validate({ body: updateAllocationConfigBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', updateAllocationConfigBody);
    res.json(await allocationsService.updateAllocationConfig(actor, scope, body));
  }),
);
