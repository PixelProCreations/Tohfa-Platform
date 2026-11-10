/**
 * The /admin/farmers and /admin/farmer-applications DTOs -> the Farmers
 * Management view-models (./farmerTypes.ts). Pure (no React), so plain-Node
 * vitest covers every rule (../tests/mappers_farmers.test.ts).
 *
 * Every mapper is an allow-list: it copies named fields only, so a farm field
 * a future server adds can never reach a screen (BR-16's principle). What the
 * API does not send stays null, never a demo value. Nothing is recomputed that
 * the server decides: the rating and its tier (BR-04a, BR-06), the
 * certification counts (BR-108c), the free-tier limit (BR-14b). Aadhaar and
 * account numbers are kept only as exactly four digits (BR-33b, BR-53a); any
 * other shape is dropped rather than shown.
 *
 * Application step payloads are stored JSONB, so they are read field by field
 * with type checks; a missing or malformed field becomes null.
 */
import type { FarmerApplicationDto } from './farmerApplications';
import type {
  AdminFarmerDetailDto,
  AdminFarmerDocumentDto,
  AdminFarmerLandLocationDto,
  AdminFarmerListItemDto,
  AdminFarmerPayoutDestinationDto,
  AdminFarmerSubscriptionDto,
  FarmRatingDto,
  UpdateAdminFarmerBody,
} from './farmers';
import type {
  ApplicationDetailView,
  ApplicationDocumentView,
  ApplicationLocationView,
  ApplicationRowView,
  EditFarmerFormValues,
  FarmerDetailView,
  FarmerDocumentView,
  FarmerLandLocationView,
  FarmerRatingView,
  FarmerRowView,
  FarmerSubscriptionView,
  FarmerUiStatus,
  PayoutDestinationView,
} from './farmerTypes';

const LAST4_RE = /^[0-9]{4}$/;

function last4(value: unknown): string | null {
  return typeof value === 'string' && LAST4_RE.test(value) ? value : null;
}

const ACCOUNT_STATUS_UI: Readonly<Record<string, FarmerUiStatus>> = {
  ACTIVE: 'active',
  PENDING: 'pending',
  DISABLED: 'disabled',
};

/** ACTIVE / PENDING / DISABLED -> the screen status; anything else is 'unknown'. */
export function accountStatusUi(status: string): FarmerUiStatus {
  return Object.prototype.hasOwnProperty.call(ACCOUNT_STATUS_UI, status) ? (ACCOUNT_STATUS_UI[status] ?? 'unknown') : 'unknown';
}

/** First letter of the first and the last word, upper-cased; '' for a blank name. */
export function farmerInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter((w) => w.length > 0);
  const first = words[0];
  if (first === undefined) return '';
  const last = words.length > 1 ? words[words.length - 1] : undefined;
  return `${first.charAt(0)}${last === undefined ? '' : last.charAt(0)}`.toUpperCase();
}

// ---------------------------------------------------------------------------
// Farmers
// ---------------------------------------------------------------------------

export function toFarmerRow(dto: AdminFarmerListItemDto): FarmerRowView {
  return {
    id: dto.id,
    farmerCode: dto.tohfaFarmerId,
    name: dto.fullName,
    initials: farmerInitials(dto.fullName),
    mobile: dto.mobile,
    zoneId: dto.zone?.id ?? null,
    zoneName: dto.zone?.name ?? null,
    status: accountStatusUi(dto.accountStatus),
    accountStatus: dto.accountStatus,
    applicationStatus: dto.applicationStatus,
    kycStatus: dto.kycStatus,
    overallRating: dto.overallRating,
    ratingTierCode: dto.ratingTier?.code ?? null,
    ratingTierLabel: dto.ratingTier?.label ?? null,
    landLocationCount: dto.landLocationCount,
    isMarketBlocked: dto.isMarketBlocked,
    registeredAt: dto.createdAt,
    farmingType: null,
    farmName: null,
    subscriptionLabel: null,
    hasExpiredCertification: null,
  };
}

function toLandLocation(dto: AdminFarmerLandLocationDto): FarmerLandLocationView {
  return {
    id: dto.id,
    name: dto.name,
    surveyNumber: dto.surveyNumber,
    areaAcres: dto.areaAcres,
    address: dto.address,
    village: dto.village,
    taluk: dto.taluk,
    district: dto.district,
    centroid: dto.centroid === null ? null : { lat: dto.centroid.lat, lng: dto.centroid.lng },
    hasBoundary: dto.hasBoundary,
    isPrimary: dto.isPrimary,
    plots: dto.plots.map((p) => ({
      id: p.id,
      name: p.name,
      areaAcres: p.areaAcres,
      soilType: p.soilType,
      irrigationType: p.irrigationType,
      sunExposure: p.sunExposure,
    })),
  };
}

export function toFarmerDetail(dto: AdminFarmerDetailDto): FarmerDetailView {
  const c = dto.certificationSummary;
  return {
    id: dto.id,
    farmerCode: dto.tohfaFarmerId,
    name: dto.fullName,
    initials: farmerInitials(dto.fullName),
    mobile: dto.mobile,
    email: dto.email,
    status: accountStatusUi(dto.accountStatus),
    accountStatus: dto.accountStatus,
    applicationStatus: dto.applicationStatus,
    kycStatus: dto.kycStatus,
    zoneId: dto.zone?.id ?? null,
    zoneName: dto.zone?.name ?? null,
    aadhaarLast4: last4(dto.aadhaarLast4),
    dob: dto.dob,
    gender: dto.gender,
    farmingExperienceYears: dto.farmingExperienceYears,
    address: {
      line1: dto.address.line1,
      line2: dto.address.line2,
      village: dto.address.village,
      taluk: dto.address.taluk,
      district: dto.address.district,
      pincode: dto.address.pincode,
    },
    isMarketBlocked: dto.isMarketBlocked,
    marketBlockReason: dto.marketBlockReason,
    landLocations: dto.landLocations.map(toLandLocation),
    certification: {
      total: c.total,
      verifiedCurrent: c.verifiedCurrent,
      verifiedExpired: c.verifiedExpired,
      unverified: c.unverified,
      rejected: c.rejected,
      expired: c.expired,
      qualifying: c.qualifying,
      nextQualifyingExpiry: c.nextQualifyingExpiry,
    },
    overallRating: dto.rating.overallRating,
    ratingTierCode: dto.rating.ratingTier?.code ?? null,
    ratingTierLabel: dto.rating.ratingTier?.label ?? null,
    registeredAt: dto.createdAt,
    approvedAt: dto.approvedAt,
    farmingType: null,
    farmProfile: null,
    lifecycle: null,
    lastAuditAt: null,
  };
}

/** The edit form, pre-filled from the profile. */
export function toEditFarmerForm(dto: AdminFarmerDetailDto): EditFarmerFormValues {
  return {
    fullName: dto.fullName,
    email: dto.email ?? '',
    dob: dto.dob ?? '',
    gender: dto.gender,
    farmingExperienceYears: dto.farmingExperienceYears,
    addressLine1: dto.address.line1 ?? '',
    addressLine2: dto.address.line2 ?? '',
    village: dto.address.village ?? '',
    taluk: dto.address.taluk ?? '',
    district: dto.address.district,
    pincode: dto.address.pincode ?? '',
    mobile: dto.mobile,
    aadhaarLast4: last4(dto.aadhaarLast4) ?? '',
  };
}

/** Trimmed text, or null when blank (for the nullable API fields). */
function textOrNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

const NULLABLE_TEXT_FIELDS = ['email', 'dob', 'addressLine1', 'addressLine2', 'village', 'taluk', 'pincode'] as const;
const REQUIRED_TEXT_FIELDS = ['fullName', 'district'] as const;
const LOCKED_TEXT_FIELDS = ['mobile', 'aadhaarLast4'] as const;

export interface FarmerPatchOptions {
  /** True only when the caller holds `farmer.profile.edit_locked_field` (BR-33). */
  canEditLockedFields: boolean;
}

/**
 * The PATCH body for what changed between `initial` and `edited`, or null when
 * nothing did. Text is trimmed and a blank optional field is sent as null; the
 * server validates formats. BR-33a: the locked fields are sent only for a
 * caller holding `farmer.profile.edit_locked_field` (the server refuses them
 * with FIELD_LOCKED otherwise, and then applies nothing at all), and the key
 * `aadhaar` is never sent.
 */
export function buildFarmerPatch(
  initial: EditFarmerFormValues,
  edited: EditFarmerFormValues,
  options: FarmerPatchOptions,
): UpdateAdminFarmerBody | null {
  const patch: UpdateAdminFarmerBody = {};
  for (const key of REQUIRED_TEXT_FIELDS) {
    const next = edited[key].trim();
    if (next !== initial[key].trim()) patch[key] = next;
  }
  for (const key of NULLABLE_TEXT_FIELDS) {
    const next = textOrNull(edited[key]);
    if (next !== textOrNull(initial[key])) patch[key] = next;
  }
  if (edited.gender !== initial.gender) patch.gender = edited.gender;
  if (edited.farmingExperienceYears !== initial.farmingExperienceYears) {
    patch.farmingExperienceYears = edited.farmingExperienceYears;
  }
  if (options.canEditLockedFields) {
    for (const key of LOCKED_TEXT_FIELDS) {
      const next = edited[key].trim();
      if (next !== initial[key].trim()) patch[key] = next;
    }
  }
  return Object.keys(patch).length === 0 ? null : patch;
}

export function toFarmerDocument(dto: AdminFarmerDocumentDto): FarmerDocumentView {
  return {
    id: dto.id,
    docType: dto.docType,
    mimeType: dto.mimeType,
    sizeBytes: dto.sizeBytes,
    isMandatory: dto.isMandatory,
    verificationStatus: dto.verificationStatus,
    isVerified: dto.verificationStatus === 'VERIFIED',
    verifiedAt: dto.verifiedAt,
    rejectReason: dto.rejectReason,
    uploadedAt: dto.uploadedAt,
    readUrl: dto.readUrl,
    fileName: null,
  };
}

export function toPayoutDestination(dto: AdminFarmerPayoutDestinationDto): PayoutDestinationView {
  return {
    id: dto.id,
    kind: dto.kind,
    accountHolderName: dto.accountHolderName,
    accountNumberLast4: last4(dto.accountNumberLast4),
    ifsc: dto.ifsc,
    bankName: dto.bankName,
    branchName: dto.branchName,
    upiVpa: dto.upiVpa,
    isVerified: dto.isVerified,
    isDefault: dto.isDefault,
  };
}

export function toFarmerSubscription(dto: AdminFarmerSubscriptionDto): FarmerSubscriptionView {
  const current = dto.current;
  return {
    hasSubscription: current !== null,
    tier: current?.tier ?? null,
    status: current?.status ?? null,
    periodStart: current?.periodStart ?? null,
    periodEnd: current?.periodEnd ?? null,
    limitsEnforced: dto.freeTierLimits.enforced,
    listingLimit: dto.freeTierLimits.listingLimit,
    planName: null,
    paymentHistory: null,
  };
}

/** BR-06: read-only; `isRated` is false only for the never-rated shell (source null). */
export function toFarmerRating(dto: FarmRatingDto): FarmerRatingView {
  return {
    isRated: dto.source !== null,
    status: dto.status,
    overallRating: dto.overallRating,
    ratingTierCode: dto.ratingTier,
    ratedAt: dto.ratedAt,
    periodLabel: dto.periodLabel,
    source: dto.source,
    sourceAuditId: dto.sourceAuditId,
    categories: dto.modules.map((m) => ({ code: m.categoryCode, score: m.score, maxScore: m.maxScore })),
    history: null,
  };
}

// ---------------------------------------------------------------------------
// Applications (stored JSONB step payloads, read defensively)
// ---------------------------------------------------------------------------

type Json = Readonly<Record<string, unknown>>;

function asObject(value: unknown): Json | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Json) : null;
}

function str(obj: Json | null, key: string): string | null {
  const v = obj?.[key];
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed === '' ? null : trimmed;
}

function num(obj: Json | null, key: string): number | null {
  const v = obj?.[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function strList(obj: Json | null, key: string): string[] {
  const v = obj?.[key];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === 'string' && x.trim() !== '').map((x) => x.trim());
}

function objList(obj: Json | null, key: string): Json[] {
  const v = obj?.[key];
  if (!Array.isArray(v)) return [];
  const out: Json[] = [];
  for (const item of v) {
    const o = asObject(item);
    if (o !== null) out.push(o);
  }
  return out;
}

function hasBoundary(location: Json): boolean {
  return asObject(location['fmbPolygon']) !== null;
}

function toApplicationLocation(location: Json): ApplicationLocationView {
  const lat = num(location, 'latitude');
  const lng = num(location, 'longitude');
  return {
    id: str(location, 'id'),
    label: str(location, 'label'),
    areaAcres: num(location, 'areaAcres'),
    calculatedAreaAcres: num(location, 'calculatedAreaAcres'),
    village: str(location, 'village'),
    taluk: str(location, 'taluk'),
    district: str(location, 'district'),
    hasBoundary: hasBoundary(location),
    gps: lat === null || lng === null ? null : { lat, lng },
  };
}

function toApplicationDocument(doc: Json): ApplicationDocumentView {
  return {
    docType: str(doc, 'docType'),
    docSubType: str(doc, 'docSubType'),
    fileName: str(doc, 'fileName'),
    fileUrl: str(doc, 'fileUrl'),
  };
}

function applicantName(dto: FarmerApplicationDto, step1: Json | null): string {
  const fromRow = typeof dto.fullName === 'string' ? dto.fullName.trim() : '';
  return fromRow !== '' ? fromRow : (str(step1, 'fullName') ?? '');
}

function isDecided(status: string): boolean {
  return status === 'APPROVED' || status === 'REJECTED';
}

export function toApplicationRow(dto: FarmerApplicationDto): ApplicationRowView {
  const step1 = asObject(dto.step1Personal);
  const step2 = asObject(dto.step2FarmDetails);
  const locations = objList(asObject(dto.step3Location), 'locations');
  const documents = objList(asObject(dto.step4Documents), 'documents');
  const name = applicantName(dto, step1);
  return {
    id: dto.id,
    name,
    initials: farmerInitials(name),
    mobile: dto.mobile,
    status: dto.status,
    isDraft: dto.isDraft === true,
    village: str(step1, 'village'),
    district: str(step1, 'district'),
    farmingType: str(step2, 'typeOfFarming'),
    primaryCrops: strList(step2, 'primaryCrops'),
    statedAreaAcres: num(step2, 'totalAreaAcres'),
    locationCount: locations.length,
    boundaryCount: locations.filter(hasBoundary).length,
    documentCount: documents.length,
    aadhaarLast4: last4(step1?.['aadhaarLast4']),
    submittedAt: dto.submittedAt,
    createdAt: dto.createdAt,
    zoneId: dto.zoneId ?? null,
    slaDueAt: dto.slaDueAt ?? null,
    documentsComplete: dto.documentsComplete ?? null,
    applicationCode: null,
    kycStatus: null,
  };
}

export function toApplicationDetail(dto: FarmerApplicationDto): ApplicationDetailView {
  const step1 = asObject(dto.step1Personal);
  const step2 = asObject(dto.step2FarmDetails);
  return {
    id: dto.id,
    status: dto.status,
    isDecided: isDecided(dto.status),
    isDraft: dto.isDraft === true,
    currentStep: typeof dto.currentStep === 'number' ? dto.currentStep : null,
    completedSteps: [...dto.completedSteps],
    submittedAt: dto.submittedAt,
    createdAt: dto.createdAt,
    applicant: {
      name: applicantName(dto, step1),
      mobile: dto.mobile,
      dob: str(step1, 'dob'),
      gender: str(step1, 'gender'),
      aadhaarLast4: last4(step1?.['aadhaarLast4']),
      preferredLocale: typeof dto.preferredLocale === 'string' ? dto.preferredLocale : null,
      address: {
        line1: str(step1, 'addressLine1'),
        line2: str(step1, 'addressLine2'),
        text: str(step1, 'address'),
        village: str(step1, 'village'),
        taluk: str(step1, 'taluk'),
        district: str(step1, 'district'),
        pincode: str(step1, 'pincode'),
      },
    },
    farming: {
      farmName: str(step2, 'farmName'),
      typeOfFarming: str(step2, 'typeOfFarming'),
      // Experience moved to step 2; step 1's copy is the legacy field older drafts still carry.
      experienceYears: num(step2, 'experienceYears') ?? num(step1, 'farmingExperienceYears'),
      statedAreaAcres: num(step2, 'totalAreaAcres'),
      statedNumberOfFarms: num(step2, 'numberOfFarms'),
      waterSource: str(step2, 'waterSource'),
      primaryCrops: strList(step2, 'primaryCrops'),
    },
    locations: objList(asObject(dto.step3Location), 'locations').map(toApplicationLocation),
    documents: objList(asObject(dto.step4Documents), 'documents').map(toApplicationDocument),
    tohfaFarmerId: dto.tohfaFarmerId ?? null,
    decidedAt: dto.decidedAt ?? null,
    rejectionReason: dto.rejectionReason ?? null,
    infoRequest: dto.infoRequest ?? null,
    zoneId: dto.zoneId ?? null,
    applicationCode: null,
    reviewHistory: null,
    documentVerification: null,
    declaration: null,
  };
}
