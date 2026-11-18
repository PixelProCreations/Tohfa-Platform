/**
 * BR-160/BR-171 onboarding permissions: real notification (push service) and
 * location (OS) prompts, graceful denial / blocked, skip always works.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('react-native', async () => {
  const R = await import('react');
  return {
    ActivityIndicator: 'ActivityIndicator',
    Dimensions: { get: () => ({ width: 390, height: 844 }) },
    Image: 'Image',
    KeyboardAvoidingView: 'KeyboardAvoidingView',
    Linking: { openSettings: vi.fn(async () => undefined) },
    Modal: (props: { visible?: boolean; children?: React.ReactNode }) =>
      props.visible ? R.createElement('Modal', null, props.children) : null,
    PermissionsAndroid: {
      PERMISSIONS: {
        ACCESS_FINE_LOCATION: 'fine',
        ACCESS_COARSE_LOCATION: 'coarse',
        POST_NOTIFICATIONS: 'notif',
      },
      RESULTS: { GRANTED: 'granted', DENIED: 'denied', NEVER_ASK_AGAIN: 'never_ask_again' },
      request: vi.fn(async () => 'granted'),
    },
    Platform: { OS: 'android', Version: 34, select: (o: Record<string, unknown>) => o.android ?? o.default },
    ScrollView: 'ScrollView',
    StatusBar: 'StatusBar',
    StyleSheet: { create: (s: Record<string, unknown>) => s },
    Text: 'Text',
    TextInput: 'TextInput',
    TouchableOpacity: 'TouchableOpacity',
    View: 'View',
  };
});
vi.mock('react-native-svg', () => ({ default: 'Svg', Path: 'Path', Circle: 'Circle' }));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar' }));
vi.mock('../assets/images/permissions_hero_crate.jpg', () => ({ default: 1 }));
vi.mock('../assets/images/flying_delivery_bag.png', () => ({ default: 2 }));
vi.mock('../components', () => ({ ArrowRightFigmaIcon: 'ArrowRightFigmaIcon' }));

const push = vi.hoisted(() => ({ registerPushForSession: vi.fn() }));
vi.mock('../../../shell/notifications/push', () => push);

import { Linking, PermissionsAndroid } from 'react-native';
import { CustomerPermissionsScreen } from '../screens/CustomerPermissionsScreen';

const request = PermissionsAndroid.request as unknown as ReturnType<typeof vi.fn>;
let qc: QueryClient;

const flush = async () => {
  for (let i = 0; i < 5; i++) await act(async () => new Promise((r) => setTimeout(r, 0)));
};
function render(onNavigate = vi.fn()) {
  let root!: renderer.ReactTestRenderer;
  act(() => {
    root = renderer.create(
      <QueryClientProvider client={qc}>
        <CustomerPermissionsScreen onNavigate={onNavigate} />
      </QueryClientProvider>,
    );
  });
  return root;
}
const byId = (root: renderer.ReactTestRenderer, id: string) => root.root.findByProps({ testID: id });
const hasId = (root: renderer.ReactTestRenderer, id: string) => root.root.findAllByProps({ testID: id }).length > 0;
const press = async (root: renderer.ReactTestRenderer, id: string) => {
  await act(async () => {
    byId(root, id).props.onPress();
  });
  await flush();
};
const pressText = async (root: renderer.ReactTestRenderer, label: string) => {
  await act(async () => {
    root.root
      .findAllByType('TouchableOpacity' as never)
      .find((n) => n.findAllByType('Text' as never).some((t) => t.props.children === label))!
      .props.onPress();
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  request.mockResolvedValue('granted');
  push.registerPushForSession.mockResolvedValue({ status: 'registered', token: 't' });
  qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
});

describe('BR-160/BR-171 CustomerPermissionsScreen', () => {
  it('BR-160: Next registers push with permission prompt, asks for precise location, then opens the delivery chooser', async () => {
    const onNavigate = vi.fn();
    const root = render(onNavigate);
    await press(root, 'permissions-next');
    expect(push.registerPushForSession).toHaveBeenCalledWith({
      app: 'customer-mobile',
      locale: 'en',
      requestPermission: true,
    });
    expect(request).toHaveBeenCalledWith('fine');
    expect(byId(root, 'notification-status').props.children).toBe('Turned on');
    expect(byId(root, 'location-status').props.children).toBe('Turned on');
    expect(JSON.stringify(root.toJSON())).toContain('Where should we deliver?');

    await pressText(root, 'Use my current location');
    expect(onNavigate).toHaveBeenCalledWith('CustomerAddAddress', { addressSource: 'current' });
  });

  it('BR-160: denied notification + location still continues; current location falls back to manual entry', async () => {
    push.registerPushForSession.mockResolvedValue({ status: 'skipped', reason: 'permission-denied' });
    request.mockResolvedValue('denied');
    const onNavigate = vi.fn();
    const root = render(onNavigate);
    await press(root, 'permissions-next');
    expect(byId(root, 'notification-status').props.children).toContain('Not allowed');
    expect(byId(root, 'location-status').props.children).toContain('Not allowed');
    await pressText(root, 'Use my current location');
    expect(onNavigate).toHaveBeenCalledWith('CustomerAddAddress', { addressSource: 'manual' });
  });

  it('BR-160: blocked location shows Open Settings; Firebase missing falls back to the Android 13 notification prompt', async () => {
    push.registerPushForSession.mockResolvedValue({ status: 'skipped', reason: 'firebase-not-configured' });
    request.mockImplementation(async (p: string) => (p === 'notif' ? 'granted' : 'never_ask_again'));
    const root = render();
    await press(root, 'permissions-next');
    expect(request).toHaveBeenCalledWith('notif');
    expect(byId(root, 'notification-status').props.children).toBe('Turned on');
    expect(byId(root, 'location-status').props.children).toContain('Blocked');
    await press(root, 'location-status-settings');
    expect(Linking.openSettings).toHaveBeenCalled();
  });

  it('BR-160: Skip goes straight to the market without any prompt', async () => {
    const onNavigate = vi.fn();
    const root = render(onNavigate);
    await press(root, 'permissions-skip');
    expect(onNavigate).toHaveBeenCalledWith('CustomerLoadingMarket');
    expect(push.registerPushForSession).not.toHaveBeenCalled();
    expect(request).not.toHaveBeenCalled();
    expect(hasId(root, 'notification-status')).toBe(false);
  });
});
