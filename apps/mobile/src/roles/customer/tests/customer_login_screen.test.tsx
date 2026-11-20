import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import type * as AuthModule from '../api/auth';

vi.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  Image: 'Image',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  ActivityIndicator: 'ActivityIndicator',
  Platform: {
    OS: 'android',
    select: (obj: Record<string, unknown>) => obj['android'] ?? obj['default'],
  },
  StatusBar: 'StatusBar',
  StyleSheet: {
    create: (s: Record<string, unknown>) => s,
  },
}));

vi.mock('@tohfa/mobile-ui', () => ({
  ScreenStatusBar: 'ScreenStatusBar',
}));

vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Path: 'Path',
}));

vi.mock('../api/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof AuthModule>()),
  sendCustomerLoginOtp: vi.fn(),
}));

import { CustomerLoginScreen } from '../screens/CustomerLoginScreen';
import { sendCustomerLoginOtp } from '../api/auth';
import { ApiError, NetworkError } from '../../../shell/api/client';

const sendMock = vi.mocked(sendCustomerLoginOtp);

const CHALLENGE = {
  challengeId: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  expiresAt: '2026-11-17T10:05:00.000Z',
  resendAvailableAt: '2026-11-17T10:01:00.000Z',
  attemptsRemaining: 3,
};

async function renderScreen(onNavigate = vi.fn()) {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<CustomerLoginScreen onNavigate={onNavigate} />);
  });
  const root = tree.root;
  const input = () => root.findByType('TextInput' as never);
  const checkbox = () =>
    root.findAllByType('TouchableOpacity' as never).find((b) => b.props.accessibilityRole === 'checkbox')!;
  const nextButton = () =>
    root.findAllByType('TouchableOpacity' as never).find((b) => b.props.accessibilityRole === 'button')!;
  const byTestId = (id: string) => root.findAll((n) => n.props.testID === id && typeof n.type === 'string');
  const typePhone = async (v: string) => {
    await act(async () => {
      input().props.onChangeText(v);
    });
  };
  const toggleTerms = async () => {
    await act(async () => {
      checkbox().props.onPress();
    });
  };
  const pressNext = async () => {
    await act(async () => {
      nextButton().props.onPress();
    });
  };
  return { tree, root, input, checkbox, nextButton, byTestId, typePhone, toggleTerms, pressNext, onNavigate };
}

describe('BR-153 CustomerLoginScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('BR-153: renders Welcome Back title, subtitle, phone input, and terms checkbox', async () => {
    const { root, input } = await renderScreen();
    const allText = root.findAllByType('Text' as never).map((node) => node.props.children);
    expect(allText).toContain('Welcome Back!');
    expect(allText).toContain("Let's get you Stated");
    expect(allText).toContain('I agree to terms and conditions');
    expect(input().props.placeholder).toBe('Please enter phone number');
    expect(input().props.keyboardType).toBe('phone-pad');
  });

  it('BR-153: toggles terms agreement checkbox when pressed', async () => {
    const { checkbox, toggleTerms } = await renderScreen();
    expect(checkbox().props.accessibilityState.checked).toBe(false);
    await toggleTerms();
    expect(checkbox().props.accessibilityState.checked).toBe(true);
  });

  it('BR-153: Next stays disabled until a valid 10-digit (6-9) mobile AND terms are agreed', async () => {
    const { nextButton, typePhone, toggleTerms, pressNext, byTestId } = await renderScreen();
    expect(nextButton().props.disabled).toBe(true);

    await typePhone('9876543210');
    expect(nextButton().props.disabled).toBe(true); // terms not agreed

    await toggleTerms();
    expect(nextButton().props.disabled).toBe(false);

    await typePhone('5876543210'); // first digit must be 6-9
    expect(nextButton().props.disabled).toBe(true);
    expect(byTestId('customer-login-mobile-hint')).toHaveLength(1);

    await typePhone('98765'); // too short, no mock fallback number
    expect(nextButton().props.disabled).toBe(true);
    await pressNext();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('BR-153: sends the OTP and navigates to CustomerOtp with the challenge params', async () => {
    sendMock.mockResolvedValue(CHALLENGE);
    const { typePhone, toggleTerms, pressNext, onNavigate } = await renderScreen();
    await typePhone('9876543210');
    await toggleTerms();
    await pressNext();

    expect(sendMock).toHaveBeenCalledWith('9876543210');
    expect(onNavigate).toHaveBeenCalledWith('CustomerOtp', {
      mobile: '9876543210',
      challengeId: CHALLENGE.challengeId,
      expiresAt: CHALLENGE.expiresAt,
      resendAvailableAt: CHALLENGE.resendAvailableAt,
      attemptsRemaining: 3,
    });
  });

  it('BR-153: shows a spinner and disables Next while the request is in flight', async () => {
    let resolve!: (v: typeof CHALLENGE) => void;
    sendMock.mockReturnValue(new Promise((r) => (resolve = r)));
    const { root, nextButton, typePhone, toggleTerms, pressNext } = await renderScreen();
    await typePhone('9876543210');
    await toggleTerms();
    await pressNext();

    expect(nextButton().props.disabled).toBe(true);
    expect(root.findAllByType('ActivityIndicator' as never)).toHaveLength(1);
    await pressNext();
    expect(sendMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolve(CHALLENGE);
    });
    expect(root.findAllByType('ActivityIndicator' as never)).toHaveLength(0);
  });

  it('BR-153: maps a 429 OTP_RESEND_TOO_SOON into an inline wait message and stays on Login', async () => {
    sendMock.mockRejectedValue(
      new ApiError(
        { type: 'about:blank', title: 'Too soon', status: 429, code: 'OTP_RESEND_TOO_SOON' as never },
        { retryAfterSeconds: 42 },
      ),
    );
    const { typePhone, toggleTerms, pressNext, byTestId, onNavigate } = await renderScreen();
    await typePhone('9876543210');
    await toggleTerms();
    await pressNext();

    const [err] = byTestId('customer-login-error');
    expect(err?.props.children).toContain('42');
    expect(byTestId('customer-login-retry')).toHaveLength(0);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('BR-153: a NetworkError shows the offline message with a working "Try again"', async () => {
    sendMock.mockRejectedValueOnce(new NetworkError(new Error('offline'))).mockResolvedValueOnce(CHALLENGE);
    const { typePhone, toggleTerms, pressNext, byTestId, onNavigate } = await renderScreen();
    await typePhone('9876543210');
    await toggleTerms();
    await pressNext();

    expect(byTestId('customer-login-error')[0]?.props.children).toMatch(/offline/i);
    const [retry] = byTestId('customer-login-retry');
    expect(retry).toBeDefined();
    await act(async () => {
      retry?.props.onPress();
    });
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(onNavigate).toHaveBeenCalledWith('CustomerOtp', expect.objectContaining({ challengeId: CHALLENGE.challengeId }));
  });

  it('does not render any black bottom bar or home indicator', async () => {
    const { root } = await renderScreen();
    const allViews = root.findAllByType('View' as never);
    for (const v of allViews) {
      const style = v.props.style;
      const styles = Array.isArray(style) ? style : [style];
      for (const s of styles) {
        if (s && s.backgroundColor) {
          expect(s.backgroundColor).not.toBe('#000000');
          expect(s.backgroundColor).not.toBe('#1E1E1E');
        }
      }
    }
  });
});
