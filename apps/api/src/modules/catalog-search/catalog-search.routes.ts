/**
 * Catalog search extras (BR-151). Wiring only. Mounted by app.ts at /v1/catalog/search.
 * suggestions and trending are public and anonymous-safe; recent is the caller's own
 * (`catalog.search_history.manage`, CUSTOMER own) and always keyed by the token's customer id.
 */
import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import { deleteRecentQuery, recentSearchBody, suggestionsQuery, trendingQuery } from './catalog-search.schema.js';
import { catalogSearchService } from './catalog-search.service.js';

export const catalogSearchRouter: Router = Router();

catalogSearchRouter.get(
  '/suggestions',
  validate({ query: suggestionsQuery }),
  asyncHandler(async (req, res) => {
    res.json(await catalogSearchService.suggestions(getValidated(req, 'query', suggestionsQuery)));
  }),
);

catalogSearchRouter.get(
  '/trending',
  validate({ query: trendingQuery }),
  asyncHandler(async (req, res) => {
    res.json(await catalogSearchService.trending(getValidated(req, 'query', trendingQuery)));
  }),
);

catalogSearchRouter.get(
  '/recent',
  requireAuth,
  requirePermission('catalog.search_history.manage'),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    res.json(await catalogSearchService.listRecent(actor.customerId));
  }),
);

catalogSearchRouter.post(
  '/recent',
  requireAuth,
  requirePermission('catalog.search_history.manage'),
  validate({ body: recentSearchBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { query } = getValidated(req, 'body', recentSearchBody);
    res.status(201).json(await catalogSearchService.recordRecent(actor.customerId, query));
  }),
);

catalogSearchRouter.delete(
  '/recent',
  requireAuth,
  requirePermission('catalog.search_history.manage'),
  validate({ query: deleteRecentQuery }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { q } = getValidated(req, 'query', deleteRecentQuery);
    await catalogSearchService.deleteRecent(actor.customerId, q);
    res.status(204).end();
  }),
);
