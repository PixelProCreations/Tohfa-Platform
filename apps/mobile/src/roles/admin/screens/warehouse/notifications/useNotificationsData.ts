import { useCallback, useEffect, useRef, useState } from 'react';
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
import { applyReadState, readRollback, unreadSystemMessageIds } from './readState';
import type { NotificationItem } from './types';

export function useNotificationsList(unreadOnly?: boolean) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [markError, setMarkError] = useState<unknown>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const itemsRef = useRef<NotificationItem[]>([]);
  itemsRef.current = items;
  const unreadRef = useRef<number>(0);
  unreadRef.current = unreadCount;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [notifRes, msgRes] = await Promise.allSettled([
        listNotifications({ unreadOnly, limit: 100 }),
        listSystemMessages({ limit: 50 }),
      ]);

      if (notifRes.status === 'rejected') {
        setError(notifRes.reason);
        setItems([]);
        setUnreadCount(0);
        return;
      }

      const notifs: NotificationItem[] = (notifRes.value.items ?? []).map(mapNotificationDtoToItem);
      const msgs: NotificationItem[] =
        msgRes.status === 'fulfilled'
          ? (msgRes.value.items ?? []).map(mapSystemMessageDtoToItem)
          : [];

      const combined = [...notifs, ...msgs];
      // Sort newest first
      setItems(combined);

      const msgsUnread = msgs.filter((m) => !m.isRead).length;
      setUnreadCount(notifRes.value.unreadCount + msgsUnread);
    } catch (err: unknown) {
      setError(err);
      setItems([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [unreadOnly]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const markOneRead = useCallback(async (id: string) => {
    const before = itemsRef.current;
    const target = before.find((i) => i.id === id);
    if (!target || target.isRead) return;
    const rollback = readRollback(before, [id]);
    setItems((prev) => applyReadState(prev, [id]));
    setUnreadCount((c) => Math.max(0, c - 1));
    setMarkError(null);
    try {
      if (target.source === 'systemMessage') {
        await markSystemMessageRead(id);
      } else {
        await markNotificationRead(id);
      }
    } catch (err) {
      setItems((prev) => rollback(prev));
      setUnreadCount((c) => c + 1);
      setMarkError(err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    const before = itemsRef.current;
    const countBefore = unreadRef.current;
    const ids = before.filter((i) => !i.isRead).map((i) => i.id);
    if (ids.length === 0) return;
    const rollback = readRollback(before, ids);
    setItems((prev) => applyReadState(prev, ids));
    setUnreadCount(0);
    setMarkError(null);
    try {
      await markAllNotificationsRead();
      await Promise.all(unreadSystemMessageIds(before).map((id) => markSystemMessageRead(id)));
    } catch (err) {
      setItems((prev) => rollback(prev));
      setUnreadCount(countBefore);
      setMarkError(err);
    }
  }, []);

  return {
    items,
    unreadCount,
    loading,
    error,
    markError,
    refetch: fetchAll,
    markOneRead,
    markAllRead,
  };
}
