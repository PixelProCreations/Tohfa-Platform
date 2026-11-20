# apps/mobile — native setup for push, payments, camera and location

The customer integration added four native libraries to `apps/mobile` (RN 0.88, New Architecture
only, Hermes). All four are TurboModules and autolink, so after pulling you need a **native rebuild**
(`pnpm --filter @tohfa/mobile android` / `cd apps/mobile/ios && pod install` then `ios`). A Metro
reload alone is not enough.

| Library | Version | Used for | Code entry point |
|---|---|---|---|
| `react-native-razorpay` | ^3.0.0 | Wallet top-up checkout | `src/shell/payments/razorpay.ts`, `src/roles/customer/api/topup.ts` |
| `@react-native-firebase/app` + `/messaging` | ^27.1.1 | FCM push token | `src/shell/notifications/{pushProvider,push}.ts` |
| `react-native-image-picker` | ^8.3.0 | Support/review photos | (screens) + `src/shell/uploads/signedUpload.ts` |
| `@react-native-community/geolocation` | ^3.4.0 | Delivery address "use my location" | (screens) |

`react-native-geolocation-service` was not chosen: it has no New Architecture (TurboModule) support.

## 1. Firebase (push) — files the owner must supply

The app runs without Firebase. Until the files below exist, `registerPushForSession()` resolves to
`{ status: 'skipped', reason: 'firebase-not-configured' }` and logs `[push] registration skipped:
firebase-not-configured ...` (console.warn). Nothing else changes. Do not commit placeholder or
invented config files.

### Android
1. In the Firebase console create (or reuse) a project, add an Android app with package name
   **`in.tohfa.mobile`**, and download `google-services.json`.
2. Put it at **`apps/mobile/android/app/google-services.json`**.
3. Enable the Google Services Gradle plugin (left out on purpose, because it fails the build when
   the JSON is missing):
   - `apps/mobile/android/build.gradle` → `buildscript { dependencies { classpath("com.google.gms:google-services:4.4.2") } }`
   - `apps/mobile/android/app/build.gradle` → add `apply plugin: "com.google.gms.google-services"` at the bottom.
4. Rebuild. `POST_NOTIFICATIONS` is already in `AndroidManifest.xml`. The app requests it at runtime
   on Android 13+ only when a screen calls `registerPushForSession({ ..., requestPermission: true })`.

### iOS
1. Add an iOS app with bundle id **`in.tohfa.mobile`**, download `GoogleService-Info.plist`, and add
   it to the `TohfaMobile` target in Xcode (`apps/mobile/ios/TohfaMobile/GoogleService-Info.plist`).
2. In `AppDelegate`, call `FirebaseApp.configure()` (import `FirebaseCore`) before React Native starts.
3. RNFirebase needs static frameworks: run `USE_FRAMEWORKS=static pod install` (the Podfile already
   honours `USE_FRAMEWORKS`) and add `$RNFirebaseAsStaticFramework = true` at the top of the Podfile.
4. Xcode → Signing & Capabilities: add **Push Notifications** and **Background Modes → Remote
   notifications** (`UIBackgroundModes: remote-notification` is already in `Info.plist`).
5. Upload the APNs auth key (.p8) to Firebase → Project settings → Cloud Messaging.

### Behaviour once configured
- `CustomerMainApp` registers the FCM token on mount (`POST /v1/notifications/device-tokens`,
  `app: 'customer-mobile'`), without prompting. Registration is once per token; token refreshes
  re-register and revoke the old token.
- Sign-out (`logout()` in `roles/farmer/api/auth.ts` and `roles/customer/api/auth.ts`) calls
  `unregisterPushForSession()` → `DELETE /v1/notifications/device-tokens/{token}` **before** tokens
  are cleared.
- Foreground messages invalidate the `['notifications']` query. Background/quit-state messages with a
  `notification` payload are shown by the OS. A local-notification library (e.g. Notifee) for
  showing foreground banners has **not** been added; add it only if product wants heads-up banners
  while the app is open.

## 2. Razorpay — key delivery

- **No key is stored in the app or `.env`.** The publishable key comes from the API:
  `POST /v1/wallets/me/topups` (with `Idempotency-Key`) → `TopupIntent { topupId, gatewayOrderId,
  amount, currency, status, razorpayKeyId }`. The server reads it from its own config (the
  `RAZORPAY_KEY_ID` / secret are backend env, never `@env`-imported).
- If the API returns no `razorpayKeyId`, `startWalletTopup()` returns `{ status: 'unavailable' }`.
- The wallet is credited only by the server's signed `payment.captured` webhook
  (`/webhooks/razorpay`); the app polls `GET /v1/wallets/me/topups/{topupId}` (2 s interval, 60 s
  window) and reports `success | failed | pending | cancelled`.
- Native: autolinked; no manifest changes. For release builds with R8, add the Razorpay ProGuard
  rules from the SDK README (`-keep class com.razorpay.** {*;}` and `-keepattributes *Annotation*`)
  if minification is enabled.

## 3. Camera / photos / location permissions

- Android: `CAMERA`, `READ_MEDIA_IMAGES`, `READ_EXTERNAL_STORAGE` (≤ API 32), `ACCESS_FINE/COARSE_LOCATION`
  and `POST_NOTIFICATIONS` were already declared (shared, cross-role). No changes needed. The image
  picker's library mode uses the Android Photo Picker (no permission on 13+).
- iOS `Info.plist`: location, camera and photo-library usage strings were reworded to also cover the
  customer uses (delivery address, support photos). Request permissions at the point of use.

## 4. API base URL

Set `MOBILE_API_BASE_URL` in the repo-root `.env` (origin only, no `/v1`), e.g.
`MOBILE_API_BASE_URL=https://api.staging.tohfa.in`. It is applied at boot by
`src/shell/config/env.ts` (`configureApiFromEnv()`, called from `roles/farmer/App.tsx`). Unset in a
dev build keeps `http://localhost:3000`; unset in a release build logs a warning. Restart Metro with
`--reset-cache` after changing `.env` (react-native-dotenv inlines at bundle time).

## 5. Tests

All four libraries are mocked globally for vitest in `apps/mobile/src/tests/setup.ts`
(`src/tests/mocks/nativeLibMocks.ts`); the Firebase mock reports "not configured" by default.
