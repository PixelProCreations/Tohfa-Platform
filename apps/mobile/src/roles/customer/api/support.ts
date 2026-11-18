/**
 * Customer support tickets (docs/openapi.yaml `Support Tickets`):
 *   GET  /support/tickets?page&limit&status   -> CustomerTicketList (offset paging)
 *   POST /support/tickets                      -> CustomerTicketDetail (no Idempotency-Key)
 *   GET  /support/tickets/{id}                 -> CustomerTicketDetail
 *   POST /support/tickets/{id}/cancel          -> CustomerTicketDetail (OPEN only, else 409 TICKET_NOT_OPEN)
 *   POST /support/tickets/{id}/messages        -> CustomerTicketMessage (409 when CLOSED)
 * Photos: POST /uploads/sign purpose ISSUE_PHOTO, upload, send the target id.
 * Pure logic lives in ./supportModel.ts.
 */
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { launchImageLibrary } from 'react-native-image-picker';
import { api, ApiError } from '../../../shell/api/client';
import { uploadSignedFile } from '../../../shell/uploads/signedUpload';
import {
  base64ToBytes,
  isAllowedPhotoType,
  mergeTicketPages,
  shouldPoll,
  statusesForTab,
  type CreateCustomerTicketRequest,
  type CustomerTicketDetail,
  type CustomerTicketList,
  type CustomerTicketMessage,
  type CustomerTicketSummary,
  type SupportTab,
} from './supportModel';

export * from './supportModel';

export const SUPPORT_PAGE_SIZE = 20;
export const TICKET_POLL_MS = 30_000;

export const supportQueryKeys = {
  all: ['support'] as const,
  ticketLists: ['support', 'tickets'] as const,
  tickets: (status: SupportTab) => ['support', 'tickets', status] as const,
  ticket: (id: string) => ['support', 'ticket', id] as const,
  orders: ['support', 'orders'] as const,
};

function isNotFound(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}

export interface SupportTicketsPage {
  items: CustomerTicketSummary[];
  total: number;
  page: number;
  hasMore: boolean;
}

/** One page of a tab: fetches page `page` of every status the tab folds together. */
export async function fetchSupportTicketsPage(tab: SupportTab, page: number, signal?: AbortSignal): Promise<SupportTicketsPage> {
  const lists = await Promise.all(
    statusesForTab(tab).map((status) => {
      const qs = `page=${page}&limit=${SUPPORT_PAGE_SIZE}${status ? `&status=${status}` : ''}`;
      return api.get<CustomerTicketList>(`/support/tickets?${qs}`, signal);
    }),
  );
  return {
    items: mergeTicketPages(lists.map((l) => l.items)),
    total: lists.reduce((sum, l) => sum + l.total, 0),
    page,
    hasMore: lists.some((l) => l.page * l.limit < l.total),
  };
}

/** "My requests" list for a tab, offset paged (load more = next page). */
export function useSupportTickets(tab: SupportTab) {
  return useInfiniteQuery({
    queryKey: supportQueryKeys.tickets(tab),
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => fetchSupportTicketsPage(tab, pageParam, signal),
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
}

/** Ticket + thread; polls every 30 s while OPEN/IN_PROGRESS. 404 is not retried. */
export function useSupportTicket(ticketId: string | undefined) {
  return useQuery({
    queryKey: supportQueryKeys.ticket(ticketId ?? ''),
    enabled: !!ticketId,
    queryFn: ({ signal }) => api.get<CustomerTicketDetail>(`/support/tickets/${ticketId}`, signal),
    retry: (count, err) => !isNotFound(err) && count < 2,
    refetchInterval: (query) => (shouldPoll(query.state.data?.status) ? TICKET_POLL_MS : false),
  });
}

export function useCreateSupportTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCustomerTicketRequest) =>
      api.post<CustomerTicketDetail>('/support/tickets', body, undefined, { timeoutMs: 15000 }),
    onSuccess: (ticket) => {
      qc.setQueryData(supportQueryKeys.ticket(ticket.id), ticket);
      void qc.invalidateQueries({ queryKey: supportQueryKeys.ticketLists });
    },
  });
}

export function useCancelSupportTicket(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<CustomerTicketDetail>(`/support/tickets/${ticketId}/cancel`, {}),
    onSuccess: (ticket) => {
      qc.setQueryData(supportQueryKeys.ticket(ticketId), ticket);
      void qc.invalidateQueries({ queryKey: supportQueryKeys.ticketLists });
    },
    onError: () => {
      // 409 TICKET_NOT_OPEN: the status moved on; show the real one.
      void qc.invalidateQueries({ queryKey: supportQueryKeys.ticket(ticketId) });
    },
  });
}

export function useReplySupportTicket(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) =>
      api.post<CustomerTicketMessage>(`/support/tickets/${ticketId}/messages`, { message }),
    onSuccess: (msg) => {
      qc.setQueryData<CustomerTicketDetail>(supportQueryKeys.ticket(ticketId), (prev) =>
        prev ? { ...prev, messages: [...prev.messages, msg], messageCount: prev.messageCount + 1 } : prev,
      );
      void qc.invalidateQueries({ queryKey: supportQueryKeys.ticket(ticketId) });
      void qc.invalidateQueries({ queryKey: supportQueryKeys.ticketLists });
    },
  });
}

// ── Orders for the "Select order" picker ─────────────────────────────────────

/** The `OrderSummary` fields the support form uses (GET /orders). */
export interface SupportOrderOption {
  id: string;
  orderNumber: string;
  placedAt: string;
  itemCount: number | null;
  productNames: string[];
}

interface OrderSummaryWire {
  id: string;
  orderNumber: string;
  placedAt: string;
  itemCount?: number;
  thumbnails?: { productName: string; imageUrl: string }[];
}

/**
 * Own recent orders (newest first). Local query: the shared `useOrders` in
 * ./orders.ts types the body as an array, but GET /orders is `{items, page}`.
 */
export function useSupportOrders(enabled = true) {
  return useQuery({
    queryKey: supportQueryKeys.orders,
    enabled,
    staleTime: 60_000,
    queryFn: async ({ signal }): Promise<SupportOrderOption[]> => {
      const body = await api.get<{ items: OrderSummaryWire[] } | OrderSummaryWire[]>('/orders?limit=50', signal);
      const items = Array.isArray(body) ? body : (body.items ?? []);
      return items.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        placedAt: o.placedAt,
        itemCount: o.itemCount ?? null,
        productNames: (o.thumbnails ?? []).map((t) => t.productName),
      }));
    },
  });
}

// ── Issue photos ─────────────────────────────────────────────────────────────

export interface PickedPhoto {
  uri: string;
  base64: string;
  type: string;
  fileName: string;
}

export interface PickPhotosResult {
  photos: PickedPhoto[];
  /** Assets dropped because they were not JPG/PNG (or had no data). */
  rejected: number;
}

/** Opens the gallery for up to `limit` photos (JPG/PNG, downscaled). */
export async function pickIssuePhotos(limit: number): Promise<PickPhotosResult> {
  if (limit <= 0) return { photos: [], rejected: 0 };
  const res = await launchImageLibrary({
    mediaType: 'photo',
    selectionLimit: limit,
    includeBase64: true,
    maxWidth: 1600,
    maxHeight: 1600,
    quality: 0.7,
  });
  if (res.didCancel || res.errorCode || !res.assets) return { photos: [], rejected: 0 };
  const photos: PickedPhoto[] = [];
  let rejected = 0;
  for (const a of res.assets.slice(0, limit)) {
    if (!a.base64 || !a.uri || !isAllowedPhotoType(a.type)) {
      rejected++;
      continue;
    }
    const type = a.type === 'image/jpg' ? 'image/jpeg' : a.type!;
    photos.push({ uri: a.uri, base64: a.base64, type, fileName: a.fileName ?? `issue-photo.${type === 'image/png' ? 'png' : 'jpg'}` });
  }
  return { photos, rejected };
}

/** Sign (ISSUE_PHOTO) + upload; resolves with the upload id for `photoUploadIds`. */
export async function uploadIssuePhoto(photo: PickedPhoto, onProgress?: (pct: number) => void): Promise<string> {
  const bytes = base64ToBytes(photo.base64);
  const target = await uploadSignedFile(
    { purpose: 'ISSUE_PHOTO', contentType: photo.type, sizeBytes: bytes.length, fileName: photo.fileName, data: bytes },
    { onProgress: (pct) => onProgress?.(pct) },
  );
  return target.id;
}
