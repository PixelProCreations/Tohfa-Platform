/**
 * The signed-in admin's own notifications and the system messages visible to
 * them (docs/openapi.yaml: /notifications, /system-messages; BR-65).
 *
 * Both are "own" data: the server takes the owner from the access token, so
 * nothing here sends a user or warehouse id. Marking read moves no money and a
 * replay is a no-op on the server, so these writes send no Idempotency-Key.
 *
 * No UI imports, so the Main Warehouse admin can reuse this module.
 */
import type { GenericProblemCode } from '@tohfa/shared-types';
import type { Page } from '../../../shell/api/pagination';
import { adminGet, adminPost } from './http';

/** docs/openapi.yaml `Locale`. */
export type ApiLocale = 'en' | 'ta';

/** docs/openapi.yaml `Notification.channel`. */
export type NotificationChannel = 'PUSH' | 'SMS' | 'EMAIL' | 'IN_APP';

/** docs/openapi.yaml `Notification`. Required by the spec: id, title, body, createdAt. */
export interface NotificationDto {
  id: string;
  channel?: NotificationChannel | undefined;
  /**
   * The spec says string, but the server's own schema
   * (apps/api/src/modules/notifications/notifications.schema.ts) allows null
   * when a template has no subject, so the app must not trust it to be set.
   */
  title: string | null;
  body: string;
  locale?: ApiLocale | undefined;
  /** Deep-link payload: free-form. Today the server copies the domain event payload here. */
  data?: Record<string, unknown> | undefined;
  readAt?: string | null | undefined;
  createdAt: string;
}

/** GET /notifications: a cursor page plus the caller's unread total. */
export interface NotificationList extends Page<NotificationDto> {
  unreadCount: number;
}

export interface ListNotificationsParams {
  cursor?: string | undefined;
  /** 1-100, server default 20. */
  limit?: number | undefined;
  unreadOnly?: boolean | undefined;
}

/** POST /notifications/read-all. */
export interface MarkAllReadResult {
  updated: number;
}

/** docs/openapi.yaml `SystemMessage`. Carries no warehouse, zone or role id. */
export interface SystemMessageDto {
  id: string;
  scope: 'SYSTEM_WIDE' | 'WAREHOUSE' | 'ROLE';
  title: string;
  body: string;
  locale: ApiLocale;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
}

/** `status` of GET /system-messages; the message history is `read`. */
export type SystemMessageStatus = 'unread' | 'read' | 'all';

export interface ListSystemMessagesParams {
  cursor?: string | undefined;
  limit?: number | undefined;
  status?: SystemMessageStatus | undefined;
}

/** Problem codes these endpoints document (401, 404, 422, 500). */
export const ERROR_CODES: readonly GenericProblemCode[] = ['UNAUTHENTICATED', 'NOT_FOUND', 'VALIDATION_FAILED', 'INTERNAL'];

export function listNotifications(params: ListNotificationsParams = {}, signal?: AbortSignal): Promise<NotificationList> {
  return adminGet<NotificationList>(
    '/notifications',
    {
      cursor: params.cursor,
      limit: params.limit,
      // false is the server default, so it is simply not sent.
      unreadOnly: params.unreadOnly === true ? true : undefined,
    },
    signal,
  );
}

/** Marks one own notification read (BR-65): only this id, nothing else. */
export function markNotificationRead(id: string): Promise<NotificationDto> {
  return adminPost<NotificationDto>(`/notifications/${encodeURIComponent(id)}/read`, undefined);
}

/** Marks every own unread notification read (BR-65). The server picks the rows; no ids are sent. */
export function markAllNotificationsRead(): Promise<MarkAllReadResult> {
  return adminPost<MarkAllReadResult>('/notifications/read-all', undefined);
}

export function listSystemMessages(params: ListSystemMessagesParams = {}, signal?: AbortSignal): Promise<Page<SystemMessageDto>> {
  return adminGet<Page<SystemMessageDto>>(
    '/system-messages',
    { cursor: params.cursor, limit: params.limit, status: params.status },
    signal,
  );
}

/** Records that the caller read one visible system message (BR-65; per user, first readAt kept). */
export function markSystemMessageRead(id: string): Promise<SystemMessageDto> {
  return adminPost<SystemMessageDto>(`/system-messages/${encodeURIComponent(id)}/read`, undefined);
}
