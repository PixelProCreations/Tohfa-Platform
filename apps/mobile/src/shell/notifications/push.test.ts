import { describe, expect, it, vi } from 'vitest';
import { createPushRegistration, registerPushForSession, unregisterPushForSession } from './push';
import type { PushMessagingProvider } from './pushProvider';

function fakeProvider(over: Partial<PushMessagingProvider> = {}) {
  let refresh: ((t: string) => void) | null = null;
  const provider: PushMessagingProvider = {
    isConfigured: vi.fn(() => true),
    hasPermission: vi.fn(async () => true),
    requestPermission: vi.fn(async () => true),
    getToken: vi.fn(async () => 'tok-1'),
    deleteToken: vi.fn(async () => undefined),
    onTokenRefresh: vi.fn((cb: (t: string) => void) => {
      refresh = cb;
      return () => {
        refresh = null;
      };
    }),
    onForegroundMessage: vi.fn(() => () => undefined),
    ...over,
  };
  return { provider, fireRefresh: (t: string) => refresh?.(t) };
}

function deps(provider: PushMessagingProvider) {
  return {
    provider,
    register: vi.fn(async (input: { token: string }) => ({ id: 'd1', token: input.token })),
    revoke: vi.fn(async () => ({ success: true })),
    log: vi.fn(),
  };
}

describe('push registration', () => {
  it('Firebase not configured: no-op with a logged reason, no API calls', async () => {
    const { provider } = fakeProvider({ isConfigured: () => false });
    const d = deps(provider);
    const push = createPushRegistration(d);
    expect(await push.register({ app: 'customer-mobile' })).toMatchObject({ status: 'skipped', reason: 'firebase-not-configured' });
    expect(d.register).not.toHaveBeenCalled();
    expect(d.log).toHaveBeenCalledWith(expect.stringContaining('firebase-not-configured'));
    await push.unregister();
    expect(d.revoke).not.toHaveBeenCalled();
  });

  it('the real (default) instance no-ops when the mocked Firebase has no app', async () => {
    const info = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(await registerPushForSession({ app: 'customer-mobile' })).toMatchObject({ status: 'skipped', reason: 'firebase-not-configured' });
    await expect(unregisterPushForSession()).resolves.toBeUndefined();
    info.mockRestore();
  });

  it('permission denied is skipped unless asked to prompt', async () => {
    const { provider } = fakeProvider({ hasPermission: vi.fn(async () => false), requestPermission: vi.fn(async () => false) });
    const push = createPushRegistration(deps(provider));
    expect(await push.register({ app: 'customer-mobile' })).toMatchObject({ reason: 'permission-denied' });
    expect(provider.requestPermission).not.toHaveBeenCalled();
    await push.register({ app: 'customer-mobile', requestPermission: true });
    expect(provider.requestPermission).toHaveBeenCalledTimes(1);
  });

  it('registers once per token with POST device-tokens payload, revokes on unregister', async () => {
    const { provider } = fakeProvider();
    const d = deps(provider);
    const push = createPushRegistration(d);
    expect(await push.register({ app: 'customer-mobile', locale: 'ta' })).toEqual({ status: 'registered', token: 'tok-1' });
    await push.register({ app: 'customer-mobile', locale: 'ta' });
    expect(d.register).toHaveBeenCalledTimes(1);
    expect(d.register).toHaveBeenCalledWith({ token: 'tok-1', app: 'customer-mobile', locale: 'ta' });
    await push.unregister();
    expect(d.revoke).toHaveBeenCalledWith('tok-1');
    expect(push.registeredToken()).toBeNull();
  });

  it('token refresh re-registers the new token and revokes the old', async () => {
    const { provider, fireRefresh } = fakeProvider();
    const d = deps(provider);
    const push = createPushRegistration(d);
    await push.register({ app: 'customer-mobile' });
    fireRefresh('tok-2');
    await vi.waitFor(() => expect(d.revoke).toHaveBeenCalledWith('tok-1'));
    expect(d.register).toHaveBeenLastCalledWith({ token: 'tok-2', app: 'customer-mobile', locale: 'en' });
    expect(push.registeredToken()).toBe('tok-2');
  });

  it('server failures never throw (sign-in/sign-out must not break)', async () => {
    const { provider } = fakeProvider();
    const d = deps(provider);
    d.register.mockRejectedValueOnce(new Error('500'));
    const push = createPushRegistration(d);
    expect(await push.register({ app: 'customer-mobile' })).toMatchObject({ status: 'skipped', reason: 'register-failed' });
    await push.register({ app: 'customer-mobile' });
    d.revoke.mockRejectedValueOnce(new Error('offline'));
    await expect(push.unregister()).resolves.toBeUndefined();
  });
});
