/**
 * workforce.routes — wiring only.
 *
 * One router, mounted at /v1/farms alongside farmsRouter/soilRouter/
 * pestRouter. Unlike pest there is no global reference content, so there is
 * no second router: every path is farm-scoped and every route carries the
 * single `own`-scoped permission `farmer.workforce.manage_own`
 * (docs/rbac.json). Farm/worker ownership (404, never 403) is enforced in
 * workforce.service.ts, not here.
 *
 * Middleware order is fixed: requireAuth -> requirePermission -> validate ->
 * asyncHandler(handler). No SQL, no ownership checks, no business rules here.
 * The payout route reads the `Idempotency-Key` header and passes it through
 * untouched; the service validates it (root CLAUDE.md §2.4).
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { workforceService } from './workforce.service.js';
import {
  attendanceForDateQuery,
  createAdvanceBody,
  createPayoutBody,
  createWorkerBody,
  cropHoursSummaryQuery,
  farmOnlyParams,
  payrollSummaryQuery,
  updateWorkerBody,
  upsertAttendanceBody,
  workerAttendanceQuery,
  workerIdParams,
} from './workforce.schema.js';

const MANAGE_OWN = 'farmer.workforce.manage_own';

export const workforceRouter: Router = Router();

// ---------------------------------------------------------------------------
// workers
// ---------------------------------------------------------------------------

workforceRouter.get(
  '/:farmId/workers',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmOnlyParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId } = getValidated(req, 'params', farmOnlyParams);
    const items = await workforceService.listWorkers(scope, farmId);
    res.json({ items });
  }),
);

workforceRouter.post(
  '/:farmId/workers',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmOnlyParams, body: createWorkerBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId } = getValidated(req, 'params', farmOnlyParams);
    const body = getValidated(req, 'body', createWorkerBody);
    const worker = await workforceService.createWorker(scope, farmId, body);
    res.status(201).json(worker);
  }),
);

workforceRouter.get(
  '/:farmId/workers/:workerId',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: workerIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, workerId } = getValidated(req, 'params', workerIdParams);
    const worker = await workforceService.getWorker(scope, farmId, workerId);
    res.json(worker);
  }),
);

workforceRouter.patch(
  '/:farmId/workers/:workerId',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: workerIdParams, body: updateWorkerBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, workerId } = getValidated(req, 'params', workerIdParams);
    const body = getValidated(req, 'body', updateWorkerBody);
    const worker = await workforceService.updateWorker(scope, farmId, workerId, body);
    res.json(worker);
  }),
);

workforceRouter.delete(
  '/:farmId/workers/:workerId',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: workerIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, workerId } = getValidated(req, 'params', workerIdParams);
    await workforceService.deleteWorker(scope, farmId, workerId);
    res.status(204).end();
  }),
);

// ---------------------------------------------------------------------------
// attendance
// ---------------------------------------------------------------------------

workforceRouter.get(
  '/:farmId/attendance',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmOnlyParams, query: attendanceForDateQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId } = getValidated(req, 'params', farmOnlyParams);
    const { date } = getValidated(req, 'query', attendanceForDateQuery);
    const items = await workforceService.listAttendanceForDate(scope, farmId, date);
    res.json({ items });
  }),
);

workforceRouter.post(
  '/:farmId/attendance',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmOnlyParams, body: upsertAttendanceBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId } = getValidated(req, 'params', farmOnlyParams);
    const body = getValidated(req, 'body', upsertAttendanceBody);
    const items = await workforceService.upsertAttendance(scope, farmId, body);
    res.json({ items });
  }),
);

workforceRouter.get(
  '/:farmId/workers/:workerId/attendance',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: workerIdParams, query: workerAttendanceQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, workerId } = getValidated(req, 'params', workerIdParams);
    const query = getValidated(req, 'query', workerAttendanceQuery);
    const items = await workforceService.listWorkerAttendance(scope, farmId, workerId, query);
    res.json({ items });
  }),
);

// ---------------------------------------------------------------------------
// advances
// ---------------------------------------------------------------------------

workforceRouter.get(
  '/:farmId/workers/:workerId/advances',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: workerIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, workerId } = getValidated(req, 'params', workerIdParams);
    const items = await workforceService.listAdvances(scope, farmId, workerId);
    res.json({ items });
  }),
);

workforceRouter.post(
  '/:farmId/workers/:workerId/advances',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: workerIdParams, body: createAdvanceBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, workerId } = getValidated(req, 'params', workerIdParams);
    const body = getValidated(req, 'body', createAdvanceBody);
    const advance = await workforceService.createAdvance(scope, farmId, workerId, body);
    res.status(201).json(advance);
  }),
);

// ---------------------------------------------------------------------------
// payouts
// ---------------------------------------------------------------------------

workforceRouter.get(
  '/:farmId/workers/:workerId/payouts',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: workerIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, workerId } = getValidated(req, 'params', workerIdParams);
    const items = await workforceService.listPayouts(scope, farmId, workerId);
    res.json({ items });
  }),
);

workforceRouter.post(
  '/:farmId/workers/:workerId/payouts',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: workerIdParams, body: createPayoutBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, workerId } = getValidated(req, 'params', workerIdParams);
    const body = getValidated(req, 'body', createPayoutBody);
    const payout = await workforceService.createPayout(
      scope,
      farmId,
      workerId,
      body,
      req.header('idempotency-key'),
    );
    res.status(201).json(payout);
  }),
);

// ---------------------------------------------------------------------------
// read-only aggregates
// ---------------------------------------------------------------------------

workforceRouter.get(
  '/:farmId/workforce/summary',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmOnlyParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId } = getValidated(req, 'params', farmOnlyParams);
    const summary = await workforceService.getSummary(scope, farmId);
    res.json(summary);
  }),
);

workforceRouter.get(
  '/:farmId/workforce/payroll-summary',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmOnlyParams, query: payrollSummaryQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId } = getValidated(req, 'params', farmOnlyParams);
    const { period } = getValidated(req, 'query', payrollSummaryQuery);
    const items = await workforceService.getPayrollSummary(scope, farmId, period);
    res.json({ items });
  }),
);

workforceRouter.get(
  '/:farmId/workforce/crop-hours-summary',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmOnlyParams, query: cropHoursSummaryQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId } = getValidated(req, 'params', farmOnlyParams);
    const { farmCropId } = getValidated(req, 'query', cropHoursSummaryQuery);
    const summary = await workforceService.getCropHoursSummary(scope, farmId, farmCropId);
    res.json(summary);
  }),
);
