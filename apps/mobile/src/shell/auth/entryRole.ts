/**
 * Which entry a person signed in through: the farmer/staff Login (and its OTP
 * screen) or the customer OTP sign-in. BR-135 lets one account hold FARMER and
 * CUSTOMER together, and the app must open the side the person chose, not
 * whichever role the server happened to list first (`getUserRoles` has no
 * ORDER BY, and `/auth/otp/verify` and `/auth/me` return every role held).
 *
 * WHY THIS ONLY SELECTS, NEVER GRANTS: the roles passed in are always the ones
 * the server returned for this account. The entry narrows them to the chosen
 * side or refuses; it can never add a role (root CLAUDE.md 2.1). The server
 * still authorises every call.
 *
 * The entry is remembered (AsyncStorage: it is not a secret) so that the
 * re-routes that only have `/auth/me` to go on -- the Splash session restore
 * and Create Password -- open the same side again after a cold start.
 *
 * Pure apart from the three storage functions, so plain-Node vitest pins it.
 * Lives in shell because both the farmer screens and the customer sign-in
 * write it; it imports nothing from src/roles.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export type EntryRole = 'FARMER' | 'CUSTOMER';

const STORAGE_KEY = '@tohfa_entry_role';
const CUSTOMER_ROLE = 'CUSTOMER';

export type EntryRoles<T> = { ok: true; roles: T[] } | { ok: false };

/**
 * The roles a sign-in through `entry` may open.
 *
 * - CUSTOMER entry: only the CUSTOMER role.
 * - FARMER entry: every role except CUSTOMER. This Login is also the staff
 *   sign-in, so admin roles pass through it unchanged.
 *
 * `{ ok: false }` when the account holds roles but none for this entry (a
 * customer-only account on the farmer Login, a farmer-only account on the
 * customer sign-in): the caller shows an error and never opens the other side.
 * An empty role list passes through unchanged, as it did before.
 */
export function rolesForEntry<T extends { code?: unknown }>(
  entry: EntryRole,
  roles: readonly T[] | null | undefined,
): EntryRoles<T> {
  const all = [...(roles ?? [])];
  if (all.length === 0) return { ok: true, roles: all };
  const kept = all.filter((r) => (r?.code === CUSTOMER_ROLE) === (entry === 'CUSTOMER'));
  return kept.length > 0 ? { ok: true, roles: kept } : { ok: false };
}

/**
 * The roles a restored session (Splash, Create Password) routes on. No
 * remembered entry, or one the account no longer matches, leaves the roles to
 * the normal routing; the sign-in screens are where a mismatch is refused.
 */
export function rolesForSession<T extends { code?: unknown }>(entry: EntryRole | null, roles: readonly T[]): T[] {
  if (entry === null) return [...roles];
  const narrowed = rolesForEntry(entry, roles);
  return narrowed.ok ? narrowed.roles : [...roles];
}

// `undefined`: not read from storage yet in this process.
let cached: EntryRole | null | undefined;

export async function rememberEntryRole(entry: EntryRole): Promise<void> {
  cached = entry;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, entry);
  } catch {
    // Storage failure only costs the cold-start re-route; the sign-in itself stands.
  }
}

export async function readEntryRole(): Promise<EntryRole | null> {
  if (cached !== undefined) return cached;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    cached = raw === 'FARMER' || raw === 'CUSTOMER' ? raw : null;
  } catch {
    cached = null;
  }
  return cached;
}

export async function forgetEntryRole(): Promise<void> {
  cached = null;
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do: the next sign-in overwrites it.
  }
}

/** Test-only: drop the in-memory copy so the next read hits (mocked) storage. */
export function __resetEntryRoleForTests(): void {
  cached = undefined;
}
