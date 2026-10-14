/**
 * screens/warehouse/notifications/mappers.ts: API rows -> the notification and
 * alert UI types. Pure functions with `now` passed in, so nothing here depends
 * on the machine clock; one block re-runs them under a foreign TZ to prove the
 * device time zone never leaks into an admin date.
 */
import { afterEach, describe, expect, it } from 'vitest';
import type { AlertItemDto } from '../api/alerts';
import type { NotificationDto, SystemMessageDto } from '../api/notifications';
import en from '../i18n/en.json';
import {
  notificationCategoryOf,
  toApprovalAlertItem,
  toNotificationItem,
  toSystemMessageItem,
} from '../screens/warehouse/notifications/mappers';

// 12 Oct 2026, 12:00 PM IST.
const NOW = new Date('2026-10-12T06:30:00Z');
const WAREHOUSE = '11111111-1111-4111-8111-111111111111';

function notification(overrides: Partial<NotificationDto> = {}): NotificationDto {
  return {
    id: 'n-1',
    channel: 'IN_APP',
    title: 'Order confirmed',
    body: 'Order ORD-1 is confirmed.',
    locale: 'en',
    data: {},
    readAt: null,
    // 12 Oct 2026, 11:50 AM IST: ten minutes before NOW.
    createdAt: '2026-10-12T06:20:00Z',
    ...overrides,
  };
}

function alert(overrides: Partial<AlertItemDto> = {}): AlertItemDto {
  return {
    itemKey: `low_stock:${WAREHOUSE}:22222222-2222-4222-8222-222222222222:a`,
    type: 'LOW_STOCK',
    messageKey: 'alert.low_stock.message',
    refType: 'WAREHOUSE',
    refId: WAREHOUSE,
    warehouseId: WAREHOUSE,
    since: null,
    params: { cropId: '22222222-2222-4222-8222-222222222222', grade: 'A', totalQtyKg: '12.500', thresholdKg: '50' },
    state: 'ACTIVE',
    snoozedUntil: null,
    ...overrides,
  };
}

describe('notificationCategoryOf: the category comes from data, else a neutral one', () => {
  it('maps every WorklistRefType in data.refType', () => {
    expect(notificationCategoryOf({ refType: 'ORDER' })).toBe('order');
    expect(notificationCategoryOf({ refType: 'GOODS_RECEIPT' })).toBe('received');
    expect(notificationCategoryOf({ refType: 'RETURN_REQUEST' })).toBe('returns');
    expect(notificationCategoryOf({ refType: 'INVENTORY_BATCH' })).toBe('inventory');
  });

  it('reads the domain-event keys the server copies into data (orderId, grnNumber)', () => {
    expect(notificationCategoryOf({ orderId: 'o-1', orderNumber: 'ORD-1' })).toBe('order');
    expect(notificationCategoryOf({ grnNumber: 'GRN-7' })).toBe('received');
  });

  it('falls back to the neutral category for an unknown refType, unknown keys or no data', () => {
    expect(notificationCategoryOf({ refType: 'SOMETHING_NEW' })).toBe('message');
    expect(notificationCategoryOf({ refType: 'WAREHOUSE' })).toBe('message');
    expect(notificationCategoryOf({ listingId: 'l-1' })).toBe('message');
    expect(notificationCategoryOf({})).toBe('message');
    expect(notificationCategoryOf(undefined)).toBe('message');
  });

  it('ignores a refType that is not a string', () => {
    expect(notificationCategoryOf({ refType: 42 })).toBe('message');
  });
});

describe('toNotificationItem', () => {
  it('maps the fields and reads isRead from readAt', () => {
    const item = toNotificationItem(notification({ readAt: '2026-10-12T06:25:00Z' }), NOW);
    expect(item).toMatchObject({
      id: 'n-1',
      title: 'Order confirmed',
      message: 'Order ORD-1 is confirmed.',
      isRead: true,
    });
    expect(toNotificationItem(notification(), NOW).isRead).toBe(false);
  });

  it('sets a target only when data maps to a route the app has', () => {
    expect(toNotificationItem(notification({ data: { orderId: 'o-1', orderNumber: 'ORD-1' } }), NOW).target).toBe('Orders');
    expect(toNotificationItem(notification({ data: { grnNumber: 'GRN-7' } }), NOW).target).toBe('Receiving');
    expect(toNotificationItem(notification({ data: { refType: 'RETURN_REQUEST' } }), NOW).target).toBe('Returns');
    expect(toNotificationItem(notification({ data: { refType: 'INVENTORY_BATCH' } }), NOW).target).toBe('Stock');
    expect(toNotificationItem(notification({ data: { listingId: 'l-1' } }), NOW).target).toBeUndefined();
    expect(toNotificationItem(notification({ data: {} }), NOW).target).toBeUndefined();
  });

  it('takes the reference from a human number in data, never from an id', () => {
    expect(toNotificationItem(notification({ data: { orderId: 'o-1', orderNumber: 'ORD-1' } }), NOW).reference).toBe('ORD-1');
    expect(toNotificationItem(notification({ data: { grnNumber: 'GRN-7' } }), NOW).reference).toBe('GRN-7');
    expect(toNotificationItem(notification({ data: { orderId: 'o-1' } }), NOW).reference).toBeUndefined();
  });

  it('shows an empty title rather than "null" when the server sends none', () => {
    expect(toNotificationItem(notification({ title: null }), NOW).title).toBe('');
  });

  it('formats the time relative to now and the date in IST', () => {
    const item = toNotificationItem(notification(), NOW);
    expect(item.timestamp).toBe('10 minutes ago');
    expect(item.date).toBe('Today · 11:50 AM');
  });
});

describe('toSystemMessageItem', () => {
  const message: SystemMessageDto = {
    id: 'm-1',
    scope: 'WAREHOUSE',
    title: 'Maintenance',
    body: 'The system will be down tonight.',
    locale: 'en',
    // 11 Oct 2026, 08:00 PM IST.
    startsAt: '2026-10-11T14:30:00Z',
    endsAt: null,
    createdAt: '2026-10-11T14:00:00Z',
    isRead: false,
    readAt: null,
  };

  it('is a system-category item dated by startsAt, in IST', () => {
    expect(toSystemMessageItem(message, NOW)).toMatchObject({
      id: 'm-1',
      category: 'system',
      title: 'Maintenance',
      message: 'The system will be down tonight.',
      isRead: false,
      timestamp: '16 hours ago',
      date: 'Yesterday · 08:00 PM',
    });
    expect(toSystemMessageItem(message, NOW).target).toBeUndefined();
  });
});

describe('toApprovalAlertItem', () => {
  it('has an en.json string for every messageKey the server emits', () => {
    for (const key of ['alert.batch_near_expiry.message', 'alert.low_stock.message', 'alert.capacity_near_full.message']) {
      expect(en).toHaveProperty([key]);
    }
  });

  it('keys the row by itemKey and keeps the warehouse uuid', () => {
    const item = toApprovalAlertItem(alert(), NOW);
    expect(item.id).toBe(alert().itemKey);
    expect(item.warehouseId).toBe(WAREHOUSE);
  });

  it('LOW_STOCK: text from i18n with params, weights formatted from kg strings, opens low stock', () => {
    const item = toApprovalAlertItem(alert(), NOW);
    expect(item.title).toBe(en['alert.low_stock.title']);
    expect(item.detail).toBe('Grade A stock is 12.5 kg, below 50 kg');
    expect(item.record).toBe('LowStock');
    expect(item.timestamp).toBe('');
  });

  it('BATCH_NEAR_EXPIRY: the expiry date and since go through the IST formatters', () => {
    const item = toApprovalAlertItem(
      alert({
        itemKey: 'batch_near_expiry:6f0c6a53-9d1e-4f6e-8a55-1f6b2d0f5a11',
        type: 'BATCH_NEAR_EXPIRY',
        messageKey: 'alert.batch_near_expiry.message',
        refType: 'INVENTORY_BATCH',
        // 12 Oct 2026, 08:00 AM IST.
        since: '2026-10-12T02:30:00Z',
        params: { batchCode: 'B-104', expiryOn: '2026-10-15', daysToExpiry: 3, qtyAvailableKg: '1250.000' },
      }),
      NOW,
    );
    expect(item.title).toBe(en['alert.batch_near_expiry.title']);
    expect(item.reference).toBe('B-104');
    expect(item.detail).toBe('Batch B-104 expires on 15 Oct 2026 · 1,250 kg left');
    expect(item.timestamp).toBe('4 hours ago');
    expect(item.record).toBeUndefined();
  });

  it('CAPACITY_NEAR_FULL: percent and weights from params', () => {
    const item = toApprovalAlertItem(
      alert({
        itemKey: `capacity_near_full:${WAREHOUSE}`,
        type: 'CAPACITY_NEAR_FULL',
        messageKey: 'alert.capacity_near_full.message',
        params: { capacityKg: '10000', usedKg: '9250.5', utilizationPercent: '92.51', thresholdPercent: '90' },
      }),
      NOW,
    );
    expect(item.title).toBe(en['alert.capacity_near_full.title']);
    expect(item.detail).toBe('92.51% used · 9,250.5 kg of 10,000 kg');
    expect(item.record).toBeUndefined();
  });

  it('an unknown type or messageKey falls back to the generic alert text, with no record', () => {
    const item = toApprovalAlertItem(
      alert({ type: 'SOMETHING_NEW' as AlertItemDto['type'], messageKey: 'alert.something_new.message', params: {} }),
      NOW,
    );
    expect(item.title).toBe(en['alert.unknown.title']);
    expect(item.detail).toBe(en['alert.unknown.message']);
    expect(item.record).toBeUndefined();
  });

  it('a weight param that is not a Quantity is shown as sent, never as NaN', () => {
    const item = toApprovalAlertItem(alert({ params: { grade: 'A', totalQtyKg: 'n/a', thresholdKg: null } }), NOW);
    expect(item.detail).not.toMatch(/NaN|undefined|null/);
    expect(item.detail).toContain('n/a');
  });

  it('a snoozed alert carries its snooze end, formatted in IST', () => {
    const item = toApprovalAlertItem(alert({ state: 'SNOOZED', snoozedUntil: '2026-10-12T07:30:00Z' }), NOW);
    expect(item.snoozedUntil).toBe('Today · 01:00 PM');
    expect(toApprovalAlertItem(alert(), NOW).snoozedUntil).toBeUndefined();
  });

  it('fields the API has no source for get fixed, neutral values', () => {
    expect(toApprovalAlertItem(alert(), NOW)).toMatchObject({
      kind: 'exception',
      critical: false,
      isRead: false,
      status: 'open',
    });
  });
});

describe('dates never use the device time zone', () => {
  const original = process.env['TZ'];
  afterEach(() => {
    if (original === undefined) delete process.env['TZ'];
    else process.env['TZ'] = original;
  });

  it('gives the same IST text when the device is set to another zone', () => {
    const inUtc = (() => {
      process.env['TZ'] = 'UTC';
      return [
        toNotificationItem(notification(), NOW).date,
        toApprovalAlertItem(alert({ state: 'SNOOZED', snoozedUntil: '2026-10-12T07:30:00Z' }), NOW).snoozedUntil,
      ];
    })();
    for (const zone of ['America/Los_Angeles', 'Pacific/Kiritimati']) {
      process.env['TZ'] = zone;
      expect([
        toNotificationItem(notification(), NOW).date,
        toApprovalAlertItem(alert({ state: 'SNOOZED', snoozedUntil: '2026-10-12T07:30:00Z' }), NOW).snoozedUntil,
      ]).toEqual(inUtc);
    }
    expect(inUtc).toEqual(['Today · 11:50 AM', 'Today · 01:00 PM']);
  });
});
