/**
 * API rows -> the notification and alert UI types (./types.ts).
 *
 * Pure, with `now` passed in, so plain-Node vitest covers every branch
 * (../../../tests/mappers_notifications.test.ts). Dates go through the admin
 * IST formatters, never the device time zone; words come from the admin i18n
 * catalogue.
 *
 * What the API does not carry is not invented:
 *  - a notification has no category, tag or reference field. The server copies
 *    the domain event payload into `data` (apps/api/src/modules/notifications/
 *    notifications.service.ts), so the category is read from `data.refType`
 *    when present, else from the event keys it is known to carry (orderId,
 *    grnNumber), else it is the neutral 'message'. A target is set only for a
 *    category whose screen the app has.
 *  - an alert has no kind, priority or read state, so those get fixed neutral
 *    values and the screen hides the filters that would rely on them.
 */
import type { AlertItemDto, AlertType, WorklistParams, WorklistRefType } from '../../../api/alerts';
import type { NotificationDto, SystemMessageDto } from '../../../api/notifications';
import { hasKey, t, type TranslationKey } from '../../../i18n';
import { formatKg, parseKgToGrams } from '../../../money/quantity';
import { formatAdminDate, formatAdminDay, formatAdminTime, relativeTime } from '../../../utils/datetime';
import type {
  AlertRecordTarget,
  ApprovalAlertItem,
  NotificationCategory,
  NotificationItem,
  NotificationTarget,
  SystemMessageRow,
} from './types';

/** The category a notification falls back to when `data` says nothing the app knows. */
export const NEUTRAL_CATEGORY: NotificationCategory = 'message';

/** docs/openapi.yaml WorklistRefType -> category. WAREHOUSE has no notification category of its own. */
const REF_TYPE_CATEGORY: Record<WorklistRefType, NotificationCategory | undefined> = {
  ORDER: 'order',
  GOODS_RECEIPT: 'received',
  RETURN_REQUEST: 'returns',
  INVENTORY_BATCH: 'inventory',
  WAREHOUSE: undefined,
};

/**
 * Domain-event payload keys (apps/api/src/events/bus.ts) that name a record,
 * in priority order. `reference` and `amount` are left out: payouts and wallet
 * credits both carry them, so they do not identify a category.
 */
const EVENT_KEY_CATEGORY: readonly (readonly [string, NotificationCategory])[] = [
  ['orderId', 'order'],
  ['orderNumber', 'order'],
  ['grnNumber', 'received'],
];

/** The screen each derived category opens (only categories the app has a screen for). */
const CATEGORY_TARGET: Partial<Record<NotificationCategory, NotificationTarget>> = {
  order: 'Orders',
  received: 'Receiving',
  returns: 'Returns',
  inventory: 'Stock',
};

/** Human record numbers in `data`, in priority order (never a uuid). */
const REFERENCE_KEYS = ['orderNumber', 'grnNumber'] as const;

function isRefType(value: unknown): value is WorklistRefType {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(REF_TYPE_CATEGORY, value);
}

/** The category `data` points at, or NEUTRAL_CATEGORY. */
export function notificationCategoryOf(data: Record<string, unknown> | undefined): NotificationCategory {
  if (data === undefined) return NEUTRAL_CATEGORY;
  const refType = data['refType'];
  if (isRefType(refType)) return REF_TYPE_CATEGORY[refType] ?? NEUTRAL_CATEGORY;
  if (refType !== undefined) return NEUTRAL_CATEGORY;
  for (const [key, category] of EVENT_KEY_CATEGORY) {
    if (data[key] !== undefined && data[key] !== null) return category;
  }
  return NEUTRAL_CATEGORY;
}

function referenceOf(data: Record<string, unknown> | undefined): string | undefined {
  if (data === undefined) return undefined;
  for (const key of REFERENCE_KEYS) {
    const value = data[key];
    if (typeof value === 'string' && value !== '') return value;
  }
  return undefined;
}

export function toNotificationItem(dto: NotificationDto, now: Date): NotificationItem {
  const category = notificationCategoryOf(dto.data);
  const target = CATEGORY_TARGET[category];
  const reference = referenceOf(dto.data);
  return {
    id: dto.id,
    category,
    title: dto.title ?? '',
    message: dto.body,
    timestamp: relativeTime(dto.createdAt, now),
    isRead: dto.readAt !== null && dto.readAt !== undefined,
    date: formatAdminDate(dto.createdAt, now),
    ...(reference === undefined ? {} : { reference }),
    ...(target === undefined ? {} : { target }),
  };
}

/** A system message (announcement) as a 'system' row, dated by when it starts showing. */
export function toSystemMessageItem(dto: SystemMessageDto, now: Date): NotificationItem {
  return {
    id: dto.id,
    category: 'system',
    title: dto.title,
    message: dto.body,
    timestamp: relativeTime(dto.startsAt, now),
    isRead: dto.isRead,
    date: formatAdminDate(dto.startsAt, now),
  };
}

// ─── System Messages (M13-04) ────────────────────────────────────────────────

/**
 * docs/rbac.json codes the system-message endpoints declare. There is no
 * dedicated system-message code, so the API reuses the own-notification ones
 * (docs/openapi.yaml "INTERIM permission", BR-65).
 */
export const SYSTEM_MESSAGE_CODES = {
  view: 'notification.own.view',
  markRead: 'notification.own.mark_read',
} as const;

/** Whether to offer the System Messages entry and its mark-read (display only; the server checks again). */
export function systemMessageAccess(can: (code: string) => boolean): { view: boolean; markRead: boolean } {
  const view = can(SYSTEM_MESSAGE_CODES.view);
  return { view, markRead: view && can(SYSTEM_MESSAGE_CODES.markRead) };
}

/**
 * When the message applies, in IST: "08:00 PM – 09:00 PM" on one day, the end
 * day added when it ends on a later day, "From 08:00 PM" with no end.
 */
export function systemMessageWindow(startsAt: string, endsAt: string | null): string {
  const from = formatAdminTime(startsAt);
  if (endsAt === null) return t('systemMessages.window.openEnded', { from });
  const endTime = formatAdminTime(endsAt);
  const endDay = formatAdminDay(endsAt);
  const to = endDay === formatAdminDay(startsAt) ? endTime : t('datetime.dayAndTime', { day: endDay, time: endTime });
  return t('systemMessages.window.range', { from, to });
}

/** A system message as the M13-04 list shows it: only fields the API carries (no type, no scope). */
export function toSystemMessageRow(dto: SystemMessageDto): SystemMessageRow {
  return {
    id: dto.id,
    title: dto.title,
    message: dto.body,
    isRead: dto.isRead,
    date: formatAdminDay(dto.startsAt),
    window: systemMessageWindow(dto.startsAt, dto.endsAt),
  };
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

/** Title key and related record of each alert type the app knows. */
const ALERT_LOOK: Record<AlertType, { title: TranslationKey; record?: AlertRecordTarget }> = {
  BATCH_NEAR_EXPIRY: { title: 'alert.batch_near_expiry.title' },
  LOW_STOCK: { title: 'alert.low_stock.title', record: 'LowStock' },
  CAPACITY_NEAR_FULL: { title: 'alert.capacity_near_full.title' },
};

function isAlertType(value: string): value is AlertType {
  return Object.prototype.hasOwnProperty.call(ALERT_LOOK, value);
}

/**
 * One param as display text: `...Kg` quantities as "1,250 kg", `expiryOn` as
 * an IST day. A value that does not parse is shown as sent (never NaN).
 */
function formatParam(key: string, value: WorklistParams[string] | undefined): string {
  if (value === null || value === undefined) return '';
  if (typeof value !== 'string') return String(value);
  if (key.endsWith('Kg')) {
    const grams = parseKgToGrams(value);
    return grams === null ? value : formatKg(grams);
  }
  if (key === 'expiryOn') {
    const day = formatAdminDay(value);
    return day === '' ? value : day;
  }
  return value;
}

function displayParams(params: WorklistParams): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) out[key] = formatParam(key, value);
  return out;
}

/** The alert's message: its own key when the catalogue has it, else the generic text. */
function alertMessage(dto: AlertItemDto): string {
  const key = dto.messageKey;
  if (key.startsWith('alert.') && hasKey(key)) return t(key, displayParams(dto.params));
  return t('alert.unknown.message');
}

export function toApprovalAlertItem(dto: AlertItemDto, now: Date): ApprovalAlertItem {
  const look = isAlertType(dto.type) ? ALERT_LOOK[dto.type] : undefined;
  const batchCode = dto.params['batchCode'];
  const snoozedUntil =
    dto.state === 'SNOOZED' && dto.snoozedUntil !== null ? formatAdminDate(dto.snoozedUntil, now) : undefined;
  return {
    id: dto.itemKey,
    // No API source for these: alerts carry no kind, severity or read state.
    kind: 'exception',
    critical: false,
    isRead: false,
    status: 'open',
    title: t(look?.title ?? 'alert.unknown.title'),
    reference: typeof batchCode === 'string' ? batchCode : '',
    detail: alertMessage(dto),
    timestamp: dto.since === null ? '' : relativeTime(dto.since, now),
    warehouseId: dto.warehouseId,
    ...(look?.record === undefined ? {} : { record: look.record }),
    ...(snoozedUntil === undefined || snoozedUntil === '' ? {} : { snoozedUntil }),
  };
}
