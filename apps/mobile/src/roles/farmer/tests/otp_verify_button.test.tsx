/**
 * Farmer/admin OTP screen: the Verify button's enabled look.
 *
 * Bug: with all six boxes filled (typed, or delivered by the SMS autofill
 * hook) the Verify button was tappable but still rendered in the washed-out
 * sage fill, so it read as disabled. These tests pin the four states:
 * incomplete (faded, disabled), complete (solid primary, enabled), verifying
 * (solid primary, busy spinner, not re-pressable) and locked (faded, disabled).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';
import type * as OtpModule from '../../../shell/otp';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Platform: { OS: 'android', select: (obj: Record<string, unknown>) => obj['android'] ?? obj['default'] },
  Pressable: 'Pressable',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));

vi.mock('../assets/icons/AssetIcons', () => ({
  BackButtonIcon: 'BackButtonIcon',
  LockIcon: 'LockIcon',
}));

const authApi = vi.hoisted(() => ({
  isLocked: false,
  requestOtp: vi.fn(),
  verifyOtp: vi.fn(),
  fetchMe: vi.fn(),
  resolveRouteAfterAuth: vi.fn(),
}));
vi.mock('../api/auth', () => ({
  verifyOtp: authApi.verifyOtp,
  requestOtp: authApi.requestOtp,
  fetchMe: authApi.fetchMe,
  resolveRouteAfterAuth: authApi.resolveRouteAfterAuth,
  isOtpVerifiedNoAccount: () => false,
  renderOtpState: () => ({
    canResend: false,
    isLocked: authApi.isLocked,
    secondsUntilResend: 50,
  }),
}));

// Capture the autofill callback the screen registers, so a test can deliver
// an SMS code exactly the way the native module would.
const autofill = vi.hoisted(() => ({ onCode: null as null | ((code: string) => void) }));
vi.mock('../../../shell/otp', async (importOriginal) => ({
  ...(await importOriginal<typeof OtpModule>()),
  useOtpSmsAutofill: (opts: { onCode: (code: string) => void }) => {
    autofill.onCode = opts.onCode;
  },
}));

import { OtpScreen } from '../screens/auth/OtpScreen';
import { authPalette } from '../theme';

type Style = Record<string, unknown>;
function flatten(style: unknown): Style {
  if (Array.isArray(style)) return style.reduce<Style>((acc, s) => ({ ...acc, ...flatten(s) }), {});
  return style && typeof style === 'object' ? (style as Style) : {};
}

async function mount(): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <OtpScreen mobile="+919876543210" challengeId="c1" onNavigate={() => undefined} />,
    );
  });
  return tree;
}

function verifyButton(tree: renderer.ReactTestRenderer): ReactTestInstance {
  return tree.root.find((n) => n.props.testID === 'otp-verify' && typeof n.type === 'string');
}

function expectSolidEnabled(button: ReactTestInstance): void {
  const style = flatten(button.props.style);
  expect(button.props.disabled).toBe(false);
  expect(button.props.accessibilityState?.disabled).toBe(false);
  expect(style.backgroundColor).toBe(authPalette.primary);
  expect(style.opacity ?? 1).toBe(1);
}

function expectFadedDisabled(button: ReactTestInstance): void {
  const style = flatten(button.props.style);
  expect(button.props.disabled).toBe(true);
  expect(button.props.accessibilityState?.disabled).toBe(true);
  expect(style.backgroundColor).not.toBe(authPalette.primary);
}

beforeEach(() => {
  (globalThis as { __DEV__?: boolean }).__DEV__ = true;
});

afterEach(() => {
  authApi.isLocked = false;
  authApi.verifyOtp.mockReset();
  authApi.fetchMe.mockReset();
  authApi.resolveRouteAfterAuth.mockReset();
  autofill.onCode = null;
  (globalThis as { __DEV__?: boolean }).__DEV__ = true;
});

describe('OtpScreen Verify button', () => {
  it('is faded and disabled while the code is incomplete', async () => {
    const tree = await mount();
    expectFadedDisabled(verifyButton(tree));
    await act(async () => {
      tree.root.findByType('TextInput' as never).props.onChangeText('99358');
    });
    expectFadedDisabled(verifyButton(tree));
  });

  it('is solid primary and enabled once six digits are typed one by one, and verifies that code', async () => {
    authApi.verifyOtp.mockReturnValue(new Promise(() => undefined));
    const tree = await mount();
    let typed = '';
    for (const digit of '993588') {
      typed += digit;
      await act(async () => {
        tree.root.findByType('TextInput' as never).props.onChangeText(typed);
      });
    }
    expectSolidEnabled(verifyButton(tree));

    await act(async () => {
      verifyButton(tree).props.onPress();
    });
    expect(authApi.verifyOtp).toHaveBeenCalledWith({ challengeId: 'c1', code: '993588' });
  });

  it('is solid primary and enabled after the SMS autofill delivers the code, and verifies it', async () => {
    authApi.verifyOtp.mockReturnValue(new Promise(() => undefined));
    const tree = await mount();
    expect(autofill.onCode).not.toBeNull();
    await act(async () => {
      autofill.onCode!('993588');
    });
    expect(tree.root.findByType('TextInput' as never).props.value).toBe('993588');
    expectSolidEnabled(verifyButton(tree));
    // Fill only: farmer/admin still tap Verify.
    expect(authApi.verifyOtp).not.toHaveBeenCalled();

    await act(async () => {
      verifyButton(tree).props.onPress();
    });
    expect(authApi.verifyOtp).toHaveBeenCalledWith({ challengeId: 'c1', code: '993588' });
  });

  it('shows a busy spinner on the solid button while verifying, and cannot be pressed again', async () => {
    authApi.verifyOtp.mockReturnValue(new Promise(() => undefined));
    const tree = await mount();
    await act(async () => {
      autofill.onCode!('993588');
    });
    await act(async () => {
      verifyButton(tree).props.onPress();
    });
    const button = verifyButton(tree);
    const style = flatten(button.props.style);
    expect(button.props.disabled).toBe(true);
    expect(button.props.accessibilityState?.busy).toBe(true);
    expect(style.backgroundColor).toBe(authPalette.primary);
    expect(style.opacity ?? 1).toBe(1);
    expect(button.findAllByType('ActivityIndicator' as never)).toHaveLength(1);
  });

  it('is faded and disabled when the challenge is locked, even with six digits', async () => {
    authApi.isLocked = true;
    const tree = await mount();
    await act(async () => {
      tree.root.findByType('TextInput' as never).props.onChangeText('993588');
    });
    expectFadedDisabled(verifyButton(tree));
  });
});
