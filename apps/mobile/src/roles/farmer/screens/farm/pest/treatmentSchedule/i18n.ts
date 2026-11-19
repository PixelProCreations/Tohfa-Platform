import { t, type TranslationKey } from '../../../../../../i18n/farmer';

/**
 * Translate a key for this screen. The `farmer.treatmentSchedule.*` keys ship as a
 * catalogue fragment that is merged into farmer.en.json / farmer.ta.json, so they
 * are not necessarily part of the generated `TranslationKey` union yet; this single
 * cast is the only place that has to know. Existing `farmer.pestManagement.*` /
 * `farmer.logPestTreatment.*` keys are passed through the same wrapper.
 */
export function ts(key: string, params?: Record<string, string | number>): string {
  return t(key as TranslationKey, params);
}
