import { Router } from 'express';
import { z } from 'zod';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  adminOrderIdParams,
  adminOrdersQuerySchema,
  ordersSummaryQuerySchema,
  assignWarehouseSchema,
  packOrderSchema,
  dispatchOrderSchema,
  verifyOtpSchema,
  cancelOrderSchema,
  orderIssueSchema,
} from './fulfilment.schema.js';
import { fulfilmentService } from './fulfilment.service.js';

const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const adminFulfilmentRouter: Router = Router();

adminFulfilmentRouter.get(
  '/',
  requireAuth,
  requirePermission('order.list.view_all'),
  validate({ query: adminOrdersQuerySchema }),
  asyncHandler(async (req, res) => {
    // BR-101: scope only. CUSTOMER passes requirePermission here (`own`); its scope fails closed.
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', adminOrdersQuerySchema);
    res.status(200).json(await fulfilmentService.listAdminOrders(scope, query));
  }),
);

adminFulfilmentRouter.get(
  '/summary',
  requireAuth,
  requirePermission('order.list.view_all'),
  validate({ query: ordersSummaryQuerySchema }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', ordersSummaryQuerySchema);
    res.status(200).json(await fulfilmentService.getOrdersSummary(scope, query));
  }),
);

// BR-99: general admin order detail, any channel. GET only, so it cannot shadow the POST action
// routes below. Out of scope or unknown is the same 404 (BR-30); the scope predicate is in SQL.
adminFulfilmentRouter.get(
  '/:orderId',
  requireAuth,
  requirePermission('order.list.view_all'),
  validate({ params: adminOrderIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const params = getValidated(req, 'params', adminOrderIdParams);
    res.status(200).json(await fulfilmentService.getAdminOrderDetail(scope, params.orderId));
  }),
);

adminFulfilmentRouter.post(
  '/:id/assign-warehouse',
  requireAuth,
  requirePermission('order.warehouse.assign'),
  validate({ params: idParamSchema, body: assignWarehouseSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const params = getValidated(req, 'params', idParamSchema);
    const body = getValidated(req, 'body', assignWarehouseSchema);
    const result = await fulfilmentService.assignWarehouse(
      actor,
      req.scope!,
      params.id,
      body,
    );
    res.status(200).json(result);
  }),
);

adminFulfilmentRouter.post(
  '/:id/pack',
  requireAuth,
  requirePermission('order.mark_packed'),
  validate({ params: idParamSchema, body: packOrderSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const params = getValidated(req, 'params', idParamSchema);
    const body = getValidated(req, 'body', packOrderSchema);
    const result = await fulfilmentService.packOrder(
      actor,
      req.scope!,
      params.id,
      body,
      req.header('idempotency-key'),
    );
    res.status(200).json(result);
  }),
);

adminFulfilmentRouter.post(
  '/:id/dispatch',
  requireAuth,
  requirePermission('order.dispatch'),
  validate({ params: idParamSchema, body: dispatchOrderSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const params = getValidated(req, 'params', idParamSchema);
    const body = getValidated(req, 'body', dispatchOrderSchema);
    const result = await fulfilmentService.dispatchOrder(
      actor,
      req.scope!,
      params.id,
      body,
      req.header('idempotency-key'),
    );
    res.status(200).json(result);
  }),
);

adminFulfilmentRouter.post(
  '/:id/verify-otp',
  requireAuth,
  requirePermission('order.pickup_otp.verify'),
  validate({ params: idParamSchema, body: verifyOtpSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const params = getValidated(req, 'params', idParamSchema);
    const body = getValidated(req, 'body', verifyOtpSchema);
    const result = await fulfilmentService.verifyOtp(
      actor,
      req.scope!,
      params.id,
      body,
      req.header('idempotency-key'),
    );
    res.status(200).json(result);
  }),
);

adminFulfilmentRouter.post(
  '/:id/cancel',
  requireAuth,
  requirePermission('order.cancel'),
  validate({ params: idParamSchema, body: cancelOrderSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const params = getValidated(req, 'params', idParamSchema);
    const body = getValidated(req, 'body', cancelOrderSchema);
    const result = await fulfilmentService.cancelOrder(
      actor,
      req.scope!,
      params.id,
      body,
      req.header('idempotency-key'),
    );
    res.status(200).json(result);
  }),
);

adminFulfilmentRouter.post(
  '/:id/issues',
  requireAuth,
  requirePermission('warehouse.issue.manage'),
  validate({ params: idParamSchema, body: orderIssueSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const params = getValidated(req, 'params', idParamSchema);
    const body = getValidated(req, 'body', orderIssueSchema);
    const result = await fulfilmentService.createOrderIssue(
      actor,
      req.scope!,
      params.id,
      body,
      req.header('idempotency-key'),
    );
    res.status(201).json(result);
  }),
);

adminFulfilmentRouter.get(
  '/:id/stock-check',
  requireAuth,
  requirePermission('order.list.view_all'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const params = getValidated(req, 'params', idParamSchema);
    const result = await fulfilmentService.checkStock(
      req.scope!,
      params.id,
    );
    res.status(200).json(result);
  }),
);

export const orderTrackingRouter: Router = Router();

orderTrackingRouter.get(
  '/:id/tracking',
  requireAuth,
  requirePermission('order.view_own'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const params = getValidated(req, 'params', idParamSchema);
    const result = await fulfilmentService.getOrderTracking(
      actor,
      req.scope!,
      params.id,
    );
    res.status(200).json(result);
  }),
);

orderTrackingRouter.get(
  '/:id/events',
  requireAuth,
  requirePermission('order.view_own'),
  validate({ params: idParamSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const params = getValidated(req, 'params', idParamSchema);
    await fulfilmentService.streamOrderEvents(
      actor,
      req.scope!,
      params.id,
      req,
      res,
    );
  }),
);
