/**
 * Customer returns (docs/openapi.yaml tag Returns, BR-61/BR-155/BR-204):
 *   POST /orders/{orderId}/returns { reason (1..300), items[{orderItemId, qty}], note (<=500), photoUploadIds (<=5) }
 *     -> 201 CustomerReturnRequest; only for own DELIVERED / PICKED_UP orders (else 409
 *     INVALID_STATE_TRANSITION); qty above ordered-minus-returned is 422.
 *   GET /returns/me (cursor paged), GET /returns/me/{id}.
 * Photos are ISSUE_PHOTO uploads (sign + upload, see api/support.ts uploadIssuePhoto).
 */
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, getAccessToken } from '../../../shell/api/client';
import { buildQueryString, nextPageParam, type Page } from '../../../shell/api/pagination';
import { orderQueryKeys } from './orders';
import type { Quantity } from '../utils/money';

export type ReturnStatus = 'PENDING' | 'INSPECTED' | 'APPROVED' | 'REJECTED' | 'REFUND_PENDING_BANK' | 'REFUNDED';
export const RETURN_MAX_PHOTOS = 5;

export interface CustomerReturnSummary {
  id: string;
  orderId: string;
  status: ReturnStatus;
  reason: string;
  note: string | null;
  /** Short-lived signed read URLs. */
  photos: string[];
  createdAt: string;
  updatedAt: string | null;
}

export interface CustomerReturnRequest extends CustomerReturnSummary {
  items: { id: string; orderItemId: string; requestedQty: Quantity; acceptedQty: Quantity | null }[];
}

export interface CreateReturnInput {
  reason: string;
  items: { orderItemId: string; qty: Quantity }[];
  note?: string | undefined;
  photoUploadIds?: string[] | undefined;
}

export const returnQueryKeys = {
  mine: ['returns', 'me'] as const,
  detail: (id: string) => ['returns', 'me', id] as const,
};

export function toReturnBody(input: CreateReturnInput): Record<string, unknown> {
  const body: Record<string, unknown> = { reason: input.reason.trim().slice(0, 300), items: input.items };
  if (input.note && input.note.trim().length > 0) body['note'] = input.note.trim().slice(0, 500);
  if (input.photoUploadIds && input.photoUploadIds.length > 0) body['photoUploadIds'] = input.photoUploadIds.slice(0, RETURN_MAX_PHOTOS);
  return body;
}

export function createReturn(orderId: string, input: CreateReturnInput): Promise<CustomerReturnRequest> {
  return api.post<CustomerReturnRequest>(`/orders/${encodeURIComponent(orderId)}/returns`, toReturnBody(input));
}

export const useCreateReturn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, input }: { orderId: string; input: CreateReturnInput }) => createReturn(orderId, input),
    onSuccess: (_res, { orderId }) => {
      void qc.invalidateQueries({ queryKey: returnQueryKeys.mine });
      void qc.invalidateQueries({ queryKey: orderQueryKeys.detail(orderId) });
    },
  });
};

export const useMyReturns = () =>
  useInfiniteQuery({
    queryKey: returnQueryKeys.mine,
    queryFn: ({ pageParam, signal }) =>
      api.get<Page<CustomerReturnSummary>>(`/returns/me${buildQueryString({ cursor: pageParam, limit: 20 })}`, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: Page<CustomerReturnSummary>) => nextPageParam(last),
    enabled: !!getAccessToken(),
  });

export const useReturn = (id: string | null | undefined) =>
  useQuery({
    queryKey: returnQueryKeys.detail(id ?? ''),
    queryFn: ({ signal }) => api.get<CustomerReturnRequest>(`/returns/me/${encodeURIComponent(id as string)}`, signal),
    enabled: !!id && !!getAccessToken(),
  });
