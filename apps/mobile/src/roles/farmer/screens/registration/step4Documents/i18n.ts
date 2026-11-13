import { t, type TranslationKey } from '../../../../../i18n/farmer';

/**
 * Translate a `farmer.registration.step4Documents.*` key. The keys live in fragment files that
 * are merged into farmer.en.json / farmer.ta.json separately, so until then they are not part of
 * the English-derived `TranslationKey` union; this wrapper is the single place that cast lives.
 * Once merged, call sites can switch to plain `t()` and this file can be deleted.
 */
export function s4(key: string, params?: Record<string, string | number>): string {
  return t(`farmer.registration.step4Documents.${key}` as TranslationKey, params);
}
