/**
 * The API returns `_mockCode` only when SMS_PROVIDER is `mock` (or in tests).
 * It used to be console.warn'd and never shown, so a developer on the OTP
 * screen had no way to read it. These tests pin the dev-only hint: shown when
 * a mock code was handed over, absent otherwise, and absent outside __DEV__.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';

vi.mock('react-native', () => ({
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

vi.mock('../assets/icons/AssetIcons', () => ({
  BackButtonIcon: 'BackButtonIcon',
  LockIcon: 'LockIcon',
}));

const authApi = vi.hoisted(() => ({
  canResend: false,
  requestOtp: vi.fn(),
  verifyOtp: vi.fn(),
}));
vi.mock('../api/auth', () => ({
  verifyOtp: authApi.verifyOtp,
  requestOtp: authApi.requestOtp,
  fetchMe: vi.fn(),
  resolveRouteAfterAuth: vi.fn(),
  renderOtpState: () => ({ canResend: authApi.canResend, isLocked: false, secondsUntilResend: 30 }),
}));

import { OtpScreen } from '../screens/auth/OtpScreen';

function renderedText(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(renderedText);
  return (node.children ?? []).flatMap(renderedText);
}

async function textOf(props: { mockCode?: string }): Promise<string> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <OtpScreen mobile="+919876543210" challengeId="c1" onNavigate={() => undefined} {...props} />,
    );
  });
  const out = renderedText(tree.toJSON() as ReactTestRendererJSON).join(' ');
  await act(async () => tree.unmount());
  return out;
}

/** The six digit boxes' contents, read from the hidden input's value. */
function inputValue(tree: renderer.ReactTestRenderer): string {
  return String(tree.root.findByType('TextInput' as never).props.value);
}

async function mount(props: { mockCode?: string; mobile?: string }): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <OtpScreen mobile="+919876543210" challengeId="c1" onNavigate={() => undefined} {...props} />,
    );
  });
  return tree;
}

afterEach(() => {
  authApi.canResend = false;
  authApi.requestOtp.mockReset();
  authApi.verifyOtp.mockReset();
  (globalThis as { __DEV__?: boolean }).__DEV__ = true;
});

describe('OtpScreen dev mock OTP hint', () => {
  it('dev mock OTP is shown on OTP screen when provided', async () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    const text = await textOf({ mockCode: '123456' });
    expect(text).toContain('Dev OTP');
    expect(text).toContain('123456');
  });

  it('dev mock OTP is not shown when absent', async () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    const text = await textOf({});
    expect(text).not.toContain('Dev OTP');
  });

  it('dev mock OTP is not shown outside __DEV__ even when provided', async () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
    const text = await textOf({ mockCode: '123456' });
    expect(text).not.toContain('123456');
  });

  it('dev mock OTP pre-fills the OTP boxes', async () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    const tree = await mount({ mockCode: '123456' });
    expect(inputValue(tree)).toBe('123456');
    // Pre-fill only: the user still taps Verify.
    expect(authApi.verifyOtp).not.toHaveBeenCalled();
  });

  it('does not pre-fill when absent', async () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    expect(inputValue(await mount({}))).toBe('');
    expect(inputValue(await mount({ mockCode: '12ab' }))).toBe('');
  });

  it('does not pre-fill when not __DEV__', async () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
    expect(inputValue(await mount({ mockCode: '123456' }))).toBe('');
  });

  it('resend refills with new code', async () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    authApi.canResend = true;
    authApi.requestOtp.mockResolvedValue({
      challengeId: 'c2',
      resendAvailableAt: new Date().toISOString(),
      attemptsRemaining: 3,
      _mockCode: '654321',
    });
    const tree = await mount({ mockCode: '123456' });
    const resend = tree.root
      .findAllByType('TouchableOpacity' as never)
      .find((n) => n.props.onPress !== undefined && n.props.disabled === false)!;
    await act(async () => {
      await resend.props.onPress();
    });
    expect(inputValue(tree)).toBe('654321');
  });
});
