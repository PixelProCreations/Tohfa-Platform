/**
 * Constant reference data for warehouse edit forms (not fake warehouse data).
 * Only values that are UI constants belong here (time slot values), not sample
 * warehouse rows (those come from the API) and not words (those are t() keys).
 */

/** HH:MM strings for the operating hours time picker (whole hours, 00:00–23:00). */
export const TIME_SLOTS: readonly string[] = Array.from({ length: 24 }, (_, i) => {
  const hh = String(i).padStart(2, '0');
  return `${hh}:00`;
});
