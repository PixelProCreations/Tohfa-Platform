import type { Actor } from '../../auth/requireAuth.js';
import { pool } from '../../db/pool.js';
import { eventBus, type DomainEventName, type DomainEvents, type EventBus } from '../../events/bus.js';
import { AppError } from '../../http/problem.js';
import { logger } from '../../logger.js';
import {
  notificationsRepo,
  type NotificationRow,
  type NotificationsRepo,
} from './notifications.repo.js';
import type { ListNotificationsQuery } from './notifications.schema.js';
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
  'order.confirmed': 'ORDER_CONFIRMED',
  'order.dispatched': 'ORDER_DISPATCHED',
  'order.delivered': 'ORDER_DELIVERED',
  'wallet.credited': 'WALLET_CREDITED',
};

/**
 * BR-48: which Settings notification category (farmer app screen 73) gates
 * each event. Only events that genuinely belong to a category are listed;
 * every other event (application status, goods received, customer orders) is
 * always-on and never consults preferences. WEATHER, FARM and COMMUNITY have
 * no producing events yet, so they have no entries here.
 */
export const EVENT_CATEGORY_MAP: Partial<Record<DomainEventName, NotificationCategory>> = {
  'counter_offer.received': 'MARKETING',
  'counter_offer.expiring': 'MARKETING',
  'payout.released': 'PAYROLL',
  'wallet.credited': 'PAYROLL',
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

import type { RegisterDeviceTokenBody } from './notifications.schema.js';
import { enqueue } from '../../jobs/queue.js';

export interface NotificationsService {
  listMyNotifications(actor: Actor, query: ListNotificationsQuery): Promise<unknown>;
  markAsRead(actor: Actor, id: string): Promise<unknown>;
  registerDeviceToken(actor: Actor, input: RegisterDeviceTokenBody): Promise<unknown>;
  revokeDeviceToken(actor: Actor, token: string): Promise<unknown>;
  handleDomainEvent<E extends DomainEventName>(
    eventName: E,
    payload: DomainEvents[E],
  ): Promise<NotificationRow | null>;
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

      // BR-48: a category the user switched off suppresses the PUSH alert only
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
      //    unless the user disabled this event's category (BR-48).
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

      return inAppRow;
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
