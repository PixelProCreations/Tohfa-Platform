/**
 * Optimistic read-state helpers for the notifications list (BR-65).
 *
 * Notifications and system messages are two separate API resources. The
 * `source` field on `NotificationItem` says which endpoint backs mark-read so
 * that a single list of mixed items can call the right route.
 *
 * All functions are pure (no side effects, original arrays unchanged) so they
 * are safe to call from a TanStack Query optimistic update and a rollback.
 */
import type { NotificationItem } from './types';

/**
 * Marks the given ids as read, returning a new array. The original is never
 * mutated, so a rollback can compare before/after.
 */
export function applyReadState(items: NotificationItem[], ids: readonly string[]): NotificationItem[] {
  const set = new Set(ids);
  return items.map((item) => (set.has(item.id) ? { ...item, isRead: true } : item));
}

/**
 * Returns a rollback function that restores the original `isRead` values of the
 * given ids onto a (potentially more recent) snapshot. Rows that were already
 * read in the snapshot by another concurrent action keep their new state.
 */
export function readRollback(
  original: readonly NotificationItem[],
  ids: readonly string[],
): (snapshot: NotificationItem[]) => NotificationItem[] {
  const origById = new Map(original.map((item) => [item.id, item.isRead]));
  const set = new Set(ids);
  return (snapshot: NotificationItem[]) =>
    snapshot.map((item) => {
      if (!set.has(item.id)) return item;
      const wasRead = origById.get(item.id);
      // Only restore rows that changed; a row another action read stays read.
      return wasRead !== undefined && wasRead !== item.isRead ? { ...item, isRead: wasRead } : item;
    });
}

/**
 * Ids of unread system messages, used to mark them read optimistically when a
 * "mark all read" action fires (there is no read-all endpoint for system
 * messages — each must be marked individually, BR-65).
 */
export function unreadSystemMessageIds(items: readonly NotificationItem[]): string[] {
  return items.filter((item) => item.source === 'systemMessage' && !item.isRead).map((item) => item.id);
}

/** Total count of unread items from both sources (the bell badge number). */
export function unreadNotificationCount(items: readonly NotificationItem[]): number {
  return items.filter((item) => !item.isRead).length;
}
