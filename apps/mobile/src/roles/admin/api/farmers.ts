/**
 * Admin farmer directory and profile (docs/openapi.yaml /admin/farmers, BR-108):
 *   GET   /admin/farmers                              farmer.profile.view_all
 *   GET   /admin/farmers/{id}                         farmer.profile.view_all
 *   PATCH /admin/farmers/{id}                         farmer.profile.edit (+ edit_locked_field for BR-33 keys)
 *   GET   /admin/farmers/{id}/documents               farmer.document.view
 *   POST  /admin/farmers/{id}/documents/{docId}/verify farmer.document.verify
 *   GET   /admin/farmers/{id}/bank-accounts           farmer.bank_account.view
 *   GET   /admin/farmers/{id}/subscription            farmer.subscription.view_tier_limits
 *   GET   /admin/farmers/{id}/rating                  farmer.rating.view (read-only, BR-06)
 *
 * Shapes mirror apps/api/src/modules/admin-farmers/admin-farmers.schema.ts and
 * farm-ratings/farm-ratings.schema.ts. Scope (BR-108a) is a server WHERE clause:
 * a farmer outside the caller's scope is simply absent from a list and a 404 on
 * every per-farmer route, so the client sends no scope at all.
 *
 * No route here declares an Idempotency-Key in the spec: the PATCH is a field
 * update and the document verify is a no-op on replay by rule (BR-108e). There
 * is deliberately no rating write: a rating comes only from a completed
 * INTERNAL audit (BR-06, product decision 2026-10-01).
 *
 * No UI imports, so any admin area can reuse it.
 */
import type { ErrorCode, GenericProblemCode } from '@tohfa/shared-types';
import type { Page } from '../../../shell/api/pagination';
import { adminGet, adminPatch, adminPost } from './http';

/** admin-farmers.schema.ts ACCOUNT_STATUSES (users.status). */
export const ADMIN_FARMER_ACCOUNT_STATUSES = ['PENDING', 'ACTIVE', 'DISABLED'] as const;
export type AdminFarmerAccountStatus = (typeof ADMIN_FARMER_ACCOUNT_STATUSES)[number];

/** admin-farmers.schema.ts APPLICATION_STATUSES. */
export const ADMIN_FARMER_APPLICATION_STATUSES = ['SUBMITTED', 'DOCS_REVIEW', 'FARM_VERIFICATION', 'AUDIT', 'APPROVED', 'REJECTED'] as const;
export type AdminFarmerApplicationStatus = (typeof ADMIN_FARMER_APPLICATION_STATUSES)[number];

export const ADMIN_FARMER_KYC_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED'] as const;
export type AdminFarmerKycStatus = (typeof ADMIN_FARMER_KYC_STATUSES)[number];

/** Tier CODES only; the score bands live in rating_tier_config on the server (BR-04a). */
export const RATING_TIER_CODES = ['POOR', 'MODERATE', 'GOOD', 'EXCELLENT'] as const;
export type RatingTierCode = (typeof RATING_TIER_CODES)[number];

export const FARMER_GENDERS = ['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED'] as const;
export type FarmerGender = (typeof FARMER_GENDERS)[number];

export const FARMER_DOCUMENT_TYPES = ['ID_PROOF', 'ADDRESS_PROOF', 'FARM_DOC', 'CERTIFICATE', 'BANK_PROOF', 'PHOTO'] as const;
export type FarmerDocumentType = (typeof FARMER_DOCUMENT_TYPES)[number];

export const FARMER_DOCUMENT_VERIFICATION_STATUSES = ['UNVERIFIED', 'VERIFIED', 'REJECTED'] as const;
export type FarmerDocumentVerificationStatus = (typeof FARMER_DOCUMENT_VERIFICATION_STATUSES)[number];

/** BR-33: the keys only `farmer.profile.edit_locked_field` (SUPER_ADMIN) may send. */
export const FARMER_LOCKED_FIELDS = ['mobile', 'aadhaarLast4', 'aadhaar'] as const;

/** docs/openapi.yaml AdminFarmer zone. */
export interface AdminFarmerZoneDto {
  id: string;
  code: string;
  name: string;
}

/** The tier code plus the label the server resolved from rating_tier_config. */
export interface AdminFarmerRatingTierDto {
  code: RatingTierCode;
  label: string;
}

/** docs/openapi.yaml `AdminFarmerListItem`. Aadhaar is never part of a list item. */
export interface AdminFarmerListItemDto {
  id: string;
  /** TOHFA-F-YYYY-XXXX. */
  tohfaFarmerId: string;
  fullName: string;
  mobile: string;
  accountStatus: AdminFarmerAccountStatus;
  applicationStatus: AdminFarmerApplicationStatus;
  kycStatus: AdminFarmerKycStatus;
  zone: AdminFarmerZoneDto | null;
  /** 0-100: the direct sum of the 10 category scores (BR-06); null if never rated. */
  overallRating: number | null;
  ratingTier: AdminFarmerRatingTierDto | null;
  landLocationCount: number;
  isMarketBlocked: boolean;
  createdAt: string;
}

export type AdminFarmerListPage = Page<AdminFarmerListItemDto>;

/** A plot: a zone inside one land location. */
export interface AdminFarmerPlotDto {
  id: string;
  name: string;
  areaAcres: number | null;
  soilType: string | null;
  irrigationType: string | null;
  sunExposure: string | null;
}

/** One `farms` row: a land location of the farmer's single operation. */
export interface AdminFarmerLandLocationDto {
  id: string;
  name: string;
  surveyNumber: string | null;
  areaAcres: number | null;
  address: string | null;
  village: string | null;
  taluk: string | null;
  district: string;
  centroid: { lat: number; lng: number } | null;
  hasBoundary: boolean;
  isPrimary: boolean;
  plots: AdminFarmerPlotDto[];
}

/**
 * BR-108c. verifiedCurrent + verifiedExpired + unverified + rejected === total;
 * `expired` is a different axis (every cert past expiry, whatever its status).
 */
export interface AdminFarmerCertificationSummaryDto {
  total: number;
  verified: number;
  verifiedCurrent: number;
  verifiedExpired: number;
  unverified: number;
  rejected: number;
  expired: number;
  qualifying: number;
  nextQualifyingExpiry: string | null;
}

/** docs/openapi.yaml `AdminFarmerDetail`. */
export interface AdminFarmerDetailDto {
  id: string;
  tohfaFarmerId: string;
  fullName: string;
  mobile: string;
  email: string | null;
  accountStatus: AdminFarmerAccountStatus;
  applicationStatus: AdminFarmerApplicationStatus;
  kycStatus: AdminFarmerKycStatus;
  zone: AdminFarmerZoneDto | null;
  /** BR-33b: four digits or null; the full number is never returned. */
  aadhaarLast4: string | null;
  /** YYYY-MM-DD. */
  dob: string | null;
  gender: FarmerGender | null;
  farmingExperienceYears: number | null;
  address: {
    line1: string | null;
    line2: string | null;
    village: string | null;
    taluk: string | null;
    district: string;
    pincode: string | null;
  };
  isMarketBlocked: boolean;
  marketBlockReason: string | null;
  landLocations: AdminFarmerLandLocationDto[];
  certificationSummary: AdminFarmerCertificationSummaryDto;
  rating: { overallRating: number | null; ratingTier: AdminFarmerRatingTierDto | null };
  approvedAt: string | null;
  createdAt: string;
}

/**
 * docs/openapi.yaml `AdminFarmerUpdateRequest`: at least one field, unknown keys
 * are 422. `mobile` and `aadhaarLast4` are LOCKED (BR-33): sent by anyone but a
 * holder of `farmer.profile.edit_locked_field` they are 403 FIELD_LOCKED and
 * nothing in the request applies. The key `aadhaar` (a full number) is always
 * refused and is deliberately not part of this type.
 */
export interface UpdateAdminFarmerBody {
  /** 2-120 chars. */
  fullName?: string;
  email?: string | null;
  /** YYYY-MM-DD. */
  dob?: string | null;
  gender?: FarmerGender | null;
  /** 0-120. */
  farmingExperienceYears?: number | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  village?: string | null;
  taluk?: string | null;
  /** 1-120 chars; not nullable. */
  district?: string;
  /** ^[1-9][0-9]{5}$ */
  pincode?: string | null;
  /** Locked (BR-33). E.164, SUPER_ADMIN only. */
  mobile?: string;
  /** Locked (BR-33). Four digits, SUPER_ADMIN only. */
  aadhaarLast4?: string;
}

/** docs/openapi.yaml `AdminFarmerDocument`. The storage key is never returned. */
export interface AdminFarmerDocumentDto {
  id: string;
  docType: FarmerDocumentType;
  mimeType: string;
  sizeBytes: number | null;
  isMandatory: boolean;
  verificationStatus: FarmerDocumentVerificationStatus;
  verifiedBy: string | null;
  verifiedAt: string | null;
  rejectReason: string | null;
  uploadedAt: string;
  /** Signed read URL valid for 15 minutes (BR-54c). */
  readUrl: string | null;
}

export interface AdminFarmerDocumentList {
  items: AdminFarmerDocumentDto[];
}

/** docs/openapi.yaml `AdminFarmerPayoutDestination` (BR-53a: last 4 digits only). */
export interface AdminFarmerPayoutDestinationDto {
  id: string;
  kind: 'BANK' | 'UPI';
  accountHolderName: string;
  accountNumberLast4: string | null;
  ifsc: string | null;
  bankName: string | null;
  branchName: string | null;
  upiVpa: string | null;
  isVerified: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface AdminFarmerPayoutDestinationList {
  items: AdminFarmerPayoutDestinationDto[];
}

/** docs/openapi.yaml `AdminFarmerSubscription`. `listingLimit` is null while the gate is off (BR-14b). */
export interface AdminFarmerSubscriptionDto {
  farmerId: string;
  current: {
    tier: 'FREE' | 'PAID';
    status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'WAIVED';
    periodStart: string;
    periodEnd: string;
  } | null;
  freeTierLimits: { enforced: boolean; listingLimit: number | null };
}

/** docs/openapi.yaml `FarmRatingModule`. No display name: the client owns category labels. */
export interface FarmRatingModuleDto {
  categoryCode: string;
  score: number | null;
  maxScore: 10;
}

/** docs/openapi.yaml `FarmRating` (BR-06, read-only). */
export interface FarmRatingDto {
  farmerId: string;
  periodLabel: string;
  status: 'DRAFT' | 'COMPLETE';
  modules: FarmRatingModuleDto[];
  overallRating: number | null;
  ratingTier: RatingTierCode | null;
  ratedAt: string | null;
  /** AUDIT, MANUAL (legacy), or null for a farmer never rated. */
  source: 'AUDIT' | 'MANUAL' | null;
  sourceAuditId: string | null;
}

export interface ListFarmersParams {
  /** Case-insensitive substring of name or mobile; 1-100 chars. */
  q?: string | undefined;
  /** Account status (users.status), not the application status. */
  status?: AdminFarmerAccountStatus | undefined;
  zoneId?: string | undefined;
  ratingTier?: RatingTierCode | undefined;
  cursor?: string | undefined;
  /** 1-100, server default 20. */
  limit?: number | undefined;
}

/** API validation limits (admin-farmers.schema.ts), not business thresholds. */
export const FARMER_LIST_MAX_LIMIT = 100;
export const FARMER_SEARCH_MAX = 100;
export const FARMER_NAME_MIN = 2;
export const FARMER_NAME_MAX = 120;

/** Problem codes these routes document (401/403/404/409/422/500). */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'VALIDATION_FAILED',
  'FIELD_LOCKED',
  'INTERNAL',
];

const BASE = '/admin/farmers';

function farmerPath(id: string): string {
  return `${BASE}/${encodeURIComponent(id)}`;
}

/** The directory, newest first, cursor paged. A blank search is not sent (the server needs 1+ chars). */
export function listFarmers(params: ListFarmersParams = {}, signal?: AbortSignal): Promise<AdminFarmerListPage> {
  const q = params.q?.trim();
  return adminGet<AdminFarmerListPage>(
    BASE,
    {
      q: q === undefined || q === '' ? undefined : q,
      status: params.status,
      zoneId: params.zoneId,
      ratingTier: params.ratingTier,
      cursor: params.cursor,
      limit: params.limit,
    },
    signal,
  );
}

export function getFarmer(id: string, signal?: AbortSignal): Promise<AdminFarmerDetailDto> {
  return adminGet<AdminFarmerDetailDto>(farmerPath(id), undefined, signal);
}

/** Answers the updated profile (same shape as getFarmer). */
export function updateFarmer(id: string, body: UpdateAdminFarmerBody): Promise<AdminFarmerDetailDto> {
  return adminPatch<AdminFarmerDetailDto>(farmerPath(id), body);
}

export function listFarmerDocuments(id: string, signal?: AbortSignal): Promise<AdminFarmerDocumentList> {
  return adminGet<AdminFarmerDocumentList>(`${farmerPath(id)}/documents`, undefined, signal);
}

/** No body. Verifying an already VERIFIED document answers it unchanged (BR-108e). */
export function verifyFarmerDocument(id: string, docId: string): Promise<AdminFarmerDocumentDto> {
  return adminPost<AdminFarmerDocumentDto>(`${farmerPath(id)}/documents/${encodeURIComponent(docId)}/verify`, undefined);
}

export function listFarmerBankAccounts(id: string, signal?: AbortSignal): Promise<AdminFarmerPayoutDestinationList> {
  return adminGet<AdminFarmerPayoutDestinationList>(`${farmerPath(id)}/bank-accounts`, undefined, signal);
}

export function getFarmerSubscription(id: string, signal?: AbortSignal): Promise<AdminFarmerSubscriptionDto> {
  return adminGet<AdminFarmerSubscriptionDto>(`${farmerPath(id)}/subscription`, undefined, signal);
}

/** The newest rating; a never-rated farmer is an all-null DRAFT shell, not a 404. */
export function getFarmerRating(id: string, signal?: AbortSignal): Promise<FarmRatingDto> {
  return adminGet<FarmRatingDto>(`${farmerPath(id)}/rating`, undefined, signal);
}
