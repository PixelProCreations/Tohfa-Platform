/**
 * The customer role's auth boundary.
 *
 * Every HTTP round-trip below is delegated to `src/shell/auth/api.ts`, the one
 * place that knows the `/v1/auth/*` paths and wire shapes. What stays here is
 * what is genuinely customer-specific: the `+91` mobile normalization applied
 * before anything reaches the wire, this role's own response types (a
 * deliberate divergence from @tohfa/shared-types and from the farmer role's
 * equally local shapes), and the token persistence side effects against this
 * role's AsyncStorage-backed store.
 *
 * The `as unknown as` casts are that divergence made explicit; unifying the
 * three response shapes is a separate, reviewed change.
 */
import { setAccessToken } from '../../../shell/api/client';
import { needsCustomerOnboarding } from '../../../shell/auth/customerOnboarding';
import { forgetEntryRole, rememberEntryRole } from '../../../shell/auth/entryRole';
import { unregisterPushForSession } from '../../../shell/notifications/push';
import {
  fetchCurrentUser as apiFetchCurrentUser,
  forgotPassword as apiForgotPassword,
  login as apiLogin,
  logout as apiLogout,
  registerCustomer as apiRegisterCustomer,
  resetPassword as apiResetPassword,
  sendOtp as apiSendOtp,
  verifyOtp as apiVerifyOtp,
} from '../../../shell/auth/api';
import { saveTokens, clearTokens } from '../storage/tokenStorage';

export interface CustomerUser {
  id: string;
  mobile: string;
  fullName: string;
  status: string;
  roles: Array<{ code: string }>;
  preferredLocale?: string;
  email?: string | null;
}

export interface RegisterCustomerInput {
  mobile: string;
  fullName: string;
  password: string;
  email?: string;
  preferredLocale?: 'en' | 'ta';
  preferredWarehouseId?: string;
}

export interface RegistrationAcceptedResponse {
  userId: string;
  status: 'PENDING_OTP';
  otpExpiresAt: string;
  resendAvailableAt: string;
  challengeId?: string;
  attemptsRemaining?: number;
  _mockCode?: string;
}

export interface SendOtpInput {
  mobile: string;
  purpose: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET';
}

export interface OtpChallengeResponse {
  challengeId: string;
  expiresAt: string;
  resendAvailableAt: string;
  attemptsRemaining: number;
  _mockCode?: string;
}

export interface VerifyOtpInput {
  challengeId: string;
  code: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: CustomerUser;
}

export interface LoginInput {
  mobile: string;
  password: string;
}

export interface ForgotPasswordInput {
  mobile: string;
}

export interface ResetPasswordInput {
  challengeId: string;
  code: string;
  newPassword: string;
}

export interface RenderOtpStateInput {
  resendAvailableAt?: string | null | undefined;
  attemptsRemaining?: number | null | undefined;
  now?: number | undefined;
}

export interface RenderOtpStateResult {
  canResend: boolean;
  secondsUntilResend: number;
  attemptsRemaining: number;
  isLocked: boolean;
}

/**
 * Enforce BR-32: 6-digit OTP, 60s cooldown timer, and 3-attempt lockout.
 * All values are computed strictly from server-provided `resendAvailableAt`
 * and `attemptsRemaining`, never from a client-local counter.
 */
export function renderOtpState(input: RenderOtpStateInput): RenderOtpStateResult {
  const now = input.now ?? Date.now();
  const attemptsRemaining = input.attemptsRemaining ?? 3;
  const isLocked = attemptsRemaining <= 0;

  let secondsUntilResend = 0;
  if (input.resendAvailableAt) {
    const targetMs = new Date(input.resendAvailableAt).getTime();
    const diffMs = targetMs - now;
    if (diffMs > 0) {
      secondsUntilResend = Math.ceil(diffMs / 1000);
    }
  }

  const canResend = isLocked || secondsUntilResend === 0;

  return {
    canResend,
    secondsUntilResend,
    attemptsRemaining,
    isLocked,
  };
}

export async function registerCustomer(input: RegisterCustomerInput): Promise<RegistrationAcceptedResponse> {
  const cleanMobile = input.mobile.startsWith('+') ? input.mobile.trim() : `+91${input.mobile.trim()}`;
  return (await apiRegisterCustomer({
    ...input,
    mobile: cleanMobile,
    preferredLocale: input.preferredLocale ?? 'en',
  })) as unknown as RegistrationAcceptedResponse;
}

export async function sendOtp(input: SendOtpInput): Promise<OtpChallengeResponse> {
  const cleanMobile = input.mobile.startsWith('+') ? input.mobile.trim() : `+91${input.mobile.trim()}`;
  return (await apiSendOtp({
    mobile: cleanMobile,
    purpose: input.purpose,
  })) as unknown as OtpChallengeResponse;
}

export async function verifyOtp(input: VerifyOtpInput): Promise<AuthResponse> {
  const res = (await apiVerifyOtp({
    challengeId: input.challengeId,
    code: input.code.trim(),
  })) as unknown as AuthResponse;

  if (res.accessToken && res.refreshToken) {
    await saveTokens(res.accessToken, res.refreshToken);
    setAccessToken(res.accessToken);
  }

  return res;
}

export async function loginWithPassword(input: LoginInput): Promise<AuthResponse> {
  const cleanMobile = input.mobile.startsWith('+') ? input.mobile.trim() : `+91${input.mobile.trim()}`;
  const res = (await apiLogin({
    mobile: cleanMobile,
    password: input.password,
  })) as unknown as AuthResponse;

  if (res.accessToken && res.refreshToken) {
    await saveTokens(res.accessToken, res.refreshToken);
    setAccessToken(res.accessToken);
  }

  return res;
}

export async function forgotPassword(input: ForgotPasswordInput): Promise<OtpChallengeResponse> {
  const cleanMobile = input.mobile.startsWith('+') ? input.mobile.trim() : `+91${input.mobile.trim()}`;
  return (await apiForgotPassword({ mobile: cleanMobile })) as unknown as OtpChallengeResponse;
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  await apiResetPassword({
    challengeId: input.challengeId,
    code: input.code.trim(),
    newPassword: input.newPassword,
  });
}

export async function fetchMe(): Promise<CustomerUser> {
  return (await apiFetchCurrentUser()) as unknown as CustomerUser;
}

export async function logout(): Promise<void> {
  try {
    await apiLogout();
  } catch {
    // Ignore network error on logout
  } finally {
    await forgetEntryRole();
    await clearTokens();
    setAccessToken(null);
  }
}

/* ------------------------------------------------------------------ *
 * Passwordless customer sign-in (BR-153) -- the ONLY customer login path.
 * The password/`/auth/otp/*` functions above are the pre-BR-153 flow, kept
 * for their existing tests; new screens must not use them.
 * ------------------------------------------------------------------ */

export type { CustomerOtpChallenge, CustomerOtpVerifyResponse };

/** BR-32/BR-153: the customer OTP is exactly 6 digits. */
export const CUSTOMER_OTP_LENGTH = 6;

/** 10-digit Indian mobile, first digit 6-9 (API pattern `^\+91[6-9][0-9]{9}$`). */
export function isValidCustomerMobile(input: string): boolean {
  return /^[6-9][0-9]{9}$/.test(stripIndianPrefix(input));
}

/** `98765 43210` / `+919876543210` / `09876543210` -> `+919876543210`. */
export function toE164IndianMobile(input: string): string {
  return `+91${stripIndianPrefix(input)}`;
}

function stripIndianPrefix(input: string): string {
  const digits = input.replace(/[^0-9]/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

export function isValidCustomerOtp(code: string): boolean {
  return new RegExp(`^[0-9]{${CUSTOMER_OTP_LENGTH}}$`).test(code.trim());
}

/** Step 1: `POST /auth/customer/otp/send`. Feed the challenge to `renderOtpState()` for the timer. */
export function sendCustomerLoginOtp(mobile: string): Promise<CustomerOtpChallenge> {
  return apiSendCustomerOtp({ mobile: toE164IndianMobile(mobile) });
}

/** Where a signed-in customer goes next; names match roles/farmer/App.tsx ScreenName. */
export type CustomerPostLoginRoute = 'CustomerProfileName' | 'CustomerMain';

export function resolveCustomerRouteAfterLogin(res: {
  isNewUser?: boolean | undefined;
  user?: { profileComplete?: boolean | undefined } | undefined;
}): CustomerPostLoginRoute {
  return needsCustomerOnboarding({ isNewUser: res.isNewUser, profileComplete: res.user?.profileComplete })
    ? 'CustomerProfileName'
    : 'CustomerMain';
}

export interface VerifyCustomerLoginInput {
  mobile: string;
  challengeId: string;
  otp: string;
  preferredLocale?: 'en' | 'ta' | undefined;
}

export interface CustomerLoginResult {
  response: CustomerOtpVerifyResponse;
  route: CustomerPostLoginRoute;
}

/**
 * Step 2: `POST /auth/customer/otp/verify`. On success the tokens are written
 * to THE shared secure store (the same one the client's refresh-on-401 reads)
 * and the in-memory access token is set, so every following call is
 * authenticated. Errors are thrown as `ApiError` (OTP_INVALID / OTP_EXPIRED /
 * OTP_LOCKED / FORBIDDEN for a non-customer number / RATE_LIMITED) -- show
 * them with `mapProblem()` from ./problem.
 */
export async function verifyCustomerLoginOtp(input: VerifyCustomerLoginInput): Promise<CustomerLoginResult> {
  const response = await apiVerifyCustomerOtp({
    mobile: toE164IndianMobile(input.mobile),
    challengeId: input.challengeId,
    otp: input.otp.trim(),
    ...(input.preferredLocale === undefined ? {} : { preferredLocale: input.preferredLocale }),
  });
  await saveTokens(response.accessToken, response.refreshToken);
  setAccessToken(response.accessToken);
  // BR-135: this is the customer entry. A FARMER + CUSTOMER account signed in
  // here (the server issues it a CUSTOMER-only session) must reopen the
  // customer side on a cold start, not the farmer side /auth/me also lists.
  await rememberEntryRole('CUSTOMER');
  return { response, route: resolveCustomerRouteAfterLogin(response) };
}
