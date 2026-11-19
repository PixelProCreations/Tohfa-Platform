import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  Image: 'Image',
  Platform: { OS: 'android', select: (o: Record<string, unknown>) => o['android'] ?? o['default'] },
  RefreshControl: 'RefreshControl',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s, hairlineWidth: 1, absoluteFill: {}, absoluteFillObject: {} },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
  StatusBar: 'StatusBar',
  Dimensions: { get: () => ({ width: 390, height: 844 }) },
  Modal: (props: any) => (props.visible ? React.createElement('Modal', null, props.children) : null),
}));
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 48, bottom: 24, left: 0, right: 0 }),
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Path: 'Path', Rect: 'Rect' }));
vi.mock('react-native-image-picker', () => ({ launchImageLibrary: vi.fn(), launchCamera: vi.fn() }));
vi.mock('../assets/images/products', () => ({
  ProductImages: new Proxy({}, { get: () => 1 }),
  CategoryImages: {},
  SectionBadges: {},
}));

const h = vi.hoisted(() => ({
  tickets: { data: undefined as any, isLoading: false, isError: false, error: null as any, refetch: vi.fn(), hasNextPage: false, isFetchingNextPage: false, fetchNextPage: vi.fn() },
  ticket: { data: undefined as any, isLoading: false, isError: false, error: null as any, refetch: vi.fn() },
  create: { mutateAsync: vi.fn(), isPending: false },
  cancel: { mutateAsync: vi.fn(), isPending: false },
  reply: { mutateAsync: vi.fn(), isPending: false },
  orders: { data: undefined as any, isLoading: false, isError: false, refetch: vi.fn() },
  pick: vi.fn(),
  upload: vi.fn(),
  help: { data: undefined as any, isLoading: false, isError: false, error: null as any, refetch: vi.fn() },
  notif: {
    items: [] as any[],
    unreadCount: 0,
    isPending: false,
    isError: false,
    isSuccess: true,
    error: null as any,
    hasNextPage: false,
    isFetchingNextPage: false,
    fetchNextPage: vi.fn(),
    refetch: vi.fn(),
  },
  markRead: { mutate: vi.fn() },
  markAll: { mutate: vi.fn(), isPending: false },
}));

vi.mock('../api/support', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useSupportTickets: () => h.tickets,
  useSupportTicket: () => h.ticket,
  useCreateSupportTicket: () => h.create,
  useCancelSupportTicket: () => h.cancel,
  useReplySupportTicket: () => h.reply,
  useSupportOrders: () => h.orders,
  pickIssuePhotos: (n: number) => h.pick(n),
  uploadIssuePhoto: (...a: unknown[]) => h.upload(...a),
}));
vi.mock('../api/help', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useHelpArticles: () => h.help,
}));
vi.mock('../api/notifications', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  useNotifications: () => h.notif,
  useMarkRead: () => h.markRead,
  useMarkAllRead: () => h.markAll,
}));

import { ApiError } from '../../../shell/api/client';
import { CustomerSupportScreen } from '../screens/CustomerSupportScreen';
import { TrackSupportRequestScreen } from '../screens/TrackSupportRequestScreen';
import { ContactSupportScreen } from '../screens/ContactSupportScreen';
import { CustomerHelpScreen } from '../screens/CustomerHelpScreen';
import { CustomerNotificationsScreen } from '../screens/CustomerNotificationsScreen';
import {
  buildTicketSubject,
  capPhotos,
  deriveTimeline,
  issueToCategory,
  statusesForTab,
  validateTicketDraft,
  canCancel,
  canReply,
  createSupportTicket,
  supportTicketFingerprint,
  supportTicketIdempotencyKeys,
} from '../api/support';
import { api } from '../../../shell/api/client';
import { groupHelpArticles, searchHelpGroups } from '../api/help';
import { groupByIstDay, notificationTarget, markOneRead, markAllRead } from '../api/notifications';

const problem = (status: number, code: string, extra: Record<string, unknown> = {}) =>
  new ApiError({ type: 'x', title: code, status, code, ...extra } as any);

const json = (tree: any) => JSON.stringify(tree.toJSON(), (k, v) => (k === '_owner' || k === 'refreshControl' ? undefined : v));
const mount = async (el: React.ReactElement) => {
  let tree: any;
  await act(async () => {
    tree = renderer.create(el);
  });
  return tree;
};
const press = async (tree: any, label: string) => {
  await act(async () => {
    await tree.root.findByProps({ accessibilityLabel: label }).props.onPress();
  });
};
const typeInto = async (tree: any, label: string, text: string) => {
  await act(async () => {
    tree.root.findByProps({ accessibilityLabel: label }).props.onChangeText(text);
  });
};

const ticket = (over: Record<string, unknown> = {}) => ({
  id: 't1',
  ticketNumber: 'TKT-2026-00001',
  orderId: 'o1',
  orderNumber: 'ORD-1',
  category: 'QUALITY',
  subject: 'Quality issue - ORD-1',
  description: 'Product: Apples\nBad',
  photos: [],
  status: 'OPEN',
  messageCount: 1,
  resolvedAt: null,
  createdAt: '2026-11-15T04:11:00Z',
  updatedAt: '2026-11-15T04:11:00Z',
  messages: [
    { id: 'm1', ticketId: 't1', sender: 'SUPPORT', message: 'We are on it', attachmentUrl: null, redacted: false, createdAt: '2026-11-15T05:00:00Z' },
    { id: 'm2', ticketId: 't1', sender: 'SUPPORT', message: 'secret', attachmentUrl: null, redacted: true, createdAt: '2026-11-15T04:30:00Z' },
  ],
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  h.tickets.data = { pages: [{ items: [ticket()], total: 1, page: 1, hasMore: false }] };
  h.tickets.isLoading = false;
  h.tickets.isError = false;
  h.tickets.hasNextPage = false;
  h.ticket.data = ticket();
  h.ticket.isLoading = false;
  h.ticket.isError = false;
  h.create.isPending = false;
  h.orders.data = [{ id: 'o1', orderNumber: 'ORD-1', placedAt: '2026-11-10T00:00:00Z', itemCount: 2, productNames: ['Apples'] }];
  h.orders.isLoading = false;
  h.orders.isError = false;
  h.help.data = {
    items: [
      { id: 'a2', category: 'Payments', locale: 'en', title: 'Add money?', body: 'Use Add Money', sortOrder: 2 },
      { id: 'a1', category: 'Orders', locale: 'en', title: 'Track order?', body: 'Open My Orders', sortOrder: 1 },
    ],
    categories: ['Orders', 'Payments'],
    contact: { phone: '+911234567890', email: 'help@tohfa.in' },
  };
  h.help.isLoading = false;
  h.help.isError = false;
  h.notif.items = [];
  h.notif.isPending = false;
  h.notif.isError = false;
  h.notif.isSuccess = true;
  h.notif.unreadCount = 0;
});

describe('support model helpers', () => {
  it('maps issue types to API categories and builds the subject', () => {
    expect(issueToCategory('quality_issue' as any)).toBe('QUALITY');
    expect(issueToCategory('payments_wallet' as any)).toBe('PAYMENT');
    expect(issueToCategory('account_profile' as any)).toBe('OTHER');
    expect(buildTicketSubject('Quality issue', 'ORD-1')).toBe('Quality issue - ORD-1');
    expect(buildTicketSubject('x'.repeat(400), 'ORD-1').length).toBe(250);
  });
  it('caps photos at 5 and validates drafts', () => {
    expect(capPhotos([1, 2, 3, 4], [5, 6, 7])).toEqual([1, 2, 3, 4, 5]);
    expect(validateTicketDraft({ relatedTo: 'order', orderId: null, description: 'x', photosUploading: false })).toBe('order_required');
    expect(validateTicketDraft({ relatedTo: 'other', orderId: null, description: ' ', photosUploading: false })).toBe('description_required');
    expect(validateTicketDraft({ relatedTo: 'other', orderId: null, description: 'ok', photosUploading: true })).toBe('photos_uploading');
    expect(validateTicketDraft({ relatedTo: 'other', orderId: null, description: 'ok', photosUploading: false })).toBeNull();
  });
  it('tabs, timeline and cancel/reply rules', () => {
    expect(statusesForTab('RESOLVED')).toEqual(['RESOLVED', 'CLOSED']);
    expect(statusesForTab('CANCELLED')).toEqual(['CANCELLED']);
    expect(canCancel('OPEN')).toBe(true);
    expect(canCancel('IN_PROGRESS')).toBe(false);
    expect(canReply('CLOSED')).toBe(false);
    const steps = deriveTimeline({ status: 'IN_PROGRESS', createdAt: 'a', updatedAt: 'b', resolvedAt: null });
    expect(steps.map((s) => s.state)).toEqual(['done', 'current', 'pending']);
    expect(deriveTimeline({ status: 'CANCELLED', createdAt: 'a', updatedAt: 'b', resolvedAt: null }).map((s) => s.key)).toEqual(['received', 'cancelled']);
  });
});

describe('BR-212: create-ticket Idempotency-Key', () => {
  const body = { category: 'OTHER' as const, subject: 'Other', description: 'Need help' };
  beforeEach(() => supportTicketIdempotencyKeys.reset());
  it('BR-212: same body reuses the key on retry; an edit or a success starts a new one', () => {
    const k1 = supportTicketIdempotencyKeys.keyFor(supportTicketFingerprint(body));
    expect(supportTicketIdempotencyKeys.keyFor(supportTicketFingerprint({ ...body }))).toBe(k1);
    const k2 = supportTicketIdempotencyKeys.keyFor(supportTicketFingerprint({ ...body, description: 'Need more help' }));
    expect(k2).not.toBe(k1);
    supportTicketIdempotencyKeys.reset();
    expect(supportTicketIdempotencyKeys.keyFor(supportTicketFingerprint({ ...body, description: 'Need more help' }))).not.toBe(k2);
  });
  it('BR-212: fingerprint ignores field order but not photo ids or order', () => {
    const reordered = { description: 'Need help', subject: 'Other', category: 'OTHER' as const };
    expect(supportTicketFingerprint(reordered)).toBe(supportTicketFingerprint(body));
    expect(supportTicketFingerprint({ ...body, photoUploadIds: ['u1'] })).not.toBe(supportTicketFingerprint(body));
    expect(supportTicketFingerprint({ ...body, orderId: 'o1' })).not.toBe(supportTicketFingerprint(body));
  });
  it('BR-212: POST /support/tickets sends the Idempotency-Key', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValueOnce(ticket() as any);
    await createSupportTicket(body, 'key-1');
    expect(post).toHaveBeenCalledWith('/support/tickets', body, 'key-1', { timeoutMs: 15000 });
    post.mockRestore();
  });
});

describe('CustomerSupportScreen (My requests)', () => {
  it('lists real tickets, has a Cancelled tab and opens the tracker', async () => {
    const nav = vi.fn();
    const tree = await mount(<CustomerSupportScreen onNavigate={nav} />);
    const out = json(tree);
    expect(out).toContain('TKT-2026-00001');
    expect(out).toContain('Quality issue - ORD-1');
    expect(out).toContain('Cancelled');
    expect(out).not.toContain('SUP-2026');
    await press(tree, 'Request TKT-2026-00001');
    expect(nav).toHaveBeenCalledWith('TrackSupportRequest', { ticketId: 't1' });
  });
  it('shows loading, empty and error states', async () => {
    h.tickets.isLoading = true;
    expect(json(await mount(<CustomerSupportScreen />))).toContain('Loading requests');
    h.tickets.isLoading = false;
    h.tickets.data = { pages: [{ items: [], total: 0, page: 1, hasMore: false }] };
    expect(json(await mount(<CustomerSupportScreen />))).toContain('No requests here yet');
    h.tickets.data = undefined;
    h.tickets.isError = true;
    h.tickets.error = problem(500, 'INTERNAL');
    const tree = await mount(<CustomerSupportScreen />);
    await press(tree, 'Retry requests');
    expect(h.tickets.refetch).toHaveBeenCalled();
  });
});

describe('TrackSupportRequestScreen', () => {
  it('renders the real ticket, timeline and thread (redacted and support/you labels)', async () => {
    const out = json(await mount(<TrackSupportRequestScreen ticketId="t1" />));
    expect(out).toContain('TKT-2026-00001');
    expect(out).toContain('ORD-1');
    expect(out).toContain('Apples');
    expect(out).toContain('Quality issue');
    expect(out).toContain('We are on it');
    expect(out).toContain('[details removed]');
    expect(out).not.toContain('secret');
    expect(out).toContain('Under review');
  });
  it('sends a reply and cancels an OPEN ticket', async () => {
    h.reply.mutateAsync.mockResolvedValue({});
    h.cancel.mutateAsync.mockResolvedValue({});
    const { Alert } = await import('react-native');
    const tree = await mount(<TrackSupportRequestScreen ticketId="t1" />);
    await typeInto(tree, 'Reply', 'Thanks');
    await press(tree, 'Send reply');
    expect(h.reply.mutateAsync).toHaveBeenCalledWith('Thanks');
    await press(tree, 'Cancel Request');
    const buttons = (Alert.alert as any).mock.calls[0]![2];
    await act(async () => {
      await buttons[1].onPress();
    });
    expect(h.cancel.mutateAsync).toHaveBeenCalled();
  });
  it('hides cancel for non-OPEN, hides composer for CLOSED, handles 409 and 404', async () => {
    h.ticket.data = ticket({ status: 'IN_PROGRESS' });
    expect(json(await mount(<TrackSupportRequestScreen ticketId="t1" />))).not.toContain('Cancel Request');
    h.ticket.data = ticket({ status: 'CLOSED' });
    expect(json(await mount(<TrackSupportRequestScreen ticketId="t1" />))).not.toContain('Send reply');
    h.ticket.data = ticket();
    h.cancel.mutateAsync.mockRejectedValueOnce(problem(409, 'CONFLICT'));
    const { Alert } = await import('react-native');
    const tree = await mount(<TrackSupportRequestScreen ticketId="t1" />);
    await press(tree, 'Cancel Request');
    const buttons = (Alert.alert as any).mock.calls.at(-1)![2];
    await act(async () => {
      await buttons[1].onPress();
    });
    expect(json(tree)).toContain('can no longer be cancelled');
    h.ticket.data = undefined;
    h.ticket.isError = true;
    h.ticket.error = problem(404, 'NOT_FOUND');
    expect(json(await mount(<TrackSupportRequestScreen ticketId="zz" />))).toContain('Request not found');
  });
});

describe('ContactSupportScreen', () => {
  const fillOther = async (tree: any) => {
    await press(tree, 'Related to Other');
    await typeInto(tree, 'Description', 'Need help with my account');
  };
  const created = ticket({ id: 'new1', ticketNumber: 'TKT-2026-00099', orderId: null, orderNumber: null, subject: 'Other', description: 'x' });

  it('uses real orders, no hardcoded samples, and keeps submit disabled until valid', async () => {
    const tree = await mount(<ContactSupportScreen />);
    const out = json(tree);
    expect(out).toContain('ORD-1');
    expect(out).not.toContain('ORD-20261115-0039');
    expect(tree.root.findByProps({ accessibilityLabel: 'Send to Support' }).props.disabled).toBe(true);
    await typeInto(tree, 'Description', 'Apples were bad');
    expect(tree.root.findByProps({ accessibilityLabel: 'Send to Support' }).props.disabled).toBe(false);
  });
  it('creates the ticket with category, order and subject, then offers tracking', async () => {
    h.create.mutateAsync.mockResolvedValue({ ...created, orderId: 'o1', orderNumber: 'ORD-1' });
    const nav = vi.fn();
    const tree = await mount(<ContactSupportScreen onNavigate={nav} />);
    await typeInto(tree, 'Description', 'Apples were bad');
    await press(tree, 'Send to Support');
    const body = h.create.mutateAsync.mock.calls[0]![0];
    expect(body).toMatchObject({ category: 'OTHER', orderId: 'o1', description: 'Apples were bad' });
    expect(body.subject).toContain('ORD-1');
    expect(json(tree)).toContain('TKT-2026-00099');
  });
  it('uploads picked photos via signed upload, sends upload ids, and caps at 5', async () => {
    const photo = (n: number) => ({ uri: `file://${n}`, base64: 'AAAA', type: 'image/jpeg', fileName: `${n}.jpg` });
    h.pick.mockResolvedValueOnce({ photos: [photo(1), photo(2)], rejected: 0 });
    h.upload.mockResolvedValueOnce('u1').mockResolvedValueOnce('u2');
    h.create.mutateAsync.mockResolvedValue(created);
    const tree = await mount(<ContactSupportScreen />);
    await fillOther(tree);
    await press(tree, 'Add photo');
    expect(h.pick).toHaveBeenCalledWith(5);
    expect(h.upload).toHaveBeenCalledTimes(2);
    await press(tree, 'Submit Request');
    expect(h.create.mutateAsync.mock.calls[0]![0].photoUploadIds).toEqual(['u1', 'u2']);
  });
  it('shows a retry on a failed upload and blocks submit until fixed', async () => {
    h.pick.mockResolvedValueOnce({ photos: [{ uri: 'file://1', base64: 'AAAA', type: 'image/png', fileName: '1.png' }], rejected: 0 });
    h.upload.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce('u9');
    const tree = await mount(<ContactSupportScreen />);
    await fillOther(tree);
    await press(tree, 'Add photo');
    expect(tree.root.findByProps({ accessibilityLabel: 'Submit Request' }).props.disabled).toBe(true);
    await press(tree, 'Retry photo upload');
    expect(tree.root.findByProps({ accessibilityLabel: 'Submit Request' }).props.disabled).toBe(false);
  });
  it('maps 422 and network errors (resend is safe, or check My requests)', async () => {
    const { NetworkError } = await import('../../../shell/api/client');
    h.create.mutateAsync.mockRejectedValueOnce(problem(422, 'VALIDATION_FAILED', { errors: { 'body.description': ['bad'] } }));
    const tree = await mount(<ContactSupportScreen />);
    await fillOther(tree);
    await press(tree, 'Submit Request');
    expect(json(tree)).toContain('alert');
    h.create.mutateAsync.mockRejectedValueOnce(new (NetworkError as any)('offline'));
    await press(tree, 'Submit Request');
    expect(json(tree)).toContain('My requests');
  });
});

describe('Help', () => {
  it('groups by category order, sorts by sortOrder, numbers questions and searches', () => {
    const groups = groupHelpArticles(h.help.data);
    expect(groups.map((g) => g.category)).toEqual(['Orders', 'Payments']);
    expect(searchHelpGroups(groups, 'add money').map((g) => g.category)).toEqual(['Payments']);
    expect(searchHelpGroups(groups, 'zzz')).toEqual([]);
  });
  it('renders API articles, expands categories and searches', async () => {
    const tree = await mount(<CustomerHelpScreen />);
    let out = json(tree);
    expect(out).toContain('1. Track order?');
    expect(out).toContain('Open My Orders');
    expect(out).toContain('+911234567890');
    await press(tree, 'Payments');
    expect(json(tree)).toContain('1. Add money?');
    await typeInto(tree, 'Search help', 'add money');
    out = json(tree);
    expect(out).toContain('Use Add Money');
    expect(out).not.toContain('Track order?');
  });
  it('shows loading, empty and error', async () => {
    h.help.isLoading = true;
    expect(json(await mount(<CustomerHelpScreen />))).toContain('Loading help');
    h.help.isLoading = false;
    h.help.data = { items: [], categories: [], contact: {} };
    expect(json(await mount(<CustomerHelpScreen />))).toContain('not available yet');
    h.help.data = undefined;
    h.help.isError = true;
    h.help.error = problem(500, 'INTERNAL');
    const tree = await mount(<CustomerHelpScreen />);
    await press(tree, 'Retry help');
    expect(h.help.refetch).toHaveBeenCalled();
  });
});

describe('Notifications', () => {
  const n = (id: string, createdAt: string, readAt: string | null, data: Record<string, unknown> = {}): any => ({
    id,
    channel: 'IN_APP',
    title: `T-${id}`,
    body: `B-${id}`,
    locale: 'en',
    data,
    readAt,
    createdAt,
  });

  it('groups by IST day with boundaries', () => {
    // now = 17 Nov 2026 00:30 IST (= 16 Nov 19:00Z)
    const now = new Date('2026-11-16T19:00:00Z');
    const sections = groupByIstDay(
      [n('a', '2026-11-16T18:31:00Z', null), n('b', '2026-11-16T18:29:00Z', null), n('c', '2026-11-14T00:00:00Z', null)],
      now,
    );
    expect(sections.map((s) => [s.key, s.items.map((i) => i.id)])).toEqual([
      ['today', ['a']],
      ['yesterday', ['b']],
      ['earlier', ['c']],
    ]);
  });
  it('maps push/notification data to deep links', () => {
    expect(notificationTarget({ orderId: 'o1', orderNumber: 'ORD-1' })).toEqual({ screen: 'OrderTracking', params: { orderId: 'o1' } });
    expect(notificationTarget({ amount: '10.00', balance: '90.00', reference: 'r' })).toEqual({ screen: 'CustomerWallet' });
    expect(notificationTarget({ ticketId: 't1' })).toEqual({ screen: 'TrackSupportRequest', params: { ticketId: 't1' } });
    expect(notificationTarget({ foo: 'bar' })).toBeNull();
  });
  it('optimistic cache helpers adjust unreadCount', () => {
    const data: any = { pages: [{ items: [n('a', 'x', null), n('b', 'x', null)], page: { nextCursor: null, hasMore: false }, unreadCount: 2 }], pageParams: [undefined] };
    const one = markOneRead(data, 'a', 'now');
    expect(one.pages[0]!.unreadCount).toBe(1);
    expect(one.pages[0]!.items[0]!.readAt).toBe('now');
    expect(markAllRead(data, 'now').pages[0]!.unreadCount).toBe(0);
  });
  it('shows rows, marks read and navigates on tap, and marks all read', async () => {
    h.notif.items = [n('1', new Date().toISOString(), null, { orderId: 'o9' })];
    h.notif.unreadCount = 1;
    const nav = vi.fn();
    const tree = await mount(<CustomerNotificationsScreen onNavigate={nav} />);
    expect(json(tree)).toContain('T-1');
    await act(async () => {
      tree.root.findByProps({ testID: 'notification-row-1' }).props.onPress();
    });
    expect(h.markRead.mutate).toHaveBeenCalledWith('1');
    expect(nav).toHaveBeenCalledWith('OrderTracking', { orderId: 'o9' });
    await act(async () => {
      tree.root.findByProps({ testID: 'notifications-mark-all' }).props.onPress();
    });
    expect(h.markAll.mutate).toHaveBeenCalled();
  });
  it('shows empty, skeleton and error states', async () => {
    expect(json(await mount(<CustomerNotificationsScreen />))).toContain('caught up');
    h.notif.isPending = true;
    h.notif.isSuccess = false;
    expect(json(await mount(<CustomerNotificationsScreen />))).toContain('notifications-skeleton');
    h.notif.isPending = false;
    h.notif.isError = true;
    h.notif.error = problem(500, 'INTERNAL');
    const tree = await mount(<CustomerNotificationsScreen />);
    await act(async () => {
      tree.root.findByProps({ testID: 'notifications-retry' }).props.onPress();
    });
    expect(h.notif.refetch).toHaveBeenCalled();
  });
});
