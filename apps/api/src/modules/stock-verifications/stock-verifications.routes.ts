/**
 * BR-106: physical stock verification. Wiring only: requireAuth -> requirePermission -> validate ->
 * handler. Mounted by app.ts at /v1/admin/stock-verifications.
 *
 *  - record, list, detail: `inventory.stock_verification.perform` (Sub admin `own`, the rest `all`).
 *    Reads reuse the perform code because rbac.json has no separate view code; the service confines
 *    a Sub admin to its warehouse.
 *  - raise an adjustment for the variance: `inventory.stock_adjustment.create`, because what it
 *    creates is a stock adjustment (BR-37); approving it still needs someone else.
 * Record and raise require an Idempotency-Key; the service enforces it before any write.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  createVerificationBody,
  listVerificationsQuery,
  raiseAdjustmentBody,
  verificationIdParams,
} from './stock-verifications.schema.js';
import { stockVerificationsService, type StockVerificationsService } from './stock-verifications.service.js';

export function createStockVerificationsRouter(service: StockVerificationsService = stockVerificationsService): Router {
  const router: Router = Router();

  router.get(
    '/',
    requireAuth,
    requirePermission('inventory.stock_verification.perform'),
    validate({ query: listVerificationsQuery }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const query = getValidated(req, 'query', listVerificationsQuery);
      res.json(await service.list(scope, query));
    }),
  );

  router.post(
    '/',
    requireAuth,
    requirePermission('inventory.stock_verification.perform'),
    validate({ body: createVerificationBody }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const body = getValidated(req, 'body', createVerificationBody);
      const { verification } = await service.create(scope, req.header('idempotency-key'), body);
      res.status(201).json(verification);
    }),
  );

  router.get(
    '/:id',
    requireAuth,
    requirePermission('inventory.stock_verification.perform'),
    validate({ params: verificationIdParams }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const { id } = getValidated(req, 'params', verificationIdParams);
      res.json(await service.get(scope, id));
    }),
  );

  router.post(
    '/:id/adjustment',
    requireAuth,
    requirePermission('inventory.stock_adjustment.create'),
    validate({ params: verificationIdParams, body: raiseAdjustmentBody }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const { id } = getValidated(req, 'params', verificationIdParams);
      const body = getValidated(req, 'body', raiseAdjustmentBody);
      res.status(201).json(await service.raiseAdjustment(scope, id, req.header('idempotency-key'), body));
    }),
  );

  return router;
}

export const stockVerificationsRouter: Router = createStockVerificationsRouter();
