/**
 * The one rule for "does this customer still need profile onboarding?",
 * shared by the OTP sign-in path (roles/customer/api/auth.ts) and the
 * session-restore/boot path (roles/farmer/api/auth.ts resolveRouteAfterAuth).
 *
 * - `isNewUser: true` (POST /auth/customer/otp/verify just created the account)
 *   -> onboarding.
 * - `profileComplete: false` (BR-190, on the verify response's `user` and on
 *   GET /customers/me; may be missing on older servers) -> onboarding.
 * - Absent/unknown -> NOT onboarding: an older server must never trap a
 *   returning customer in the onboarding screens.
 *
 * `hasPassword` is deliberately not an input: customers are passwordless
 * (BR-153), so `hasPassword: false` is their normal state, not a signal.
 */
export interface CustomerOnboardingSignals {
  isNewUser?: boolean | undefined;
  profileComplete?: boolean | undefined;
}

export function needsCustomerOnboarding(signals: CustomerOnboardingSignals): boolean {
  return signals.isNewUser === true || signals.profileComplete === false;
}
