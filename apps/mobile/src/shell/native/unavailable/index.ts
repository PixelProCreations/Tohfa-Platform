/**
 * Stand-ins for native libraries the customer integration uses but that are
 * NOT installed in this checkout (and therefore not linked into the installed
 * APK): react-native-razorpay, @react-native-firebase/{app,messaging},
 * react-native-image-picker, @react-native-community/geolocation and
 * react-native-qrcode-svg.
 *
 * Why a stub instead of just adding the dependencies: a native dependency only
 * works after a full native rebuild + reinstall of the APK, and that is a
 * decision for the owner, not something to slip in with a merge. Until then
 * metro.config.js resolves each of these package names to the matching file in
 * this folder -- but ONLY while the real package is absent from node_modules,
 * so `pnpm add <pkg>` + rebuild switches the real library back on with no code
 * change here.
 *
 * Every stub fails "closed" in the same way the real code already handles an
 * unconfigured or refused native capability:
 *   - Firebase: `getApps()` is empty, so push.ts treats push as not configured
 *     (its documented dev-build state) and registration is a logged no-op.
 *   - Razorpay: `open()` rejects, which openRazorpayCheckout() reports as a
 *     'failed' outcome; no money moves (the server never sees a payment).
 *   - Image picker: returns an error result, which callers treat as "no photos".
 *   - Geolocation: reports POSITION_UNAVAILABLE, which deviceLocation.ts maps
 *     to 'unavailable'.
 *   - QR code: renders nothing; the pickup code text on the order screen is
 *     still shown.
 *
 * Type declarations for the real package names live in ./modules.d.ts.
 */
export const UNAVAILABLE_NATIVE_MODULE_MESSAGE = 'Native module not installed in this build';
