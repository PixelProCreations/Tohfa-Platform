/**
 * Customer OTP screen: the submit button while an autofilled code verifies.
 *
 * The customer screen auto-submits a complete code (typed, pasted, or
 * delivered by the SMS autofill hook). While that request is in flight the
 * button must read as busy (solid brand fill + spinner), not as a faded,
 * dead control. Faded is reserved for "nothing to submit": an incomplete code
 * or a BR-32 locked challenge.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';
import type * as AuthModule from '../api/auth';
import type * as OtpModule from '../../../shell/otp';

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

const autofill = vi.hoisted(() => ({ onCode: null as null | ((code: string) => void) }));
vi.mock('../../../shell/otp', async (importOriginal) => ({
  ...(await importOriginal<typeof OtpModule>()),
  useOtpSmsAutofill: (opts: { onCode: (code: string) => void }) => {
    autofill.onCode = opts.onCode;
  },
}));

import { CustomerOtpScreen } from '../screens/CustomerOtpScreen';
import { verifyCustomerLoginOtp } from '../api/auth';
import { t } from '../../../i18n/customer';

const verifyMock = vi.mocked(verifyCustomerLoginOtp);

const NOW = new Date('2026-11-17T10:00:00.000Z').getTime();
const iso = (offsetMs: number) => new Date(NOW + offsetMs).toISOString();

type Style = Record<string, unknown>;
function flatten(style: unknown): Style {
  if (Array.isArray(style)) return style.reduce<Style>((acc, s) => ({ ...acc, ...flatten(s) }), {});
  return style && typeof style === 'object' ? (style as Style) : {};
}

async function renderScreen(): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <CustomerOtpScreen
        mobile="9876543210"
        challengeId="challenge-1"
        expiresAt={iso(5 * 60_000)}
        resendAvailableAt={iso(30_000)}
        attemptsRemaining={3}
        onNavigate={vi.fn()}
      />,
    );
  });
  return tree;
}

function submitButton(tree: renderer.ReactTestRenderer): ReactTestInstance {
  return tree.root.find(
    (n) =>
      (n.type as unknown) === 'TouchableOpacity' &&
      n.props.accessibilityLabel === t('customer.auth.otp.verifyA11y'),
  );
}

describe('CustomerOtpScreen submit button busy state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    autofill.onCode = null;
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is faded while the code is incomplete', async () => {
    const tree = await renderScreen();
    const button = submitButton(tree);
    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: false });
    expect(flatten(button.props.style).opacity).toBeLessThan(1);
  });

  it('autofilled code auto-submits once and shows a solid busy spinner, not a faded button', async () => {
    verifyMock.mockReturnValue(new Promise(() => undefined));
    const tree = await renderScreen();
    expect(autofill.onCode).not.toBeNull();

    await act(async () => {
      autofill.onCode!('993588');
    });

    expect(verifyMock).toHaveBeenCalledTimes(1);
    expect(verifyMock.mock.calls[0]![0]).toMatchObject({ challengeId: 'challenge-1', otp: '993588' });

    const button = submitButton(tree);
    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: true });
    expect(button.props.disabled).toBe(true);
    expect(flatten(button.props.style).opacity ?? 1).toBe(1);
    expect(button.findAllByType('ActivityIndicator' as never)).toHaveLength(1);
  });
});
