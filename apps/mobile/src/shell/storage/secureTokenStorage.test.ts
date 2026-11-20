import { beforeEach, describe, expect, it } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { LEGACY_CUSTOMER_ASYNC_STORAGE_KEY, __resetTokenCacheForTests, tokenStorage } from './secureTokenStorage';

describe('shared secure token store', () => {
  beforeEach(async () => {
    await tokenStorage.clearTokens();
    __resetTokenCacheForTests();
  });

  it('round-trips through the Keychain', async () => {
    await tokenStorage.setTokens({ accessToken: 'a', refreshToken: 'r' });
    __resetTokenCacheForTests();
    expect(await tokenStorage.getTokens()).toEqual({ accessToken: 'a', refreshToken: 'r' });
  });

  it('migrates pre-unification customer tokens out of plaintext AsyncStorage once', async () => {
    await AsyncStorage.setItem(LEGACY_CUSTOMER_ASYNC_STORAGE_KEY, JSON.stringify({ accessToken: 'la', refreshToken: 'lr' }));
    expect(await tokenStorage.getTokens()).toEqual({ accessToken: 'la', refreshToken: 'lr' });
    expect(await AsyncStorage.getItem(LEGACY_CUSTOMER_ASYNC_STORAGE_KEY)).toBeNull();
    const stored = await Keychain.getGenericPassword({ service: 'in.tohfa.mobile.farmer.auth' });
    expect(stored && JSON.parse(stored.password)).toEqual({ accessToken: 'la', refreshToken: 'lr' });
  });
});
