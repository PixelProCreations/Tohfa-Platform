/**
 * BR-39 social sign-in: the native Google wrapper must turn every way the
 * Google SDK can fail into a *classified* SocialSignInError (or a silent
 * cancel), and describeError must map each class to its own translated
 * message. Before this, any native failure -- most visibly Android
 * DEVELOPER_ERROR (status 10, an OAuth-client / SHA-1 / package mismatch in
 * Google Cloud Console) -- became an unclassified Error, describeError fell
 * through to `error.generic`, and the Login banner said only "Something went
 * wrong", hiding the cause from both the farmer and the developer.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

const google = vi.hoisted(() => ({
  configure: vi.fn(),
  hasPlayServices: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: google,
  statusCodes: {
    SIGN_IN_CANCELLED: '12501',
    IN_PROGRESS: 'ASYNC_OP_IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    SIGN_IN_REQUIRED: '4',
  },
}));
vi.mock('react-native-fbsdk-next', () => ({ AccessToken: {}, LoginManager: {} }));

import { signInWithGoogle } from '../native/socialSignIn';
import {
  SocialSignInCancelledError,
  SocialSignInError,
  type SocialSignInFailure,
} from '../../../shell/auth/socialSignInErrors';
import { describeError } from '../../../shell/errors/describeError';
import errorsEn from '../../../i18n/errors.en.json';
import errorsTa from '../../../i18n/errors.ta.json';

function nativeError(code: string): Error {
  return Object.assign(new Error(`native ${code}`), { code });
}

async function failureOf(p: Promise<unknown>): Promise<unknown> {
  try {
    await p;
  } catch (e) {
    return e;
  }
  throw new Error('expected signInWithGoogle to reject');
}

afterEach(() => {
  google.hasPlayServices.mockReset();
  google.signIn.mockReset();
  vi.restoreAllMocks();
});

describe('BR-39: signInWithGoogle classifies native failures', () => {
  it('BR-39: returns the ID token on success', async () => {
    google.hasPlayServices.mockResolvedValue(true);
    google.signIn.mockResolvedValue({ type: 'success', data: { idToken: 'id-token' } });
    await expect(signInWithGoogle()).resolves.toBe('id-token');
  });

  it('BR-39: a dismissed sheet (type cancelled) is a silent cancel, not an error', async () => {
    google.hasPlayServices.mockResolvedValue(true);
    google.signIn.mockResolvedValue({ type: 'cancelled', data: null });
    expect(await failureOf(signInWithGoogle())).toBeInstanceOf(SocialSignInCancelledError);
  });

  it('BR-39: SIGN_IN_CANCELLED (12501) is a silent cancel', async () => {
    google.hasPlayServices.mockResolvedValue(true);
    google.signIn.mockRejectedValue(nativeError('12501'));
    expect(await failureOf(signInWithGoogle())).toBeInstanceOf(SocialSignInCancelledError);
  });

  const CASES: Array<[string, string, 'hasPlayServices' | 'signIn', SocialSignInFailure]> = [
    ['DEVELOPER_ERROR (10)', '10', 'signIn', 'DEVELOPER_ERROR'],
    ['NETWORK_ERROR (7)', '7', 'signIn', 'NETWORK'],
    ['SIGN_IN_FAILED (12500)', '12500', 'signIn', 'FAILED'],
    ['IN_PROGRESS', 'ASYNC_OP_IN_PROGRESS', 'signIn', 'IN_PROGRESS'],
    ['PLAY_SERVICES_NOT_AVAILABLE', 'PLAY_SERVICES_NOT_AVAILABLE', 'hasPlayServices', 'PLAY_SERVICES_UNAVAILABLE'],
    ['an unknown native code', 'SOMETHING_ELSE', 'signIn', 'FAILED'],
  ];

  it.each(CASES)('BR-39: %s (native code %s, from %s) -> SocialSignInError reason %s', async (_label, code, step, reason) => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    google.hasPlayServices.mockResolvedValue(true);
    google.signIn.mockResolvedValue({ type: 'success', data: { idToken: 'x' } });
    google[step].mockRejectedValue(nativeError(code));

    const err = await failureOf(signInWithGoogle());
    expect(err).toBeInstanceOf(SocialSignInError);
    expect((err as SocialSignInError).reason).toBe(reason);
    expect((err as SocialSignInError).provider).toBe('GOOGLE');
    expect((err as SocialSignInError).nativeCode).toBe(code);
  });

  it('BR-39: a success with no idToken (webClientId not honoured) is NO_ID_TOKEN', async () => {
    google.hasPlayServices.mockResolvedValue(true);
    google.signIn.mockResolvedValue({ type: 'success', data: { idToken: null } });
    const err = await failureOf(signInWithGoogle());
    expect(err).toBeInstanceOf(SocialSignInError);
    expect((err as SocialSignInError).reason).toBe('NO_ID_TOKEN');
  });
});

describe('BR-39: describeError maps social sign-in failures to specific messages', () => {
  const MAPPED: Array<[SocialSignInFailure, string, string]> = [
    ['DEVELOPER_ERROR', 'error.SOCIAL_SIGN_IN_UNAVAILABLE', 'none'],
    ['NO_ID_TOKEN', 'error.SOCIAL_SIGN_IN_UNAVAILABLE', 'none'],
    ['PLAY_SERVICES_UNAVAILABLE', 'error.SOCIAL_SIGN_IN_PLAY_SERVICES', 'none'],
    ['NETWORK', 'error.NETWORK_OFFLINE', 'retry'],
    ['FAILED', 'error.SOCIAL_SIGN_IN_FAILED', 'retry'],
  ];

  it.each(MAPPED)('BR-39: %s -> %s (action %s), never error.generic', (reason, key, action) => {
    const d = describeError(new SocialSignInError('GOOGLE', reason, '10', new Error('x')));
    expect(d.messageKey).toBe(key);
    expect(d.messageKey).not.toBe('error.generic');
    expect(d.action).toBe(action);
    expect(d.silent).toBe(false);
    expect(d.code).toBe(reason === 'NETWORK' ? 'NETWORK_OFFLINE' : `SOCIAL_SIGN_IN_${reason}`);
    expect(errorsEn).toHaveProperty([key]);
    expect(errorsTa).toHaveProperty([key]);
  });

  it('BR-39: a cancelled sheet and a double-tap (IN_PROGRESS) are silent', () => {
    expect(describeError(new SocialSignInCancelledError('GOOGLE')).silent).toBe(true);
    expect(describeError(new SocialSignInError('GOOGLE', 'IN_PROGRESS', null, null)).silent).toBe(true);
  });
});
