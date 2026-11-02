/**
 * System Messages (design M13-04): the announcements visible to the signed-in
 * admin, GET /system-messages, with a real mark-read
 * (POST /system-messages/{id}/read). BR-65.
 *
 * The API's SystemMessage carries no category / message type and no human
 * message number (only a uuid and a SYSTEM_WIDE / WAREHOUSE / ROLE scope), so
 * the design's "Message Type" and "Message ID" are not shown. The pure parts
 * (row mapping, time window, permission gates) are tested directly; the wiring
 * is pinned by reading the sources, because JSX cannot render in this
 * plain-Node vitest.
 */
import { afterEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { SystemMessageDto } from '../api/notifications';
import en from '../i18n/en.json';
import ta from '../i18n/ta.json';
import {
  SYSTEM_MESSAGE_CODES,
  systemMessageAccess,
  systemMessageWindow,
  toSystemMessageRow,
} from '../screens/warehouse/notifications/mappers';
import { formatAdminTime } from '../utils/datetime';

const NOTIFICATIONS_DIR = path.join(__dirname, '..', 'screens', 'warehouse', 'notifications');

function read(file: string): string {
  return fs.readFileSync(path.join(NOTIFICATIONS_DIR, file), 'utf8');
}

/** Source with comment lines dropped, so doc comments do not count. */
function code(file: string): string {
  return read(file)
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line) && !/^\s*\{\/\*/.test(line))
    .join('\n');
}

function message(overrides: Partial<SystemMessageDto> = {}): SystemMessageDto {
  return {
    id: '5f1c2a9e-0000-4000-8000-000000000512',
    scope: 'SYSTEM_WIDE',
    title: 'System Maintenance',
    body: 'TOHFA services may be temporarily unavailable during the scheduled maintenance window.',
    locale: 'en',
    // 25 Sep 2026, 08:00 PM IST.
    startsAt: '2026-09-25T14:30:00Z',
    // 25 Sep 2026, 09:00 PM IST.
    endsAt: '2026-09-25T15:30:00Z',
    createdAt: '2026-09-24T10:00:00Z',
    isRead: false,
    readAt: null,
    ...overrides,
  };
}

const ORIGINAL_TZ = process.env.TZ;
afterEach(() => {
  process.env.TZ = ORIGINAL_TZ;
});

describe('formatAdminTime', () => {
  it('is the IST clock time of an instant', () => {
    expect(formatAdminTime('2026-09-25T14:30:00Z')).toBe('08:00 PM');
    expect(formatAdminTime('2026-09-25T03:35:00Z')).toBe('09:05 AM');
  });

  it("is '' for a value that is not a date", () => {
    expect(formatAdminTime('not-a-date')).toBe('');
  });

  it('ignores the device time zone', () => {
    process.env.TZ = 'America/Los_Angeles';
    expect(formatAdminTime('2026-09-25T14:30:00Z')).toBe('08:00 PM');
  });
});

describe('systemMessageWindow: the time window from startsAt / endsAt (IST)', () => {
  it('a same-day window shows both clock times', () => {
    expect(systemMessageWindow('2026-09-25T14:30:00Z', '2026-09-25T15:30:00Z')).toBe('08:00 PM – 09:00 PM');
  });

  it('an open-ended message (endsAt null) shows only its start', () => {
    expect(systemMessageWindow('2026-09-25T14:30:00Z', null)).toBe('From 08:00 PM');
  });

  it('a window ending on a later IST day names that day', () => {
    // Ends 26 Sep 2026, 06:00 AM IST.
    expect(systemMessageWindow('2026-09-25T14:30:00Z', '2026-09-26T00:30:00Z')).toBe('08:00 PM – 26 Sep 2026 · 06:00 AM');
  });
});

describe('toSystemMessageRow', () => {
  it('BR-65: maps title, body, read state, IST start day and window', () => {
    expect(toSystemMessageRow(message())).toEqual({
      id: '5f1c2a9e-0000-4000-8000-000000000512',
      title: 'System Maintenance',
      message: 'TOHFA services may be temporarily unavailable during the scheduled maintenance window.',
      isRead: false,
      date: '25 Sep 2026',
      window: '08:00 PM – 09:00 PM',
    });
  });

  it('BR-65: keeps the per-user read state the server reports', () => {
    expect(toSystemMessageRow(message({ isRead: true, readAt: '2026-09-25T16:00:00Z' })).isRead).toBe(true);
  });

  it('BR-65c: carries no message type, category or scope (the API has no message type)', () => {
    const row = toSystemMessageRow(message({ scope: 'WAREHOUSE' })) as unknown as Record<string, unknown>;
    expect(Object.keys(row).sort()).toEqual(['date', 'id', 'isRead', 'message', 'title', 'window']);
    expect(row).not.toHaveProperty('scope');
    expect(row).not.toHaveProperty('type');
    expect(row).not.toHaveProperty('category');
  });
});

describe('systemMessageAccess: the rbac codes the System Messages entry and mark-read check', () => {
  it('uses the interim own-notification codes the endpoints declare (docs/openapi.yaml x-permission)', () => {
    expect(SYSTEM_MESSAGE_CODES).toEqual({ view: 'notification.own.view', markRead: 'notification.own.mark_read' });
  });

  it('BR-65: hides the entry without notification.own.view', () => {
    expect(systemMessageAccess(() => false)).toEqual({ view: false, markRead: false });
    expect(systemMessageAccess((code) => code === 'notification.own.mark_read').view).toBe(false);
  });

  it('BR-65: offers mark-read only with notification.own.mark_read', () => {
    expect(systemMessageAccess((code) => code === 'notification.own.view')).toEqual({ view: true, markRead: false });
    expect(systemMessageAccess(() => true)).toEqual({ view: true, markRead: true });
  });
});

describe('System Messages wiring (source)', () => {
  it('NotificationsFlow has a SystemMessages route that renders the screen', () => {
    expect(code('types.ts')).toMatch(/NotificationsRoute\s*=[^;]*'SystemMessages'/);
    expect(code('NotificationsFlow.tsx')).toMatch(/case 'SystemMessages':/);
    expect(code('NotificationsFlow.tsx')).toMatch(/<SystemMessagesScreen/);
  });

  it('the list entry is passed only when systemMessageAccess allows viewing', () => {
    const flow = code('NotificationsFlow.tsx');
    expect(flow).toMatch(/systemMessageAccess\(/);
    expect(flow).toMatch(/onOpenSystemMessages=\{[^}]*\.view \? \(\) => navigate\('SystemMessages'\) : undefined\}/);
    // The list screen draws the entry only when the host passes it.
    expect(code('NotificationsScreen.tsx')).toMatch(/onOpenSystemMessages !== undefined \?/);
  });

  it('mark-read is offered only with mark_read and disabled while its request is pending', () => {
    const flow = code('NotificationsFlow.tsx');
    expect(flow).toMatch(/onMarkRead=\{[^}]*\.markRead \?/);
    expect(flow).toMatch(/markingId=\{markRead\.isPending \? markRead\.variables : undefined\}/);
    expect(code('SystemMessagesScreen.tsx')).toMatch(/disabled=\{marking\}/);
  });

  it('the hooks read GET /system-messages paged and mark read with a real POST that refetches the list', () => {
    const hooks = code('useNotificationsData.ts');
    expect(hooks).toMatch(/export function useSystemMessageList\(\)/);
    expect(hooks).toMatch(/useCursorList\([\s\S]*?listSystemMessages\(\{ cursor \}, signal\)/);
    expect(hooks).toMatch(/export function useMarkSystemMessageRead\(\)[\s\S]*?markSystemMessageRead\(id\)[\s\S]*?invalidates: \[adminKeys\.module\(SYSTEM_MESSAGES\)\]/);
  });

  it('the system-message writes send no Idempotency-Key, like the sibling notification reads', () => {
    const api = fs.readFileSync(path.join(__dirname, '..', 'api', 'notifications.ts'), 'utf8');
    expect(api).toMatch(/adminPost<SystemMessageDto>\(`\/system-messages\/\$\{encodeURIComponent\(id\)\}\/read`, undefined\)/);
    expect(code('useNotificationsData.ts')).not.toMatch(/Idempotency|useIdempotencyKey/);
  });

  it('the screen has loading, error-with-retry, empty, pull-to-refresh and load-more', () => {
    const screen = code('SystemMessagesScreen.tsx');
    expect(screen).toMatch(/<AdminLoadingState/);
    expect(screen).toMatch(/<AdminErrorState error=\{error\} onRetry=\{onRetry\}/);
    expect(screen).toMatch(/<AdminEmptyState/);
    expect(screen).toMatch(/<RefreshControl/);
    expect(screen).toMatch(/onEndReached=\{hasMore \? onLoadMore : undefined\}/);
  });

  it('the screen shows no message type or scope (the API has no message type)', () => {
    const screen = code('SystemMessagesScreen.tsx');
    expect(screen).not.toMatch(/\.scope\b/);
    expect(screen).not.toMatch(/Message Type|messageType/);
  });
});

describe('System Messages strings (en + ta)', () => {
  const KEYS = [
    'systemMessages.title',
    'systemMessages.entry.title',
    'systemMessages.entry.subtitle',
    'systemMessages.empty.title',
    'systemMessages.empty.subtitle',
    'systemMessages.field.date',
    'systemMessages.field.time',
    'systemMessages.field.status',
    'systemMessages.status.read',
    'systemMessages.status.unread',
    'systemMessages.window.range',
    'systemMessages.window.openEnded',
    'systemMessages.markRead',
    'systemMessages.marking',
    'systemMessages.close',
    'notifications.a11y.back',
  ];

  it.each(KEYS)('%s exists in en.json and ta.json', (key) => {
    expect(en).toHaveProperty([key]);
    expect(ta).toHaveProperty([key]);
  });
});
