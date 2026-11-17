/**
 * BR-190: profile completeness. The mobile app routes a customer to onboarding until
 * `profileComplete` is true. Pure, so sign-in and GET /customers/me share one definition.
 */
export const PLACEHOLDER_CUSTOMER_NAME = 'TOHFA Customer';

export type MissingProfileField = 'fullName' | 'age' | 'gender' | 'harvestPreferences';

export interface CompletenessInput {
  fullName: string;
  age: number | null;
  gender: string | null;
  harvestPreferences: readonly string[];
}

export interface ProfileCompleteness {
  profileComplete: boolean;
  missingFields: MissingProfileField[];
}

/**
 * Complete = a real name (not blank, not the sign-up placeholder) AND at least one onboarding
 * field (age, gender or harvest preferences). While incomplete, `missingFields` lists `fullName`
 * when the name is missing and, when no onboarding field is set, all three onboarding fields
 * (any one of them satisfies the rule).
 */
export function profileCompleteness(p: CompletenessInput): ProfileCompleteness {
  const name = p.fullName.trim();
  const missing: MissingProfileField[] = [];
  if (name === '' || name.toLowerCase() === PLACEHOLDER_CUSTOMER_NAME.toLowerCase()) missing.push('fullName');
  const hasOnboarding = p.age !== null || p.gender !== null || p.harvestPreferences.length > 0;
  if (!hasOnboarding) missing.push('age', 'gender', 'harvestPreferences');
  return { profileComplete: missing.length === 0, missingFields: missing };
}
