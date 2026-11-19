/**
 * Register / edit animal text-input rules. Limits are the request-shape limits
 * of CreateAnimalBody / UpdateAnimalBody in docs/openapi.yaml (tag 1..40,
 * breed 1..120, sourceFarm 1..160); they are not business thresholds.
 */
import { t, type TranslationKey } from '../../../../../../i18n/farmer';
import { errorMessage, maxLength, required, validateFields, type FieldRules } from '../../../../utils/validation';

export const ANIMAL_TAG_MAX = 40;
export const ANIMAL_BREED_MAX = 120;
export const ANIMAL_SOURCE_FARM_MAX = 160;

export type AnimalTextField = 'tag' | 'breed' | 'sourceFarm';

export const ANIMAL_TEXT_RULES: FieldRules<AnimalTextField> = {
  tag: [required(), maxLength(ANIMAL_TAG_MAX)],
  breed: [maxLength(ANIMAL_BREED_MAX)],
  sourceFarm: [maxLength(ANIMAL_SOURCE_FARM_MAX)],
};

/**
 * Field-keyed, already-translated messages for the form's `fieldErrors`.
 * `requiredTagMessage` keeps each screen's own "tag is required" wording.
 * sourceFarm is only checked for purchased animals (it is not sent otherwise).
 */
export function validateAnimalText(
  values: { tag: string; breed: string; sourceFarm: string; purchased: boolean },
  requiredTagMessage: string,
  translate: (key: TranslationKey, params?: Record<string, string | number>) => string = t,
): Record<string, string> {
  const errors = validateFields<AnimalTextField>(
    { tag: values.tag, breed: values.breed, sourceFarm: values.purchased ? values.sourceFarm : '' },
    ANIMAL_TEXT_RULES,
  );
  const out: Record<string, string> = {};
  for (const field of Object.keys(errors) as AnimalTextField[]) {
    const error = errors[field];
    if (error === undefined) continue;
    out[field] =
      field === 'tag' && error.key === 'farmer.validation.required'
        ? requiredTagMessage
        : (errorMessage(error, translate) ?? '');
  }
  return out;
}
