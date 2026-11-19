import { t, type TranslationKey } from '../../../../../../i18n/farmer';

/**
 * Translate a `farmer.addInputApplied.*` key. These keys ship as fragments
 * (AddInputAppliedScreen.{en,ta}.json) until merged into the farmer
 * catalogue, so they are not yet members of the generated `TranslationKey`
 * union; the cast is removed once the merge lands.
 */
export function ia(key: string, params?: Record<string, string | number>): string {
  return t(`farmer.addInputApplied.${key}` as TranslationKey, params);
}
