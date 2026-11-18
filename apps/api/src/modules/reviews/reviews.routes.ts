/**
 * Reviews wiring. Three routers:
 *  - orderReviewsRouter   mounted at /v1/orders          (customer own)
 *  - productReviewsRouter mounted at /v1/catalog         (public, anonymised, like the catalog)
 *  - adminReviewsRouter   mounted at /v1/admin/reviews   (order.review.view_all)
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  adminReviewsQuery,
  createReviewBody,
  orderIdParams,
  productIdParams,
  productReviewsQuery,
} from './reviews.schema.js';
import { reviewsService, type ReviewsService } from './reviews.service.js';

export function createOrderReviewsRouter(service: ReviewsService = reviewsService): Router {
  const router = Router();
  router.post(
    '/:id/review',
    requireAuth,
    requirePermission('order.review.create_own'),
    validate({ params: orderIdParams, body: createReviewBody }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const { id } = getValidated(req, 'params', orderIdParams);
      res.status(201).json(await service.createReview(scope, id, getValidated(req, 'body', createReviewBody)));
    }),
  );
  router.get(
    '/:id/review',
    requireAuth,
    requirePermission('order.review.view_own'),
    validate({ params: orderIdParams }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const { id } = getValidated(req, 'params', orderIdParams);
      res.json(await service.getOrderReview(scope, id));
    }),
  );
  return router;
}

export function createProductReviewsRouter(service: ReviewsService = reviewsService): Router {
  const router = Router();
  router.get(
    '/products/:id/reviews',
    validate({ params: productIdParams, query: productReviewsQuery }),
    asyncHandler(async (req, res) => {
      const { id } = getValidated(req, 'params', productIdParams);
      res.json(await service.getProductReviews(id, getValidated(req, 'query', productReviewsQuery)));
    }),
  );
  return router;
}

export function createAdminReviewsRouter(service: ReviewsService = reviewsService): Router {
  const router = Router();
  router.get(
    '/',
    requireAuth,
    requirePermission('order.review.view_all'),
    validate({ query: adminReviewsQuery }),
    asyncHandler(async (req, res) => {
      res.json(await service.listAdmin(getValidated(req, 'query', adminReviewsQuery)));
    }),
  );
  router.get(
    '/:id',
    requireAuth,
    requirePermission('order.review.view_all'),
    validate({ params: orderIdParams }),
    asyncHandler(async (req, res) => {
      const { id } = getValidated(req, 'params', orderIdParams);
      res.json(await service.getAdmin(id));
    }),
  );
  return router;
}

export const orderReviewsRouter: Router = createOrderReviewsRouter();
export const productReviewsRouter: Router = createProductReviewsRouter();
export const adminReviewsRouter: Router = createAdminReviewsRouter();
