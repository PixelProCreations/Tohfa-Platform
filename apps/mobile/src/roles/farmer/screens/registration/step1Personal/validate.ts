import { s1 } from './i18n';
import type { Step1State } from './formState';
import { t } from '../../../../../i18n/farmer';
import {
  dateNotInFuture,
  errorMessage,
  localIndianMobile,
  maxLength,
  name,
  runRules,
} from '../../../utils/validation';

/** docs/openapi.yaml FarmerApplicationStepPayload.personal: fullName <= 120, address <= 300. */
export const FULL_NAME_MAX = 120;
export const ADDRESS_MAX = 300;
/**
 * Spec gap: village / taluk have no maxLength in docs/openapi.yaml (plain `string`).
 * 100 is a conservative generic bound, not a business rule.
 */
export const PLACE_NAME_MAX = 100;

const nameRule = name({ max: FULL_NAME_MAX });
const addressMax = maxLength(ADDRESS_MAX);
const placeMax = maxLength(PLACE_NAME_MAX);
const dobRule = dateNotInFuture();

/** Local (pre-submit) field checks. Returns an empty object when everything passes. */
export function collectStep1Errors(
  state: Step1State,
  isMobileVerified: boolean,
): { errors: Record<string, string>; cleanAadhaar: string; cleanPin: string } {
  const nextErrors: Record<string, string> = {};

  if (state.fullName.trim().length < 2) {
    nextErrors.fullName = s1('error.fullNameMin');
  } else {
    // Over-long / digits-or-symbols names: the shared name rule (the min was handled above).
    const nameError = runRules(state.fullName, [nameRule]);
    if (nameError !== null) nextErrors.fullName = errorMessage(nameError, t) ?? s1('error.fullNameMin');
  }

  if (!state.dob.trim()) {
    nextErrors.dob = s1('error.dobRequired');
  } else {
    // The picker formats "DD / MM / YYYY"; spaces are cosmetic. A birth date cannot be in the future.
    const dobError = dobRule(state.dob.replace(/\s+/g, ''));
    if (dobError !== null) nextErrors.dob = errorMessage(dobError, t) ?? s1('error.dobRequired');
  }

  if (!state.gender) {
    nextErrors.gender = s1('error.genderRequired');
  }

  const rawMob = state.mobileNumber.replace(/\s+/g, '').trim();
  // Ten digits AND a leading 6-9, as docs/openapi.yaml `Mobile` requires.
  if (!/^[0-9]{10}$/.test(rawMob) || localIndianMobile(rawMob) === null) {
    nextErrors.mobile = s1('error.mobileInvalid');
  } else if (!isMobileVerified) {
    if (!state.challengeId) {
      nextErrors.mobile = s1('error.mobileUnverified');
    } else if (!state.otp.trim() || state.otp.trim().length < 6) {
      nextErrors.otp = s1('error.otpRequired');
    }
  }

  const cleanAadhaar = state.aadhaarNumber.replace(/\s+/g, '').trim();
  if (!cleanAadhaar) {
    nextErrors.aadhaarNumber = s1('error.aadhaarRequired');
  } else if (!/^\d{12}$/.test(cleanAadhaar)) {
    if (cleanAadhaar.length !== 4 || !/^\d{4}$/.test(cleanAadhaar)) {
      nextErrors.aadhaarNumber = s1('error.aadhaarInvalid');
    }
  }

  if (!state.addressLine1.trim()) {
    nextErrors.addressLine1 = s1('error.addressRequired');
  } else {
    const addressError = addressMax(state.addressLine1);
    if (addressError !== null) nextErrors.addressLine1 = errorMessage(addressError, t) ?? s1('error.addressRequired');
  }
  if (!state.village.trim()) {
    nextErrors.village = s1('error.villageRequired');
  } else {
    const villageError = placeMax(state.village);
    if (villageError !== null) nextErrors.village = errorMessage(villageError, t) ?? s1('error.villageRequired');
  }
  if (!state.taluk.trim()) {
    nextErrors.taluk = s1('error.talukRequired');
  } else {
    const talukError = placeMax(state.taluk);
    if (talukError !== null) nextErrors.taluk = errorMessage(talukError, t) ?? s1('error.talukRequired');
  }
  if (!state.district.trim()) {
    nextErrors.district = s1('error.districtRequired');
  }
  const cleanPin = state.pincode.replace(/\s+/g, '').trim();
  // Real Indian PIN codes never start with 0 -- matches farmers.pincode's CHECK
  // constraint (db/migrations/0003_farmers_and_farms.sql) and validation.ts's
  // step-1 check, so an invalid value is caught here rather than accepted by the
  // app and silently dropped to NULL at approval.
  if (!cleanPin || !/^[1-9][0-9]{5}$/.test(cleanPin)) {
    nextErrors.pincode = s1('error.pincodeInvalid');
  }

  return { errors: nextErrors, cleanAadhaar, cleanPin };
}
