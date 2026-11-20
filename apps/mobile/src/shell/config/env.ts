/**
 * Build-time environment for the shared API client.
 *
 * `MOBILE_API_BASE_URL` comes from the repo-root `.env` via react-native-dotenv
 * (see babel.config.js -- only client-safe names may be imported from '@env').
 * The name is prefixed `MOBILE_` so it can never collide with a backend var.
 *
 *   MOBILE_API_BASE_URL=https://api.staging.tohfa.in   # no trailing /v1
 *
 * Unset in a dev build: the client keeps its `http://localhost:3000` default
 * (adb reverse / Android-emulator 10.0.2.2 fallback, see ../api/client.ts).
 * Unset in a release build is a misconfiguration: we warn loudly instead of
 * silently shipping a binary that talks to localhost.
 */
import { MOBILE_API_BASE_URL } from '@env';
import { setApiBaseUrl } from '../api/client';

/** Normalise an env value into a base URL: trims, drops trailing `/` and `/v1`. Null if unusable. */
export function normalizeApiBaseUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;
  let url = raw.trim();
  if (url.length === 0) return null;
  if (!/^https?:\/\//.test(url)) return null;
  url = url.replace(/\/+$/, '');
  url = url.replace(/\/v1$/, '');
  return url;
}

declare const __DEV__: boolean | undefined;

/**
 * Applies `MOBILE_API_BASE_URL` to the shared client. Call once, at module
 * load of the app root, before any request. Returns the URL applied, or null
 * when the default was kept.
 */
export function configureApiFromEnv(
  raw: string | null | undefined = MOBILE_API_BASE_URL,
  isDev: boolean = typeof __DEV__ === 'undefined' ? true : __DEV__,
): string | null {
  const url = normalizeApiBaseUrl(raw);
  if (url !== null) {
    setApiBaseUrl(url);
    return url;
  }
  if (!isDev) {
    console.warn(
      '[tohfa] MOBILE_API_BASE_URL is not set for this release build; API calls will go to localhost. ' +
        'See docs/mobile-native-setup.md.',
    );
  }
  return null;
}
