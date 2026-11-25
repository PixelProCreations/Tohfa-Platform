/**
 * Errors thrown by the native social sign-in wrappers (BR-39).
 *
 * They live in `shell/` rather than next to the Google/Facebook wrappers in
 * `roles/farmer/native/socialSignIn.ts` because `shell/errors/describeError`
 * has to recognise them, and shell code may never import a role's code (see
 * apps/mobile/CLAUDE.md, cross-role import boundary).
 *
 * These are device-side failures -- the request never reached our API -- so
 * they are NOT server `ErrorCode`s and do not appear in docs/openapi.yaml.
 * describeError turns them into client-only `SOCIAL_SIGN_IN_*` codes, the same
 * way it turns a NetworkError into `NETWORK_OFFLINE`.
 */

export type SocialProvider = 'GOOGLE' | 'FACEBOOK';

/**
 * Why a native sign-in failed, classified so the screen can say something
 * useful instead of the generic fallback:
 *  - DEVELOPER_ERROR: Google status 10. The app's package name + signing
 *    SHA-1 are not registered as an Android OAuth client in the same Google
 *    Cloud project as the webClientId, or the webClientId is wrong. Not fixable
 *    by the user; retrying cannot help.
 *  - NO_ID_TOKEN: sign-in "succeeded" but no ID token came back (webClientId
 *    missing / not a Web client). Same class of config fault as above.
 *  - PLAY_SERVICES_UNAVAILABLE: Google Play services missing / outdated.
 *  - NETWORK: the device could not reach Google.
 *  - IN_PROGRESS: a second tap while the sheet was already open.
 *  - FAILED: anything else (e.g. Google 12500 SIGN_IN_FAILED).
 */
export type SocialSignInFailure =
  | 'DEVELOPER_ERROR'
  | 'NO_ID_TOKEN'
  | 'PLAY_SERVICES_UNAVAILABLE'
  | 'NETWORK'
  | 'IN_PROGRESS'
  | 'FAILED';

/** The user closed the native sign-in sheet without completing it. Not an error. */
export class SocialSignInCancelledError extends Error {
  constructor(readonly provider: SocialProvider) {
    super(`${provider} sign-in was cancelled.`);
    this.name = 'SocialSignInCancelledError';
  }
}

/** The native SDK failed for a reason other than user cancellation. */
export class SocialSignInError extends Error {
  constructor(
    readonly provider: SocialProvider,
    readonly reason: SocialSignInFailure,
    /** The SDK's own error code (e.g. Google '10'), kept for dev logs; null when there was none. */
    readonly nativeCode: string | null,
    cause: unknown,
  ) {
    super(`${provider} sign-in failed (${reason}${nativeCode === null ? '' : `, code ${nativeCode}`}).`);
    this.name = 'SocialSignInError';
    Object.defineProperty(this, 'cause', { value: cause, enumerable: false });
  }
}
