/**
 * BR-142 (docs/rules.md): a first sign-in by OTP leads to creating a password;
 * afterwards password and OTP both sign in.
 *
 * Screen-level halves of the rule:
 *  - BR-142f Create Password: sends the password once, then routes onward
 *    through `/auth/me` + `resolveRouteAfterAuth`; mismatched entries send
 *    nothing; there is no back control to skip it.
 *  - BR-142g OTP screen: a verify that returns no tokens (no account for this
 *    number) says so and never calls `/auth/me`.
 *  - BR-142h Login screen: UNAUTHENTICATED (wrong password, unknown number, or
 *    an account with no password yet: the server deliberately does not say
 *    which) points the user to OTP sign-in.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Image: 'Image',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
  Pressable: 'Pressable',
  SafeAreaView: 'SafeAreaView',
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
  SafeAreaView: 'SafeAreaView',
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
  setInitialPassword: vi.fn(),
  fetchMe: vi.fn(),
  resolveRouteAfterAuth: vi.fn(),
  verifyOtp: vi.fn(),
  requestOtp: vi.fn(),
  loginWithPassword: vi.fn(),
}));
vi.mock('../api/auth', () => ({
  setInitialPassword: authApi.setInitialPassword,
  fetchMe: authApi.fetchMe,
  resolveRouteAfterAuth: authApi.resolveRouteAfterAuth,
  resolveRouteAfterLogin: vi.fn(),
  verifyOtp: authApi.verifyOtp,
  isOtpVerifiedNoAccount: (r: { verified?: boolean; accessToken?: string }) =>
    r.verified === true && !r.accessToken,
  requestOtp: authApi.requestOtp,
  renderOtpState: () => ({ canResend: false, isLocked: false, secondsUntilResend: 30, attemptsRemaining: 3 }),
  loginWithPassword: authApi.loginWithPassword,
  loginWithOAuth: vi.fn(),
  isOAuthNotLinked: () => false,
  isRoleSelectionRequired: () => false,
}));

import { CreatePasswordScreen } from '../screens/auth/CreatePasswordScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { ApiError } from '../../../shell/api/client';
import { t } from '../../../i18n/farmer';

function textOf(node: ReactTestInstance | string): string {
  if (typeof node === 'string') return node;
  return node.children.map(textOf).join('');
}

function inputLabelled(tree: renderer.ReactTestRenderer, label: string): ReactTestInstance {
  return tree.root.find(
    (n) => (n.type as unknown) === 'TextInput' && n.props.accessibilityLabel === label,
  );
}

function touchableWithText(tree: renderer.ReactTestRenderer, text: string): ReactTestInstance {
  const matches = tree.root.findAll(
    (n) => (n.type as unknown) === 'TouchableOpacity' && textOf(n) === text,
  );
  expect(matches, `a button reading "${text}"`).toHaveLength(1);
  return matches[0]!;
}

function apiError(code: string, status: number): ApiError {
  return new ApiError({ type: 'about:blank', title: code, status, code } as never);
}

afterEach(() => {
  for (const fn of Object.values(authApi)) fn.mockReset();
  (globalThis as { __DEV__?: boolean }).__DEV__ = true;
});

describe('BR-142f: Create Password screen', () => {
  async function mount(onNavigate = vi.fn()): Promise<renderer.ReactTestRenderer> {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<CreatePasswordScreen onNavigate={onNavigate} />);
    });
    return tree;
  }

  async function fill(tree: renderer.ReactTestRenderer, password: string, confirm: string): Promise<void> {
    await act(async () => inputLabelled(tree, t('farmer.auth.reset.newPassword')).props.onChangeText(password));
    await act(async () => inputLabelled(tree, t('farmer.auth.reset.confirmPassword')).props.onChangeText(confirm));
  }

  async function submit(tree: renderer.ReactTestRenderer): Promise<void> {
    await act(async () => touchableWithText(tree, t('farmer.auth.createPassword.submit')).props.onPress());
  }

  it('BR-142f: renders translated copy and no back control, so it cannot be skipped', async () => {
    const tree = await mount();
    const all = textOf(tree.root);
    expect(all).toContain(t('farmer.auth.createPassword.title'));
    expect(all).toContain(t('farmer.auth.createPassword.subtitle'));
    expect(tree.root.findAll((n) => (n.type as unknown) === 'BackButtonIcon')).toHaveLength(0);
  });

  it('BR-142f: sends the password once, reloads /auth/me and continues to the role route', async () => {
    authApi.setInitialPassword.mockResolvedValue(undefined);
    const me = { id: 'u1', roles: [{ code: 'FARMER' }], hasPassword: true };
    authApi.fetchMe.mockResolvedValue(me);
    authApi.resolveRouteAfterAuth.mockReturnValue({ name: 'MainTabs' });
    const onNavigate = vi.fn();
    const tree = await mount(onNavigate);

    await fill(tree, 'FirstPassword142', 'FirstPassword142');
    await submit(tree);

    expect(authApi.setInitialPassword).toHaveBeenCalledTimes(1);
    expect(authApi.setInitialPassword).toHaveBeenCalledWith({ newPassword: 'FirstPassword142' });
    expect(authApi.fetchMe).toHaveBeenCalledTimes(1);
    expect(authApi.resolveRouteAfterAuth).toHaveBeenCalledWith(me);
    expect(onNavigate).toHaveBeenCalledWith('MainTabs', undefined);
  });

  it('BR-142f: mismatched entries send nothing and show a translated message', async () => {
    const onNavigate = vi.fn();
    const tree = await mount(onNavigate);

    await fill(tree, 'FirstPassword142', 'FirstPassword143');
    await submit(tree);

    expect(authApi.setInitialPassword).not.toHaveBeenCalled();
    expect(onNavigate).not.toHaveBeenCalled();
    const errors = tree.root.findAll((n) => (n.type as unknown) === 'ErrorState');
    expect(errors).toHaveLength(1);
    expect(errors[0]!.props.message).toBe(t('farmer.auth.password.mismatch'));
  });

  it('BR-142f: a password the server refuses (422) stays on the screen with the policy message', async () => {
    authApi.setInitialPassword.mockRejectedValue(apiError('VALIDATION_FAILED', 422));
    const onNavigate = vi.fn();
    const tree = await mount(onNavigate);

    await fill(tree, 'short', 'short');
    await submit(tree);

    expect(onNavigate).not.toHaveBeenCalled();
    const errors = tree.root.findAll((n) => (n.type as unknown) === 'ErrorState');
    expect(errors[0]!.props.message).toBe(t('farmer.auth.password.policy'));
  });

  it('BR-142f: PASSWORD_ALREADY_SET (set on another device meanwhile) continues to the role route', async () => {
    authApi.setInitialPassword.mockRejectedValue(apiError('PASSWORD_ALREADY_SET', 409));
    authApi.fetchMe.mockResolvedValue({ id: 'u1', roles: [{ code: 'CUSTOMER' }], hasPassword: true });
    authApi.resolveRouteAfterAuth.mockReturnValue({ name: 'CustomerMain' });
    const onNavigate = vi.fn();
    const tree = await mount(onNavigate);

    await fill(tree, 'FirstPassword142', 'FirstPassword142');
    await submit(tree);

    expect(onNavigate).toHaveBeenCalledWith('CustomerMain', undefined);
  });
});

describe('BR-142g: OTP verify for a number with no account', () => {
  it('BR-142g: shows the no-account message and never calls /auth/me', async () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    authApi.verifyOtp.mockResolvedValue({ verified: true, mobile: '+919876543210', purpose: 'LOGIN' });
    const onNavigate = vi.fn();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        <OtpScreen mobile="+919876543210" challengeId="c1" mockCode="123456" onNavigate={onNavigate} />,
      );
    });

    const verify = tree.root.findAll(
      (n) => (n.type as unknown) === 'TouchableOpacity' && n.props.disabled === false && textOf(n) === 'Verify',
    );
    expect(verify).toHaveLength(1);
    await act(async () => verify[0]!.props.onPress());

    expect(authApi.verifyOtp).toHaveBeenCalledTimes(1);
    expect(authApi.fetchMe).not.toHaveBeenCalled();
    expect(onNavigate).not.toHaveBeenCalled();
    expect(textOf(tree.root)).toContain(t('farmer.auth.otp.noAccount'));
  });
});

describe('BR-142h: password login refused', () => {
  it('BR-142h: UNAUTHENTICATED points to OTP sign-in without saying whether the account exists', async () => {
    authApi.loginWithPassword.mockRejectedValue(apiError('UNAUTHENTICATED', 401));
    const onNavigate = vi.fn();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<LoginScreen onNavigate={onNavigate} />);
    });

    await act(async () => inputLabelled(tree, t('farmer.auth.login.mobile')).props.onChangeText('9876543210'));
    await act(async () => inputLabelled(tree, t('farmer.auth.login.password')).props.onChangeText('whatever-1'));
    const submit = tree.root.find(
      (n) => (n.type as unknown) === 'Button' && n.props.title === t('farmer.auth.login.submit'),
    );
    await act(async () => submit.props.onPress());

    expect(onNavigate).not.toHaveBeenCalled();
    const errors = tree.root.findAll((n) => (n.type as unknown) === 'ErrorState');
    expect(errors).toHaveLength(1);
    expect(errors[0]!.props.message).toBe(t('farmer.auth.login.invalidCredentials'));
  });
});
