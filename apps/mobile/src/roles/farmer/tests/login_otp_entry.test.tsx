/**
 * OTP login entry on the farmer Login screen.
 *
 * The original S-42 Login screen (2dd99bf2, apps/farmer-mobile) had a
 * "Password | OTP Sign-In" switch: in OTP mode the farmer typed a mobile
 * number, tapped "Get OTP Code", and was taken to the OTP screen with a LOGIN
 * challenge. The redesign in 8e0d4feb dropped the switch and the handler, so
 * the only way to the OTP screen from Login was the BR-39 social NOT_LINKED
 * path, even though `POST /auth/otp/send` (purpose LOGIN), `verifyOtp`, the
 * OTP screen and the i18n keys (`tabOtp`, `tabPassword`, `requestOtp`) all
 * stayed. These tests pin the restored entry point.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Image: 'Image',
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));

vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Path: 'Path' }));

vi.mock('@tohfa/mobile-ui', () => ({
  Button: 'Button',
  ErrorState: 'ErrorState',
  Icon: 'Icon',
}));

vi.mock('../assets/icons/AssetIcons', () => ({
  BackButtonIcon: 'BackButtonIcon',
  CallIcon: 'CallIcon',
  LockIcon: 'LockIcon',
}));
vi.mock('../assets/icons/googleee.png', () => ({ default: 1 }));
vi.mock('../assets/icons/facebook.png', () => ({ default: 2 }));
vi.mock('../assets/tohfa-logo.png', () => ({ default: 3 }));

vi.mock('../native/socialSignIn', () => ({
  signInWithGoogle: vi.fn(),
  signInWithFacebook: vi.fn(),
  SocialSignInCancelledError: class extends Error {},
}));

const authApi = vi.hoisted(() => ({
  requestOtp: vi.fn(),
  loginWithPassword: vi.fn(),
}));
vi.mock('../api/auth', () => ({
  loginWithPassword: authApi.loginWithPassword,
  loginWithOAuth: vi.fn(),
  isOAuthNotLinked: () => false,
  requestOtp: authApi.requestOtp,
  resolveRouteAfterLogin: vi.fn(),
  fetchMe: vi.fn(),
  isRoleSelectionRequired: () => false,
}));

import { LoginScreen } from '../screens/auth/LoginScreen';
import { t } from '../../../i18n/farmer';

function textOf(node: ReactTestInstance | string): string {
  if (typeof node === 'string') return node;
  return node.children.map(textOf).join('');
}

async function mount(onNavigate = vi.fn()): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<LoginScreen onNavigate={onNavigate} />);
  });
  return tree;
}

function otpTab(tree: renderer.ReactTestRenderer): ReactTestInstance {
  const label = t('farmer.auth.login.tabOtp');
  const matches = tree.root.findAll(
    (n) => (n.type as unknown) === 'TouchableOpacity' && textOf(n) === label,
  );
  expect(matches, 'an "OTP Sign-In" option on the Login screen').toHaveLength(1);
  return matches[0]!;
}

function buttonTitled(tree: renderer.ReactTestRenderer, title: string): ReactTestInstance[] {
  return tree.root.findAll((n) => (n.type as unknown) === 'Button' && n.props.title === title);
}

async function typeMobile(tree: renderer.ReactTestRenderer, value: string): Promise<void> {
  const input = tree.root.find(
    (n) =>
      (n.type as unknown) === 'TextInput' &&
      n.props.accessibilityLabel === t('farmer.auth.login.mobile'),
  );
  await act(async () => input.props.onChangeText(value));
}

afterEach(() => {
  authApi.requestOtp.mockReset();
  authApi.loginWithPassword.mockReset();
});

describe('LoginScreen: OTP login entry', () => {
  it('OTP login: offers an OTP Sign-In option alongside password sign-in', async () => {
    const tree = await mount();
    otpTab(tree);
    expect(buttonTitled(tree, t('farmer.auth.login.submit'))).toHaveLength(1);
  });

  it('OTP login: OTP mode shows "Get OTP Code" and no password field', async () => {
    const tree = await mount();
    await act(async () => otpTab(tree).props.onPress());

    expect(buttonTitled(tree, t('farmer.auth.login.requestOtp'))).toHaveLength(1);
    expect(buttonTitled(tree, t('farmer.auth.login.submit'))).toHaveLength(0);
    const passwordInputs = tree.root.findAll(
      (n) =>
        (n.type as unknown) === 'TextInput' &&
        n.props.accessibilityLabel === t('farmer.auth.login.password'),
    );
    expect(passwordInputs).toHaveLength(0);
  });

  it('OTP login: requests a LOGIN OTP for the typed mobile and opens the OTP screen with the challenge', async () => {
    authApi.requestOtp.mockResolvedValue({
      challengeId: 'c-123',
      expiresAt: '2026-11-10T10:05:00Z',
      resendAvailableAt: '2026-11-10T10:01:00Z',
      attemptsRemaining: 3,
      _mockCode: '482915',
    });
    const onNavigate = vi.fn();
    const tree = await mount(onNavigate);
    await act(async () => otpTab(tree).props.onPress());
    await typeMobile(tree, '98765 43210');

    const [send] = buttonTitled(tree, t('farmer.auth.login.requestOtp'));
    await act(async () => send!.props.onPress());

    expect(authApi.requestOtp).toHaveBeenCalledTimes(1);
    expect(authApi.requestOtp).toHaveBeenCalledWith({ mobile: '+919876543210', purpose: 'LOGIN' });
    expect(authApi.loginWithPassword).not.toHaveBeenCalled();
    expect(onNavigate).toHaveBeenCalledWith('Otp', {
      mobile: '+919876543210',
      challengeId: 'c-123',
      resendAvailableAt: '2026-11-10T10:01:00Z',
      attemptsRemaining: 3,
      mockCode: '482915',
      purpose: 'LOGIN',
    });
  });

  it('OTP login: a number shorter than 10 digits sends no OTP and shows a translated error', async () => {
    const onNavigate = vi.fn();
    const tree = await mount(onNavigate);
    await act(async () => otpTab(tree).props.onPress());
    await typeMobile(tree, '98765');

    const [send] = buttonTitled(tree, t('farmer.auth.login.requestOtp'));
    await act(async () => send!.props.onPress());

    expect(authApi.requestOtp).not.toHaveBeenCalled();
    expect(onNavigate).not.toHaveBeenCalled();
    const errors = tree.root.findAll((n) => (n.type as unknown) === 'ErrorState');
    expect(errors).toHaveLength(1);
    expect(errors[0]!.props.message).toBe(t('farmer.auth.login.mobileInvalid'));
  });

  it('OTP login: a failed OTP send stays on Login and shows the error', async () => {
    authApi.requestOtp.mockRejectedValue(new Error('network down'));
    const onNavigate = vi.fn();
    const tree = await mount(onNavigate);
    await act(async () => otpTab(tree).props.onPress());
    await typeMobile(tree, '9876543210');

    const [send] = buttonTitled(tree, t('farmer.auth.login.requestOtp'));
    await act(async () => send!.props.onPress());

    expect(onNavigate).not.toHaveBeenCalled();
    expect(tree.root.findAll((n) => (n.type as unknown) === 'ErrorState')).toHaveLength(1);
  });
});
