/**
 * Farm Diary — admin taxonomy management (BR-45). Mounted at /v1/admin/diary.
 *
 * Middleware order is FIXED: requireAuth -> requirePermission -> validate ->
 * asyncHandler(handler). `admin.diary_taxonomy.manage` is granted only to
 * SUPER_ADMIN/TOHFA_ADMIN in docs/rbac.json, so FARMER/CUSTOMER are rejected
 * with 403 by requirePermission before any handler runs (BR-45a). The audit
 * row for every mutation is written by the service inside the same
 * transaction (BR-45c).
 *
 * Shares farm-diary.schema.ts / farm-diary.service.ts / farm-diary.repo.ts
 * with the farmer-facing router.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  categoryKeyForSubParams,
  categoryKeyParams,
  createDiaryCategoryBody,
  createDiarySubActivityBody,
  subActivityKeyParams,
  updateDiaryCategoryBody,
  updateDiarySubActivityBody,
} from './farm-diary.schema.js';
import { diaryTaxonomyAdminService } from './farm-diary.service.js';

export const adminDiaryTaxonomyRouter: Router = Router();

// POST /v1/admin/diary/categories
adminDiaryTaxonomyRouter.post(
  '/categories',
  requireAuth,
  requirePermission('admin.diary_taxonomy.manage'),
  validate({ body: createDiaryCategoryBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createDiaryCategoryBody);
    res.status(201).json(await diaryTaxonomyAdminService.createCategory(scope, body));
  }),
);

// PATCH /v1/admin/diary/categories/:key — includes isActive=false to deactivate
adminDiaryTaxonomyRouter.patch(
  '/categories/:key',
  requireAuth,
  requirePermission('admin.diary_taxonomy.manage'),
  validate({ params: categoryKeyParams, body: updateDiaryCategoryBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { key } = getValidated(req, 'params', categoryKeyParams);
    const body = getValidated(req, 'body', updateDiaryCategoryBody);
    res.json(await diaryTaxonomyAdminService.updateCategory(scope, key, body));
  }),
);

// POST /v1/admin/diary/categories/:categoryKey/sub-activities
adminDiaryTaxonomyRouter.post(
  '/categories/:categoryKey/sub-activities',
  requireAuth,
  requirePermission('admin.diary_taxonomy.manage'),
  validate({ params: categoryKeyForSubParams, body: createDiarySubActivityBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { categoryKey } = getValidated(req, 'params', categoryKeyForSubParams);
    const body = getValidated(req, 'body', createDiarySubActivityBody);
    res.status(201).json(await diaryTaxonomyAdminService.createSubActivity(scope, categoryKey, body));
  }),
);

// PATCH /v1/admin/diary/sub-activities/:key — includes isActive=false to deactivate
adminDiaryTaxonomyRouter.patch(
  '/sub-activities/:key',
  requireAuth,
  requirePermission('admin.diary_taxonomy.manage'),
  validate({ params: subActivityKeyParams, body: updateDiarySubActivityBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { key } = getValidated(req, 'params', subActivityKeyParams);
    const body = getValidated(req, 'body', updateDiarySubActivityBody);
    res.json(await diaryTaxonomyAdminService.updateSubActivity(scope, key, body));
  }),
);
