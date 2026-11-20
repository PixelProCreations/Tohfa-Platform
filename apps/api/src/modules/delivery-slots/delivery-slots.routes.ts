/** BR-201: delivery slot availability. Wiring only. Mounted at /v1/delivery-slots. */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import { listDeliverySlotsQuery } from './delivery-slots.schema.js';
import { deliverySlotsService } from './delivery-slots.service.js';

export const deliverySlotsRouter: Router = Router();

// Reading slots exists only to place an order, so it reuses order.place (no separate code).
deliverySlotsRouter.get(
  '/',
  requireAuth,
  requirePermission('order.place'),
  validate({ query: listDeliverySlotsQuery }),
  asyncHandler(async (req, res) => {
    res.status(200).json(await deliverySlotsService.listSlots(getValidated(req, 'query', listDeliverySlotsQuery)));
  }),
);
