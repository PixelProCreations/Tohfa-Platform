/**
 * Audit Management routes. Middleware order is FIXED:
 * requireAuth -> requirePermission -> validate -> asyncHandler(handler).
 *
 * ROUTE ORDER MATTERS: `/compliance` and `/bulk-reschedule` are registered
 * before `/:id`, otherwise Express would hand "compliance" to the `:id` route.
 *
 * REPORT DOWNLOADS carry two permissions. `audit.report.generate` is the
 * spec's x-permission; `audit.view` is chained after it so `req.scope` is the
 * VIEW scope and the report is visible under exactly the same rules as
 * `GET /admin/audits/{id}` (the spec says "Same scope rules"). That is what
 * zone-limits a Farmer Admin, whose `audit.report.generate` grant is `all`
 * (orchestrator decision 2026-10-01), and what makes a farmer calling the
 * admin report path get 404. Every role that holds one code holds the other
 * today, so chaining refuses nobody who was previously allowed.
 *
 * The one request that skips requireAuth is a report download carrying a
 * signed `token` minted by `redirect=true` (same HMAC scheme as
 * `/invoices/{id}/download`): a browser following a 302 cannot send a bearer
 * header. The token is only minted after the full scope check above, binds
 * audit id + variant + audience, and expires after 5 minutes.
 */
import { Router, type RequestHandler, type Response } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  auditBulkRescheduleBody,
  auditCancelBody,
  auditClearRedFlagBody,
  auditCompleteBody,
  auditCreateBody,
  auditFindingCreateBody,
  auditFindingParams,
  auditFindingUpdateBody,
  auditIdParams,
  auditRedFlagBody,
  auditScoresBody,
  auditStartBody,
  auditUpdateBody,
  complianceQuery,
  listAuditsQuery,
  listMyAuditsQuery,
  reportQuery,
} from './audits.schema.js';
import { auditsService, type ReportAudience, type ReportResult } from './audits.service.js';

function sendReport(res: Response, result: ReportResult): void {
  if (result.kind === 'redirect') {
    res.redirect(302, result.url);
    return;
  }
  res.setHeader('Content-Type', result.contentType);
  res.setHeader('Content-Disposition', `inline; filename="${result.fileName}"`);
  res.send(result.body);
}

/** Serves a signed-link request; anything without `token` falls through to auth. */
function signedReport(audience: ReportAudience): RequestHandler[] {
  return [
    (req, _res, next) => {
      if (typeof req.query['token'] !== 'string') {
        next('route');
        return;
      }
      next();
    },
    validate({ params: auditIdParams, query: reportQuery }),
    asyncHandler(async (req, res) => {
      const { id } = getValidated(req, 'params', auditIdParams);
      const query = getValidated(req, 'query', reportQuery);
      sendReport(res, await auditsService.getSignedReport(audience, id, query));
    }),
  ];
}

/** Mounted at /v1/admin/audits */
export const adminAuditsRouter: Router = Router();

// GET /v1/admin/audits — calendar / list (zone-scoped for a Farmer Admin)
adminAuditsRouter.get(
  '/',
  requireAuth,
  requirePermission('audit.view'),
  validate({ query: listAuditsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await auditsService.list(scope, getValidated(req, 'query', listAuditsQuery)));
  }),
);

// POST /v1/admin/audits — schedule (BR-03a)
adminAuditsRouter.post(
  '/',
  requireAuth,
  requirePermission('audit.schedule'),
  validate({ body: auditCreateBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.status(201).json(await auditsService.schedule(scope, getValidated(req, 'body', auditCreateBody)));
  }),
);

// GET /v1/admin/audits/compliance — BR-03b summary (before /:id)
adminAuditsRouter.get(
  '/compliance',
  requireAuth,
  requirePermission('audit.view'),
  validate({ query: complianceQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await auditsService.compliance(scope, getValidated(req, 'query', complianceQuery)));
  }),
);

// POST /v1/admin/audits/bulk-reschedule — per-item outcome (before /:id)
adminAuditsRouter.post(
  '/bulk-reschedule',
  requireAuth,
  requirePermission('audit.schedule'),
  validate({ body: auditBulkRescheduleBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await auditsService.bulkReschedule(scope, getValidated(req, 'body', auditBulkRescheduleBody)));
  }),
);

// GET /v1/admin/audits/:id
adminAuditsRouter.get(
  '/:id',
  requireAuth,
  requirePermission('audit.view'),
  validate({ params: auditIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', auditIdParams);
    res.json(await auditsService.get(scope, id));
  }),
);

// PATCH /v1/admin/audits/:id — reschedule / reassign (SCHEDULED only)
adminAuditsRouter.patch(
  '/:id',
  requireAuth,
  requirePermission('audit.schedule'),
  validate({ params: auditIdParams, body: auditUpdateBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', auditIdParams);
    res.json(await auditsService.update(scope, id, getValidated(req, 'body', auditUpdateBody)));
  }),
);

// POST /v1/admin/audits/:id/cancel
adminAuditsRouter.post(
  '/:id/cancel',
  requireAuth,
  requirePermission('audit.schedule'),
  validate({ params: auditIdParams, body: auditCancelBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', auditIdParams);
    res.json(await auditsService.cancel(scope, id, getValidated(req, 'body', auditCancelBody)));
  }),
);

// POST /v1/admin/audits/:id/start
adminAuditsRouter.post(
  '/:id/start',
  requireAuth,
  requirePermission('audit.conduct'),
  validate({ params: auditIdParams, body: auditStartBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', auditIdParams);
    res.json(await auditsService.start(scope, id, getValidated(req, 'body', auditStartBody)));
  }),
);

// PUT /v1/admin/audits/:id/scores
adminAuditsRouter.put(
  '/:id/scores',
  requireAuth,
  requirePermission('audit.score.categories'),
  validate({ params: auditIdParams, body: auditScoresBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', auditIdParams);
    res.json(await auditsService.setScores(scope, id, getValidated(req, 'body', auditScoresBody)));
  }),
);

// POST /v1/admin/audits/:id/findings
adminAuditsRouter.post(
  '/:id/findings',
  requireAuth,
  requirePermission('audit.findings.log'),
  validate({ params: auditIdParams, body: auditFindingCreateBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', auditIdParams);
    res
      .status(201)
      .json(await auditsService.createFinding(scope, id, getValidated(req, 'body', auditFindingCreateBody)));
  }),
);

// PATCH /v1/admin/audits/:id/findings/:findingId
adminAuditsRouter.patch(
  '/:id/findings/:findingId',
  requireAuth,
  requirePermission('audit.findings.log'),
  validate({ params: auditFindingParams, body: auditFindingUpdateBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id, findingId } = getValidated(req, 'params', auditFindingParams);
    res.json(
      await auditsService.updateFinding(scope, id, findingId, getValidated(req, 'body', auditFindingUpdateBody)),
    );
  }),
);

// POST /v1/admin/audits/:id/complete
adminAuditsRouter.post(
  '/:id/complete',
  requireAuth,
  requirePermission('audit.conduct'),
  validate({ params: auditIdParams, body: auditCompleteBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', auditIdParams);
    res.json(await auditsService.complete(scope, id, getValidated(req, 'body', auditCompleteBody)));
  }),
);

// POST /v1/admin/audits/:id/red-flag — BR-05b, the only way red_flagged becomes true
adminAuditsRouter.post(
  '/:id/red-flag',
  requireAuth,
  requirePermission('audit.red_flag.manage'),
  validate({ params: auditIdParams, body: auditRedFlagBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', auditIdParams);
    res.json(await auditsService.redFlag(scope, id, getValidated(req, 'body', auditRedFlagBody)));
  }),
);

// POST /v1/admin/audits/:id/clear-red-flag
adminAuditsRouter.post(
  '/:id/clear-red-flag',
  requireAuth,
  requirePermission('audit.red_flag.manage'),
  validate({ params: auditIdParams, body: auditClearRedFlagBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', auditIdParams);
    res.json(await auditsService.clearRedFlag(scope, id, getValidated(req, 'body', auditClearRedFlagBody)));
  }),
);

// GET /v1/admin/audits/:id/report — signed-link short-circuit first, then auth
adminAuditsRouter.get('/:id/report', ...signedReport('admin'));
adminAuditsRouter.get(
  '/:id/report',
  requireAuth,
  requirePermission('audit.report.generate'),
  requirePermission('audit.view'),
  validate({ params: auditIdParams, query: reportQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', auditIdParams);
    sendReport(res, await auditsService.getReport(scope, id, getValidated(req, 'query', reportQuery)));
  }),
);

/** Mounted at /v1/farmers/me/audits — the caller's own audits only (BR-36). */
export const farmerAuditsRouter: Router = Router();

// GET /v1/farmers/me/audits
farmerAuditsRouter.get(
  '/',
  requireAuth,
  requirePermission('audit.view'),
  validate({ query: listMyAuditsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await auditsService.listMine(scope, getValidated(req, 'query', listMyAuditsQuery)));
  }),
);

// GET /v1/farmers/me/audits/:id
farmerAuditsRouter.get(
  '/:id',
  requireAuth,
  requirePermission('audit.view'),
  validate({ params: auditIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', auditIdParams);
    res.json(await auditsService.getMine(scope, id));
  }),
);

// GET /v1/farmers/me/audits/:id/report — own COMPLETED audits only
farmerAuditsRouter.get('/:id/report', ...signedReport('farmer'));
farmerAuditsRouter.get(
  '/:id/report',
  requireAuth,
  requirePermission('audit.report.generate'),
  requirePermission('audit.view'),
  validate({ params: auditIdParams, query: reportQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', auditIdParams);
    sendReport(res, await auditsService.getMyReport(scope, id, getValidated(req, 'query', reportQuery)));
  }),
);
