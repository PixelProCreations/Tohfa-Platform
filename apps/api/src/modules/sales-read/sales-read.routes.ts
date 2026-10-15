/**
 * SWA Module 6 (Direct / Market sales), READ routes. Mount at `/v1/admin/sales`.
 *
 * Wiring only: requireAuth -> requirePermission -> validate -> handler. The codes are the
 * `x-permission` values in docs/openapi.yaml and exist in docs/rbac.json (requirePermission throws
 * at import time on a typo).
 *
 * ROUTE ORDER MATTERS: the fixed paths (`/summary`, `/market-day`, `/horeca`, `/b2b`) are declared
 * BEFORE `/:saleId`, so a fixed path is never read as a sale id (defence in depth: the detail route
 * also skips any segment that is not UUID-shaped, see below).
 *
 * `/horeca` and `/b2b` are read-only by construction (BR-85h): only GET is declared, so any other
 * verb falls through to the 404 handler. The sales WRITE routes (`POST /`, `/quote`, `/products`,
 * `/customers/lookup`, `/{saleId}/payments/upi/confirm`) live in apps/api/src/modules/sales/.
 */
import { Router, type RequestHandler } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { salesReadService } from './sales-read.service.js';
import {
  channelOrdersQuery,
  listSalesQuery,
  marketDayQuery,
  saleIdParams,
  salesSummaryQuery,
} from './sales-read.schema.js';

export const salesReadRouter: Router = Router();

salesReadRouter.get(
  '/summary',
  requireAuth,
  requirePermission('sales.dashboard.view'),
  validate({ query: salesSummaryQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await salesReadService.summary(scope, getValidated(req, 'query', salesSummaryQuery)));
  }),
);

salesReadRouter.get(
  '/market-day',
  requireAuth,
  requirePermission('sales.market_day.view'),
  validate({ query: marketDayQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await salesReadService.marketDay(scope, getValidated(req, 'query', marketDayQuery)));
  }),
);

salesReadRouter.get(
  '/horeca',
  requireAuth,
  requirePermission('sales.horeca.view'),
  validate({ query: channelOrdersQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await salesReadService.listChannel(scope, 'HORECA', getValidated(req, 'query', channelOrdersQuery)));
  }),
);

salesReadRouter.get(
  '/b2b',
  requireAuth,
  requirePermission('sales.b2b.view'),
  validate({ query: channelOrdersQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await salesReadService.listChannel(scope, 'B2B', getValidated(req, 'query', channelOrdersQuery)));
  }),
);

salesReadRouter.get(
  '/',
  requireAuth,
  requirePermission('sales.history.view'),
  validate({ query: listSalesQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await salesReadService.list(scope, getValidated(req, 'query', listSalesQuery)));
  }),
);

/**
 * Only a UUID-shaped segment is a sale id. Anything else skips this route (`next('route')`), so this
 * router never swallows a fixed GET path of the sales WRITE router mounted on the same prefix
 * (`/products`, `/customers/lookup`), whichever order app.ts mounts the two in; an unmatched path
 * then ends in the app's 404. Done as a guard rather than an Express regex param because
 * src/contract/contract.test.ts maps `:param` to `{param}` textually. A 36-character non-UUID still
 * reaches `validate` (422).
 */
const onlySaleIdShaped: RequestHandler = (req, _res, next) => {
  if (/^[0-9a-fA-F-]{36}$/.test(req.params['saleId'] ?? '')) next();
  else next('route');
};

salesReadRouter.get(
  '/:saleId',
  onlySaleIdShaped,
  requireAuth,
  requirePermission('sales.history.view'),
  validate({ params: saleIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { saleId } = getValidated(req, 'params', saleIdParams);
    res.json(await salesReadService.get(scope, saleId));
  }),
);
