import { t, type TranslationKey } from '../../../../../../i18n/farmer';

/**
 * Translate a `farmer.crops.newCropScreen.*` key. These keys ship as
 * fragments (see i18n/NewCropScreen.{en,ta}.json) until merged into the
 * farmer catalogue, so they are not yet members of the generated
 * `TranslationKey` union; the cast is removed once the merge lands.
 */
export function nt(key: string, params?: Record<string, string | number>): string {
  return t(`farmer.crops.newCropScreen.${key}` as TranslationKey, params);
}

export const MONTH_KEYS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
] as const;

export const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
