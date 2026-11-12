import { t, type TranslationKey } from '../../../../../i18n/farmer';

/**
 * Typed-loosely accessor for the `farmer.registration.step1Personal.*` keys.
 * `t()` is typed by the English JSON; until the fragment for this screen is merged into
 * farmer.en.json the keys are not yet in `TranslationKey`, hence the cast.
 */
export function s1(key: string, params?: Record<string, string | number>): string {
  return t(`farmer.registration.step1Personal.${key}` as TranslationKey, params);
}
