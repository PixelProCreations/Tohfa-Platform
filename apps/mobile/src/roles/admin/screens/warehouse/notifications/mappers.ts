import type { NotificationDto, SystemMessageDto } from '../../../api/notifications';
import type {
  NotificationCategory,
  NotificationItem,
  NotificationTarget,
} from './types';

export function formatRelativeTimeOrDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;

    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function formatIstDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function inferNotificationCategory(
  title: string | null | undefined,
  body: string,
  data?: Record<string, unknown>,
): NotificationCategory {
  if (data?.category && typeof data.category === 'string') {
    const cat = data.category.toLowerCase();
    const valid: NotificationCategory[] = [
      'shipment',
      'received',
      'quality',
      'mismatch',
      'inventory',
      'order',
      'wallet',
      'returns',
      'system',
      'message',
    ];
    if (valid.includes(cat as NotificationCategory)) {
      return cat as NotificationCategory;
    }
  }

  const text = `${title ?? ''} ${body}`.toLowerCase();
  if (text.includes('qc') || text.includes('quality') || text.includes('inspection')) {
    return 'quality';
  }
  if (text.includes('shipment') || text.includes('arriving') || text.includes('dispatch')) {
    return 'shipment';
  }
  if (text.includes('received') || text.includes('receipt') || text.includes('gr-')) {
    return 'received';
  }
  if (text.includes('mismatch') || text.includes('discrepancy')) {
    return 'mismatch';
  }
  if (text.includes('stock') || text.includes('inventory') || text.includes('threshold')) {
    return 'inventory';
  }
  if (text.includes('order') || text.includes('pack') || text.includes('ord-')) {
    return 'order';
  }
  if (text.includes('wallet') || text.includes('top-up') || text.includes('credit')) {
    return 'wallet';
  }
  if (text.includes('return')) {
    return 'returns';
  }
  if (text.includes('message') || text.includes('notice') || text.includes('policy')) {
    return 'message';
  }

  return 'system';
}

export function mapNotificationDtoToItem(dto: NotificationDto): NotificationItem {
  const isRead = Boolean(dto.readAt);
  const title = dto.title ?? 'Notification';
  const category = inferNotificationCategory(dto.title, dto.body, dto.data);

  return {
    id: dto.id,
    category,
    title,
    message: dto.body,
    timestamp: formatRelativeTimeOrDate(dto.createdAt),
    isRead,
    tag: typeof dto.data?.tag === 'string' ? dto.data.tag : undefined,
    reference: typeof dto.data?.reference === 'string' ? dto.data.reference : undefined,
    target: typeof dto.data?.target === 'string' ? (dto.data.target as NotificationTarget) : undefined,
    date: formatIstDate(dto.createdAt),
  };
}

export function mapSystemMessageDtoToItem(dto: SystemMessageDto): NotificationItem {
  const isRead = dto.isRead || Boolean(dto.readAt);
  const tag = dto.scope === 'WAREHOUSE' ? 'Warehouse' : dto.scope === 'ROLE' ? 'Role' : 'System';

  return {
    id: dto.id,
    category: 'system',
    title: dto.title,
    message: dto.body,
    timestamp: formatRelativeTimeOrDate(dto.createdAt),
    isRead,
    tag,
    date: formatIstDate(dto.createdAt),
  };
}
