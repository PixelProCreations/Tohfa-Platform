/**
 * Wishlist, mounted at `/v1/wishlist`.
 *   requireAuth -> requirePermission -> validate -> handler
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { addWishlistBody, productIdParams, removeWishlistQuery } from './wishlist.schema.js';
import { wishlistService, type WishlistService } from './wishlist.service.js';

export function createWishlistRouter(service: WishlistService = wishlistService): Router {
  const router = Router();

  router.get(
    '/',
    requireAuth,
    requirePermission('wishlist.view_own'),
    asyncHandler(async (req, res) => {
      res.json(await service.list(requireScope(req.scope)));
    }),
  );

  router.post(
    '/',
    requireAuth,
    requirePermission('wishlist.manage_own'),
    validate({ body: addWishlistBody }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const { item, created } = await service.add(scope, getValidated(req, 'body', addWishlistBody));
      res.status(created ? 201 : 200).json(item);
    }),
  );

  router.delete(
    '/:productId',
    requireAuth,
    requirePermission('wishlist.manage_own'),
    validate({ params: productIdParams, query: removeWishlistQuery }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const { productId } = getValidated(req, 'params', productIdParams);
      const { grade } = getValidated(req, 'query', removeWishlistQuery);
      await service.remove(scope, productId, grade);
      res.status(204).end();
    }),
  );

  return router;
}

export const wishlistRouter: Router = createWishlistRouter();
