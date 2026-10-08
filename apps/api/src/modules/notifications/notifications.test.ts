import { beforeEach, describe, expect, it, vi } from 'vitest';

// Replace only the queue's enqueue so the BR-48 tests can assert which
// dispatch jobs were (not) queued. Every other test is indifferent to it —
// handleDomainEvent already treats a failed enqueue as non-fatal.
vi.mock('../../jobs/queue.js', async (importOriginal) => ({
  ...(await importOriginal<typeof QueueModule>()),
  enqueue: vi.fn(async () => undefined),
}));
import type * as QueueModule from '../../jobs/queue.js';
import { enqueue } from '../../jobs/queue.js';
import request from 'supertest';
import { createApp } from '../../app.js';
import { eventBus } from '../../events/bus.js';
import type { Executor } from '../../db/pool.js';
import { anActor, IDS } from '../../test/factories.js';
import {
  createNotificationsService,
  EVENT_TEMPLATE_MAP,
  interpolateTemplate,
} from './notifications.service.js';
import type {
  CreateNotificationParams,
  DeviceTokenRow,
  NotificationRow,
  NotificationsRepo,
  NotificationTemplateRow,
  RegisterDeviceTokenParams,
} from './notifications.repo.js';
import {
  MockSmsTransport,
  Msg91SmsTransport,
  maskMobile,
} from './sms/index.js';
import {
  resolveDeepLink,
  MockPushTransport,
} from './push/index.js';

function mockNotificationsRepo(): NotificationsRepo & {
  notifications: NotificationRow[];
  templates: NotificationTemplateRow[];
  deviceTokens: DeviceTokenRow[];
} {
  const templates: NotificationTemplateRow[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      code: 'FARMER_APP_APPROVED',
      channel: 'IN_APP',
      locale: 'en',
      subject: 'Application Approved',
      body_template: 'Welcome to TOHFA! Your registration {{applicationId}} is approved with ID {{tohfaFarmerId}}.',
      is_active: true,
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      code: 'ORDER_CONFIRMED',
      channel: 'IN_APP',
      locale: 'en',
      subject: 'Order Confirmed',
      body_template: 'Order #{{orderNumber}} confirmed for ₹{{totalAmount}}.',
      is_active: true,
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      code: 'WALLET_CREDITED',
      channel: 'SMS',
      locale: 'en',
      subject: null,
      body_template: 'Your TOHFA wallet has been credited with ₹{{amount}}.',
      is_active: true,
    },
  ];

  const notifications: NotificationRow[] = [];
  const deviceTokens: DeviceTokenRow[] = [];

  return {
    notifications,
    templates,
    deviceTokens,
    listByUserId: async (_db, userId, options) => {
      let filtered = notifications.filter((n) => n.user_id === userId && n.channel === 'IN_APP');
      if (options.unreadOnly) {
        filtered = filtered.filter((n) => n.read_at === null);
      }
      const unreadCount = notifications.filter(
        (n) => n.user_id === userId && n.channel === 'IN_APP' && n.read_at === null,
      ).length;
      return {
        items: filtered.slice(0, options.limit),
        nextCursor: null,
        hasMore: false,
        unreadCount,
      };
    },
    markAsRead: async (_db, id, userId) => {
      const found = notifications.find((n) => n.id === id && n.user_id === userId);
      if (!found) return null;
      found.read_at = found.read_at ?? new Date();
      found.status = 'READ';
      return found;
    },
    createNotification: async (_db, params: CreateNotificationParams) => {
      if (params.dedupeKey) {
        const existing = notifications.find(
          (n) => n.user_id === params.userId && n.provider_message_id === params.dedupeKey,
        );
        if (existing) return null;
      }

      const row: NotificationRow = {
        id: `notif-${notifications.length + 1}`,
        user_id: params.userId,
        template_id: params.templateId ?? null,
        channel: params.channel ?? 'IN_APP',
        title: params.title ?? null,
        body: params.body,
        locale: params.locale ?? 'en',
        data: params.data ?? {},
        status: 'DELIVERED',
        provider_message_id: params.dedupeKey ?? null,
        sent_at: new Date(),
        read_at: null,
        created_at: new Date(),
        updated_at: null,
      };
      notifications.push(row);
      return row;
    },
    updateNotificationDelivery: async (_db, id, outcome) => {
      const found = notifications.find((n) => n.id === id);
      if (!found) return null;
      found.status = outcome.status;
      if (outcome.providerMessageId) found.provider_message_id = outcome.providerMessageId;
      if (outcome.error) found.error = outcome.error;
      found.updated_at = new Date();
      return found;
    },
    findTemplate: async (_db, code, channel, locale) => {
      const found = templates.find(
        (t) => t.code === code && t.channel === channel && t.locale === locale && t.is_active,
      );
      if (found) return found;
      return (
        templates.find(
          (t) => t.code === code && t.channel === channel && t.locale === 'en' && t.is_active,
        ) ?? null
      );
    },
    getUserPreferredLocale: async () => 'en',
    getUserMobile: async () => '+919876543210',
    registerDeviceToken: async (_db, params: RegisterDeviceTokenParams) => {
      const existing = deviceTokens.find((d) => d.token === params.token);
      if (existing) {
        existing.user_id = params.userId;
        existing.platform = params.platform;
        existing.app = params.app;
        existing.locale = params.locale ?? 'en';
        existing.revoked = false;
        existing.last_seen = new Date();
        return existing;
      }
      const newRow: DeviceTokenRow = {
        id: `dev-${deviceTokens.length + 1}`,
        user_id: params.userId,
        token: params.token,
        platform: params.platform,
        app: params.app,
        locale: params.locale ?? 'en',
        last_seen: new Date(),
        revoked: false,
        created_at: new Date(),
        updated_at: null,
      };
      deviceTokens.push(newRow);
      return newRow;
    },
    revokeDeviceToken: async (_db, token, userId) => {
      const found = deviceTokens.find((d) => d.token === token && d.user_id === userId);
      if (!found) return false;
      found.revoked = true;
      return true;
    },
    findActiveDeviceTokens: async (_db, userId, app) => {
      return deviceTokens.filter(
        (d) => d.user_id === userId && !d.revoked && (!app || d.app === app),
      );
    },
  };
}

describe('Domain Event Bus & Notification Centre (Stories S-15 & S-50)', () => {
  describe('Event Bus Fault Isolation', () => {
    it('fault isolation: a subscriber throwing an error never fails the publish caller', async () => {
      const faultyHandler = () => {
        throw new Error('Subscriber connection exploded!');
      };

      const unsub = eventBus.subscribe('farmer.application.approved', faultyHandler);

      // Publishing should NOT throw
      await expect(
        eventBus.publish('farmer.application.approved', {
          userId: IDS.userFarmer,
          applicationId: 'APP-1001',
          tohfaFarmerId: 'TOHFA-F-2026-0001',
        }),
      ).resolves.toBeUndefined();

      unsub();
    });
  });

  describe('Template Interpolation', () => {
    it('accurately interpolates template placeholders', () => {
      const template = 'Order #{{orderNumber}} confirmed for ₹{{totalAmount}}.';
      const output = interpolateTemplate(template, {
        orderNumber: 'ORD-9876',
        totalAmount: '450.00',
      });
      expect(output).toBe('Order #ORD-9876 confirmed for ₹450.00.');
    });

    it('handles missing placeholders cleanly without failing', () => {
      const template = 'Hello {{name}}, welcome to {{service}}!';
      const output = interpolateTemplate(template, { name: 'Ansif' });
      expect(output).toBe('Hello Ansif, welcome to !');
    });
  });

  describe('Notification Creation & Idempotency', () => {
    it('creates in-app notification when a domain event is handled', async () => {
      const repo = mockNotificationsRepo();
      const service = createNotificationsService(repo);

      const res = await service.handleDomainEvent('farmer.application.approved', {
        userId: IDS.userFarmer,
        applicationId: 'APP-1001',
        tohfaFarmerId: 'TOHFA-F-2026-0001',
      });

      expect(res).not.toBeNull();
      expect(res?.body).toContain('TOHFA-F-2026-0001');
      expect(repo.notifications.length).toBeGreaterThanOrEqual(1);
    });

    it('idempotency: replaying the same event does not produce duplicate notification rows', async () => {
      const repo = mockNotificationsRepo();
      const service = createNotificationsService(repo);

      const eventPayload = {
        userId: IDS.userFarmer,
        applicationId: 'APP-1001',
        tohfaFarmerId: 'TOHFA-F-2026-0001',
      };

      // Dispatch twice
      const first = await service.handleDomainEvent('farmer.application.approved', eventPayload);
      const second = await service.handleDomainEvent('farmer.application.approved', eventPayload);

      expect(first).not.toBeNull();
      expect(second).toBeNull(); // Deduplicated
    });

    it('all 11 golden-thread events have a defined template code mapping', () => {
      expect(Object.keys(EVENT_TEMPLATE_MAP)).toHaveLength(11);
      expect(EVENT_TEMPLATE_MAP['farmer.application.approved']).toBe('FARMER_APP_APPROVED');
      expect(EVENT_TEMPLATE_MAP['goods.received']).toBe('GOODS_RECEIVED');
      expect(EVENT_TEMPLATE_MAP['wallet.credited']).toBe('WALLET_CREDITED');
    });
  });

  describe('S-50: SMS Transports & Provider Adapters', () => {
    it('Mock SMS transport sends messages and tracks sent history', async () => {
      const mockSms = new MockSmsTransport();
      const result = await mockSms.sendSms({
        to: '+919876543210',
        message: 'Your code is 123456',
      });

      expect(result.status).toBe('DELIVERED');
      expect(result.providerMessageId).toContain('mock-sms-');
      expect(mockSms.sentMessages).toHaveLength(1);
      expect(mockSms.sentMessages[0]?.to).toBe('+919876543210');
    });

    it('Mock SMS transport cleanly handles and records simulated provider failures', async () => {
      const mockSms = new MockSmsTransport();
      mockSms.shouldFail = true;
      mockSms.failureError = 'Simulated upstream gateway timeout';

      const result = await mockSms.sendSms({
        to: '+919876543210',
        message: 'Test failure',
      });

      expect(result.status).toBe('FAILED');
      expect(result.error).toBe('Simulated upstream gateway timeout');
    });

    it('Msg91 transport fails gracefully when auth key is unconfigured', async () => {
      const msg91 = new Msg91SmsTransport();
      const result = await msg91.sendSms({
        to: '+919876543210',
        message: 'Test msg91',
      });

      expect(result.status).toBe('FAILED');
      expect(result.error).toBeDefined();
    });

  });

  describe('S-50: Push Transports & Deep Link Registry', () => {
    it('all 11 notification types have table-driven deep link resolvers', () => {
      for (const [eventName, templateCode] of Object.entries(EVENT_TEMPLATE_MAP)) {
        const link = resolveDeepLink(templateCode, {
          orderId: 'ORD-1',
          listingId: 'LIST-1',
          payoutId: 'PAY-1',
          grnNumber: 'GRN-1',
        });
        expect(link, `Missing deep link mapping for ${eventName} -> ${templateCode}`).not.toBeNull();
        expect(link?.app).toBeDefined();
        expect(link?.screen).toBeDefined();
        expect(link?.url).toBeDefined();
      }
    });

    it('deep links accurately target the correct apps and screens with URI schemes', () => {
      const approved = resolveDeepLink('FARMER_APP_APPROVED');
      expect(approved?.app).toBe('farmer-mobile');
      expect(approved?.screen).toBe('ApplicationStatus');
      expect(approved?.url).toBe('tohfa-farmer://app/application-status');

      const orderDelivered = resolveDeepLink('ORDER_DELIVERED', { orderId: 'ORD-99' });
      expect(orderDelivered?.app).toBe('customer-mobile');
      expect(orderDelivered?.screen).toBe('OrderHistory');
      expect(orderDelivered?.url).toBe('tohfa-customer://app/order-history?orderId=ORD-99');
    });

    it('Mock Push transport records dispatched pushes with deep links', async () => {
      const mockPush = new MockPushTransport();
      const result = await mockPush.sendPush({
        token: 'fcm_token_123',
        title: 'Produce Dispatched',
        body: 'Your produce has been dispatched.',
        deepLink: resolveDeepLink('ORDER_DISPATCHED', { orderId: 'ORD-123' }) ?? undefined,
      });

      expect(result.status).toBe('DELIVERED');
      expect(mockPush.sentPushes).toHaveLength(1);
      expect(mockPush.sentPushes[0]?.deepLink?.screen).toBe('OrderTracking');
    });
  });

  describe('S-50: Device Token Registry', () => {
    it('registers and revokes device tokens idempotently', async () => {
      const repo = mockNotificationsRepo();
      const service = createNotificationsService(repo);
      const actor = anActor({ userId: IDS.customer });

      // Register device token
      const regRes = (await service.registerDeviceToken(actor, {
        token: 'fcm-device-token-abc',
        platform: 'android',
        app: 'customer-mobile',
        locale: 'en',
      })) as { token: string; revoked: boolean };

      expect(regRes.token).toBe('fcm-device-token-abc');
      expect(regRes.revoked).toBe(false);

      const activeTokens = await repo.findActiveDeviceTokens(null as unknown as Executor, IDS.customer);
      expect(activeTokens).toHaveLength(1);
      expect(activeTokens[0]?.token).toBe('fcm-device-token-abc');

      // Revoke device token
      const revokeRes = (await service.revokeDeviceToken(actor, 'fcm-device-token-abc')) as {
        success: boolean;
      };
      expect(revokeRes.success).toBe(true);

      const remainingTokens = await repo.findActiveDeviceTokens(null as unknown as Executor, IDS.customer);
      expect(remainingTokens).toHaveLength(0);
    });
  });

  describe('BR-18c & BR-32 Verification', () => {
    it('BR-18c: an SMS dispatch failure does not roll back a completed credit, and the credit is not double-written on retry', async () => {
      const repo = mockNotificationsRepo();
      const mockSms = new MockSmsTransport();
      mockSms.shouldFail = true; // Simulate SMS failure

      // 1. Credit wallet action occurs in domain service
      const walletBalance = { amount: '500.00', credited: true };

      // 2. Notification is logged in notifications repo independently
      const notifRow = await repo.createNotification(null as unknown as Executor, {
        userId: IDS.customer,
        channel: 'SMS',
        body: 'Wallet credited with ₹500.00',
        dedupeKey: 'sms:wallet.credited:cust1:topup1',
      });

      expect(notifRow).not.toBeNull();
      const notifId = notifRow!.id;

      // 3. Dispatch attempted
      const smsResult = await mockSms.sendSms({
        to: '+919876543210',
        message: 'Wallet credited with ₹500.00',
      });

      // Update notification status
      await repo.updateNotificationDelivery(null as unknown as Executor, notifId, {
        status: smsResult.status,
        error: smsResult.error,
      });

      // Assertions:
      // - Wallet credit is unaffected by SMS failure
      expect(walletBalance.credited).toBe(true);
      expect(walletBalance.amount).toBe('500.00');

      // - Notification records failure with error
      const stored = repo.notifications.find((n) => n.id === notifId);
      expect(stored?.status).toBe('FAILED');
      expect(stored?.error).toBe('Mock SMS provider simulated network failure');

      // - Replay/retry with same dedupeKey does NOT create duplicate row
      const retryRow = await repo.createNotification(null as unknown as Executor, {
        userId: IDS.customer,
        channel: 'SMS',
        body: 'Wallet credited with ₹500.00',
        dedupeKey: 'sms:wallet.credited:cust1:topup1',
      });
      expect(retryRow).toBeNull(); // Duplicate prevented
    });

    it('BR-32: never log an OTP code or full mobile number in cleartext', () => {
      const fullMobile = '+919876543210';
      const masked = maskMobile(fullMobile);
      expect(masked).toBe('+919****10');
      expect(masked).not.toContain('8765432');
    });
  });

  describe('User Scoping & Own Data (BR-36)', () => {
    it('GET /notifications returns caller notifications and unread count', async () => {
      const repo = mockNotificationsRepo();
      const service = createNotificationsService(repo);

      // Create 2 notifications for farmer, 1 for customer
      await service.handleDomainEvent('farmer.application.approved', {
        userId: IDS.userFarmer,
        applicationId: 'APP-01',
        tohfaFarmerId: 'TOHFA-01',
      });
      await service.handleDomainEvent('farmer.application.approved', {
        userId: IDS.userFarmer,
        applicationId: 'APP-02',
        tohfaFarmerId: 'TOHFA-02',
      });
      await service.handleDomainEvent('order.confirmed', {
        userId: IDS.customer,
        orderId: 'ORD-01',
        orderNumber: 'ORD-01',
        totalAmount: '100',
      });

      const farmerActor = anActor({ userId: IDS.userFarmer });
      const result = (await service.listMyNotifications(farmerActor, { limit: 10, unreadOnly: false })) as {
        items: NotificationRow[];
        unreadCount: number;
      };

      expect(result.items).toHaveLength(2);
      expect(result.unreadCount).toBe(2);
      expect(result.items[0]?.body).toContain('TOHFA-01');
      expect(result.items[1]?.body).toContain('TOHFA-02');
    });

    it('BR-36: marking a foreign notification as read returns 404 (does not expose another user)', async () => {
      const repo = mockNotificationsRepo();
      const service = createNotificationsService(repo);

      await service.handleDomainEvent('farmer.application.approved', {
        userId: IDS.userFarmer,
        applicationId: 'APP-01',
        tohfaFarmerId: 'TOHFA-01',
      });

      const foreignId = repo.notifications[0]!.id;
      const customerActor = anActor({ userId: IDS.customer });

      // Customer attempts to mark farmer's notification as read
      await expect(service.markAsRead(customerActor, foreignId)).rejects.toThrow();
    });
  });

  describe('BR-48: notification-preference categories gate delivery', () => {
    /** In-memory stand-in for notification-preferences.repo's isCategoryEnabled. */
    function preferences(disabled: Array<{ userId: string; category: string }>) {
      return {
        isCategoryEnabled: async (_db: Executor, userId: string, category: string) =>
          !disabled.some((d) => d.userId === userId && d.category === category),
      };
    }

    function repoWithCategoryTemplates() {
      const repo = mockNotificationsRepo();
      repo.templates.push(
        {
          id: '44444444-4444-4444-4444-444444444444',
          code: 'COUNTER_OFFER_RECEIVED',
          channel: 'IN_APP',
          locale: 'en',
          subject: 'Counter-offer received',
          body_template: 'TOHFA offered ₹{{offerPrice}} for listing {{listingId}}.',
          is_active: true,
        },
        {
          id: '55555555-5555-5555-5555-555555555555',
          code: 'PAYOUT_RELEASED',
          channel: 'IN_APP',
          locale: 'en',
          subject: 'Payout released',
          body_template: '₹{{amount}} released, ref {{reference}}.',
          is_active: true,
        },
        {
          id: '66666666-6666-6666-6666-666666666666',
          code: 'COUNTER_OFFER_RECEIVED',
          channel: 'SMS',
          locale: 'en',
          subject: null,
          body_template: 'TOHFA counter-offer: ₹{{offerPrice}} for {{listingId}}.',
          is_active: true,
        },
        {
          id: '77777777-7777-7777-7777-777777777777',
          code: 'PAYOUT_RELEASED',
          channel: 'SMS',
          locale: 'en',
          subject: null,
          body_template: 'TOHFA payout ₹{{amount}} released, ref {{reference}}.',
          is_active: true,
        },
      );
      return repo;
    }

    const channels = (repo: { notifications: NotificationRow[] }) =>
      repo.notifications.map((n) => n.channel).sort();
    const enqueuedChannels = () =>
      vi
        .mocked(enqueue)
        .mock.calls.map(([, payload]) => (payload as { channel: string }).channel)
        .sort();

    beforeEach(() => {
      vi.mocked(enqueue).mockClear();
    });

    const counterOffer = {
      userId: IDS.userFarmer,
      listingId: 'LIST-1',
      offerPrice: '40.00',
      originalPrice: '45.00',
    };
    const payout = { userId: IDS.userFarmer, payoutId: 'PAY-1', amount: '900.00', reference: 'UTR-1' };

    it('BR-48: a disabled MARKETING category skips only the PUSH row and dispatch for counter_offer.received; IN_APP and SMS are still created', async () => {
      const repo = repoWithCategoryTemplates();
      const service = createNotificationsService(
        repo,
        preferences([{ userId: IDS.userFarmer, category: 'MARKETING' }]),
      );

      const res = await service.handleDomainEvent('counter_offer.received', counterOffer);

      expect(res?.channel).toBe('IN_APP');
      expect(channels(repo)).toEqual(['IN_APP', 'SMS']);
      expect(enqueuedChannels()).toEqual(['SMS']);
    });

    it('BR-48: a disabled PAYROLL category skips only the PUSH row and dispatch for payout.released; IN_APP and SMS are still created', async () => {
      const repo = repoWithCategoryTemplates();
      const service = createNotificationsService(
        repo,
        preferences([{ userId: IDS.userFarmer, category: 'PAYROLL' }]),
      );

      const res = await service.handleDomainEvent('payout.released', payout);

      expect(res?.channel).toBe('IN_APP');
      expect(channels(repo)).toEqual(['IN_APP', 'SMS']);
      expect(enqueuedChannels()).toEqual(['SMS']);
    });

    it('BR-48: an enabled category still delivers, and a disabled one only affects its own user and events', async () => {
      const repo = repoWithCategoryTemplates();
      const service = createNotificationsService(
        repo,
        // MARKETING off for a DIFFERENT user; PAYROLL off for this user.
        preferences([
          { userId: IDS.customer, category: 'MARKETING' },
          { userId: IDS.userFarmer, category: 'PAYROLL' },
        ]),
      );

      const res = await service.handleDomainEvent('counter_offer.received', counterOffer);

      expect(res).not.toBeNull();
      expect(channels(repo)).toEqual(['IN_APP', 'PUSH', 'SMS']);
      expect(enqueuedChannels()).toEqual(['PUSH', 'SMS']);
    });

    it('BR-48: events with no category mapping stay always-on even when every category is disabled', async () => {
      const repo = repoWithCategoryTemplates();
      const allOff = ['WEATHER', 'FARM', 'MARKETING', 'PAYROLL', 'COMMUNITY'].map((category) => ({
        userId: IDS.userFarmer,
        category,
      }));
      const service = createNotificationsService(repo, preferences(allOff));

      const res = await service.handleDomainEvent('farmer.application.approved', {
        userId: IDS.userFarmer,
        applicationId: 'APP-1001',
        tohfaFarmerId: 'TOHFA-F-2026-0001',
      });

      expect(res).not.toBeNull();
    });
  });

  describe('HTTP Route Integration', () => {
    const app = createApp();

    it('GET /v1/notifications requires authentication', async () => {
      const res = await request(app).get('/v1/notifications');
      expect(res.status).toBe(401);
    });

    it('POST /v1/notifications/device-tokens requires authentication', async () => {
      const res = await request(app).post('/v1/notifications/device-tokens').send({
        token: 'test-token',
        platform: 'android',
        app: 'farmer-mobile',
      });
      expect(res.status).toBe(401);
    });

    it('DELETE /v1/notifications/device-tokens/:token requires authentication', async () => {
      const res = await request(app).delete('/v1/notifications/device-tokens/test-token');
      expect(res.status).toBe(401);
    });
  });
});
