import { z } from 'zod';

const mobileRegex = /^\+[1-9][0-9]{7,14}$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;
const aadhaarLast4Regex = /^[0-9]{4}$/;

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

export const step1PersonalSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED']).optional(),
  aadhaarLast4: z.string().regex(aadhaarLast4Regex).optional(),
  aadhaarToken: z.string().optional(),
  // Legacy: experience is collected in step 2 (`experienceYears`). Kept accepted so
  // in-flight applications saved before that move are still readable on approval.
  farmingExperienceYears: z.number().int().min(0).max(120).optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  village: z.string().optional(),
  taluk: z.string().optional(),
  district: z.string().optional(),
  pincode: z.string().regex(pincodeRegex).optional(),
  preferredLocale: z.enum(['en', 'ta']).optional(),
});
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
export const step2FarmDetailsSchema = z.object({
  farmName: z.string().min(1).max(120).optional(),
  typeOfFarming: z.string().optional(),
  experienceYears: z.number().int().min(0).max(120).optional(),
  totalAreaAcres: z.number().positive().optional(),
  numberOfFarms: z.number().int().positive().optional(),
  waterSource: z.string().optional(),
  primaryCrops: z.array(z.string()).optional(),
});
export type Step2FarmDetails = z.infer<typeof step2FarmDetailsSchema>;

// What repeats is a LAND LOCATION: one labelled parcel, its own acreage, its own
// boundary. Each location is self-contained, so nothing has to be correlated back
// to step 2. `areaAcres` here is the measured-on-the-ground parcel figure; the sum of
// these is shown beside — never written over — the farmer's stated
// `step2.totalAreaAcres`.
export const farmLocationItemSchema = z.object({
  // Client-generated opaque key, NOT an RFC4122 UUID: older Android devices in the
  // field have no reliable crypto.randomUUID. It keys the location within the draft
  // only; nothing outside step 3 references it.
  id: z.string().min(1).max(100),
  label: z.string().min(1).max(120),
  areaAcres: z.number().positive(),
  gpsCaptured: z.boolean().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  calculatedAreaAcres: z.number().nonnegative().optional(),
  calculatedAreaHectares: z.number().nonnegative().optional(),
  fmbPolygon: z
    .object({
      type: z.literal('Polygon'),
      coordinates: z.array(z.array(z.array(z.number()))),
    })
    .optional(),
  village: z.string().optional(),
  taluk: z.string().optional(),
  district: z.string().optional(),
});
export type FarmLocationItem = z.infer<typeof farmLocationItemSchema>;

export const step3LocationSchema = z.object({
  locations: z.array(farmLocationItemSchema).min(1),
});
export type Step3Location = z.infer<typeof step3LocationSchema>;

export const documentItemSchema = z.object({
  docType: z.enum(['ID_PROOF', 'FARM_DOC', 'CERTIFICATE', 'OTHER']),
  fileUrl: z.string().url(),
  fileName: z.string().optional(),
  // Which specific document this is (e.g. "Aadhaar Card", "Patta") -- deliberately a plain
  // string, not an enum cross-validated against `docType`. The `/applications/:id/steps/:step`
  // route does not Zod-validate its body (the service does its own defensive reshaping in
  // `updateStep`); this schema exists for `docs/openapi.yaml` contract documentation and any
  // future consumer, and constraining it more tightly here would police a boundary the mobile
  // UI's fixed picker options already own.
  docSubType: z.string().max(60).optional(),
});
export type DocumentItem = z.infer<typeof documentItemSchema>;

export const step4DocumentsSchema = z.object({
  documents: z.array(documentItemSchema).min(1),
});
export type Step4Documents = z.infer<typeof step4DocumentsSchema>;

export const step5ReviewSchema = z.object({
  confirmed: z.boolean().optional(),
  notes: z.string().optional(),
});
export type Step5Review = z.infer<typeof step5ReviewSchema>;

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

