/**
 * Livestock — farmer-facing routes. Mounted at /v1/farmers/me/livestock.
 *
 * Middleware order is FIXED: requireAuth -> requirePermission -> validate ->
 * asyncHandler(handler). Handlers only hand (scope, validated input) to the
 * service; ownership (farms.farmer_id) and BR-47 are enforced in the
 * service + repo, not here.
 *
 * Permission codes (docs/rbac.json, "Livestock" module): farmer.livestock.view_own,
 * farmer.livestock.create_own, farmer.livestock.edit_own.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  animalIdParams,
  createAnimalBody,
  createBreedingRecordBody,
  createFeedLogBody,
  createFeedPlanBody,
  createHealthRecordBody,
  createHousingRecordBody,
  createHygieneLogBody,
  createProductionLogBody,
  listAnimalsQuery,
  listBreedingRecordsQuery,
  listFeedLogsQuery,
  listFeedPlansQuery,
  listHealthRecordsQuery,
  listHousingRecordsQuery,
  listHygieneLogsQuery,
  listProductionLogsQuery,
  recordLifecycleEventBody,
  updateAnimalBody,
} from './livestock.schema.js';
import { livestockService } from './livestock.service.js';

export const livestockRouter: Router = Router();

// GET /v1/farmers/me/livestock/animals
livestockRouter.get(
  '/animals',
  requireAuth,
  requirePermission('farmer.livestock.view_own'),
  validate({ query: listAnimalsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listAnimalsQuery);
    res.json(await livestockService.listAnimals(scope, query));
  }),
);

// POST /v1/farmers/me/livestock/animals — registers a new animal.
livestockRouter.post(
  '/animals',
  requireAuth,
  requirePermission('farmer.livestock.create_own'),
  validate({ body: createAnimalBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createAnimalBody);
    res.status(201).json(await livestockService.createAnimal(scope, body));
  }),
);

// GET /v1/farmers/me/livestock/animals/:animalId
livestockRouter.get(
  '/animals/:animalId',
  requireAuth,
  requirePermission('farmer.livestock.view_own'),
  validate({ params: animalIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { animalId } = getValidated(req, 'params', animalIdParams);
    res.json(await livestockService.getAnimal(scope, animalId));
  }),
);

// PATCH /v1/farmers/me/livestock/animals/:animalId
livestockRouter.patch(
  '/animals/:animalId',
  requireAuth,
  requirePermission('farmer.livestock.edit_own'),
  validate({ params: animalIdParams, body: updateAnimalBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { animalId } = getValidated(req, 'params', animalIdParams);
    const body = getValidated(req, 'body', updateAnimalBody);
    res.json(await livestockService.updateAnimal(scope, animalId, body));
  }),
);

// POST /v1/farmers/me/livestock/animals/:animalId/lifecycle-events — sold/
// transferred/culled/deceased; ends the animal's active lifecycle (BR-47).
livestockRouter.post(
  '/animals/:animalId/lifecycle-events',
  requireAuth,
  requirePermission('farmer.livestock.edit_own'),
  validate({ params: animalIdParams, body: recordLifecycleEventBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { animalId } = getValidated(req, 'params', animalIdParams);
    const body = getValidated(req, 'body', recordLifecycleEventBody);
    res.status(201).json(await livestockService.recordLifecycleEvent(scope, animalId, body));
  }),
);

// GET /v1/farmers/me/livestock/production-logs
livestockRouter.get(
  '/production-logs',
  requireAuth,
  requirePermission('farmer.livestock.view_own'),
  validate({ query: listProductionLogsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listProductionLogsQuery);
    res.json(await livestockService.listProductionLogs(scope, query));
  }),
);

// POST /v1/farmers/me/livestock/production-logs
livestockRouter.post(
  '/production-logs',
  requireAuth,
  requirePermission('farmer.livestock.create_own'),
  validate({ body: createProductionLogBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createProductionLogBody);
    res.status(201).json(await livestockService.createProductionLog(scope, body));
  }),
);

// ---------------------------------------------------------------------------
// Animal records (AnimalDetailScreen) — BR-137..BR-141. Each resource is a GET
// list (farmer.livestock.view_own) and a POST create (farmer.livestock.create_own)
// under /animals/:animalId. No PATCH/DELETE yet: the screen has none.
// ---------------------------------------------------------------------------

// GET /v1/farmers/me/livestock/animals/:animalId/health-records
livestockRouter.get(
  '/animals/:animalId/health-records',
  requireAuth,
  requirePermission('farmer.livestock.view_own'),
  validate({ params: animalIdParams, query: listHealthRecordsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { animalId } = getValidated(req, 'params', animalIdParams);
    const query = getValidated(req, 'query', listHealthRecordsQuery);
    res.json(await livestockService.listHealthRecords(scope, animalId, query));
  }),
);

// POST /v1/farmers/me/livestock/animals/:animalId/health-records — a TREATMENT
// with a withdrawal window also extends the animal's withdrawalUntil (BR-138).
livestockRouter.post(
  '/animals/:animalId/health-records',
  requireAuth,
  requirePermission('farmer.livestock.create_own'),
  validate({ params: animalIdParams, body: createHealthRecordBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { animalId } = getValidated(req, 'params', animalIdParams);
    const body = getValidated(req, 'body', createHealthRecordBody);
    res.status(201).json(await livestockService.createHealthRecord(scope, animalId, body));
  }),
);

// GET /v1/farmers/me/livestock/animals/:animalId/breeding-records
livestockRouter.get(
  '/animals/:animalId/breeding-records',
  requireAuth,
  requirePermission('farmer.livestock.view_own'),
  validate({ params: animalIdParams, query: listBreedingRecordsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { animalId } = getValidated(req, 'params', animalIdParams);
    const query = getValidated(req, 'query', listBreedingRecordsQuery);
    res.json(await livestockService.listBreedingRecords(scope, animalId, query));
  }),
);

// POST /v1/farmers/me/livestock/animals/:animalId/breeding-records — FEMALE animals only (BR-140).
livestockRouter.post(
  '/animals/:animalId/breeding-records',
  requireAuth,
  requirePermission('farmer.livestock.create_own'),
  validate({ params: animalIdParams, body: createBreedingRecordBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { animalId } = getValidated(req, 'params', animalIdParams);
    const body = getValidated(req, 'body', createBreedingRecordBody);
    res.status(201).json(await livestockService.createBreedingRecord(scope, animalId, body));
  }),
);

// GET /v1/farmers/me/livestock/animals/:animalId/feed-plans
livestockRouter.get(
  '/animals/:animalId/feed-plans',
  requireAuth,
  requirePermission('farmer.livestock.view_own'),
  validate({ params: animalIdParams, query: listFeedPlansQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { animalId } = getValidated(req, 'params', animalIdParams);
    const query = getValidated(req, 'query', listFeedPlansQuery);
    res.json(await livestockService.listFeedPlans(scope, animalId, query));
  }),
);

// POST /v1/farmers/me/livestock/animals/:animalId/feed-plans
livestockRouter.post(
  '/animals/:animalId/feed-plans',
  requireAuth,
  requirePermission('farmer.livestock.create_own'),
  validate({ params: animalIdParams, body: createFeedPlanBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { animalId } = getValidated(req, 'params', animalIdParams);
    const body = getValidated(req, 'body', createFeedPlanBody);
    res.status(201).json(await livestockService.createFeedPlan(scope, animalId, body));
  }),
);

// GET /v1/farmers/me/livestock/animals/:animalId/feed-logs
livestockRouter.get(
  '/animals/:animalId/feed-logs',
  requireAuth,
  requirePermission('farmer.livestock.view_own'),
  validate({ params: animalIdParams, query: listFeedLogsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { animalId } = getValidated(req, 'params', animalIdParams);
    const query = getValidated(req, 'query', listFeedLogsQuery);
    res.json(await livestockService.listFeedLogs(scope, animalId, query));
  }),
);

// POST /v1/farmers/me/livestock/animals/:animalId/feed-logs
livestockRouter.post(
  '/animals/:animalId/feed-logs',
  requireAuth,
  requirePermission('farmer.livestock.create_own'),
  validate({ params: animalIdParams, body: createFeedLogBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { animalId } = getValidated(req, 'params', animalIdParams);
    const body = getValidated(req, 'body', createFeedLogBody);
    res.status(201).json(await livestockService.createFeedLog(scope, animalId, body));
  }),
);

// GET /v1/farmers/me/livestock/animals/:animalId/housing-records
livestockRouter.get(
  '/animals/:animalId/housing-records',
  requireAuth,
  requirePermission('farmer.livestock.view_own'),
  validate({ params: animalIdParams, query: listHousingRecordsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { animalId } = getValidated(req, 'params', animalIdParams);
    const query = getValidated(req, 'query', listHousingRecordsQuery);
    res.json(await livestockService.listHousingRecords(scope, animalId, query));
  }),
);

// POST /v1/farmers/me/livestock/animals/:animalId/housing-records
livestockRouter.post(
  '/animals/:animalId/housing-records',
  requireAuth,
  requirePermission('farmer.livestock.create_own'),
  validate({ params: animalIdParams, body: createHousingRecordBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { animalId } = getValidated(req, 'params', animalIdParams);
    const body = getValidated(req, 'body', createHousingRecordBody);
    res.status(201).json(await livestockService.createHousingRecord(scope, animalId, body));
  }),
);

// GET /v1/farmers/me/livestock/animals/:animalId/hygiene-logs
livestockRouter.get(
  '/animals/:animalId/hygiene-logs',
  requireAuth,
  requirePermission('farmer.livestock.view_own'),
  validate({ params: animalIdParams, query: listHygieneLogsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { animalId } = getValidated(req, 'params', animalIdParams);
    const query = getValidated(req, 'query', listHygieneLogsQuery);
    res.json(await livestockService.listHygieneLogs(scope, animalId, query));
  }),
);

// POST /v1/farmers/me/livestock/animals/:animalId/hygiene-logs
livestockRouter.post(
  '/animals/:animalId/hygiene-logs',
  requireAuth,
  requirePermission('farmer.livestock.create_own'),
  validate({ params: animalIdParams, body: createHygieneLogBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { animalId } = getValidated(req, 'params', animalIdParams);
    const body = getValidated(req, 'body', createHygieneLogBody);
    res.status(201).json(await livestockService.createHygieneLog(scope, animalId, body));
  }),
);
