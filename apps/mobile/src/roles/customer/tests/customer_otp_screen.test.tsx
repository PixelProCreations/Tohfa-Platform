import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
  Modal: 'Modal',
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
  verifyCustomerLoginOtp: vi.fn(),
}));

import { CustomerOtpScreen } from '../screens/CustomerOtpScreen';
import { sendCustomerLoginOtp, verifyCustomerLoginOtp, type CustomerLoginResult } from '../api/auth';
import { ApiError, NetworkError } from '../../../shell/api/client';
import { t } from '../../../i18n/customer';

const sendMock = vi.mocked(sendCustomerLoginOtp);
const verifyMock = vi.mocked(verifyCustomerLoginOtp);

const NOW = new Date('2026-11-17T10:00:00.000Z').getTime();
const iso = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();

function apiError(status: number, code: string, retryAfterSeconds?: number) {
  return new ApiError(
    { type: 'about:blank', title: code, status, code: code as never },
    retryAfterSeconds === undefined ? {} : { retryAfterSeconds },
  );
}

function verifyResult(route: CustomerLoginResult['route']): CustomerLoginResult {
  return { route, response: { isNewUser: route === 'CustomerProfileName' } as CustomerLoginResult['response'] };
}

function textOf(node: renderer.ReactTestInstance): string {
  return node.children.map((c) => (typeof c === 'string' ? c : textOf(c))).join('');
}

async function renderScreen(overrides: Partial<React.ComponentProps<typeof CustomerOtpScreen>> = {}) {
  const onNavigate = vi.fn();
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <CustomerOtpScreen
        mobile="9876543210"
        challengeId="challenge-1"
        expiresAt={iso(5 * 60_000)}
        resendAvailableAt={iso(30_000)}
        attemptsRemaining={3}
        onNavigate={onNavigate}
        {...overrides}
      />,
    );
  });
  const root = tree.root;
  const boxes = () => root.findAllByType('TextInput' as never);
  const byTestId = (id: string) => root.findAll((n) => n.props.testID === id && typeof n.type === 'string');
  const modal = () => root.findByType('Modal' as never);
  const typeDigits = async (digits: string) => {
    for (let i = 0; i < digits.length; i++) {
      await act(async () => {
        boxes()[i]!.props.onChangeText(digits[i]);
      });
    }
  };
  return { tree, root, boxes, byTestId, modal, typeDigits, onNavigate };
}

describe('BR-153 CustomerOtpScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('BR-153: renders 6 PIN boxes and the 6-digit title with the mobile', async () => {
    const { root, boxes } = await renderScreen();
    expect(boxes()).toHaveLength(6);
    const texts = root.findAllByType('Text' as never).map(textOf);
    expect(texts).toContain('Please enter 6-digit PIN Sent to');
    expect(texts).toContain('+91 9876543210');
  });

  it('BR-153: does not auto-succeed; the verified modal stays hidden until the API confirms', async () => {
    let resolve!: (v: CustomerLoginResult) => void;
    verifyMock.mockReturnValue(new Promise((r) => (resolve = r)));
    const { modal, typeDigits, root } = await renderScreen();

    await typeDigits('12345');
    expect(verifyMock).not.toHaveBeenCalled();
    expect(modal().props.visible).toBe(false);

    await typeDigits('123456');
    expect(verifyMock).toHaveBeenCalledTimes(1);
    expect(modal().props.visible).toBe(false);
    expect(root.findAllByType('ActivityIndicator' as never)).toHaveLength(1);

    await act(async () => {
      resolve(verifyResult('CustomerMain'));
    });
    expect(modal().props.visible).toBe(true);
  });

  it('BR-153: auto-submits on the 6th digit and routes new users to CustomerProfileName', async () => {
    verifyMock.mockResolvedValue(verifyResult('CustomerProfileName'));
    const { typeDigits, byTestId, onNavigate } = await renderScreen();
    await typeDigits('482913');

    expect(verifyMock).toHaveBeenCalledWith({
      mobile: '9876543210',
      challengeId: 'challenge-1',
      otp: '482913',
      preferredLocale: 'en',
    });
    expect(onNavigate).not.toHaveBeenCalled();
    await act(async () => {
      byTestId('customer-otp-continue')[0]!.props.onPress();
    });
    expect(onNavigate).toHaveBeenCalledWith('CustomerProfileName');
  });

  it('BR-153: returning users continue to CustomerMain', async () => {
    verifyMock.mockResolvedValue(verifyResult('CustomerMain'));
    const { typeDigits, byTestId, onNavigate } = await renderScreen();
    await typeDigits('482913');
    await act(async () => {
      byTestId('customer-otp-continue')[0]!.props.onPress();
    });
    expect(onNavigate).toHaveBeenCalledWith('CustomerMain');
  });

  it('BR-153: a pasted full code fills every box and submits once', async () => {
    verifyMock.mockResolvedValue(verifyResult('CustomerMain'));
    const { boxes } = await renderScreen();
    await act(async () => {
      boxes()[0]!.props.onChangeText('654321');
    });
    expect(boxes().map((b) => b.props.value)).toEqual(['6', '5', '4', '3', '2', '1']);
    expect(verifyMock).toHaveBeenCalledTimes(1);
    expect(verifyMock.mock.calls[0]![0].otp).toBe('654321');
  });

  it('BR-153: wrong OTP (401 OTP_INVALID) shows the mapped error and clears the boxes', async () => {
    verifyMock.mockRejectedValue(apiError(401, 'OTP_INVALID'));
    const { typeDigits, boxes, byTestId, modal } = await renderScreen();
    await typeDigits('111111');

    expect(byTestId('customer-otp-error')[0]?.props.children).toBe('That code is not correct or has expired.');
    expect(boxes().every((b) => b.props.value === '')).toBe(true);
    expect(boxes()[0]!.props.editable).toBe(true);
    expect(modal().props.visible).toBe(false);
  });

  it('BR-153: OTP_LOCKED disables input and offers Resend even during the cooldown', async () => {
    verifyMock.mockRejectedValue(apiError(429, 'OTP_LOCKED'));
    const { typeDigits, boxes, byTestId } = await renderScreen();
    await typeDigits('111111');

    expect(byTestId('customer-otp-error')[0]?.props.children).toMatch(/locked/i);
    expect(boxes().every((b) => b.props.editable === false)).toBe(true);
    expect(byTestId('customer-otp-resend')).toHaveLength(1);
    expect(byTestId('customer-otp-timer')).toHaveLength(0);
  });

  it('BR-153: OTP_EXPIRED (resend_otp action) clears the boxes and asks for a new PIN', async () => {
    verifyMock.mockRejectedValue(apiError(400, 'OTP_EXPIRED'));
    const { typeDigits, boxes, byTestId } = await renderScreen({ resendAvailableAt: iso(-1000) });
    await typeDigits('111111');

    expect(byTestId('customer-otp-error')[0]?.props.children).toMatch(/expired/i);
    expect(boxes().every((b) => b.props.value === '')).toBe(true);
    expect(textOf(byTestId('customer-otp-resend')[0]!)).toContain('Request a new PIN');
  });

  it('BR-153: a NetworkError keeps the digits and "Try again" resubmits them', async () => {
    verifyMock
      .mockRejectedValueOnce(new NetworkError(new Error('offline')))
      .mockResolvedValueOnce(verifyResult('CustomerMain'));
    const { typeDigits, boxes, byTestId, modal } = await renderScreen();
    await typeDigits('482913');

    expect(byTestId('customer-otp-error')[0]?.props.children).toMatch(/offline/i);
    expect(boxes().map((b) => b.props.value).join('')).toBe('482913');
    await act(async () => {
      byTestId('customer-otp-retry')[0]!.props.onPress();
    });
    expect(verifyMock).toHaveBeenCalledTimes(2);
    expect(modal().props.visible).toBe(true);
  });

  it('BR-153: resend timer counts down from the server resendAvailableAt', async () => {
    const { byTestId } = await renderScreen({ resendAvailableAt: iso(30_000) });
    expect(textOf(byTestId('customer-otp-timer')[0]!)).toContain('30s');
    expect(byTestId('customer-otp-resend')).toHaveLength(0);

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(textOf(byTestId('customer-otp-timer')[0]!)).toContain('29s');

    await act(async () => {
      vi.advanceTimersByTime(29_000);
    });
    expect(byTestId('customer-otp-timer')).toHaveLength(0);
    expect(byTestId('customer-otp-resend')).toHaveLength(1);
  });

  it('BR-153: Resend calls send again and the next verify uses the refreshed challenge', async () => {
    sendMock.mockResolvedValue({
      challengeId: 'challenge-2',
      expiresAt: iso(5 * 60_000),
      resendAvailableAt: iso(60_000),
      attemptsRemaining: 3,
    });
    verifyMock.mockResolvedValue(verifyResult('CustomerMain'));
    const { byTestId, typeDigits } = await renderScreen({ resendAvailableAt: iso(-1000) });

    await act(async () => {
      byTestId('customer-otp-resend')[0]!.props.onPress();
    });
    expect(sendMock).toHaveBeenCalledWith('9876543210');
    expect(textOf(byTestId('customer-otp-timer')[0]!)).toContain('60s');

    await typeDigits('482913');
    expect(verifyMock.mock.calls[0]![0].challengeId).toBe('challenge-2');
  });

  it('BR-153: a 429 on Resend shows the wait message and restarts the countdown', async () => {
    sendMock.mockRejectedValue(apiError(429, 'OTP_RESEND_TOO_SOON', 20));
    const { byTestId } = await renderScreen({ resendAvailableAt: iso(-1000) });
    await act(async () => {
      byTestId('customer-otp-resend')[0]!.props.onPress();
    });
    expect(byTestId('customer-otp-error')[0]?.props.children).toContain('20');
    expect(textOf(byTestId('customer-otp-timer')[0]!)).toContain('20s');
  });

  it('BR-135/BR-153c: a number with no customer role (403) is told to use the farmer login, never signed in', async () => {
    verifyMock.mockRejectedValue(apiError(403, 'FORBIDDEN'));
    const { byTestId, typeDigits, onNavigate } = await renderScreen();
    await typeDigits('482913');
    expect(byTestId('customer-otp-error')[0]?.props.children).toBe(t('customer.auth.otp.notCustomerAccount'));
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('BR-153: Edit returns to CustomerLogin', async () => {
    const { byTestId, onNavigate } = await renderScreen();
    await act(async () => {
      byTestId('customer-otp-edit')[0]!.props.onPress();
    });
    expect(onNavigate).toHaveBeenCalledWith('CustomerLogin');
  });
});
