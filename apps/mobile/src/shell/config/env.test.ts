import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_BASE_URL, setApiBaseUrl, resolveUrl } from '../api/client';
import { configureApiFromEnv, normalizeApiBaseUrl } from './env';

const original = API_BASE_URL;
afterEach(() => setApiBaseUrl(original));

describe('MOBILE_API_BASE_URL', () => {
  it('normalises trailing slash and /v1, rejects junk', () => {
    expect(normalizeApiBaseUrl(' https://api.tohfa.in/v1/ ')).toBe('https://api.tohfa.in');
    expect(normalizeApiBaseUrl('ftp://x')).toBeNull();
    expect(normalizeApiBaseUrl(undefined)).toBeNull();
  });

  it('applies the env value to the client; keeps the default (with a release warning) when unset', () => {
    expect(configureApiFromEnv('https://stage.tohfa.in', true)).toBe('https://stage.tohfa.in');
    expect(resolveUrl('/wallets/me')).toBe('https://stage.tohfa.in/v1/wallets/me');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(configureApiFromEnv(undefined, false)).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
