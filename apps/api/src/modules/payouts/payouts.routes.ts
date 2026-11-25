import { Router } from 'express';
import { z } from 'zod';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import {
  payoutDuesQuerySchema,
  createPayoutSchema,
  approvePayoutSchema,
  exportPayoutsQuerySchema,
  listPayoutsQuerySchema,
  payoutIdParamSchema,
} from './payouts.schema.js';
import { payoutsService } from './payouts.service.js';

const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const payoutDuesRouter: Router = Router();
export const payoutsRouter: Router = Router();

// ---------------------------------------------------------------------------
// GET /admin/payout-dues
// ---------------------------------------------------------------------------

payoutDuesRouter.get(
  '/',
  requireAuth,
  requirePermission('payout.dues.view'),
  validate({ query: payoutDuesQuerySchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const query = getValidated(req, 'query', payoutDuesQuerySchema);
    const result = await payoutsService.listPayoutDues(actor, req.scope!, query);
    res.status(200).json(result);
  }),
);

// ---------------------------------------------------------------------------
// GET /admin/payouts/export
// ---------------------------------------------------------------------------

payoutsRouter.get(
  '/export',
  requireAuth,
  requirePermission('report.export.file'),
  validate({ query: exportPayoutsQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = getValidated(req, 'query', exportPayoutsQuerySchema);
    const result = await payoutsService.exportPayouts(req.scope!, query);
    res
      .status(200)
      .set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      })
      .send(result.csv);
  }),
);

// ---------------------------------------------------------------------------
// GET /admin/payouts (list)
// ---------------------------------------------------------------------------

payoutsRouter.get(
  '/',
  requireAuth,
  requirePermission('payout.view'),
  validate({ query: listPayoutsQuerySchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const query = getValidated(req, 'query', listPayoutsQuerySchema);
    const result = await payoutsService.listPayouts(actor, req.scope!, query);
    res.status(200).json(result);
  }),
);

// ---------------------------------------------------------------------------
// GET /admin/payouts/{id} (detail)
// ---------------------------------------------------------------------------

payoutsRouter.get(
  '/:id',
  requireAuth,
  requirePermission('payout.view'),
  validate({ params: payoutIdParamSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', payoutIdParamSchema);
    const result = await payoutsService.getPayoutById(actor, req.scope!, id);
    res.status(200).json(result);
  }),
);

// ---------------------------------------------------------------------------
// POST /admin/payouts
// ---------------------------------------------------------------------------

payoutsRouter.post(
  '/',
  requireAuth,
  requirePermission('payout.farmer.initiate'),
  validate({ body: createPayoutSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', createPayoutSchema);
    const idempotencyKey = req.header('idempotency-key');

    const result = await payoutsService.createPayout(
      actor,
      req.scope!,
      body,
      idempotencyKey,
    );
    res.status(201).json(result);
  }),
);

// ---------------------------------------------------------------------------
// POST /admin/payouts/{id}/approve
// ---------------------------------------------------------------------------

payoutsRouter.post(
  '/:id/approve',
  requireAuth,
  requirePermission('payout.approve_above_10k'),
  validate({ params: idParamSchema, body: approvePayoutSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const params = getValidated(req, 'params', idParamSchema);
    const body = getValidated(req, 'body', approvePayoutSchema);
    const idempotencyKey = req.header('idempotency-key');

    const result = await payoutsService.approvePayout(
      actor,
      req.scope!,
      params.id,
      body,
      idempotencyKey,
    );
    res.status(200).json(result);
  }),
);
