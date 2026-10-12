/**
 * farms.routes — wiring only.
 *
 * One permission, `farmer.farm.manage_own`, covers every route here: a plot
 * is only ever reached through a farm the actor owns, so a second permission
 * code would duplicate the same grant for no benefit (see docs/rbac.json).
 *
 * Middleware order is fixed: requireAuth -> requirePermission -> validate ->
 * asyncHandler(handler). No SQL, no ownership checks, no business rules here
 * — those live in farms.service.ts.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { farmsService } from './farms.service.js';
import {
  createFarmBody,
  createPlotBody,
  farmIdParams,
  farmPlotParams,
  updateFarmBody,
  updatePlotBody,
} from './farms.schema.js';

export const farmsRouter: Router = Router();

const MANAGE_OWN = 'farmer.farm.manage_own';

farmsRouter.get(
  '/',
  requireAuth,
  requirePermission(MANAGE_OWN),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const items = await farmsService.list(scope);
    res.json({ items });
  }),
);

farmsRouter.post(
  '/',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ body: createFarmBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createFarmBody);
    const farm = await farmsService.create(scope, body);
    res.status(201).json(farm);
  }),
);

farmsRouter.patch(
  '/:farmId',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmIdParams, body: updateFarmBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId } = getValidated(req, 'params', farmIdParams);
    const body = getValidated(req, 'body', updateFarmBody);
    const farm = await farmsService.update(scope, farmId, body);
    res.json(farm);
  }),
);

farmsRouter.delete(
  '/:farmId',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId } = getValidated(req, 'params', farmIdParams);
    await farmsService.remove(scope, farmId);
    res.status(204).end();
  }),
);

farmsRouter.get(
  '/:farmId/plots',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId } = getValidated(req, 'params', farmIdParams);
    const items = await farmsService.listPlots(scope, farmId);
    res.json({ items });
  }),
);

farmsRouter.post(
  '/:farmId/plots',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmIdParams, body: createPlotBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId } = getValidated(req, 'params', farmIdParams);
    const body = getValidated(req, 'body', createPlotBody);
    const plot = await farmsService.createPlot(scope, farmId, body);
    res.status(201).json(plot);
  }),
);

farmsRouter.patch(
  '/:farmId/plots/:plotId',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmPlotParams, body: updatePlotBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId } = getValidated(req, 'params', farmPlotParams);
    const body = getValidated(req, 'body', updatePlotBody);
    const plot = await farmsService.updatePlot(scope, farmId, plotId, body);
    res.json(plot);
  }),
);

farmsRouter.delete(
  '/:farmId/plots/:plotId',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmPlotParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId } = getValidated(req, 'params', farmPlotParams);
    await farmsService.removePlot(scope, farmId, plotId);
    res.status(204).end();
  }),
);
