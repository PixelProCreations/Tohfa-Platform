import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearLocalAuth, configureTokenStorage, getAccessToken, setAccessToken } from './client';

afterEach(() => {
  setAccessToken(null);
  configureTokenStorage(null);
});

describe('clearLocalAuth', () => {
  it('drops the in-memory access token and clears the configured token store', async () => {
    const clearTokens = vi.fn(async () => undefined);
    configureTokenStorage({ getTokens: async () => null, setTokens: async () => undefined, clearTokens });
    setAccessToken('access-1');

    await clearLocalAuth();

    expect(getAccessToken()).toBeNull();
    expect(clearTokens).toHaveBeenCalledTimes(1);
  });

  it('works with no store configured (nothing to clear but the token)', async () => {
    setAccessToken('access-1');
    await expect(clearLocalAuth()).resolves.toBeUndefined();
    expect(getAccessToken()).toBeNull();
  });
});
