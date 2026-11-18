/**
 * Customer profile endpoints (docs/openapi.yaml `CustomerProfile`, BR-160/190/191).
 * Pre-login-mounted onboarding screens and CustomerMainApp both live under a
 * QueryClientProvider, so these hooks work in either place.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../../shell/api/client';

export const profileQueryKeys = { me: ['customer', 'me'] as const };

export type ApiGender = 'FEMALE' | 'MALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type CustomerLocale = 'en' | 'ta';

export interface CustomerProfile {
  id: string;
  customerCode: string;
  fullName: string;
  mobile: string;
  email: string | null;
  emailVerified: boolean;
  age: number | null;
  gender: ApiGender | null;
  harvestPreferences: string[];
  photoKey: string | null;
  customerType: 'RETAIL' | 'B2B' | 'HORECA';
  businessName: string | null;
  gstin: string | null;
  gstVerified: boolean;
  defaultAddressId: string | null;
  preferredLocale: CustomerLocale;
  profileComplete: boolean;
  missingFields: Array<'fullName' | 'age' | 'gender' | 'harvestPreferences'>;
  createdAt: string;
}

export interface UpdateCustomerProfileInput {
  fullName?: string;
  age?: number | null;
  gender?: ApiGender | null;
  harvestPreferences?: string[];
  photoKey?: string | null;
  preferredLocale?: CustomerLocale;
}

export const fetchCustomerProfile = (signal?: AbortSignal): Promise<CustomerProfile> =>
  api.get<CustomerProfile>('/customers/me', signal);

export const updateCustomerProfile = (input: UpdateCustomerProfileInput): Promise<CustomerProfile> =>
  api.patch<CustomerProfile>('/customers/me', input);

/** `DELETE /customers/me` -> 204. 409 CONFLICT meta.reason WALLET_NOT_EMPTY | OPEN_ORDERS. */
export const deleteCustomerAccount = (): Promise<void> => api.delete<void>('/customers/me');

export interface EmailOtpChallenge {
  email: string;
  expiresAt: string;
}
export const requestEmailOtp = (email: string): Promise<EmailOtpChallenge> =>
  api.post<EmailOtpChallenge>('/customers/me/email/otp', { email }, undefined, { timeoutMs: 15000 });
export const verifyEmailOtp = (input: { email: string; code: string }): Promise<CustomerProfile> =>
  api.post<CustomerProfile>('/customers/me/email/verify', input);

export function useCustomerProfile(enabled = true) {
  return useQuery({
    queryKey: profileQueryKeys.me,
    queryFn: ({ signal }) => fetchCustomerProfile(signal),
    enabled,
    retry: 1,
  });
}

/** PATCH /customers/me; writes the answer into the cache so Account/Profile refresh instantly. */
export function useUpdateCustomerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateCustomerProfile,
    onSuccess: (profile) => {
      qc.setQueryData(profileQueryKeys.me, profile);
    },
  });
}

/* ---------------- UI <-> API mappers ---------------- */

export function genderToApi(g: string | null | undefined): ApiGender | null {
  switch (g) {
    case 'male':
      return 'MALE';
    case 'female':
      return 'FEMALE';
    case 'other':
      return 'OTHER';
    case 'unspecified':
    case 'prefer_not_to_say':
      return 'PREFER_NOT_TO_SAY';
    default:
      return null;
  }
}
export function genderFromApi(
  g: ApiGender | null | undefined,
): 'male' | 'female' | 'prefer_not_to_say' | 'other' | null {
  switch (g) {
    case 'MALE':
      return 'male';
    case 'FEMALE':
      return 'female';
    case 'OTHER':
      return 'other';
    case 'PREFER_NOT_TO_SAY':
      return 'prefer_not_to_say';
    default:
      return null;
  }
}

/** API age is 13..120. Empty text is valid (no age). */
export function validateAge(text: string): { value: number | null; error: string | null } {
  const digits = text.replace(/[^0-9]/g, '');
  if (digits === '') return { value: null, error: null };
  const n = Number(digits);
  if (n < 13 || n > 120) return { value: null, error: 'Age must be between 13 and 120.' };
  return { value: n, error: null };
}

/**
 * Harvest preferences: ONE API array (<=20 items, each 1..50 chars) carries two UI groups.
 * Convention: `eat:<slug>` = eating style group, `care:<slug>` = "what matters" group.
 * Slugs are lowercase ascii with underscores, never display labels (i18n-safe).
 * Entries without a prefix are preserved by `parseHarvestPreferences().other`.
 */
export const HARVEST_EAT_PREFIX = 'eat:';
export const HARVEST_CARE_PREFIX = 'care:';

export function slugifyPreference(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

export function buildHarvestPreferences(eatingStyles: string[], matters: string[]): string[] {
  return [
    ...eatingStyles.map((s) => `${HARVEST_EAT_PREFIX}${slugifyPreference(s)}`),
    ...matters.map((s) => `${HARVEST_CARE_PREFIX}${slugifyPreference(s)}`),
  ]
    .filter((v, i, a) => !v.endsWith(':') && a.indexOf(v) === i)
    .slice(0, 20);
}

export function parseHarvestPreferences(values: readonly string[] | null | undefined): {
  eatingStyles: string[];
  matters: string[];
  other: string[];
} {
  const out = { eatingStyles: [] as string[], matters: [] as string[], other: [] as string[] };
  for (const v of values ?? []) {
    if (v.startsWith(HARVEST_EAT_PREFIX)) out.eatingStyles.push(v.slice(HARVEST_EAT_PREFIX.length));
    else if (v.startsWith(HARVEST_CARE_PREFIX)) out.matters.push(v.slice(HARVEST_CARE_PREFIX.length));
    else out.other.push(v);
  }
  return out;
}

/** `+919876543210` -> `+91 98765 43210`. */
export function formatMobileDisplay(mobile: string | null | undefined): string {
  const m = /^\+91([0-9]{5})([0-9]{5})$/.exec(mobile ?? '');
  return m ? `+91 ${m[1]} ${m[2]}` : (mobile ?? '');
}

/** The sign-up placeholder name (BR-190) is not a real name; never show it as one. */
export const PLACEHOLDER_CUSTOMER_NAME = 'TOHFA Customer';
export function displayName(profile: Pick<CustomerProfile, 'fullName'> | undefined | null): string {
  const n = profile?.fullName?.trim() ?? '';
  return n === '' || n === PLACEHOLDER_CUSTOMER_NAME ? '' : n;
}
