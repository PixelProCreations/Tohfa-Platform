/**
 * Whole-form validation over the shared validators. Pure (no React, no `t()`),
 * so a screen's submit check and its unit test run the same code.
 */
import type { TranslationKey } from '../../../../i18n/farmer';
import { runRules, type FieldError, type Validator } from './validators';

/** The rule list for each field; a field with no entry is never validated. */
export type FieldRules<F extends string> = Partial<Record<F, readonly Validator[]>>;

/** The first failure per failing field; a passing field has no key. */
export type FieldErrors<F extends string> = Partial<Record<F, FieldError>>;

/** Validates every field that has rules. Blank optional fields pass (see validators.ts). */
export function validateFields<F extends string>(
  values: Readonly<Record<F, string>>,
  rules: FieldRules<F>,
): FieldErrors<F> {
  const errors: FieldErrors<F> = {};
  for (const field of Object.keys(rules) as F[]) {
    const fieldRules = rules[field];
    if (fieldRules === undefined) continue;
    const error = runRules(values[field] ?? '', fieldRules);
    if (error !== null) errors[field] = error;
  }
  return errors;
}

export function hasErrors<F extends string>(errors: FieldErrors<F>): boolean {
  return Object.values(errors).some((e) => e !== undefined);
}

/**
 * The first field (in on-screen `order`) that has an error, for scrolling to /
 * focusing it after a failed submit. Fields missing from `order` come last, in
 * the errors' own key order.
 */
export function firstInvalidField<F extends string>(errors: FieldErrors<F>, order: readonly F[] = []): F | null {
  for (const field of order) if (errors[field] !== undefined) return field;
  for (const field of Object.keys(errors) as F[]) if (errors[field] !== undefined) return field;
  return null;
}

/** Renders a FieldError with the screen's `t` (keeps this module free of the i18n runtime). */
export function errorMessage(
  error: FieldError | null | undefined,
  translate: (key: TranslationKey, params?: Record<string, string | number>) => string,
): string | undefined {
  if (error == null) return undefined;
  return translate(error.key, error.params);
}
