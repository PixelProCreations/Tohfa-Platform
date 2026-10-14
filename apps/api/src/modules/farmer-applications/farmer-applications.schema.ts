import { z } from 'zod';

const mobileRegex = /^\+[1-9][0-9]{7,14}$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;
const aadhaarLast4Regex = /^[0-9]{4}$/;
// farms.area_acres / boundary_area_acres are numeric(10,3): anything at or above this overflows the
// column at approval, so it is refused on save instead.
const MAX_ACRES = 10_000_000;

export const createFarmerApplicationBody = z.object({
  mobile: z.string().regex(mobileRegex, { message: 'Must be a valid E.164 mobile number (+91...)' }),
  fullName: z.string().trim().min(2).max(120),
  preferredLocale: z.enum(['en', 'ta']).default('en'),
});
export type CreateFarmerApplicationBody = z.infer<typeof createFarmerApplicationBody>;

export const farmerApplicationIdParams = z.object({
  id: z.string().uuid(),
});
export type FarmerApplicationIdParams = z.infer<typeof farmerApplicationIdParams>;

export const updateStepParams = z.object({
  id: z.string().uuid(),
  step: z.coerce.number().int().min(1).max(5),
});
export type UpdateStepParams = z.infer<typeof updateStepParams>;

// ---------------------------------------------------------------------------------------
// BR-69: every registration step body is validated on save.
//
// Every step schema is `.strict()`: an unknown key is a 422, not a silent write into a JSONB
// column that approval later reads. Every field is optional EXCEPT where the whole step would be
// meaningless without it (step 3's `locations`, and a location's id/label/areaAcres, which
// docs/openapi.yaml marks `required`) -- a draft may be saved a few fields at a time, so a field
// that is present is checked for shape and range, and a field that is absent is left alone.
// Completeness is a SUBMIT concern (see `farmer-applications.service.ts`'s submitApplication).
//
// Messages for personal fields are fixed strings, never the offending value: Zod's defaults echo
// the received value for enums, and a mistyped Aadhaar fragment or date of birth must not be
// reflected into a problem body, a log line or an error tracker.
// ---------------------------------------------------------------------------------------

const GENDER_VALUES = new Set(['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED']);

/**
 * Step1Personal.tsx's DatePicker stores dob as "DD / MM / YYYY" (and approval's
 * parseDobForInsert reads exactly that, or ISO `YYYY-MM-DD`), so both shapes are accepted.
 * The value must be a REAL calendar date (31/02 rolls over silently in `Date`, so the parts are
 * compared back) and must not be in the future. No minimum age or year is enforced: neither
 * docs/rules.md nor docs/openapi.yaml states one.
 */
export function isRealPastDate(raw: string, now: Date = new Date()): boolean {
  const trimmed = raw.trim();
  let year: number;
  let month: number;
  let day: number;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  const mobile = /^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/.exec(trimmed);
  if (iso !== null) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else if (mobile !== null) {
    day = Number(mobile[1]);
    month = Number(mobile[2]);
    year = Number(mobile[3]);
  } else {
    return false;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  const isReal =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!isReal || year < 1) return false;
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return date.getTime() <= today;
}

export const step1PersonalSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    // Sent by the app (Step1Personal.tsx) alongside the name. Format only: the application row
    // already owns the authoritative mobile (BR-33), this copy is never read on approval.
    mobile: z.string().regex(mobileRegex, { message: 'Must be a valid E.164 mobile number (+91...)' }).optional(),
    dob: z
      .string({ invalid_type_error: 'dob must be a date.' })
      .refine(isRealPastDate, { message: 'dob must be a real calendar date that is not in the future.' })
      .optional(),
    // Title-case ('Female') is what the app's picker sends; approval normalises case.
    gender: z
      .string({ invalid_type_error: 'gender must be a string.' })
      .refine((v) => GENDER_VALUES.has(v.trim().toUpperCase()), {
        message: 'gender must be one of MALE, FEMALE, OTHER, UNDISCLOSED.',
      })
      .optional(),
    aadhaarLast4: z
      .string({ invalid_type_error: 'aadhaarLast4 must be exactly 4 digits.' })
      .regex(aadhaarLast4Regex, { message: 'aadhaarLast4 must be exactly 4 digits.' })
      .optional(),
    aadhaarToken: z.string().max(500).optional(),
    // BR-33b: the full number is never stored. A client that still sends it (a regression, a
    // probe) is not rejected -- it is dropped by the transform below before any handler sees it,
    // and `updateStep` strips it again as the second line. The value is deliberately NOT
    // validated: a validation message must never be a place the number could be echoed from.
    aadhaarNumber: z.unknown().optional(),
    // Legacy: experience is collected in step 2 (`experienceYears`). Kept accepted so
    // in-flight applications saved before that move are still readable on approval.
    farmingExperienceYears: z.number().int().min(0).max(120).optional(),
    address: z.string().max(300).optional(),
    addressLine1: z.string().max(300).optional(),
    addressLine2: z.string().max(300).optional(),
    village: z.string().max(120).optional(),
    taluk: z.string().max(120).optional(),
    district: z.string().max(120).optional(),
    state: z.string().max(120).optional(),
    country: z.string().max(120).optional(),
    // An empty string is what the app sends for "not entered"; approval stores NULL for it.
    pincode: z.union([z.literal(''), z.string().regex(pincodeRegex, { message: 'pincode must be a 6-digit PIN code not starting with 0.' })]).optional(),
    preferredLocale: z.enum(['en', 'ta']).optional(),
  })
  .strict()
  .transform(({ aadhaarNumber: _droppedFullAadhaar, ...rest }) => rest);
export type Step1Personal = z.infer<typeof step1PersonalSchema>;

// One farming operation per farmer, so everything here is asked exactly once.
//
// `experienceYears` lives here, not in step 1: step 1 collects identity and address,
// and the farmer-facing step-1 screen has no experience input at all. It is read on
// approval into `farmers.farming_experience_years`.
//
// `totalAreaAcres` and `numberOfFarms` are the farmer's own STATED figures — usually
// copied off their patta/chitta land records. They are deliberately NOT derived from
// step 3, which is measured on the ground: `totalAreaAcres` is not the sum of the
// parcels' `areaAcres`, and `numberOfFarms` is not `locations.length`. Each pair is
// allowed to disagree, and that disagreement is the signal a verifier looks at during
// FARM_VERIFICATION (unmarked land, stale records, or an inflated claim). Deriving one
// from the other would make the gap mathematically invisible, so never overwrite either
// with its step-3 counterpart.
//
// `numberOfFarms` is a claim stored in the `step2_farm_details` JSONB and nothing else.
// It has no column, and it must never decide how many `farms` rows `approveApplication`
// creates — that count comes from the actual step-3 `locations`.
//
// `farmName` names the whole OPERATION ("Great Earth Organic"). It is not a parcel name:
// step 3's `locations[].label` names each parcel ("Home plot"), and it is that label —
// never this — that becomes a `farms` row's `name` on approval. `farmName` is stored in
// `step2_farm_details` and read nowhere else. It is farm-identifying data, so like every
// other field here it must never reach a customer response (BR-16); the catalog
// serializer's allow-list is what guarantees that.
export const step2FarmDetailsSchema = z
  .object({
    farmName: z.string().trim().min(1).max(120).optional(),
    typeOfFarming: z.string().max(120).optional(),
    experienceYears: z.number().int().min(0).max(120).optional(),
    totalAreaAcres: z.number().positive().lt(MAX_ACRES).optional(),
    numberOfFarms: z.number().int().positive().optional(),
    waterSource: z.string().max(120).optional(),
    primaryCrops: z.array(z.string().max(120)).optional(),
  })
  .strict();
export type Step2FarmDetails = z.infer<typeof step2FarmDetailsSchema>;

// What repeats is a LAND LOCATION: one labelled parcel, its own acreage, its own
// boundary. Each location is self-contained, so nothing has to be correlated back
// to step 2. `areaAcres` here is the measured-on-the-ground parcel figure; the sum of
// these is shown beside — never written over — the farmer's stated
// `step2.totalAreaAcres`.
// GeoJSON position as the app sends it: [longitude, latitude]. Ranges are the planet's, not a
// business rule -- an out-of-range vertex is a corrupt payload, and PostGIS would reject it.
const lngLatPosition = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]);

// A GeoJSON linear ring must have >= 4 positions and end where it starts. This is
// `ST_GeomFromGeoJSON`'s own requirement, not a business rule: approval feeds `fmbPolygon`
// straight to PostGIS, so an unclosed ring that got past this route would 500 the admin's
// approval much later, on someone else's click. The app hands over closed rings (its map
// editor closes them before `onPolygonChange`).
const polygonRing = z
  .array(lngLatPosition)
  .min(4, { message: 'A polygon ring needs at least 4 positions (3 corners and the closing point).' })
  .refine(
    (ring) => {
      const first = ring[0];
      const last = ring[ring.length - 1];
      return first !== undefined && last !== undefined && first[0] === last[0] && first[1] === last[1];
    },
    { message: 'A polygon ring must be closed: its last position must equal its first.' },
  );

export const farmLocationItemSchema = z
  .object({
    // Client-generated opaque key, NOT an RFC4122 UUID: older Android devices in the
    // field have no reliable crypto.randomUUID. It keys the location within the draft
    // only; nothing outside step 3 references it.
    id: z.string().min(1).max(100),
    label: z.string().trim().min(1).max(120),
    areaAcres: z.number().positive().lt(MAX_ACRES),
    gpsCaptured: z.boolean().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    calculatedAreaAcres: z.number().nonnegative().lt(MAX_ACRES).optional(),
    calculatedAreaHectares: z.number().nonnegative().optional(),
    fmbPolygon: z
      .object({
        type: z.literal('Polygon'),
        coordinates: z.array(polygonRing).min(1),
      })
      .strict()
      .optional(),
    village: z.string().max(120).optional(),
    taluk: z.string().max(120).optional(),
    district: z.string().max(120).optional(),
  })
  .strict();
export type FarmLocationItem = z.infer<typeof farmLocationItemSchema>;

/**
 * Whether a location says WHERE the land is: a drawn/typed boundary, or a GPS point (both
 * coordinates). docs/openapi.yaml describes step 3 as "its own GPS/FMB boundary -- GPS
 * auto-capture with a manual lat/lng fallback", and the app's own submit gate
 * (`validateCrossStepSubmission`'s `hasLocatedLand`) requires a position. A label and an
 * acreage alone locate nothing.
 */
export function locationHasPosition(location: FarmLocationItem): boolean {
  return (
    location.fmbPolygon !== undefined ||
    (location.latitude !== undefined && location.longitude !== undefined)
  );
}

// `.min(1)`: an empty list is not a draft, it is a wipe. The QA run that produced BR-69 saved
// `{"locations":[]}` over a good boundary, and an application with no land was then approved
// into a VERIFIED farmer with zero farms.
export const step3LocationSchema = z.object({
  locations: z.array(farmLocationItemSchema).min(1, { message: 'At least one farm location is required.' }),
}).strict();
export type Step3Location = z.infer<typeof step3LocationSchema>;

export const documentItemSchema = z
  .object({
    docType: z.enum(['ID_PROOF', 'FARM_DOC', 'CERTIFICATE', 'OTHER']),
    fileUrl: z.string().url(),
    fileName: z.string().max(255).optional(),
    // Which specific document this is (e.g. "Aadhaar Card", "Patta") -- deliberately a plain
    // string, not an enum cross-validated against `docType`: the mobile UI's fixed picker
    // options already own that boundary, and constraining it here would police it twice.
    docSubType: z.string().max(60).optional(),
  })
  .strict();
export type DocumentItem = z.infer<typeof documentItemSchema>;

// An empty list is a valid DRAFT save: the app's Step 4 "skip" button sends `{ documents: [] }`.
// That the two mandatory document types are present is checked at submit, not here.
export const step4DocumentsSchema = z.object({
  documents: z.array(documentItemSchema),
}).strict();
export type Step4Documents = z.infer<typeof step4DocumentsSchema>;

export const step5ReviewSchema = z
  .object({
    confirmed: z.boolean().optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict();
export type Step5Review = z.infer<typeof step5ReviewSchema>;

/** The body schema for `PATCH /applications/:id/steps/:step`, chosen by the validated `step`. */
export const registrationStepBodySchemas = {
  1: step1PersonalSchema,
  2: step2FarmDetailsSchema,
  3: step3LocationSchema,
  4: step4DocumentsSchema,
  5: step5ReviewSchema,
} as const;

export const updateFarmerProfileBody = z
  .object({
    fullName: z.string().min(2).max(120).optional(),
    farmingExperienceYears: z.number().int().min(0).max(120).optional(),
    address: z.string().optional(),
    preferredLocale: z.enum(['en', 'ta']).optional(),
    // BR-33: Aadhaar and mobile are locked fields.
    mobile: z.any().optional(),
    aadhaar: z.any().optional(),
    aadhaarNumber: z.any().optional(),
  });
export type UpdateFarmerProfileBody = z.infer<typeof updateFarmerProfileBody>;

export const listAdminApplicationsQuery = z.object({
  status: z.enum(['SUBMITTED', 'DOCS_REVIEW', 'FARM_VERIFICATION', 'AUDIT', 'APPROVED', 'REJECTED']).optional(),
  zoneId: z.string().uuid().optional(),
  submittedAfter: z.string().datetime().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListAdminApplicationsQuery = z.infer<typeof listAdminApplicationsQuery>;

export const approveApplicationBody = z.object({
  zoneId: z.string().uuid().optional(),
  note: z.string().max(500).optional(),
});
export type ApproveApplicationBody = z.infer<typeof approveApplicationBody>;

export const rejectApplicationBody = z
  .object({
    reasonCode: z
      .enum(['DOCUMENTS_INVALID', 'LAND_NOT_VERIFIED', 'DUPLICATE_APPLICANT', 'OUTSIDE_SERVICE_AREA', 'OTHER'])
      .optional(),
    reason: z.string().trim().min(1).max(500).optional(),
    rejectionReason: z.string().trim().min(1).max(500).optional(),
    note: z.string().trim().min(1).max(500).optional(),
  })
  .transform((data) => ({
    reasonCode: data.reasonCode ?? 'OTHER',
    reason: data.reason || data.rejectionReason || data.note || 'Application rejected by administrator.',
  }));
export type RejectApplicationBody = z.infer<typeof rejectApplicationBody>;

export const requestInfoApplicationBody = z.object({
  message: z.string().trim().min(5).max(1000),
  requiredSteps: z.array(z.number().int().min(1).max(5)).optional(),
});
export type RequestInfoApplicationBody = z.infer<typeof requestInfoApplicationBody>;

