/**
 * Pure form -> request-body mapping for AnimalDetailScreen's add-record
 * modals. No React, no network: every builder takes the modal's raw string
 * state (option values, free-text dates and numbers) and returns either
 * the exact body `apps/api/src/modules/livestock/livestock.schema.ts` accepts
 * or the list of field problems, so a body the server would 422 is never sent.
 *
 * Option pickers hold the API enum value itself and display a translated
 * label from an explicit `enum -> i18n key` table (the `*_OPTIONS` tables
 * below), never a label converted with `toUpperCase().replace(...)`: a new
 * server enum value is then a compile error until it has a label, and a value
 * outside the table is dropped instead of posted to the strict server schema.
 *
 * Quantities that the farmer types in one unit and the server stores in
 * another (ml -> L, lb -> kg, trays -> eggs) are converted with integer
 * decimal maths (`scaleDecimal`), never `parseFloat(x) * factor`, so 0.3 x 3
 * is 0.9 and not 0.8999999999999999. These are physical measurements, not
 * money (root CLAUDE.md §2.2 governs money, which this file never touches).
 */
import { t, type TranslationKey } from '../../../../../i18n/farmer';
import {
  PRODUCTION_PRODUCT_UNITS,
  type AnimalGender,
  type AppetiteLevel,
  type BreedingMethod,
  type BreedingRecordType,
  type CalvingOutcome,
  type CheckupType,
  type CreateCalvingBody,
  type CreateCheckupBody,
  type CreateDewormingBody,
  type CreateFeedLogBody,
  type CreateFeedPlanBody,
  type CreateHeatBody,
  type CreateHousingRecordBody,
  type CreateHygieneLogBody,
  type CreateInseminationBody,
  type CreatePregnancyCheckBody,
  type CreateProductionLogBody,
  type CreateTreatmentBody,
  type CreateVaccinationBody,
  type DeliveryType,
  type DewormingRoute,
  type ExaminationMethod,
  type FeedItemUnit,
  type FeedLogUnit,
  type FeedType,
  type GestationAgeUnit,
  type GrazingDurationUnit,
  type HealthRecordType,
  type HealthStatus,
  type HousingType,
  type InseminationType,
  type Measured,
  type ObservedReaction,
  type PregnancyCheckType,
  type PregnancyResult,
  type ProductionProductType,
  type ProductionSession,
  type SpaceUnit,
  type TargetParasite,
  type TemperatureUnit,
  type TreatmentDosageUnit,
  type TreatmentFrequency,
  type TreatmentRoute,
  type TreatmentType,
  type VaccinationRoute,
  type VaccineDoseUnit,
  type WaterSource,
  type WeightUnit,
} from '../../../api/livestock';

// ── Errors ──────────────────────────────────────────────────────────────────

export type FormProblem =
  | 'required'
  | 'invalidDate'
  | 'invalidTime'
  | 'invalidNumber'
  | 'notPositive'
  | 'notWholeNumber'
  | 'outOfRange'
  | 'tooLong'
  | 'beforeRecordDate'
  | 'beforeStartDate'
  | 'unsupportedUnit'
  | 'incomplete';

export type FormField =
  | 'recordDate'
  | 'recordTime'
  | 'veterinarian'
  | 'vaccineName'
  | 'dose'
  | 'batchNumber'
  | 'nextDueDate'
  | 'notes'
  | 'productName'
  | 'activeIngredient'
  | 'animalWeight'
  | 'expiryDate'
  | 'administeredBy'
  | 'checkupType'
  | 'clinic'
  | 'bodyTemperature'
  | 'bodyWeight'
  | 'activityLevel'
  | 'symptoms'
  | 'findings'
  | 'diagnosis'
  | 'followUpDate'
  | 'recommendedActions'
  | 'condition'
  | 'description'
  | 'medicineName'
  | 'dosage'
  | 'medicationStartDate'
  | 'medicationEndDate'
  | 'milkWithdrawalStart'
  | 'milkWithdrawalEnd'
  | 'withdrawalReason'
  | 'meatWithdrawalEnd'
  | 'prescribedBy'
  | 'sire'
  | 'breedingMethod'
  | 'semenStrawRef'
  | 'technician'
  | 'heatSigns'
  | 'inseminationTime'
  | 'location'
  | 'expectedDeliveryDate'
  | 'nextCheckDate'
  | 'offspringCount'
  | 'offspringName'
  | 'birthWeight'
  | 'planName'
  | 'feedType'
  | 'feedSource'
  | 'grazingDuration'
  | 'waterSource'
  | 'startTime'
  | 'endTime'
  | 'feedItems'
  | 'housingType'
  | 'housingName'
  | 'indoorSpace'
  | 'outdoorSpace'
  | 'startDate'
  | 'productionDate'
  | 'quantity'
  | 'unit'
  | 'qualityGrade'
  | 'fatPercent'
  | 'calvingTime'
  | 'fedOn'
  | 'activity'
  | 'performedOn';

export interface FieldError {
  field: FormField;
  problem: FormProblem;
}

export type BuildResult<B> = { ok: true; body: B } | { ok: false; errors: FieldError[] };

const FIELD_LABEL_KEYS: Record<FormField, TranslationKey> = {
  recordDate: 'farmer.livestock.detail.field.recordDate',
  recordTime: 'farmer.livestock.detail.field.time',
  veterinarian: 'farmer.livestock.detail.field.veterinarian',
  vaccineName: 'farmer.livestock.detail.field.vaccineName',
  dose: 'farmer.livestock.detail.field.dose',
  batchNumber: 'farmer.livestock.detail.field.batchNumber',
  nextDueDate: 'farmer.livestock.detail.field.nextDueDate',
  notes: 'farmer.livestock.detail.field.notes',
  productName: 'farmer.livestock.detail.field.productName',
  activeIngredient: 'farmer.livestock.detail.field.activeIngredient',
  animalWeight: 'farmer.livestock.detail.field.animalWeight',
  expiryDate: 'farmer.livestock.detail.field.expiryDate',
  administeredBy: 'farmer.livestock.detail.field.administeredBy',
  checkupType: 'farmer.livestock.detail.field.checkupType',
  clinic: 'farmer.livestock.detail.field.clinic',
  bodyTemperature: 'farmer.livestock.detail.field.bodyTemperature',
  bodyWeight: 'farmer.livestock.detail.field.bodyWeight',
  activityLevel: 'farmer.livestock.detail.field.activityLevel',
  symptoms: 'farmer.livestock.detail.field.symptoms',
  findings: 'farmer.livestock.detail.field.findings',
  diagnosis: 'farmer.livestock.detail.field.diagnosis',
  followUpDate: 'farmer.livestock.detail.field.followUpDate',
  recommendedActions: 'farmer.livestock.detail.field.recommendedActions',
  condition: 'farmer.livestock.detail.field.condition',
  description: 'farmer.livestock.detail.field.description',
  medicineName: 'farmer.livestock.detail.field.medicineName',
  dosage: 'farmer.livestock.detail.field.dosage',
  medicationStartDate: 'farmer.livestock.detail.field.medicationStartDate',
  medicationEndDate: 'farmer.livestock.detail.field.medicationEndDate',
  milkWithdrawalStart: 'farmer.livestock.detail.field.milkWithdrawalStart',
  milkWithdrawalEnd: 'farmer.livestock.detail.field.milkWithdrawalEnd',
  withdrawalReason: 'farmer.livestock.detail.field.withdrawalReason',
  meatWithdrawalEnd: 'farmer.livestock.detail.field.meatWithdrawalEnd',
  prescribedBy: 'farmer.livestock.detail.field.prescribedBy',
  sire: 'farmer.livestock.detail.field.sire',
  breedingMethod: 'farmer.livestock.detail.field.breedingMethod',
  semenStrawRef: 'farmer.livestock.detail.field.semenStrawRef',
  technician: 'farmer.livestock.detail.field.technician',
  heatSigns: 'farmer.livestock.detail.field.heatSigns',
  inseminationTime: 'farmer.livestock.detail.field.time',
  location: 'farmer.livestock.detail.field.location',
  expectedDeliveryDate: 'farmer.livestock.detail.field.expectedDeliveryDate',
  nextCheckDate: 'farmer.livestock.detail.field.nextCheckDate',
  offspringCount: 'farmer.livestock.detail.field.offspringCount',
  offspringName: 'farmer.livestock.detail.field.offspringName',
  birthWeight: 'farmer.livestock.detail.field.birthWeight',
  planName: 'farmer.livestock.detail.field.planName',
  feedType: 'farmer.livestock.detail.field.feedType',
  feedSource: 'farmer.livestock.detail.field.feedSource',
  grazingDuration: 'farmer.livestock.detail.field.grazingDuration',
  waterSource: 'farmer.livestock.detail.field.waterSource',
  startTime: 'farmer.livestock.detail.field.startTime',
  endTime: 'farmer.livestock.detail.field.endTime',
  feedItems: 'farmer.livestock.detail.field.feedItems',
  housingType: 'farmer.livestock.detail.field.housingType',
  housingName: 'farmer.livestock.detail.field.housingName',
  indoorSpace: 'farmer.livestock.detail.field.indoorSpace',
  outdoorSpace: 'farmer.livestock.detail.field.outdoorSpace',
  startDate: 'farmer.livestock.detail.field.startDate',
  productionDate: 'farmer.livestock.detail.field.productionDate',
  quantity: 'farmer.livestock.detail.field.quantity',
  unit: 'farmer.livestock.detail.field.unit',
  qualityGrade: 'farmer.livestock.detail.field.qualityGrade',
  fatPercent: 'farmer.livestock.detail.field.fatPercent',
  calvingTime: 'farmer.livestock.detail.field.calvingTime',
  fedOn: 'farmer.livestock.detail.field.fedOn',
  activity: 'farmer.livestock.detail.field.activity',
  performedOn: 'farmer.livestock.detail.field.performedOn',
};

const PROBLEM_KEYS: Record<FormProblem, TranslationKey> = {
  required: 'farmer.livestock.detail.error.required',
  invalidDate: 'farmer.livestock.detail.error.invalidDate',
  invalidTime: 'farmer.livestock.detail.error.invalidTime',
  invalidNumber: 'farmer.livestock.detail.error.invalidNumber',
  notPositive: 'farmer.livestock.detail.error.notPositive',
  notWholeNumber: 'farmer.livestock.detail.error.notWholeNumber',
  outOfRange: 'farmer.livestock.detail.error.outOfRange',
  tooLong: 'farmer.livestock.detail.error.tooLong',
  beforeRecordDate: 'farmer.livestock.detail.error.beforeRecordDate',
  beforeStartDate: 'farmer.livestock.detail.error.beforeStartDate',
  unsupportedUnit: 'farmer.livestock.detail.error.unsupportedUnit',
  incomplete: 'farmer.livestock.detail.error.incomplete',
};


export function fieldErrorMessage(error: FieldError): string {
  return t(PROBLEM_KEYS[error.problem], { field: t(FIELD_LABEL_KEYS[error.field]) });
}

// ── Primitive parsers ───────────────────────────────────────────────────────

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12,
};

function isoFromParts(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (year < 1900 || year > 2999 || month < 1 || month > 12 || day < 1) return null;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day > daysInMonth) return null;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function expandYear(raw: string): number {
  const year = parseInt(raw, 10);
  return raw.length === 2 ? 2000 + year : year;
}

/**
 * A free-text date as the farmer typed it -> `YYYY-MM-DD`.
 * Accepts `YYYY-MM-DD`, `DD/MM/YYYY` (also `-` or `.` separated, 2-digit
 * years as 20YY) and `DD Mon YYYY` / `DD Month YYYY`. Day-first, matching
 * every date placeholder on this screen.
 *
 * @returns `undefined` for a blank value, `null` for anything unparseable or
 * not a real calendar date (31/02).
 */
export function parseFormDate(input: string | undefined): string | null | undefined {
  const value = (input ?? '').trim();
  if (value === '') return undefined;
  let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (m) return isoFromParts(parseInt(m[1]!, 10), parseInt(m[2]!, 10), parseInt(m[3]!, 10));
  m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(value);
  if (m) return isoFromParts(expandYear(m[3]!), parseInt(m[2]!, 10), parseInt(m[1]!, 10));
  m = /^(\d{1,2})\s+([A-Za-z]+)\.?,?\s+(\d{2}|\d{4})$/.exec(value);
  if (m) {
    const word = m[2]!.toLowerCase();
    const month = MONTHS[word] ?? MONTHS[word.slice(0, 3)];
    if (month === undefined || (word.length > 4 && !fullMonthMatches(word, month))) return null;
    return isoFromParts(expandYear(m[3]!), month, parseInt(m[1]!, 10));
  }
  return null;
}

const FULL_MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

function fullMonthMatches(word: string, month: number): boolean {
  return FULL_MONTHS[month - 1] === word;
}

/** `H:MM` / `HH:MM` 24-hour -> `HH:MM`; `undefined` when blank, `null` when invalid. */
export function parseFormTime(input: string | undefined): string | null | undefined {
  const value = (input ?? '').trim();
  if (value === '') return undefined;
  const m = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const hours = parseInt(m[1]!, 10);
  const minutes = parseInt(m[2]!, 10);
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, '0')}:${m[2]}`;
}

const DECIMAL = /^\d+(\.\d+)?$/;

function toScaled(value: string): { digits: bigint; scale: number } {
  const [whole, fraction = ''] = value.split('.');
  return { digits: BigInt(`${whole}${fraction}`), scale: fraction.length };
}

/**
 * `value x factor`, both non-negative decimal strings, computed exactly on
 * BigInt digits and rounded half-up to `maxScale` places (3 by default — the
 * server's numeric(10,3) quantity columns). Trailing zeros are trimmed.
 * Returns null when either side is not a plain decimal.
 */
export function scaleDecimal(value: string, factor: string, maxScale = 3): string | null {
  const v = value.trim();
  if (!DECIMAL.test(v) || !DECIMAL.test(factor)) return null;
  const a = toScaled(v);
  const b = toScaled(factor);
  let digits = a.digits * b.digits;
  let scale = a.scale + b.scale;
  if (scale > maxScale) {
    const divisor = 10n ** BigInt(scale - maxScale);
    const quotient = digits / divisor;
    const remainder = digits % divisor;
    digits = remainder * 2n >= divisor ? quotient + 1n : quotient;
    scale = maxScale;
  }
  const raw = digits.toString().padStart(scale + 1, '0');
  const whole = raw.slice(0, raw.length - scale);
  const fraction = raw.slice(raw.length - scale).replace(/0+$/, '');
  return fraction === '' ? whole : `${whole}.${fraction}`;
}

// ── Builder plumbing ────────────────────────────────────────────────────────

const SHORT_TEXT_MAX = 160;
const LONG_TEXT_MAX = 2000;
const BATCH_MAX = 80;
const REASON_MAX = 500;
const GRADE_MAX = 60;
/** numeric(10,3) / numeric(10,2) ceilings — an oversized value is caught here, not as a server 500. */
const QUANTITY_MAX = 9_999_999;

class Collector {
  readonly errors: FieldError[] = [];

  add(field: FormField, problem: FormProblem): void {
    this.errors.push({ field, problem });
  }

  /** Trimmed text, or undefined when blank; flags it when too long. */
  text(field: FormField, raw: string | undefined, max = SHORT_TEXT_MAX): string | undefined {
    const value = (raw ?? '').trim();
    if (value === '') return undefined;
    if (value.length > max) this.add(field, 'tooLong');
    return value;
  }

  requiredText(field: FormField, raw: string | undefined, max = SHORT_TEXT_MAX): string {
    const value = this.text(field, raw, max);
    if (value === undefined) {
      this.add(field, 'required');
      return '';
    }
    return value;
  }

  date(field: FormField, raw: string | undefined): string | undefined {
    const parsed = parseFormDate(raw);
    if (parsed === null) {
      this.add(field, 'invalidDate');
      return undefined;
    }
    return parsed;
  }

  requiredDate(field: FormField, raw: string | undefined): string | undefined {
    const parsed = parseFormDate(raw);
    if (parsed === undefined) this.add(field, 'required');
    else if (parsed === null) this.add(field, 'invalidDate');
    else return parsed;
    return undefined;
  }

  time(field: FormField, raw: string | undefined): string | undefined {
    const parsed = parseFormTime(raw);
    if (parsed === null) {
      this.add(field, 'invalidTime');
      return undefined;
    }
    return parsed;
  }

  /** `later` must be on/after `earlier` (YYYY-MM-DD compares as text). */
  notBefore(field: FormField, later: string | undefined, earlier: string | undefined, problem: FormProblem): void {
    if (later !== undefined && earlier !== undefined && later < earlier) this.add(field, problem);
  }

  /** A decimal value; undefined when blank. */
  decimal(field: FormField, raw: string | undefined): string | undefined {
    const value = (raw ?? '').trim();
    if (value === '') return undefined;
    if (!DECIMAL.test(value)) {
      this.add(field, value.startsWith('-') ? 'notPositive' : 'invalidNumber');
      return undefined;
    }
    return value;
  }

  /**
   * An optional positive measurement. Blank or zero (the forms default the
   * box to "0") means "not measured" and is omitted.
   */
  optionalMeasured<U extends string>(
    field: FormField,
    raw: string | undefined,
    unit: U | undefined,
  ): Measured<U> | undefined {
    const value = this.decimal(field, raw);
    if (value === undefined || Number(value) === 0) return undefined;
    if (Number(value) > QUANTITY_MAX) {
      this.add(field, 'outOfRange');
      return undefined;
    }
    if (unit === undefined) {
      this.add(field, 'unsupportedUnit');
      return undefined;
    }
    return { value: Number(value), unit };
  }

  result<B>(body: B): BuildResult<B> {
    return this.errors.length > 0 ? { ok: false, errors: this.errors } : { ok: true, body };
  }
}

/** Sets `key` only when `value` is defined — the server schemas are strict and reject `null`. */
function put<B extends object, K extends keyof B>(body: B, key: K, value: B[K] | undefined): void {
  if (value !== undefined) body[key] = value;
}

/**
 * The option value the modal holds, if it is one of `table`'s enum values.
 * Anything else (a blank pick, a stale English label) is undefined, so a value
 * the strict server schema would reject is never posted.
 */
function lookup<V extends string>(table: OptionTable<V>, value: string | undefined): V | undefined {
  if (value === undefined) return undefined;
  const v = value.trim();
  return Object.prototype.hasOwnProperty.call(table, v) ? (v as V) : undefined;
}

function yesNo(value: YesNo | undefined): boolean | undefined {
  if (value === 'YES') return true;
  if (value === 'NO') return false;
  return undefined;
}

// ── Option tables: API enum value -> translated label ──────────────────────
//
// Every dropdown / pill in the modals holds the API enum value itself and
// displays `optionLabel(table, value)`. The key order of each table is the
// order the options are offered in. `Record<Enum, TranslationKey>` makes a new
// server enum value a compile error until it gets a label, and a key typo a
// compile error against the en catalogue.

export type OptionTable<V extends string> = Readonly<Record<V, TranslationKey>>;

/** The enum values of `table`, in display order. */
export function optionValues<V extends string>(table: OptionTable<V>): V[] {
  return Object.keys(table) as V[];
}

/** The translated label of `value`; '' for a value the table does not hold (an unset optional pick). */
export function optionLabel<V extends string>(table: OptionTable<V>, value: string): string {
  const v = lookup(table, value);
  return v === undefined ? '' : t(table[v]);
}

export type YesNo = 'YES' | 'NO';
export const YES_NO_OPTIONS: OptionTable<YesNo> = {
  YES: 'farmer.livestock.detail.option.yesNo.YES',
  NO: 'farmer.livestock.detail.option.yesNo.NO',
};

export const HEALTH_RECORD_TYPE_OPTIONS: OptionTable<HealthRecordType> = {
  DEWORMING: 'farmer.livestock.detail.option.healthRecordType.DEWORMING',
  TREATMENT: 'farmer.livestock.detail.option.healthRecordType.TREATMENT',
  VACCINATION: 'farmer.livestock.detail.option.healthRecordType.VACCINATION',
  CHECKUP: 'farmer.livestock.detail.option.healthRecordType.CHECKUP',
};
export const VACCINE_DOSE_UNIT_OPTIONS: OptionTable<VaccineDoseUnit> = {
  ML: 'farmer.livestock.detail.option.unit.ML',
  MG: 'farmer.livestock.detail.option.unit.MG',
  TABLET: 'farmer.livestock.detail.option.unit.TABLET',
  DOSE: 'farmer.livestock.detail.option.unit.DOSE',
  G: 'farmer.livestock.detail.option.unit.G',
};
export const VACCINATION_ROUTE_OPTIONS: OptionTable<VaccinationRoute> = {
  INJECTION_IM: 'farmer.livestock.detail.option.route.INJECTION_IM',
  INJECTION_SC: 'farmer.livestock.detail.option.route.INJECTION_SC',
  ORAL: 'farmer.livestock.detail.option.route.ORAL',
  NASAL: 'farmer.livestock.detail.option.route.NASAL',
};
export const TARGET_PARASITE_OPTIONS: OptionTable<TargetParasite> = {
  INTERNAL_WORMS: 'farmer.livestock.detail.option.targetParasite.INTERNAL_WORMS',
  EXTERNAL_PARASITES: 'farmer.livestock.detail.option.targetParasite.EXTERNAL_PARASITES',
  LIVER_FLUKES: 'farmer.livestock.detail.option.targetParasite.LIVER_FLUKES',
  TAPEWORMS: 'farmer.livestock.detail.option.targetParasite.TAPEWORMS',
  ROUNDWORMS: 'farmer.livestock.detail.option.targetParasite.ROUNDWORMS',
  TICKS_AND_LICE: 'farmer.livestock.detail.option.targetParasite.TICKS_AND_LICE',
};
export const DEWORMING_ROUTE_OPTIONS: OptionTable<DewormingRoute> = {
  ORAL: 'farmer.livestock.detail.option.route.ORAL',
  INJECTION_IM: 'farmer.livestock.detail.option.route.INJECTION_IM',
  INJECTION_SC: 'farmer.livestock.detail.option.route.INJECTION_SC',
  TOPICAL: 'farmer.livestock.detail.option.route.TOPICAL',
  POUR_ON: 'farmer.livestock.detail.option.route.POUR_ON',
  DRENCH: 'farmer.livestock.detail.option.route.DRENCH',
};
export const WEIGHT_UNIT_OPTIONS: OptionTable<WeightUnit> = {
  KG: 'farmer.livestock.detail.unit.KG',
  LB: 'farmer.livestock.detail.option.unit.LB',
};
export const OBSERVED_REACTION_OPTIONS: OptionTable<ObservedReaction> = {
  NONE: 'farmer.livestock.detail.option.observedReaction.NONE',
  MILD_SWELLING: 'farmer.livestock.detail.option.observedReaction.MILD_SWELLING',
  LETHARGY: 'farmer.livestock.detail.option.observedReaction.LETHARGY',
  SALIVATION: 'farmer.livestock.detail.option.observedReaction.SALIVATION',
  ALLERGIC_REACTION: 'farmer.livestock.detail.option.observedReaction.ALLERGIC_REACTION',
};
export const CHECKUP_TYPE_OPTIONS: OptionTable<CheckupType> = {
  ROUTINE: 'farmer.livestock.detail.checkupType.ROUTINE',
  EMERGENCY: 'farmer.livestock.detail.checkupType.EMERGENCY',
  PRE_BREEDING: 'farmer.livestock.detail.checkupType.PRE_BREEDING',
  POST_CALVING: 'farmer.livestock.detail.checkupType.POST_CALVING',
  FOLLOW_UP: 'farmer.livestock.detail.checkupType.FOLLOW_UP',
};
export const TEMPERATURE_UNIT_OPTIONS: OptionTable<TemperatureUnit> = {
  C: 'farmer.livestock.detail.option.unit.CELSIUS',
  F: 'farmer.livestock.detail.option.unit.FAHRENHEIT',
};
export const HEALTH_STATUS_OPTIONS: OptionTable<HealthStatus> = {
  NORMAL: 'farmer.livestock.detail.option.healthStatus.NORMAL',
  MILD_ILLNESS: 'farmer.livestock.detail.option.healthStatus.MILD_ILLNESS',
  MODERATE_ILLNESS: 'farmer.livestock.detail.option.healthStatus.MODERATE_ILLNESS',
  SEVERE: 'farmer.livestock.detail.option.healthStatus.SEVERE',
  CRITICAL: 'farmer.livestock.detail.option.healthStatus.CRITICAL',
};
export const APPETITE_OPTIONS: OptionTable<AppetiteLevel> = {
  NORMAL: 'farmer.livestock.detail.option.appetite.NORMAL',
  REDUCED: 'farmer.livestock.detail.option.appetite.REDUCED',
  VERY_LOW: 'farmer.livestock.detail.option.appetite.VERY_LOW',
  NONE: 'farmer.livestock.detail.option.appetite.NONE',
};
export const TREATMENT_TYPE_OPTIONS: OptionTable<TreatmentType> = {
  MEDICATION: 'farmer.livestock.detail.option.treatmentType.MEDICATION',
  SURGICAL: 'farmer.livestock.detail.option.treatmentType.SURGICAL',
  THERAPY: 'farmer.livestock.detail.option.treatmentType.THERAPY',
  FIRST_AID: 'farmer.livestock.detail.option.treatmentType.FIRST_AID',
  SUPPORTIVE: 'farmer.livestock.detail.option.treatmentType.SUPPORTIVE',
  OTHER: 'farmer.livestock.detail.option.treatmentType.OTHER',
};
export const TREATMENT_DOSAGE_UNIT_OPTIONS: OptionTable<TreatmentDosageUnit> = {
  GRAM: 'farmer.livestock.detail.option.unit.GRAM',
  MG: 'farmer.livestock.detail.option.unit.MG',
  ML: 'farmer.livestock.detail.option.unit.ML',
  TABLET: 'farmer.livestock.detail.option.unit.TABLET',
  DROP: 'farmer.livestock.detail.option.unit.DROP',
};
export const TREATMENT_ROUTE_OPTIONS: OptionTable<TreatmentRoute> = {
  TOPICAL: 'farmer.livestock.detail.option.route.TOPICAL',
  ORAL: 'farmer.livestock.detail.option.route.ORAL',
  INJECTION_IM: 'farmer.livestock.detail.option.route.INJECTION_IM',
  INJECTION_SC: 'farmer.livestock.detail.option.route.INJECTION_SC',
  INTRA_MAMMARY: 'farmer.livestock.detail.option.route.INTRA_MAMMARY',
  EYE_DROPS: 'farmer.livestock.detail.option.route.EYE_DROPS',
};
export const TREATMENT_FREQUENCY_OPTIONS: OptionTable<TreatmentFrequency> = {
  ONCE_DAILY: 'farmer.livestock.detail.option.frequency.ONCE_DAILY',
  TWICE_DAILY: 'farmer.livestock.detail.option.frequency.TWICE_DAILY',
  THRICE_DAILY: 'farmer.livestock.detail.option.frequency.THRICE_DAILY',
  EVERY_6_HOURS: 'farmer.livestock.detail.option.frequency.EVERY_6_HOURS',
  EVERY_8_HOURS: 'farmer.livestock.detail.option.frequency.EVERY_8_HOURS',
  EVERY_12_HOURS: 'farmer.livestock.detail.option.frequency.EVERY_12_HOURS',
  AS_NEEDED: 'farmer.livestock.detail.option.frequency.AS_NEEDED',
};
export const BREEDING_RECORD_TYPE_OPTIONS: OptionTable<BreedingRecordType> = {
  HEAT: 'farmer.livestock.detail.option.breedingRecordType.HEAT',
  INSEMINATION: 'farmer.livestock.detail.option.breedingRecordType.INSEMINATION',
  PREGNANCY_CHECK: 'farmer.livestock.detail.option.breedingRecordType.PREGNANCY_CHECK',
  CALVING: 'farmer.livestock.detail.option.breedingRecordType.CALVING',
};
export const BREEDING_METHOD_OPTIONS: OptionTable<BreedingMethod> = {
  ARTIFICIAL_INSEMINATION: 'farmer.livestock.detail.option.breedingMethod.ARTIFICIAL_INSEMINATION',
  NATURAL_SERVICE: 'farmer.livestock.detail.breedingMethod.NATURAL_SERVICE',
  EMBRYO_TRANSFER: 'farmer.livestock.detail.breedingMethod.EMBRYO_TRANSFER',
};
export const INSEMINATION_TYPE_OPTIONS: OptionTable<InseminationType> = {
  ARTIFICIAL: 'farmer.livestock.detail.option.inseminationType.ARTIFICIAL',
  NATURAL: 'farmer.livestock.detail.option.inseminationType.NATURAL',
};
export const PREGNANCY_CHECK_TYPE_OPTIONS: OptionTable<PregnancyCheckType> = {
  ROUTINE: 'farmer.livestock.detail.option.pregnancyCheckType.ROUTINE',
  CONFIRMATION: 'farmer.livestock.detail.option.pregnancyCheckType.CONFIRMATION',
};
export const PREGNANCY_RESULT_OPTIONS: OptionTable<PregnancyResult> = {
  POSITIVE: 'farmer.livestock.detail.option.pregnancyResult.POSITIVE',
  NEGATIVE: 'farmer.livestock.detail.option.pregnancyResult.NEGATIVE',
  INCONCLUSIVE: 'farmer.livestock.detail.option.pregnancyResult.INCONCLUSIVE',
};
export const EXAMINATION_METHOD_OPTIONS: OptionTable<ExaminationMethod> = {
  ULTRASOUND: 'farmer.livestock.detail.option.examinationMethod.ULTRASOUND',
  RECTAL_PALPATION: 'farmer.livestock.detail.option.examinationMethod.RECTAL_PALPATION',
  BLOOD_TEST: 'farmer.livestock.detail.option.examinationMethod.BLOOD_TEST',
  MILK_PROGESTERONE: 'farmer.livestock.detail.option.examinationMethod.MILK_PROGESTERONE',
};
export const GESTATION_UNIT_OPTIONS: OptionTable<GestationAgeUnit> = {
  MONTHS: 'farmer.livestock.detail.option.gestationUnit.MONTHS',
  WEEKS: 'farmer.livestock.detail.option.gestationUnit.WEEKS',
  DAYS: 'farmer.livestock.detail.option.gestationUnit.DAYS',
};
export const CALVING_OUTCOME_OPTIONS: OptionTable<CalvingOutcome> = {
  LIVE_BIRTH: 'farmer.livestock.detail.calvingOutcome.LIVE_BIRTH',
  STILLBIRTH: 'farmer.livestock.detail.calvingOutcome.STILLBIRTH',
  OTHER: 'farmer.livestock.detail.calvingOutcome.OTHER',
};
export const DELIVERY_TYPE_OPTIONS: OptionTable<DeliveryType> = {
  NORMAL: 'farmer.livestock.detail.option.deliveryType.NORMAL',
  ASSISTED: 'farmer.livestock.detail.option.deliveryType.ASSISTED',
  CAESAREAN: 'farmer.livestock.detail.option.deliveryType.CAESAREAN',
};
export const GENDER_OPTIONS: OptionTable<AnimalGender> = {
  FEMALE: 'farmer.livestock.detail.gender.FEMALE',
  MALE: 'farmer.livestock.detail.gender.MALE',
};
export const FEED_TYPE_OPTIONS: OptionTable<FeedType> = {
  GREEN_FODDER: 'farmer.livestock.detail.feedType.GREEN_FODDER',
  DRY_FODDER: 'farmer.livestock.detail.feedType.DRY_FODDER',
  CONCENTRATE_MIX: 'farmer.livestock.detail.feedType.CONCENTRATE_MIX',
  SILAGE: 'farmer.livestock.detail.feedType.SILAGE',
  MINERAL_MIXTURE: 'farmer.livestock.detail.feedType.MINERAL_MIXTURE',
  PASTURE_GRAZING: 'farmer.livestock.detail.feedType.PASTURE_GRAZING',
};
export const GRAZING_UNIT_OPTIONS: OptionTable<GrazingDurationUnit> = {
  HOURS_PER_DAY: 'farmer.livestock.detail.option.grazingUnit.HOURS_PER_DAY',
  HOURS_PER_WEEK: 'farmer.livestock.detail.option.grazingUnit.HOURS_PER_WEEK',
};
export const WATER_SOURCE_OPTIONS: OptionTable<WaterSource> = {
  BOREWELL: 'farmer.livestock.detail.waterSource.BOREWELL',
  WELL: 'farmer.livestock.detail.waterSource.WELL',
  CANAL: 'farmer.livestock.detail.waterSource.CANAL',
  PIPED_WATER: 'farmer.livestock.detail.waterSource.PIPED_WATER',
  POND_RIVER: 'farmer.livestock.detail.waterSource.POND_RIVER',
  RAINWATER_STORAGE: 'farmer.livestock.detail.waterSource.RAINWATER_STORAGE',
};
export const FEED_ITEM_UNIT_OPTIONS: OptionTable<FeedItemUnit> = {
  KG_PER_DAY: 'farmer.livestock.detail.option.feedItemUnit.KG_PER_DAY',
  G_PER_DAY: 'farmer.livestock.detail.option.feedItemUnit.G_PER_DAY',
  BUNDLES_PER_DAY: 'farmer.livestock.detail.option.feedItemUnit.BUNDLES_PER_DAY',
};
export const FEED_LOG_UNIT_OPTIONS: OptionTable<FeedLogUnit> = {
  KG: 'farmer.livestock.detail.unit.KG',
  G: 'farmer.livestock.detail.unit.G',
  BUNDLES: 'farmer.livestock.detail.unit.BUNDLES',
};
export const HOUSING_TYPE_OPTIONS: OptionTable<HousingType> = {
  BARN: 'farmer.livestock.detail.housingType.BARN',
  OPEN_SHED: 'farmer.livestock.detail.housingType.OPEN_SHED',
  PASTURE_FREE_RANGE: 'farmer.livestock.detail.housingType.PASTURE_FREE_RANGE',
  COOP_PEN: 'farmer.livestock.detail.housingType.COOP_PEN',
  STALL: 'farmer.livestock.detail.housingType.STALL',
};
export const SPACE_UNIT_OPTIONS: OptionTable<SpaceUnit> = {
  SQ_FT: 'farmer.livestock.detail.spaceUnit.SQ_FT',
  SQ_M: 'farmer.livestock.detail.spaceUnit.SQ_M',
  ACRES: 'farmer.livestock.detail.spaceUnit.ACRES',
};
export const SESSION_OPTIONS: OptionTable<ProductionSession> = {
  MORNING: 'farmer.livestock.detail.session.MORNING',
  AFTERNOON: 'farmer.livestock.detail.session.AFTERNOON',
  EVENING: 'farmer.livestock.detail.session.EVENING',
  NIGHT: 'farmer.livestock.detail.session.NIGHT',
};

// Production-form pickers with no API enum. The chosen option's translated
// label is what gets stored (as `qualityGrade` text or a labelled note line),
// so the record reads in the language the farmer picked it in.

export const MILK_GRADE_OPTIONS: OptionTable<'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'PREMIUM'> = {
  GRADE_A: 'farmer.livestock.detail.option.milkGrade.GRADE_A',
  GRADE_B: 'farmer.livestock.detail.option.milkGrade.GRADE_B',
  GRADE_C: 'farmer.livestock.detail.option.milkGrade.GRADE_C',
  PREMIUM: 'farmer.livestock.detail.option.milkGrade.PREMIUM',
};
export const MILK_APPEARANCE_OPTIONS: OptionTable<'NORMAL' | 'YELLOWISH' | 'WATERY' | 'BLOOD_TINGED' | 'CLOTS_FLAKES'> = {
  NORMAL: 'farmer.livestock.detail.option.milkAppearance.NORMAL',
  YELLOWISH: 'farmer.livestock.detail.option.milkAppearance.YELLOWISH',
  WATERY: 'farmer.livestock.detail.option.milkAppearance.WATERY',
  BLOOD_TINGED: 'farmer.livestock.detail.option.milkAppearance.BLOOD_TINGED',
  CLOTS_FLAKES: 'farmer.livestock.detail.option.milkAppearance.CLOTS_FLAKES',
};
/** Eggs are collected morning to evening only (no NIGHT option). */
export const EGG_SESSION_OPTIONS: OptionTable<'MORNING' | 'AFTERNOON' | 'EVENING'> = {
  MORNING: 'farmer.livestock.detail.session.MORNING',
  AFTERNOON: 'farmer.livestock.detail.session.AFTERNOON',
  EVENING: 'farmer.livestock.detail.session.EVENING',
};
export const EGG_GRADE_OPTIONS: OptionTable<'A_LARGE' | 'A_MEDIUM' | 'B' | 'SMALL_PULLET'> = {
  A_LARGE: 'farmer.livestock.detail.option.eggGrade.A_LARGE',
  A_MEDIUM: 'farmer.livestock.detail.option.eggGrade.A_MEDIUM',
  B: 'farmer.livestock.detail.option.eggGrade.B',
  SMALL_PULLET: 'farmer.livestock.detail.option.eggGrade.SMALL_PULLET',
};
export const EGG_SHELL_OPTIONS: OptionTable<'CLEAN_NORMAL' | 'DIRTY' | 'THIN' | 'CRACKED' | 'ROUGH_MISSHAPEN'> = {
  CLEAN_NORMAL: 'farmer.livestock.detail.option.eggShell.CLEAN_NORMAL',
  DIRTY: 'farmer.livestock.detail.option.eggShell.DIRTY',
  THIN: 'farmer.livestock.detail.option.eggShell.THIN',
  CRACKED: 'farmer.livestock.detail.option.eggShell.CRACKED',
  ROUGH_MISSHAPEN: 'farmer.livestock.detail.option.eggShell.ROUGH_MISSHAPEN',
};
export const MEAT_CUT_OPTIONS: OptionTable<'WHOLE_CARCASS' | 'PRIMAL' | 'BONELESS' | 'GROUND_MINCE'> = {
  WHOLE_CARCASS: 'farmer.livestock.detail.option.meatCut.WHOLE_CARCASS',
  PRIMAL: 'farmer.livestock.detail.option.meatCut.PRIMAL',
  BONELESS: 'farmer.livestock.detail.option.meatCut.BONELESS',
  GROUND_MINCE: 'farmer.livestock.detail.option.meatCut.GROUND_MINCE',
};
export const MEAT_GRADE_OPTIONS: OptionTable<'PRIME' | 'CHOICE' | 'STANDARD' | 'ORGANIC_CERTIFIED'> = {
  PRIME: 'farmer.livestock.detail.option.meatGrade.PRIME',
  CHOICE: 'farmer.livestock.detail.option.meatGrade.CHOICE',
  STANDARD: 'farmer.livestock.detail.option.meatGrade.STANDARD',
  ORGANIC_CERTIFIED: 'farmer.livestock.detail.option.meatGrade.ORGANIC_CERTIFIED',
};
export const WOOL_SHEARING_OPTIONS: OptionTable<'SPRING' | 'AUTUMN' | 'FULL_FLEECE' | 'CRUTCHING'> = {
  SPRING: 'farmer.livestock.detail.option.woolShearing.SPRING',
  AUTUMN: 'farmer.livestock.detail.option.woolShearing.AUTUMN',
  FULL_FLEECE: 'farmer.livestock.detail.option.woolShearing.FULL_FLEECE',
  CRUTCHING: 'farmer.livestock.detail.option.woolShearing.CRUTCHING',
};
export const WOOL_GRADE_OPTIONS: OptionTable<'FINE' | 'MEDIUM' | 'COARSE' | 'CROSSBRED'> = {
  FINE: 'farmer.livestock.detail.option.woolGrade.FINE',
  MEDIUM: 'farmer.livestock.detail.option.woolGrade.MEDIUM',
  COARSE: 'farmer.livestock.detail.option.woolGrade.COARSE',
  CROSSBRED: 'farmer.livestock.detail.option.woolGrade.CROSSBRED',
};
export const WOOL_CONDITION_OPTIONS: OptionTable<'CLEAN_SOUND' | 'VEGETABLE_MATTER' | 'STAINED_TENDER' | 'GREASY'> = {
  CLEAN_SOUND: 'farmer.livestock.detail.option.woolCondition.CLEAN_SOUND',
  VEGETABLE_MATTER: 'farmer.livestock.detail.option.woolCondition.VEGETABLE_MATTER',
  STAINED_TENDER: 'farmer.livestock.detail.option.woolCondition.STAINED_TENDER',
  GREASY: 'farmer.livestock.detail.option.woolCondition.GREASY',
};
export const MANURE_COLLECTION_OPTIONS: OptionTable<'DAILY_SCRAPINGS' | 'DEEP_LITTER' | 'COMPOSTED' | 'SLURRY'> = {
  DAILY_SCRAPINGS: 'farmer.livestock.detail.option.manureCollection.DAILY_SCRAPINGS',
  DEEP_LITTER: 'farmer.livestock.detail.option.manureCollection.DEEP_LITTER',
  COMPOSTED: 'farmer.livestock.detail.option.manureCollection.COMPOSTED',
  SLURRY: 'farmer.livestock.detail.option.manureCollection.SLURRY',
};
export const MANURE_MOISTURE_OPTIONS: OptionTable<'DRY' | 'SEMI_DRY' | 'WET'> = {
  DRY: 'farmer.livestock.detail.option.manureMoisture.DRY',
  SEMI_DRY: 'farmer.livestock.detail.option.manureMoisture.SEMI_DRY',
  WET: 'farmer.livestock.detail.option.manureMoisture.WET',
};
export const MANURE_COMPOST_OPTIONS: OptionTable<'RAW' | 'PARTIAL' | 'CURED' | 'VERMICOMPOST'> = {
  RAW: 'farmer.livestock.detail.option.manureCompost.RAW',
  PARTIAL: 'farmer.livestock.detail.option.manureCompost.PARTIAL',
  CURED: 'farmer.livestock.detail.option.manureCompost.CURED',
  VERMICOMPOST: 'farmer.livestock.detail.option.manureCompost.VERMICOMPOST',
};

/** Every option table, for the i18n parity test (FORM_I18N_KEYS). */
const ALL_OPTION_TABLES: ReadonlyArray<OptionTable<string>> = [
  YES_NO_OPTIONS,
  HEALTH_RECORD_TYPE_OPTIONS,
  VACCINE_DOSE_UNIT_OPTIONS,
  VACCINATION_ROUTE_OPTIONS,
  TARGET_PARASITE_OPTIONS,
  DEWORMING_ROUTE_OPTIONS,
  WEIGHT_UNIT_OPTIONS,
  OBSERVED_REACTION_OPTIONS,
  CHECKUP_TYPE_OPTIONS,
  TEMPERATURE_UNIT_OPTIONS,
  HEALTH_STATUS_OPTIONS,
  APPETITE_OPTIONS,
  TREATMENT_TYPE_OPTIONS,
  TREATMENT_DOSAGE_UNIT_OPTIONS,
  TREATMENT_ROUTE_OPTIONS,
  TREATMENT_FREQUENCY_OPTIONS,
  BREEDING_RECORD_TYPE_OPTIONS,
  BREEDING_METHOD_OPTIONS,
  INSEMINATION_TYPE_OPTIONS,
  PREGNANCY_CHECK_TYPE_OPTIONS,
  PREGNANCY_RESULT_OPTIONS,
  EXAMINATION_METHOD_OPTIONS,
  GESTATION_UNIT_OPTIONS,
  CALVING_OUTCOME_OPTIONS,
  DELIVERY_TYPE_OPTIONS,
  GENDER_OPTIONS,
  FEED_TYPE_OPTIONS,
  GRAZING_UNIT_OPTIONS,
  WATER_SOURCE_OPTIONS,
  FEED_ITEM_UNIT_OPTIONS,
  FEED_LOG_UNIT_OPTIONS,
  HOUSING_TYPE_OPTIONS,
  SPACE_UNIT_OPTIONS,
  SESSION_OPTIONS,
  MILK_GRADE_OPTIONS,
  MILK_APPEARANCE_OPTIONS,
  EGG_SESSION_OPTIONS,
  EGG_GRADE_OPTIONS,
  EGG_SHELL_OPTIONS,
  MEAT_CUT_OPTIONS,
  MEAT_GRADE_OPTIONS,
  WOOL_SHEARING_OPTIONS,
  WOOL_GRADE_OPTIONS,
  WOOL_CONDITION_OPTIONS,
  MANURE_COLLECTION_OPTIONS,
  MANURE_MOISTURE_OPTIONS,
  MANURE_COMPOST_OPTIONS,
];

// Builder-side aliases (the tables above are the single source).
const VACCINE_DOSE_UNITS = VACCINE_DOSE_UNIT_OPTIONS;
const VACCINATION_ROUTES = VACCINATION_ROUTE_OPTIONS;
const TARGET_PARASITES = TARGET_PARASITE_OPTIONS;
const DEWORMING_ROUTES = DEWORMING_ROUTE_OPTIONS;
const WEIGHT_UNITS = WEIGHT_UNIT_OPTIONS;
const OBSERVED_REACTIONS = OBSERVED_REACTION_OPTIONS;
const CHECKUP_TYPES = CHECKUP_TYPE_OPTIONS;
const TEMPERATURE_UNITS = TEMPERATURE_UNIT_OPTIONS;
const HEALTH_STATUSES = HEALTH_STATUS_OPTIONS;
const APPETITE_LEVELS = APPETITE_OPTIONS;
const TREATMENT_TYPES = TREATMENT_TYPE_OPTIONS;
const TREATMENT_DOSAGE_UNITS = TREATMENT_DOSAGE_UNIT_OPTIONS;
const TREATMENT_ROUTES = TREATMENT_ROUTE_OPTIONS;
const TREATMENT_FREQUENCIES = TREATMENT_FREQUENCY_OPTIONS;
const BREEDING_METHODS = BREEDING_METHOD_OPTIONS;
const INSEMINATION_TYPES = INSEMINATION_TYPE_OPTIONS;
const PREGNANCY_CHECK_TYPES = PREGNANCY_CHECK_TYPE_OPTIONS;
const PREGNANCY_RESULTS = PREGNANCY_RESULT_OPTIONS;
const EXAMINATION_METHODS = EXAMINATION_METHOD_OPTIONS;
const CALVING_OUTCOMES = CALVING_OUTCOME_OPTIONS;
const DELIVERY_TYPES = DELIVERY_TYPE_OPTIONS;
const GENDERS = GENDER_OPTIONS;
const FEED_TYPES = FEED_TYPE_OPTIONS;
const GRAZING_UNITS = GRAZING_UNIT_OPTIONS;
const WATER_SOURCES = WATER_SOURCE_OPTIONS;
const FEED_ITEM_UNITS = FEED_ITEM_UNIT_OPTIONS;
const HOUSING_TYPES = HOUSING_TYPE_OPTIONS;
const SPACE_UNITS = SPACE_UNIT_OPTIONS;
const SESSIONS = SESSION_OPTIONS;

// ── Health records ──────────────────────────────────────────────────────────

export interface VaccinationForm {
  recordDate?: string;
  veterinarian?: string;
  vaccineName?: string;
  dose?: string;
  doseUnit?: string;
  route?: string;
  batchNumber?: string;
  nextDueDate?: string;
  notes?: string;
}

export function buildVaccinationBody(form: VaccinationForm): BuildResult<CreateVaccinationBody> {
  const c = new Collector();
  const recordDate = c.requiredDate('recordDate', form.recordDate);
  const body: CreateVaccinationBody = {
    recordType: 'VACCINATION',
    recordDate: recordDate ?? '',
    vaccineName: c.requiredText('vaccineName', form.vaccineName),
  };
  put(body, 'veterinarian', c.text('veterinarian', form.veterinarian));
  put(body, 'dose', c.optionalMeasured('dose', form.dose, lookup(VACCINE_DOSE_UNITS, form.doseUnit)));
  put(body, 'route', lookup(VACCINATION_ROUTES, form.route));
  put(body, 'batchNumber', c.text('batchNumber', form.batchNumber, BATCH_MAX));
  const next = c.date('nextDueDate', form.nextDueDate);
  c.notBefore('nextDueDate', next, recordDate, 'beforeRecordDate');
  put(body, 'nextDueDate', next);
  put(body, 'notes', c.text('notes', form.notes, LONG_TEXT_MAX));
  return c.result(body);
}

export interface DewormingForm {
  recordDate?: string;
  productName?: string;
  activeIngredient?: string;
  targetParasite?: string;
  dose?: string;
  doseUnit?: string;
  route?: string;
  animalWeight?: string;
  weightUnit?: string;
  batchNumber?: string;
  expiryDate?: string;
  administeredBy?: string;
  nextDueDate?: string;
  observedReaction?: string;
  notes?: string;
}

export function buildDewormingBody(form: DewormingForm): BuildResult<CreateDewormingBody> {
  const c = new Collector();
  const recordDate = c.requiredDate('recordDate', form.recordDate);
  const body: CreateDewormingBody = {
    recordType: 'DEWORMING',
    recordDate: recordDate ?? '',
    productName: c.requiredText('productName', form.productName),
  };
  put(body, 'activeIngredient', c.text('activeIngredient', form.activeIngredient));
  put(body, 'targetParasite', lookup(TARGET_PARASITES, form.targetParasite));
  put(body, 'dose', c.optionalMeasured('dose', form.dose, lookup(VACCINE_DOSE_UNITS, form.doseUnit)));
  put(body, 'route', lookup(DEWORMING_ROUTES, form.route));
  put(body, 'animalWeight', c.optionalMeasured('animalWeight', form.animalWeight, lookup(WEIGHT_UNITS, form.weightUnit)));
  put(body, 'batchNumber', c.text('batchNumber', form.batchNumber, BATCH_MAX));
  put(body, 'expiryDate', c.date('expiryDate', form.expiryDate));
  put(body, 'administeredBy', c.text('administeredBy', form.administeredBy));
  const next = c.date('nextDueDate', form.nextDueDate);
  c.notBefore('nextDueDate', next, recordDate, 'beforeRecordDate');
  put(body, 'nextDueDate', next);
  put(body, 'observedReaction', lookup(OBSERVED_REACTIONS, form.observedReaction));
  put(body, 'notes', c.text('notes', form.notes, LONG_TEXT_MAX));
  return c.result(body);
}

export interface CheckupForm {
  recordDate?: string;
  time?: string;
  checkupType?: string;
  veterinarian?: string;
  clinic?: string;
  bodyTemp?: string;
  bodyTempUnit?: string;
  bodyWeight?: string;
  bodyWeightUnit?: string;
  healthStatus?: string;
  appetite?: string;
  activityLevel?: string;
  symptoms?: string;
  findings?: string;
  diagnosis?: string;
  treatmentRequired?: YesNo;
  followUpRequired?: YesNo;
  followUpDate?: string;
  recommendedActions?: string;
}

export function buildCheckupBody(form: CheckupForm): BuildResult<CreateCheckupBody> {
  const c = new Collector();
  const recordDate = c.requiredDate('recordDate', form.recordDate);
  const checkupTime = c.time('recordTime', form.time);
  const checkupType = lookup(CHECKUP_TYPES, form.checkupType);
  if (checkupType === undefined) c.add('checkupType', 'required');
  const body: CreateCheckupBody = {
    recordType: 'CHECKUP',
    recordDate: recordDate ?? '',
    checkupType: checkupType ?? 'ROUTINE',
    veterinarian: c.requiredText('veterinarian', form.veterinarian),
    clinic: c.requiredText('clinic', form.clinic),
  };
  put(body, 'checkupTime', checkupTime);
  put(
    body,
    'bodyTemperature',
    c.optionalMeasured('bodyTemperature', form.bodyTemp, lookup(TEMPERATURE_UNITS, form.bodyTempUnit)),
  );
  put(body, 'bodyWeight', c.optionalMeasured('bodyWeight', form.bodyWeight, lookup(WEIGHT_UNITS, form.bodyWeightUnit)));
  put(body, 'healthStatus', lookup(HEALTH_STATUSES, form.healthStatus));
  put(body, 'appetite', lookup(APPETITE_LEVELS, form.appetite));
  put(body, 'activityLevel', c.text('activityLevel', form.activityLevel));
  put(body, 'symptoms', c.text('symptoms', form.symptoms, LONG_TEXT_MAX));
  put(body, 'findings', c.text('findings', form.findings, LONG_TEXT_MAX));
  put(body, 'diagnosis', c.text('diagnosis', form.diagnosis, LONG_TEXT_MAX));
  put(body, 'treatmentRequired', yesNo(form.treatmentRequired));
  const followUp = yesNo(form.followUpRequired);
  put(body, 'followUpRequired', followUp);
  if (followUp === true) {
    const followUpDate = c.requiredDate('followUpDate', form.followUpDate);
    c.notBefore('followUpDate', followUpDate, recordDate, 'beforeRecordDate');
    put(body, 'followUpDate', followUpDate);
  }
  put(body, 'recommendedActions', c.text('recommendedActions', form.recommendedActions, LONG_TEXT_MAX));
  return c.result(body);
}

export interface TreatmentForm {
  recordDate?: string;
  treatmentType?: string;
  condition?: string;
  symptoms?: string;
  description?: string;
  medicineName?: string;
  dosage?: string;
  dosageUnit?: string;
  route?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  milkWithdrawalRequired?: YesNo;
  milkWithdrawalStart?: string;
  milkWithdrawalEnd?: string;
  withdrawalReason?: string;
  meatWithdrawalRequired?: YesNo;
  meatWithdrawalEnd?: string;
  prescribedBy?: string;
  administeredBy?: string;
  notes?: string;
}

export function buildTreatmentBody(form: TreatmentForm): BuildResult<CreateTreatmentBody> {
  const c = new Collector();
  const recordDate = c.requiredDate('recordDate', form.recordDate);
  const body: CreateTreatmentBody = {
    recordType: 'TREATMENT',
    recordDate: recordDate ?? '',
    condition: c.requiredText('condition', form.condition),
    description: c.requiredText('description', form.description, LONG_TEXT_MAX),
  };
  put(body, 'treatmentType', lookup(TREATMENT_TYPES, form.treatmentType));
  put(body, 'symptoms', c.text('symptoms', form.symptoms, LONG_TEXT_MAX));
  put(body, 'medicineName', c.text('medicineName', form.medicineName));
  put(body, 'dosage', c.optionalMeasured('dosage', form.dosage, lookup(TREATMENT_DOSAGE_UNITS, form.dosageUnit)));
  put(body, 'route', lookup(TREATMENT_ROUTES, form.route));
  put(body, 'frequency', lookup(TREATMENT_FREQUENCIES, form.frequency));
  const medStart = c.date('medicationStartDate', form.startDate);
  const medEnd = c.date('medicationEndDate', form.endDate);
  c.notBefore('medicationEndDate', medEnd, medStart, 'beforeStartDate');
  put(body, 'medicationStartDate', medStart);
  put(body, 'medicationEndDate', medEnd);
  const reason = c.text('withdrawalReason', form.withdrawalReason, REASON_MAX);
  if (form.milkWithdrawalRequired === 'YES') {
    // BR-137: both ends of the milk window are required.
    const start = c.requiredDate('milkWithdrawalStart', form.milkWithdrawalStart);
    const end = c.requiredDate('milkWithdrawalEnd', form.milkWithdrawalEnd);
    c.notBefore('milkWithdrawalEnd', end, start, 'beforeStartDate');
    c.notBefore('milkWithdrawalEnd', end, recordDate, 'beforeRecordDate');
    if (start !== undefined && end !== undefined) {
      body.milkWithdrawal = reason === undefined ? { startDate: start, endDate: end } : { startDate: start, endDate: end, reason };
    }
  }
  if (form.meatWithdrawalRequired === 'YES') {
    // A meat window may state only when it ends (BR-137).
    const end = c.requiredDate('meatWithdrawalEnd', form.meatWithdrawalEnd);
    c.notBefore('meatWithdrawalEnd', end, recordDate, 'beforeRecordDate');
    if (end !== undefined) body.meatWithdrawal = { endDate: end };
  }
  put(body, 'prescribedBy', c.text('prescribedBy', form.prescribedBy));
  put(body, 'administeredBy', c.text('administeredBy', form.administeredBy));
  put(body, 'notes', c.text('notes', form.notes, LONG_TEXT_MAX));
  return c.result(body);
}

/** True when this treatment body moves the animal's withdrawal date (BR-137), so the animal must be re-fetched. */
export function treatmentHasWithdrawal(body: CreateTreatmentBody): boolean {
  return body.milkWithdrawal !== undefined || body.meatWithdrawal !== undefined;
}

// ── Breeding records (BR-138: FEMALE animals only) ──────────────────────────

export interface HeatForm {
  recordDate?: string;
  breedingMethod?: string;
  sire?: string;
  semenStrawRef?: string;
  technician?: string;
  heatSigns?: string;
}

export function buildHeatBody(form: HeatForm): BuildResult<CreateHeatBody> {
  const c = new Collector();
  const recordDate = c.requiredDate('recordDate', form.recordDate);
  const breedingMethod = lookup(BREEDING_METHODS, form.breedingMethod);
  if (breedingMethod === undefined) c.add('breedingMethod', 'required');
  const body: CreateHeatBody = {
    recordType: 'HEAT',
    recordDate: recordDate ?? '',
    breedingMethod: breedingMethod ?? 'ARTIFICIAL_INSEMINATION',
    sire: c.requiredText('sire', form.sire),
  };
  put(body, 'semenStrawRef', c.text('semenStrawRef', form.semenStrawRef));
  put(body, 'technician', c.text('technician', form.technician));
  put(body, 'heatSigns', c.text('heatSigns', form.heatSigns, LONG_TEXT_MAX));
  return c.result(body);
}

export interface InseminationForm {
  recordDate?: string;
  time?: string;
  inseminationType?: string;
  location?: string;
  technician?: string;
  heatSigns?: string;
}

export function buildInseminationBody(form: InseminationForm): BuildResult<CreateInseminationBody> {
  const c = new Collector();
  const recordDate = c.requiredDate('recordDate', form.recordDate);
  const body: CreateInseminationBody = {
    recordType: 'INSEMINATION',
    recordDate: recordDate ?? '',
    inseminationType: lookup(INSEMINATION_TYPES, form.inseminationType) ?? 'ARTIFICIAL',
  };
  put(body, 'inseminationTime', c.time('inseminationTime', form.time));
  put(body, 'location', c.text('location', form.location));
  put(body, 'technician', c.text('technician', form.technician));
  put(body, 'heatSigns', c.text('heatSigns', form.heatSigns, LONG_TEXT_MAX));
  return c.result(body);
}

export interface PregnancyCheckForm {
  recordDate?: string;
  checkType?: string;
  result?: string;
  examinationMethod?: string;
  location?: string;
  expectedDeliveryDate?: string;
  nextCheckDate?: string;
  findings?: string;
}

export function buildPregnancyCheckBody(form: PregnancyCheckForm): BuildResult<CreatePregnancyCheckBody> {
  const c = new Collector();
  const recordDate = c.requiredDate('recordDate', form.recordDate);
  const expected = c.date('expectedDeliveryDate', form.expectedDeliveryDate);
  c.notBefore('expectedDeliveryDate', expected, recordDate, 'beforeRecordDate');
  const nextCheck = c.requiredDate('nextCheckDate', form.nextCheckDate);
  c.notBefore('nextCheckDate', nextCheck, recordDate, 'beforeRecordDate');
  const body: CreatePregnancyCheckBody = {
    recordType: 'PREGNANCY_CHECK',
    recordDate: recordDate ?? '',
    checkType: lookup(PREGNANCY_CHECK_TYPES, form.checkType) ?? 'ROUTINE',
    result: lookup(PREGNANCY_RESULTS, form.result) ?? 'INCONCLUSIVE',
    examinationMethod: lookup(EXAMINATION_METHODS, form.examinationMethod) ?? 'ULTRASOUND',
    nextCheckDate: nextCheck ?? '',
  };
  put(body, 'location', c.text('location', form.location));
  put(body, 'expectedDeliveryDate', expected);
  put(body, 'findings', c.text('findings', form.findings, LONG_TEXT_MAX));
  return c.result(body);
}

export interface CalvingForm {
  recordDate?: string;
  /** Optional `H:MM` / `HH:MM` 24-hour; sent as `calvingTime` HH:MM (server regex ^([01]\d|2[0-3]):[0-5]\d$). */
  time?: string;
  outcome?: string;
  offspringCount?: string;
  deliveryType?: string;
  offspringName?: string;
  offspringGender?: string;
  birthWeight?: string;
  birthWeightUnit?: string;
  findings?: string;
}

export function buildCalvingBody(form: CalvingForm): BuildResult<CreateCalvingBody> {
  const c = new Collector();
  const recordDate = c.requiredDate('recordDate', form.recordDate);
  const outcome = lookup(CALVING_OUTCOMES, form.outcome);
  const body: CreateCalvingBody = {
    recordType: 'CALVING',
    recordDate: recordDate ?? '',
    outcome: outcome ?? 'OTHER',
  };
  put(body, 'calvingTime', c.time('calvingTime', form.time));
  const count = c.decimal('offspringCount', form.offspringCount);
  if (count !== undefined) {
    if (!/^\d+$/.test(count)) c.add('offspringCount', 'notWholeNumber');
    else if (Number(count) > 20) c.add('offspringCount', 'outOfRange');
    else body.offspringCount = Number(count);
  }
  put(body, 'deliveryType', lookup(DELIVERY_TYPES, form.deliveryType));
  put(body, 'offspringName', c.text('offspringName', form.offspringName));
  put(body, 'offspringGender', lookup(GENDERS, form.offspringGender));
  put(body, 'birthWeight', c.optionalMeasured('birthWeight', form.birthWeight, lookup(WEIGHT_UNITS, form.birthWeightUnit)));
  put(body, 'findings', c.text('findings', form.findings, LONG_TEXT_MAX));
  return c.result(body);
}

// ── Feed plan ───────────────────────────────────────────────────────────────

export interface FeedPlanForm {
  planName?: string;
  feedType?: string;
  source?: string;
  grazingDuration?: string;
  grazingUnit?: string;
  waterSource?: string;
  startTime?: string;
  endTime?: string;
  items?: ReadonlyArray<{ name: string; amount: string; unit: string }>;
  notes?: string;
}

export function buildFeedPlanBody(form: FeedPlanForm): BuildResult<CreateFeedPlanBody> {
  const c = new Collector();
  const feedType = lookup(FEED_TYPES, form.feedType);
  if (feedType === undefined) c.add('feedType', 'required');
  const waterSource = lookup(WATER_SOURCES, form.waterSource);
  if (waterSource === undefined) c.add('waterSource', 'required');
  const body: CreateFeedPlanBody = {
    feedType: feedType ?? 'GREEN_FODDER',
    waterSource: waterSource ?? 'BOREWELL',
  };
  put(body, 'planName', c.text('planName', form.planName));
  put(body, 'source', c.text('feedSource', form.source));
  const grazingUnit = lookup(GRAZING_UNITS, form.grazingUnit);
  const grazing = c.optionalMeasured('grazingDuration', form.grazingDuration, grazingUnit);
  if (grazing !== undefined) {
    // 168 = hours in a week; a day caps at 24 (server refine on createFeedPlanBody).
    const ceiling = grazing.unit === 'HOURS_PER_DAY' ? 24 : 168;
    if (grazing.value > ceiling) c.add('grazingDuration', 'outOfRange');
    else body.grazingDuration = grazing;
  }
  put(body, 'startTime', c.time('startTime', form.startTime));
  put(body, 'endTime', c.time('endTime', form.endTime));
  const items: CreateFeedPlanBody['items'] = [];
  let incomplete = false;
  for (const item of form.items ?? []) {
    const name = item.name.trim();
    const amount = item.amount.trim();
    if (name === '' && amount === '') continue; // an untouched row
    const unit = lookup(FEED_ITEM_UNITS, item.unit);
    if (name === '' || amount === '' || unit === undefined) {
      incomplete = true;
      continue;
    }
    if (name.length > SHORT_TEXT_MAX) c.add('feedItems', 'tooLong');
    if (!DECIMAL.test(amount) || Number(amount) <= 0) {
      c.add('feedItems', 'notPositive');
      continue;
    }
    items.push({ name, amount: Number(amount), unit });
  }
  if (incomplete) c.add('feedItems', 'incomplete');
  if (items.length > 20) c.add('feedItems', 'outOfRange');
  if (items.length > 0) body.items = items;
  put(body, 'notes', c.text('notes', form.notes, LONG_TEXT_MAX));
  return c.result(body);
}

// ── Feed log ("Daily feed log") ─────────────────────────────────────────────

export interface FeedLogForm {
  fedOn?: string;
  feedType?: string;
  quantity?: string;
  unit?: string;
  notes?: string;
}

/**
 * POST .../feed-logs (createFeedLogBody): feedType and unit are enums, quantity
 * a positive number <= 9,999,999 (numeric(10,3)). `fedOn` is optional on the
 * server (it defaults to today); the modal pre-fills today and requires a date,
 * so the farmer always sees which day is being logged.
 */
export function buildFeedLogBody(form: FeedLogForm): BuildResult<CreateFeedLogBody> {
  const c = new Collector();
  const fedOn = c.requiredDate('fedOn', form.fedOn);
  const feedType = lookup(FEED_TYPES, form.feedType);
  if (feedType === undefined) c.add('feedType', 'required');
  const unit = lookup(FEED_LOG_UNIT_OPTIONS, form.unit);
  if (unit === undefined) c.add('unit', 'required');

  let quantity = 0;
  const raw = c.decimal('quantity', form.quantity);
  if (raw === undefined) {
    if ((form.quantity ?? '').trim() === '') c.add('quantity', 'required');
  } else if (Number(raw) <= 0) c.add('quantity', 'notPositive');
  else if (Number(raw) > QUANTITY_MAX) c.add('quantity', 'outOfRange');
  else quantity = Number(raw);

  const body: CreateFeedLogBody = {
    feedType: feedType ?? 'GREEN_FODDER',
    quantity,
    unit: unit ?? 'KG',
  };
  put(body, 'fedOn', fedOn);
  put(body, 'notes', c.text('notes', form.notes, LONG_TEXT_MAX));
  return c.result(body);
}

// ── Hygiene log ─────────────────────────────────────────────────────────────

export interface HygieneLogForm {
  activity?: string;
  performedOn?: string;
  notes?: string;
}

/**
 * POST .../hygiene-logs (createHygieneLogBody): activity is 1-160 chars;
 * `performedOn` is optional on the server, pre-filled and required here for
 * the same reason as `fedOn`.
 */
export function buildHygieneLogBody(form: HygieneLogForm): BuildResult<CreateHygieneLogBody> {
  const c = new Collector();
  const activity = c.requiredText('activity', form.activity);
  const performedOn = c.requiredDate('performedOn', form.performedOn);
  const body: CreateHygieneLogBody = { activity };
  put(body, 'performedOn', performedOn);
  put(body, 'notes', c.text('notes', form.notes, LONG_TEXT_MAX));
  return c.result(body);
}

// ── Housing record ──────────────────────────────────────────────────────────

export interface HousingForm {
  housingType?: string;
  housingName?: string;
  location?: string;
  indoorSpace?: string;
  indoorUnit?: string;
  outdoorSpace?: string;
  outdoorUnit?: string;
  startDate?: string;
  notes?: string;
}

export function buildHousingRecordBody(form: HousingForm): BuildResult<CreateHousingRecordBody> {
  const c = new Collector();
  const housingType = lookup(HOUSING_TYPES, form.housingType);
  if (housingType === undefined) c.add('housingType', 'required');
  const housingName = c.requiredText('housingName', form.housingName);
  const location = c.text('location', form.location);

  const indoorUnit = lookup(SPACE_UNITS, form.indoorUnit) ?? 'SQ_FT';
  const indoor = c.decimal('indoorSpace', form.indoorSpace);
  let indoorValue = 0;
  if (indoor === undefined) {
    if ((form.indoorSpace ?? '').trim() === '') c.add('indoorSpace', 'required');
  } else if (Number(indoor) <= 0) c.add('indoorSpace', 'notPositive');
  else if (Number(indoor) > QUANTITY_MAX * 10) c.add('indoorSpace', 'outOfRange');
  else indoorValue = Number(indoor);

  const outdoorUnit = lookup(SPACE_UNITS, form.outdoorUnit) ?? 'SQ_FT';
  const outdoor = c.decimal('outdoorSpace', form.outdoorSpace);
  let outdoorValue = 0;
  if (outdoor === undefined) {
    if ((form.outdoorSpace ?? '').trim() === '') c.add('outdoorSpace', 'required');
  } else if (Number(outdoor) > QUANTITY_MAX * 10) c.add('outdoorSpace', 'outOfRange');
  else outdoorValue = Number(outdoor);

  const startDate = c.requiredDate('startDate', form.startDate);
  const body: CreateHousingRecordBody = {
    housingType: housingType ?? 'BARN',
    housingName,
    indoorSpacePerAnimal: { value: indoorValue, unit: indoorUnit },
    outdoorSpace: { value: outdoorValue, unit: outdoorUnit },
    startDate: startDate ?? '',
  };
  put(body, 'location', location);
  put(body, 'notes', c.text('notes', form.notes, LONG_TEXT_MAX));
  return c.result(body);
}

// ── Production log ──────────────────────────────────────────────────────────

/** The production modal's product picker — the five products a single animal yields, as API enum values. */
export type ProductionFormType = 'MILK' | 'EGGS' | 'MEAT' | 'WOOL' | 'MANURE';

export const PRODUCTION_TYPE_OPTIONS: OptionTable<ProductionFormType> = {
  MILK: 'farmer.livestock.detail.product.MILK',
  EGGS: 'farmer.livestock.detail.product.EGGS',
  MEAT: 'farmer.livestock.detail.product.MEAT',
  WOOL: 'farmer.livestock.detail.product.WOOL',
  MANURE: 'farmer.livestock.detail.product.MANURE',
};

/** The units the production modal can offer (each one has an exact factor below). */
export type ProductionFormUnit = 'L' | 'ML' | 'PIECES' | 'TRAYS_30' | 'KG' | 'LB' | 'TONNE';

export const PRODUCTION_UNIT_LABELS: OptionTable<ProductionFormUnit> = {
  L: 'farmer.livestock.detail.unit.LITERS',
  ML: 'farmer.livestock.detail.option.unit.ML',
  PIECES: 'farmer.livestock.detail.option.unit.PIECES',
  TRAYS_30: 'farmer.livestock.detail.option.unit.TRAYS_30',
  KG: 'farmer.livestock.detail.unit.KG',
  LB: 'farmer.livestock.detail.option.unit.LB',
  TONNE: 'farmer.livestock.detail.option.unit.TONNE',
};

/**
 * The exact factor from each UI unit to the product's fixed server unit
 * (PRODUCTION_PRODUCT_UNITS). A unit missing here has no exact conversion
 * (milk by weight depends on density; a "bag" or "crate" has no defined size)
 * and is refused rather than guessed.
 */
const UNIT_FACTORS: Record<ProductionFormType, Partial<Record<ProductionFormUnit, string>>> = {
  MILK: { L: '1', ML: '0.001' },
  EGGS: { PIECES: '1', TRAYS_30: '30' },
  MEAT: { KG: '1', LB: '0.45359237' },
  WOOL: { KG: '1', LB: '0.45359237' },
  MANURE: { KG: '1', TONNE: '1000' },
};

/** Unit options the production modal offers — only units with an exact conversion. */
export const PRODUCTION_UNIT_OPTIONS: Record<ProductionFormType, ProductionFormUnit[]> = {
  MILK: Object.keys(UNIT_FACTORS.MILK) as ProductionFormUnit[],
  EGGS: Object.keys(UNIT_FACTORS.EGGS) as ProductionFormUnit[],
  MEAT: Object.keys(UNIT_FACTORS.MEAT) as ProductionFormUnit[],
  WOOL: Object.keys(UNIT_FACTORS.WOOL) as ProductionFormUnit[],
  MANURE: Object.keys(UNIT_FACTORS.MANURE) as ProductionFormUnit[],
};

export interface ProductionForm {
  animalId: string;
  productionType: ProductionFormType;
  date?: string;
  quantity?: string;
  unit?: string;
  /** MILK / EGGS only — the other products have no collection session. */
  session?: string;
  qualityGrade?: string;
  /** MILK only (the server rejects it on other products). */
  fatPercent?: string;
  restrictedFromSale: boolean;
  notes?: string;
  /** Form-only attributes with no API field (appearance, shell quality ...), kept as note lines. */
  details: ReadonlyArray<{ label: string; value: string }>;
}

export function buildProductionLogBody(form: ProductionForm): BuildResult<CreateProductionLogBody> {
  const c = new Collector();
  const productType: ProductionProductType = form.productionType;
  const loggedOn = c.requiredDate('productionDate', form.date);

  let quantity: number | undefined;
  const rawQuantity = c.decimal('quantity', form.quantity);
  if (rawQuantity === undefined) {
    if ((form.quantity ?? '').trim() === '') c.add('quantity', 'required');
  } else {
    const unitCode = lookup(PRODUCTION_UNIT_LABELS, form.unit);
    const factor = unitCode === undefined ? undefined : UNIT_FACTORS[form.productionType][unitCode];
    if (factor === undefined) c.add('unit', 'unsupportedUnit');
    else {
      const converted = scaleDecimal(rawQuantity, factor);
      if (converted === null || Number(converted) <= 0) c.add('quantity', 'notPositive');
      else if (productType === 'EGGS' && !/^\d+$/.test(converted)) c.add('quantity', 'notWholeNumber');
      else if (Number(converted) > QUANTITY_MAX) c.add('quantity', 'outOfRange');
      else quantity = Number(converted);
    }
  }

  const body: CreateProductionLogBody = {
    animalId: form.animalId,
    productType,
    quantity: quantity ?? 0,
    unit: PRODUCTION_PRODUCT_UNITS[productType],
    loggedOn: loggedOn ?? '',
  };
  if (form.productionType === 'MILK' || form.productionType === 'EGGS') {
    put(body, 'session', lookup(SESSIONS, form.session));
  }
  put(body, 'qualityGrade', c.text('qualityGrade', form.qualityGrade, GRADE_MAX));
  if (form.productionType === 'MILK') {
    const fat = c.decimal('fatPercent', form.fatPercent);
    if (fat !== undefined) {
      const rounded = scaleDecimal(fat, '1', 2);
      if (rounded === null || Number(rounded) > 100) c.add('fatPercent', 'outOfRange');
      else body.fatPercent = Number(rounded);
    }
  }
  body.restrictedFromSale = form.restrictedFromSale;
  const noteLines = [
    (form.notes ?? '').trim(),
    ...form.details.filter((d) => d.value.trim() !== '').map((d) => `${d.label}: ${d.value.trim()}`),
  ].filter((line) => line !== '');
  if (noteLines.length > 0) {
    const notes = noteLines.join('\n');
    if (notes.length > LONG_TEXT_MAX) c.add('notes', 'tooLong');
    body.notes = notes;
  }
  return c.result(body);
}

// ── i18n ────────────────────────────────────────────────────────────────────

/** Every key this module can resolve — exported for the i18n parity test. */
export const FORM_I18N_KEYS: readonly TranslationKey[] = [
  ...Object.values(FIELD_LABEL_KEYS),
  ...Object.values(PROBLEM_KEYS),
  ...[...ALL_OPTION_TABLES, PRODUCTION_TYPE_OPTIONS, PRODUCTION_UNIT_LABELS].flatMap(
    (table) => Object.values(table) as TranslationKey[],
  ),
];
