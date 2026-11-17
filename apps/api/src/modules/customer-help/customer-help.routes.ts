/**
 * Customer Help & FAQ read, mounted at `/v1/help`. PUBLIC (no auth, like the catalog): it serves only
 * the PUBLISHED articles an admin curates via `/v1/admin/help`, so there is nothing per-user to
 * authorise and no draft, author or timestamp is ever returned (reader allow-list shape).
 */
import { Router } from 'express';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { readHelpQuery } from '../help-support/help-support.schema.js';
import { customerHelpService, type CustomerHelpService } from './customer-help.service.js';

const categoriesQuery = readHelpQuery.pick({ locale: true }).strict();

export function createCustomerHelpRouter(service: CustomerHelpService = customerHelpService): Router {
  const router = Router();

  router.get(
    '/articles',
    validate({ query: readHelpQuery }),
    asyncHandler(async (req, res) => {
      res.json(await service.listArticles(getValidated(req, 'query', readHelpQuery)));
    }),
  );

  router.get(
    '/categories',
    validate({ query: categoriesQuery }),
    asyncHandler(async (req, res) => {
      const { locale } = getValidated(req, 'query', categoriesQuery);
      res.json(await service.listCategories(locale));
    }),
  );

  return router;
}

export const customerHelpRouter: Router = createCustomerHelpRouter();
