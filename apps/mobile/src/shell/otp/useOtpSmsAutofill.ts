/**
 * Fills an OTP field from the incoming SMS on Android, for every role.
 *
 * Uses Google's SMS User Consent API through the app-local native module
 * (see native/NativeTohfaSmsUserConsent.ts). Chosen over the SMS Retriever API
 * because it needs no READ_SMS permission AND no 11-character app hash in
 * the message: the SMS is sent by Twilio Verify with its own template, and a
 * hash would have to be computed per signing key (debug, release, Play
 * App Signing) and threaded through the API. The cost is a one-tap system
 * "Allow TOHFA to read this message?" sheet, which is the API's design.
 *
 * Lifecycle: armed while `enabled` is true; re-armed when `armKey` changes
 * (pass the challenge id, so a resend listens for the new SMS); disarmed on
 * unmount, on disable, and after the first code is delivered. A consented
 * SMS that contains no code (some other sender) is ignored and the hook
 * keeps waiting. Timeout, denial, iOS, tests, or an APK built without the
 * module all degrade silently to manual entry — this hook never throws and
 * never blocks typing.
 */
import { useEffect, useRef } from 'react';
import { extractOtpCode } from './extractOtpCode';
import { OTP_CODE_LENGTH } from './otpInputProps';
import { getSmsUserConsent, type SmsUserConsentModule } from './smsUserConsent';

export interface UseOtpSmsAutofillOptions {
  /** Listen only while a code is actually expected (challenge sent, not locked/verified). */
  enabled: boolean;
  /** Called at most once per arming with the extracted code. */
  onCode: (code: string) => void;
  /** Change to re-arm (e.g. the challenge id after a resend). */
  armKey?: string | null | undefined;
  length?: number | undefined;
  /** Test seam; defaults to the real native module (null when unavailable). */
  nativeModule?: SmsUserConsentModule | null | undefined;
}

export function useOtpSmsAutofill({
  enabled,
  onCode,
  armKey,
  length = OTP_CODE_LENGTH,
  nativeModule,
}: UseOtpSmsAutofillOptions): void {
  // Latest callback without re-arming the native listener on every render
  // (screens pass inline closures over their current state).
  const onCodeRef = useRef(onCode);
  onCodeRef.current = onCode;

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const native = nativeModule === undefined ? getSmsUserConsent() : nativeModule;
    if (!native) {
      return undefined;
    }

    let active = true;
    const listen = async (): Promise<void> => {
      while (active) {
        let message: string;
        try {
          message = await native.listenForOneSms();
        } catch {
          return;
        }
        if (!active || !message) {
          // Unmounted/re-armed meanwhile, or timeout/denied/failed: manual entry.
          return;
        }
        const code = extractOtpCode(message, length);
        if (code !== null) {
          active = false;
          onCodeRef.current(code);
          return;
        }
      }
    };
    void listen();

    return () => {
      active = false;
      try {
        native.stopListening();
      } catch {
        // Nothing to clean up if the module is already gone.
      }
    };
  }, [enabled, armKey, length, nativeModule]);
}
