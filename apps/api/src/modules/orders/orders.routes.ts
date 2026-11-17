import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import {
  checkoutRequestSchema,
  listOrdersQuerySchema,
  orderIdParamSchema,
  quoteRequestSchema,
} from './orders.schema.js';
import { ordersService } from './orders.service.js';

export const ordersRouter: Router = Router();

ordersRouter.post(
  '/',
  requireAuth,
  requirePermission('order.place'),
  validate({ body: checkoutRequestSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', checkoutRequestSchema);
    const idempotencyKey = req.header('idempotency-key');

    const result = await ordersService.checkout(
      actor,
      req.scope!,
      body,
      idempotencyKey,
    );
    res.status(201).json(result);
  }),
);

// BR-200: what checkout would charge right now. Same permission and body as checkout; no
// Idempotency-Key because nothing is reserved, debited or booked.
ordersRouter.post(
  '/quote',
  requireAuth,
  requirePermission('order.place'),
  validate({ body: quoteRequestSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', quoteRequestSchema);
    res.status(200).json(await ordersService.quote(actor, req.scope!, body));
  }),
);

ordersRouter.get(
  '/',
  requireAuth,
  requirePermission('order.view_own'),
  validate({ query: listOrdersQuerySchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const query = getValidated(req, 'query', listOrdersQuerySchema);

    const result = await ordersService.listOrders(actor, req.scope!, query);
    res.status(200).json(result);
  }),
);

ordersRouter.get(
  '/:id',
  requireAuth,
  requirePermission('order.view_own'),
  validate({ params: orderIdParamSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const params = getValidated(req, 'params', orderIdParamSchema);

    const result = await ordersService.getOrder(actor, req.scope!, params.id);
    res.status(200).json(result);
  }),
);

// BR-162: rebuild the cart from one of the caller's own past orders.
ordersRouter.post(
  '/:id/reorder',
  requireAuth,
  requirePermission('order.reorder_own'),
  validate({ params: orderIdParamSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const params = getValidated(req, 'params', orderIdParamSchema);

    const result = await ordersService.reorder(
      actor,
      req.scope!,
      params.id,
      req.header('idempotency-key'),
    );
    res.status(200).json(result);
  }),
);
