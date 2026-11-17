/**
 * Admin home banners and curated sections (BR-152). Wiring only.
 * Mounted by app.ts at /v1/admin/banners and /v1/admin/home-sections; every route is gated by
 * `catalog.home_content.manage` (docs/rbac.json: SUPER_ADMIN, TOHFA_ADMIN all).
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  createBannerBody,
  createSectionBody,
  idParams,
  listHomeContentQuery,
  updateBannerBody,
  updateSectionBody,
} from './home-content.schema.js';
import { homeContentService } from './home-content.service.js';

const PERM = 'catalog.home_content.manage';

export const adminBannersRouter: Router = Router();
export const adminHomeSectionsRouter: Router = Router();

adminBannersRouter.get('/', requireAuth, requirePermission(PERM), validate({ query: listHomeContentQuery }),
  asyncHandler(async (req, res) => {
    res.json(await homeContentService.listBanners(getValidated(req, 'query', listHomeContentQuery)));
  }));

adminBannersRouter.post('/', requireAuth, requirePermission(PERM), validate({ body: createBannerBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.status(201).json(await homeContentService.createBanner(scope, getValidated(req, 'body', createBannerBody)));
  }));

adminBannersRouter.get('/:id', requireAuth, requirePermission(PERM), validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    res.json(await homeContentService.getBanner(getValidated(req, 'params', idParams).id));
  }));

adminBannersRouter.patch('/:id', requireAuth, requirePermission(PERM), validate({ params: idParams, body: updateBannerBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', idParams);
    res.json(await homeContentService.updateBanner(scope, id, getValidated(req, 'body', updateBannerBody)));
  }));

adminBannersRouter.delete('/:id', requireAuth, requirePermission(PERM), validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    await homeContentService.deleteBanner(scope, getValidated(req, 'params', idParams).id);
    res.status(204).end();
  }));

adminHomeSectionsRouter.get('/', requireAuth, requirePermission(PERM), validate({ query: listHomeContentQuery }),
  asyncHandler(async (req, res) => {
    res.json(await homeContentService.listSections(getValidated(req, 'query', listHomeContentQuery)));
  }));

adminHomeSectionsRouter.post('/', requireAuth, requirePermission(PERM), validate({ body: createSectionBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.status(201).json(await homeContentService.createSection(scope, getValidated(req, 'body', createSectionBody)));
  }));

adminHomeSectionsRouter.get('/:id', requireAuth, requirePermission(PERM), validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    res.json(await homeContentService.getSection(getValidated(req, 'params', idParams).id));
  }));

adminHomeSectionsRouter.patch('/:id', requireAuth, requirePermission(PERM), validate({ params: idParams, body: updateSectionBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', idParams);
    res.json(await homeContentService.updateSection(scope, id, getValidated(req, 'body', updateSectionBody)));
  }));

adminHomeSectionsRouter.delete('/:id', requireAuth, requirePermission(PERM), validate({ params: idParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    await homeContentService.deleteSection(scope, getValidated(req, 'params', idParams).id);
    res.status(204).end();
  }));
