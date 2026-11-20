/**
 * Wishlist (`/v1/wishlist`): Zod schemas, `.strict()`, matching docs/openapi.yaml.
 * A product is the catalog's identity: `productId` is the catalog product id (the crop id) plus its grade.
 */
import { z } from 'zod';
import { productGradeEnum, productSchema } from '../catalog/catalog.schema.js';

export const productIdParams = z.object({ productId: z.string().uuid() }).strict();

export const addWishlistBody = z
  .object({
    productId: z.string().uuid(),
    grade: productGradeEnum,
  })
  .strict();
export type AddWishlistBody = z.infer<typeof addWishlistBody>;

export const removeWishlistQuery = z.object({ grade: productGradeEnum }).strict();
export type RemoveWishlistQuery = z.infer<typeof removeWishlistQuery>;

/**
 * `product` is the catalog allow-list ProductView (BR-16) when the product is currently sellable, and
 * null when it is not (out of stock or withdrawn); `available` says which. The saved row never goes
 * away on its own, so a customer sees "back in stock" later.
 */
export const wishlistItemResponse = z
  .object({
    id: z.string().uuid(),
    productId: z.string().uuid(),
    grade: productGradeEnum,
    name: z.string(),
    available: z.boolean(),
    product: productSchema.nullable(),
    addedAt: z.string(),
  })
  .strict();
export type WishlistItem = z.infer<typeof wishlistItemResponse>;

export const wishlistResponse = z.object({ items: z.array(wishlistItemResponse) }).strict();
export type WishlistResponse = z.infer<typeof wishlistResponse>;
