/**
 * pest.routes — wiring only.
 *
 * Three routers, following the pricing module's precedent of one module
 * exporting several routers that app.ts mounts at their own prefixes
 * (`fairPricesRouter` at /v1/fair-prices, `retailPricesRouter` at
 * /v1/retail-prices):
 *
 *   pestLibraryRouter        -> /v1/pest-library          (pest_library.view)
 *   weatherRiskNotesRouter   -> /v1/weather-risk-notes    (pest_library.view)
 *   pestRouter               -> /v1/farms                 (farmer.pest.manage_own)
 *
 * The two global routers get their own dedicated prefixes rather than a
 * shared `/v1` mount so they can never shadow, or be shadowed by, another
 * `/v1/...` router in API_MOUNTS.
 *
 * `pest_library.view` is a `view`-scoped grant: requirePermission already
 * rejects any non-GET verb, and both global routes are GET-only anyway. Both
 * still require auth — unlike soil's `optionalAuth` signed-link PDF route,
 * nothing here is reachable anonymously.
 *
 * Middleware order is fixed: requireAuth -> requirePermission -> validate ->
 * asyncHandler(handler). No SQL, no ownership checks, no business rules here
 * — those live in pest.service.ts.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { pestService } from './pest.service.js';
import {
  createPestDetectionBody,
  createPestTreatmentLogBody,
  createPestTreatmentReminderBody,
  farmOnlyParams,
  farmPlotParams,
  listPestLibraryQuery,
  pestDetectionIdParams,
  pestLibraryIdParams,
  pestReminderIdParams,
  updatePestDetectionBody,
  updatePestTreatmentReminderBody,
} from './pest.schema.js';

const MANAGE_OWN = 'farmer.pest.manage_own';
const LIBRARY_VIEW = 'pest_library.view';

// ---------------------------------------------------------------------------
// /v1/pest-library
// ---------------------------------------------------------------------------

export const pestLibraryRouter: Router = Router();

pestLibraryRouter.get(
  '/',
  requireAuth,
  requirePermission(LIBRARY_VIEW),
  validate({ query: listPestLibraryQuery }),
  asyncHandler(async (req, res) => {
    const query = getValidated(req, 'query', listPestLibraryQuery);
    const items = await pestService.listPestLibrary(query);
    res.json({ items });
  }),
);

pestLibraryRouter.get(
  '/:pestLibraryId',
  requireAuth,
  requirePermission(LIBRARY_VIEW),
  validate({ params: pestLibraryIdParams }),
  asyncHandler(async (req, res) => {
    const { pestLibraryId } = getValidated(req, 'params', pestLibraryIdParams);
    const entry = await pestService.getPestLibraryEntry(pestLibraryId);
    res.json(entry);
  }),
);

// ---------------------------------------------------------------------------
// /v1/weather-risk-notes
// ---------------------------------------------------------------------------

export const weatherRiskNotesRouter: Router = Router();

weatherRiskNotesRouter.get(
  '/',
  requireAuth,
  requirePermission(LIBRARY_VIEW),
  asyncHandler(async (_req, res) => {
    const items = await pestService.listWeatherRiskNotes();
    res.json({ items });
  }),
);

// ---------------------------------------------------------------------------
// /v1/farms — farmer-owned, plot-scoped pest data + farm-wide analytics
// ---------------------------------------------------------------------------

export const pestRouter: Router = Router();

pestRouter.get(
  '/:farmId/pest-analytics/summary',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmOnlyParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId } = getValidated(req, 'params', farmOnlyParams);
    const summary = await pestService.getAnalyticsSummary(scope, farmId);
    res.json(summary);
  }),
);

// pest_detections

pestRouter.get(
  '/:farmId/plots/:plotId/pest-detections',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmPlotParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId } = getValidated(req, 'params', farmPlotParams);
    const items = await pestService.listDetections(scope, farmId, plotId);
    res.json({ items });
  }),
);

pestRouter.post(
  '/:farmId/plots/:plotId/pest-detections',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmPlotParams, body: createPestDetectionBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId } = getValidated(req, 'params', farmPlotParams);
    const body = getValidated(req, 'body', createPestDetectionBody);
    const detection = await pestService.createDetection(scope, farmId, plotId, body);
    res.status(201).json(detection);
  }),
);

pestRouter.get(
  '/:farmId/plots/:plotId/pest-detections/:detectionId',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: pestDetectionIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId, detectionId } = getValidated(req, 'params', pestDetectionIdParams);
    const detection = await pestService.getDetection(scope, farmId, plotId, detectionId);
    res.json(detection);
  }),
);

pestRouter.patch(
  '/:farmId/plots/:plotId/pest-detections/:detectionId',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: pestDetectionIdParams, body: updatePestDetectionBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId, detectionId } = getValidated(req, 'params', pestDetectionIdParams);
    const body = getValidated(req, 'body', updatePestDetectionBody);
    const detection = await pestService.updateDetection(scope, farmId, plotId, detectionId, body);
    res.json(detection);
  }),
);

// pest_treatment_logs

pestRouter.get(
  '/:farmId/plots/:plotId/pest-treatment-logs',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmPlotParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId } = getValidated(req, 'params', farmPlotParams);
    const items = await pestService.listTreatmentLogs(scope, farmId, plotId);
    res.json({ items });
  }),
);

pestRouter.post(
  '/:farmId/plots/:plotId/pest-treatment-logs',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmPlotParams, body: createPestTreatmentLogBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId } = getValidated(req, 'params', farmPlotParams);
    const body = getValidated(req, 'body', createPestTreatmentLogBody);
    const log = await pestService.createTreatmentLog(scope, farmId, plotId, body);
    res.status(201).json(log);
  }),
);

// pest_treatment_reminders

pestRouter.get(
  '/:farmId/plots/:plotId/pest-treatment-reminders',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmPlotParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId } = getValidated(req, 'params', farmPlotParams);
    const items = await pestService.listReminders(scope, farmId, plotId);
    res.json({ items });
  }),
);

pestRouter.post(
  '/:farmId/plots/:plotId/pest-treatment-reminders',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: farmPlotParams, body: createPestTreatmentReminderBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId } = getValidated(req, 'params', farmPlotParams);
    const body = getValidated(req, 'body', createPestTreatmentReminderBody);
    const reminder = await pestService.createReminder(scope, farmId, plotId, body);
    res.status(201).json(reminder);
  }),
);

pestRouter.patch(
  '/:farmId/plots/:plotId/pest-treatment-reminders/:reminderId',
  requireAuth,
  requirePermission(MANAGE_OWN),
  validate({ params: pestReminderIdParams, body: updatePestTreatmentReminderBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmId, plotId, reminderId } = getValidated(req, 'params', pestReminderIdParams);
    const body = getValidated(req, 'body', updatePestTreatmentReminderBody);
    const reminder = await pestService.updateReminder(scope, farmId, plotId, reminderId, body);
    res.json(reminder);
  }),
);
