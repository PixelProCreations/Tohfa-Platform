import type { Step1PersonalData } from '../../../storage/registrationDraft';

export interface Step1State {
  fullName: string;
  dob: string;
  gender: string;
  mobileNumber: string;
  aadhaarNumber: string;
  addressLine1: string;
  village: string;
  taluk: string;
  district: string;
  pincode: string;
  otp: string;
  showDatePicker: boolean;
  showGenderMenu: boolean;
  showDistrictMenu: boolean;
  // BR-32 mobile verification, inline on this step per product decision:
  // the farmer must prove ownership of the number before Step 1 can
  // complete, not just type something into the OTP box. `verifiedMobile`
  // tracks exactly which number the current `challengeId` was issued for --
  // editing the mobile field after a successful verify must re-arm this,
  // otherwise a farmer could verify one number then swap in a different one
  // before continuing.
  challengeId: string | null;
  resendAvailableAt: string | undefined;
  attemptsRemaining: number;
  verifiedMobile: string | null;
  sendingOtp: boolean;
  verifying: boolean;
  now: number;
  fieldErrors: Record<string, string>;
}

export type Step1Action =
  | { type: 'patch'; patch: Partial<Step1State> }
  | { type: 'clearError'; field: string }
  | { type: 'mergeErrors'; errors: Record<string, string> };

export function step1Reducer(state: Step1State, action: Step1Action): Step1State {
  switch (action.type) {
    case 'patch':
      return { ...state, ...action.patch };
    case 'clearError': {
      if (!state.fieldErrors[action.field]) return state;
      const next = { ...state.fieldErrors };
      delete next[action.field];
      return { ...state, fieldErrors: next };
    }
    case 'mergeErrors':
      return { ...state, fieldErrors: { ...state.fieldErrors, ...action.errors } };
  }
}

export function initStep1State(initialData: Step1PersonalData | undefined): Step1State {
  // Clean initial mobile number (strip +91 prefix if already saved)
  const rawMobile = initialData?.mobile ?? '';
  return {
    fullName: initialData?.fullName ?? '',
    dob: initialData?.dob ?? '',
    gender: initialData?.gender ?? '',
    mobileNumber: rawMobile.replace(/^\+91\s?/, ''),
    aadhaarNumber: initialData?.aadhaarNumber ?? initialData?.aadhaarLast4 ?? '',
    addressLine1: initialData?.addressLine1 ?? '',
    village: initialData?.village ?? '',
    taluk: initialData?.taluk ?? '',
    district: initialData?.district ?? 'The Nilgiris',
    pincode: initialData?.pincode ?? '643217',
    otp: '',
    showDatePicker: false,
    showGenderMenu: false,
    showDistrictMenu: false,
    challengeId: null,
    resendAvailableAt: undefined,
    attemptsRemaining: 3,
    verifiedMobile: null,
    sendingOtp: false,
    verifying: false,
    now: Date.now(),
    fieldErrors: {},
  };
}

export function formatMobile(raw: string): string {
  return raw.startsWith('+') ? raw.trim() : `+91${raw.replace(/\s+/g, '').trim()}`;
}
