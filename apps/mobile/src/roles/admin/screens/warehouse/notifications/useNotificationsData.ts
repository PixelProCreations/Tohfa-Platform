import { useCallback, useEffect, useState } from 'react';
import {
  listNotifications,
  listSystemMessages,
  markAllNotificationsRead,
  markNotificationRead,
  markSystemMessageRead,
} from '../../../api/notifications';
import {
  mapNotificationDtoToItem,
  mapSystemMessageDtoToItem,
} from './mappers';
import type { NotificationItem } from './types';

export function useNotificationsList(unreadOnly?: boolean) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [notifRes, msgRes] = await Promise.allSettled([
        listNotifications({ unreadOnly, limit: 100 }),
        listSystemMessages({ limit: 50 }),
      ]);

      const notifs: NotificationItem[] =
        notifRes.status === 'fulfilled'
          ? (notifRes.value.items ?? []).map(mapNotificationDtoToItem)
          : [];

      const msgs: NotificationItem[] =
        msgRes.status === 'fulfilled'
          ? (msgRes.value.items ?? []).map(mapSystemMessageDtoToItem)
          : [];

      const combined = [...notifs, ...msgs];
      // Sort newest first
      setItems(combined);

      if (notifRes.status === 'fulfilled') {
        const msgsUnread = msgs.filter((m) => !m.isRead).length;
        setUnreadCount(notifRes.value.unreadCount + msgsUnread);
      } else {
        setUnreadCount(combined.filter((n) => !n.isRead).length);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const markOneRead = useCallback(async (id: string) => {
    try {
      // Optimistic update
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));

      // Attempt both or identify prefix
      try {
        await markNotificationRead(id);
      } catch {
        await markSystemMessageRead(id).catch(() => undefined);
      }
    } catch {
      // No-op
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      await markAllNotificationsRead().catch(() => undefined);
    } catch {
      // No-op
    }
  }, []);

  return {
    items,
    unreadCount,
    loading,
    error,
    refetch: fetchAll,
    markOneRead,
    markAllRead,
  };
}
