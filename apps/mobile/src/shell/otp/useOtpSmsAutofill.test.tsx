import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { useOtpSmsAutofill, type UseOtpSmsAutofillOptions } from './useOtpSmsAutofill';
import {
  getSmsUserConsent,
  resetSmsUserConsentWarningForTests,
  resolveSmsUserConsent,
  SMS_CONSENT_MISSING_WARNING,
  type SmsUserConsentModule,
} from './smsUserConsent';

/**
 * A fake of the native SMS User Consent module: each listenForOneSms() call
 * returns a promise the test settles by hand via deliver(), so the order of
 * "SMS arrives" vs "screen unmounts" is explicit.
 */
function createFakeModule() {
  const resolvers: Array<(message: string) => void> = [];
  const module: SmsUserConsentModule & {
    listenForOneSms: ReturnType<typeof vi.fn>;
    stopListening: ReturnType<typeof vi.fn>;
  } = {
    listenForOneSms: vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolvers.push(resolve);
        }),
    ),
    stopListening: vi.fn(() => {
      // Native resolves any pending call with "" when stopped.
      while (resolvers.length > 0) resolvers.shift()?.('');
    }),
  };
  const deliver = async (message: string) => {
    await act(async () => {
      resolvers.shift()?.(message);
    });
  };
  return { module, deliver };
}

function Harness(props: UseOtpSmsAutofillOptions) {
  useOtpSmsAutofill(props);
  return null;
}

let tree: renderer.ReactTestRenderer | null = null;

async function mount(props: UseOtpSmsAutofillOptions) {
  await act(async () => {
    tree = renderer.create(<Harness {...props} />);
  });
}

async function update(props: UseOtpSmsAutofillOptions) {
  await act(async () => {
    tree?.update(<Harness {...props} />);
  });
}

afterEach(async () => {
  await act(async () => {
    tree?.unmount();
  });
  tree = null;
});

describe('useOtpSmsAutofill', () => {
  it('BR-32: fills the 6-digit code from the consented SMS exactly once', async () => {
    const { module, deliver } = createFakeModule();
    const onCode = vi.fn();
    await mount({ enabled: true, armKey: 'challenge-1', onCode, nativeModule: module });

    expect(module.listenForOneSms).toHaveBeenCalledTimes(1);
    await deliver('Your TOHFA verification code is: 482913');

    expect(onCode).toHaveBeenCalledTimes(1);
    expect(onCode).toHaveBeenCalledWith('482913');
    // Delivered: not re-armed for further SMS.
    expect(module.listenForOneSms).toHaveBeenCalledTimes(1);
  });

  it('ignores a consented SMS without a code and keeps waiting for the next one', async () => {
    const { module, deliver } = createFakeModule();
    const onCode = vi.fn();
    await mount({ enabled: true, onCode, nativeModule: module });

    await deliver('Your order has shipped');
    expect(onCode).not.toHaveBeenCalled();
    expect(module.listenForOneSms).toHaveBeenCalledTimes(2);

    await deliver('Code 102938');
    expect(onCode).toHaveBeenCalledWith('102938');
  });

  it('stops quietly (manual entry) on timeout or when the user denies consent', async () => {
    const { module, deliver } = createFakeModule();
    const onCode = vi.fn();
    await mount({ enabled: true, onCode, nativeModule: module });

    await deliver(''); // native resolves "" for timeout / deny / failure
    expect(onCode).not.toHaveBeenCalled();
    expect(module.listenForOneSms).toHaveBeenCalledTimes(1);
  });

  it('removes the native listener on unmount and never fills after it', async () => {
    const { module } = createFakeModule();
    const onCode = vi.fn();
    await mount({ enabled: true, onCode, nativeModule: module });

    await act(async () => {
      tree?.unmount();
    });
    tree = null;

    expect(module.stopListening).toHaveBeenCalledTimes(1);
    expect(onCode).not.toHaveBeenCalled();
  });

  it('does not listen while disabled, and disarms when disabled later', async () => {
    const { module } = createFakeModule();
    const onCode = vi.fn();
    await mount({ enabled: false, onCode, nativeModule: module });
    expect(module.listenForOneSms).not.toHaveBeenCalled();

    await update({ enabled: true, onCode, nativeModule: module });
    expect(module.listenForOneSms).toHaveBeenCalledTimes(1);

    await update({ enabled: false, onCode, nativeModule: module });
    expect(module.stopListening).toHaveBeenCalledTimes(1);
  });

  it('re-arms for a new challenge (resend) and fills from the new SMS', async () => {
    const { module, deliver } = createFakeModule();
    const onCode = vi.fn();
    await mount({ enabled: true, armKey: 'challenge-1', onCode, nativeModule: module });

    await update({ enabled: true, armKey: 'challenge-2', onCode, nativeModule: module });
    expect(module.stopListening).toHaveBeenCalledTimes(1);
    expect(module.listenForOneSms).toHaveBeenCalledTimes(2);

    await deliver('Your TOHFA verification code is: 777111');
    expect(onCode).toHaveBeenCalledTimes(1);
    expect(onCode).toHaveBeenCalledWith('777111');
  });

  it('uses the latest onCode without re-arming on re-render', async () => {
    const { module, deliver } = createFakeModule();
    const first = vi.fn();
    const second = vi.fn();
    await mount({ enabled: true, onCode: first, nativeModule: module });
    await update({ enabled: true, onCode: second, nativeModule: module });

    expect(module.listenForOneSms).toHaveBeenCalledTimes(1);
    await deliver('123456 is your code');
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('123456');
  });

  it('degrades to a no-op when the native module is unavailable', async () => {
    const onCode = vi.fn();
    await expect(mount({ enabled: true, onCode, nativeModule: null })).resolves.toBeUndefined();
    expect(onCode).not.toHaveBeenCalled();
  });

  it('degrades to a no-op when listenForOneSms rejects', async () => {
    const onCode = vi.fn();
    const broken: SmsUserConsentModule = {
      listenForOneSms: vi.fn(async () => {
        throw new Error('Play services missing');
      }),
      stopListening: vi.fn(() => {
        throw new Error('gone');
      }),
    };
    await mount({ enabled: true, onCode, nativeModule: broken });
    await act(async () => {
      tree?.unmount();
    });
    tree = null;
    expect(onCode).not.toHaveBeenCalled();
  });
});

describe('getSmsUserConsent', () => {
  it('returns null off Android (the test runtime reports iOS), so screens keep manual entry', () => {
    expect(getSmsUserConsent()).toBeNull();
  });
});

describe('resolveSmsUserConsent', () => {
  afterEach(() => {
    resetSmsUserConsentWarningForTests();
  });

  it('returns the native module on Android without warning', () => {
    const { module } = createFakeModule();
    const warn = vi.fn();
    expect(resolveSmsUserConsent('android', () => module, warn)).toBe(module);
    expect(warn).not.toHaveBeenCalled();
  });

  it('regression: warns once in dev when Android has no module (stale native build), instead of failing silently', () => {
    const warn = vi.fn();
    expect(resolveSmsUserConsent('android', () => null, warn)).toBeNull();
    expect(resolveSmsUserConsent('android', () => {
      throw new Error('TurboModuleRegistry missing');
    }, warn)).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(SMS_CONSENT_MISSING_WARNING);
  });

  it('never looks the module up or warns off Android, and stays silent in release (warn=null)', () => {
    const load = vi.fn(() => null);
    const warn = vi.fn();
    expect(resolveSmsUserConsent('ios', load, warn)).toBeNull();
    expect(load).not.toHaveBeenCalled();
    expect(resolveSmsUserConsent('android', () => null, null)).toBeNull();
    expect(warn).not.toHaveBeenCalled();
  });
});
