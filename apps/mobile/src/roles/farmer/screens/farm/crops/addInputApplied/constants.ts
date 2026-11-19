export type InputType = 'Fertigation' | 'Pest Treatment';

/**
 * Canonical English values. These are the ids kept in state AND the strings
 * sent in the save payload, so they must never be localised; the labels
 * shown to the farmer come from the i18n keys alongside.
 */
export const UNITS = ['ml', 'L', 'kg', 'g'] as const;

export const PURPOSES = [
  { value: 'General nutrition', key: 'purpose.generalNutrition' },
  { value: 'Pest prevention', key: 'purpose.pestPrevention' },
  { value: 'Disease control', key: 'purpose.diseaseControl' },
  { value: 'Soil fertility', key: 'purpose.soilFertility' },
  { value: 'Flowering booster', key: 'purpose.floweringBooster' },
] as const;

export const PEST_OPTIONS = [
  { value: 'Aphids', key: 'pest.aphids' },
  { value: 'Fruit Borer', key: 'pest.fruitBorer' },
  { value: 'Early Blight', key: 'pest.earlyBlight' },
  { value: 'Leaf Curl Virus', key: 'pest.leafCurlVirus' },
  { value: 'Whiteflies', key: 'pest.whiteflies' },
  { value: 'Mites', key: 'pest.mites' },
  { value: 'Cutworms', key: 'pest.cutworms' },
  { value: 'Powdery Mildew', key: 'pest.powderyMildew' },
] as const;

export const APPLIED_BY_OPTIONS = [
  { value: 'Self', key: 'by.self' },
  { value: 'Raju (Worker)', key: 'by.raju' },
  { value: 'Mani (Worker)', key: 'by.mani' },
  { value: 'Contractor', key: 'by.contractor' },
] as const;

/** Example date shown as placeholder and used as the prefilled value. */
export const SAMPLE_DATE_TIME = '17 Sep 2026, 09:20 AM';
export const SAMPLE_QUANTITY_PLACEHOLDER = '200';

/** Default quantity/unit per input type (swapped when the type toggles). */
export const FERTIGATION_DEFAULTS = { quantity: '4', unit: 'L' } as const;
export const PEST_DEFAULTS = { quantity: '200', unit: 'ml' } as const;

export interface InputAppliedEntry {
  inputType: InputType;
  productName: string;
  quantity: string;
  dateTime: string;
  purpose: string;
  targetPest: string | undefined;
  appliedBy: string;
  notes: string;
}
