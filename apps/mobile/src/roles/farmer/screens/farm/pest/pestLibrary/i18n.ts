import { t, type TranslationKey } from '../../../../../../i18n/farmer';

/**
 * Translate a `farmer.pestLibrary.*` (or shared `farmer.common.*`) key. The
 * pestLibrary keys ship as a catalogue fragment that is merged into
 * farmer.en.json / farmer.ta.json, so they are not necessarily part of the
 * generated `TranslationKey` union yet; this single cast is the only place that
 * has to know.
 */
export function pl(key: string, params?: Record<string, string | number>): string {
  return t(key as TranslationKey, params);
}
