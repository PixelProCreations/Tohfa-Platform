/**
 * The admin's i18n entry point: the admin's own strings plus the shared
 * `error.<ErrorCode>` bucket, on the shared engine in src/i18n/runtime.ts
 * (the same one src/i18n/farmer.ts uses). That engine gives `{{param}}`
 * interpolation and a ta -> en fallback, so a key with no Tamil string still
 * renders in English instead of as its key.
 *
 * Why the catalogue stays here and not in src/i18n/: runtime.ts keeps each
 * role's strings in its own JSON so one role's import graph never pulls in
 * another role's catalogue. Admin screens import this file, never
 * src/i18n/farmer.ts or customer.ts.
 *
 * Admin screens show admin-facing errors through `admin.error.*` keys (see
 * ../api/errors.ts), worded for warehouse staff; the shared `error.*` bucket is
 * merged in only so a shared message key also resolves here.
 */
import errorsEn from '../../../i18n/errors.en.json';
import errorsTa from '../../../i18n/errors.ta.json';
import { createI18n, LOCALES, type Locale } from '../../../i18n/runtime';
import adminEn from './en.json';
import adminTa from './ta.json';

export const en = { ...errorsEn, ...adminEn };
const ta: Record<string, string> = { ...errorsTa, ...adminTa };

export type TranslationKey = keyof typeof en;

export { LOCALES };
export type { Locale };

const instance = createI18n<TranslationKey>({ en, ta });

export const setLocale = instance.setLocale;
export const getLocale = instance.getLocale;
export const t = instance.t;
export const missingKeys = instance.missingKeys;

/** True when `key` has an English string, for keys built at runtime (error codes). */
export function hasKey(key: string): key is TranslationKey {
  return Object.prototype.hasOwnProperty.call(en, key);
}
