import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import {
  createMarketDaySchema,
  listMarketDaysQuerySchema,
  marketDayIdParamSchema,
  patchMarketDaySchema,
} from './market-days.schema.js';
import { marketDaysService } from './market-days.service.js';

export const adminMarketDaysRouter: Router = Router();

adminMarketDaysRouter.use(requireAuth);
adminMarketDaysRouter.use(requirePermission('market.schedule.manage'));

adminMarketDaysRouter.post(
  '/',
  validate({ body: createMarketDaySchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', createMarketDaySchema);
    const result = await marketDaysService.create(body, actor.userId);
    res.status(201).json(result);
  }),
);

adminMarketDaysRouter.patch(
  '/:id',
  validate({ params: marketDayIdParamSchema, body: patchMarketDaySchema }),
  asyncHandler(async (req, res) => {
    const params = getValidated(req, 'params', marketDayIdParamSchema);
    const body = getValidated(req, 'body', patchMarketDaySchema);
    const result = await marketDaysService.update(params.id, body);
    res.status(200).json(result);
  }),
);

adminMarketDaysRouter.get(
  '/',
  validate({ query: listMarketDaysQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = getValidated(req, 'query', listMarketDaysQuerySchema);
    const result = await marketDaysService.list(query);
    res.status(200).json(result);
  }),
);
