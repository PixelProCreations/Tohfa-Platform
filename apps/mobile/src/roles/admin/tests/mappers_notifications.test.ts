import { describe, expect, it } from 'vitest';
import type { NotificationDto, SystemMessageDto } from '../api/notifications';
import {
  formatRelativeTimeOrDate,
  inferNotificationCategory,
  mapNotificationDtoToItem,
  mapSystemMessageDtoToItem,
} from '../screens/warehouse/notifications/mappers';
import {
  applyReadState,
  readRollback,
  unreadNotificationCount,
  unreadSystemMessageIds,
} from '../screens/warehouse/notifications/readState';
import type { NotificationItem } from '../screens/warehouse/notifications/types';

describe('notifications mappers', () => {
  it('infers category from data or content keywords', () => {
    expect(inferNotificationCategory('QC Required', 'Tomato batch waiting for inspection', undefined)).toBe('quality');
    expect(inferNotificationCategory('Order to Pack', 'New order ORD-10245', undefined)).toBe('order');
    expect(inferNotificationCategory('Low Stock Alert', 'Carrot is low', undefined)).toBe('inventory');
    expect(inferNotificationCategory('Cash Top-Up', '₹2,000 credited to wallet', undefined)).toBe('wallet');
    expect(inferNotificationCategory('Shipment Arriving', 'GR-1025 arriving today', undefined)).toBe('shipment');
    expect(inferNotificationCategory('Return Request', 'Customer requested return', undefined)).toBe('returns');
    // The server never sets data.category (its data is the domain event payload,
    // apps/api/src/events/bus.ts DomainEvents), so an invented key must not decide.
    expect(inferNotificationCategory('Custom Category', 'Custom payload', { category: 'received' })).toBe('system');
  });

  it('maps NotificationDto to NotificationItem correctly', () => {
    const dto: NotificationDto = {
      id: 'notif-1',
      title: 'QC Required',
      body: 'Tomato batch GR-1024 is waiting for quality inspection.',
      channel: 'IN_APP',
      readAt: null,
      createdAt: '2026-09-25T10:00:00.000Z',
      data: {
        reference: 'GR-1024',
        target: 'ReviewReceiving',
        tag: 'Awaiting QC',
      },
    };

    const item = mapNotificationDtoToItem(dto);
    expect(item.id).toBe('notif-1');
    expect(item.title).toBe('QC Required');
    expect(item.message).toBe('Tomato batch GR-1024 is waiting for quality inspection.');
    expect(item.isRead).toBe(false);
    expect(item.category).toBe('quality');
    expect(item.reference).toBe('GR-1024');
    // target and tag are not keys of any server payload: never read from data.
    expect(item.target).toBeUndefined();
    expect(item.tag).toBeUndefined();
  });

  it('handles NotificationDto with null title and readAt set', () => {
    const dto: NotificationDto = {
      id: 'notif-2',
      title: null,
      body: 'General maintenance alert',
      readAt: '2026-09-25T11:00:00.000Z',
      createdAt: '2026-09-25T10:30:00.000Z',
    };

    const item = mapNotificationDtoToItem(dto);
    expect(item.id).toBe('notif-2');
    expect(item.title).toBe('Notification');
    expect(item.isRead).toBe(true);
    expect(item.category).toBe('system');
  });

  it('maps SystemMessageDto to NotificationItem correctly', () => {
    const dto: SystemMessageDto = {
      id: 'msg-1',
      scope: 'WAREHOUSE',
      title: 'Scheduled Maintenance',
      body: 'Power outage scheduled for tomorrow.',
      locale: 'en',
      startsAt: '2026-09-26T00:00:00.000Z',
      endsAt: '2026-09-26T06:00:00.000Z',
      createdAt: '2026-09-25T08:00:00.000Z',
      isRead: false,
      readAt: null,
    };

    const item = mapSystemMessageDtoToItem(dto);
    expect(item.id).toBe('msg-1');
    expect(item.title).toBe('Scheduled Maintenance');
    expect(item.category).toBe('system');
    expect(item.isRead).toBe(false);
    expect(item.tag).toBe('Warehouse');
  });
});

describe('notification data payload (BR-65: only what the server sends)', () => {
  const base: NotificationDto = {
    id: 'n-1',
    channel: 'IN_APP',
    title: 'Order confirmed',
    body: 'Your order is confirmed.',
    readAt: null,
    createdAt: '2026-10-29T04:00:00.000Z',
    data: {},
  };

  it('BR-65: takes the reference from the event payload keys the server sends', () => {
    expect(mapNotificationDtoToItem({ ...base, data: { userId: 'u', orderId: 'o-1', orderNumber: 'ORD-10245' } }).reference).toBe('ORD-10245');
    expect(mapNotificationDtoToItem({ ...base, data: { userId: 'u', grnNumber: 'GRN-0042', produceName: 'Carrot', quantityKg: 5 } }).reference).toBe('GRN-0042');
    expect(mapNotificationDtoToItem({ ...base, data: { userId: 'u', amount: '100.00', balance: '200.00', reference: 'TOP-2845' } }).reference).toBe('TOP-2845');
    expect(mapNotificationDtoToItem({ ...base, data: { userId: 'u' } }).reference).toBeUndefined();
  });

  it('BR-65: categorises by payload keys the server sends', () => {
    expect(mapNotificationDtoToItem({ ...base, title: 'Update', body: 'x', data: { orderId: 'o', orderNumber: 'ORD-1' } }).category).toBe('order');
    expect(mapNotificationDtoToItem({ ...base, title: 'Update', body: 'x', data: { grnNumber: 'GRN-1' } }).category).toBe('received');
    expect(mapNotificationDtoToItem({ ...base, title: 'Update', body: 'x', data: { amount: '1.00', balance: '2.00', reference: 'R' } }).category).toBe('wallet');
  });

  it('BR-65: never reads invented tag / target / category keys', () => {
    const item = mapNotificationDtoToItem({ ...base, title: 'Hello', body: 'x', data: { tag: 'Awaiting QC', target: 'Wallet', category: 'quality' } });
    expect(item.tag).toBeUndefined();
    expect(item.target).toBeUndefined();
    expect(item.category).toBe('system');
  });

  it('marks where each item came from, so mark-read calls the right endpoint', () => {
    expect(mapNotificationDtoToItem(base).source).toBe('notification');
    const msg: SystemMessageDto = {
      id: 'm-1', scope: 'SYSTEM_WIDE', title: 't', body: 'b', locale: 'en',
      startsAt: base.createdAt, endsAt: null, createdAt: base.createdAt, isRead: false, readAt: null,
    };
    expect(mapSystemMessageDtoToItem(msg).source).toBe('systemMessage');
  });
});

describe('optimistic read state (BR-65)', () => {
  const item = (id: string, source: 'notification' | 'systemMessage', isRead: boolean): NotificationItem => ({
    id, source, isRead, category: 'system', title: id, message: '', timestamp: '',
  });
  const items = [item('n1', 'notification', false), item('n2', 'notification', true), item('m1', 'systemMessage', false), item('m2', 'systemMessage', true)];

  it('BR-65: marking read changes only the given ids', () => {
    const next = applyReadState(items, ['n1']);
    expect(next.map((i) => i.isRead)).toEqual([true, true, false, true]);
    expect(items[0]?.isRead).toBe(false);
  });

  it('BR-65: a failed mark-read rolls back exactly the rows it changed', () => {
    const changed = applyReadState(items, ['n1', 'm1']);
    const rollback = readRollback(items, ['n1', 'm1']);
    // A row read meanwhile by another action keeps its new state.
    const restored = rollback(changed);
    expect(restored.map((i) => i.isRead)).toEqual([false, true, false, true]);
  });

  it('BR-65: mark all read also covers every unread system message (no read-all route for them)', () => {
    expect(unreadSystemMessageIds(items)).toEqual(['m1']);
  });

  it('counts unread rows of both sources', () => {
    expect(unreadNotificationCount(items)).toBe(2);
  });
});
