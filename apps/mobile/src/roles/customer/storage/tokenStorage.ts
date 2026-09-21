/**
 * Persistent token storage for access and refresh tokens.
 *
 * Backed by AsyncStorage, so a signed-in customer survives an app restart instead of being
 * silently logged out every time the process is killed. AsyncStorage is NOT encrypted at
 * rest — it is plain, unencrypted on-device storage, readable by anyone with physical/root
 * access to the device (or via an ADB/backup extraction). This is an accepted interim
 * tradeoff to fix the "wiped on every restart" bug without pulling in a new dependency;
 * revisit with a Keychain/Keystore-backed store (e.g. react-native-keychain) if this app's
 * threat model later requires protecting tokens against a compromised or rooted device.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const STORAGE_KEY = '@tohfa_customer_auth_tokens';

// In-memory cache to avoid an AsyncStorage round trip on every read. `undefined` means
// "not yet loaded from storage this process"; `null` means "confirmed empty". setTokens
// and clearTokens keep this in sync so nothing can ever read a stale value.
let cachedTokens: AuthTokens | null | undefined = undefined;

export const tokenStorage = {
  async getTokens(): Promise<AuthTokens | null> {
    if (cachedTokens !== undefined) {
      return cachedTokens;
    }

    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      cachedTokens = raw ? (JSON.parse(raw) as AuthTokens) : null;
    } catch {
      // Corrupt JSON or a storage read failure — treat as signed out rather than throw.
      cachedTokens = null;
    }

    return cachedTokens;
  },

  async setTokens(tokens: AuthTokens): Promise<void> {
    cachedTokens = tokens;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  },

  async clearTokens(): Promise<void> {
    cachedTokens = null;
    await AsyncStorage.removeItem(STORAGE_KEY);
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

export async function saveTokens(accessToken: string, refreshToken: string): Promise<void> {
  await tokenStorage.setTokens({ accessToken, refreshToken });
}

export async function clearTokens(): Promise<void> {
  await tokenStorage.clearTokens();
}
