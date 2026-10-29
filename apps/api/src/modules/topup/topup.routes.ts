import { Router } from 'express';
import { parseMoney } from '@tohfa/shared-types';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  cashTopupCreateSchema,
  cashTopupCustomerLookupQuery,
  createTopupSchema,
  customerIdParamSchema,
} from './topup.schema.js';
import { topupService } from './topup.service.js';

export const topupRouter: Router = Router();
export const webhookRouter: Router = Router();
export const adminTopupRouter: Router = Router();

// GET /v1/admin/wallets/cash-topup/customers/lookup  (BR-91i, BR-92g)
// Its own route and permission rather than a mode of /admin/sales/customers/lookup: that one is
// gated by sales.sale.create, which Main does not hold, and keeps BR-91's visibility predicate.
adminTopupRouter.get(
  '/wallets/cash-topup/customers/lookup',
  requireAuth,
  requirePermission('wallet.cash_topup.process'),
  validate({ query: cashTopupCustomerLookupQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await topupService.lookupCashTopupCustomers(scope, getValidated(req, 'query', cashTopupCustomerLookupQuery)));
  }),
);

// BR-18e: a cash top-up always carries the fiscal cash tag (BR-18a), and recording it is what
// triggers the credit, so the caller needs BOTH codes: `wallet.cash_topup.fiscal_tag` ("Mark the
// fiscal cash tag that triggers the server-side wallet credit") and `wallet.cash_topup.process`.
// The fiscal-tag gate runs first; the process gate runs last so that `req.scope` is the process
// scope the service confines the warehouse with.
adminTopupRouter.post(
  '/wallets/:customerId/cash-topup',
  requireAuth,
  requirePermission('wallet.cash_topup.fiscal_tag'),
  requirePermission('wallet.cash_topup.process'),
  validate({
    params: customerIdParamSchema,
    body: cashTopupCreateSchema,
  }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const params = getValidated(req, 'params', customerIdParamSchema);
    const body = getValidated(req, 'body', cashTopupCreateSchema);
    const idempotencyKey = req.header('idempotency-key');

    const result = await topupService.processCashTopup(
      actor,
      req.scope!,
      params.customerId,
      {
        amount: parseMoney(body.amount),
        warehouseId: body.warehouseId,
        fiscalCashTag: body.fiscalCashTag,
        remarks: body.remarks,
      },
      idempotencyKey,
    );
    res.status(201).json(result);
  }),
);

topupRouter.post(
  '/me/topups',
  requireAuth,
  requirePermission('wallet.topup.digital'),
  validate({ body: createTopupSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', createTopupSchema);
    const idempotencyKey = req.header('idempotency-key');

    const result = await topupService.createTopup(
      actor,
      req.scope!,
      {
        amount: parseMoney(body.amount),
        mode: body.mode,
      },
      idempotencyKey,
    );
    res.status(201).json(result);
  }),
);

webhookRouter.post(
  '/razorpay',
  asyncHandler(async (req, res) => {
    const signature = req.header('x-razorpay-signature');
    const eventId = req.header('x-razorpay-event-id');

    // req.body is raw Buffer when raw parser is mounted
    const rawBody: Buffer | string = req.body;

    const result = await topupService.processRazorpayWebhook(
      rawBody,
      signature,
      eventId,
    );
    res.status(200).json(result);
  }),
);
