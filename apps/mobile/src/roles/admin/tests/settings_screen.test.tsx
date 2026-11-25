/**
 * TohfaAdminSettingsScreen: hub renders, source-guard checks
 * (no role strings, no hex, no fixtures, file size, mobile-ui usage).
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Alert } from 'react-native';
import type { Can } from '../permissions/can';

vi.mock('react-native', () => ({
  Alert: { alert: vi.fn() },
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  Modal: 'Modal',
  Platform: { OS: 'ios', select: (o: Record<string, unknown>) => o['ios'] ?? o['default'] },
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s, flatten: (s: unknown) => s },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Path: 'Path',
  Rect: 'Rect',
  Line: 'Line',
}));
vi.mock('@tohfa/mobile-ui', () => ({ ScreenStatusBar: 'ScreenStatusBar', SafeAreaView: 'SafeAreaView' }));
vi.mock('../screens/warehouse/profile-settings/SecurityScreen', () => ({ SecurityScreen: () => null }));
vi.mock('../screens/warehouse/profile-settings/SessionSecurityScreen', () => ({ SessionSecurityScreen: () => null }));
vi.mock('../screens/warehouse/profile-settings/HelpSupportScreen', () => ({ HelpSupportScreen: () => null }));
vi.mock('../screens/warehouse/profile-settings/AboutScreen', () => ({ AboutScreen: () => null }));
vi.mock('../screens/warehouse/profile-settings/NotificationSettingsScreen', () => ({ NotificationSettingsScreen: () => null }));
vi.mock('../screens/warehouse/wallet-cashtopup/WalletParts', () => ({
  WalletScreen: ({ children }: { children: React.ReactNode }) => React.createElement('View', null, children),
  WalletButton: (p: { label: string; onPress?: () => void; disabled?: boolean }) =>
    React.createElement('WalletButton', { label: p.label, onPress: p.onPress, disabled: p.disabled }, p.label),
  InfoNote: ({ children }: { children: React.ReactNode }) => React.createElement('InfoNote', null, children),
  Card: ({ children }: { children: React.ReactNode }) => React.createElement('View', null, children),
  SectionTitle: ({ children }: { children: React.ReactNode }) => React.createElement('Text', null, children),
}));
// Only the network call is replaced: the hook, mappers and error classes stay real.
vi.mock('../api/profile', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  changeOwnPassword: vi.fn(),
}));
vi.mock('../screens/warehouse/profile-settings/ProfileParts', () => ({
  ConfirmDialog: () => null,
  AboutIcon: () => null,
  BellIcon: () => null,
  DeviceIcon: () => null,
  HelpCircleIcon: () => null,
  KeyIcon: () => null,
  LogoutIcon: () => null,
  ShieldIcon: () => null,
  UserIcon: () => null,
  PASSWORD_MIN_LENGTH: 10,
}));

afterEach(() => vi.restoreAllMocks());

import { TohfaAdminSettingsScreen } from '../screens/settings/TohfaAdminSettingsScreen';
import { en } from '../i18n';
import { changeOwnPassword } from '../api/profile';
import { ApiError } from '../../../shell/api/client';

const allowAll: Can = () => true;
const denyAll: Can = () => false;

async function mount(can: Can, extra: Record<string, unknown> = {}) {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    tree = renderer.create(
      <QueryClientProvider client={client}>
        <TohfaAdminSettingsScreen can={can} onBack={() => undefined} {...(extra as object)} />
      </QueryClientProvider>,
    );
  });
  return tree;
}

describe('TohfaAdminSettingsScreen hub', () => {
  it('renders without crashing with allowAll can', async () => {
    const tree = await mount(allowAll);
    expect(tree.toJSON()).not.toBeNull();
  });

  it('renders without crashing with denyAll can', async () => {
    const tree = await mount(denyAll);
    expect(tree.toJSON()).not.toBeNull();
  });

  it('shows Settings title', async () => {
    const tree = await mount(allowAll);
    expect(JSON.stringify(tree.toJSON())).toContain(en['settings.title']);
  });

  it('shows Logout row', async () => {
    const tree = await mount(allowAll);
    expect(JSON.stringify(tree.toJSON())).toContain(en['settings.row.logout']);
  });

  it('shows Profile row when onNavigateProfile is provided', async () => {
    const tree = await mount(allowAll, { onNavigateProfile: () => undefined });
    expect(JSON.stringify(tree.toJSON())).toContain(en['settings.row.profile']);
  });

  it('shows Profile row even when onNavigateProfile is not provided (toast on press)', async () => {
    // The owner rule is: every design element must be visible. The Profile row is always
    // rendered; pressing it without a callback shows a "Not available yet" alert.
    const tree = await mount(allowAll);
    expect(JSON.stringify(tree.toJSON())).toContain(en['settings.row.profile']);
  });
});

// ─── Change password: must hit the real API, never fake success ──────────────

const apiMock = vi.mocked(changeOwnPassword);
const alertMock = vi.mocked(Alert.alert);

function textsOf(node: renderer.ReactTestInstance): string {
  return node.findAllByType('Text' as never).map((n) => [n.props.children].flat().join('')).join('|');
}

async function openChangePassword(tree: renderer.ReactTestRenderer) {
  const row = tree.root.findAll(
    (n) => (n.type as unknown) === 'TouchableOpacity' && textsOf(n).includes(en['settings.row.changePassword']),
  )[0];
  await act(async () => row?.props.onPress());
}

function fill(tree: renderer.ReactTestRenderer, current: string, next: string, confirm: string) {
  const inputs = tree.root.findAllByType('TextInput' as never);
  act(() => {
    inputs[0]?.props.onChangeText(current);
    inputs[1]?.props.onChangeText(next);
    inputs[2]?.props.onChangeText(confirm);
  });
}

async function pressUpdate(tree: renderer.ReactTestRenderer) {
  const btn = tree.root.findAll(
    (n) => (n.type as unknown) === 'WalletButton' && n.props.label === en['settings.changePassword.update'],
  )[0];
  await act(async () => btn?.props.onPress());
}

const VALID_CURRENT = 'old-Password-1';
const VALID_NEW = 'new-Password-123';

describe('TohfaAdminSettingsScreen change password', () => {
  afterEach(() => {
    apiMock.mockReset();
    alertMock.mockClear();
  });

  it('calls the real change-password API exactly once and shows success only after it resolves', async () => {
    let resolve!: () => void;
    apiMock.mockReturnValue(new Promise<void>((r) => { resolve = r; }));
    const tree = await mount(allowAll);
    await openChangePassword(tree);
    fill(tree, VALID_CURRENT, VALID_NEW, VALID_NEW);
    await pressUpdate(tree);

    expect(apiMock).toHaveBeenCalledTimes(1);
    expect(apiMock).toHaveBeenCalledWith({ currentPassword: VALID_CURRENT, newPassword: VALID_NEW });
    // Server has not answered yet: no success.
    expect(alertMock).not.toHaveBeenCalled();

    await act(async () => resolve());
    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(alertMock.mock.calls[0]?.[0]).toBe(en['profile.password.changedTitle']);
  });

  it('signs out after the server accepted the change (every session is revoked)', async () => {
    apiMock.mockResolvedValue(undefined);
    const onSignOut = vi.fn();
    const tree = await mount(allowAll, { onSignOut });
    await openChangePassword(tree);
    fill(tree, VALID_CURRENT, VALID_NEW, VALID_NEW);
    await pressUpdate(tree);
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it('shows an error and no success when the API rejects (wrong current password)', async () => {
    apiMock.mockRejectedValue(
      new ApiError({ type: 'about:blank', title: 'Unauthorized', status: 401, code: 'UNAUTHENTICATED' } as never),
    );
    const onSignOut = vi.fn();
    const tree = await mount(allowAll, { onSignOut });
    await openChangePassword(tree);
    fill(tree, 'wrong-Password-1', VALID_NEW, VALID_NEW);
    await pressUpdate(tree);
    // The rejection reaches the screen through the mutation's async callbacks; wait for it rather than one tick.
    await vi.waitFor(async () => {
      await act(async () => { await Promise.resolve(); });
      expect(JSON.stringify(tree.toJSON())).toContain(en['profile.password.error.currentIncorrect']);
    });

    expect(apiMock).toHaveBeenCalledTimes(1);
    expect(alertMock).not.toHaveBeenCalled();
    expect(onSignOut).not.toHaveBeenCalled();
    expect(JSON.stringify(tree.toJSON())).toContain(en['profile.password.error.currentIncorrect']);
  });

  it('does not call the API when local validation fails', async () => {
    const tree = await mount(allowAll);
    await openChangePassword(tree);
    fill(tree, VALID_CURRENT, VALID_NEW, 'something-else-entirely');
    await pressUpdate(tree);
    expect(apiMock).not.toHaveBeenCalled();
    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(alertMock.mock.calls[0]?.[0]).toBe(en['profile.password.invalidTitle']);
  });
});

describe('TohfaAdminSettingsScreen source guard', () => {
  it('has no fake password success and no hard-coded alert titles', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../screens/settings/TohfaAdminSettingsScreen.tsx'),
      'utf8',
    );
    expect(src).not.toMatch(/Alert\.alert\(\s*['"`]Success/);
    expect(src).not.toContain('Validation Error');
    expect(src).not.toContain('Password Mismatch');
    // No Alert.alert whose first argument is a string literal (titles come from t()).
    expect(src).not.toMatch(/Alert\.alert\(\s*['"`]/);
    // The submit path goes through the real change-password hook.
    expect(src).toContain('useChangePassword');
  });

  it('no role strings in screen file', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../screens/settings/TohfaAdminSettingsScreen.tsx'),
      'utf8',
    );
    expect(src).not.toMatch(/role\s*===\s*['"`]/);
    expect(src).not.toMatch(/SUPER_ADMIN|TOHFA_ADMIN|FARMER_ADMIN|MAIN_WH_ADMIN|SUB_WH_ADMIN/);
  });

  it('no hardcoded hex colors', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../screens/settings/TohfaAdminSettingsScreen.tsx'),
      'utf8',
    );
    expect(src).not.toMatch(/#[0-9A-Fa-f]{6}\b/);
  });

  it('no fixture or mock data', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../screens/settings/TohfaAdminSettingsScreen.tsx'),
      'utf8',
    );
    expect(src).not.toMatch(/fixture|FIXTURE|MOCK_|defaultNotif/i);
  });

  it('uses @tohfa/mobile-ui SafeAreaView and ScreenStatusBar', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../screens/settings/TohfaAdminSettingsScreen.tsx'),
      'utf8',
    );
    expect(src).toContain("from '@tohfa/mobile-ui'");
    expect(src).toContain('ScreenStatusBar');
    expect(src).toContain('SafeAreaView');
  });

  it('file is under 800 lines', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '../screens/settings/TohfaAdminSettingsScreen.tsx'),
      'utf8',
    );
    expect(src.split('\n').length).toBeLessThanOrEqual(800);
  });
});
