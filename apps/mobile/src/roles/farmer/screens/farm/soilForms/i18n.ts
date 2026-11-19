import { t, type TranslationKey } from '../../../../../i18n/farmer';

/**
 * Translate a `farmer.soilForms.*` key (shared by the Log Soil Amendment and
 * Log Erosion Note screens).
 *
 * `TranslationKey` is derived from farmer.en.json, so a key added through a
 * fragment that has not been merged into the catalogue yet would not typecheck.
 * Centralising the cast here keeps it in one place; once the fragment is
 * merged this can be tightened to `TranslationKey` with no call-site changes.
 */
export function sf(suffix: string, params?: Record<string, string | number>): string {
  return t(`farmer.soilForms.${suffix}` as TranslationKey, params);
}

/**
 * Keys that already existed in the catalogue with exactly the text these
 * screens render. Reused rather than duplicated under `farmer.soilForms.*`.
 */
export const SHARED_KEYS = {
  cancel: 'farmer.common.cancel',
  ok: 'farmer.common.ok',
  goBack: 'farmer.uploadSoilTest.a11y.back',
  noFarm: 'farmer.uploadSoilTest.error.noFarm',
  selectZone: 'farmer.crops.calendar.selectZone',
  quantityKg: 'farmer.listing.create.quantityKg',
} as const satisfies Record<string, TranslationKey>;

export { t };
