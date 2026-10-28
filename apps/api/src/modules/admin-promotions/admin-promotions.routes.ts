/**
 * Admin promotion requests (BR-114 approve, BR-117 create/list/read/reject). Wiring only:
 * requireAuth -> requirePermission -> validate -> handler.
 *
 * Mounted by app.ts at /v1/admin/promotions. One permission code per route (docs/rbac.json):
 * create `admin.promotion.request`, reads `admin.promotion.view`, approve `admin.promotion.approve`,
 * reject `admin.promotion.reject`.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  approvePromotionBody,
  createPromotionBody,
  listPromotionsQuery,
  promotionIdParams,
  rejectPromotionBody,
} from './admin-promotions.schema.js';
import { adminPromotionsService } from './admin-promotions.service.js';

export const adminPromotionsRouter: Router = Router();

// GET /v1/admin/promotions — SUPER_ADMIN and TOHFA_ADMIN (admin.promotion.view).
adminPromotionsRouter.get(
  '/',
  requireAuth,
  requirePermission('admin.promotion.view'),
  validate({ query: listPromotionsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await adminPromotionsService.list(scope, getValidated(req, 'query', listPromotionsQuery)));
  }),
);

// POST /v1/admin/promotions — SUPER_ADMIN and TOHFA_ADMIN (admin.promotion.request).
adminPromotionsRouter.post(
  '/',
  requireAuth,
  requirePermission('admin.promotion.request'),
  validate({ body: createPromotionBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.status(201).json(await adminPromotionsService.create(scope, getValidated(req, 'body', createPromotionBody)));
  }),
);

// GET /v1/admin/promotions/:id — SUPER_ADMIN and TOHFA_ADMIN (admin.promotion.view).
adminPromotionsRouter.get(
  '/:id',
  requireAuth,
  requirePermission('admin.promotion.view'),
  validate({ params: promotionIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', promotionIdParams);
    res.json(await adminPromotionsService.get(scope, id));
  }),
);

// POST /v1/admin/promotions/:id/approve — SUPER_ADMIN only (admin.promotion.approve).
adminPromotionsRouter.post(
  '/:id/approve',
  requireAuth,
  requirePermission('admin.promotion.approve'),
  validate({ params: promotionIdParams, body: approvePromotionBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', promotionIdParams);
    const body = getValidated(req, 'body', approvePromotionBody);
    res.status(200).json(await adminPromotionsService.approve(scope, id, body));
  }),
);

// POST /v1/admin/promotions/:id/reject — SUPER_ADMIN only (admin.promotion.reject).
adminPromotionsRouter.post(
  '/:id/reject',
  requireAuth,
  requirePermission('admin.promotion.reject'),
  validate({ params: promotionIdParams, body: rejectPromotionBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', promotionIdParams);
    const body = getValidated(req, 'body', rejectPromotionBody);
    res.status(200).json(await adminPromotionsService.reject(scope, id, body));
  }),
);
