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
    await clearTokens();
    setAccessToken(null);
  }
}
