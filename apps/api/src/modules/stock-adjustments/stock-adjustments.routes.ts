/**
 * BR-37: manual stock adjustments. Wiring only: requireAuth -> requirePermission -> validate ->
 * handler. Mounted by app.ts at /v1/admin/stock-adjustments.
 *
 *  - create, list, detail: `inventory.stock_adjustment.create` (Sub admin `own`, the rest `all`).
 *    Reads reuse the create code because rbac.json has no separate view code: everyone who may
 *    raise or decide an adjustment holds it, and the service confines a Sub admin to its warehouse.
 *  - approve, reject: `inventory.stock_adjustment.approve` (Super Admin, TOHFA Admin, Main; a Sub
 *    admin holds `none`, BR-37a). The service additionally refuses the adjustment's own creator.
 * Create and approve require an Idempotency-Key; the service enforces it before any write.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  adjustmentIdParams,
  createAdjustmentBody,
  listAdjustmentsQuery,
  rejectAdjustmentBody,
} from './stock-adjustments.schema.js';
import { stockAdjustmentsService, type StockAdjustmentsService } from './stock-adjustments.service.js';

export function createStockAdjustmentsRouter(service: StockAdjustmentsService = stockAdjustmentsService): Router {
  const router: Router = Router();

  router.get(
    '/',
    requireAuth,
    requirePermission('inventory.stock_adjustment.create'),
    validate({ query: listAdjustmentsQuery }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const query = getValidated(req, 'query', listAdjustmentsQuery);
      res.json(await service.list(scope, query));
    }),
  );

  router.post(
    '/',
    requireAuth,
    requirePermission('inventory.stock_adjustment.create'),
    validate({ body: createAdjustmentBody }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const body = getValidated(req, 'body', createAdjustmentBody);
      const { adjustment } = await service.create(scope, req.header('idempotency-key'), body);
      // A replay returns the original 201 response (docs/openapi.yaml IdempotencyKeyHeader).
      res.status(201).json(adjustment);
    }),
  );

  router.get(
    '/:id',
    requireAuth,
    requirePermission('inventory.stock_adjustment.create'),
    validate({ params: adjustmentIdParams }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const { id } = getValidated(req, 'params', adjustmentIdParams);
      res.json(await service.get(scope, id));
    }),
  );

  router.post(
    '/:id/approve',
    requireAuth,
    requirePermission('inventory.stock_adjustment.approve'),
    validate({ params: adjustmentIdParams }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const { id } = getValidated(req, 'params', adjustmentIdParams);
      res.json(await service.approve(scope, id, req.header('idempotency-key')));
    }),
  );

  router.post(
    '/:id/reject',
    requireAuth,
    requirePermission('inventory.stock_adjustment.approve'),
    validate({ params: adjustmentIdParams, body: rejectAdjustmentBody }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const { id } = getValidated(req, 'params', adjustmentIdParams);
      const body = getValidated(req, 'body', rejectAdjustmentBody);
      res.json(await service.reject(scope, id, body));
    }),
  );

  return router;
}

export const stockAdjustmentsRouter: Router = createStockAdjustmentsRouter();
