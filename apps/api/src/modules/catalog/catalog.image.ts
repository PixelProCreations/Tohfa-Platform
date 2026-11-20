/**
 * BR-16 / BR-195: the one place a product image URL is built, shared by the catalog serializer and
 * the order list thumbnails. Only the CDN host + a catalog key are ever emitted; nothing derived from
 * a listing, a farm or an upload (an uploaded photo's EXIF could carry farm GPS).
 */
export const PRODUCT_IMAGE_BASE = 'https://cdn.tohfa.in/products';

export function productImageUrl(iconKey: string | null | undefined, cropId: string): string {
  return `${PRODUCT_IMAGE_BASE}/${iconKey ? iconKey : cropId}.jpg`;
}
