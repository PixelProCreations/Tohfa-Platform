import type { PestCategory, PestSeverity } from '../../../../api/pest';
import { t, type TranslationKey } from '../../../../../../i18n/farmer';

/**
 * Translate a `farmer.logPestTreatment.*` key. The keys ship as a catalogue
 * fragment that is merged into farmer.en.json / farmer.ta.json, so they are not
 * necessarily part of the generated `TranslationKey` union yet; this single cast
 * is the only place that has to know.
 */
export function tr(key: string, params?: Record<string, string | number>): string {
  return t(`farmer.logPestTreatment.${key}` as TranslationKey, params);
}

// Static option lists (no reference-data endpoint for these). These are API
// values sent verbatim in the create body, so they are data, not UI copy.
export const TREATMENTS = [
  'Bordeaux mixture',
  'Neem oil spray (1500 ppm)',
  'Agniastra + Yellow Sticky Traps',
  'Wettable Sulphur / Trichoderma',
  'Dashparni kashayam',
  'Brahmastra decoction',
];

export const SEVERITIES: PestSeverity[] = ['High', 'Medium', 'Low'];
/** Matches pest.schema.ts's `pestCategorySchema` exactly (`Weed` included). */
export const CATEGORIES: PestCategory[] = ['Disease', 'Pest', 'Weed', 'Deficiency'];

const MS_PER_DAY = 86_400_000;
const PAD_WIDTH = 2;

export function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(PAD_WIDTH, '0');
  const dd = String(d.getDate()).padStart(PAD_WIDTH, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

export function isoDateAfterDays(days: number): string {
  return toIsoDate(new Date(Date.now() + days * MS_PER_DAY));
}

export function addDaysDisplay(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${String(d.getDate()).padStart(PAD_WIDTH, '0')} ${tr(`month.${d.getMonth()}`)} ${d.getFullYear()}`;
}
