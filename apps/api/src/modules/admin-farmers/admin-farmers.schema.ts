/**
 * Admin farmer directory and profile (BR-108). Zod schemas only, matching docs/openapi.yaml
 * `listAdminFarmers`, `getAdminFarmer`, `updateAdminFarmer`, `listAdminFarmerDocuments`,
 * `verifyAdminFarmerDocument`, `listAdminFarmerBankAccounts`, `getAdminFarmerSubscription` and the
 * `AdminFarmer*` component schemas.
 */
import { z } from 'zod';
import { CURSOR_TAGS, decodeKeysetCursor } from '../../http/keysetCursor.js';

export const ACCOUNT_STATUSES = ['PENDING', 'ACTIVE', 'DISABLED'] as const;
export const APPLICATION_STATUSES = ['SUBMITTED', 'DOCS_REVIEW', 'FARM_VERIFICATION', 'AUDIT', 'APPROVED', 'REJECTED'] as const;
export const KYC_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED'] as const;
/** Tier CODES are identifiers; the score bands behind them live in rating_tier_config (BR-04a). */
export const RATING_TIER_CODES = ['POOR', 'MODERATE', 'GOOD', 'EXCELLENT'] as const;
export const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED'] as const;
export const DOCUMENT_TYPES = ['ID_PROOF', 'ADDRESS_PROOF', 'FARM_DOC', 'CERTIFICATE', 'BANK_PROOF', 'PHOTO'] as const;
export const VERIFICATION_STATUSES = ['UNVERIFIED', 'VERIFIED', 'REJECTED'] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];
export type RatingTierCode = (typeof RATING_TIER_CODES)[number];

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export const farmerIdParams = z.object({ id: z.string().uuid() }).strict();
export const farmerDocumentParams = z.object({ id: z.string().uuid(), docId: z.string().uuid() }).strict();

/** GET /v1/admin/farmers */
export const listAdminFarmersQuery = z
  .object({
    q: z.string().trim().min(1).max(100).optional(),
    status: z.enum(ACCOUNT_STATUSES).optional(),
    zoneId: z.string().uuid().optional(),
    ratingTier: z.enum(RATING_TIER_CODES).optional(),
    cursor: z
      .string()
      .max(512)
      .refine((raw) => decodeKeysetCursor(CURSOR_TAGS.adminFarmers, raw) !== null, { message: 'Invalid cursor.' })
      .optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
export type ListAdminFarmersQuery = z.infer<typeof listAdminFarmersQuery>;
export type AdminFarmerFilters = Omit<ListAdminFarmersQuery, 'cursor' | 'limit'>;

const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();

/**
 * PATCH /v1/admin/farmers/{id}. The locked keys (BR-33) accept ANY value here on purpose: a caller
 * without `farmer.profile.edit_locked_field` must get 403 FIELD_LOCKED for sending the key at all,
 * whatever its value, and a format 422 would answer first. Their values are validated by the
 * service, and only for a caller allowed to change them.
 */
export const updateAdminFarmerBody = z
  .object({
    fullName: z.string().trim().min(2).max(120).optional(),
    email: z.string().trim().email().max(254).nullable().optional(),
    dob: z.string().date().nullable().optional(),
    gender: z.enum(GENDERS).nullable().optional(),
    farmingExperienceYears: z.number().int().min(0).max(120).nullable().optional(),
    addressLine1: nullableText(200),
    addressLine2: nullableText(200),
    village: nullableText(120),
    taluk: nullableText(120),
    district: z.string().trim().min(1).max(120).optional(),
    pincode: z
      .string()
      .regex(/^[1-9][0-9]{5}$/)
      .nullable()
      .optional(),
    mobile: z.unknown().optional(),
    aadhaarLast4: z.unknown().optional(),
    aadhaar: z.unknown().optional(),
  })
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'Send at least one field.' });
export type UpdateAdminFarmerBody = z.infer<typeof updateAdminFarmerBody>;

/** BR-33: the keys only `farmer.profile.edit_locked_field` may send. */
export const LOCKED_FIELDS = ['mobile', 'aadhaarLast4', 'aadhaar'] as const;

/** Formats checked by the service for a caller allowed to change a locked field. */
export const lockedMobileSchema = z.string().regex(/^\+[1-9][0-9]{7,14}$/, 'Mobile must be E.164, e.g. +919812345678.');
export const lockedAadhaarLast4Schema = z.string().regex(/^[0-9]{4}$/, 'aadhaarLast4 must be exactly four digits.');

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export const adminFarmerZone = z.object({ id: z.string().uuid(), code: z.string(), name: z.string() });
export const adminFarmerRatingTier = z.object({ code: z.enum(RATING_TIER_CODES), label: z.string() });

export const adminFarmerListItem = z.object({
  id: z.string().uuid(),
  tohfaFarmerId: z.string(),
  fullName: z.string(),
  mobile: z.string(),
  accountStatus: z.enum(ACCOUNT_STATUSES),
  applicationStatus: z.enum(APPLICATION_STATUSES),
  kycStatus: z.enum(KYC_STATUSES),
  zone: adminFarmerZone.nullable(),
  overallRating: z.number().nullable(),
  ratingTier: adminFarmerRatingTier.nullable(),
  landLocationCount: z.number().int().min(0),
  isMarketBlocked: z.boolean(),
  createdAt: z.string(),
});
export type AdminFarmerListItem = z.infer<typeof adminFarmerListItem>;

export const adminFarmerListResponse = z.object({
  items: z.array(adminFarmerListItem),
  page: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }),
});
export type AdminFarmerListResponse = z.infer<typeof adminFarmerListResponse>;

export const adminFarmerPlot = z.object({
  id: z.string().uuid(),
  name: z.string(),
  areaAcres: z.number().nullable(),
  soilType: z.string().nullable(),
  irrigationType: z.string().nullable(),
  sunExposure: z.string().nullable(),
});

export const adminFarmerLandLocation = z.object({
  id: z.string().uuid(),
  name: z.string(),
  surveyNumber: z.string().nullable(),
  areaAcres: z.number().nullable(),
  address: z.string().nullable(),
  village: z.string().nullable(),
  taluk: z.string().nullable(),
  district: z.string(),
  centroid: z.object({ lat: z.number(), lng: z.number() }).nullable(),
  hasBoundary: z.boolean(),
  isPrimary: z.boolean(),
  plots: z.array(adminFarmerPlot),
});
export type AdminFarmerLandLocation = z.infer<typeof adminFarmerLandLocation>;

export const adminFarmerCertificationSummary = z.object({
  total: z.number().int(),
  verified: z.number().int(),
  unverified: z.number().int(),
  rejected: z.number().int(),
  expired: z.number().int(),
  qualifying: z.number().int(),
  nextQualifyingExpiry: z.string().nullable(),
});
export type AdminFarmerCertificationSummary = z.infer<typeof adminFarmerCertificationSummary>;

export const adminFarmerDetail = z.object({
  id: z.string().uuid(),
  tohfaFarmerId: z.string(),
  fullName: z.string(),
  mobile: z.string(),
  email: z.string().nullable(),
  accountStatus: z.enum(ACCOUNT_STATUSES),
  applicationStatus: z.enum(APPLICATION_STATUSES),
  kycStatus: z.enum(KYC_STATUSES),
  zone: adminFarmerZone.nullable(),
  // BR-33b: the response type itself refuses anything but four digits.
  aadhaarLast4: z
    .string()
    .regex(/^[0-9]{4}$/)
    .nullable(),
  dob: z.string().nullable(),
  gender: z.enum(GENDERS).nullable(),
  farmingExperienceYears: z.number().int().nullable(),
  address: z.object({
    line1: z.string().nullable(),
    line2: z.string().nullable(),
    village: z.string().nullable(),
    taluk: z.string().nullable(),
    district: z.string(),
    pincode: z.string().nullable(),
  }),
  isMarketBlocked: z.boolean(),
  marketBlockReason: z.string().nullable(),
  landLocations: z.array(adminFarmerLandLocation),
  certificationSummary: adminFarmerCertificationSummary,
  rating: z.object({ overallRating: z.number().nullable(), ratingTier: adminFarmerRatingTier.nullable() }),
  approvedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type AdminFarmerDetail = z.infer<typeof adminFarmerDetail>;

export const adminFarmerDocument = z.object({
  id: z.string().uuid(),
  docType: z.enum(DOCUMENT_TYPES),
  mimeType: z.string(),
  sizeBytes: z.number().int().nullable(),
  isMandatory: z.boolean(),
  verificationStatus: z.enum(VERIFICATION_STATUSES),
  verifiedBy: z.string().uuid().nullable(),
  verifiedAt: z.string().nullable(),
  rejectReason: z.string().nullable(),
  uploadedAt: z.string(),
  readUrl: z.string().nullable(),
});
export type AdminFarmerDocument = z.infer<typeof adminFarmerDocument>;

export const adminFarmerDocumentListResponse = z.object({ items: z.array(adminFarmerDocument) });
export type AdminFarmerDocumentListResponse = z.infer<typeof adminFarmerDocumentListResponse>;

export const adminFarmerPayoutDestination = z.object({
  id: z.string().uuid(),
  kind: z.enum(['BANK', 'UPI']),
  accountHolderName: z.string(),
  // BR-53a: the response type itself refuses anything but four digits.
  accountNumberLast4: z
    .string()
    .regex(/^[0-9]{4}$/)
    .nullable(),
  ifsc: z.string().nullable(),
  bankName: z.string().nullable(),
  branchName: z.string().nullable(),
  upiVpa: z.string().nullable(),
  isVerified: z.boolean(),
  isDefault: z.boolean(),
  createdAt: z.string(),
});
export type AdminFarmerPayoutDestination = z.infer<typeof adminFarmerPayoutDestination>;

export const adminFarmerPayoutDestinationListResponse = z.object({ items: z.array(adminFarmerPayoutDestination) });
export type AdminFarmerPayoutDestinationListResponse = z.infer<typeof adminFarmerPayoutDestinationListResponse>;

export const adminFarmerSubscription = z.object({
  farmerId: z.string().uuid(),
  current: z
    .object({
      tier: z.enum(['FREE', 'PAID']),
      status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED', 'WAIVED']),
      periodStart: z.string(),
      periodEnd: z.string(),
    })
    .nullable(),
  freeTierLimits: z.object({ enforced: z.boolean(), listingLimit: z.number().int().nullable() }),
});
export type AdminFarmerSubscription = z.infer<typeof adminFarmerSubscription>;
