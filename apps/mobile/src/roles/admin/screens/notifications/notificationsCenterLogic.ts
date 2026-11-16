/**
 * Pure, side-effect-free logic for the Notifications Center screen.
 * No React imports — these functions run in plain Node for unit tests.
 *
 * Category chip → category filter mapping:
 *   All      → show all items
 *   Unread   → !isRead (client-side)
 *   Inventory → category === 'inventory'
 *   Audits   → category in ['quality', 'mismatch', 'received']
 *   Farmers  → category in ['shipment']
 *   Finance  → category in ['wallet', 'order', 'returns']
 */
import type { NotificationCategory, NotificationItem } from '../warehouse/notifications/types';

/** The six filter chips shown in the Notifications Center. */
export type NotifChip = 'All' | 'Unread' | 'Inventory' | 'Audits' | 'Farmers' | 'Finance';

/** Ordered list of chips as rendered in the UI. */
export const NOTIF_CHIPS: readonly NotifChip[] = [
  'All',
  'Unread',
  'Inventory',
  'Audits',
  'Farmers',
  'Finance',
];

/** Returns items matching the active chip filter. */
export function filterByChip(
  items: readonly NotificationItem[],
  chip: NotifChip,
): readonly NotificationItem[] {
  if (chip === 'All') return items;
  if (chip === 'Unread') return items.filter((i) => !i.isRead);
  if (chip === 'Inventory') return items.filter((i) => i.category === 'inventory');
  if (chip === 'Audits')
    return items.filter((i) =>
      (['quality', 'mismatch', 'received'] as NotificationCategory[]).includes(i.category),
    );
  if (chip === 'Farmers') return items.filter((i) => i.category === 'shipment');
  if (chip === 'Finance')
    return items.filter((i) =>
      (['wallet', 'order', 'returns'] as NotificationCategory[]).includes(i.category),
    );
  return items;
}

/** Returns items matching the search query (title, message, reference). Empty query = all. */
export function filterBySearch(
  items: readonly NotificationItem[],
  query: string,
): readonly NotificationItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (i) =>
      i.title.toLowerCase().includes(q) ||
      i.message.toLowerCase().includes(q) ||
      (i.reference ?? '').toLowerCase().includes(q),
  );
}

/** Applies chip filter then search filter, in that order. */
export function applyFilters(
  items: readonly NotificationItem[],
  chip: NotifChip,
  query: string,
): readonly NotificationItem[] {
  return filterBySearch(filterByChip(items, chip), query);
}

/** How many items in the list are unread. */
export function countUnread(items: readonly NotificationItem[]): number {
  return items.filter((i) => !i.isRead).length;
}

/**
 * Human-readable category label for a notification category.
 * Used in the detail modal's "category · time" line.
 */
export function categoryLabel(category: NotificationCategory): string {
  switch (category) {
    case 'inventory':
      return 'Inventory';
    case 'received':
      return 'Received';
    case 'quality':
      return 'Quality';
    case 'mismatch':
      return 'Mismatch';
    case 'shipment':
      return 'Shipment';
    case 'order':
      return 'Order';
    case 'wallet':
      return 'Finance';
    case 'returns':
      return 'Returns';
    case 'system':
      return 'System';
    case 'message':
      return 'Message';
    default:
      return category;
  }
}

/**
 * Which visual icon group a category maps to.
 * Drives TypeIconBox and the card icon in renderCategoryIcon.
 */
export type NotifIconType = 'inventory' | 'audit' | 'farmers' | 'finance' | 'warning';

export function categoryIconType(category: NotificationCategory): NotifIconType {
  switch (category) {
    case 'inventory':
      return 'inventory';
    case 'received':
    case 'quality':
      return 'audit';
    case 'mismatch':
    case 'system':
    case 'message':
      return 'warning';
    case 'shipment':
      return 'farmers';
    case 'order':
    case 'wallet':
    case 'returns':
      return 'finance';
    default:
      return 'warning';
  }
}

/**
 * An item is "action required" when it has a navigable target (e.g. ReviewReceiving)
 * and is still unread. Items with a target but already read stop showing the badge.
 */
export function isActionRequired(item: NotificationItem): boolean {
  return item.target !== undefined && !item.isRead;
}

/**
 * Builds the "category · timestamp" meta line for a card or modal,
 * combining the human label and the item's display timestamp.
 */
export function buildMetaLine(category: NotificationCategory, timestamp: string): string {
  return `${categoryLabel(category)} · ${timestamp}`;
}
