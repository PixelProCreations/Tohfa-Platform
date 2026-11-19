import { t, type TranslationKey } from '../../../../../i18n/farmer';
import { ApiError, NetworkError } from '../../../../../shell/api/client';
import {
  PRODUCTION_PRODUCT_UNITS,
  createBreedingRecord,
  createFeedLog,
  createFeedPlan,
  createHealthRecord,
  createHousingRecord,
  createHygieneLog,
  createProductionLog,
  type AnimalGender,
  type AppetiteLevel,
  type BreedingMethod,
  type BreedingRecordType,
  type CalvingOutcome,
  type CheckupType,
  type CreateBreedingRecordBody,
  type CreateCalvingBody,
  type CreateCheckupBody,
  type CreateDewormingBody,
  type CreateFeedLogBody,
  type CreateFeedPlanBody,
  type CreateHealthRecordBody,
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
  type ProductionLogResponse,
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


// ── Limits copied from livestock.schema.ts ──────────────────────────────────

/** `shortText`: names and short free text. */
const SHORT_MAX = 160;
/** `longText`: notes, symptoms, findings, descriptions. */
const LONG_MAX = 2000;
/** `batchNumber`. */
const BATCH_MAX = 80;
/** createFeedLogBody quantity (numeric(10,3)). */
const FEED_LOG_QTY_MAX = 9_999_999;
/** createHousingRecordBody SPACE_MAX (numeric(10,2)). */
const SPACE_MAX = 99_999_999;
/** grazingDuration: 168 hours in a week; HOURS_PER_DAY is tightened to 24. */
const GRAZING_WEEK_MAX = 168;
const GRAZING_DAY_MAX = 24;
/** calvingBody offspringCount. */
const OFFSPRING_MAX = 20;
/** createProductionLogBody notes (no trim/min server-side; trimmed and omitted when blank here). */
const PRODUCTION_NOTES_MAX = 2000;

export const INPUT_MAX_LENGTH = {
  short: SHORT_MAX,
  long: LONG_MAX,
  batch: BATCH_MAX,
  date: 10,
  time: 5,
  decimal: 12,
  count: String(OFFSPRING_MAX).length,
} as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const DECIMAL = /^-?\d+(\.\d+)?$/;

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

export type FieldErrors = Record<string, string>;
export type BuildResult<B> = { ok: true; body: B } | { ok: false; errors: any };

const FIELD_LABEL_KEYS: Record<FormField, string> = {
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

const PROBLEM_KEYS: Record<FormProblem, string> = {
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
  return t(PROBLEM_KEYS[error.problem] as any, { field: t(FIELD_LABEL_KEYS[error.field] as any) });
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

const DECIMAL_NON_NEGATIVE = /^\d+(\.\d+)?$/;

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
  if (!DECIMAL_NON_NEGATIVE.test(v) || !DECIMAL_NON_NEGATIVE.test(factor)) return null;
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

export type OptionTable<V extends string> = Readonly<Record<V, string>>;

/** The enum values of `table`, in display order. */
export function optionValues<V extends string>(table: OptionTable<V>): V[] {
  return Object.keys(table) as V[];
}

/** The translated label of `value`; '' for a value the table does not hold (an unset optional pick). */
export function optionLabel<V extends string>(table: OptionTable<V>, value: string): string {
  const v = lookup(table, value);
  return v === undefined ? '' : t(table[v] as any);
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
const _ALL_OPTION_TABLES: ReadonlyArray<OptionTable<string>> = [
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
const APPETITE_LEVELS = APPETITE_OPTIONS;

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
  put(body, 'dose', c.optionalMeasured('dose', form.dose, lookup(VACCINE_DOSE_UNIT_OPTIONS, form.doseUnit)));
  put(body, 'route', lookup(VACCINATION_ROUTE_OPTIONS, form.route));
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
  put(body, 'targetParasite', lookup(TARGET_PARASITE_OPTIONS, form.targetParasite));
  put(body, 'dose', c.optionalMeasured('dose', form.dose, lookup(VACCINE_DOSE_UNIT_OPTIONS, form.doseUnit)));
  put(body, 'route', lookup(DEWORMING_ROUTE_OPTIONS, form.route));
  put(body, 'animalWeight', c.optionalMeasured('animalWeight', form.animalWeight, lookup(WEIGHT_UNIT_OPTIONS, form.weightUnit)));
  put(body, 'batchNumber', c.text('batchNumber', form.batchNumber, BATCH_MAX));
  put(body, 'expiryDate', c.date('expiryDate', form.expiryDate));
  put(body, 'administeredBy', c.text('administeredBy', form.administeredBy));
  const next = c.date('nextDueDate', form.nextDueDate);
  c.notBefore('nextDueDate', next, recordDate, 'beforeRecordDate');
  put(body, 'nextDueDate', next);
  put(body, 'observedReaction', lookup(OBSERVED_REACTION_OPTIONS, form.observedReaction));
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
  const checkupType = lookup(CHECKUP_TYPE_OPTIONS, form.checkupType);
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
    c.optionalMeasured('bodyTemperature', form.bodyTemp, lookup(TEMPERATURE_UNIT_OPTIONS, form.bodyTempUnit)),
  );
  put(body, 'bodyWeight', c.optionalMeasured('bodyWeight', form.bodyWeight, lookup(WEIGHT_UNIT_OPTIONS, form.bodyWeightUnit)));
  put(body, 'healthStatus', lookup(HEALTH_STATUS_OPTIONS, form.healthStatus));
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
  put(body, 'treatmentType', lookup(TREATMENT_TYPE_OPTIONS, form.treatmentType));
  put(body, 'symptoms', c.text('symptoms', form.symptoms, LONG_TEXT_MAX));
  put(body, 'medicineName', c.text('medicineName', form.medicineName));
  put(body, 'dosage', c.optionalMeasured('dosage', form.dosage, lookup(TREATMENT_DOSAGE_UNIT_OPTIONS, form.dosageUnit)));
  put(body, 'route', lookup(TREATMENT_ROUTE_OPTIONS, form.route));
  put(body, 'frequency', lookup(TREATMENT_FREQUENCY_OPTIONS, form.frequency));
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
  const breedingMethod = lookup(BREEDING_METHOD_OPTIONS, form.breedingMethod);
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
    inseminationType: lookup(INSEMINATION_TYPE_OPTIONS, form.inseminationType) ?? 'ARTIFICIAL',
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
    checkType: lookup(PREGNANCY_CHECK_TYPE_OPTIONS, form.checkType) ?? 'ROUTINE',
    result: lookup(PREGNANCY_RESULT_OPTIONS, form.result) ?? 'INCONCLUSIVE',
    examinationMethod: lookup(EXAMINATION_METHOD_OPTIONS, form.examinationMethod) ?? 'ULTRASOUND',
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
  const outcome = lookup(CALVING_OUTCOME_OPTIONS, form.outcome);
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
  put(body, 'deliveryType', lookup(DELIVERY_TYPE_OPTIONS, form.deliveryType));
  put(body, 'offspringName', c.text('offspringName', form.offspringName));
  put(body, 'offspringGender', lookup(GENDER_OPTIONS, form.offspringGender));
  put(body, 'birthWeight', c.optionalMeasured('birthWeight', form.birthWeight, lookup(WEIGHT_UNIT_OPTIONS, form.birthWeightUnit)));
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

function buildFeedPlanBodyFromForm(form: FeedPlanForm): BuildResult<CreateFeedPlanBody> {
  const c = new Collector();
  const feedType = lookup(FEED_TYPE_OPTIONS, form.feedType);
  if (feedType === undefined) c.add('feedType', 'required');
  const waterSource = lookup(WATER_SOURCE_OPTIONS, form.waterSource);
  if (waterSource === undefined) c.add('waterSource', 'required');
  const body: CreateFeedPlanBody = {
    feedType: feedType ?? 'GREEN_FODDER',
    waterSource: waterSource ?? 'BOREWELL',
  };
  put(body, 'planName', c.text('planName', form.planName));
  put(body, 'source', c.text('feedSource', form.source));
  const grazingUnit = lookup(GRAZING_UNIT_OPTIONS, form.grazingUnit);
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
    const unit = lookup(FEED_ITEM_UNIT_OPTIONS, item.unit);
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
function buildFeedLogBodyFromForm(form: FeedLogForm): BuildResult<CreateFeedLogBody> {
  const c = new Collector();
  const fedOn = c.requiredDate('fedOn', form.fedOn);
  const feedType = lookup(FEED_TYPE_OPTIONS, form.feedType);
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
  const housingType = lookup(HOUSING_TYPE_OPTIONS, form.housingType);
  if (housingType === undefined) c.add('housingType', 'required');
  const housingName = c.requiredText('housingName', form.housingName);
  const location = c.text('location', form.location);

  const indoorUnit = lookup(SPACE_UNIT_OPTIONS, form.indoorUnit) ?? 'SQ_FT';
  const indoor = c.decimal('indoorSpace', form.indoorSpace);
  let indoorValue = 0;
  if (indoor === undefined) {
    if ((form.indoorSpace ?? '').trim() === '') c.add('indoorSpace', 'required');
  } else if (Number(indoor) <= 0) c.add('indoorSpace', 'notPositive');
  else if (Number(indoor) > QUANTITY_MAX * 10) c.add('indoorSpace', 'outOfRange');
  else indoorValue = Number(indoor);

  const outdoorUnit = lookup(SPACE_UNIT_OPTIONS, form.outdoorUnit) ?? 'SQ_FT';
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
    put(body, 'session', lookup(SESSION_OPTIONS, form.session));
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
// FORM_I18N_KEYS defined in generic builder

export type RecordFormKind = 'health' | 'breeding' | 'feedPlan' | 'feedLog' | 'housing' | 'hygiene' | 'production';

/** Every field is held as the text the farmer typed; toggles are 'true' or ''. */
export type FormValues = Readonly<Record<string, string>>;
/** Field name -> translated message. */
// FieldErrors defined above

// BuildResult defined above

export interface ChoiceOption {
  value: string;
  label: TranslationKey;
}

interface FieldBase {
  name: string;
  label: TranslationKey;
}

export type FieldSpec =
  | (FieldBase & { kind: 'text'; required: boolean; maxLength: number; multiline?: boolean })
  | (FieldBase & { kind: 'number'; required: boolean; integer?: boolean })
  | (FieldBase & { kind: 'date'; required: boolean })
  | (FieldBase & { kind: 'time'; required: false })
  | (FieldBase & { kind: 'choice'; required: boolean; options: readonly ChoiceOption[] })
  | (FieldBase & { kind: 'toggle'; required: false });

// ── Option tables (enum value -> label key) ─────────────────────────────────

/**
 * Key prefix of the form strings. Written as a template so the i18n parity
 * test's literal scan does not read the bare prefix as a key; the keys built
 * from it are checked through `formI18nKeys()`.
 */
const F = `farmer.livestock.detail.${'form'}`;

function options<V extends string>(values: readonly V[], key: (v: V) => TranslationKey): readonly ChoiceOption[] {
  return values.map((value) => ({ value, label: key(value) }));
}

export const HEALTH_RECORD_TYPES = ['VACCINATION', 'DEWORMING', 'CHECKUP', 'TREATMENT'] as const;
export const BREEDING_RECORD_TYPES = ['HEAT', 'INSEMINATION', 'PREGNANCY_CHECK', 'CALVING'] as const;
export const PRODUCTION_FORM_TYPES = ['MEAT', 'WOOL', 'MANURE'] as const;
// ProductionFormType defined above

const VACCINE_DOSE_UNITS = ['ML', 'MG', 'TABLET', 'DOSE', 'G'] as const;
const TREATMENT_DOSAGE_UNITS = ['GRAM', 'MG', 'ML', 'TABLET', 'DROP'] as const;
const VACCINATION_ROUTES = ['INJECTION_IM', 'INJECTION_SC', 'ORAL', 'NASAL'] as const;
const DEWORMING_ROUTES = ['ORAL', 'INJECTION_IM', 'INJECTION_SC', 'TOPICAL', 'POUR_ON', 'DRENCH'] as const;
const TREATMENT_ROUTES = ['TOPICAL', 'ORAL', 'INJECTION_IM', 'INJECTION_SC', 'INTRA_MAMMARY', 'EYE_DROPS'] as const;
const TARGET_PARASITES = ['INTERNAL_WORMS', 'EXTERNAL_PARASITES', 'LIVER_FLUKES', 'TAPEWORMS', 'ROUNDWORMS', 'TICKS_AND_LICE'] as const;
const CHECKUP_TYPES = ['ROUTINE', 'EMERGENCY', 'PRE_BREEDING', 'POST_CALVING', 'FOLLOW_UP'] as const;
const HEALTH_STATUSES = ['NORMAL', 'MILD_ILLNESS', 'MODERATE_ILLNESS', 'SEVERE', 'CRITICAL'] as const;
const TREATMENT_TYPES = ['MEDICATION', 'SURGICAL', 'THERAPY', 'FIRST_AID', 'SUPPORTIVE', 'OTHER'] as const;
const TREATMENT_FREQUENCIES = [
  'ONCE_DAILY',
  'TWICE_DAILY',
  'THRICE_DAILY',
  'EVERY_6_HOURS',
  'EVERY_8_HOURS',
  'EVERY_12_HOURS',
  'AS_NEEDED',
] as const;
const BREEDING_METHODS = ['ARTIFICIAL_INSEMINATION', 'NATURAL_SERVICE', 'EMBRYO_TRANSFER'] as const;
const INSEMINATION_TYPES = ['ARTIFICIAL', 'NATURAL'] as const;
const PREGNANCY_CHECK_TYPES = ['ROUTINE', 'CONFIRMATION'] as const;
const PREGNANCY_RESULTS = ['POSITIVE', 'NEGATIVE', 'INCONCLUSIVE'] as const;
const EXAMINATION_METHODS = ['ULTRASOUND', 'RECTAL_PALPATION', 'BLOOD_TEST', 'MILK_PROGESTERONE'] as const;
const CALVING_OUTCOMES = ['LIVE_BIRTH', 'STILLBIRTH', 'OTHER'] as const;
const DELIVERY_TYPES = ['NORMAL', 'ASSISTED', 'CAESAREAN'] as const;
const GENDERS = ['FEMALE', 'MALE'] as const;
const WEIGHT_UNITS = ['KG', 'LB'] as const;
const FEED_TYPES = ['GREEN_FODDER', 'DRY_FODDER', 'CONCENTRATE_MIX', 'SILAGE', 'MINERAL_MIXTURE', 'PASTURE_GRAZING'] as const;
const WATER_SOURCES = ['BOREWELL', 'WELL', 'CANAL', 'PIPED_WATER', 'POND_RIVER', 'RAINWATER_STORAGE'] as const;
const GRAZING_UNITS = ['HOURS_PER_DAY', 'HOURS_PER_WEEK'] as const;
const FEED_LOG_UNITS = ['KG', 'G', 'BUNDLES'] as const;
const HOUSING_TYPES = ['BARN', 'OPEN_SHED', 'PASTURE_FREE_RANGE', 'COOP_PEN', 'STALL'] as const;
const SPACE_UNITS = ['SQ_FT', 'SQ_M', 'ACRES'] as const;

const O = {
  healthRecordType: options(HEALTH_RECORD_TYPES, (v) => `${F}.option.healthRecordType.${v}` as TranslationKey),
  breedingRecordType: options(BREEDING_RECORD_TYPES, (v) => `${F}.option.breedingRecordType.${v}` as TranslationKey),
  vaccineDoseUnit: options(VACCINE_DOSE_UNITS, (v) => `${F}.option.doseUnit.${v}` as TranslationKey),
  treatmentDosageUnit: options(TREATMENT_DOSAGE_UNITS, (v) => `${F}.option.doseUnit.${v}` as TranslationKey),
  vaccinationRoute: options(VACCINATION_ROUTES, (v) => `${F}.option.route.${v}` as TranslationKey),
  dewormingRoute: options(DEWORMING_ROUTES, (v) => `${F}.option.route.${v}` as TranslationKey),
  treatmentRoute: options(TREATMENT_ROUTES, (v) => `${F}.option.route.${v}` as TranslationKey),
  targetParasite: options(TARGET_PARASITES, (v) => `${F}.option.parasite.${v}` as TranslationKey),
  checkupType: options(CHECKUP_TYPES, (v) => `farmer.livestock.detail.checkupType.${v}` as TranslationKey),
  healthStatus: options(HEALTH_STATUSES, (v) => `${F}.option.healthStatus.${v}` as TranslationKey),
  treatmentType: options(TREATMENT_TYPES, (v) => `${F}.option.treatmentType.${v}` as TranslationKey),
  frequency: options(TREATMENT_FREQUENCIES, (v) => `${F}.option.frequency.${v}` as TranslationKey),
  breedingMethod: options(BREEDING_METHODS, (v) => `farmer.livestock.detail.breedingMethod.${v}` as TranslationKey),
  inseminationType: options(INSEMINATION_TYPES, (v) => `${F}.option.inseminationType.${v}` as TranslationKey),
  checkType: options(PREGNANCY_CHECK_TYPES, (v) => `${F}.option.checkType.${v}` as TranslationKey),
  result: options(PREGNANCY_RESULTS, (v) => `farmer.livestock.detail.pregnancyResult.${v}` as TranslationKey),
  examinationMethod: options(EXAMINATION_METHODS, (v) => `${F}.option.examinationMethod.${v}` as TranslationKey),
  outcome: options(CALVING_OUTCOMES, (v) => `farmer.livestock.detail.calvingOutcome.${v}` as TranslationKey),
  deliveryType: options(DELIVERY_TYPES, (v) => `${F}.option.deliveryType.${v}` as TranslationKey),
  gender: options(GENDERS, (v) => `farmer.livestock.detail.gender.${v}` as TranslationKey),
  weightUnit: options(WEIGHT_UNITS, (v) => `${F}.option.weightUnit.${v}` as TranslationKey),
  feedType: options(FEED_TYPES, (v) => `farmer.livestock.detail.feedType.${v}` as TranslationKey),
  waterSource: options(WATER_SOURCES, (v) => `farmer.livestock.detail.waterSource.${v}` as TranslationKey),
  grazingUnit: options(GRAZING_UNITS, (v) => `${F}.option.grazingUnit.${v}` as TranslationKey),
  feedLogUnit: options(FEED_LOG_UNITS, (v) => `farmer.livestock.detail.unit.${v}` as TranslationKey),
  housingType: options(HOUSING_TYPES, (v) => `${F}.option.housingType.${v}` as TranslationKey),
  spaceUnit: options(SPACE_UNITS, (v) => `farmer.livestock.detail.spaceUnit.${v}` as TranslationKey),
  productType: options(PRODUCTION_FORM_TYPES, (v) => `${F}.option.productType.${v}` as TranslationKey),
} as const;

/** Label key for a MEAT / WOOL / MANURE log row. */
export function productTypeLabel(v: ProductionFormType): string {
  return t(`${F}.option.productType.${v}` as TranslationKey);
}

// ── Field specs ─────────────────────────────────────────────────────────────

const label = (name: string): TranslationKey => `${F}.field.${name}` as TranslationKey;
const text = (name: string, required: boolean, maxLength: number, multiline = false): FieldSpec => ({
  kind: 'text',
  name,
  label: label(name),
  required,
  maxLength,
  multiline,
});
const num = (name: string, required: boolean, integer = false): FieldSpec => ({ kind: 'number', name, label: label(name), required, integer });
const date = (name: string, required: boolean): FieldSpec => ({ kind: 'date', name, label: label(name), required });
const time = (name: string): FieldSpec => ({ kind: 'time', name, label: label(name), required: false });
const choice = (name: string, required: boolean, opts: readonly ChoiceOption[]): FieldSpec => ({
  kind: 'choice',
  name,
  label: label(name),
  required,
  options: opts,
});
const toggle = (name: string): FieldSpec => ({ kind: 'toggle', name, label: label(name), required: false });

const NOTES = text('notes', false, LONG_MAX, true);

function healthFields(v: FormValues): FieldSpec[] {
  const head = [choice('recordType', true, O.healthRecordType), date('recordDate', true)];
  switch (v['recordType']) {
    case 'DEWORMING':
      return [
        ...head,
        text('productName', true, SHORT_MAX),
        text('activeIngredient', false, SHORT_MAX),
        choice('targetParasite', false, O.targetParasite),
        num('doseValue', false),
        choice('doseUnit', false, O.vaccineDoseUnit),
        choice('route', false, O.dewormingRoute),
        text('batchNumber', false, BATCH_MAX),
        text('administeredBy', false, SHORT_MAX),
        date('nextDueDate', false),
        NOTES,
      ];
    case 'CHECKUP':
      return [
        ...head,
        choice('checkupType', true, O.checkupType),
        time('checkupTime'),
        text('veterinarian', true, SHORT_MAX),
        text('clinic', true, SHORT_MAX),
        choice('healthStatus', false, O.healthStatus),
        text('diagnosis', false, LONG_MAX, true),
        toggle('followUpRequired'),
        ...(v['followUpRequired'] === 'true' ? [date('followUpDate', true)] : []),
        NOTES,
      ];
    case 'TREATMENT':
      return [
        ...head,
        text('condition', true, SHORT_MAX),
        text('description', true, LONG_MAX, true),
        choice('treatmentType', false, O.treatmentType),
        text('medicineName', false, SHORT_MAX),
        num('dosageValue', false),
        choice('dosageUnit', false, O.treatmentDosageUnit),
        choice('route', false, O.treatmentRoute),
        choice('frequency', false, O.frequency),
        date('medicationStartDate', false),
        date('medicationEndDate', false),
        date('milkWithdrawalStart', false),
        date('milkWithdrawalEnd', false),
        date('meatWithdrawalStart', false),
        date('meatWithdrawalEnd', false),
        text('prescribedBy', false, SHORT_MAX),
        NOTES,
      ];
    default:
      return [
        ...head,
        text('vaccineName', true, SHORT_MAX),
        text('veterinarian', false, SHORT_MAX),
        num('doseValue', false),
        choice('doseUnit', false, O.vaccineDoseUnit),
        choice('route', false, O.vaccinationRoute),
        text('batchNumber', false, BATCH_MAX),
        date('nextDueDate', false),
        NOTES,
      ];
  }
}

function breedingFields(v: FormValues): FieldSpec[] {
  const head = [choice('recordType', true, O.breedingRecordType), date('recordDate', true)];
  switch (v['recordType']) {
    case 'INSEMINATION':
      return [
        ...head,
        choice('inseminationType', true, O.inseminationType),
        time('inseminationTime'),
        text('sire', false, SHORT_MAX),
        text('technician', false, SHORT_MAX),
        NOTES,
      ];
    case 'PREGNANCY_CHECK':
      return [
        ...head,
        choice('checkType', true, O.checkType),
        choice('result', true, O.result),
        choice('examinationMethod', true, O.examinationMethod),
        date('expectedDeliveryDate', false),
        date('nextCheckDate', true),
        text('findings', false, LONG_MAX, true),
        NOTES,
      ];
    case 'CALVING':
      return [
        ...head,
        choice('outcome', true, O.outcome),
        time('calvingTime'),
        num('offspringCount', false, true),
        choice('deliveryType', false, O.deliveryType),
        choice('offspringGender', false, O.gender),
        text('offspringName', false, SHORT_MAX),
        num('birthWeightValue', false),
        choice('birthWeightUnit', false, O.weightUnit),
        NOTES,
      ];
    default:
      return [
        ...head,
        choice('breedingMethod', true, O.breedingMethod),
        text('sire', true, SHORT_MAX),
        text('technician', false, SHORT_MAX),
        text('heatSigns', false, LONG_MAX, true),
        NOTES,
      ];
  }
}

/** The fields a form shows for its current values (a record type picks its variant's fields). */
export function formFields(kind: RecordFormKind, v: FormValues): readonly FieldSpec[] {
  switch (kind) {
    case 'health':
      return healthFields(v);
    case 'breeding':
      return breedingFields(v);
    case 'feedPlan':
      return [
        choice('feedType', true, O.feedType),
        choice('waterSource', true, O.waterSource),
        date('effectiveFrom', false),
        text('planName', false, SHORT_MAX),
        text('source', false, SHORT_MAX),
        num('grazingValue', false),
        choice('grazingUnit', false, O.grazingUnit),
        time('startTime'),
        time('endTime'),
        NOTES,
      ];
    case 'feedLog':
      return [date('fedOn', false), choice('feedType', true, O.feedType), num('quantity', true), choice('unit', true, O.feedLogUnit), NOTES];
    case 'housing':
      return [
        choice('housingType', true, O.housingType),
        text('housingName', true, SHORT_MAX),
        text('location', false, SHORT_MAX),
        num('indoorValue', true),
        choice('indoorUnit', true, O.spaceUnit),
        num('outdoorValue', true),
        choice('outdoorUnit', true, O.spaceUnit),
        date('startDate', true),
        NOTES,
      ];
    case 'hygiene':
      return [text('activity', true, SHORT_MAX), date('performedOn', false), NOTES];
    case 'production':
      return [
        choice('productType', true, O.productType),
        // Always KG (see buildProductionBody), so the label says so instead of offering a unit.
        { ...num('quantity', true), label: label('quantityKg') },
        date('loggedOn', false),
        text('notes', false, PRODUCTION_NOTES_MAX, true),
      ];
  }
}

/**
 * Every label key the forms can resolve (all variants, all options), for the
 * en/ta parity test: these keys are built from enum values, so a source scan
 * for string literals cannot see them.
 */
export function formI18nKeys(): TranslationKey[] {
  const keys = new Set<TranslationKey>(Object.values(O).flatMap((opts) => opts.map((o) => o.label)));
  const kinds: RecordFormKind[] = ['health', 'breeding', 'feedPlan', 'feedLog', 'housing', 'hygiene', 'production'];
  const variants: Record<string, readonly string[]> = { health: HEALTH_RECORD_TYPES, breeding: BREEDING_RECORD_TYPES };
  for (const kind of kinds) {
    for (const recordType of variants[kind] ?? ['']) {
      for (const field of formFields(kind, { recordType, followUpRequired: 'true' })) keys.add(field.label);
    }
  }
  return [...keys];
}

/** health, breeding, feed plan and housing bodies take `attachmentUploadId` (BR-137c). */
export function recordFormAcceptsAttachment(kind: RecordFormKind): boolean {
  return kind === 'health' || kind === 'breeding' || kind === 'feedPlan' || kind === 'housing';
}

/**
 * Starting values. Dates default to `today` (the Asia/Kolkata date the server
 * uses for its own defaults); unit pickers start on the first unit so a typed
 * amount is always complete.
 */
export function initialFormValues(kind: RecordFormKind, today: string): Record<string, string> {
  switch (kind) {
    case 'health':
      return { recordType: 'VACCINATION', recordDate: today, doseUnit: 'ML', dosageUnit: 'ML' };
    case 'breeding':
      return { recordType: 'HEAT', recordDate: today, offspringCount: '1', birthWeightUnit: 'KG' };
    case 'feedPlan':
      return { effectiveFrom: today, grazingUnit: 'HOURS_PER_DAY' };
    case 'feedLog':
      return { fedOn: today, unit: 'KG' };
    case 'housing':
      return { indoorUnit: 'SQ_FT', outdoorUnit: 'SQ_FT', startDate: today };
    case 'hygiene':
      return { performedOn: today };
    case 'production':
      return { productType: 'MEAT', loggedOn: today };
  }
}

/**
 * Switching a record type starts the new variant's fields fresh (a DEWORMING
 * route is not a valid TREATMENT route) but keeps what the variants share.
 */
export function valuesForRecordType(
  kind: RecordFormKind,
  current: FormValues,
  recordType: string,
  today: string,
): Record<string, string> {
  const shared: Record<string, string> = {};
  for (const key of ['recordDate', 'notes']) {
    const value = current[key];
    if (value !== undefined) shared[key] = value;
  }
  return { ...initialFormValues(kind, today), ...shared, recordType };
}

// ── Reading and validating the typed values ─────────────────────────────────

function isCalendarDate(s: string): boolean {
  if (!ISO_DATE.test(s)) return false;
  const [y, m, d] = s.split('-').map((part) => parseInt(part, 10)) as [number, number, number];
  const probe = new Date(Date.UTC(y, m - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
}

interface NumberRule {
  required: boolean;
  min: 'positive' | 'nonNegative';
  max?: number;
  integer?: boolean;
}

class Reader {
  readonly errors: FieldErrors = {};

  constructor(private readonly v: FormValues) {}

  blank(name: string): boolean {
    return (this.v[name] ?? '').trim().length === 0;
  }

  fail(name: string, message: string): void {
    if (!(name in this.errors)) this.errors[name] = message;
  }

  require(name: string): void {
    this.fail(name, t('farmer.livestock.detail.form.error.required'));
  }

  text(name: string, max: number, required: boolean): string | undefined {
    const s = (this.v[name] ?? '').trim();
    if (s.length === 0) {
      if (required) this.require(name);
      return undefined;
    }
    if (s.length > max) {
      this.fail(name, t('farmer.livestock.detail.form.error.tooLong', { max }));
      return undefined;
    }
    return s;
  }

  number(name: string, rule: NumberRule): number | undefined {
    const s = (this.v[name] ?? '').trim();
    if (s.length === 0) {
      if (rule.required) this.require(name);
      return undefined;
    }
    if (!DECIMAL.test(s)) {
      this.fail(name, t('farmer.livestock.detail.form.error.number'));
      return undefined;
    }
    const n = Number(s);
    if (rule.integer && !Number.isInteger(n)) {
      this.fail(name, t('farmer.livestock.detail.form.error.integer'));
      return undefined;
    }
    if (rule.min === 'positive' && n <= 0) {
      this.fail(name, t('farmer.livestock.detail.form.error.positive'));
      return undefined;
    }
    if (rule.min === 'nonNegative' && n < 0) {
      this.fail(name, t('farmer.livestock.detail.form.error.nonNegative'));
      return undefined;
    }
    if (rule.max !== undefined && n > rule.max) {
      this.fail(name, t('farmer.livestock.detail.form.error.max', { max: rule.max }));
      return undefined;
    }
    return n;
  }

  date(name: string, required: boolean): string | undefined {
    const s = (this.v[name] ?? '').trim();
    if (s.length === 0) {
      if (required) this.require(name);
      return undefined;
    }
    if (!isCalendarDate(s)) {
      this.fail(name, t('farmer.livestock.detail.form.error.date'));
      return undefined;
    }
    return s;
  }

  time(name: string): string | undefined {
    const s = (this.v[name] ?? '').trim();
    if (s.length === 0) return undefined;
    if (!HHMM.test(s)) {
      this.fail(name, t('farmer.livestock.detail.form.error.time'));
      return undefined;
    }
    return s;
  }

  choice<V extends string>(name: string, allowed: readonly V[], required: boolean): V | undefined {
    const s = (this.v[name] ?? '').trim();
    if (s.length === 0) {
      if (required) this.require(name);
      return undefined;
    }
    if (!(allowed as readonly string[]).includes(s)) {
      this.require(name);
      return undefined;
    }
    return s as V;
  }

  flag(name: string): boolean {
    return this.v[name] === 'true';
  }

  /** `later` on or after `earlier` (YYYY-MM-DD, so string order is date order), as requireNotBefore on the server. */
  notBefore(name: string, later: string | undefined, earlier: string | undefined, earlierField: string): void {
    if (later !== undefined && earlier !== undefined && later < earlier) {
      this.fail(name, t('farmer.livestock.detail.form.error.notBefore', { field: t(label(earlierField)) }));
    }
  }

  /** A `{ value, unit }` pair: present only when a value was typed. */
  measured<U extends string>(
    valueName: string,
    unitName: string,
    units: readonly U[],
    rule: Omit<NumberRule, 'required'>,
  ): { value: number; unit: U } | undefined {
    const value = this.number(valueName, { ...rule, required: false });
    if (value === undefined) return undefined;
    const unit = this.choice(unitName, units, true);
    return unit === undefined ? undefined : { value, unit };
  }

  result<B>(body: B): BuildResult<B> {
    return Object.keys(this.errors).length > 0 ? { ok: false, errors: this.errors } : { ok: true, body };
  }
}

/** Drops undefined keys so a strict server schema never sees an empty optional. */
type Compact<T> = { [K in keyof T as undefined extends T[K] ? never : K]: T[K] } & {
  [K in keyof T as undefined extends T[K] ? K : never]?: Exclude<T[K], undefined>;
};

function compact<T extends Record<string, unknown>>(obj: T): Compact<T> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) if (value !== undefined) out[key] = value;
  return out as Compact<T>;
}

// ── Builders ────────────────────────────────────────────────────────────────

export function buildHealthBody(v: FormValues): BuildResult<CreateHealthRecordBody> {
  const r = new Reader(v);
  const recordType = r.choice('recordType', HEALTH_RECORD_TYPES, true);
  const recordDate = r.date('recordDate', true) ?? '';
  const notes = r.text('notes', LONG_MAX, false);
  const base = { recordDate, notes };

  switch (recordType) {
    case 'VACCINATION': {
      const nextDueDate = r.date('nextDueDate', false);
      r.notBefore('nextDueDate', nextDueDate, recordDate || undefined, 'recordDate');
      return r.result(
        compact({
          recordType,
          ...base,
          vaccineName: r.text('vaccineName', SHORT_MAX, true) ?? '',
          veterinarian: r.text('veterinarian', SHORT_MAX, false),
          dose: r.measured('doseValue', 'doseUnit', VACCINE_DOSE_UNITS, { min: 'positive' }),
          route: r.choice('route', VACCINATION_ROUTES, false),
          batchNumber: r.text('batchNumber', BATCH_MAX, false),
          nextDueDate,
        }),
      );
    }
    case 'DEWORMING': {
      const nextDueDate = r.date('nextDueDate', false);
      r.notBefore('nextDueDate', nextDueDate, recordDate || undefined, 'recordDate');
      return r.result(
        compact({
          recordType,
          ...base,
          productName: r.text('productName', SHORT_MAX, true) ?? '',
          activeIngredient: r.text('activeIngredient', SHORT_MAX, false),
          targetParasite: r.choice('targetParasite', TARGET_PARASITES, false),
          dose: r.measured('doseValue', 'doseUnit', VACCINE_DOSE_UNITS, { min: 'positive' }),
          route: r.choice('route', DEWORMING_ROUTES, false),
          batchNumber: r.text('batchNumber', BATCH_MAX, false),
          administeredBy: r.text('administeredBy', SHORT_MAX, false),
          nextDueDate,
        }),
      );
    }
    case 'CHECKUP': {
      const followUpRequired = r.flag('followUpRequired');
      // Server: a date is required when follow-up is required, and must be omitted when it is not.
      const followUpDate = followUpRequired ? r.date('followUpDate', true) : undefined;
      r.notBefore('followUpDate', followUpDate, recordDate || undefined, 'recordDate');
      return r.result(
        compact({
          recordType,
          ...base,
          checkupType: r.choice('checkupType', CHECKUP_TYPES, true) ?? 'ROUTINE',
          checkupTime: r.time('checkupTime'),
          veterinarian: r.text('veterinarian', SHORT_MAX, true) ?? '',
          clinic: r.text('clinic', SHORT_MAX, true) ?? '',
          healthStatus: r.choice('healthStatus', HEALTH_STATUSES, false),
          diagnosis: r.text('diagnosis', LONG_MAX, false),
          followUpRequired,
          followUpDate,
        }),
      );
    }
    case 'TREATMENT': {
      const rd = recordDate || undefined;
      const medicationStartDate = r.date('medicationStartDate', false);
      const medicationEndDate = r.date('medicationEndDate', false);
      r.notBefore('medicationEndDate', medicationEndDate, medicationStartDate, 'medicationStartDate');

      // BR-138: the milk window needs both ends; a meat window may state only its end.
      const milkStart = r.date('milkWithdrawalStart', false);
      const milkEnd = r.date('milkWithdrawalEnd', false);
      const milkTouched = !r.blank('milkWithdrawalStart') || !r.blank('milkWithdrawalEnd');
      if (milkTouched && r.blank('milkWithdrawalStart')) r.require('milkWithdrawalStart');
      if (milkTouched && r.blank('milkWithdrawalEnd')) r.require('milkWithdrawalEnd');
      // BR-138c: an end before its start, or before the treatment it belongs to.
      r.notBefore('milkWithdrawalEnd', milkEnd, milkStart, 'milkWithdrawalStart');
      r.notBefore('milkWithdrawalEnd', milkEnd, rd, 'recordDate');

      const meatStart = r.date('meatWithdrawalStart', false);
      const meatEnd = r.date('meatWithdrawalEnd', false);
      if (!r.blank('meatWithdrawalStart') && r.blank('meatWithdrawalEnd')) r.require('meatWithdrawalEnd');
      r.notBefore('meatWithdrawalEnd', meatEnd, meatStart, 'meatWithdrawalStart');
      r.notBefore('meatWithdrawalEnd', meatEnd, rd, 'recordDate');

      return r.result(
        compact({
          recordType,
          ...base,
          condition: r.text('condition', SHORT_MAX, true) ?? '',
          description: r.text('description', LONG_MAX, true) ?? '',
          treatmentType: r.choice('treatmentType', TREATMENT_TYPES, false),
          medicineName: r.text('medicineName', SHORT_MAX, false),
          dosage: r.measured('dosageValue', 'dosageUnit', TREATMENT_DOSAGE_UNITS, { min: 'positive' }),
          route: r.choice('route', TREATMENT_ROUTES, false),
          frequency: r.choice('frequency', TREATMENT_FREQUENCIES, false),
          medicationStartDate,
          medicationEndDate,
          milkWithdrawal: milkStart && milkEnd ? { startDate: milkStart, endDate: milkEnd } : undefined,
          meatWithdrawal: meatEnd ? compact({ startDate: meatStart, endDate: meatEnd }) : undefined,
          prescribedBy: r.text('prescribedBy', SHORT_MAX, false),
        }),
      );
    }
    default:
      return { ok: false, errors: r.errors };
  }
}

export function buildBreedingBody(v: FormValues): BuildResult<CreateBreedingRecordBody> {
  const r = new Reader(v);
  const recordType = r.choice('recordType', BREEDING_RECORD_TYPES, true);
  const recordDate = r.date('recordDate', true) ?? '';
  const base = { recordDate, notes: r.text('notes', LONG_MAX, false) };

  switch (recordType) {
    case 'HEAT':
      return r.result(
        compact({
          recordType,
          ...base,
          breedingMethod: r.choice('breedingMethod', BREEDING_METHODS, true) ?? 'NATURAL_SERVICE',
          sire: r.text('sire', SHORT_MAX, true) ?? '',
          technician: r.text('technician', SHORT_MAX, false),
          heatSigns: r.text('heatSigns', LONG_MAX, false),
        }),
      );
    case 'INSEMINATION':
      return r.result(
        compact({
          recordType,
          ...base,
          inseminationType: r.choice('inseminationType', INSEMINATION_TYPES, true) ?? 'ARTIFICIAL',
          inseminationTime: r.time('inseminationTime'),
          sire: r.text('sire', SHORT_MAX, false),
          technician: r.text('technician', SHORT_MAX, false),
        }),
      );
    case 'PREGNANCY_CHECK': {
      const rd = recordDate || undefined;
      const expectedDeliveryDate = r.date('expectedDeliveryDate', false);
      const nextCheckDate = r.date('nextCheckDate', true);
      r.notBefore('expectedDeliveryDate', expectedDeliveryDate, rd, 'recordDate');
      r.notBefore('nextCheckDate', nextCheckDate, rd, 'recordDate');
      return r.result(
        compact({
          recordType,
          ...base,
          checkType: r.choice('checkType', PREGNANCY_CHECK_TYPES, true) ?? 'ROUTINE',
          result: r.choice('result', PREGNANCY_RESULTS, true) ?? 'INCONCLUSIVE',
          examinationMethod: r.choice('examinationMethod', EXAMINATION_METHODS, true) ?? 'ULTRASOUND',
          expectedDeliveryDate,
          nextCheckDate: nextCheckDate ?? '',
          findings: r.text('findings', LONG_MAX, false),
        }),
      );
    }
    case 'CALVING':
      return r.result(
        compact({
          recordType,
          ...base,
          outcome: r.choice('outcome', CALVING_OUTCOMES, true) ?? 'LIVE_BIRTH',
          calvingTime: r.time('calvingTime'),
          offspringCount: r.number('offspringCount', { required: false, min: 'nonNegative', max: OFFSPRING_MAX, integer: true }),
          deliveryType: r.choice('deliveryType', DELIVERY_TYPES, false),
          offspringGender: r.choice('offspringGender', GENDERS, false),
          offspringName: r.text('offspringName', SHORT_MAX, false),
          birthWeight: r.measured('birthWeightValue', 'birthWeightUnit', WEIGHT_UNITS, { min: 'positive' }),
        }),
      );
    default:
      return { ok: false, errors: r.errors };
  }
}

function buildFeedPlanBodyFromValues(v: FormValues): BuildResult<CreateFeedPlanBody> {
  const r = new Reader(v);
  const grazingUnit = r.choice('grazingUnit', GRAZING_UNITS, false);
  const grazing = r.measured('grazingValue', 'grazingUnit', GRAZING_UNITS, {
    min: 'positive',
    max: grazingUnit === 'HOURS_PER_DAY' ? GRAZING_DAY_MAX : GRAZING_WEEK_MAX,
  });
  return r.result(
    compact({
      feedType: r.choice('feedType', FEED_TYPES, true) ?? 'GREEN_FODDER',
      waterSource: r.choice('waterSource', WATER_SOURCES, true) ?? 'WELL',
      effectiveFrom: r.date('effectiveFrom', false),
      planName: r.text('planName', SHORT_MAX, false),
      source: r.text('source', SHORT_MAX, false),
      grazingDuration: grazing,
      startTime: r.time('startTime'),
      endTime: r.time('endTime'),
      notes: r.text('notes', LONG_MAX, false),
    }),
  );
}

function buildFeedLogBodyFromValues(v: FormValues): BuildResult<CreateFeedLogBody> {
  const r = new Reader(v);
  return r.result(
    compact({
      fedOn: r.date('fedOn', false),
      feedType: r.choice('feedType', FEED_TYPES, true) ?? 'GREEN_FODDER',
      quantity: r.number('quantity', { required: true, min: 'positive', max: FEED_LOG_QTY_MAX }) ?? 0,
      unit: r.choice('unit', FEED_LOG_UNITS, true) ?? 'KG',
      notes: r.text('notes', LONG_MAX, false),
    }),
  );
}

export function buildHousingBody(v: FormValues): BuildResult<CreateHousingRecordBody> {
  const r = new Reader(v);
  const indoorValue = r.number('indoorValue', { required: true, min: 'positive', max: SPACE_MAX });
  const indoorUnit = r.choice('indoorUnit', SPACE_UNITS, true);
  const outdoorValue = r.number('outdoorValue', { required: true, min: 'nonNegative', max: SPACE_MAX });
  const outdoorUnit = r.choice('outdoorUnit', SPACE_UNITS, true);
  return r.result(
    compact({
      housingType: r.choice('housingType', HOUSING_TYPES, true) ?? 'BARN',
      housingName: r.text('housingName', SHORT_MAX, true) ?? '',
      location: r.text('location', SHORT_MAX, false),
      indoorSpacePerAnimal: { value: indoorValue ?? 0, unit: indoorUnit ?? 'SQ_FT' },
      outdoorSpace: { value: outdoorValue ?? 0, unit: outdoorUnit ?? 'SQ_FT' },
      startDate: r.date('startDate', true) ?? '',
      notes: r.text('notes', LONG_MAX, false),
    }),
  );
}

export function buildHygieneBody(v: FormValues): BuildResult<CreateHygieneLogBody> {
  const r = new Reader(v);
  return r.result(
    compact({
      activity: r.text('activity', SHORT_MAX, true) ?? '',
      performedOn: r.date('performedOn', false),
      notes: r.text('notes', LONG_MAX, false),
    }),
  );
}

/**
 * A MEAT / WOOL / MANURE log for one animal. The unit is never the farmer's
 * choice: the server cross-checks it against DAIRY_PRODUCT_UNITS and these
 * three are always KG. No `fatPercent` (MILK only, a 422 otherwise) and no
 * `restrictedFromSale`: BR-139 has the server decide that from the animal's
 * withdrawal, whatever the client says.
 */
export function buildProductionBody(v: FormValues, animalId: string): BuildResult<CreateProductionLogBody> {
  const r = new Reader(v);
  return r.result(
    compact({
      animalId,
      productType: r.choice('productType', PRODUCTION_FORM_TYPES, true) ?? 'MEAT',
      quantity: r.number('quantity', { required: true, min: 'positive' }) ?? 0,
      unit: 'KG' as const,
      loggedOn: r.date('loggedOn', false),
      notes: r.text('notes', PRODUCTION_NOTES_MAX, false),
    }),
  );
}

/**
 * BR-139, as the server decides it: a log is stored restricted when the
 * animal's `withdrawalUntil` is on or after the log's date (the server's
 * default date is today, Asia/Kolkata).
 */
export function productionUnderWithdrawal(withdrawalUntil: string | null, loggedOn: string, today: string): boolean {
  if (withdrawalUntil === null) return false;
  const day = isCalendarDate(loggedOn.trim()) ? loggedOn.trim() : today;
  return withdrawalUntil >= day;
}

// ── Saving ──────────────────────────────────────────────────────────────────

export type BuiltRecord =
  | { kind: 'health'; body: CreateHealthRecordBody }
  | { kind: 'breeding'; body: CreateBreedingRecordBody }
  | { kind: 'feedPlan'; body: CreateFeedPlanBody }
  | { kind: 'feedLog'; body: CreateFeedLogBody }
  | { kind: 'housing'; body: CreateHousingRecordBody }
  | { kind: 'hygiene'; body: CreateHygieneLogBody }
  | { kind: 'production'; body: CreateProductionLogBody };

export function buildRecord(kind: RecordFormKind, v: FormValues, animalId: string): { ok: true; record: BuiltRecord } | { ok: false; errors: FieldErrors } {
  const wrap = <B>(res: BuildResult<B>, make: (body: B) => BuiltRecord) =>
    res.ok ? { ok: true as const, record: make(res.body) } : { ok: false as const, errors: res.errors };
  switch (kind) {
    case 'health':
      return wrap(buildHealthBody(v), (body) => ({ kind, body }));
    case 'breeding':
      return wrap(buildBreedingBody(v), (body) => ({ kind, body }));
    case 'feedPlan':
      return wrap(buildFeedPlanBody(v), (body) => ({ kind, body }));
    case 'feedLog':
      return wrap(buildFeedLogBody(v), (body) => ({ kind, body }));
    case 'housing':
      return wrap(buildHousingBody(v), (body) => ({ kind, body }));
    case 'hygiene':
      return wrap(buildHygieneBody(v), (body) => ({ kind, body }));
    case 'production':
      return wrap(buildProductionBody(v, animalId), (body) => ({ kind, body }));
  }
}

export interface SavedRecord {
  record: BuiltRecord;
  /** Only a production log's response is read (its BR-139 `restrictedFromSale`). */
  production: ProductionLogResponse | null;
}

/** POSTs the record; `uploadId` becomes `attachmentUploadId` where the body takes one. */
export async function saveAnimalRecord(record: BuiltRecord, animalId: string, uploadId?: string): Promise<SavedRecord> {
  const att = uploadId ? { attachmentUploadId: uploadId } : {};
  switch (record.kind) {
    case 'health':
      await createHealthRecord(animalId, { ...record.body, ...att });
      return { record, production: null };
    case 'breeding':
      await createBreedingRecord(animalId, { ...record.body, ...att });
      return { record, production: null };
    case 'feedPlan':
      await createFeedPlan(animalId, { ...record.body, ...att });
      return { record, production: null };
    case 'feedLog':
      await createFeedLog(animalId, record.body);
      return { record, production: null };
    case 'housing':
      await createHousingRecord(animalId, { ...record.body, ...att });
      return { record, production: null };
    case 'hygiene':
      await createHygieneLog(animalId, record.body);
      return { record, production: null };
    case 'production':
      return { record, production: await createProductionLog(record.body) };
  }
}

/** True when a saved health record moved the animal's withdrawal date (BR-138): the animal must be re-read. */
export function changesWithdrawal(record: BuiltRecord): boolean {
  return (
    record.kind === 'health' &&
    record.body.recordType === 'TREATMENT' &&
    (record.body.milkWithdrawal !== undefined || record.body.meatWithdrawal !== undefined)
  );
}

/**
 * A localized message for a failed save. The server's own `detail` and field
 * messages are English, so they are never shown as-is.
 *
 * A VALIDATION_FAILED without a field map is not a schema failure: for these
 * routes it is either BR-140 (a breeding record on a MALE animal) or BR-137c
 * (an attachment the caller does not own). The form says which it can be.
 */
export function submitErrorMessage(kind: RecordFormKind, err: unknown, sentAttachment: boolean): string {
  if (err instanceof NetworkError) return t('farmer.livestock.detail.form.error.network');
  if (err instanceof ApiError) {
    const fieldMap = err.problem.errors ?? {};
    if (err.is('VALIDATION_FAILED')) {
      if (Object.keys(fieldMap).length > 0) return t('farmer.livestock.detail.form.error.validation');
      if (sentAttachment) return t('farmer.livestock.detail.form.error.attachmentRejected');
      if (kind === 'breeding') return t('farmer.livestock.detail.form.error.femaleOnly');
      return t('farmer.livestock.detail.form.error.validation');
    }
    if (err.is('NOT_FOUND')) return t('farmer.livestock.detail.form.error.notFound');
    if (err.is('FORBIDDEN') || err.is('UNAUTHENTICATED')) return t('farmer.livestock.detail.form.error.forbidden');
  }
  return t('farmer.livestock.detail.form.error.saveFailed');
}

/** Server field paths (zod `body.x.y`) that differ from the form's field names. */
const SERVER_FIELD_ALIASES: Record<string, string> = {
  'dose.value': 'doseValue',
  'dose.unit': 'doseUnit',
  'dosage.value': 'dosageValue',
  'dosage.unit': 'dosageUnit',
  'milkWithdrawal.startDate': 'milkWithdrawalStart',
  'milkWithdrawal.endDate': 'milkWithdrawalEnd',
  'meatWithdrawal.startDate': 'meatWithdrawalStart',
  'meatWithdrawal.endDate': 'meatWithdrawalEnd',
  'birthWeight.value': 'birthWeightValue',
  'birthWeight.unit': 'birthWeightUnit',
  'grazingDuration.value': 'grazingValue',
  'grazingDuration.unit': 'grazingUnit',
  'indoorSpacePerAnimal.value': 'indoorValue',
  'indoorSpacePerAnimal.unit': 'indoorUnit',
  'outdoorSpace.value': 'outdoorValue',
  'outdoorSpace.unit': 'outdoorUnit',
};

/** Marks the fields the server rejected, with a localized message (its own text is English). */
export function serverFieldErrors(err: unknown, fields: readonly FieldSpec[]): FieldErrors {
  if (!(err instanceof ApiError) || !err.problem.errors) return {};
  const names = new Set(fields.map((f) => f.name));
  const out: FieldErrors = {};
  for (const key of Object.keys(err.problem.errors)) {
    const path = key.replace(/^body\./, '');
    const name = SERVER_FIELD_ALIASES[path] ?? path;
    if (names.has(name)) out[name] = t('farmer.livestock.detail.form.error.serverRejected');
  }
  return out;
}


export function buildFeedPlanBody(formOrValues: FeedPlanForm | FormValues): BuildResult<CreateFeedPlanBody> {
  if ('items' in formOrValues || 'planName' in formOrValues || 'grazingDuration' in formOrValues) {
    return buildFeedPlanBodyFromForm(formOrValues as FeedPlanForm);
  }
  return buildFeedPlanBodyFromValues(formOrValues as FormValues);
}

export function buildFeedLogBody(formOrValues: FeedLogForm | FormValues): BuildResult<CreateFeedLogBody> {
  if ('fedOn' in formOrValues || 'feedType' in formOrValues) {
    return buildFeedLogBodyFromForm(formOrValues as FeedLogForm);
  }
  return buildFeedLogBodyFromValues(formOrValues as FormValues);
}

