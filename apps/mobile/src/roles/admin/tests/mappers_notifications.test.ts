import { describe, expect, it } from 'vitest';
import type { NotificationDto, SystemMessageDto } from '../api/notifications';
import {
  formatRelativeTimeOrDate,
  inferNotificationCategory,
  mapNotificationDtoToItem,
  mapSystemMessageDtoToItem,
} from '../screens/warehouse/notifications/mappers';

describe('notifications mappers', () => {
  it('infers category from data or content keywords', () => {
    expect(inferNotificationCategory('QC Required', 'Tomato batch waiting for inspection', undefined)).toBe('quality');
    expect(inferNotificationCategory('Order to Pack', 'New order ORD-10245', undefined)).toBe('order');
    expect(inferNotificationCategory('Low Stock Alert', 'Carrot is low', undefined)).toBe('inventory');
    expect(inferNotificationCategory('Cash Top-Up', '₹2,000 credited to wallet', undefined)).toBe('wallet');
    expect(inferNotificationCategory('Shipment Arriving', 'GR-1025 arriving today', undefined)).toBe('shipment');
    expect(inferNotificationCategory('Return Request', 'Customer requested return', undefined)).toBe('returns');
    expect(inferNotificationCategory('Custom Category', 'Custom payload', { category: 'received' })).toBe('received');
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
    expect(item.target).toBe('ReviewReceiving');
    expect(item.tag).toBe('Awaiting QC');
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
