/**
 * BR-82: wiring only. requireAuth -> requirePermission -> validate -> handler.
 *
 * Mounted at /v1/admin/help. Reading is `help.article.view` (every admin
 * role); everything that writes, plus the draft-inclusive article list, is
 * `help.article.manage` (SA/TA). Farmers and customers hold neither.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  articleIdParams,
  createArticleBody,
  listArticlesQuery,
  readHelpQuery,
  updateArticleBody,
  updateContactBody,
} from './help-support.schema.js';
import { helpSupportService } from './help-support.service.js';

export const adminHelpRouter: Router = Router();

adminHelpRouter.get(
  '/',
  requireAuth,
  requirePermission('help.article.view'),
  validate({ query: readHelpQuery }),
  asyncHandler(async (req, res) => {
    res.json(await helpSupportService.read(getValidated(req, 'query', readHelpQuery)));
  }),
);

adminHelpRouter.get(
  '/articles',
  requireAuth,
  requirePermission('help.article.manage'),
  validate({ query: listArticlesQuery }),
  asyncHandler(async (req, res) => {
    res.json(await helpSupportService.listArticles(getValidated(req, 'query', listArticlesQuery)));
  }),
);

adminHelpRouter.post(
  '/articles',
  requireAuth,
  requirePermission('help.article.manage'),
  validate({ body: createArticleBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.status(201).json(await helpSupportService.createArticle(scope, getValidated(req, 'body', createArticleBody)));
  }),
);

adminHelpRouter.patch(
  '/articles/:id',
  requireAuth,
  requirePermission('help.article.manage'),
  validate({ params: articleIdParams, body: updateArticleBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', articleIdParams);
    res.json(await helpSupportService.updateArticle(scope, id, getValidated(req, 'body', updateArticleBody)));
  }),
);

adminHelpRouter.post(
  '/articles/:id/publish',
  requireAuth,
  requirePermission('help.article.manage'),
  validate({ params: articleIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', articleIdParams);
    res.json(await helpSupportService.setPublished(scope, id, true));
  }),
);

adminHelpRouter.post(
  '/articles/:id/unpublish',
  requireAuth,
  requirePermission('help.article.manage'),
  validate({ params: articleIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', articleIdParams);
    res.json(await helpSupportService.setPublished(scope, id, false));
  }),
);

adminHelpRouter.patch(
  '/contact',
  requireAuth,
  requirePermission('help.article.manage'),
  validate({ body: updateContactBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await helpSupportService.updateContact(scope, getValidated(req, 'body', updateContactBody)));
  }),
);
