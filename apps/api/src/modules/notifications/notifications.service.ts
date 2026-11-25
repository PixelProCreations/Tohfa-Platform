import { changedFields, writeAuditLog } from '../../audit/auditLog.js';
import type { Actor } from '../../auth/requireAuth.js';
import { pool, withTransaction } from '../../db/pool.js';
import { eventBus, type DomainEventName, type DomainEvents, type EventBus } from '../../events/bus.js';
import { AppError } from '../../http/problem.js';
import { logger } from '../../logger.js';
import type { ResolvedScope } from '../../rbac/requirePermission.js';
import {
  notificationsRepo,
  type NotificationRow,
  type NotificationTemplateAdminRow,
  type NotificationsRepo,
} from './notifications.repo.js';
import type {
  ListNotificationTemplatesQuery,
  ListNotificationsQuery,
  RegisterDeviceTokenBody,
  UpdateNotificationTemplateBody,
} from './notifications.schema.js';
// Read-only, pool-level lookup from a sibling module's repo (not its routes or
// service), so there is no import cycle and no layering inversion: the
// dispatcher only needs "is this category on for this user".
import {
  notificationPreferencesRepo,
  type NotificationPreferencesRepo,
} from '../notification-preferences/notification-preferences.repo.js';
import type { NotificationCategory } from '../notification-preferences/notification-preferences.schema.js';

export const EVENT_TEMPLATE_MAP: Record<DomainEventName, string> = {
  'farmer.application.approved': 'FARMER_APP_APPROVED',
  'farmer.application.rejected': 'FARMER_APP_REJECTED',
  'farmer.application.info_requested': 'FARMER_APP_INFO_REQUESTED',
  'counter_offer.received': 'COUNTER_OFFER_RECEIVED',
  'counter_offer.expiring': 'COUNTER_OFFER_EXPIRING',
  'goods.received': 'GOODS_RECEIVED',
  'payout.released': 'PAYOUT_RELEASED',
  'payout.rejected': 'PAYOUT_REJECTED',
  'payout.intimated': 'PAYOUT_INTIMATED',
  'order.confirmed': 'ORDER_CONFIRMED',
  'order.dispatched': 'ORDER_DISPATCHED',
  'order.delivered': 'ORDER_DELIVERED',
  'order.cancelled': 'ORDER_CANCELLED',
  'wallet.credited': 'WALLET_CREDITED',
  'wallet.debited': 'WALLET_DEBITED',
};

/**
 * BR-52: which Settings notification category (farmer app screen 73) gates
 * each event. Only events that genuinely belong to a category are listed;
 * every other event (application status, goods received, customer orders) is
 * always-on and never consults preferences. WEATHER, FARM and COMMUNITY have
 * no producing events yet, so they have no entries here.
 */
export const EVENT_CATEGORY_MAP: Partial<Record<DomainEventName, NotificationCategory>> = {
  'counter_offer.received': 'MARKETING',
  'counter_offer.expiring': 'MARKETING',
  'payout.released': 'PAYROLL',
  'payout.rejected': 'PAYROLL',
  'payout.intimated': 'PAYROLL',
  'wallet.credited': 'PAYROLL',
  'wallet.debited': 'PAYROLL',
};

/**
 * BR-185: events that also go out by EMAIL (data table, edit to change).
 * `transactional` events are always emailed (BR-52/BR-65); the rest honour the
 * BR-52 category opt-out like push.
 */
export const EVENT_EMAIL_MAP: Partial<Record<DomainEventName, { transactional: boolean }>> = {
  'order.confirmed': { transactional: true },
  'order.dispatched': { transactional: true },
  'order.delivered': { transactional: true },
  'wallet.credited': { transactional: true },
  'wallet.debited': { transactional: true },
  'counter_offer.received': { transactional: false },
  'counter_offer.expiring': { transactional: false },
  'payout.released': { transactional: false },
  'payout.intimated': { transactional: false },
  'farmer.application.approved': { transactional: false },
  'farmer.application.rejected': { transactional: false },
  'farmer.application.info_requested': { transactional: false },
};

export type CategoryPreferenceLookup = Pick<NotificationPreferencesRepo, 'isCategoryEnabled'>;

export function interpolateTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const val = data[key];
    if (val === undefined || val === null) return '';
    return String(val);
  });
}

function mapNotificationResponse(row: NotificationRow) {
  return {
    id: row.id,
    channel: row.channel,
    title: row.title,
    body: row.body,
    locale: row.locale,
    data: row.data,
    readAt: row.read_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
  };
}

export const KNOWN_TEMPLATE_PLACEHOLDERS: Record<string, readonly string[]> = {
  FARMER_APP_APPROVED: ['applicationId', 'tohfaFarmerId'],
  FARMER_APP_REJECTED: ['applicationId', 'reason'],
  FARMER_APP_INFO_REQUESTED: ['applicationId', 'message'],
  COUNTER_OFFER_RECEIVED: ['listingId', 'offerPrice', 'originalPrice'],
  COUNTER_OFFER_EXPIRING: ['listingId', 'hoursRemaining'],
  GOODS_RECEIVED: ['grnNumber', 'quantityKg', 'produceName'],
  PAYOUT_RELEASED: ['amount', 'reference'],
  PAYOUT_REJECTED: ['amount', 'reference', 'reason'],
  PAYOUT_INTIMATED: ['amount', 'reference', 'note'],
  ORDER_CONFIRMED: ['orderNumber', 'totalAmount'],
  ORDER_DISPATCHED: ['orderNumber'],
  ORDER_DELIVERED: ['orderNumber'],
  WALLET_CREDITED: ['amount', 'reference', 'balance'],
  WALLET_DEBITED: ['amount', 'reference', 'balance'],
};

function extractValidPlaceholders(text: string): string[] {
  const keys: string[] = [];
  for (const m of text.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)) {
    if (m[1] !== undefined) keys.push(m[1]);
  }
  return keys;
}

function allowedPlaceholdersFor(row: Pick<NotificationTemplateAdminRow, 'code' | 'subject' | 'body_template'>): string[] {
  const known = KNOWN_TEMPLATE_PLACEHOLDERS[row.code];
  if (known !== undefined) return [...known];
  return Array.from(new Set([...extractValidPlaceholders(row.subject ?? ''), ...extractValidPlaceholders(row.body_template)]));
}

function validateTemplateTextPlaceholders(field: string, text: string, allowed: readonly string[]): void {
  const found: string[] = [];
  const stripped = text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    found.push(key);
    return '';
  });
  if (stripped.includes('{') || stripped.includes('}')) {
    throw new AppError('VALIDATION_FAILED', {
      status: 422,
      detail: 'Malformed template placeholder syntax.',
      errors: { [field]: ['Malformed placeholder syntax. Use {{placeholderName}}.'] },
    });
  }
  const allowedSet = new Set(allowed);
  const unknown = found.filter((key) => !allowedSet.has(key));
  if (unknown.length > 0) {
    throw new AppError('VALIDATION_FAILED', {
      status: 422,
      detail: `Unknown placeholder(s): ${unknown.join(', ')}.`,
      errors: {
        [field]: [`Unknown placeholder(s): ${unknown.join(', ')}. Allowed: ${allowed.join(', ') || 'none'}`],
      },
    });
  }
}

export interface NotificationTemplateResponse {
  id: string;
  code: string;
  channel: string;
  locale: 'en' | 'ta';
  subject: string | null;
  bodyTemplate: string;
  isActive: boolean;
  allowedPlaceholders: string[];
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
}

function mapTemplateResponse(row: NotificationTemplateAdminRow): NotificationTemplateResponse {
  return {
    id: row.id,
    code: row.code,
    channel: row.channel,
    locale: row.locale,
    subject: row.subject,
    bodyTemplate: row.body_template,
    isActive: row.is_active,
    allowedPlaceholders: allowedPlaceholdersFor(row),
    updatedBy: row.updated_by,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at?.toISOString() ?? null,
  };
}

import { enqueue } from '../../jobs/queue.js';

export interface NotificationsService {
  listMyNotifications(actor: Actor, query: ListNotificationsQuery): Promise<unknown>;
  markAsRead(actor: Actor, id: string): Promise<unknown>;
  getMyNotification(actor: Actor, id: string): Promise<unknown>;
  markAllAsRead(actor: Actor): Promise<{ updated: number }>;
  registerDeviceToken(actor: Actor, input: RegisterDeviceTokenBody): Promise<unknown>;
  revokeDeviceToken(actor: Actor, token: string): Promise<unknown>;
  handleDomainEvent<E extends DomainEventName>(
    eventName: E,
    payload: DomainEvents[E],
  ): Promise<NotificationRow | null>;
  listTemplates(scope: ResolvedScope, query: ListNotificationTemplatesQuery): Promise<{ items: NotificationTemplateResponse[] }>;
  getTemplate(scope: ResolvedScope, id: string): Promise<NotificationTemplateResponse>;
  updateTemplate(
    scope: ResolvedScope,
    id: string,
    body: UpdateNotificationTemplateBody,
  ): Promise<NotificationTemplateResponse>;
}

export function createNotificationsService(
  repo: NotificationsRepo = notificationsRepo,
  preferences: CategoryPreferenceLookup = notificationPreferencesRepo,
): NotificationsService {
  return {
    async listMyNotifications(actor, query) {
      const { items, nextCursor, hasMore, unreadCount } = await repo.listByUserId(
        pool,
        actor.userId,
        {
          limit: query.limit,
          cursor: query.cursor,
          unreadOnly: query.unreadOnly,
        },
      );

      return {
        items: items.map(mapNotificationResponse),
        page: { nextCursor, hasMore },
        unreadCount,
      };
    },

    async markAsRead(actor, id) {
      const updated = await repo.markAsRead(pool, id, actor.userId);
      if (updated === null) {
        throw new AppError('NOT_FOUND', { detail: 'Notification not found.' });
      }
      return mapNotificationResponse(updated);
    },

    async getMyNotification(actor, id) {
      const row = await repo.findOwnById(pool, id, actor.userId);
      if (row === null) {
        throw new AppError('NOT_FOUND', { detail: 'Notification not found.' });
      }
      return mapNotificationResponse(row);
    },

    async markAllAsRead(actor) {
      return { updated: await repo.markAllAsRead(pool, actor.userId) };
    },

    async registerDeviceToken(actor, input) {
      const row = await repo.registerDeviceToken(pool, {
        userId: actor.userId,
        token: input.token,
        platform: input.platform,
        app: input.app,
        locale: input.locale,
      });

      return {
        id: row.id,
        token: row.token,
        platform: row.platform,
        app: row.app,
        locale: row.locale,
        revoked: row.revoked,
        lastSeen: row.last_seen.toISOString(),
      };
    },

    async revokeDeviceToken(actor, token) {
      const revoked = await repo.revokeDeviceToken(pool, token, actor.userId);
      return { success: revoked };
    },

    async handleDomainEvent(eventName, payload) {
      const templateCode = EVENT_TEMPLATE_MAP[eventName];
      if (!templateCode) return null;

      const userId = (payload as { userId?: string }).userId;
      if (!userId) return null;

      // BR-52: a category the user switched off suppresses the PUSH alert only
      // (screen-73 spec: "stops push alerts for that category only"). The
      // IN_APP row that feeds the Notifications Center and the SMS row are
      // still created, so badges and history elsewhere stay untouched.
      const category = EVENT_CATEGORY_MAP[eventName];
      const pushSuppressed =
        category !== undefined && !(await preferences.isCategoryEnabled(pool, userId, category));

      const locale = await repo.getUserPreferredLocale(pool, userId);
      const template = await repo.findTemplate(pool, templateCode, 'IN_APP', locale);

      if (!template) {
        logger.warn(
          { templateCode, locale, eventName },
          'notification template not found; skipping in-app delivery',
        );
        return null;
      }

      const rawData = payload as unknown as Record<string, unknown>;
      const title = template.subject ? interpolateTemplate(template.subject, rawData) : null;
      const body = interpolateTemplate(template.body_template, rawData);

      // Construct deduplication key for idempotent delivery
      const dedupeEntityId =
        rawData['intimationId'] ??
        rawData['applicationId'] ??
        rawData['orderId'] ??
        rawData['listingId'] ??
        rawData['payoutId'] ??
        rawData['grnNumber'] ??
        rawData['reference'] ??
        '';

      const dedupeKey = `${eventName}:${userId}:${dedupeEntityId}`;

      // 1. Create In-App Notification
      const inAppRow = await repo.createNotification(pool, {
        userId,
        templateId: template.id,
        channel: 'IN_APP',
        title,
        body,
        locale: template.locale,
        data: rawData,
        dedupeKey: `in_app:${dedupeKey}`,
      });

      // 2. Queue Push Notification (if device tokens or push template exist),
      //    unless the user disabled this event's category (BR-52).
      if (pushSuppressed) {
        logger.debug(
          { eventName, category, userId },
          'notification category disabled by user preference; skipping push',
        );
      } else {
        try {
          const pushTemplate = (await repo.findTemplate(pool, templateCode, 'PUSH', locale)) ?? template;
          const pushTitle = pushTemplate.subject ? interpolateTemplate(pushTemplate.subject, rawData) : title;
          const pushBody = interpolateTemplate(pushTemplate.body_template, rawData);

          const pushRow = await repo.createNotification(pool, {
            userId,
            templateId: pushTemplate.id,
            channel: 'PUSH',
            title: pushTitle,
            body: pushBody,
            locale: pushTemplate.locale,
            data: rawData,
            dedupeKey: `push:${dedupeKey}`,
          });

          if (pushRow) {
            await enqueue('notification-dispatch', {
              notificationId: pushRow.id,
              channel: 'PUSH',
              userId,
              templateCode,
              title: pushTitle,
              body: pushBody,
              locale: pushTemplate.locale,
              data: rawData,
              dedupeKey: `push:${dedupeKey}`,
            });
          }
        } catch (err) {
          logger.warn({ err, userId, eventName }, 'failed to queue push notification dispatch job');
        }
      }

      // 3. Queue SMS Notification (if SMS template exists or transaction alert)
      try {
        const smsTemplate = await repo.findTemplate(pool, templateCode, 'SMS', locale);
        if (smsTemplate || eventName === 'wallet.credited' || eventName === 'order.confirmed') {
          const activeSmsTemplate = smsTemplate ?? template;
          const smsBody = interpolateTemplate(activeSmsTemplate.body_template, rawData);

          const smsRow = await repo.createNotification(pool, {
            userId,
            templateId: activeSmsTemplate.id,
            channel: 'SMS',
            title: null,
            body: smsBody,
            locale: activeSmsTemplate.locale,
            data: rawData,
            dedupeKey: `sms:${dedupeKey}`,
          });

          if (smsRow) {
            await enqueue('notification-dispatch', {
              notificationId: smsRow.id,
              channel: 'SMS',
              userId,
              templateCode,
              title: null,
              body: smsBody,
              locale: activeSmsTemplate.locale,
              data: rawData,
              dedupeKey: `sms:${dedupeKey}`,
            });
          }
        }
      } catch (err) {
        logger.warn({ err, userId, eventName }, 'failed to queue SMS notification dispatch job');
      }

      // 4. Queue EMAIL (BR-185). Recipient/verification is resolved in the job.
      const emailRule = EVENT_EMAIL_MAP[eventName];
      if (emailRule && (emailRule.transactional || !pushSuppressed)) {
        try {
          const emailTemplate = (await repo.findTemplate(pool, templateCode, 'EMAIL', locale)) ?? template;
          const emailTitle = emailTemplate.subject
            ? interpolateTemplate(emailTemplate.subject, rawData)
            : title;
          const emailBody = interpolateTemplate(emailTemplate.body_template, rawData);
          const emailRow = await repo.createNotification(pool, {
            userId,
            templateId: emailTemplate.id,
            channel: 'EMAIL',
            title: emailTitle,
            body: emailBody,
            locale: emailTemplate.locale,
            data: rawData,
            dedupeKey: `email:${dedupeKey}`,
          });
          if (emailRow) {
            await enqueue('notification-dispatch', {
              notificationId: emailRow.id,
              channel: 'EMAIL',
              userId,
              templateCode,
              title: emailTitle,
              body: emailBody,
              locale: emailTemplate.locale,
              dedupeKey: `email:${dedupeKey}`,
            });
          }
        } catch (err) {
          logger.warn({ err, userId, eventName }, 'failed to queue email notification dispatch job');
        }
      }

      return inAppRow;
    },

    async listTemplates(_scope, query) {
      const rows = await repo.listTemplates(pool, {
        code: query.code,
        channel: query.channel,
        locale: query.locale,
        isActive: query.isActive,
      });
      return { items: rows.map(mapTemplateResponse) };
    },

    async getTemplate(_scope, id) {
      const row = await repo.findTemplateById(pool, id);
      if (row === null) {
        throw new AppError('NOT_FOUND', { detail: 'Notification template not found.' });
      }
      return mapTemplateResponse(row);
    },

    async updateTemplate(scope, id, body) {
      return withTransaction(async (tx) => {
        const before = await repo.findTemplateById(tx, id, true);
        if (before === null) {
          throw new AppError('NOT_FOUND', { detail: 'Notification template not found.' });
        }

        const allowed = allowedPlaceholdersFor(before);
        if (body.subject !== undefined && body.subject !== null) {
          validateTemplateTextPlaceholders('body.subject', body.subject, allowed);
        }
        if (body.bodyTemplate !== undefined) {
          validateTemplateTextPlaceholders('body.bodyTemplate', body.bodyTemplate, allowed);
        }

        const afterRow = await repo.updateTemplate(tx, id, {
          subject: body.subject,
          bodyTemplate: body.bodyTemplate,
          isActive: body.isActive,
          updatedBy: scope.userId,
        });
        if (afterRow === null) {
          throw new AppError('NOT_FOUND', { detail: 'Notification template not found.' });
        }

        const beforeView = mapTemplateResponse(before);
        const afterView = mapTemplateResponse(afterRow);
        await writeAuditLog(tx, {
          actorId: scope.userId,
          actorRole: scope.roleCode,
          actionCode: 'notification.template.configure',
          entityType: 'notification_template',
          entityId: id,
          before: beforeView,
          after: afterView,
          changedFields: changedFields({ ...beforeView }, { ...afterView }),
        });
        return afterView;
      });
    },
  };
}

export const notificationsService = createNotificationsService();

/**
 * Registers notification subscribers for all 11 golden-thread domain events.
 */
export function registerNotificationSubscribers(
  bus: EventBus = eventBus,
  service: NotificationsService = notificationsService,
): () => void {
  const unsubs: Array<() => void> = [];

  const eventNames = Object.keys(EVENT_TEMPLATE_MAP) as DomainEventName[];
  for (const eventName of eventNames) {
    const unsub = bus.subscribe(eventName, async (payload) => {
      await service.handleDomainEvent(eventName, payload);
    });
    unsubs.push(unsub);
  }

  return () => {
    for (const unsub of unsubs) unsub();
  };
}

// Auto-register on load
registerNotificationSubscribers();
