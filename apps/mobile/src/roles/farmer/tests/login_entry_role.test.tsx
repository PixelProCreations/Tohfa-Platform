/**
 * BR-135: one account may hold FARMER and CUSTOMER (e.g. a customer whose
 * farmer application was approved). The farmer/staff Login and its OTP screen
 * are the FARMER entry: they must open the farmer side of such an account, and
 * refuse (with a translated message, signing the new session out) an account
 * that holds no farmer/staff role, never silently opening the customer side.
 *
 * Before this change the password and social paths completed a role selection
 * with whichever role the server listed first (`getUserRoles` has no ORDER BY),
 * and the OTP path routed on `/auth/me` roles, where a CUSTOMER listed first
 * made the account look "customer only" and opened the customer home.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';
import type * as AuthModule from '../api/auth';
import type * as OtpModule from '../../../shell/otp';

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
vi.mock('@tohfa/mobile-ui', () => ({ Button: 'Button', FormAlert: 'FormAlert', Icon: 'Icon', SafeAreaView: 'SafeAreaView' }));
vi.mock('../assets/icons/AssetIcons', () => ({
  BackButtonIcon: 'BackButtonIcon',
  CallIcon: 'CallIcon',
  LockIcon: 'LockIcon',
}));
vi.mock('../assets/icons/googleee.png', () => ({ default: 1 }));
vi.mock('../assets/icons/facebook.png', () => ({ default: 2 }));
vi.mock('../assets/tohfa-logo.png', () => ({ default: 3 }));

const social = vi.hoisted(() => ({ signInWithGoogle: vi.fn(), signInWithFacebook: vi.fn() }));
vi.mock('../native/socialSignIn', () => ({
  signInWithGoogle: social.signInWithGoogle,
  signInWithFacebook: social.signInWithFacebook,
  SocialSignInCancelledError: class extends Error {},
}));

vi.mock('../../../shell/otp', async (importOriginal) => ({
  ...(await importOriginal<typeof OtpModule>()),
  useOtpSmsAutofill: () => undefined,
}));

// The real routing (resolveRouteAfterLogin / resolveRouteAfterAuth) runs; only
// the network calls are stubbed.
const authApi = vi.hoisted(() => ({
  loginWithPassword: vi.fn(),
  loginWithOAuth: vi.fn(),
  verifyOtp: vi.fn(),
  fetchMe: vi.fn(),
  logout: vi.fn(),
  requestOtp: vi.fn(),
}));
vi.mock('../api/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof AuthModule>()),
  ...authApi,
}));

import { LoginScreen } from '../screens/auth/LoginScreen';
import { OtpScreen } from '../screens/auth/OtpScreen';
import { t } from '../../../i18n/farmer';
import { __resetEntryRoleForTests, forgetEntryRole, readEntryRole } from '../../../shell/auth/entryRole';

const FARMER = { code: 'FARMER' };
const CUSTOMER = { code: 'CUSTOMER' };

function tokens(roles: { code: string }[]) {
  return {
    accessToken: 'acc',
    refreshToken: 'ref',
    requiresRoleSelection: false,
    user: { id: 'u1', userType: 'CUSTOMER', roles },
  };
}
const selection = (availableRoles: { code: string }[]) => ({ requiresRoleSelection: true, availableRoles });
const me = (roles: { code: string }[], hasPassword = true) => ({
  id: 'u1',
  userType: 'CUSTOMER',
  status: 'ACTIVE',
  hasPassword,
  roles,
});

function textOf(node: ReactTestInstance | string): string {
  if (typeof node === 'string') return node;
  return node.children.map(textOf).join('');
}

function banner(tree: renderer.ReactTestRenderer): ReactTestInstance | undefined {
  return tree.root.findAll((n) => (n.type as unknown) === 'FormAlert').find((n) => n.props.variant === 'banner');
}

async function mountLogin(onNavigate = vi.fn()) {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<LoginScreen onNavigate={onNavigate} />);
  });
  return tree;
}

async function passwordLogin(tree: renderer.ReactTestRenderer) {
  const input = (label: string) =>
    tree.root.find((n) => (n.type as unknown) === 'TextInput' && n.props.accessibilityLabel === label);
  await act(async () => input(t('farmer.auth.login.mobile')).props.onChangeText('6382328740'));
  await act(async () => input(t('farmer.auth.login.password')).props.onChangeText('Password-135'));
  const submit = tree.root.find(
    (n) => (n.type as unknown) === 'Button' && n.props.title === t('farmer.auth.login.submit'),
  );
  await act(async () => submit.props.onPress());
}

async function googleLogin(tree: renderer.ReactTestRenderer) {
  const google = tree.root.findAll(
    (n) => (n.type as unknown) === 'TouchableOpacity' && n.props.accessibilityLabel === t('farmer.auth.login.continueWithGoogle'),
  );
  expect(google).toHaveLength(1);
  await act(async () => google[0]!.props.onPress());
}

async function otpVerify(onNavigate = vi.fn()) {
  (globalThis as { __DEV__?: boolean }).__DEV__ = true;
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <OtpScreen mobile="+916382328740" challengeId="c1" mockCode="123456" onNavigate={onNavigate} />,
    );
  });
  const verify = tree.root.findAll(
    (n) => (n.type as unknown) === 'TouchableOpacity' && n.props.disabled === false && textOf(n) === 'Verify',
  );
  expect(verify).toHaveLength(1);
  await act(async () => verify[0]!.props.onPress());
  return tree;
}

beforeEach(async () => {
  __resetEntryRoleForTests();
  await forgetEntryRole();
  authApi.logout.mockResolvedValue(undefined);
});

afterEach(() => {
  for (const fn of Object.values(authApi)) fn.mockReset();
  for (const fn of Object.values(social)) fn.mockReset();
});

describe('BR-135: farmer Login honours the farmer entry', () => {
  it('BR-135: a FARMER + CUSTOMER account completes a password login as FARMER even when CUSTOMER is listed first', async () => {
    authApi.loginWithPassword
      .mockResolvedValueOnce(selection([CUSTOMER, FARMER]))
      .mockResolvedValueOnce(tokens([FARMER]));
    authApi.fetchMe.mockResolvedValue(me([CUSTOMER, FARMER]));
    const onNavigate = vi.fn();
    const tree = await mountLogin(onNavigate);

    await passwordLogin(tree);

    expect(authApi.loginWithPassword).toHaveBeenCalledTimes(2);
    expect(authApi.loginWithPassword.mock.calls[1]![0]).toMatchObject({ roleCode: 'FARMER' });
    expect(onNavigate).toHaveBeenCalledWith('MainTabs', undefined);
    expect(await readEntryRole()).toBe('FARMER');
  });

  it('BR-135: a customer-only account on the farmer Login is refused with a translated message and signed out', async () => {
    authApi.loginWithPassword.mockResolvedValueOnce(tokens([CUSTOMER]));
    authApi.fetchMe.mockResolvedValue(me([CUSTOMER]));
    const onNavigate = vi.fn();
    const tree = await mountLogin(onNavigate);

    await passwordLogin(tree);

    expect(onNavigate).not.toHaveBeenCalled();
    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(banner(tree)?.props.message).toBe(t('farmer.auth.login.notFarmerAccount'));
    expect(await readEntryRole()).toBeNull();
  });

  it('BR-135: a FARMER + CUSTOMER account completes a Google login as FARMER even when CUSTOMER is listed first', async () => {
    social.signInWithGoogle.mockResolvedValue('id-token');
    authApi.loginWithOAuth
      .mockResolvedValueOnce(selection([CUSTOMER, FARMER]))
      .mockResolvedValueOnce(tokens([FARMER]));
    authApi.fetchMe.mockResolvedValue(me([CUSTOMER, FARMER]));
    const onNavigate = vi.fn();
    const tree = await mountLogin(onNavigate);

    await googleLogin(tree);

    expect(authApi.loginWithOAuth).toHaveBeenCalledTimes(2);
    expect(authApi.loginWithOAuth.mock.calls[1]![2]).toMatchObject({ roleCode: 'FARMER' });
    expect(onNavigate).toHaveBeenCalledWith('MainTabs', undefined);
  });

  it('BR-135: a customer-only account signing in with Google on the farmer Login is refused and signed out', async () => {
    social.signInWithGoogle.mockResolvedValue('id-token');
    authApi.loginWithOAuth.mockResolvedValueOnce(tokens([CUSTOMER]));
    const onNavigate = vi.fn();
    const tree = await mountLogin(onNavigate);

    await googleLogin(tree);

    expect(onNavigate).not.toHaveBeenCalled();
    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(banner(tree)?.props.message).toBe(t('farmer.auth.login.notFarmerAccount'));
  });
});

describe('BR-135: farmer OTP sign-in honours the farmer entry', () => {
  it('BR-135: a FARMER + CUSTOMER account with CUSTOMER listed first opens the farmer side, not the customer home', async () => {
    authApi.verifyOtp.mockResolvedValue(tokens([CUSTOMER, FARMER]));
    authApi.fetchMe.mockResolvedValue(me([CUSTOMER, FARMER]));
    const onNavigate = vi.fn();

    await otpVerify(onNavigate);

    expect(onNavigate).toHaveBeenCalledWith('MainTabs', undefined);
    expect(await readEntryRole()).toBe('FARMER');
  });

  it('BR-135/BR-142: the same account with no password yet goes to Create Password (the farmer gate), not the customer home', async () => {
    authApi.verifyOtp.mockResolvedValue(tokens([CUSTOMER, FARMER]));
    authApi.fetchMe.mockResolvedValue(me([CUSTOMER, FARMER], false));
    const onNavigate = vi.fn();

    await otpVerify(onNavigate);

    expect(onNavigate).toHaveBeenCalledWith('CreatePassword', undefined);
  });

  it('BR-135: a customer-only account on the farmer OTP sign-in is refused with a translated message and signed out', async () => {
    authApi.verifyOtp.mockResolvedValue(tokens([CUSTOMER]));
    authApi.fetchMe.mockResolvedValue(me([CUSTOMER]));
    const onNavigate = vi.fn();

    const tree = await otpVerify(onNavigate);

    expect(onNavigate).not.toHaveBeenCalled();
    expect(authApi.logout).toHaveBeenCalledTimes(1);
    expect(textOf(tree.root)).toContain(t('farmer.auth.login.notFarmerAccount'));
  });
});
