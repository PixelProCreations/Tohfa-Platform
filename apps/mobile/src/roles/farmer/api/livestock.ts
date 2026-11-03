import { api } from '../../../shell/api/client';

// ---------------------------------------------------------------------------
// Enums — mirror apps/api/src/modules/livestock/livestock.schema.ts exactly.
// ---------------------------------------------------------------------------

export const animalSpecies = ['CATTLE', 'BUFFALO', 'GOAT', 'POULTRY', 'SHEEP'] as const;
export type AnimalSpecies = (typeof animalSpecies)[number];

export const animalGenders = ['FEMALE', 'MALE'] as const;
export type AnimalGender = (typeof animalGenders)[number];

export const animalSources = ['BORN_ON_FARM', 'PURCHASED'] as const;
export type AnimalSource = (typeof animalSources)[number];

export const organicStatuses = ['ORGANIC', 'TRANSITIONING', 'CONVENTIONAL'] as const;
export type OrganicStatus = (typeof organicStatuses)[number];

/** `ACTIVE` is the only status returned by a default (unfiltered) `listAnimals`
 *  call; the rest are terminal, each set exactly once by a lifecycle event. */
export const lifecycleStatuses = ['ACTIVE', 'SOLD', 'TRANSFERRED', 'CULLED', 'DECEASED'] as const;
export type LifecycleStatus = (typeof lifecycleStatuses)[number];

/** The same four non-ACTIVE values as `lifecycleStatuses` — recording an
 *  event sets the animal's `lifecycleStatus` to match (BR-47b). */
export const lifecycleEventTypes = ['SOLD', 'TRANSFERRED', 'CULLED', 'DECEASED'] as const;
export type LifecycleEventType = (typeof lifecycleEventTypes)[number];

export const dairyProductTypes = [
  'MILK',
  'CURD',
  'PANEER',
  'BUTTER',
  'GHEE',
  'BUTTERMILK',
  'CHEESE',
  'EGGS',
] as const;
export type DairyProductType = (typeof dairyProductTypes)[number];

/**
 * Every product a production log can carry: the eight dairy/egg products
 * above plus the per-animal MEAT / WOOL / MANURE yields AnimalDetailScreen
 * logs (0084). DairyProduceScreen only ever logs and shows the dairy subset,
 * so it narrows a list response with `isDairyProductType`.
 */
export const productionProductTypes = [...dairyProductTypes, 'MEAT', 'WOOL', 'MANURE'] as const;
export type ProductionProductType = (typeof productionProductTypes)[number];

export function isDairyProductType(value: ProductionProductType): value is DairyProductType {
  return (dairyProductTypes as readonly string[]).includes(value);
}

/** Milking / collection session on a production log (0084). */
export const productionSessions = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'] as const;
export type ProductionSession = (typeof productionSessions)[number];

export const productionUnits = ['LITERS', 'KG', 'COUNT'] as const;
export type ProductionUnit = (typeof productionUnits)[number];

/**
 * Each product type always logs in exactly one unit — the server cross-checks
 * `unit` against this same map (`VALIDATION_FAILED` on a mismatch, see
 * livestock.schema.ts's `createProductionLogBody`). Exported so
 * DairyProduceScreen's own `DAIRY_PRODUCTS` catalog can send the unit the
 * server actually expects instead of guessing.
 */
export const DAIRY_PRODUCT_UNITS: Record<DairyProductType, ProductionUnit> = {
  MILK: 'LITERS',
  CURD: 'KG',
  PANEER: 'KG',
  BUTTER: 'KG',
  GHEE: 'LITERS',
  BUTTERMILK: 'LITERS',
  CHEESE: 'KG',
  EGGS: 'COUNT',
};

/** Same fixed-unit rule for every production product (server: livestock.schema.ts DAIRY_PRODUCT_UNITS). */
export const PRODUCTION_PRODUCT_UNITS: Record<ProductionProductType, ProductionUnit> = {
  ...DAIRY_PRODUCT_UNITS,
  MEAT: 'KG',
  WOOL: 'KG',
  MANURE: 'KG',
};

// ---------------------------------------------------------------------------
// livestock_animals — create / update
// ---------------------------------------------------------------------------

/**
 * POST /farmers/me/livestock/animals
 *
 * There is deliberately no `farmId`/`lifecycleStatus` field: an animal
 * belongs to the farmer's operation as a whole (root CLAUDE.md's farm-land-
 * locations doctrine), and a new animal always starts `ACTIVE` — moving off
 * it only ever happens via `recordLifecycleEvent` (BR-47).
 */
export interface CreateAnimalBody {
  tag: string;
  name?: string;
  species: AnimalSpecies;
  breed?: string;
  gender: AnimalGender;
  dateOfBirth?: string;
  source?: AnimalSource;
  purchasedOn?: string;
  sourceFarm?: string;
  organicStatus?: OrganicStatus;
  withdrawalUntil?: string;
  notes?: string;
}

/**
 * PATCH /farmers/me/livestock/animals/:animalId
 *
 * `lifecycleStatus` is NOT editable here — it only ever changes as the side
 * effect of `recordLifecycleEvent` (BR-47). Nullable fields accept `null` to
 * clear them.
 */
export interface UpdateAnimalBody {
  tag?: string;
  name?: string | null;
  species?: AnimalSpecies;
  breed?: string | null;
  gender?: AnimalGender;
  dateOfBirth?: string | null;
  source?: AnimalSource;
  purchasedOn?: string | null;
  sourceFarm?: string | null;
  organicStatus?: OrganicStatus;
  withdrawalUntil?: string | null;
  notes?: string | null;
}

/** GET /farmers/me/livestock/animals — cursor pagination, same envelope as crops. */
export interface ListAnimalsQuery {
  species?: AnimalSpecies;
  /** Omitted defaults to `ACTIVE` only — an animal that has left the herd
   *  drops off the default list. Pass explicitly to see history. */
  lifecycleStatus?: LifecycleStatus;
  cursor?: string;
  limit?: number;
}

// ---------------------------------------------------------------------------
// livestock_lifecycle_events
// ---------------------------------------------------------------------------

/**
 * POST /farmers/me/livestock/animals/:animalId/lifecycle-events
 *
 * `salePricePaise` is integer paise, never a float (root CLAUDE.md §2.2) —
 * build it with `toPaise(parseMoney(input))`, never `parseFloat(input) * 100`.
 * `eventDate` defaults to today when omitted.
 */
export interface RecordLifecycleEventBody {
  eventType: LifecycleEventType;
  eventDate?: string;
  counterparty?: string;
  salePricePaise?: number;
  reason?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// livestock_production_logs — create
// ---------------------------------------------------------------------------

/**
 * POST /farmers/me/livestock/production-logs
 *
 * Covers all three of DairyProduceScreen's logging shapes: per-animal milk
 * yield (`animalId` + `sessions`), value-added produce batches (`batchInfo`),
 * and flock-level egg collection (`animalId` omitted, `productType: 'EGGS'`).
 * `unit` must match `productType`'s fixed unit in `DAIRY_PRODUCT_UNITS`.
 */
export interface CreateProductionLogBody {
  animalId?: string;
  productType: ProductionProductType;
  quantity: number;
  unit: ProductionUnit;
  loggedOn?: string;
  batchInfo?: string;
  sessions?: number;
  session?: ProductionSession;
  qualityGrade?: string;
  /** MILK only — the server rejects it on any other product. */
  fatPercent?: number;
  /** Omitted means false. BR-139: the server forces it true while the animal is under withdrawal. */
  restrictedFromSale?: boolean;
  notes?: string;
}

/** GET /farmers/me/livestock/production-logs */
export interface ListProductionLogsQuery {
  productType?: ProductionProductType;
  animalId?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

/**
 * Allow-list, not a raw table dump: `farm_id`/`farmerId` never appear here —
 * the caller already knows it is asking about its own herd.
 */
export interface AnimalResponse {
  id: string;
  tag: string;
  name: string | null;
  species: AnimalSpecies;
  breed: string | null;
  gender: AnimalGender;
  dateOfBirth: string | null;
  source: AnimalSource;
  purchasedOn: string | null;
  sourceFarm: string | null;
  organicStatus: OrganicStatus;
  lifecycleStatus: LifecycleStatus;
  withdrawalUntil: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ListAnimalsResult {
  items: AnimalResponse[];
  page: { nextCursor: string | null; hasMore: boolean };
}

export interface ProductionLogResponse {
  id: string;
  animalId: string | null;
  productType: ProductionProductType;
  quantity: number;
  unit: ProductionUnit;
  loggedOn: string;
  batchInfo: string | null;
  sessions: number | null;
  session: ProductionSession | null;
  qualityGrade: string | null;
  fatPercent: number | null;
  /** BR-139: true when logged from an animal under withdrawal, whatever the client sent. */
  restrictedFromSale: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface ListProductionLogsResult {
  items: ProductionLogResponse[];
  page: { nextCursor: string | null; hasMore: boolean };
}

// ---------------------------------------------------------------------------
// livestock_animals
// ---------------------------------------------------------------------------

export async function listAnimals(
  query: ListAnimalsQuery = {},
  signal?: AbortSignal,
): Promise<ListAnimalsResult> {
  const params = new URLSearchParams();
  if (query.species !== undefined) params.append('species', query.species);
  if (query.lifecycleStatus !== undefined) params.append('lifecycleStatus', query.lifecycleStatus);
  if (query.cursor !== undefined) params.append('cursor', query.cursor);
  if (query.limit !== undefined) params.append('limit', query.limit.toString());

  const queryStr = params.toString();
  const path = `/farmers/me/livestock/animals${queryStr ? `?${queryStr}` : ''}`;
  return api.get<ListAnimalsResult>(path, signal);
}

export async function getAnimal(animalId: string, signal?: AbortSignal): Promise<AnimalResponse> {
  return api.get<AnimalResponse>(`/farmers/me/livestock/animals/${animalId}`, signal);
}

export async function createAnimal(input: CreateAnimalBody): Promise<AnimalResponse> {
  return api.post<AnimalResponse>('/farmers/me/livestock/animals', input);
}

export async function updateAnimal(
  animalId: string,
  input: UpdateAnimalBody,
): Promise<AnimalResponse> {
  return api.patch<AnimalResponse>(`/farmers/me/livestock/animals/${animalId}`, input);
}

// ---------------------------------------------------------------------------
// livestock_lifecycle_events
// ---------------------------------------------------------------------------

export async function recordLifecycleEvent(
  animalId: string,
  input: RecordLifecycleEventBody,
): Promise<AnimalResponse> {
  return api.post<AnimalResponse>(
    `/farmers/me/livestock/animals/${animalId}/lifecycle-events`,
    input,
  );
}

// ---------------------------------------------------------------------------
// livestock_production_logs
// ---------------------------------------------------------------------------

export async function listProductionLogs(
  query: ListProductionLogsQuery = {},
  signal?: AbortSignal,
): Promise<ListProductionLogsResult> {
  const params = new URLSearchParams();
  if (query.productType !== undefined) params.append('productType', query.productType);
  if (query.animalId !== undefined) params.append('animalId', query.animalId);
  if (query.dateFrom !== undefined) params.append('dateFrom', query.dateFrom);
  if (query.dateTo !== undefined) params.append('dateTo', query.dateTo);
  if (query.cursor !== undefined) params.append('cursor', query.cursor);
  if (query.limit !== undefined) params.append('limit', query.limit.toString());

  const queryStr = params.toString();
  const path = `/farmers/me/livestock/production-logs${queryStr ? `?${queryStr}` : ''}`;
  return api.get<ListProductionLogsResult>(path, signal);
}

export async function createProductionLog(
  input: CreateProductionLogBody,
): Promise<ProductionLogResponse> {
  return api.post<ProductionLogResponse>('/farmers/me/livestock/production-logs', input);
}

// ===========================================================================
// Per-animal records (AnimalDetailScreen) — BR-136..BR-138.
// All six resources live at /farmers/me/livestock/animals/{animalId}/<resource>;
// GET lists (newest first, cursor-paginated, limit 1-100, default 20), POST
// creates. Shapes mirror apps/api/src/modules/livestock/livestock.schema.ts.
// ===========================================================================

export interface RecordsPage<T> {
  items: T[];
  page: { nextCursor: string | null; hasMore: boolean };
}

export interface RecordsPageQuery {
  cursor?: string;
  limit?: number;
}

export interface DatedRecordsPageQuery extends RecordsPageQuery {
  dateFrom?: string;
  dateTo?: string;
}

/** A physical measurement (never money — root CLAUDE.md §2.2 only forbids floats for money). */
export interface Measured<U extends string> {
  value: number;
  unit: U;
}

export const healthRecordTypes = ['VACCINATION', 'DEWORMING', 'CHECKUP', 'TREATMENT'] as const;
export type HealthRecordType = (typeof healthRecordTypes)[number];
export type VaccineDoseUnit = 'ML' | 'MG' | 'TABLET' | 'DOSE' | 'G';
export type VaccinationRoute = 'INJECTION_IM' | 'INJECTION_SC' | 'ORAL' | 'NASAL';
export type TargetParasite =
  | 'INTERNAL_WORMS'
  | 'EXTERNAL_PARASITES'
  | 'LIVER_FLUKES'
  | 'TAPEWORMS'
  | 'ROUNDWORMS'
  | 'TICKS_AND_LICE';
export type DewormingRoute = 'ORAL' | 'INJECTION_IM' | 'INJECTION_SC' | 'TOPICAL' | 'POUR_ON' | 'DRENCH';
export type WeightUnit = 'KG' | 'LB';
export type ObservedReaction = 'NONE' | 'MILD_SWELLING' | 'LETHARGY' | 'SALIVATION' | 'ALLERGIC_REACTION';
export type CheckupType = 'ROUTINE' | 'EMERGENCY' | 'PRE_BREEDING' | 'POST_CALVING' | 'FOLLOW_UP';
export type TemperatureUnit = 'C' | 'F';
export type HealthStatus = 'NORMAL' | 'MILD_ILLNESS' | 'MODERATE_ILLNESS' | 'SEVERE' | 'CRITICAL';
export type AppetiteLevel = 'NORMAL' | 'REDUCED' | 'VERY_LOW' | 'NONE';
export type TreatmentType = 'MEDICATION' | 'SURGICAL' | 'THERAPY' | 'FIRST_AID' | 'SUPPORTIVE' | 'OTHER';
export type TreatmentDosageUnit = 'GRAM' | 'MG' | 'ML' | 'TABLET' | 'DROP';
export type TreatmentRoute = 'TOPICAL' | 'ORAL' | 'INJECTION_IM' | 'INJECTION_SC' | 'INTRA_MAMMARY' | 'EYE_DROPS';
export type TreatmentFrequency =
  | 'ONCE_DAILY'
  | 'TWICE_DAILY'
  | 'THRICE_DAILY'
  | 'EVERY_6_HOURS'
  | 'EVERY_8_HOURS'
  | 'EVERY_12_HOURS'
  | 'AS_NEEDED';

interface DatedRecordBody {
  recordDate: string;
  notes?: string;
  attachmentUploadId?: string;
}

export interface CreateVaccinationBody extends DatedRecordBody {
  recordType: 'VACCINATION';
  vaccineName: string;
  veterinarian?: string;
  dose?: Measured<VaccineDoseUnit>;
  route?: VaccinationRoute;
  batchNumber?: string;
  nextDueDate?: string;
}

export interface CreateDewormingBody extends DatedRecordBody {
  recordType: 'DEWORMING';
  productName: string;
  activeIngredient?: string;
  targetParasite?: TargetParasite;
  dose?: Measured<VaccineDoseUnit>;
  route?: DewormingRoute;
  animalWeight?: Measured<WeightUnit>;
  batchNumber?: string;
  expiryDate?: string;
  administeredBy?: string;
  nextDueDate?: string;
  observedReaction?: ObservedReaction;
}

export interface CreateCheckupBody extends DatedRecordBody {
  recordType: 'CHECKUP';
  checkupType: CheckupType;
  checkupTime?: string;
  veterinarian: string;
  clinic: string;
  bodyTemperature?: Measured<TemperatureUnit>;
  bodyWeight?: Measured<WeightUnit>;
  healthStatus?: HealthStatus;
  appetite?: AppetiteLevel;
  activityLevel?: string;
  symptoms?: string;
  findings?: string;
  diagnosis?: string;
  treatmentRequired?: boolean;
  followUpRequired?: boolean;
  followUpDate?: string;
  recommendedActions?: string;
}

export interface CreateTreatmentBody extends DatedRecordBody {
  recordType: 'TREATMENT';
  treatmentType?: TreatmentType;
  condition: string;
  symptoms?: string;
  description: string;
  medicineName?: string;
  dosage?: Measured<TreatmentDosageUnit>;
  route?: TreatmentRoute;
  frequency?: TreatmentFrequency;
  medicationStartDate?: string;
  medicationEndDate?: string;
  /** BR-137: both ends required; extends the animal's `withdrawalUntil`. */
  milkWithdrawal?: { startDate: string; endDate: string; reason?: string };
  meatWithdrawal?: { startDate?: string; endDate: string; reason?: string };
  prescribedBy?: string;
  administeredBy?: string;
}

/** POST .../health-records — discriminated on `recordType`; every variant is strict server-side. */
export type CreateHealthRecordBody =
  | CreateVaccinationBody
  | CreateDewormingBody
  | CreateCheckupBody
  | CreateTreatmentBody;

interface RecordMeta {
  id: string;
  animalId: string;
  createdAt: string;
  updatedAt: string | null;
}

interface DatedRecordMeta extends RecordMeta {
  recordDate: string;
  notes: string | null;
  attachmentUploadId: string | null;
}

export type LivestockHealthRecord =
  | (DatedRecordMeta & {
      recordType: 'VACCINATION';
      vaccineName: string;
      veterinarian: string | null;
      dose: Measured<VaccineDoseUnit> | null;
      route: VaccinationRoute | null;
      batchNumber: string | null;
      nextDueDate: string | null;
    })
  | (DatedRecordMeta & {
      recordType: 'DEWORMING';
      productName: string;
      activeIngredient: string | null;
      targetParasite: TargetParasite | null;
      dose: Measured<VaccineDoseUnit> | null;
      route: DewormingRoute | null;
      animalWeight: Measured<WeightUnit> | null;
      batchNumber: string | null;
      expiryDate: string | null;
      administeredBy: string | null;
      nextDueDate: string | null;
      observedReaction: ObservedReaction | null;
    })
  | (DatedRecordMeta & {
      recordType: 'CHECKUP';
      checkupType: CheckupType;
      checkupTime: string | null;
      veterinarian: string;
      clinic: string;
      bodyTemperature: Measured<TemperatureUnit> | null;
      bodyWeight: Measured<WeightUnit> | null;
      healthStatus: HealthStatus | null;
      appetite: AppetiteLevel | null;
      activityLevel: string | null;
      symptoms: string | null;
      findings: string | null;
      diagnosis: string | null;
      treatmentRequired: boolean | null;
      followUpRequired: boolean | null;
      followUpDate: string | null;
      recommendedActions: string | null;
    })
  | (DatedRecordMeta & {
      recordType: 'TREATMENT';
      treatmentType: TreatmentType | null;
      condition: string;
      symptoms: string | null;
      description: string;
      medicineName: string | null;
      dosage: Measured<TreatmentDosageUnit> | null;
      route: TreatmentRoute | null;
      frequency: TreatmentFrequency | null;
      medicationStartDate: string | null;
      medicationEndDate: string | null;
      milkWithdrawal: { startDate: string; endDate: string; reason: string | null } | null;
      meatWithdrawal: { startDate: string | null; endDate: string; reason: string | null } | null;
      prescribedBy: string | null;
      administeredBy: string | null;
    });

export interface ListHealthRecordsQuery extends RecordsPageQuery {
  recordType?: HealthRecordType;
}

// ── Breeding (BR-138: FEMALE animals only; a MALE animal is 422) ────────────

export const breedingRecordTypes = ['HEAT', 'INSEMINATION', 'PREGNANCY_CHECK', 'CALVING'] as const;
export type BreedingRecordType = (typeof breedingRecordTypes)[number];
export type BreedingMethod = 'ARTIFICIAL_INSEMINATION' | 'NATURAL_SERVICE' | 'EMBRYO_TRANSFER';
export type InseminationType = 'ARTIFICIAL' | 'NATURAL';
export type PregnancyCheckType = 'ROUTINE' | 'CONFIRMATION';
export type PregnancyResult = 'POSITIVE' | 'NEGATIVE' | 'INCONCLUSIVE';
export type ExaminationMethod = 'ULTRASOUND' | 'RECTAL_PALPATION' | 'BLOOD_TEST' | 'MILK_PROGESTERONE';
export type GestationAgeUnit = 'MONTHS' | 'WEEKS' | 'DAYS';
export type CalvingOutcome = 'LIVE_BIRTH' | 'STILLBIRTH' | 'OTHER';
export type DeliveryType = 'NORMAL' | 'ASSISTED' | 'CAESAREAN';

export interface CreateHeatBody extends DatedRecordBody {
  recordType: 'HEAT';
  breedingMethod: BreedingMethod;
  sire: string;
  semenStrawRef?: string;
  technician?: string;
  heatSigns?: string;
}

export interface CreateInseminationBody extends DatedRecordBody {
  recordType: 'INSEMINATION';
  inseminationType: InseminationType;
  inseminationTime?: string;
  sire?: string;
  semenStrawRef?: string;
  location?: string;
  technician?: string;
  heatSigns?: string;
}

export interface CreatePregnancyCheckBody extends DatedRecordBody {
  recordType: 'PREGNANCY_CHECK';
  checkType: PregnancyCheckType;
  result: PregnancyResult;
  examinationMethod: ExaminationMethod;
  location?: string;
  gestationAge?: Measured<GestationAgeUnit>;
  expectedDeliveryDate?: string;
  nextCheckDate: string;
  findings?: string;
}

export interface CreateCalvingBody extends DatedRecordBody {
  recordType: 'CALVING';
  outcome: CalvingOutcome;
  offspringCount?: number;
  deliveryType?: DeliveryType;
  offspringName?: string;
  offspringGender?: AnimalGender;
  birthWeight?: Measured<WeightUnit>;
  findings?: string;
  /** Optional `HH:MM` 24-hour (server regex `^([01]\d|2[0-3]):[0-5]\d$`). */
  calvingTime?: string;
}

export type CreateBreedingRecordBody =
  | CreateHeatBody
  | CreateInseminationBody
  | CreatePregnancyCheckBody
  | CreateCalvingBody;

export type LivestockBreedingRecord =
  | (DatedRecordMeta & {
      recordType: 'HEAT';
      breedingMethod: BreedingMethod;
      sire: string;
      semenStrawRef: string | null;
      technician: string | null;
      heatSigns: string | null;
    })
  | (DatedRecordMeta & {
      recordType: 'INSEMINATION';
      inseminationType: InseminationType;
      inseminationTime: string | null;
      sire: string | null;
      semenStrawRef: string | null;
      location: string | null;
      technician: string | null;
      heatSigns: string | null;
    })
  | (DatedRecordMeta & {
      recordType: 'PREGNANCY_CHECK';
      checkType: PregnancyCheckType;
      result: PregnancyResult;
      examinationMethod: ExaminationMethod;
      location: string | null;
      gestationAge: Measured<GestationAgeUnit> | null;
      expectedDeliveryDate: string | null;
      nextCheckDate: string;
      findings: string | null;
    })
  | (DatedRecordMeta & {
      recordType: 'CALVING';
      outcome: CalvingOutcome;
      offspringCount: number;
      deliveryType: DeliveryType | null;
      offspringName: string | null;
      offspringGender: AnimalGender | null;
      birthWeight: Measured<WeightUnit> | null;
      findings: string | null;
      calvingTime: string | null;
    });

export interface ListBreedingRecordsQuery extends RecordsPageQuery {
  recordType?: BreedingRecordType;
}

// ── Feed plans ("Feed reference": the newest is current) and feed logs ─────

export const feedTypes = [
  'GREEN_FODDER',
  'DRY_FODDER',
  'CONCENTRATE_MIX',
  'SILAGE',
  'MINERAL_MIXTURE',
  'PASTURE_GRAZING',
] as const;
export type FeedType = (typeof feedTypes)[number];
export type GrazingDurationUnit = 'HOURS_PER_DAY' | 'HOURS_PER_WEEK';
export const waterSources = ['BOREWELL', 'WELL', 'CANAL', 'PIPED_WATER', 'POND_RIVER', 'RAINWATER_STORAGE'] as const;
export type WaterSource = (typeof waterSources)[number];
export type FeedItemUnit = 'KG_PER_DAY' | 'G_PER_DAY' | 'BUNDLES_PER_DAY';
export type FeedLogUnit = 'KG' | 'G' | 'BUNDLES';

export interface FeedPlanItem {
  name: string;
  amount: number;
  unit: FeedItemUnit;
}

export interface CreateFeedPlanBody {
  effectiveFrom?: string;
  planName?: string;
  feedType: FeedType;
  source?: string;
  grazingDuration?: Measured<GrazingDurationUnit>;
  waterSource: WaterSource;
  startTime?: string;
  endTime?: string;
  items?: FeedPlanItem[];
  notes?: string;
  attachmentUploadId?: string;
}

export interface LivestockFeedPlan extends RecordMeta {
  effectiveFrom: string;
  planName: string | null;
  feedType: FeedType;
  source: string | null;
  grazingDuration: Measured<GrazingDurationUnit> | null;
  waterSource: WaterSource;
  startTime: string | null;
  endTime: string | null;
  items: FeedPlanItem[];
  notes: string | null;
  attachmentUploadId: string | null;
}

export interface CreateFeedLogBody {
  fedOn?: string;
  feedType: FeedType;
  quantity: number;
  unit: FeedLogUnit;
  notes?: string;
}

export interface LivestockFeedLog extends RecordMeta {
  fedOn: string;
  feedType: FeedType;
  quantity: number;
  unit: FeedLogUnit;
  notes: string | null;
}

// ── Housing (the newest startDate is current) and hygiene logs ─────────────

export const housingTypes = ['BARN', 'OPEN_SHED', 'PASTURE_FREE_RANGE', 'COOP_PEN', 'STALL'] as const;
export type HousingType = (typeof housingTypes)[number];
export type SpaceUnit = 'SQ_FT' | 'SQ_M' | 'ACRES';

export interface CreateHousingRecordBody {
  housingType: HousingType;
  housingName: string;
  location?: string;
  indoorSpacePerAnimal: Measured<SpaceUnit>;
  outdoorSpace: Measured<SpaceUnit>;
  startDate: string;
  notes?: string;
  attachmentUploadId?: string;
}

export interface LivestockHousingRecord extends RecordMeta {
  housingType: HousingType;
  housingName: string;
  location: string | null;
  indoorSpacePerAnimal: Measured<SpaceUnit>;
  outdoorSpace: Measured<SpaceUnit>;
  startDate: string;
  notes: string | null;
  attachmentUploadId: string | null;
}

/**
 * A housing LIST item: the record plus the server's BR-140 verdict (indoor
 * space per animal, converted to sq.ft, >= the configured standard; equality
 * meets). Only the list carries it — the POST response is the bare record.
 */
export interface LivestockHousingListItem extends LivestockHousingRecord {
  meetsIndoorSpaceStandard: boolean;
}

/** BR-140: the standard the verdicts were computed against (system_config, sq.ft per animal). */
export interface HousingSpaceStandard {
  minIndoorSqFtPerAnimal: number;
}

export interface HousingRecordsPage extends RecordsPage<LivestockHousingListItem> {
  spaceStandard: HousingSpaceStandard;
}

/** Thrown when a housing list arrives without a usable `spaceStandard` — the screen shows the error state, never a default. */
export class MissingSpaceStandardError extends Error {
  constructor() {
    super('housing-records response has no spaceStandard');
    this.name = 'MissingSpaceStandardError';
  }
}

export interface CreateHygieneLogBody {
  activity: string;
  performedOn?: string;
  notes?: string;
}

export interface LivestockHygieneLog extends RecordMeta {
  activity: string;
  performedOn: string;
  notes: string | null;
}

// ── Calls ───────────────────────────────────────────────────────────────────

function animalRecordsPath(
  animalId: string,
  resource: string,
  query: Record<string, string | number | undefined> = {},
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.append(key, String(value));
  }
  const queryStr = params.toString();
  return `/farmers/me/livestock/animals/${encodeURIComponent(animalId)}/${resource}${queryStr ? `?${queryStr}` : ''}`;
}

export async function listHealthRecords(
  animalId: string,
  query: ListHealthRecordsQuery = {},
  signal?: AbortSignal,
): Promise<RecordsPage<LivestockHealthRecord>> {
  const { recordType, cursor, limit } = query;
  return api.get(animalRecordsPath(animalId, 'health-records', { recordType, cursor, limit }), signal);
}

export async function createHealthRecord(
  animalId: string,
  body: CreateHealthRecordBody,
): Promise<LivestockHealthRecord> {
  return api.post(animalRecordsPath(animalId, 'health-records'), body);
}

export async function listBreedingRecords(
  animalId: string,
  query: ListBreedingRecordsQuery = {},
  signal?: AbortSignal,
): Promise<RecordsPage<LivestockBreedingRecord>> {
  const { recordType, cursor, limit } = query;
  return api.get(animalRecordsPath(animalId, 'breeding-records', { recordType, cursor, limit }), signal);
}

export async function createBreedingRecord(
  animalId: string,
  body: CreateBreedingRecordBody,
): Promise<LivestockBreedingRecord> {
  return api.post(animalRecordsPath(animalId, 'breeding-records'), body);
}

export async function listFeedPlans(
  animalId: string,
  query: RecordsPageQuery = {},
  signal?: AbortSignal,
): Promise<RecordsPage<LivestockFeedPlan>> {
  const { cursor, limit } = query;
  return api.get(animalRecordsPath(animalId, 'feed-plans', { cursor, limit }), signal);
}

export async function createFeedPlan(animalId: string, body: CreateFeedPlanBody): Promise<LivestockFeedPlan> {
  return api.post(animalRecordsPath(animalId, 'feed-plans'), body);
}

export async function listFeedLogs(
  animalId: string,
  query: DatedRecordsPageQuery = {},
  signal?: AbortSignal,
): Promise<RecordsPage<LivestockFeedLog>> {
  const { dateFrom, dateTo, cursor, limit } = query;
  return api.get(animalRecordsPath(animalId, 'feed-logs', { dateFrom, dateTo, cursor, limit }), signal);
}

export async function createFeedLog(animalId: string, body: CreateFeedLogBody): Promise<LivestockFeedLog> {
  return api.post(animalRecordsPath(animalId, 'feed-logs'), body);
}

/**
 * GET .../housing-records. The response carries `spaceStandard` beside the page
 * (BR-140); a missing or non-positive value is refused here rather than
 * replaced with a constant (the server itself 503s when system_config lacks it).
 */
export async function listHousingRecords(
  animalId: string,
  query: RecordsPageQuery = {},
  signal?: AbortSignal,
): Promise<HousingRecordsPage> {
  const { cursor, limit } = query;
  const result = await api.get<HousingRecordsPage>(animalRecordsPath(animalId, 'housing-records', { cursor, limit }), signal);
  const min = (result as Partial<HousingRecordsPage>).spaceStandard?.minIndoorSqFtPerAnimal;
  if (typeof min !== 'number' || !Number.isFinite(min) || min <= 0) throw new MissingSpaceStandardError();
  return result;
}

export async function createHousingRecord(
  animalId: string,
  body: CreateHousingRecordBody,
): Promise<LivestockHousingRecord> {
  return api.post(animalRecordsPath(animalId, 'housing-records'), body);
}

export async function listHygieneLogs(
  animalId: string,
  query: DatedRecordsPageQuery = {},
  signal?: AbortSignal,
): Promise<RecordsPage<LivestockHygieneLog>> {
  const { dateFrom, dateTo, cursor, limit } = query;
  return api.get(animalRecordsPath(animalId, 'hygiene-logs', { dateFrom, dateTo, cursor, limit }), signal);
}

export async function createHygieneLog(animalId: string, body: CreateHygieneLogBody): Promise<LivestockHygieneLog> {
  return api.post(animalRecordsPath(animalId, 'hygiene-logs'), body);
}
