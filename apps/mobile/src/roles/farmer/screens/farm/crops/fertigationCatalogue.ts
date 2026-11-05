/**
 * LOCAL approved-input list for LogFertigationScreen.
 *
 * PENDING A BACKEND CATALOGUE. Nothing in docs/openapi.yaml serves approved inputs:
 * the crop-inputs module (BR-56) only stores what the farmer applied, and
 * `inputs.catalog.manage` in docs/rbac.json is an admin permission with no route
 * behind it yet. Until that endpoint exists this list (the names, types, methods and
 * dosage guidance the Dev screen design shows) is the screen's only source, and it
 * lives here so replacing it with an API call touches one import.
 *
 * Deliberately NOT here: unit prices, NPK percentages and per-crop pH/NPK targets.
 * The screen mock carried such numbers, but none of them came from the owner or an
 * API, so they are neither shown as fact nor POSTed as a farmer's record (the optional
 * cost and N/P/K percentage fields of the BR-56 body are simply omitted). Add them back
 * only from a real source.
 *
 * `name`, `method` and `unit` are the values POSTed to the API, so they stay as data;
 * the user-facing type, dosage, method and unit labels are i18n keys.
 */
import type { CropInputType, CropInputUnit } from '../../../api/crops';
import type { TranslationKey } from '../../../../../i18n/farmer';

export interface ApplicationMethod {
  /** Sent verbatim as `applicationMethod` (max 100 chars). */
  value: string;
  labelKey: TranslationKey;
}

/** The methods offered by the Dev design's method picker, in its order. */
export const APPLICATION_METHODS: readonly ApplicationMethod[] = [
  { value: 'Drench', labelKey: 'farmer.logFertigation.method.drench' },
  { value: 'Foliar spray', labelKey: 'farmer.logFertigation.method.foliarSpray' },
  { value: 'Drip irrigation', labelKey: 'farmer.logFertigation.method.dripIrrigation' },
  { value: 'Soil incorporation', labelKey: 'farmer.logFertigation.method.soilIncorporation' },
  { value: 'Broadcasting', labelKey: 'farmer.logFertigation.method.broadcasting' },
];

/**
 * Labels for every method an input can pre-fill. 'Root drench' is only ever set by
 * selecting Trichoderma (as on Dev) and is not offered in the picker.
 */
const METHOD_LABELS: readonly ApplicationMethod[] = [
  ...APPLICATION_METHODS,
  { value: 'Root drench', labelKey: 'farmer.logFertigation.method.rootDrench' },
];

/** Units offered on this screen, as the API's `CropInputUnit` enum, with display labels. */
export const FERTIGATION_UNITS: readonly { unit: CropInputUnit; labelKey: TranslationKey }[] = [
  { unit: 'KG', labelKey: 'farmer.logFertigation.unit.kg' },
  { unit: 'LITRE', labelKey: 'farmer.logFertigation.unit.litre' },
  { unit: 'GRAM', labelKey: 'farmer.logFertigation.unit.gram' },
  { unit: 'ML', labelKey: 'farmer.logFertigation.unit.ml' },
];

export function unitLabelKey(unit: CropInputUnit): TranslationKey {
  return FERTIGATION_UNITS.find((u) => u.unit === unit)?.labelKey ?? 'farmer.logFertigation.unit.kg';
}

export function methodLabelKey(value: string): TranslationKey | null {
  return METHOD_LABELS.find((m) => m.value === value)?.labelKey ?? null;
}

export interface ApprovedFertigationInput {
  /** Sent verbatim as `inputName`. */
  name: string;
  typeKey: TranslationKey;
  backendType: CropInputType;
  /** A `METHOD_LABELS` value. */
  method: string;
  dosageKey: TranslationKey;
  /** Pre-filled, editable quantity as a decimal string (never parsed to a float). */
  defaultQty: string;
  unit: CropInputUnit;
  /** Pre-filled, editable PHI in days. */
  phiDays: string;
}

export const APPROVED_FERTIGATION_INPUTS: readonly ApprovedFertigationInput[] = [
  {
    name: 'Vermicompost',
    typeKey: 'farmer.logFertigation.inputType.organic',
    backendType: 'MANURE',
    method: 'Drench',
    dosageKey: 'farmer.logFertigation.dosage.vermicompost',
    defaultQty: '60',
    unit: 'KG',
    phiDays: '0',
  },
  {
    name: 'Panchagavya',
    typeKey: 'farmer.logFertigation.inputType.organic',
    backendType: 'BIO_INPUT',
    method: 'Foliar spray',
    dosageKey: 'farmer.logFertigation.dosage.panchagavya',
    defaultQty: '15',
    unit: 'LITRE',
    phiDays: '0',
  },
  {
    name: 'Jeevamrutha',
    typeKey: 'farmer.logFertigation.inputType.organic',
    backendType: 'BIO_INPUT',
    method: 'Drench',
    dosageKey: 'farmer.logFertigation.dosage.jeevamrutha',
    defaultQty: '50',
    unit: 'LITRE',
    phiDays: '0',
  },
  {
    name: 'Bone meal',
    typeKey: 'farmer.logFertigation.inputType.organic',
    backendType: 'FERTILIZER',
    method: 'Soil incorporation',
    dosageKey: 'farmer.logFertigation.dosage.boneMeal',
    defaultQty: '25',
    unit: 'KG',
    phiDays: '0',
  },
  {
    name: 'Trichoderma drench',
    typeKey: 'farmer.logFertigation.inputType.biological',
    backendType: 'BIO_INPUT',
    method: 'Root drench',
    dosageKey: 'farmer.logFertigation.dosage.trichoderma',
    defaultQty: '5',
    unit: 'KG',
    phiDays: '0',
  },
];
