import type { PestRepeatInterval } from '../../../../api/pest';

export type ReminderTab = 'Upcoming' | 'Completed';

/** Tab ids double as the API `status` values -- never localised. */
export const REMINDER_TABS: readonly ReminderTab[] = ['Upcoming', 'Completed'];

/**
 * Limited to what `repeatIntervalSchema` (pest.schema.ts) accepts -- there is no
 * `DAILY` value, so the mock's old "Daily" option is dropped rather than sent as a
 * value the API would reject. Values are API enums; labels come from i18n.
 */
export const REPEAT_VALUES: readonly PestRepeatInterval[] = ['ONE_TIME', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'];

export const CALENDAR_YEARS: readonly number[] = [2024, 2025, 2026, 2027, 2028, 2029, 2030];

/** Weekday header order (Sunday first) -> `farmer.pestManagement.weekday.<id>`. */
export const WEEKDAY_IDS = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'] as const;

export const MONTH_INDEXES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

/** Initial scheduled date shown before the farmer applies one from the calendar. */
export const DEFAULT_SCHEDULE_YEAR = 2026;
export const DEFAULT_SCHEDULE_MONTH = 8;
export const DEFAULT_SCHEDULE_DAY = 21;
