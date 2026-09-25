/**
 * Farm Diary — farmer-facing routes. Mounted at /v1/farmers/me/diary.
 *
 * Middleware order is FIXED: requireAuth -> requirePermission -> validate ->
 * asyncHandler(handler). Handlers only hand (scope, validated input) to the
 * service; ownership (BR-40/BR-43) is enforced in the service + repo, not here.
 *
 * Permission codes (docs/rbac.json, "Farm Diary" module): farmer.diary.view_own,
 * farmer.diary.create_own, farmer.diary.edit_own, farmer.diary.delete_own.
 * CUSTOMER is "none" on all of them (BR-41).
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  attachDiaryPhotoBody,
  createDiaryEntryBody,
  diaryCalendarQuery,
  entryIdParams,
  entryPhotoParams,
  listDiaryEntriesQuery,
  plotIdParams,
  updateDiaryEntryBody,
} from './farm-diary.schema.js';
import { farmDiaryService } from './farm-diary.service.js';

export const farmDiaryRouter: Router = Router();

// GET /v1/farmers/me/diary/plots — STUB (see farm-diary.service.ts)
farmDiaryRouter.get(
  '/plots',
  requireAuth,
  requirePermission('farmer.diary.view_own'),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await farmDiaryService.listPlots(scope));
  }),
);

// GET /v1/farmers/me/diary/plots/:plotId/active-crops — STUB (see farm-diary.service.ts)
farmDiaryRouter.get(
  '/plots/:plotId/active-crops',
  requireAuth,
  requirePermission('farmer.diary.view_own'),
  validate({ params: plotIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { plotId } = getValidated(req, 'params', plotIdParams);
    res.json(await farmDiaryService.listActiveCrops(scope, plotId));
  }),
);

// GET /v1/farmers/me/diary/taxonomy — active categories with nested active sub-activities
farmDiaryRouter.get(
  '/taxonomy',
  requireAuth,
  requirePermission('farmer.diary.view_own'),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await farmDiaryService.getTaxonomy(scope));
  }),
);

// POST /v1/farmers/me/diary/entries
farmDiaryRouter.post(
  '/entries',
  requireAuth,
  requirePermission('farmer.diary.create_own'),
  validate({ body: createDiaryEntryBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createDiaryEntryBody);
    res.status(201).json(await farmDiaryService.createEntry(scope, body));
  }),
);

// GET /v1/farmers/me/diary/entries
farmDiaryRouter.get(
  '/entries',
  requireAuth,
  requirePermission('farmer.diary.view_own'),
  validate({ query: listDiaryEntriesQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listDiaryEntriesQuery);
    res.json(await farmDiaryService.listEntries(scope, query));
  }),
);

// GET /v1/farmers/me/diary/entries/calendar?month=YYYY-MM
// Registered BEFORE '/entries/:entryId' so "calendar" is never parsed as an id.
farmDiaryRouter.get(
  '/entries/calendar',
  requireAuth,
  requirePermission('farmer.diary.view_own'),
  validate({ query: diaryCalendarQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', diaryCalendarQuery);
    res.json(await farmDiaryService.getCalendar(scope, query));
  }),
);

// GET /v1/farmers/me/diary/entries/:entryId
farmDiaryRouter.get(
  '/entries/:entryId',
  requireAuth,
  requirePermission('farmer.diary.view_own'),
  validate({ params: entryIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { entryId } = getValidated(req, 'params', entryIdParams);
    res.json(await farmDiaryService.getEntry(scope, entryId));
  }),
);

// PATCH /v1/farmers/me/diary/entries/:entryId
farmDiaryRouter.patch(
  '/entries/:entryId',
  requireAuth,
  requirePermission('farmer.diary.edit_own'),
  validate({ params: entryIdParams, body: updateDiaryEntryBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { entryId } = getValidated(req, 'params', entryIdParams);
    const body = getValidated(req, 'body', updateDiaryEntryBody);
    res.json(await farmDiaryService.updateEntry(scope, entryId, body));
  }),
);

// DELETE /v1/farmers/me/diary/entries/:entryId — soft delete (BR-43b)
farmDiaryRouter.delete(
  '/entries/:entryId',
  requireAuth,
  requirePermission('farmer.diary.delete_own'),
  validate({ params: entryIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { entryId } = getValidated(req, 'params', entryIdParams);
    await farmDiaryService.deleteEntry(scope, entryId);
    res.status(204).end();
  }),
);

// POST /v1/farmers/me/diary/entries/:entryId/photos — attach an already-uploaded DIARY_PHOTO key
farmDiaryRouter.post(
  '/entries/:entryId/photos',
  requireAuth,
  requirePermission('farmer.diary.edit_own'),
  validate({ params: entryIdParams, body: attachDiaryPhotoBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { entryId } = getValidated(req, 'params', entryIdParams);
    const body = getValidated(req, 'body', attachDiaryPhotoBody);
    res.status(201).json(await farmDiaryService.attachPhoto(scope, entryId, body));
  }),
);

// DELETE /v1/farmers/me/diary/entries/:entryId/photos/:photoId
farmDiaryRouter.delete(
  '/entries/:entryId/photos/:photoId',
  requireAuth,
  requirePermission('farmer.diary.edit_own'),
  validate({ params: entryPhotoParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { entryId, photoId } = getValidated(req, 'params', entryPhotoParams);
    await farmDiaryService.deletePhoto(scope, entryId, photoId);
    res.status(204).end();
  }),
);
