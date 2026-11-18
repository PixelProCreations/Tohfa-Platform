/**
 * Customer notifications (docs/openapi.yaml `Platform` tag):
 *
 *   GET  /notifications?cursor&limit&unreadOnly -> {items, page:{nextCursor,hasMore}, unreadCount}
 *   POST /notifications/{id}/read               -> Notification (idempotent)
 *   POST /notifications/read-all                -> {updated}
 *
 * The raw calls live in src/shell/notifications/api.ts (role-agnostic); this
 * file adds the customer's TanStack Query hooks plus pure helpers (IST day
 * grouping, kind/icon, deep-link target) that need no React.
 *
 * `data` is documented only as "Deep-link payload". What the API actually
 * writes (apps/api notifications.service handleDomainEvent: `data` is the raw
 * domain-event payload, apps/api/src/events/bus.ts):
 *   order.confirmed   {userId, orderId, orderNumber, totalAmount}
 *   order.dispatched  {userId, orderId, orderNumber}
 *   order.delivered   {userId, orderId, orderNumber}
 *   wallet.credited   {userId, amount, balance, reference}
 *   wallet.debited    {userId, amount, balance, reference}   (BR-150h sender)
 * There is NO event-name / type key, so credited vs debited and the order
 * stage are not distinguishable from `data`; support-ticket and return events
 * do not exist yet. We therefore also honour forward-compatible keys
 * (`event` | `type` | `kind`, `ticketId`, `returnId`) if the backend adds them.
 */
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';
import { useMemo } from 'react';
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type ListNotificationsResponse,
  type NotificationItem,
} from '../../../shell/notifications/api';

export type { NotificationItem, ListNotificationsResponse } from '../../../shell/notifications/api';

export const notificationQueryKeys = {
  all: ['notifications'] as const,
  list: ['notifications', 'list'] as const,
  unread: ['notifications', 'unread'] as const,
};

export const NOTIFICATIONS_PAGE_SIZE = 20;
/** Light polling for the bell badge; push (when configured) invalidates sooner. */
export const UNREAD_POLL_MS = 60_000;

type NotificationPages = InfiniteData<ListNotificationsResponse, unknown>;

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useNotifications() {
  const query = useInfiniteQuery({
    queryKey: notificationQueryKeys.list,
    queryFn: ({ pageParam, signal }) =>
      listNotifications(
        pageParam === undefined
          ? { limit: NOTIFICATIONS_PAGE_SIZE }
          : { limit: NOTIFICATIONS_PAGE_SIZE, cursor: pageParam },
        signal,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: ListNotificationsResponse) =>
      last.page.hasMore && last.page.nextCursor ? last.page.nextCursor : undefined,
  });
  const items = useMemo(() => flattenNotificationPages(query.data), [query.data]);
  return { ...query, items, unreadCount: query.data?.pages[0]?.unreadCount ?? 0 };
}

/** Unread count for the bell badge (`limit=1&unreadOnly=true`, reads `unreadCount`). */
export function useUnreadCount(options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: notificationQueryKeys.unread,
    queryFn: ({ signal }) => listNotifications({ limit: 1, unreadOnly: true }, signal).then((r) => r.unreadCount),
    enabled: options.enabled ?? true,
    staleTime: 30_000,
    refetchInterval: UNREAD_POLL_MS,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

// ─── Mutations (optimistic) ──────────────────────────────────────────────────

interface Snapshot {
  list: NotificationPages | undefined;
  unread: number | undefined;
}

async function snapshot(qc: QueryClient): Promise<Snapshot> {
  await qc.cancelQueries({ queryKey: notificationQueryKeys.list });
  await qc.cancelQueries({ queryKey: notificationQueryKeys.unread });
  return {
    list: qc.getQueryData<NotificationPages>(notificationQueryKeys.list),
    unread: qc.getQueryData<number>(notificationQueryKeys.unread),
  };
}

function restore(qc: QueryClient, snap: Snapshot | undefined): void {
  if (snap === undefined) return;
  qc.setQueryData(notificationQueryKeys.list, snap.list);
  qc.setQueryData(notificationQueryKeys.unread, snap.unread);
}

/** Options object, exported so tests can drive it through a MutationObserver. */
export function markReadMutationOptions(qc: QueryClient, now: () => Date = () => new Date()) {
  return {
    mutationFn: (id: string) => markNotificationAsRead(id),
    onMutate: async (id: string): Promise<Snapshot> => {
      const snap = await snapshot(qc);
      const wasUnread = findNotification(snap.list, id)?.readAt === null;
      const readAt = now().toISOString();
      if (snap.list !== undefined) qc.setQueryData(notificationQueryKeys.list, markOneRead(snap.list, id, readAt));
      if (wasUnread && typeof snap.unread === 'number') {
        qc.setQueryData(notificationQueryKeys.unread, Math.max(0, snap.unread - 1));
      }
      return snap;
    },
    onError: (_err: unknown, _id: string, snap: Snapshot | undefined) => restore(qc, snap),
    onSettled: () => qc.invalidateQueries({ queryKey: notificationQueryKeys.all }),
  };
}

export function markAllReadMutationOptions(qc: QueryClient, now: () => Date = () => new Date()) {
  return {
    mutationFn: () => markAllNotificationsAsRead(),
    onMutate: async (): Promise<Snapshot> => {
      const snap = await snapshot(qc);
      if (snap.list !== undefined) qc.setQueryData(notificationQueryKeys.list, markAllRead(snap.list, now().toISOString()));
      qc.setQueryData(notificationQueryKeys.unread, 0);
      return snap;
    },
    onError: (_err: unknown, _v: void, snap: Snapshot | undefined) => restore(qc, snap),
    onSettled: () => qc.invalidateQueries({ queryKey: notificationQueryKeys.all }),
  };
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation(markReadMutationOptions(qc));
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation(markAllReadMutationOptions(qc));
}

// ─── Pure cache helpers ──────────────────────────────────────────────────────

export function flattenNotificationPages(data: NotificationPages | undefined): NotificationItem[] {
  if (data === undefined) return [];
  const seen = new Set<string>();
  const out: NotificationItem[] = [];
  for (const page of data.pages) {
    for (const item of page.items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
  }
  return out;
}

function findNotification(data: NotificationPages | undefined, id: string): NotificationItem | undefined {
  return data?.pages.flatMap((p) => p.items).find((n) => n.id === id);
}

export function markOneRead(data: NotificationPages, id: string, readAt: string): NotificationPages {
  let changed = false;
  const pages = data.pages.map((page) => ({
    ...page,
    items: page.items.map((n) => {
      if (n.id !== id || n.readAt !== null) return n;
      changed = true;
      return { ...n, readAt };
    }),
  }));
  if (!changed) return data;
  return {
    ...data,
    pages: pages.map((p, i) => (i === 0 ? { ...p, unreadCount: Math.max(0, p.unreadCount - 1) } : p)),
  };
}

export function markAllRead(data: NotificationPages, readAt: string): NotificationPages {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      unreadCount: 0,
      items: page.items.map((n) => (n.readAt === null ? { ...n, readAt } : n)),
    })),
  };
}

// ─── IST day grouping ────────────────────────────────────────────────────────

/** Asia/Kolkata is a fixed UTC+05:30 (no DST), so no Intl/tz database is needed. */
const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function istDayNumber(ms: number): number {
  return Math.floor((ms + IST_OFFSET_MS) / DAY_MS);
}

export type NotificationSectionKey = 'today' | 'yesterday' | 'earlier';

export interface NotificationSection {
  key: NotificationSectionKey;
  items: NotificationItem[];
}

/**
 * Today / Yesterday / Earlier by the IST calendar day of `createdAt`. The API
 * lists unread first, so items are re-sorted newest-first inside each section.
 * Empty sections are omitted; an unparseable date lands in Earlier.
 */
export function groupByIstDay(items: readonly NotificationItem[], now: Date = new Date()): NotificationSection[] {
  const today = istDayNumber(now.getTime());
  const buckets: Record<NotificationSectionKey, NotificationItem[]> = { today: [], yesterday: [], earlier: [] };
  for (const item of items) {
    const ms = Date.parse(item.createdAt);
    const day = Number.isNaN(ms) ? Number.NEGATIVE_INFINITY : istDayNumber(ms);
    if (day >= today) buckets.today.push(item);
    else if (day === today - 1) buckets.yesterday.push(item);
    else buckets.earlier.push(item);
  }
  const byNewest = (a: NotificationItem, b: NotificationItem) =>
    (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0);
  return (['today', 'yesterday', 'earlier'] as const)
    .filter((key) => buckets[key].length > 0)
    .map((key) => ({ key, items: [...buckets[key]].sort(byNewest) }));
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Row timestamp in IST: "10:24 AM" for today/yesterday, "31 Oct 2026" for earlier. */
export function formatNotificationTime(createdAt: string, now: Date = new Date()): string {
  const ms = Date.parse(createdAt);
  if (Number.isNaN(ms)) return '';
  const ist = new Date(ms + IST_OFFSET_MS); // read with getUTC* = IST wall clock
  if (istDayNumber(ms) >= istDayNumber(now.getTime()) - 1) {
    const h24 = ist.getUTCHours();
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    const mm = String(ist.getUTCMinutes()).padStart(2, '0');
    return `${String(h12).padStart(2, '0')}:${mm} ${h24 < 12 ? 'AM' : 'PM'}`;
  }
  return `${ist.getUTCDate()} ${MONTHS[ist.getUTCMonth()] ?? ''} ${ist.getUTCFullYear()}`;
}

// ─── Kind / icon / deep link ─────────────────────────────────────────────────

export type NotificationKind =
  | 'order'
  | 'order_dispatched'
  | 'wallet_credit'
  | 'wallet_debit'
  | 'wallet'
  | 'support'
  | 'return'
  | 'general';

type NotificationData = Record<string, unknown> | null | undefined;

function str(data: NotificationData, key: string): string | null {
  const v = data?.[key];
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null;
}

function eventName(data: NotificationData): string | null {
  const v = str(data, 'event') ?? str(data, 'type') ?? str(data, 'kind') ?? str(data, 'templateCode');
  return v === null ? null : v.toLowerCase().replace(/_/g, '.');
}

/** What a notification is about, derived from `data` (see the file docblock). */
export function notificationKind(data: NotificationData): NotificationKind {
  const ev = eventName(data);
  if (ev !== null) {
    if (ev.startsWith('return') || ev.startsWith('refund')) return 'return';
    if (ev.startsWith('support') || ev.startsWith('ticket')) return 'support';
    if (ev === 'wallet.credited') return 'wallet_credit';
    if (ev === 'wallet.debited') return 'wallet_debit';
    if (ev.startsWith('wallet') || ev.startsWith('topup')) return 'wallet';
    if (ev === 'order.dispatched' || ev === 'order.out.for.delivery') return 'order_dispatched';
    if (ev.startsWith('order')) return 'order';
  }
  if (str(data, 'returnId') !== null) return 'return';
  if (str(data, 'ticketId') !== null) return 'support';
  if (str(data, 'orderId') !== null) return 'order';
  if (str(data, 'balance') !== null || str(data, 'topupId') !== null) return 'wallet';
  return 'general';
}

export type NotificationTargetScreen = 'OrderTracking' | 'CustomerWallet' | 'TrackSupportRequest' | 'OrderHistory';

export interface NotificationTarget {
  screen: NotificationTargetScreen;
  params?: Record<string, unknown>;
}

/**
 * Where tapping a notification (in the list, or an opened push) should go.
 * Pure: works on the list's `data` and on FCM's string-only `data`.
 * Unknown payloads -> null (stay put).
 */
export function notificationTarget(data: NotificationData): NotificationTarget | null {
  switch (notificationKind(data)) {
    case 'return':
      return { screen: 'OrderHistory' };
    case 'support': {
      const ticketId = str(data, 'ticketId');
      return ticketId === null ? null : { screen: 'TrackSupportRequest', params: { ticketId } };
    }
    case 'order':
    case 'order_dispatched': {
      const orderId = str(data, 'orderId');
      return orderId === null ? { screen: 'OrderHistory' } : { screen: 'OrderTracking', params: { orderId } };
    }
    case 'wallet':
    case 'wallet_credit':
    case 'wallet_debit':
      return { screen: 'CustomerWallet' };
    default:
      return null;
  }
}
