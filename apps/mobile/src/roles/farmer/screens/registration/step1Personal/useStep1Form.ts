import { useEffect, useReducer, useRef } from 'react';
import type { ScrollViewInstance } from 'react-native';
import { validateStep } from '../validation';
import type { Step1PersonalData } from '../../../storage/registrationDraft';
import { requestOtp, verifyOtp, renderOtpState } from '../../../api/auth';
import { formatErrorMessage } from '../../../../../shell/api/client';
import { s1 } from './i18n';
import {
  formatMobile,
  initStep1State,
  step1Reducer,
  type Step1State,
} from './formState';
import { collectStep1Errors } from './validate';

export function useStep1Form(
  initialData: Step1PersonalData | undefined,
  onSave: (data: Step1PersonalData) => void,
) {
  const [state, dispatch] = useReducer(step1Reducer, initialData, initStep1State);
  const scrollRef = useRef<ScrollViewInstance>(null);

  const set = (patch: Partial<Step1State>) => dispatch({ type: 'patch', patch });
  const clearFieldError = (field: string) => dispatch({ type: 'clearError', field });
  const mergeErrors = (errors: Record<string, string>) =>
    dispatch({ type: 'mergeErrors', errors });
  /** Update values and clear one field's error, as every input's onChangeText does. */
  const setField = (patch: Partial<Step1State>, errorField: string) => {
    set(patch);
    clearFieldError(errorField);
  };

  const formattedMobile = formatMobile(state.mobileNumber);
  const isMobileVerified =
    state.verifiedMobile !== null && state.verifiedMobile === formattedMobile;

  // A challenge issued for a different number than what's currently typed
  // is stale -- clear it so the OTP field/Send-OTP button reflect reality
  // instead of pretending a challenge for the old number still applies.
  useEffect(() => {
    if (
      state.challengeId !== null &&
      state.verifiedMobile !== null &&
      state.verifiedMobile !== formattedMobile
    ) {
      dispatch({ type: 'patch', patch: { challengeId: null, otp: '' } });
    }
  }, [formattedMobile, state.challengeId, state.verifiedMobile]);

  useEffect(() => {
    const timer = setInterval(() => dispatch({ type: 'patch', patch: { now: Date.now() } }), 1000);
    return () => clearInterval(timer);
  }, []);

  const otpState = renderOtpState({
    resendAvailableAt: state.resendAvailableAt,
    attemptsRemaining: state.attemptsRemaining,
    now: state.now,
  });

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

  async function handleSendOtp() {
    const raw = state.mobileNumber.replace(/\s+/g, '').trim();
    if (raw.length < 10) {
      mergeErrors({ mobile: s1('error.mobileFirst') });
      return;
    }
    clearFieldError('mobile');
    set({ sendingOtp: true });
    try {
      const res = await requestOtp({ mobile: formattedMobile, purpose: 'REGISTRATION' });
      // `_mockCode` only ever exists when the backend's SMS_PROVIDER is
      // `mock` (see apps/api/.../auth.service.ts's sendOtp) -- a real
      // provider (msg91/twilio) never sends this field, so auto-filling it
      // is safe by construction and needs no separate dev/prod flag here.
      set({
        challengeId: res.challengeId,
        resendAvailableAt: res.resendAvailableAt,
        attemptsRemaining: res.attemptsRemaining,
        otp: res._mockCode ?? '',
      });
    } catch (err: unknown) {
      mergeErrors({ mobile: formatErrorMessage(err, s1('error.otpSendFailed')) });
    } finally {
      set({ sendingOtp: false });
    }
  }

  async function handleContinue() {
    const { errors, cleanAadhaar, cleanPin } = collectStep1Errors(state, isMobileVerified);

    if (Object.keys(errors).length > 0) {
      set({ fieldErrors: errors });
      scrollToTop();
      return;
    }

    if (!isMobileVerified) {
      set({ verifying: true });
      try {
        await verifyOtp({ challengeId: state.challengeId!, code: state.otp.trim() });
        set({ verifiedMobile: formattedMobile });
      } catch (err: unknown) {
        mergeErrors({ otp: formatErrorMessage(err, s1('error.otpWrong')) });
        scrollToTop();
        return;
      } finally {
        set({ verifying: false });
      }
    }

    const payload: Step1PersonalData = {
      fullName: state.fullName.trim(),
      mobile: formattedMobile,
      dob: state.dob.trim(),
      gender: state.gender,
      // BR-33b / Decision 8 (db/migrations/0003_farmers_and_farms.sql): the full
      // Aadhaar number must never reach the server -- not stored, not returned, not
      // logged. `aadhaarNumber`/`cleanAadhaar` stay local, purely so this screen can
      // validate the 12-digit format the farmer typed; only the last 4 digits are
      // ever sent or saved into the draft.
      aadhaarLast4: cleanAadhaar.slice(-4),
      addressLine1: state.addressLine1.trim(),
      village: state.village.trim(),
      taluk: state.taluk.trim(),
      district: state.district.trim(),
      pincode: cleanPin,
    };

    const validation = validateStep(1, payload);
    if (!validation.valid) {
      mergeErrors(validation.errors);
      scrollToTop();
      return;
    }

    set({ fieldErrors: {} });
    onSave(payload);
  }

  return {
    state,
    set,
    setField,
    clearFieldError,
    scrollRef,
    isMobileVerified,
    otpState,
    handleSendOtp,
    handleContinue,
  };
}

export type Step1Form = ReturnType<typeof useStep1Form>;
