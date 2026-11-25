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
  FormAlert: 'FormAlert',
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
import { ApiError, NetworkError } from '../../../shell/api/client';
import type { Problem } from '@tohfa/shared-types';

function apiError(code: string, status: number, retryAfterSeconds: number | null = null): ApiError {
  return new ApiError(
    { type: 'about:blank', title: code, status, code: code as Problem['code'] },
    { retryAfterSeconds },
  );
}

function alerts(tree: renderer.ReactTestRenderer): ReactTestInstance[] {
  return tree.root.findAll((n) => (n.type as unknown) === 'FormAlert');
}

function banner(tree: renderer.ReactTestRenderer): ReactTestInstance | undefined {
  return alerts(tree).find((n) => n.props.variant === 'banner');
}

function mobileInput(tree: renderer.ReactTestRenderer): ReactTestInstance {
  return tree.root.find(
    (n) =>
      (n.type as unknown) === 'TextInput' &&
      n.props.accessibilityLabel === t('farmer.auth.login.mobile'),
  );
}

/** The bordered row that wraps the +91 prefix and the mobile TextInput. */
function mobileRow(tree: renderer.ReactTestRenderer): ReactTestInstance {
  return mobileInput(tree).parent!;
}

function flatStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flatStyle));
  return (style as Record<string, unknown> | null | undefined) ?? {};
}

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
  await act(async () => mobileInput(tree).props.onChangeText(value));
}

async function pressSend(tree: renderer.ReactTestRenderer): Promise<void> {
  const [send] = buttonTitled(tree, t('farmer.auth.login.requestOtp'));
  await act(async () => send!.props.onPress());
}

async function openOtpWith(tree: renderer.ReactTestRenderer, mobile: string): Promise<void> {
  await act(async () => otpTab(tree).props.onPress());
  await typeMobile(tree, mobile);
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
    await openOtpWith(tree, '98765');
    await pressSend(tree);

    expect(authApi.requestOtp).not.toHaveBeenCalled();
    expect(onNavigate).not.toHaveBeenCalled();
    const errors = alerts(tree);
    expect(errors).toHaveLength(1);
    expect(errors[0]!.props.message).toBe(t('farmer.auth.login.mobileInvalid'));
  });

  it('OTP login: a failed OTP send stays on Login and shows the error', async () => {
    authApi.requestOtp.mockRejectedValue(new Error('network down'));
    const onNavigate = vi.fn();
    const tree = await mount(onNavigate);
    await openOtpWith(tree, '9876543210');
    await pressSend(tree);

    expect(onNavigate).not.toHaveBeenCalled();
    expect(banner(tree)).toBeDefined();
  });
});

describe('LoginScreen: how errors are displayed', () => {
  it('a 9-digit number shows an inline field error directly below the mobile field, not a banner', async () => {
    const tree = await mount();
    await openOtpWith(tree, '98765 4321');
    await pressSend(tree);

    const [inline] = alerts(tree);
    expect(inline, 'an inline field error').toBeDefined();
    expect(inline!.props.variant ?? 'inline').toBe('inline');
    expect(inline!.props.message).toBe(t('farmer.auth.login.mobileInvalid'));
    expect(banner(tree)).toBeUndefined();

    // Same field group as the input row, and rendered after it (i.e. below).
    const group = mobileRow(tree).parent!;
    expect(inline!.parent).toBe(group);
    const order = group.children.filter((c): c is ReactTestInstance => typeof c !== 'string');
    expect(order.indexOf(inline!)).toBeGreaterThan(order.indexOf(mobileRow(tree)));
  });

  it('validation errors offer no Retry', async () => {
    const tree = await mount();
    await openOtpWith(tree, '98765');
    await pressSend(tree);

    const [inline] = alerts(tree);
    expect(inline!.props.onRetry).toBeUndefined();
    expect(tree.root.findAll((n) => (n.type as unknown) === 'Button' && n.props.title === t('farmer.common.retry'))).toHaveLength(0);
  });

  it('the invalid field gets the danger-token border, and both clear as soon as the number is edited', async () => {
    const tree = await mount();
    await openOtpWith(tree, '98765');
    const borderBefore = flatStyle(mobileRow(tree).props.style).borderColor;
    await pressSend(tree);

    expect(flatStyle(mobileRow(tree).props.style).borderColor).not.toBe(borderBefore);
    expect(alerts(tree)).toHaveLength(1);

    await typeMobile(tree, '987654');
    expect(alerts(tree)).toHaveLength(0);
    expect(flatStyle(mobileRow(tree).props.style).borderColor).toBe(borderBefore);
  });

  it('a retryable server error (OTP_SMS_DELIVERY_FAILED) shows a banner with Retry that re-sends', async () => {
    authApi.requestOtp.mockRejectedValueOnce(apiError('OTP_SMS_DELIVERY_FAILED', 502));
    const tree = await mount();
    await openOtpWith(tree, '9876543210');
    await pressSend(tree);

    const b = banner(tree)!;
    expect(b.props.title).toBe(t('farmer.auth.login.errorOtpSendTitle'));
    expect(b.props.message).toBe(t('error.OTP_SMS_DELIVERY_FAILED'));
    expect(b.props.tone).toBe('danger');
    expect(typeof b.props.onRetry).toBe('function');
    expect(b.props.retryLabel).toBe(t('farmer.common.retry'));
    // The mobile field itself is fine: no inline error.
    expect(alerts(tree).filter((n) => n.props.variant !== 'banner')).toHaveLength(0);

    authApi.requestOtp.mockResolvedValueOnce({
      challengeId: 'c-1',
      resendAvailableAt: '2026-11-10T10:01:00Z',
      attemptsRemaining: 3,
    });
    await act(async () => b.props.onRetry());
    expect(authApi.requestOtp).toHaveBeenCalledTimes(2);
  });

  it('offline shows a retryable banner with the offline icon', async () => {
    authApi.requestOtp.mockRejectedValueOnce(new NetworkError(new Error('down'), 'offline'));
    const tree = await mount();
    await openOtpWith(tree, '9876543210');
    await pressSend(tree);

    const b = banner(tree)!;
    expect(b.props.message).toBe(t('error.NETWORK_OFFLINE'));
    expect(b.props.icon).toBe('wifi_off');
    expect(typeof b.props.onRetry).toBe('function');
  });

  it('a rate-limited send is a warning banner with no Retry (waiting is the fix)', async () => {
    authApi.requestOtp.mockRejectedValueOnce(apiError('RATE_LIMITED', 429, 30));
    const tree = await mount();
    await openOtpWith(tree, '9876543210');
    await pressSend(tree);

    const b = banner(tree)!;
    expect(b.props.tone).toBe('warning');
    expect(b.props.message).toBe(t('error.RATE_LIMITED.seconds', { seconds: 30 }));
    expect(b.props.onRetry).toBeUndefined();
  });

  it('wrong password is a sign-in banner with no Retry', async () => {
    authApi.loginWithPassword.mockRejectedValueOnce(apiError('UNAUTHENTICATED', 401));
    const tree = await mount();
    await typeMobile(tree, '9876543210');
    const password = tree.root.find(
      (n) => (n.type as unknown) === 'TextInput' && n.props.accessibilityLabel === t('farmer.auth.login.password'),
    );
    await act(async () => password.props.onChangeText('secret-pass'));
    const [submit] = buttonTitled(tree, t('farmer.auth.login.submit'));
    await act(async () => submit!.props.onPress());

    const b = banner(tree)!;
    expect(b.props.message).toBe(t('farmer.auth.login.invalidCredentials'));
    expect(b.props.onRetry).toBeUndefined();
  });

  it('the banner is dismissible', async () => {
    authApi.requestOtp.mockRejectedValueOnce(apiError('OTP_SMS_DELIVERY_FAILED', 502));
    const tree = await mount();
    await openOtpWith(tree, '9876543210');
    await pressSend(tree);

    const b = banner(tree)!;
    expect(b.props.dismissLabel).toBe(t('farmer.common.close'));
    await act(async () => b.props.onDismiss());
    expect(banner(tree)).toBeUndefined();
  });
});
