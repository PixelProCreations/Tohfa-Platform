/**
 * Field rules for Upload Soil Test (docs/openapi.yaml SoilTestRecordCreate):
 * organicCarbonPct 0..100, ph 0..14, ecDsPerM >= 0, tdsPpm integer >= 0,
 * nitrogen/phosphorus/potassium KgPerHa >= 0. The spec sets no upper bound on
 * ec / tds / NPK, so the digit and ceiling limits below are generic guards that
 * only stop absurd input (SPEC GAP, listed in the change summary).
 *
 * "Next due" must not precede the test date -- the one cross-field rule -- so the
 * rule table is built from the current test date.
 */
import type { TranslationKey } from '../../../../../../i18n/farmer';
import { decimal, integer, required, type FieldRules } from '../../../../utils/validation';
import { soilDate, soilDateNotBefore, soilDateNotInFuture } from '../../soilForms/dateValidation';

/** New key (see the keys file handed to the orchestrator); not yet in farmer.en.json, hence the cast. */
export const NEXT_DUE_BEFORE_TEST_KEY = 'farmer.soilTest.validation.nextDueBeforeTestDate' as TranslationKey;

export type SoilTestField =
  | 'testDate'
  | 'nextDue'
  | 'organicCarbon'
  | 'ph'
  | 'ec'
  | 'tds'
  | 'nitrogen'
  | 'phosphorus'
  | 'potassium';

export const SOIL_TEST_FIELD_ORDER: readonly SoilTestField[] = [
  'testDate',
  'nextDue',
  'organicCarbon',
  'ph',
  'ec',
  'tds',
  'nitrogen',
  'phosphorus',
  'potassium',
];

/** Spec gap: generic guards for readings the API leaves unbounded above. */
export const SOIL_READING_MAX_INTEGER_DIGITS = 6;
export const SOIL_TDS_MAX = 1000000;

export function soilTestRules(testDate: string): FieldRules<SoilTestField> {
  const reading = decimal({ min: 0, maxIntegerDigits: SOIL_READING_MAX_INTEGER_DIGITS });
  return {
    testDate: [required(), soilDate(), soilDateNotInFuture()],
    nextDue: [required(), soilDate(), soilDateNotBefore(testDate, NEXT_DUE_BEFORE_TEST_KEY)],
    organicCarbon: [required(), decimal({ min: 0, max: 100 })],
    ph: [required(), decimal({ min: 0, max: 14 })],
    ec: [required(), reading],
    tds: [integer({ min: 0, max: SOIL_TDS_MAX })],
    nitrogen: [reading],
    phosphorus: [reading],
    potassium: [reading],
  };
}
