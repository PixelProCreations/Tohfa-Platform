/**
 * Legal content (BR-172). Wiring only.
 * Public: GET /v1/legal/privacy-policy, GET /v1/legal/terms. Admin: PUT /v1/admin/legal/{slug}
 * gated by `legal.content.manage` (SUPER_ADMIN, TOHFA_ADMIN).
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { legalSlugParams, publicLegalQuery, putLegalBody } from './legal-content.schema.js';
import { legalContentService } from './legal-content.service.js';

export const legalContentRouter: Router = Router();
export const adminLegalContentRouter: Router = Router();

legalContentRouter.get(
  '/privacy-policy',
  validate({ query: publicLegalQuery }),
  asyncHandler(async (req, res) => {
    res.json(await legalContentService.get('privacy-policy', getValidated(req, 'query', publicLegalQuery).language));
  }),
);

legalContentRouter.get(
  '/terms',
  validate({ query: publicLegalQuery }),
  asyncHandler(async (req, res) => {
    res.json(await legalContentService.get('terms', getValidated(req, 'query', publicLegalQuery).language));
  }),
);

adminLegalContentRouter.put(
  '/:slug',
  requireAuth,
  requirePermission('legal.content.manage'),
  validate({ params: legalSlugParams, body: putLegalBody }),
  asyncHandler(async (req, res) => {
    const { slug } = getValidated(req, 'params', legalSlugParams);
    res.json(await legalContentService.publish(requireScope(req.scope), slug, getValidated(req, 'body', putLegalBody)));
  }),
);
