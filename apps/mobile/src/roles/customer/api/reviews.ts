/**
 * Order reviews (docs/openapi.yaml tag Reviews):
 *   POST /orders/{id}/review { rating 1..5, tags[] (enum, unique), comment 1..1000,
 *     items[{orderItemId, rating, comment<=500}] } -> 201 OrderReview.
 *     Own DELIVERED / PICKED_UP orders only (409 INVALID_STATE_TRANSITION); a second
 *     review is 409 CONFLICT; a comment naming a farm/farmer is 422 (BR-16).
 *   GET /orders/{id}/review -> OrderReview, 404 when none.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, api, getAccessToken } from '../../../shell/api/client';
import { catalogQueryKeys } from './catalog';

export const REVIEW_TAGS = ['FRESHNESS', 'QUALITY', 'PACKAGING', 'DELIVERY', 'VALUE_FOR_MONEY', 'TASTE', 'SERVICE'] as const;
export type ReviewTag = (typeof REVIEW_TAGS)[number];

export interface OrderReview {
  id: string;
  orderId: string;
  rating: number;
  tags: string[];
  comment: string | null;
  items: { orderItemId: string; productId: string; name: string; grade: string; rating: number; comment: string | null }[];
  createdAt: string;
}

export interface CreateOrderReviewInput {
  rating: number;
  tags?: ReviewTag[];
  comment?: string;
  items?: { orderItemId: string; rating: number; comment?: string }[];
}

export const reviewQueryKeys = {
  order: (orderId: string) => ['orders', 'detail', orderId, 'review'] as const,
};

/** Body with only allowed keys: unique tags, trimmed comments, empty comments omitted. */
export function toReviewBody(input: CreateOrderReviewInput): Record<string, unknown> {
  const body: Record<string, unknown> = { rating: input.rating };
  const tags = Array.from(new Set(input.tags ?? [])).filter((t) => (REVIEW_TAGS as readonly string[]).includes(t));
  if (tags.length > 0) body['tags'] = tags;
  const comment = input.comment?.trim();
  if (comment) body['comment'] = comment.slice(0, 1000);
  const items = (input.items ?? [])
    .filter((i) => i.rating >= 1 && i.rating <= 5)
    .map((i) => {
      const c = i.comment?.trim();
      return { orderItemId: i.orderItemId, rating: i.rating, ...(c ? { comment: c.slice(0, 500) } : {}) };
    });
  if (items.length > 0) body['items'] = items;
  return body;
}

export async function fetchOrderReview(orderId: string, signal?: AbortSignal): Promise<OrderReview | null> {
  try {
    return await api.get<OrderReview>(`/orders/${encodeURIComponent(orderId)}/review`, signal);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/** The caller's review of the order, or null when none yet. */
export const useOrderReview = (orderId: string | null | undefined, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: reviewQueryKeys.order(orderId ?? ''),
    queryFn: ({ signal }) => fetchOrderReview(orderId as string, signal),
    enabled: !!orderId && (options.enabled ?? true) && !!getAccessToken(),
    retry: false,
  });

export const useCreateOrderReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, input }: { orderId: string; input: CreateOrderReviewInput }) =>
      api.post<OrderReview>(`/orders/${encodeURIComponent(orderId)}/review`, toReviewBody(input)),
    onSuccess: (review, { orderId }) => {
      qc.setQueryData(reviewQueryKeys.order(orderId), review);
      void qc.invalidateQueries({ queryKey: catalogQueryKeys.all });
    },
  });
};
