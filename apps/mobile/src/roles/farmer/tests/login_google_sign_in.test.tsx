/**
 * BR-39: what the farmer Login screen shows when "Continue with Google" fails.
 *
 * The bug this pins: a native Google failure (e.g. Android DEVELOPER_ERROR)
 * reached the banner as an unclassified error and rendered the generic
 * "Something went wrong" with a Retry that could never succeed.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Image: 'Image',
  Platform: { OS: 'android', select: (obj: Record<string, unknown>) => obj['android'] ?? obj['default'] },
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Path: 'Path' }));
vi.mock('@tohfa/mobile-ui', () => ({ Button: 'Button', FormAlert: 'FormAlert', Icon: 'Icon' }));
vi.mock('../assets/icons/AssetIcons', () => ({
  BackButtonIcon: 'BackButtonIcon',
  CallIcon: 'CallIcon',
  LockIcon: 'LockIcon',
}));
vi.mock('../assets/icons/googleee.png', () => ({ default: 1 }));
vi.mock('../assets/icons/facebook.png', () => ({ default: 2 }));
vi.mock('../assets/tohfa-logo.png', () => ({ default: 3 }));

const social = vi.hoisted(() => ({ signInWithGoogle: vi.fn(), signInWithFacebook: vi.fn() }));
vi.mock('../native/socialSignIn', async () => {
  const errors = await import('../../../shell/auth/socialSignInErrors');
  return {
    signInWithGoogle: social.signInWithGoogle,
    signInWithFacebook: social.signInWithFacebook,
    SocialSignInCancelledError: errors.SocialSignInCancelledError,
  };
});

const authApi = vi.hoisted(() => ({
  requestOtp: vi.fn(),
  loginWithOAuth: vi.fn(),
}));
vi.mock('../api/auth', () => ({
  loginWithPassword: vi.fn(),
  loginWithOAuth: authApi.loginWithOAuth,
  isOAuthNotLinked: (r: { status?: string }) => r?.status === 'NOT_LINKED',
  requestOtp: authApi.requestOtp,
  resolveRouteAfterLogin: vi.fn(),
  fetchMe: vi.fn(),
  isRoleSelectionRequired: () => false,
}));

import { LoginScreen } from '../screens/auth/LoginScreen';
import { t } from '../../../i18n/farmer';
import { SocialSignInCancelledError, SocialSignInError } from '../../../shell/auth/socialSignInErrors';

function alerts(tree: renderer.ReactTestRenderer): ReactTestInstance[] {
  return tree.root.findAll((n) => (n.type as unknown) === 'FormAlert');
}
function banner(tree: renderer.ReactTestRenderer): ReactTestInstance | undefined {
  return alerts(tree).find((n) => n.props.variant === 'banner');
}
async function mount(onNavigate = vi.fn()): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<LoginScreen onNavigate={onNavigate} />);
  });
  return tree;
}
async function pressGoogle(tree: renderer.ReactTestRenderer): Promise<void> {
  const btn = tree.root.find(
    (n) =>
      (n.type as unknown) === 'TouchableOpacity' &&
      n.props.accessibilityLabel === t('farmer.auth.login.continueWithGoogle'),
  );
  await act(async () => btn.props.onPress());
}

afterEach(() => {
  social.signInWithGoogle.mockReset();
  authApi.loginWithOAuth.mockReset();
  authApi.requestOtp.mockReset();
});

describe('BR-39: LoginScreen Google sign-in failures', () => {
  it('BR-39: DEVELOPER_ERROR shows the specific "Google sign-in unavailable" banner, not the generic one, and no Retry', async () => {
    social.signInWithGoogle.mockRejectedValueOnce(
      new SocialSignInError('GOOGLE', 'DEVELOPER_ERROR', '10', new Error('DEVELOPER_ERROR')),
    );
    const tree = await mount();
    await pressGoogle(tree);

    const b = banner(tree)!;
    expect(b).toBeDefined();
    expect(b.props.title).toBe(t('farmer.auth.login.errorSignInTitle'));
    expect(b.props.message).toBe(t('error.SOCIAL_SIGN_IN_UNAVAILABLE'));
    expect(b.props.message).not.toBe(t('error.generic'));
    expect(b.props.onRetry).toBeUndefined();
    expect(authApi.loginWithOAuth).not.toHaveBeenCalled();
  });

  it('BR-39: Play services unavailable shows its own message', async () => {
    social.signInWithGoogle.mockRejectedValueOnce(
      new SocialSignInError('GOOGLE', 'PLAY_SERVICES_UNAVAILABLE', 'PLAY_SERVICES_NOT_AVAILABLE', null),
    );
    const tree = await mount();
    await pressGoogle(tree);
    expect(banner(tree)!.props.message).toBe(t('error.SOCIAL_SIGN_IN_PLAY_SERVICES'));
  });

  it('BR-39: a Google network failure is the offline banner with Retry', async () => {
    social.signInWithGoogle.mockRejectedValueOnce(new SocialSignInError('GOOGLE', 'NETWORK', '7', null));
    const tree = await mount();
    await pressGoogle(tree);
    const b = banner(tree)!;
    expect(b.props.message).toBe(t('error.NETWORK_OFFLINE'));
    expect(typeof b.props.onRetry).toBe('function');
  });

  it('BR-39: closing the Google sheet shows nothing', async () => {
    social.signInWithGoogle.mockRejectedValueOnce(new SocialSignInCancelledError('GOOGLE'));
    const tree = await mount();
    await pressGoogle(tree);
    expect(alerts(tree)).toHaveLength(0);
  });

  it('BR-39: NOT_LINKED with no mobile shows a neutral info message (not an error) and sends no OTP', async () => {
    social.signInWithGoogle.mockResolvedValueOnce('id-token');
    authApi.loginWithOAuth.mockResolvedValueOnce({ status: 'NOT_LINKED', linkToken: 'lt', profile: {} });
    const onNavigate = vi.fn();
    const tree = await mount(onNavigate);
    await pressGoogle(tree);

    expect(authApi.requestOtp).not.toHaveBeenCalled();
    expect(onNavigate).not.toHaveBeenCalled();
    expect(banner(tree)).toBeUndefined();
    // No red validation alert at all: the guidance is an info line.
    expect(alerts(tree)).toHaveLength(0);
    const info = tree.root.findByProps({ testID: 'login-social-link-info' });
    expect(info.props.children).toBe(t('farmer.auth.login.socialLinkMobilePrompt'));
  });

  it('BR-39: after the prompt, entering a mobile and tapping Google again requests the OTP with the link token', async () => {
    social.signInWithGoogle.mockResolvedValue('id-token');
    authApi.loginWithOAuth
      .mockResolvedValueOnce({ status: 'NOT_LINKED', linkToken: 'lt1', profile: {} })
      .mockResolvedValueOnce({ status: 'NOT_LINKED', linkToken: 'lt2', profile: {} });
    authApi.requestOtp.mockResolvedValueOnce({ challengeId: 'c1', resendAvailableAt: 'x', attemptsRemaining: 3 });
    const onNavigate = vi.fn();
    const tree = await mount(onNavigate);
    await pressGoogle(tree);
    expect(onNavigate).not.toHaveBeenCalled();

    const input = tree.root.find(
      (n) => (n.type as unknown) === 'TextInput' && n.props.accessibilityLabel === t('farmer.auth.login.mobile'),
    );
    await act(async () => input.props.onChangeText('9876543210'));
    await pressGoogle(tree);

    expect(authApi.requestOtp).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledWith(
      'Otp',
      expect.objectContaining({ purpose: 'LOGIN', linkToken: 'lt2' }),
    );
  });
});
