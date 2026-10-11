/**
 * SWA Module 6 (Direct / Market sales), write side. Mount at `/v1/admin/sales`.
 *
 *   requireAuth -> requirePermission -> validate -> asyncHandler(handler)
 *
 * Read routes of the same path prefix (GET /, /{saleId}, /summary, /market-day, /horeca, /b2b) live in
 * modules/sales-read. Declare THIS router's literal paths (/products, /customers/lookup, /quote)
 * before any `/:saleId` route if the two routers are ever merged.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope, resolveScope } from '../../rbac/requirePermission.js';
import { salesService } from './sales.service.js';
import {
  customerLookupQuery,
  listSaleProductsQuery,
  saleCreateBody,
  saleIdParams,
  saleQuoteBody,
  saleUpiConfirmBody,
} from './sales.schema.js';

export const salesRouter: Router = Router();

// GET /v1/admin/sales/products  (BR-95, BR-90)
salesRouter.get(
  '/products',
  requireAuth,
  requirePermission('sales.sale.create'),
  validate({ query: listSaleProductsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await salesService.listProducts(scope, getValidated(req, 'query', listSaleProductsQuery)));
  }),
);

// GET /v1/admin/sales/customers/lookup  (BR-91, BR-92g)
salesRouter.get(
  '/customers/lookup',
  requireAuth,
  requirePermission('sales.sale.create'),
  validate({ query: customerLookupQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await salesService.lookupCustomers(scope, getValidated(req, 'query', customerLookupQuery)));
  }),
);

// POST /v1/admin/sales/quote  (BR-89, BR-98; writes nothing)
salesRouter.post(
  '/quote',
  requireAuth,
  requirePermission('sales.sale.create'),
  validate({ body: saleQuoteBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await salesService.quote(scope, getValidated(req, 'body', saleQuoteBody)));
  }),
);

// POST /v1/admin/sales  (BR-85..BR-89, BR-94, BR-95; Idempotency-Key required)
salesRouter.post(
  '/',
  requireAuth,
  requirePermission('sales.sale.create'),
  validate({ body: saleCreateBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    // BR-85g: payment.record is resolved here and ENFORCED in the service, before any write.
    const paymentScope = req.actor === undefined ? null : resolveScope(req.actor, 'payment.record');
    const body = getValidated(req, 'body', saleCreateBody);
    const { sale } = await salesService.create(scope, paymentScope, req.header('idempotency-key'), body);
    // docs/openapi.yaml: a replay returns the original 201 response.
    res.status(201).json(sale);
  }),
);

// POST /v1/admin/sales/:saleId/payments/upi/confirm  (BR-94, BR-88g; Idempotency-Key required)
salesRouter.post(
  '/:saleId/payments/upi/confirm',
  requireAuth,
  requirePermission('payment.record'),
  validate({ params: saleIdParams, body: saleUpiConfirmBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { saleId } = getValidated(req, 'params', saleIdParams);
    const body = getValidated(req, 'body', saleUpiConfirmBody);
    res.json(await salesService.confirmUpi(scope, saleId, req.header('idempotency-key'), body));
  }),
);
