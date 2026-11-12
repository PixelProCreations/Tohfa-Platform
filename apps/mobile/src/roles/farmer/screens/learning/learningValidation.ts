/**
 * Input limits for the Learning Hub's free-text inputs (search boxes, comment and group-post
 * boxes). SPEC GAP: docs/openapi.yaml has no request schema for any of these (the learning
 * comment / post boxes are local-only and search filters on the device), so these are generic,
 * conservative ceilings that only keep a runaway paste out of the UI, not business thresholds.
 */
import { maxLength, required, runRules, type FieldError } from '../../utils/validation';

export const LEARNING_SEARCH_MAX_LENGTH = 100;
export const LEARNING_MESSAGE_MAX_LENGTH = 1000;

/** Why a comment / group post cannot be sent (blank or over the ceiling), or null when it can. */
export function messageError(text: string): FieldError | null {
  return runRules(text, [required(), maxLength(LEARNING_MESSAGE_MAX_LENGTH)]);
}
