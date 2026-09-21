/**
 * Typed wrappers over the shared client for the `/v1/auth/*` endpoints.
 *
 * Wiring only — no business logic, no state, no error translation. Deciding
 * what a response *means* (role selection, adopting a session, what to do with
 * an OTP that verified against no account) belongs in ./session.ts; this file
 * exists so that exactly one place knows the paths and the response types.
 *
 * Paths are relative: ../api/client.ts prefixes `/v1`.
 */
import type {
  CurrentUserProfile,
  LoginRequest,
  LoginResponse,
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '@tohfa/shared-types';
import { request } from '../api/client';

/* ------------------------------------------------------------------ *
 * Local request/response types
 *
 * The four endpoints below (`/auth/oauth/{provider}`, `/auth/forgot-password`,
 * `/auth/reset-password`, `/auth/register/customer`) have no counterpart in
 * @tohfa/shared-types yet. They are declared here rather than promoted to that
 * package on purpose: promoting them is a separate, reviewed change that would
 * also have to reconcile the two roles' divergent local response shapes
 * (farmer's `TokenResponse`/`UserMe` vs customer's `AuthResponse`/
 * `CustomerUser`). Until that happens, this file is the single place that
 * knows the wire shape, and each role adapts at its own boundary.
 *
 * Optionals are written `?: T | undefined` to match the house style of
 * @tohfa/shared-types, whose consumers compile under
 * `exactOptionalPropertyTypes`.
 * ------------------------------------------------------------------ */

/**
 * The provider segment of `POST /auth/oauth/{provider}`, lowercase on the wire.
 * Mirrors `oauthProviders` in apps/api/src/modules/auth/auth.schema.ts and
 * `OAuthProvider` in docs/openapi.yaml.
 */
export type OAuthProvider = 'google' | 'facebook';

/** `POST /auth/oauth/{provider}` request body (`oauthLoginBody`). */
export interface OAuthLoginRequest {
  /** A Google ID token or a Facebook access token, depending on the provider. */
  token: string;
  deviceId?: string | undefined;
  platform?: 'ios' | 'android' | 'web' | undefined;
  roleCode?: string | undefined;
}

/**
 * Whatever of these the provider actually returned (BR-39). None are
 * guaranteed — mirrors docs/openapi.yaml's `OAuthProfile` schema.
 */
export interface OAuthProfile {
  fullName?: string | null | undefined;
  email?: string | null | undefined;
  photoUrl?: string | null | undefined;
}

/**
 * The verified provider identity has no linked TOHFA account yet (BR-39). No
 * account is created and no tokens are issued — the caller must run the normal
 * mobile+OTP challenge and pass `linkToken` back to complete the link.
 */
export interface OAuthNotLinkedResponse {
  status: 'NOT_LINKED';
  profile: OAuthProfile;
  linkToken: string;
}

/**
 * `POST /auth/oauth/{provider}` has THREE 200 shapes, not the two
 * docs/openapi.yaml's `oneOf` lists. Besides `LoginSuccess` and
 * `OAuthNotLinkedResponse`, apps/api/src/modules/auth/auth.service.ts also
 * returns the bare `{ requiresRoleSelection: true, availableRoles }` object
 * when an OAuth-linked account holds more than one role — the same shape
 * password login produces. `LoginResponse` already covers the first and third,
 * so this union only has to add the second.
 */
export type OAuthLoginResponse = LoginResponse | OAuthNotLinkedResponse;

/** `POST /auth/forgot-password` request body (`forgotPasswordBody`). */
export interface ForgotPasswordRequest {
  mobile: string;
}

/**
 * `POST /auth/forgot-password` answers 202 with an OTP challenge. The service
 * delegates straight to `sendOtp`, so the payload is byte-for-byte
 * `SendOtpResponse` — aliased rather than re-declared so the two cannot drift.
 */
export type ForgotPasswordResponse = SendOtpResponse;

/** `POST /auth/reset-password` request body (`resetPasswordBody`). */
export interface ResetPasswordRequest {
  challengeId: string;
  code: string;
  newPassword: string;
}

/** `POST /auth/register/customer` request body (`registerCustomerBody`). */
export interface RegisterCustomerRequest {
  mobile: string;
  fullName: string;
  password: string;
  email?: string | undefined;
  /** Defaulted to `'en'` by the server's Zod schema when omitted. */
  preferredLocale?: 'en' | 'ta' | undefined;
  preferredWarehouseId?: string | undefined;
}

/**
 * `POST /auth/register/customer` 201 body.
 *
 * `challengeId` and `attemptsRemaining` are declared optional because
 * docs/openapi.yaml's `RegistrationAccepted` schema does not list them, even
 * though apps/api/src/modules/auth/auth.service.ts returns both on every
 * success. That is a specification gap, not a real optionality — flagged
 * rather than papered over, because `challengeId` is what the caller must feed
 * to `POST /auth/otp/verify` and a type built from the spec alone would not
 * have it.
 */
export interface RegisterCustomerResponse {
  userId: string;
  status: 'PENDING_OTP';
  otpExpiresAt: string;
  resendAvailableAt: string;
  challengeId?: string | undefined;
  attemptsRemaining?: number | undefined;
  /** Test/mock-SMS builds only. Never branch production behaviour on it. */
  _mockCode?: string | undefined;
}

/* ------------------------------------------------------------------ *
 * Calls
 *
 * These use `request` rather than the `api.get`/`api.post` sugar on purpose.
 * `api`'s methods call `request` through a module-local binding, which a test
 * spying on the client's exported `request` cannot intercept; an imported
 * binding, as used here, it can. The roles' own auth tests already spy that
 * seam, so going through `request` keeps one mocking seam for the whole chain.
 * The wire result is identical — `api.post(p, b)` is exactly
 * `request(p, { method: 'POST', body: b })`.
 * ------------------------------------------------------------------ */

/**
 * `LoginResponse` is a union: a multi-role account that sent no `roleCode` gets
 * the role-selection shape back instead of tokens.
 */
export function login(body: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', { method: 'POST', body });
}

export function sendOtp(body: SendOtpRequest): Promise<SendOtpResponse> {
  return request<SendOtpResponse>('/auth/otp/send', { method: 'POST', body });
}

/**
 * Returns `VerifyOtpResponse`, which is a union of two shapes but NOT the same
 * union as `login`'s:
 *
 *  - It cannot return the role-selection shape. `verifyOtp` in
 *    apps/api/src/modules/auth/auth.service.ts writes
 *    `requiresRoleSelection: false` as a literal and has no branch that asks
 *    for a role, so role selection is reachable only through password login.
 *  - It CAN return `OtpVerifiedWithoutAccount` — a `{ verified: true }` payload
 *    with no tokens, when the code verifies for a mobile number that has no
 *    user row yet (the registration path).
 */
export function verifyOtp(body: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  return request<VerifyOtpResponse>('/auth/otp/verify', { method: 'POST', body });
}

export function fetchCurrentUser(): Promise<CurrentUserProfile> {
  return request<CurrentUserProfile>('/auth/me', {});
}

export function logout(): Promise<void> {
  return request<void>('/auth/logout', { method: 'POST' });
}

/**
 * BR-39: log in with a token a provider SDK already verified. Never a bypass of
 * mobile+OTP — an identity with no linked account comes back as
 * `OAuthNotLinkedResponse` and the caller must still run the OTP challenge.
 *
 * `provider` is the lowercase URL segment; callers holding an uppercase
 * provider code convert at their own boundary.
 */
export function loginWithOAuth(
  provider: OAuthProvider,
  body: OAuthLoginRequest,
): Promise<OAuthLoginResponse> {
  return request<OAuthLoginResponse>(`/auth/oauth/${provider}`, { method: 'POST', body });
}

/**
 * Always answers 202 with a challenge, whether or not the mobile number exists
 * — the server does that deliberately so the response cannot be used to
 * enumerate accounts. A challenge coming back is therefore NOT evidence that
 * the account is real.
 */
export function forgotPassword(body: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
  return request<ForgotPasswordResponse>('/auth/forgot-password', { method: 'POST', body });
}

/** Answers 204 with no body; all of the user's existing sessions are revoked. */
export function resetPassword(body: ResetPasswordRequest): Promise<void> {
  return request<void>('/auth/reset-password', { method: 'POST', body });
}

/**
 * Answers 201. Registration is not yet a session: the account is created in a
 * pending state and an OTP challenge is dispatched, so the caller must follow
 * up with `POST /auth/otp/verify` using the returned `challengeId`.
 */
export function registerCustomer(
  body: RegisterCustomerRequest,
): Promise<RegisterCustomerResponse> {
  return request<RegisterCustomerResponse>('/auth/register/customer', {
    method: 'POST',
    body,
  });
}
