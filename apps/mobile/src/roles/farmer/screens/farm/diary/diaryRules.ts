/**
 * Validation rules for the New Farm Diary Entry (step 3) form.
 *
 * Limits mirror docs/openapi.yaml: `DiaryEntryCreateRequest.minutes` integer,
 * 1..1440 (BR-42c: missing / non-positive is DIARY_MINUTES_REQUIRED),
 * `notes` maxLength 2000, `DiaryWorkerInput.name` maxLength 120, `hoursWorked`
 * in (0, 24] (BR-44a) and `wageRatePaise` a positive whole number of paise
 * (BR-44b). The wage is typed in rupees, so it goes through `positiveAmount`
 * (string-exact, never a float).
 */
import {
  integer,
  maxLength,
  name,
  positiveAmount,
  required,
  runRules,
  type FieldError,
  type FieldRules,
} from '../../../utils/validation';
import { hoursError } from '../workforce/attendanceHours';

export const DIARY_NOTES_MAX_LENGTH = 2000;
export const DIARY_WORKER_NAME_MAX_LENGTH = 120;
/** TextInput caps. */
export const DIARY_MINUTES_MAX_CHARS = 4;

export type DiaryEntryField = 'minutes' | 'notes';
export const DIARY_FIELD_ORDER: readonly DiaryEntryField[] = ['minutes', 'notes'];

/** `maxMinutes` is the server's bound (1440), passed in rather than baked in here. */
export function diaryEntryRules(maxMinutes: number): FieldRules<DiaryEntryField> {
  return {
    minutes: [required(), integer({ min: 1, max: maxMinutes })],
    notes: [maxLength(DIARY_NOTES_MAX_LENGTH)],
  };
}

export type DiaryWorkerField = 'name' | 'hours' | 'wage';

/**
 * Error for one worker-row field, or null. Blank values are valid here (a
 * freshly added row is blank); `isWorkerRowInvalid` in the screen still blocks
 * Save on blank required fields.
 */
export function workerFieldError(field: DiaryWorkerField, value: string): FieldError | null {
  switch (field) {
    case 'name':
      return runRules(value, [name({ min: 1, max: DIARY_WORKER_NAME_MAX_LENGTH })]);
    case 'hours':
      return hoursError(value);
    case 'wage':
      return runRules(value, [positiveAmount()]);
  }
}
