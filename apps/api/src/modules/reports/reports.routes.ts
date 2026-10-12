/**
 * Reports (Module 12). See CLAUDE.md for the four-file module pattern.
 *
 * Wiring only, in the fixed order requireAuth -> requirePermission -> validate -> handler.
 * Every report is a GET: there is no write endpoint in this module.
 *
 * Permission codes are the existing ones in docs/rbac.json. There is no per-report code yet, so
 * each report is gated by the code of the data it summarises:
 *   sales        order.list.view_all
 *   receiving    inventory.goods_receipt.record   (nearest code; it is a write permission by name)
 *   inventory    inventory.batch.view
 *   returns      rma.request.process
 *   customers    customer.list.view
 *   cash-topups  wallet.cash_topup.process        (interim code)
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  cashTopupsQuery,
  customersQuery,
  inventoryQuery,
  receivingQuery,
  returnsQuery,
  salesQuery,
} from './reports.schema.js';
import { reportsService } from './reports.service.js';

export const reportsRouter: Router = Router();

reportsRouter.get(
  '/sales',
  requireAuth,
  requirePermission('order.list.view_all'),
  validate({ query: salesQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await reportsService.sales(scope, getValidated(req, 'query', salesQuery)));
  }),
);

reportsRouter.get(
  '/receiving',
  requireAuth,
  requirePermission('inventory.goods_receipt.record'),
  validate({ query: receivingQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await reportsService.receiving(scope, getValidated(req, 'query', receivingQuery)));
  }),
);

reportsRouter.get(
  '/inventory',
  requireAuth,
  requirePermission('inventory.batch.view'),
  validate({ query: inventoryQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await reportsService.inventory(scope, getValidated(req, 'query', inventoryQuery)));
  }),
);

reportsRouter.get(
  '/returns',
  requireAuth,
  requirePermission('rma.request.process'),
  validate({ query: returnsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await reportsService.returns(scope, getValidated(req, 'query', returnsQuery)));
  }),
);

reportsRouter.get(
  '/customers',
  requireAuth,
  requirePermission('customer.list.view'),
  validate({ query: customersQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await reportsService.customers(scope, getValidated(req, 'query', customersQuery)));
  }),
);

reportsRouter.get(
  '/cash-topups',
  requireAuth,
  requirePermission('wallet.cash_topup.process'),
  validate({ query: cashTopupsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await reportsService.cashTopups(scope, getValidated(req, 'query', cashTopupsQuery)));
  }),
);
