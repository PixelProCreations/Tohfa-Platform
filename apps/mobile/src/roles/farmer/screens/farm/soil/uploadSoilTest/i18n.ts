import { t, type TranslationKey } from '../../../../../../i18n/farmer';

/**
 * Translate a `farmer.uploadSoilTest.*` key.
 *
 * `TranslationKey` is derived from farmer.en.json, so a key added through a
 * fragment that has not been merged into the catalogue yet would not typecheck.
 * Centralising the cast here keeps it in one place; once the fragment is
 * merged this can be tightened to `TranslationKey` with no call-site changes.
 */
export function st(suffix: string, params?: Record<string, string | number>): string {
  return t(`farmer.uploadSoilTest.${suffix}` as TranslationKey, params);
}
