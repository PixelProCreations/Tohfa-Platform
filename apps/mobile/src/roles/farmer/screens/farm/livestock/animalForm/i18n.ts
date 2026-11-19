import { t, type TranslationKey } from '../../../../../../i18n/farmer';

/**
 * Translation helper for the shared animal register / edit form.
 *
 * The `farmer.animalForm.*` keys are delivered as a fragment and merged into
 * farmer.en.json / farmer.ta.json separately; `t()` is typed by the English
 * catalogue, so until that merge the suffix is cast to a `TranslationKey`
 * here, in one place, instead of at every call site.
 */
const NS = 'farmer.animalForm';

export function af(suffix: string, params?: Record<string, string | number>): string {
  return t(`${NS}.${suffix}` as TranslationKey, params);
}
