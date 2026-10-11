/**
 * Returns & Issues (RMA). See CLAUDE.md for the four-file module pattern.
 *
 * <name>.routes.ts is thin on purpose: wiring only.
 * Middleware order is FIXED and must not be shuffled:
 *
 *   requireAuth  ->  requirePermission  ->  validate  ->  asyncHandler(handler)
 *
 * Permission codes MUST exist in docs/rbac.json. requirePermission throws at
 * import time on a typo, so a bad code fails the build, not a request.
 *
 * Two routers, like farmer-applications/certifications/topup:
 *  - `returnRequestsRouter`  — customer-facing create, mounted at /v1/orders
 *  - `adminReturnsRouter`    — admin-facing queue, mounted at /v1/admin/returns
 */
import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { returnRequestsService } from './returnRequests.service.js';
import {
  createReturnRequestBody,
  inspectReturnBody,
  listReturnsQuery,
  orderIdParams,
  rejectReturnBody,
  returnIdParams,
} from './returnRequests.schema.js';

export const returnRequestsRouter: Router = Router();
export const adminReturnsRouter: Router = Router();

// ---------------------------------------------------------------------------
// Customer/admin: file a return against an order.
// ---------------------------------------------------------------------------
returnRequestsRouter.post(
  '/:orderId/returns',
  requireAuth,
  requirePermission('rma.request.process'),
  validate({ params: orderIdParams, body: createReturnRequestBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const { orderId } = getValidated(req, 'params', orderIdParams);
    const body = getValidated(req, 'body', createReturnRequestBody);

    const result = await returnRequestsService.createReturnRequest(actor, scope, orderId, body);
    res.status(201).json(result);
  }),
);

// ---------------------------------------------------------------------------
// Admin queue.
// ---------------------------------------------------------------------------
adminReturnsRouter.get(
  '/',
  requireAuth,
  requirePermission('rma.request.process'),
  validate({ query: listReturnsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listReturnsQuery);
    res.status(200).json(await returnRequestsService.list(scope, query));
  }),
);

adminReturnsRouter.get(
  '/:id',
  requireAuth,
  requirePermission('rma.request.process'),
  validate({ params: returnIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', returnIdParams);
    res.status(200).json(await returnRequestsService.getById(scope, id));
  }),
);

adminReturnsRouter.get(
  '/:id/history',
  requireAuth,
  requirePermission('rma.request.process'),
  validate({ params: returnIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', returnIdParams);
    res.status(200).json(await returnRequestsService.getHistory(scope, id));
  }),
);

adminReturnsRouter.post(
  '/:id/inspect',
  requireAuth,
  requirePermission('inventory.quality_check.perform'),
  validate({ params: returnIdParams, body: inspectReturnBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', returnIdParams);
    const body = getValidated(req, 'body', inspectReturnBody);
    res.status(200).json(await returnRequestsService.inspect(actor, scope, id, body));
  }),
);

adminReturnsRouter.post(
  '/:id/approve',
  requireAuth,
  requirePermission('rma.refund.approve'),
  validate({ params: returnIdParams }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', returnIdParams);
    res.status(200).json(await returnRequestsService.approve(actor, scope, id));
  }),
);

adminReturnsRouter.post(
  '/:id/reject',
  requireAuth,
  requirePermission('rma.refund.approve'),
  validate({ params: returnIdParams, body: rejectReturnBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', returnIdParams);
    const body = getValidated(req, 'body', rejectReturnBody);
    res.status(200).json(await returnRequestsService.reject(actor, scope, id, body));
  }),
);

adminReturnsRouter.post(
  '/:id/refund/wallet',
  requireAuth,
  requirePermission('rma.refund.wallet_process'),
  validate({ params: returnIdParams }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', returnIdParams);
    const idempotencyKey = req.header('idempotency-key');
    res.status(200).json(await returnRequestsService.refundWallet(actor, scope, id, idempotencyKey));
  }),
);

adminReturnsRouter.post(
  '/:id/refund/bank',
  requireAuth,
  requirePermission('rma.refund.bank_process'),
  validate({ params: returnIdParams }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', returnIdParams);
    const idempotencyKey = req.header('idempotency-key');
    res.status(200).json(await returnRequestsService.refundBank(actor, scope, id, idempotencyKey));
  }),
);
