/**
 * Customer wishlist (docs/openapi.yaml tag Wishlist). Identity is crop + grade:
 *   GET /wishlist -> { items: WishlistItem[] } (newest first, <= 100),
 *   POST /wishlist { productId, grade } (201 added / 200 already there),
 *   DELETE /wishlist/{productId}?grade= (204, idempotent).
 * The heart toggle is optimistic and rolls back on error.
 */
import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getAccessToken } from '../../../shell/api/client';
import { buildQueryString } from '../../../shell/api/pagination';
import type { Product, SellableGrade } from './catalog';

/** docs/openapi.yaml `WishlistItem`. `product` is null and `available` false when not sellable now. */
export interface WishlistItem {
  id: string;
  productId: string;
  grade: SellableGrade;
  name: string;
  available: boolean;
  product: Product | null;
  addedAt: string;
}

export interface WishlistResponse {
  items: WishlistItem[];
}

export const wishlistQueryKeys = {
  wishlist: ['wishlist'] as const,
};

export function wishlistKey(productId: string, grade: string): string {
  return `${productId}:${grade}`;
}

export function fetchWishlist(signal?: AbortSignal): Promise<WishlistResponse> {
  return api.get<WishlistResponse>('/wishlist', signal);
}

export function addToWishlist(productId: string, grade: SellableGrade): Promise<WishlistItem> {
  return api.post<WishlistItem>('/wishlist', { productId, grade });
}

export function removeFromWishlist(productId: string, grade: SellableGrade): Promise<void> {
  return api.delete<void>(`/wishlist/${encodeURIComponent(productId)}${buildQueryString({ grade })}`);
}

export const useWishlist = () =>
  useQuery({
    queryKey: wishlistQueryKeys.wishlist,
    queryFn: ({ signal }) => fetchWishlist(signal),
    enabled: !!getAccessToken(),
    staleTime: 30_000,
  });

/** Set of `${productId}:${grade}` currently on the wishlist (empty while loading / signed out). */
export function useWishlistKeys(): ReadonlySet<string> {
  const { data } = useWishlist();
  return useMemo(() => new Set((data?.items ?? []).map((i) => wishlistKey(i.productId, i.grade))), [data]);
}

export interface ToggleWishlistInput {
  productId: string;
  grade: SellableGrade;
  /** Desired state: true = add, false = remove. */
  add: boolean;
  /** Optional product to show in the optimistic row. */
  product?: Product | null;
  name?: string;
}

/** Optimistic add/remove with rollback on error. */
export const useToggleWishlist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ToggleWishlistInput) =>
      input.add ? addToWishlist(input.productId, input.grade).then(() => undefined) : removeFromWishlist(input.productId, input.grade),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: wishlistQueryKeys.wishlist });
      const previous = qc.getQueryData<WishlistResponse>(wishlistQueryKeys.wishlist);
      const items = previous?.items ?? [];
      const key = wishlistKey(input.productId, input.grade);
      const without = items.filter((i) => wishlistKey(i.productId, i.grade) !== key);
      const next: WishlistItem[] = input.add
        ? [
            {
              id: `optimistic-${key}`,
              productId: input.productId,
              grade: input.grade,
              name: input.name ?? input.product?.name ?? '',
              available: input.product != null,
              product: input.product ?? null,
              addedAt: new Date().toISOString(),
            },
            ...without,
          ]
        : without;
      qc.setQueryData<WishlistResponse>(wishlistQueryKeys.wishlist, { items: next });
      return { previous };
    },
    onError: (_err, _input, ctx) => {
      if (ctx) qc.setQueryData(wishlistQueryKeys.wishlist, ctx.previous);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: wishlistQueryKeys.wishlist });
    },
  });
};
