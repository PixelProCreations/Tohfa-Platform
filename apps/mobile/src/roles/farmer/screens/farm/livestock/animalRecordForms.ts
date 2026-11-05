/**
 * The add-record forms behind AnimalDetailScreen's tabs (BR-137..BR-141): what
 * each form shows, its starting values, and the pure builder that turns the
 * farmer's text into the POST body.
 *
 * Why validate here at all, when the server validates too: the server's zod
 * schemas (apps/api/src/modules/livestock/livestock.schema.ts) are the source
 * of truth, and a 422 after the round trip can only say "something is wrong".
 * Mirroring the same constraints (required fields, enums, lengths, positive
 * numbers, the cross-field date rules such as BR-138c) lets the form point at
 * the field. Every limit below is copied from that schema; if the schema
 * changes, change it here too. These are request-shape limits, not business
 * thresholds (root CLAUDE.md §2.7), so they are not system_config values.
 *
 * Every server variant is `.strict()`: a builder only ever emits the keys of
 * the chosen variant (BR-138d), and an empty optional field is omitted rather
 * than sent as "".
 */
import { t, type TranslationKey } from '../../../../../i18n/farmer';
import { ApiError, NetworkError } from '../../../../../shell/api/client';
import {
  createBreedingRecord,
  createFeedLog,
  createFeedPlan,
  createHealthRecord,
  createHousingRecord,
  createHygieneLog,
  createProductionLog,
  type CreateBreedingRecordBody,
  type CreateFeedLogBody,
  type CreateFeedPlanBody,
  type CreateHealthRecordBody,
  type CreateHousingRecordBody,
  type CreateHygieneLogBody,
  type CreateProductionLogBody,
  type ProductionLogResponse,
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

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const DECIMAL = /^-?\d+(\.\d+)?$/;

// ── Types ───────────────────────────────────────────────────────────────────

export type RecordFormKind = 'health' | 'breeding' | 'feedPlan' | 'feedLog' | 'housing' | 'hygiene' | 'production';

/** Every field is held as the text the farmer typed; toggles are 'true' or ''. */
export type FormValues = Readonly<Record<string, string>>;
/** Field name -> translated message. */
export type FieldErrors = Record<string, string>;

export type BuildResult<B> = { ok: true; body: B } | { ok: false; errors: FieldErrors };

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
export type ProductionFormType = (typeof PRODUCTION_FORM_TYPES)[number];

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

export function buildFeedPlanBody(v: FormValues): BuildResult<CreateFeedPlanBody> {
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

export function buildFeedLogBody(v: FormValues): BuildResult<CreateFeedLogBody> {
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
