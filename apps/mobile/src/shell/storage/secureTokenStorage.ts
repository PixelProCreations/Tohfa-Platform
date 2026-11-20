/**
 * THE app-wide persistent token store (every role: farmer, customer, admin).
 *
 * One store, because there is one login and one shared API client: whatever
 * login writes here is exactly what `refreshAuthTokens()` in ../api/client.ts
 * reads back on a 401. Before this file existed the farmer App wired the
 * client to a Keychain store while customer OTP login saved into a separate
 * AsyncStorage store, so a customer's first expired access token (TTL 900 s)
 * found no refresh token and signed them out. `roles/farmer/storage/tokenStorage.ts`
 * and `roles/customer/storage/tokenStorage.ts` now re-export this module.
 *
 * Backed by react-native-keychain: the iOS Keychain / Android Keystore (AES-GCM, key held in
 * hardware-backed storage where available) -- unlike AsyncStorage, which is plain,
 * unencrypted on-device storage.
 *
 * Legacy migration: customer builds before this change kept tokens in AsyncStorage under
 * `@tohfa_customer_auth_tokens`. On the first read that finds the Keychain empty, those tokens
 * are moved here (and the plaintext copy deleted), so an already signed-in customer is not
 * logged out by the upgrade.
 *
 * `setGenericPassword`/`getGenericPassword`/`resetGenericPassword` store exactly one
 * username/password pair per `service` string. There is no first-class API for "store two
 * related secrets", so both tokens are serialized as one JSON blob into the `password` field,
 * under a fixed, meaningless `username` (the library requires *something* there; this store
 * only ever holds one farmer session per device, so it is not used as an identity) and a
 * dedicated `service` identifier, so this entry can never collide with anything else that ends
 * up using Keychain/Keystore on this device later.
 *
 * The set options below are chosen deliberately, not left as library defaults, for a silent,
 * no-prompt security posture:
 *  - No `accessControl` is set, so reads never trigger a Face ID / fingerprint / passcode
 *    prompt. Every read here is a background token lookup on the way to an API call, not a
 *    user-facing "unlock this" action -- gating it on biometrics would be the wrong bar.
 *  - iOS `accessible: AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` -- readable in the background once
 *    the device has been unlocked at least once since boot (so a token refresh can run even if
 *    the screen happens to be locked at that exact moment), but "THIS_DEVICE_ONLY" means the
 *    entry never migrates via an iCloud/iTunes backup restore onto a different device -- a
 *    copied token is not a copied session.
 *  - Android `storage: AES_GCM_NO_AUTH` -- AES-GCM with the key held in the Keystore, but
 *    explicitly the variant that does NOT require per-operation authentication. The library's
 *    "best available storage" default can otherwise pick `AES_GCM`, which demands a biometric
 *    prompt on every single read -- again, the wrong bar for a silent background call.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Dedicated per this store so it can never collide with another Keychain/Keystore consumer.
// The `.farmer.` in the name is historical (this store started as farmer's); it is kept so
// existing signed-in farmer sessions survive the move to the shared store. It holds every
// role's session.
const SERVICE = 'in.tohfa.mobile.farmer.auth';

/** Where pre-unification customer builds kept tokens (plain AsyncStorage). */
export const LEGACY_CUSTOMER_ASYNC_STORAGE_KEY = '@tohfa_customer_auth_tokens';

// react-native-keychain requires a non-empty "username" for setGenericPassword even though this
// store only ever holds one farmer session per device. It is a fixed, unused label, not an
// identity -- the real identity lives server-side, keyed off the access token.
const USERNAME = 'tohfa_farmer';

const SET_OPTIONS: Keychain.SetOptions = {
  service: SERVICE,
  accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
};

// In-memory cache to avoid a JS<->native bridge round trip on every read. This matters even
// more here than it did for AsyncStorage: a Keychain/Keystore call is a real native crypto
// operation (decrypt on read, encrypt on write), not just an in-process key-value lookup.
// `undefined` means "not yet loaded from storage this process"; `null` means "confirmed empty".
// setTokens and clearTokens keep this in sync so nothing can ever read a stale value.
let cachedTokens: AuthTokens | null | undefined = undefined;

export const tokenStorage = {
  async getTokens(): Promise<AuthTokens | null> {
    if (cachedTokens !== undefined) {
      return cachedTokens;
    }

    try {
      const credentials = await Keychain.getGenericPassword({ service: SERVICE });
      // getGenericPassword resolves to `false` -- it does not reject -- when nothing is stored
      // yet for this service (fresh install, or right after clearTokens()).
      cachedTokens = credentials ? (JSON.parse(credentials.password) as AuthTokens) : null;
    } catch {
      // Corrupt JSON or a Keychain/Keystore read failure -- treat as signed out rather than throw.
      cachedTokens = null;
    }

    if (cachedTokens === null) {
      const migrated = await migrateLegacyCustomerTokens();
      if (migrated !== null) {
        cachedTokens = migrated;
        await Keychain.setGenericPassword(USERNAME, JSON.stringify(migrated), { ...SET_OPTIONS }).catch(
          () => undefined,
        );
      }
    }

    return cachedTokens;
  },

  async setTokens(tokens: AuthTokens): Promise<void> {
    cachedTokens = tokens;
    // A fresh object literal, not the shared `SET_OPTIONS` constant: Hermes freezes
    // module-scope object literals, but react-native-keychain's Android implementation
    // mutates the options object it's given (adding a default `authenticationPrompt` if
    // missing) instead of copying it -- passing the frozen shared constant throws on the
    // second call ("attempted to set the key `authenticationPrompt` ... frozen").
    await Keychain.setGenericPassword(USERNAME, JSON.stringify(tokens), { ...SET_OPTIONS });
  },

  async clearTokens(): Promise<void> {
    cachedTokens = null;
    await Keychain.resetGenericPassword({ service: SERVICE });
  },
};

export async function getAccessToken(): Promise<string | null> {
  const tokens = await tokenStorage.getTokens();
  return tokens?.accessToken ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const tokens = await tokenStorage.getTokens();
  return tokens?.refreshToken ?? null;
}

/** Same object, explicit name for shell call sites. */
export const secureTokenStorage = tokenStorage;

/** Test-only: forget the in-memory cache so the next read hits the (mocked) Keychain. */
export function __resetTokenCacheForTests(): void {
  cachedTokens = undefined;
}

async function migrateLegacyCustomerTokens(): Promise<AuthTokens | null> {
  try {
    const raw = await AsyncStorage.getItem(LEGACY_CUSTOMER_ASYNC_STORAGE_KEY);
    if (!raw) return null;
    await AsyncStorage.removeItem(LEGACY_CUSTOMER_ASYNC_STORAGE_KEY);
    const parsed = JSON.parse(raw) as Partial<AuthTokens>;
    if (typeof parsed.accessToken === 'string' && typeof parsed.refreshToken === 'string') {
      return { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken };
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  await tokenStorage.setTokens({ accessToken, refreshToken });
}

export async function clearTokens(): Promise<void> {
  await tokenStorage.clearTokens();
}
