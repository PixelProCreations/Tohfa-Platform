/**
 * LOCAL approved-input catalogue and crop nutrient reference for LogFertigationScreen.
 *
 * PENDING A BACKEND CATALOGUE. Nothing in docs/openapi.yaml serves approved inputs,
 * their unit prices, dosage guidance or per-crop nutrient targets: the crop-inputs
 * module (BR-56) only stores what the farmer applied, and `inputs.catalog.manage` in
 * docs/rbac.json is an admin permission with no route behind it yet. Until that
 * endpoint exists this list is the screen's only source, and it lives here (not in the
 * component) so replacing it with an API call touches one import.
 *
 * Every value below is placeholder reference data carried over from the original
 * screen mock, not an owner-approved price list:
 *  - prices are `Money` strings (never JS numbers, root CLAUDE.md §2.2);
 *  - `name`, `method` and `unit` are the values POSTed to the API, so they stay as
 *    data; the user-facing type, dosage and method labels are i18n keys.
 */
import { parseMoney, type Money } from '@tohfa/shared-types';
import type { CropInputType, CropInputUnit } from '../../../api/crops';
import type { TranslationKey } from '../../../../../i18n/farmer';

export interface ApplicationMethod {
  /** Sent verbatim as `applicationMethod` (max 100 chars). */
  value: string;
  labelKey: TranslationKey;
}

export const APPLICATION_METHODS: readonly ApplicationMethod[] = [
  { value: 'Drench', labelKey: 'farmer.logFertigation.method.drench' },
  { value: 'Foliar spray', labelKey: 'farmer.logFertigation.method.foliarSpray' },
  { value: 'Drip irrigation', labelKey: 'farmer.logFertigation.method.dripIrrigation' },
  { value: 'Soil incorporation', labelKey: 'farmer.logFertigation.method.soilIncorporation' },
  { value: 'Broadcasting', labelKey: 'farmer.logFertigation.method.broadcasting' },
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
  return APPLICATION_METHODS.find((m) => m.value === value)?.labelKey ?? null;
}

export interface ApprovedFertigationInput {
  /** Sent verbatim as `inputName`. */
  name: string;
  typeKey: TranslationKey;
  backendType: CropInputType;
  /** An `APPLICATION_METHODS` value. */
  method: string;
  dosageKey: TranslationKey;
  /** Default quantity as a decimal string (never parsed to a float for money). */
  defaultQty: string;
  unit: CropInputUnit;
  /** Price per one `unit`, as Money. */
  pricePerUnit: Money;
  phiDays: string;
  nitrogenPct?: number;
  phosphorusPct?: number;
  potassiumPct?: number;
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
    pricePerUnit: parseMoney('12.00'),
    phiDays: '0',
    nitrogenPct: 2.0,
    phosphorusPct: 1.0,
    potassiumPct: 1.5,
  },
  {
    name: 'Panchagavya',
    typeKey: 'farmer.logFertigation.inputType.organic',
    backendType: 'BIO_INPUT',
    method: 'Foliar spray',
    dosageKey: 'farmer.logFertigation.dosage.panchagavya',
    defaultQty: '15',
    unit: 'LITRE',
    pricePerUnit: parseMoney('42.00'),
    phiDays: '0',
    nitrogenPct: 1.0,
    phosphorusPct: 0.5,
    potassiumPct: 1.0,
  },
  {
    name: 'Jeevamrutha',
    typeKey: 'farmer.logFertigation.inputType.organic',
    backendType: 'BIO_INPUT',
    method: 'Drench',
    dosageKey: 'farmer.logFertigation.dosage.jeevamrutha',
    defaultQty: '50',
    unit: 'LITRE',
    pricePerUnit: parseMoney('8.00'),
    phiDays: '0',
    nitrogenPct: 1.5,
    phosphorusPct: 0.5,
    potassiumPct: 1.0,
  },
  {
    name: 'Bone meal',
    typeKey: 'farmer.logFertigation.inputType.organic',
    backendType: 'FERTILIZER',
    method: 'Soil incorporation',
    dosageKey: 'farmer.logFertigation.dosage.boneMeal',
    defaultQty: '25',
    unit: 'KG',
    pricePerUnit: parseMoney('21.00'),
    phiDays: '0',
    nitrogenPct: 3.5,
    phosphorusPct: 18.0,
    potassiumPct: 0,
  },
  {
    name: 'Trichoderma drench',
    typeKey: 'farmer.logFertigation.inputType.biological',
    backendType: 'BIO_INPUT',
    method: 'Root drench',
    dosageKey: 'farmer.logFertigation.dosage.trichoderma',
    defaultQty: '5',
    unit: 'KG',
    pricePerUnit: parseMoney('90.00'),
    phiDays: '0',
  },
];

/** Per-crop soil/nutrient targets shown on the reference card. Display strings only. */
export interface CropNutrientReference {
  idealPh: string;
  nKgHa: string;
  pKgHa: string;
  kKgHa: string;
}

/**
 * Keyed by lower-cased crop name. A crop missing here gets NO reference card: the old
 * screen silently showed carrot's numbers for every other crop, which presented one
 * crop's agronomy as another's.
 */
const CROP_NUTRIENT_REFERENCES: Readonly<Record<string, CropNutrientReference>> = {
  carrot: { idealPh: '5.5', nKgHa: '40', pKgHa: '30', kKgHa: '50' },
  tomato: { idealPh: '6.2', nKgHa: '65', pKgHa: '45', kKgHa: '70' },
  cabbage: { idealPh: '6.5', nKgHa: '55', pKgHa: '35', kKgHa: '60' },
};

export function nutrientReferenceFor(cropName: string | null | undefined): CropNutrientReference | null {
  if (!cropName) return null;
  return CROP_NUTRIENT_REFERENCES[cropName.trim().toLowerCase()] ?? null;
}
