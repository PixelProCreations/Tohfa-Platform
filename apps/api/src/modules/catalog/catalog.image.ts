import { config } from '../../config.js';

/**
 * BR-16 / BR-195: the one place a product image URL is built, shared by the catalog serializer and
 * the order list thumbnails. Only the image host + a catalog key are ever emitted; nothing derived from
 * a listing, a farm or an upload (an uploaded photo's EXIF could carry farm GPS).
 *
 * The host is configuration (PRODUCT_IMAGE_BASE_URL, default the CDN), never request data. Local dev
 * points it at the API's own `/product-images` route (storage/productImages.routes.ts), which serves
 * the same catalog keys from a checked-in folder.
 */
export const PRODUCT_IMAGE_BASE = config.PRODUCT_IMAGE_BASE_URL;

export function productImageUrl(iconKey: string | null | undefined, cropId: string): string {
  return `${PRODUCT_IMAGE_BASE}/${iconKey ? iconKey : cropId}.jpg`;
}
