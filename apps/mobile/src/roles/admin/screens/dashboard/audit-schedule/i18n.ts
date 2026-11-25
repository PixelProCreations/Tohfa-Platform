/**
 * `t()` for this screen's own catalogue (i18n/auditsDashboardSchedule.en.json).
 * Keys are typed against that file, so a typo fails typecheck even before the
 * catalogue is merged into the admin `en` map.
 */
import { t, type TranslationKey } from '../../../i18n';
import type catalogue from '../../../i18n/auditsDashboardSchedule.en.json';

export type DashScheduleKey = keyof typeof catalogue;

export function ds(key: DashScheduleKey, params?: Record<string, string | number>): string {
  return t(key as string as TranslationKey, params);
}
