/**
 * The order every admin and warehouse sign-out runs in. Pure (the steps are
 * injected) so plain-Node vitest can pin it; App.tsx passes api/auth's
 * `logout` as `revoke`. See ../tests/admin_login_signout.test.ts.
 *
 * `forget` and `leave` run even when `revoke` rejects. `logout()` already
 * swallows a failed POST /auth/logout and clears the tokens, but a Keychain
 * error while clearing can still reject it; the user must never stay signed in
 * because the network or the device store failed.
 */
export interface EndSessionSteps {
  /** Revoke the server session and clear the stored tokens (api/auth `logout`). */
  revoke: () => Promise<void>;
  /** Drop in-memory state keyed to this account (permission cache, last admin role). */
  forget: () => void;
  /** Navigate out of the signed-in screens. */
  leave: () => void;
}

export async function endSession(steps: EndSessionSteps): Promise<void> {
  try {
    await steps.revoke();
  } catch {
    // Signed out locally regardless; see the docblock.
  } finally {
    steps.forget();
    steps.leave();
  }
}
