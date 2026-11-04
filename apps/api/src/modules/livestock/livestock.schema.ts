/**
 * Livestock (livestock_animals + livestock_production_logs +
 * livestock_lifecycle_events; BR-47). Zod schemas and inferred types only —
 * no SQL, no HTTP, no business rules. See db/migrations/0024_livestock.sql
 * for the tables behind these shapes.
 *
 * Backs the farmer app's mock livestock screens: LivestockScreen (animal
 * list), RegisterAnimalScreen (create/edit form), AnimalDetailScreen,
 * DairyProduceScreen (production logging) and SaleTransferCullScreen
 * (lifecycle events). Mobile wiring itself is a separate follow-up task —
 * these shapes only need to be stable enough for that task to consume.
 */
import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a date in YYYY-MM-DD format');

export const animalSpecies = ['CATTLE', 'BUFFALO', 'GOAT', 'POULTRY', 'SHEEP'] as const;
export type AnimalSpecies = (typeof animalSpecies)[number];

export const animalGenders = ['FEMALE', 'MALE'] as const;
export type AnimalGender = (typeof animalGenders)[number];

export const animalSources = ['BORN_ON_FARM', 'PURCHASED'] as const;
export type AnimalSource = (typeof animalSources)[number];

export const organicStatuses = ['ORGANIC', 'TRANSITIONING', 'CONVENTIONAL'] as const;
export type OrganicStatus = (typeof organicStatuses)[number];

/** `ACTIVE` is the only status an animal can return to `farmer.livestock.view_own`'s
 *  default list; the rest are terminal, each set exactly once by a lifecycle event (BR-47). */
export const lifecycleStatuses = ['ACTIVE', 'SOLD', 'TRANSFERRED', 'CULLED', 'DECEASED'] as const;
export type LifecycleStatus = (typeof lifecycleStatuses)[number];

/** livestock_lifecycle_events.event_type. Deliberately the same four non-ACTIVE
 *  values as lifecycleStatuses — recording an event sets the animal's status
 *  to match (BR-47b). */
export const lifecycleEventTypes = ['SOLD', 'TRANSFERRED', 'CULLED', 'DECEASED'] as const;
export type LifecycleEventType = (typeof lifecycleEventTypes)[number];

export const dairyProductTypes = ['MILK', 'CURD', 'PANEER', 'BUTTER', 'GHEE', 'BUTTERMILK', 'CHEESE', 'EGGS', 'MEAT', 'WOOL', 'MANURE'] as const;
export type DairyProductType = (typeof dairyProductTypes)[number];

export const productionUnits = ['LITERS', 'KG', 'COUNT'] as const;
export type ProductionUnit = (typeof productionUnits)[number];

/**
 * The mock's fixed `DAIRY_PRODUCTS` catalog: each product type always logs in
 * exactly one unit. `createProductionLogBody` cross-checks the client's
 * `unit` against this map (`VALIDATION_FAILED` on a mismatch) rather than
 * silently trusting whichever unit the client sends — a MILK entry logged in
 * KG would corrupt every yield rollup the produce history view computes.
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
  MEAT: 'KG',
  WOOL: 'KG',
  MANURE: 'KG',
};

/** Milking/collection session on a production log (0084). */
export const productionSessions = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'] as const;
export type ProductionSession = (typeof productionSessions)[number];

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

export const animalIdParams = z.object({ animalId: z.string().uuid('animalId must be a UUID') }).strict();
export type AnimalIdParams = z.infer<typeof animalIdParams>;

/** Admin route only: GET /admin/farmers/{farmerId}/livestock/animals */
export const farmerIdParams = z.object({ farmerId: z.string().uuid('farmerId must be a UUID') }).strict();
export type FarmerIdParams = z.infer<typeof farmerIdParams>;

// ---------------------------------------------------------------------------
// livestock_animals — create / update
// ---------------------------------------------------------------------------

/**
 * POST /v1/farmers/me/livestock/animals
 *
 * There is deliberately no `farmId` field: an animal belongs to the farmer's
 * operation as a whole, not one plot (root CLAUDE.md's farm-land-locations
 * doctrine — one operation, land in multiple locations), so the service picks
 * the caller's own farm the same way farm-diary.service.ts's `listPlots`
 * aggregates across every farm the scope owns. There is also no
 * `lifecycleStatus` field — new animals always start `ACTIVE`, and moving off
 * it only ever happens via `recordLifecycleEventBody` (BR-47).
 */
export const createAnimalBody = z
  .object({
    tag: z.string().trim().min(1).max(40),
    name: z.string().trim().min(1).max(120).optional(),
    species: z.enum(animalSpecies),
    breed: z.string().trim().min(1).max(120).optional(),
    gender: z.enum(animalGenders),
    dateOfBirth: isoDate.optional(),
    source: z.enum(animalSources).default('BORN_ON_FARM'),
    purchasedOn: isoDate.optional(),
    sourceFarm: z.string().trim().min(1).max(160).optional(),
    organicStatus: z.enum(organicStatuses).default('CONVENTIONAL'),
    withdrawalUntil: isoDate.optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict()
  .refine((body) => body.source === 'PURCHASED' || (body.purchasedOn === undefined && body.sourceFarm === undefined), {
    message: 'purchasedOn/sourceFarm only apply when source is PURCHASED',
    path: ['source'],
  });
export type CreateAnimalBody = z.infer<typeof createAnimalBody>;

/**
 * PATCH /v1/farmers/me/livestock/animals/{animalId}
 *
 * `lifecycleStatus` is NOT editable here — it only ever changes as the side
 * effect of `POST .../lifecycle-events` (BR-47), the same way farm_crops'
 * `status` field can only move into `GROWING` through a dedicated,
 * constraint-checked path rather than a free-form PATCH.
 */
export const updateAnimalBody = z
  .object({
    tag: z.string().trim().min(1).max(40).optional(),
    name: z.string().trim().min(1).max(120).nullable().optional(),
    species: z.enum(animalSpecies).optional(),
    breed: z.string().trim().min(1).max(120).nullable().optional(),
    gender: z.enum(animalGenders).optional(),
    dateOfBirth: isoDate.nullable().optional(),
    source: z.enum(animalSources).optional(),
    purchasedOn: isoDate.nullable().optional(),
    sourceFarm: z.string().trim().min(1).max(160).nullable().optional(),
    organicStatus: z.enum(organicStatuses).optional(),
    withdrawalUntil: isoDate.nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'At least one field must be supplied' });
export type UpdateAnimalBody = z.infer<typeof updateAnimalBody>;

/** GET /v1/farmers/me/livestock/animals — cursor pagination, same envelope as crops. */
export const listAnimalsQuery = z
  .object({
    species: z.enum(animalSpecies).optional(),
    /** Omitted defaults to `ACTIVE` only (root CLAUDE.md task doctrine: an
     *  animal that has left the herd drops off the default list). Pass
     *  explicitly to see history, e.g. `lifecycleStatus=SOLD`. */
    lifecycleStatus: z.enum(lifecycleStatuses).optional(),
    cursor: z.string().max(512).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListAnimalsQuery = z.infer<typeof listAnimalsQuery>;

// ---------------------------------------------------------------------------
// livestock_lifecycle_events
// ---------------------------------------------------------------------------

/**
 * POST /v1/farmers/me/livestock/animals/{animalId}/lifecycle-events
 *
 * `salePricePaise` is integer paise, never a float (root CLAUDE.md §2.2).
 * `eventDate` defaults to today when omitted, the same as
 * `livestock_lifecycle_events.event_date`'s column default.
 */
export const recordLifecycleEventBody = z
  .object({
    eventType: z.enum(lifecycleEventTypes),
    eventDate: isoDate.optional(),
    counterparty: z.string().trim().min(1).max(160).optional(),
    salePricePaise: z.number().int('salePricePaise must be a whole number').min(0).optional(),
    reason: z.string().trim().min(1).max(500).optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict();
export type RecordLifecycleEventBody = z.infer<typeof recordLifecycleEventBody>;

// ---------------------------------------------------------------------------
// livestock_production_logs — create
// ---------------------------------------------------------------------------

/**
 * POST /v1/farmers/me/livestock/production-logs
 *
 * Covers all three of DairyProduceScreen's logging shapes: per-animal milk
 * yield (`animalId` + `sessions`), value-added produce batches (`batchInfo`),
 * and flock-level egg collection (`animalId` omitted, `productType: 'EGGS'`).
 * `unit` must match `productType`'s fixed unit in `DAIRY_PRODUCT_UNITS` — a
 * mismatch is `VALIDATION_FAILED`, not silently accepted.
 */
export const createProductionLogBody = z
  .object({
    animalId: z.string().uuid('animalId must be a UUID').optional(),
    productType: z.enum(dairyProductTypes),
    quantity: z.number().positive(),
    unit: z.enum(productionUnits),
    loggedOn: isoDate.optional(),
    batchInfo: z.string().trim().min(1).max(500).optional(),
    sessions: z.number().int().positive().optional(),
    session: z.enum(productionSessions).optional(),
    qualityGrade: z.string().trim().min(1).max(60).optional(),
    fatPercent: z.number().min(0).max(100).optional(),
    /** Omitted means false. BR-139: the service forces it TRUE for an animal under withdrawal, whatever is sent. */
    restrictedFromSale: z.boolean().optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict()
  .refine((body) => DAIRY_PRODUCT_UNITS[body.productType] === body.unit, {
    message: 'unit does not match this productType\'s fixed unit (see DAIRY_PRODUCT_UNITS)',
    path: ['unit'],
  })
  // Fat content is a milk measurement; on curd/eggs/meat it would be noise
  // that later yield rollups could mistake for data.
  .refine((body) => body.fatPercent === undefined || body.productType === 'MILK', {
    message: 'fatPercent only applies when productType is MILK',
    path: ['fatPercent'],
  });
export type CreateProductionLogBody = z.infer<typeof createProductionLogBody>;

/** GET /v1/farmers/me/livestock/production-logs */
export const listProductionLogsQuery = z
  .object({
    productType: z.enum(dairyProductTypes).optional(),
    animalId: z.string().uuid('animalId must be a UUID').optional(),
    dateFrom: isoDate.optional(),
    dateTo: isoDate.optional(),
    cursor: z.string().max(512).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListProductionLogsQuery = z.infer<typeof listProductionLogsQuery>;

// ---------------------------------------------------------------------------
// Responses — keep aligned with docs/openapi.yaml
// ---------------------------------------------------------------------------

/**
 * Allow-list, not a raw table dump: `farm_id` never leaves this file — the
 * caller already knows it is asking about their own herd (or, on the admin
 * route, a specific `farmerId` passed in the URL), so echoing the internal
 * `farm_id` back would give the client an id it has no other use for.
 */
export const animalResponse = z.object({
  id: z.string().uuid(),
  tag: z.string(),
  name: z.string().nullable(),
  species: z.enum(animalSpecies),
  breed: z.string().nullable(),
  gender: z.enum(animalGenders),
  dateOfBirth: z.string().nullable(),
  source: z.enum(animalSources),
  purchasedOn: z.string().nullable(),
  sourceFarm: z.string().nullable(),
  organicStatus: z.enum(organicStatuses),
  lifecycleStatus: z.enum(lifecycleStatuses),
  withdrawalUntil: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type AnimalResponse = z.infer<typeof animalResponse>;

export const listAnimalsResponse = z.object({
  items: z.array(animalResponse),
  page: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }),
});
export type ListAnimalsResponse = z.infer<typeof listAnimalsResponse>;

export const productionLogResponse = z.object({
  id: z.string().uuid(),
  animalId: z.string().uuid().nullable(),
  productType: z.enum(dairyProductTypes),
  quantity: z.number(),
  unit: z.enum(productionUnits),
  loggedOn: z.string(),
  batchInfo: z.string().nullable(),
  sessions: z.number().int().nullable(),
  session: z.enum(productionSessions).nullable(),
  qualityGrade: z.string().nullable(),
  fatPercent: z.number().nullable(),
  /** BR-139: TRUE when logged from an animal under withdrawal, regardless of what the client sent. */
  restrictedFromSale: z.boolean(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});
export type ProductionLogResponse = z.infer<typeof productionLogResponse>;

export const listProductionLogsResponse = z.object({
  items: z.array(productionLogResponse),
  page: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }),
});
export type ListProductionLogsResponse = z.infer<typeof listProductionLogsResponse>;

/** GET /v1/admin/farmers/{farmerId}/livestock/animals — same allow-list as the farmer-facing response. */
export const listAdminAnimalsResponse = z.object({ items: z.array(animalResponse) });
export type ListAdminAnimalsResponse = z.infer<typeof listAdminAnimalsResponse>;

// ===========================================================================
// Animal records (AnimalDetailScreen) — BR-137..BR-141.
// db/migrations/0084_livestock_animal_records.sql. All six resources live at
// /v1/farmers/me/livestock/animals/{animalId}/<resource>, GET = list, POST = create.
// ===========================================================================

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be a time in HH:MM 24-hour format');
/** Names and short free text. */
const shortText = z.string().trim().min(1).max(160);
/** Notes, symptoms, findings, descriptions. */
const longText = z.string().trim().min(1).max(2000);
const attachmentUploadId = z.string().uuid('attachmentUploadId must be a UUID');

/**
 * A measured quantity — `{ value, unit }`. These are physical measurements,
 * never money, so a plain number is correct here (root CLAUDE.md §2.2 only
 * forbids floats for money).
 */
function measured<const U extends readonly [string, ...string[]]>(units: U, value: z.ZodNumber = z.number().positive()) {
  return z.object({ value, unit: z.enum(units) }).strict();
}

/** Same `{ value, unit }` shape on the way out; not strict, unknown keys are stripped. */
function measuredOut<const U extends readonly [string, ...string[]]>(units: U) {
  return z.object({ value: z.number(), unit: z.enum(units) });
}

/** Keyset-paginated list query shared by every animal-record list. */
const pageQuery = {
  cursor: z.string().max(512).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

const pageMeta = z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() });

/** Fields every animal-record response carries. `farmId` is deliberately absent (BR-137f). */
const recordMeta = {
  id: z.string().uuid(),
  animalId: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
};

/** Adds an issue unless `later` is on or after `earlier` (both YYYY-MM-DD, so string order is date order). */
function requireNotBefore(
  ctx: z.RefinementCtx,
  later: string | undefined,
  earlier: string | undefined,
  path: (string | number)[],
  message: string,
): void {
  if (later !== undefined && earlier !== undefined && later < earlier) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });
  }
}

// ---------------------------------------------------------------------------
// 1. Health records
// ---------------------------------------------------------------------------

export const healthRecordTypes = ['VACCINATION', 'DEWORMING', 'CHECKUP', 'TREATMENT'] as const;
export type HealthRecordType = (typeof healthRecordTypes)[number];

export const vaccineDoseUnits = ['ML', 'MG', 'TABLET', 'DOSE', 'G'] as const;
export const vaccinationRoutes = ['INJECTION_IM', 'INJECTION_SC', 'ORAL', 'NASAL'] as const;
export const targetParasites = ['INTERNAL_WORMS', 'EXTERNAL_PARASITES', 'LIVER_FLUKES', 'TAPEWORMS', 'ROUNDWORMS', 'TICKS_AND_LICE'] as const;
export const dewormingRoutes = ['ORAL', 'INJECTION_IM', 'INJECTION_SC', 'TOPICAL', 'POUR_ON', 'DRENCH'] as const;
export const weightUnits = ['KG', 'LB'] as const;
export const observedReactions = ['NONE', 'MILD_SWELLING', 'LETHARGY', 'SALIVATION', 'ALLERGIC_REACTION'] as const;
export const checkupTypes = ['ROUTINE', 'EMERGENCY', 'PRE_BREEDING', 'POST_CALVING', 'FOLLOW_UP'] as const;
export const temperatureUnits = ['C', 'F'] as const;
export const healthStatuses = ['NORMAL', 'MILD_ILLNESS', 'MODERATE_ILLNESS', 'SEVERE', 'CRITICAL'] as const;
export const appetiteLevels = ['NORMAL', 'REDUCED', 'VERY_LOW', 'NONE'] as const;
export const treatmentTypes = ['MEDICATION', 'SURGICAL', 'THERAPY', 'FIRST_AID', 'SUPPORTIVE', 'OTHER'] as const;
export const treatmentDosageUnits = ['GRAM', 'MG', 'ML', 'TABLET', 'DROP'] as const;
export const treatmentRoutes = ['TOPICAL', 'ORAL', 'INJECTION_IM', 'INJECTION_SC', 'INTRA_MAMMARY', 'EYE_DROPS'] as const;
export const treatmentFrequencies = [
  'ONCE_DAILY',
  'TWICE_DAILY',
  'THRICE_DAILY',
  'EVERY_6_HOURS',
  'EVERY_8_HOURS',
  'EVERY_12_HOURS',
  'AS_NEEDED',
] as const;

/** Common to health and breeding records: the date plus optional notes/attachment. */
const datedRecordBase = {
  recordDate: isoDate,
  notes: longText.optional(),
  attachmentUploadId: attachmentUploadId.optional(),
};

const vaccinationBody = z
  .object({
    recordType: z.literal('VACCINATION'),
    ...datedRecordBase,
    vaccineName: shortText,
    veterinarian: shortText.optional(),
    dose: measured(vaccineDoseUnits).optional(),
    route: z.enum(vaccinationRoutes).optional(),
    batchNumber: z.string().trim().min(1).max(80).optional(),
    nextDueDate: isoDate.optional(),
  })
  .strict();

const dewormingBody = z
  .object({
    recordType: z.literal('DEWORMING'),
    ...datedRecordBase,
    productName: shortText,
    activeIngredient: shortText.optional(),
    targetParasite: z.enum(targetParasites).optional(),
    dose: measured(vaccineDoseUnits).optional(),
    route: z.enum(dewormingRoutes).optional(),
    animalWeight: measured(weightUnits).optional(),
    batchNumber: z.string().trim().min(1).max(80).optional(),
    expiryDate: isoDate.optional(),
    administeredBy: shortText.optional(),
    nextDueDate: isoDate.optional(),
    observedReaction: z.enum(observedReactions).optional(),
  })
  .strict();

const checkupBody = z
  .object({
    recordType: z.literal('CHECKUP'),
    ...datedRecordBase,
    checkupType: z.enum(checkupTypes),
    checkupTime: hhmm.optional(),
    veterinarian: shortText,
    clinic: shortText,
    bodyTemperature: measured(temperatureUnits).optional(),
    bodyWeight: measured(weightUnits).optional(),
    healthStatus: z.enum(healthStatuses).optional(),
    appetite: z.enum(appetiteLevels).optional(),
    activityLevel: shortText.optional(),
    symptoms: longText.optional(),
    findings: longText.optional(),
    diagnosis: longText.optional(),
    treatmentRequired: z.boolean().optional(),
    followUpRequired: z.boolean().optional(),
    followUpDate: isoDate.optional(),
    recommendedActions: longText.optional(),
  })
  .strict();

/** BR-138: the milk window needs both ends; a meat window may state only when it ends. */
const milkWithdrawal = z
  .object({ startDate: isoDate, endDate: isoDate, reason: z.string().trim().min(1).max(500).optional() })
  .strict();
const meatWithdrawal = z
  .object({ startDate: isoDate.optional(), endDate: isoDate, reason: z.string().trim().min(1).max(500).optional() })
  .strict();

const treatmentBody = z
  .object({
    recordType: z.literal('TREATMENT'),
    ...datedRecordBase,
    treatmentType: z.enum(treatmentTypes).optional(),
    condition: shortText,
    symptoms: longText.optional(),
    description: longText,
    medicineName: shortText.optional(),
    dosage: measured(treatmentDosageUnits).optional(),
    route: z.enum(treatmentRoutes).optional(),
    frequency: z.enum(treatmentFrequencies).optional(),
    medicationStartDate: isoDate.optional(),
    medicationEndDate: isoDate.optional(),
    milkWithdrawal: milkWithdrawal.optional(),
    meatWithdrawal: meatWithdrawal.optional(),
    prescribedBy: shortText.optional(),
    administeredBy: shortText.optional(),
  })
  .strict();

/**
 * POST .../health-records — discriminated on `recordType`. Each variant is
 * `.strict()`, so a field that belongs to another variant (withdrawal fields
 * on a VACCINATION, say) is an unknown key and a 422 (BR-138d). Cross-field
 * date rules live in the superRefine because a discriminated union's members
 * must stay plain ZodObjects.
 */
export const createHealthRecordBody = z
  .discriminatedUnion('recordType', [vaccinationBody, dewormingBody, checkupBody, treatmentBody])
  .superRefine((body, ctx) => {
    switch (body.recordType) {
      case 'VACCINATION':
      case 'DEWORMING':
        requireNotBefore(ctx, body.nextDueDate, body.recordDate, ['nextDueDate'], 'nextDueDate cannot be before recordDate');
        break;
      case 'CHECKUP':
        requireNotBefore(ctx, body.followUpDate, body.recordDate, ['followUpDate'], 'followUpDate cannot be before recordDate');
        if (body.followUpRequired === true && body.followUpDate === undefined) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['followUpDate'], message: 'followUpDate is required when followUpRequired is true' });
        }
        if (body.followUpRequired === false && body.followUpDate !== undefined) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['followUpDate'], message: 'followUpDate must be omitted when followUpRequired is false' });
        }
        break;
      case 'TREATMENT':
        requireNotBefore(
          ctx,
          body.medicationEndDate,
          body.medicationStartDate,
          ['medicationEndDate'],
          'medicationEndDate cannot be before medicationStartDate',
        );
        // BR-138c: a window that ends before it starts, or before the
        // treatment it belongs to, would let BR-138 record a meaningless date.
        for (const key of ['milkWithdrawal', 'meatWithdrawal'] as const) {
          const window = body[key];
          if (window === undefined) continue;
          requireNotBefore(ctx, window.endDate, window.startDate, [key, 'endDate'], `${key}.endDate cannot be before ${key}.startDate`);
          requireNotBefore(ctx, window.endDate, body.recordDate, [key, 'endDate'], `${key}.endDate cannot be before recordDate`);
        }
        break;
    }
  });
export type CreateHealthRecordBody = z.infer<typeof createHealthRecordBody>;

/** GET .../health-records */
export const listHealthRecordsQuery = z.object({ recordType: z.enum(healthRecordTypes).optional(), ...pageQuery }).strict();
export type ListHealthRecordsQuery = z.infer<typeof listHealthRecordsQuery>;

/** Health and breeding responses: every documented key is always present; an optional field not supplied is `null`. */
const datedRecordMeta = {
  ...recordMeta,
  recordDate: z.string(),
  notes: z.string().nullable(),
  attachmentUploadId: z.string().uuid().nullable(),
};

export const livestockHealthRecord = z.discriminatedUnion('recordType', [
  z.object({
    ...datedRecordMeta,
    recordType: z.literal('VACCINATION'),
    vaccineName: z.string(),
    veterinarian: z.string().nullable(),
    dose: measuredOut(vaccineDoseUnits).nullable(),
    route: z.enum(vaccinationRoutes).nullable(),
    batchNumber: z.string().nullable(),
    nextDueDate: z.string().nullable(),
  }),
  z.object({
    ...datedRecordMeta,
    recordType: z.literal('DEWORMING'),
    productName: z.string(),
    activeIngredient: z.string().nullable(),
    targetParasite: z.enum(targetParasites).nullable(),
    dose: measuredOut(vaccineDoseUnits).nullable(),
    route: z.enum(dewormingRoutes).nullable(),
    animalWeight: measuredOut(weightUnits).nullable(),
    batchNumber: z.string().nullable(),
    expiryDate: z.string().nullable(),
    administeredBy: z.string().nullable(),
    nextDueDate: z.string().nullable(),
    observedReaction: z.enum(observedReactions).nullable(),
  }),
  z.object({
    ...datedRecordMeta,
    recordType: z.literal('CHECKUP'),
    checkupType: z.enum(checkupTypes),
    checkupTime: z.string().nullable(),
    veterinarian: z.string(),
    clinic: z.string(),
    bodyTemperature: measuredOut(temperatureUnits).nullable(),
    bodyWeight: measuredOut(weightUnits).nullable(),
    healthStatus: z.enum(healthStatuses).nullable(),
    appetite: z.enum(appetiteLevels).nullable(),
    activityLevel: z.string().nullable(),
    symptoms: z.string().nullable(),
    findings: z.string().nullable(),
    diagnosis: z.string().nullable(),
    treatmentRequired: z.boolean().nullable(),
    followUpRequired: z.boolean().nullable(),
    followUpDate: z.string().nullable(),
    recommendedActions: z.string().nullable(),
  }),
  z.object({
    ...datedRecordMeta,
    recordType: z.literal('TREATMENT'),
    treatmentType: z.enum(treatmentTypes).nullable(),
    condition: z.string(),
    symptoms: z.string().nullable(),
    description: z.string(),
    medicineName: z.string().nullable(),
    dosage: measuredOut(treatmentDosageUnits).nullable(),
    route: z.enum(treatmentRoutes).nullable(),
    frequency: z.enum(treatmentFrequencies).nullable(),
    medicationStartDate: z.string().nullable(),
    medicationEndDate: z.string().nullable(),
    milkWithdrawal: z.object({ startDate: z.string(), endDate: z.string(), reason: z.string().nullable() }).nullable(),
    meatWithdrawal: z.object({ startDate: z.string().nullable(), endDate: z.string(), reason: z.string().nullable() }).nullable(),
    prescribedBy: z.string().nullable(),
    administeredBy: z.string().nullable(),
  }),
]);
export type LivestockHealthRecord = z.infer<typeof livestockHealthRecord>;

export const listHealthRecordsResponse = z.object({ items: z.array(livestockHealthRecord), page: pageMeta });
export type ListHealthRecordsResponse = z.infer<typeof listHealthRecordsResponse>;

// ---------------------------------------------------------------------------
// 2. Breeding records (BR-140: FEMALE animals only — enforced in the service,
//    because the gender lives on the animal row, not in the request)
// ---------------------------------------------------------------------------

export const breedingRecordTypes = ['HEAT', 'INSEMINATION', 'PREGNANCY_CHECK', 'CALVING'] as const;
export type BreedingRecordType = (typeof breedingRecordTypes)[number];

export const breedingMethods = ['ARTIFICIAL_INSEMINATION', 'NATURAL_SERVICE', 'EMBRYO_TRANSFER'] as const;
export const inseminationTypes = ['ARTIFICIAL', 'NATURAL'] as const;
export const pregnancyCheckTypes = ['ROUTINE', 'CONFIRMATION'] as const;
export const pregnancyResults = ['POSITIVE', 'NEGATIVE', 'INCONCLUSIVE'] as const;
export const examinationMethods = ['ULTRASOUND', 'RECTAL_PALPATION', 'BLOOD_TEST', 'MILK_PROGESTERONE'] as const;
export const gestationAgeUnits = ['MONTHS', 'WEEKS', 'DAYS'] as const;
export const calvingOutcomes = ['LIVE_BIRTH', 'STILLBIRTH', 'OTHER'] as const;
export const deliveryTypes = ['NORMAL', 'ASSISTED', 'CAESAREAN'] as const;

const heatBody = z
  .object({
    recordType: z.literal('HEAT'),
    ...datedRecordBase,
    breedingMethod: z.enum(breedingMethods),
    sire: shortText,
    semenStrawRef: shortText.optional(),
    technician: shortText.optional(),
    heatSigns: longText.optional(),
  })
  .strict();

const inseminationBody = z
  .object({
    recordType: z.literal('INSEMINATION'),
    ...datedRecordBase,
    inseminationType: z.enum(inseminationTypes),
    inseminationTime: hhmm.optional(),
    sire: shortText.optional(),
    semenStrawRef: shortText.optional(),
    location: shortText.optional(),
    technician: shortText.optional(),
    heatSigns: longText.optional(),
  })
  .strict();

const pregnancyCheckBody = z
  .object({
    recordType: z.literal('PREGNANCY_CHECK'),
    ...datedRecordBase,
    checkType: z.enum(pregnancyCheckTypes),
    result: z.enum(pregnancyResults),
    examinationMethod: z.enum(examinationMethods),
    location: shortText.optional(),
    gestationAge: measured(gestationAgeUnits, z.number().int().positive()).optional(),
    expectedDeliveryDate: isoDate.optional(),
    nextCheckDate: isoDate,
    findings: longText.optional(),
  })
  .strict();

const calvingBody = z
  .object({
    recordType: z.literal('CALVING'),
    ...datedRecordBase,
    outcome: z.enum(calvingOutcomes),
    calvingTime: hhmm.optional(),
    offspringCount: z.number().int().min(0).max(20).default(1),
    deliveryType: z.enum(deliveryTypes).optional(),
    offspringName: shortText.optional(),
    offspringGender: z.enum(animalGenders).optional(),
    birthWeight: measured(weightUnits).optional(),
    findings: longText.optional(),
  })
  .strict();

/** POST .../breeding-records — discriminated on `recordType`, each variant strict. */
export const createBreedingRecordBody = z
  .discriminatedUnion('recordType', [heatBody, inseminationBody, pregnancyCheckBody, calvingBody])
  .superRefine((body, ctx) => {
    if (body.recordType !== 'PREGNANCY_CHECK') return;
    requireNotBefore(ctx, body.expectedDeliveryDate, body.recordDate, ['expectedDeliveryDate'], 'expectedDeliveryDate cannot be before recordDate');
    requireNotBefore(ctx, body.nextCheckDate, body.recordDate, ['nextCheckDate'], 'nextCheckDate cannot be before recordDate');
  });
export type CreateBreedingRecordBody = z.infer<typeof createBreedingRecordBody>;

/** GET .../breeding-records */
export const listBreedingRecordsQuery = z.object({ recordType: z.enum(breedingRecordTypes).optional(), ...pageQuery }).strict();
export type ListBreedingRecordsQuery = z.infer<typeof listBreedingRecordsQuery>;

export const livestockBreedingRecord = z.discriminatedUnion('recordType', [
  z.object({
    ...datedRecordMeta,
    recordType: z.literal('HEAT'),
    breedingMethod: z.enum(breedingMethods),
    sire: z.string(),
    semenStrawRef: z.string().nullable(),
    technician: z.string().nullable(),
    heatSigns: z.string().nullable(),
  }),
  z.object({
    ...datedRecordMeta,
    recordType: z.literal('INSEMINATION'),
    inseminationType: z.enum(inseminationTypes),
    inseminationTime: z.string().nullable(),
    sire: z.string().nullable(),
    semenStrawRef: z.string().nullable(),
    location: z.string().nullable(),
    technician: z.string().nullable(),
    heatSigns: z.string().nullable(),
  }),
  z.object({
    ...datedRecordMeta,
    recordType: z.literal('PREGNANCY_CHECK'),
    checkType: z.enum(pregnancyCheckTypes),
    result: z.enum(pregnancyResults),
    examinationMethod: z.enum(examinationMethods),
    location: z.string().nullable(),
    gestationAge: measuredOut(gestationAgeUnits).nullable(),
    expectedDeliveryDate: z.string().nullable(),
    nextCheckDate: z.string(),
    findings: z.string().nullable(),
  }),
  z.object({
    ...datedRecordMeta,
    recordType: z.literal('CALVING'),
    outcome: z.enum(calvingOutcomes),
    calvingTime: z.string().nullable(),
    offspringCount: z.number().int(),
    deliveryType: z.enum(deliveryTypes).nullable(),
    offspringName: z.string().nullable(),
    offspringGender: z.enum(animalGenders).nullable(),
    birthWeight: measuredOut(weightUnits).nullable(),
    findings: z.string().nullable(),
  }),
]);
export type LivestockBreedingRecord = z.infer<typeof livestockBreedingRecord>;

export const listBreedingRecordsResponse = z.object({ items: z.array(livestockBreedingRecord), page: pageMeta });
export type ListBreedingRecordsResponse = z.infer<typeof listBreedingRecordsResponse>;

// ---------------------------------------------------------------------------
// 3. Feed plans ("Feed reference" card — the newest effectiveFrom is current)
// ---------------------------------------------------------------------------

export const feedTypes = ['GREEN_FODDER', 'DRY_FODDER', 'CONCENTRATE_MIX', 'SILAGE', 'MINERAL_MIXTURE', 'PASTURE_GRAZING'] as const;
export type FeedType = (typeof feedTypes)[number];
export const grazingDurationUnits = ['HOURS_PER_DAY', 'HOURS_PER_WEEK'] as const;
export const waterSources = ['BOREWELL', 'WELL', 'CANAL', 'PIPED_WATER', 'POND_RIVER', 'RAINWATER_STORAGE'] as const;
export const feedItemUnits = ['KG_PER_DAY', 'G_PER_DAY', 'BUNDLES_PER_DAY'] as const;

const feedPlanItem = z.object({ name: shortText, amount: z.number().positive(), unit: z.enum(feedItemUnits) }).strict();

/** POST .../feed-plans */
export const createFeedPlanBody = z
  .object({
    effectiveFrom: isoDate.optional(),
    planName: shortText.optional(),
    feedType: z.enum(feedTypes),
    source: shortText.optional(),
    // 168 = hours in a week, the ceiling for either unit; HOURS_PER_DAY is tightened to 24 below.
    grazingDuration: measured(grazingDurationUnits, z.number().positive().max(168)).optional(),
    waterSource: z.enum(waterSources),
    startTime: hhmm.optional(),
    endTime: hhmm.optional(),
    items: z.array(feedPlanItem).max(20).default([]),
    notes: longText.optional(),
    attachmentUploadId: attachmentUploadId.optional(),
  })
  .strict()
  .refine(
    (body) => body.grazingDuration === undefined || body.grazingDuration.unit !== 'HOURS_PER_DAY' || body.grazingDuration.value <= 24,
    { message: 'grazingDuration in HOURS_PER_DAY cannot exceed 24', path: ['grazingDuration', 'value'] },
  );
export type CreateFeedPlanBody = z.infer<typeof createFeedPlanBody>;

/** GET .../feed-plans */
export const listFeedPlansQuery = z.object({ ...pageQuery }).strict();
export type ListFeedPlansQuery = z.infer<typeof listFeedPlansQuery>;

export const livestockFeedPlan = z.object({
  ...recordMeta,
  effectiveFrom: z.string(),
  planName: z.string().nullable(),
  feedType: z.enum(feedTypes),
  source: z.string().nullable(),
  grazingDuration: measuredOut(grazingDurationUnits).nullable(),
  waterSource: z.enum(waterSources),
  startTime: z.string().nullable(),
  endTime: z.string().nullable(),
  items: z.array(z.object({ name: z.string(), amount: z.number(), unit: z.enum(feedItemUnits) })),
  notes: z.string().nullable(),
  attachmentUploadId: z.string().uuid().nullable(),
});
export type LivestockFeedPlan = z.infer<typeof livestockFeedPlan>;

export const listFeedPlansResponse = z.object({ items: z.array(livestockFeedPlan), page: pageMeta });
export type ListFeedPlansResponse = z.infer<typeof listFeedPlansResponse>;

// ---------------------------------------------------------------------------
// 4. Feed logs ("Daily feed log")
// ---------------------------------------------------------------------------

export const feedLogUnits = ['KG', 'G', 'BUNDLES'] as const;

/** POST .../feed-logs. The `max` keeps quantity inside numeric(10,3), so an oversized value is a 422, not a 500. */
export const createFeedLogBody = z
  .object({
    fedOn: isoDate.optional(),
    feedType: z.enum(feedTypes),
    quantity: z.number().positive().max(9_999_999),
    unit: z.enum(feedLogUnits),
    notes: longText.optional(),
  })
  .strict();
export type CreateFeedLogBody = z.infer<typeof createFeedLogBody>;

/** GET .../feed-logs */
export const listFeedLogsQuery = z.object({ dateFrom: isoDate.optional(), dateTo: isoDate.optional(), ...pageQuery }).strict();
export type ListFeedLogsQuery = z.infer<typeof listFeedLogsQuery>;

export const livestockFeedLog = z.object({
  ...recordMeta,
  fedOn: z.string(),
  feedType: z.enum(feedTypes),
  quantity: z.number(),
  unit: z.enum(feedLogUnits),
  notes: z.string().nullable(),
});
export type LivestockFeedLog = z.infer<typeof livestockFeedLog>;

export const listFeedLogsResponse = z.object({ items: z.array(livestockFeedLog), page: pageMeta });
export type ListFeedLogsResponse = z.infer<typeof listFeedLogsResponse>;

// ---------------------------------------------------------------------------
// 5. Housing records (the newest startDate is the current housing)
// ---------------------------------------------------------------------------

export const housingTypes = ['BARN', 'OPEN_SHED', 'PASTURE_FREE_RANGE', 'COOP_PEN', 'STALL'] as const;
export const spaceUnits = ['SQ_FT', 'SQ_M', 'ACRES'] as const;

/**
 * Keeps space values inside numeric(10,2). The minimum-space comparison (BR-141) is not made
 * here: the threshold lives in system_config (`livestock_min_indoor_space_sqft_per_animal`) and
 * is applied by livestock.service.ts on the housing LIST only, so a record below the standard is
 * still stored as entered (it is a fact about the barn, not an invalid request).
 */
const SPACE_MAX = 99_999_999;

/** POST .../housing-records */
export const createHousingRecordBody = z
  .object({
    housingType: z.enum(housingTypes),
    housingName: shortText,
    location: shortText.optional(),
    indoorSpacePerAnimal: measured(spaceUnits, z.number().positive().max(SPACE_MAX)),
    outdoorSpace: measured(spaceUnits, z.number().min(0).max(SPACE_MAX)),
    startDate: isoDate,
    notes: longText.optional(),
    attachmentUploadId: attachmentUploadId.optional(),
  })
  .strict();
export type CreateHousingRecordBody = z.infer<typeof createHousingRecordBody>;

/** GET .../housing-records */
export const listHousingRecordsQuery = z.object({ ...pageQuery }).strict();
export type ListHousingRecordsQuery = z.infer<typeof listHousingRecordsQuery>;

export const livestockHousingRecord = z.object({
  ...recordMeta,
  housingType: z.enum(housingTypes),
  housingName: z.string(),
  location: z.string().nullable(),
  indoorSpacePerAnimal: measuredOut(spaceUnits),
  outdoorSpace: measuredOut(spaceUnits),
  startDate: z.string(),
  notes: z.string().nullable(),
  attachmentUploadId: z.string().uuid().nullable(),
});
export type LivestockHousingRecord = z.infer<typeof livestockHousingRecord>;

/**
 * A housing list item: the record plus the BR-141 verdict, computed by the service against the
 * standard returned alongside it. Only the list carries it; the POST response is the bare record.
 */
export const livestockHousingRecordListItem = livestockHousingRecord.extend({ meetsIndoorSpaceStandard: z.boolean() });
export type LivestockHousingRecordListItem = z.infer<typeof livestockHousingRecordListItem>;

/** BR-141: the indoor space standard the verdicts were computed against, in square feet per animal. */
export const housingSpaceStandard = z.object({ minIndoorSqFtPerAnimal: z.number().positive() });
export type HousingSpaceStandard = z.infer<typeof housingSpaceStandard>;

export const listHousingRecordsResponse = z.object({
  items: z.array(livestockHousingRecordListItem),
  page: pageMeta,
  spaceStandard: housingSpaceStandard,
});
export type ListHousingRecordsResponse = z.infer<typeof listHousingRecordsResponse>;

// ---------------------------------------------------------------------------
// 6. Hygiene logs
// ---------------------------------------------------------------------------

/** POST .../hygiene-logs */
export const createHygieneLogBody = z
  .object({
    activity: shortText,
    performedOn: isoDate.optional(),
    notes: longText.optional(),
  })
  .strict();
export type CreateHygieneLogBody = z.infer<typeof createHygieneLogBody>;

/** GET .../hygiene-logs */
export const listHygieneLogsQuery = z.object({ dateFrom: isoDate.optional(), dateTo: isoDate.optional(), ...pageQuery }).strict();
export type ListHygieneLogsQuery = z.infer<typeof listHygieneLogsQuery>;

export const livestockHygieneLog = z.object({
  ...recordMeta,
  activity: z.string(),
  performedOn: z.string(),
  notes: z.string().nullable(),
});
export type LivestockHygieneLog = z.infer<typeof livestockHygieneLog>;

export const listHygieneLogsResponse = z.object({ items: z.array(livestockHygieneLog), page: pageMeta });
export type ListHygieneLogsResponse = z.infer<typeof listHygieneLogsResponse>;
