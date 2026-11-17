/**
 * Customer tokens live in THE shared, Keychain/Keystore-backed store
 * (src/shell/storage/secureTokenStorage.ts) -- the same store the API
 * client's refresh-on-401 reads. This used to be a separate AsyncStorage
 * store, which the client never read, so a customer was signed out at their
 * first access-token expiry. Tokens a pre-unification build left in
 * AsyncStorage are migrated by the shared store on first read.
 */
export {
  tokenStorage,
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
  type AuthTokens,
} from '../../../shell/storage/secureTokenStorage';
