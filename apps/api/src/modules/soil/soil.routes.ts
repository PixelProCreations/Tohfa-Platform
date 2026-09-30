/**
 * soil.routes — wiring only.
 *
 * One permission, `farmer.soil.manage_own`, covers every route here — same
 * one-permission-covers-several-tables pattern `farmer.farm.manage_own` uses
 * for farms + plots (see docs/rbac.json, soil.service.ts).
 *
 * Middleware order is fixed: requireAuth -> requirePermission -> validate ->
 * asyncHandler(handler). No SQL, no ownership checks, no business rules here
 * — those live in soil.service.ts.
 *
 * `GET .../soil-tests/health-summary` is registered BEFORE
 * `GET .../soil-tests/:testId` on purpose: Express matches route patterns in
 * registration order, and `:testId` would otherwise swallow the literal
 * "health-summary" segment before the `testId` uuid validation ever gets a
 * chance to reject it as a 422.
 */
import { Router } from 'express';
import { optionalAuth, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { soilService } from './soil.service.js';
import {
  createCoverCropWindowBody,
  createErosionNoteBody,
  createSoilAmendmentBody,
  createSoilMoistureBody,
  createSoilTestBody,
  exportSoilReportQuery,
  farmOnlyParams,
  farmPlotParams,
  putCropRotationBody,
  soilAmendmentIdParams,
  soilHealthSummaryQuery,
  soilTestIdParams,
  updateSoilAmendmentBody,
} from './soil.schema.js';

export const soilRouter: Router = Router();

const MANAGE_OWN = 'farmer.soil.manage_own';

// ---------------------------------------------------------------------------
// Soil Report PDF Export (FR-F06)
// ---------------------------------------------------------------------------

soilRouter.get(
  '/:farmId/soil-reports/download-link',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmOnlyParams, query: exportSoilReportQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId } = getValidated(req, 'params', farmOnlyParams);
    const query = getValidated(req, 'query', exportSoilReportQuery);
    const link = await soilService.getSoilReportDownloadLink(scope, farmId, query);
    res.json(link);
  }),
);

soilRouter.get(
  '/:farmId/soil-reports/export',
  optionalAuth,
  validate({ params: farmOnlyParams, query: exportSoilReportQuery }),
  asyncHandler(async (req, res) => {
    const { farmId } = getValidated(req, 'params', farmOnlyParams);
    const query = getValidated(req, 'query', exportSoilReportQuery);

    if (query.redirect) {
      const scope = requireScope(req.scope);
      const link = await soilService.getSoilReportDownloadLink(scope, farmId, query);
      return res.redirect(302, link.downloadUrl);
    }

    const scope = req.scope ? requireScope(req.scope) : undefined;
    const pdfBuffer = await soilService.exportSoilReportPdf(scope, farmId, query);

    const periodSlug = query.period.replace(/\s+/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Soil_Health_Report_${periodSlug}.pdf"`);
    res.send(pdfBuffer);
  }),
);

// ---------------------------------------------------------------------------
// soil_test_records
// ---------------------------------------------------------------------------

soilRouter.get(
  '/:farmId/plots/:plotId/soil-tests',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmPlotParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId } = getValidated(req, 'params', farmPlotParams);
    const items = await soilService.listSoilTests(scope, farmId, plotId);
    res.json({ items });
  }),
);

soilRouter.post(
  '/:farmId/plots/:plotId/soil-tests',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmPlotParams, body: createSoilTestBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId } = getValidated(req, 'params', farmPlotParams);
    const body = getValidated(req, 'body', createSoilTestBody);
    const record = await soilService.createSoilTest(scope, farmId, plotId, body);
    res.status(201).json(record);
  }),
);

soilRouter.get(
  '/:farmId/plots/:plotId/soil-tests/health-summary',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmPlotParams, query: soilHealthSummaryQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId } = getValidated(req, 'params', farmPlotParams);
    const summary = await soilService.getSoilHealthSummary(scope, farmId, plotId);
    res.json(summary);
  }),
);

soilRouter.get(
  '/:farmId/plots/:plotId/soil-tests/:testId',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: soilTestIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId, testId } = getValidated(req, 'params', soilTestIdParams);
    const record = await soilService.getSoilTest(scope, farmId, plotId, testId);
    res.json(record);
  }),
);

// ---------------------------------------------------------------------------
// soil_amendments
// ---------------------------------------------------------------------------

soilRouter.get(
  '/:farmId/plots/:plotId/soil-amendments',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmPlotParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId } = getValidated(req, 'params', farmPlotParams);
    const items = await soilService.listSoilAmendments(scope, farmId, plotId);
    res.json({ items });
  }),
);

soilRouter.post(
  '/:farmId/plots/:plotId/soil-amendments',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmPlotParams, body: createSoilAmendmentBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId } = getValidated(req, 'params', farmPlotParams);
    const body = getValidated(req, 'body', createSoilAmendmentBody);
    const amendment = await soilService.createSoilAmendment(scope, farmId, plotId, body);
    res.status(201).json(amendment);
  }),
);

soilRouter.patch(
  '/:farmId/plots/:plotId/soil-amendments/:amendmentId',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: soilAmendmentIdParams, body: updateSoilAmendmentBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId, amendmentId } = getValidated(req, 'params', soilAmendmentIdParams);
    const body = getValidated(req, 'body', updateSoilAmendmentBody);
    const amendment = await soilService.updateSoilAmendment(scope, farmId, plotId, amendmentId, body);
    res.json(amendment);
  }),
);

soilRouter.delete(
  '/:farmId/plots/:plotId/soil-amendments/:amendmentId',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: soilAmendmentIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId, amendmentId } = getValidated(req, 'params', soilAmendmentIdParams);
    await soilService.removeSoilAmendment(scope, farmId, plotId, amendmentId);
    res.status(204).end();
  }),
);

// ---------------------------------------------------------------------------
// soil_moisture_observations (append-only in practice: list + create only)
// ---------------------------------------------------------------------------

soilRouter.get(
  '/:farmId/plots/:plotId/soil-moisture',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmPlotParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId } = getValidated(req, 'params', farmPlotParams);
    const items = await soilService.listSoilMoisture(scope, farmId, plotId);
    res.json({ items });
  }),
);

soilRouter.post(
  '/:farmId/plots/:plotId/soil-moisture',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmPlotParams, body: createSoilMoistureBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId } = getValidated(req, 'params', farmPlotParams);
    const body = getValidated(req, 'body', createSoilMoistureBody);
    const observation = await soilService.createSoilMoisture(scope, farmId, plotId, body);
    res.status(201).json(observation);
  }),
);

// ---------------------------------------------------------------------------
// erosion_conservation_notes
// ---------------------------------------------------------------------------

soilRouter.get(
  '/:farmId/plots/:plotId/erosion-notes',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmPlotParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId } = getValidated(req, 'params', farmPlotParams);
    const items = await soilService.listErosionNotes(scope, farmId, plotId);
    res.json({ items });
  }),
);

soilRouter.post(
  '/:farmId/plots/:plotId/erosion-notes',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmPlotParams, body: createErosionNoteBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId } = getValidated(req, 'params', farmPlotParams);
    const body = getValidated(req, 'body', createErosionNoteBody);
    const note = await soilService.createErosionNote(scope, farmId, plotId, body);
    res.status(201).json(note);
  }),
);

// ---------------------------------------------------------------------------
// crop_rotation_entries + cover_crop_windows
// ---------------------------------------------------------------------------

soilRouter.get(
  '/:farmId/plots/:plotId/crop-rotation',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmPlotParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId } = getValidated(req, 'params', farmPlotParams);
    const plan = await soilService.getCropRotation(scope, farmId, plotId);
    res.json(plan);
  }),
);

soilRouter.put(
  '/:farmId/plots/:plotId/crop-rotation',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmPlotParams, body: putCropRotationBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId } = getValidated(req, 'params', farmPlotParams);
    const body = getValidated(req, 'body', putCropRotationBody);
    const plan = await soilService.putCropRotation(scope, farmId, plotId, body);
    res.json(plan);
  }),
);

soilRouter.post(
  '/:farmId/plots/:plotId/cover-crop-windows',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmPlotParams, body: createCoverCropWindowBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId } = getValidated(req, 'params', farmPlotParams);
    const body = getValidated(req, 'body', createCoverCropWindowBody);
    const window = await soilService.createCoverCropWindow(scope, farmId, plotId, body);
    res.status(201).json(window);
  }),
);
