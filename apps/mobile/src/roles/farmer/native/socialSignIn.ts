/**
 * Thin wrappers around the native Google / Facebook SDKs.
 *
 * Kept out of `api/auth.ts` on purpose: that file is a pure HTTP client
 * (request/response shapes only), while this file talks to native modules
 * and has real side effects (a native sign-in sheet, a stored FB access
 * token). `LoginScreen.tsx` composes the two: get a provider token here,
 * then hand it to `loginWithOAuth()`.
 *
 * `GOOGLE_WEB_CLIENT_ID` below is TOHFA's real Google Cloud Console "Web
 * application" OAuth client id. The Facebook App ID / client token in
 * `android/app/src/main/res/values/strings.xml` and
 * `ios/TohfaMobile/Info.plist` are still obviously-fake placeholder values —
 * Facebook sign-in can't complete a real sign-in until a human replaces
 * those with TOHFA's real Facebook Developer Console credentials. That is a
 * known follow-up, not a bug in this change.
 */
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { AccessToken, LoginManager } from 'react-native-fbsdk-next';
import {
  SocialSignInCancelledError,
  SocialSignInError,
  type SocialSignInFailure,
} from '../../../shell/auth/socialSignInErrors';

// The error classes live in shell/ so describeError can map them; re-exported
// here so LoginScreen keeps importing everything social from one place.
export { SocialSignInCancelledError, SocialSignInError };
export type { SocialProvider, SocialSignInFailure } from '../../../shell/auth/socialSignInErrors';

/**
 * Google Play services `CommonStatusCodes` that the RN library passes through
 * as the rejection's string `code` but does not export as constants. Values
 * are Google's (com.google.android.gms.common.api.CommonStatusCodes /
 * GoogleSignInStatusCodes), not ours.
 */
const GOOGLE_DEVELOPER_ERROR = '10';
const GOOGLE_NETWORK_ERROR = '7';

/** Android application id; must match the Android OAuth client in Google Cloud Console. */
const ANDROID_PACKAGE_NAME = 'in.tohfa.mobile';

function classifyGoogleError(code: string | undefined): SocialSignInFailure {
  if (code === GOOGLE_DEVELOPER_ERROR) return 'DEVELOPER_ERROR';
  if (code === GOOGLE_NETWORK_ERROR) return 'NETWORK';
  if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) return 'PLAY_SERVICES_UNAVAILABLE';
  if (code === statusCodes.IN_PROGRESS) return 'IN_PROGRESS';
  return 'FAILED';
}

/**
 * Dev-only: say exactly what failed and how to fix it. Without this the only
 * trace of a DEVELOPER_ERROR was the generic banner -- nothing in logcat and
 * nothing in the API log, because the request never left the device.
 */
function logGoogleFailureForDevelopers(err: SocialSignInError): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  const hint =
    err.reason === 'DEVELOPER_ERROR' || err.reason === 'NO_ID_TOKEN'
      ? ` Google rejected this app's OAuth configuration. In Google Cloud Console, in the SAME project as ` +
        `GOOGLE_WEB_CLIENT_ID (socialSignIn.ts), create an OAuth client of type "Android" with package name ` +
        `${ANDROID_PACKAGE_NAME} and the SHA-1 of the keystore that signed this build ` +
        `(debug: keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android). ` +
        `webClientId must be the project's "Web application" client and equal GOOGLE_OAUTH_CLIENT_ID on the API.`
      : '';
  console.warn(`[socialSignIn] ${err.message}${hint}`, (err as { cause?: unknown }).cause);
}

// The Google Cloud Console *Web* application's OAuth client ID (not the
// Android/iOS client ID) — required so the ID token GoogleSignin returns
// carries an audience the API's Google token verifier (BR-39) can check.
// Must stay identical to GOOGLE_OAUTH_CLIENT_ID in the backend's .env. See
// docs/rules.md BR-39 and apps/api/src/modules/auth/oauth.providers.ts.
const GOOGLE_WEB_CLIENT_ID = '774057695382-thjo0go5h2nud20deepf234f2rilpoqt.apps.googleusercontent.com';

let googleConfigured = false;

function ensureGoogleConfigured(): void {
  if (googleConfigured) return;
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
  googleConfigured = true;
}

/**
 * Runs the native Google sign-in sheet and returns the Google ID token to
 * send to `POST /auth/oauth/google` (BR-39). Throws
 * `SocialSignInCancelledError` if the farmer dismisses the sheet.
 */
export async function signInWithGoogle(): Promise<string> {
  ensureGoogleConfigured();
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Always show the account chooser: without this a cached account is picked
    // silently and the tap looks like nothing happened. Failure here is harmless.
    try {
      await GoogleSignin.signOut();
    } catch {
      // ignore: nothing signed in, or the native module refused
    }
    const result = await GoogleSignin.signIn();
    if (result.type !== 'success') {
      throw new SocialSignInCancelledError('GOOGLE');
    }
    if (!result.data.idToken) {
      throw new SocialSignInError('GOOGLE', 'NO_ID_TOKEN', null, new Error('GoogleSignin returned no idToken'));
    }
    return result.data.idToken;
  } catch (error) {
    if (error instanceof SocialSignInCancelledError) throw error;
    if (error instanceof SocialSignInError) {
      logGoogleFailureForDevelopers(error);
      throw error;
    }
    const code = (error as { code?: unknown } | null)?.code;
    const nativeCode = typeof code === 'string' || typeof code === 'number' ? String(code) : undefined;
    if (nativeCode === statusCodes.SIGN_IN_CANCELLED) {
      throw new SocialSignInCancelledError('GOOGLE');
    }
    const classified = new SocialSignInError('GOOGLE', classifyGoogleError(nativeCode), nativeCode ?? null, error);
    logGoogleFailureForDevelopers(classified);
    throw classified;
  }
}

/**
 * Runs the native Facebook login flow and returns the Facebook access token
 * to send to `POST /auth/oauth/facebook` (BR-39). Throws
 * `SocialSignInCancelledError` if the farmer dismisses the flow.
 */
export async function signInWithFacebook(): Promise<string> {
  try {
    const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
    if (result.isCancelled) {
      throw new SocialSignInCancelledError('FACEBOOK');
    }
    const token = await AccessToken.getCurrentAccessToken();
    if (!token) {
      throw new SocialSignInError('FACEBOOK', 'FAILED', null, new Error('No AccessToken after Facebook login'));
    }
    return token.accessToken;
  } catch (error) {
    if (error instanceof SocialSignInCancelledError || error instanceof SocialSignInError) {
      throw error;
    }
    throw new SocialSignInError('FACEBOOK', 'FAILED', null, error);
  }
}
