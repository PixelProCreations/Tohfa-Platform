/** Rules for the Add Reminder modal (docs/openapi.yaml PestTreatmentReminderCreate: title 1..160, notes <= 2000). */
import { maxLength, required, type FieldRules } from '../../../../utils/validation';

export type ReminderField = 'treatmentName' | 'notes';

export const REMINDER_FIELD_ORDER: readonly ReminderField[] = ['treatmentName', 'notes'];

export const REMINDER_RULES: FieldRules<ReminderField> = {
  treatmentName: [required(), maxLength(160)],
  notes: [maxLength(2000)],
};
