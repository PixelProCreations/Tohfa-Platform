/**
 * The one place JS touches the SMS User Consent native module.
 *
 * Returns null whenever SMS reading is not available — iOS (where the
 * keyboard's `oneTimeCode` suggestion does the job with no code of ours),
 * tests, or an Android binary built before the module existed. Callers treat
 * null as "manual entry only", never as an error.
 *
 * On Android a null module is never expected in a correctly built APK, and
 * it fails silently by design, so dev builds warn about it once. That is how
 * a stale native build shows up: the Java class can be in the APK while the
 * C++ TurboModule provider is missing from libappmodules.so (the app-level
 * codegen library is only linked when CMake is (re)configured after
 * `build/generated/source/codegen/jni` exists), and TurboModuleRegistry.get
 * then returns null with no other symptom than "autofill does nothing".
 */
import { Platform } from 'react-native';

export interface SmsUserConsentModule {
  listenForOneSms(): Promise<string>;
  stopListening(): void;
}

export const SMS_CONSENT_MISSING_WARNING =
  '[otp] TohfaSmsUserConsent native module not found: Android SMS autofill is off. ' +
  'The APK was likely built with a stale CMake configure; delete the app CMake staging dir ' +
  '(android/app/build.gradle buildStagingDirectory) and android/app/build, then rebuild.';

let warnedMissing = false;

/**
 * Pure resolution step, separated so the Android path is testable without a
 * native runtime. `load` performs the TurboModuleRegistry lookup.
 */
export function resolveSmsUserConsent(
  os: string,
  load: () => SmsUserConsentModule | null | undefined,
  warn: ((message: string) => void) | null,
): SmsUserConsentModule | null {
  if (os !== 'android') {
    return null;
  }
  let mod: SmsUserConsentModule | null = null;
  try {
    mod = load() ?? null;
  } catch {
    mod = null;
  }
  if (mod === null && warn !== null && !warnedMissing) {
    warnedMissing = true;
    warn(SMS_CONSENT_MISSING_WARNING);
  }
  return mod;
}

/** Test seam: lets each test observe the one-time warning again. */
export function resetSmsUserConsentWarningForTests(): void {
  warnedMissing = false;
}

export function getSmsUserConsent(): SmsUserConsentModule | null {
  return resolveSmsUserConsent(
    Platform.OS,
    () => {
      // Required lazily so the TurboModuleRegistry lookup only ever runs on
      // Android, and a missing registry (vitest's react-native stub) cannot
      // throw at import time of every screen that uses the hook.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require('./native/NativeTohfaSmsUserConsent') as { default?: SmsUserConsentModule | null };
      return mod.default ?? null;
    },
    typeof __DEV__ !== 'undefined' && __DEV__ ? (message) => console.warn(message) : null,
  );
}
