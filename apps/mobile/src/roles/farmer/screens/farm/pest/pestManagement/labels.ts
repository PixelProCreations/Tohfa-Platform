import type { TranslationKey } from '../../../../../../i18n/farmer';

// Typed lookups from the API's English enum values to i18n keys. A map (rather
// than a template-literal key) keeps `t()` checked against the catalogue: a
// missing key is a compile error here.

export const SEVERITY_LABEL_KEY = {
  Low: 'farmer.pestManagement.severity.Low',
  Medium: 'farmer.pestManagement.severity.Medium',
  High: 'farmer.pestManagement.severity.High',
} as const satisfies Record<string, TranslationKey>;

export const STATUS_LABEL_KEY = {
  Ongoing: 'farmer.pestManagement.status.Ongoing',
  Resolved: 'farmer.pestManagement.status.Resolved',
  Recurring: 'farmer.pestManagement.status.Recurring',
} as const satisfies Record<string, TranslationKey>;

export const WEEKDAY_LABEL_KEYS = [
  'farmer.pestManagement.weekday.su',
  'farmer.pestManagement.weekday.mo',
  'farmer.pestManagement.weekday.tu',
  'farmer.pestManagement.weekday.we',
  'farmer.pestManagement.weekday.th',
  'farmer.pestManagement.weekday.fr',
  'farmer.pestManagement.weekday.sa',
] as const satisfies readonly TranslationKey[];

/**
 * Display label for an API enum value that is typed as plain `string`
 * (PestDetection.severity/status). Unknown values render as-is, as the
 * screen did before it was localised.
 */
export function labelFor(map: Readonly<Record<string, TranslationKey>>, value: string, translate: (k: TranslationKey) => string): string {
  const key = map[value];
  return key ? translate(key) : value;
}
