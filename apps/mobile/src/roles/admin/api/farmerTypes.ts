/**
 * View-models for the Farmers Management screens (team design:
 * AdminAllFarmersScreen, AdminFarmerDetailScreen, AdminEditFarmerScreen,
 * AdminPendingApplicationsScreen, AdminApplicationDetailScreen), built by
 * ./farmerMappers.ts from the API DTOs.
 *
 * A field typed `null` (the literal type) is shown by the design but has NO
 * API source today. It stays null: a screen must render it as "not available"
 * or hide it, never fill it with a demo value. Values are raw (ISO dates,
 * enum codes, numbers); labels and date formatting belong to the screen and
 * the i18n catalogue.
 */
import type { ApplicationStatus } from './farmerApplications';
import type {
  AdminFarmerAccountStatus,
  AdminFarmerApplicationStatus,
  AdminFarmerKycStatus,
  FarmerDocumentType,
  FarmerDocumentVerificationStatus,
  FarmerGender,
  RatingTierCode,
} from './farmers';

/** The account status as the screen shows it; a DISABLED farmer is never shown as pending. */
export type FarmerUiStatus = 'active' | 'pending' | 'disabled' | 'unknown';

/** One card of the farmers list. */
export interface FarmerRowView {
  id: string;
  farmerCode: string;
  name: string;
  initials: string;
  mobile: string;
  zoneId: string | null;
  zoneName: string | null;
  status: FarmerUiStatus;
  accountStatus: AdminFarmerAccountStatus;
  applicationStatus: AdminFarmerApplicationStatus;
  kycStatus: AdminFarmerKycStatus;
  /** 0-100 (BR-06). The design's 0-5 star figure has no API source and is NOT derived. */
  overallRating: number | null;
  ratingTierCode: RatingTierCode | null;
  ratingTierLabel: string | null;
  landLocationCount: number;
  isMarketBlocked: boolean;
  registeredAt: string;
  /** Not in the list API. */
  farmingType: null;
  farmName: null;
  subscriptionLabel: null;
  hasExpiredCertification: null;
}

export interface FarmerAddressView {
  line1: string | null;
  line2: string | null;
  village: string | null;
  taluk: string | null;
  district: string;
  pincode: string | null;
}

export interface FarmerPlotView {
  id: string;
  name: string;
  areaAcres: number | null;
  soilType: string | null;
  irrigationType: string | null;
  sunExposure: string | null;
}

export interface FarmerLandLocationView {
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
  plots: FarmerPlotView[];
}

export interface FarmerCertificationView {
  total: number;
  verifiedCurrent: number;
  verifiedExpired: number;
  unverified: number;
  rejected: number;
  /** Every certificate past expiry, whatever its status (overlaps the others). */
  expired: number;
  qualifying: number;
  nextQualifyingExpiry: string | null;
}

/** The farmer profile (header, Personal tab, Farm & land tab). */
export interface FarmerDetailView {
  id: string;
  farmerCode: string;
  name: string;
  initials: string;
  mobile: string;
  email: string | null;
  status: FarmerUiStatus;
  accountStatus: AdminFarmerAccountStatus;
  applicationStatus: AdminFarmerApplicationStatus;
  kycStatus: AdminFarmerKycStatus;
  zoneId: string | null;
  zoneName: string | null;
  /** BR-33b: four digits or null. */
  aadhaarLast4: string | null;
  dob: string | null;
  gender: FarmerGender | null;
  farmingExperienceYears: number | null;
  address: FarmerAddressView;
  isMarketBlocked: boolean;
  marketBlockReason: string | null;
  landLocations: FarmerLandLocationView[];
  certification: FarmerCertificationView;
  overallRating: number | null;
  ratingTierCode: RatingTierCode | null;
  ratingTierLabel: string | null;
  registeredAt: string;
  approvedAt: string | null;
  /** Not in the profile API. */
  farmingType: null;
  farmProfile: null;
  lifecycle: null;
  lastAuditAt: null;
}

/** The edit form's values. Text fields are '' for "none" so inputs stay controlled. */
export interface EditFarmerFormValues {
  fullName: string;
  email: string;
  dob: string;
  gender: FarmerGender | null;
  farmingExperienceYears: number | null;
  addressLine1: string;
  addressLine2: string;
  village: string;
  taluk: string;
  district: string;
  pincode: string;
  /** Locked (BR-33). */
  mobile: string;
  /** Locked (BR-33). */
  aadhaarLast4: string;
}

export interface FarmerDocumentView {
  id: string;
  docType: FarmerDocumentType;
  mimeType: string;
  sizeBytes: number | null;
  isMandatory: boolean;
  verificationStatus: FarmerDocumentVerificationStatus;
  isVerified: boolean;
  verifiedAt: string | null;
  rejectReason: string | null;
  uploadedAt: string;
  readUrl: string | null;
  /** The design shows a file name; the API sends none. */
  fileName: null;
}

export interface PayoutDestinationView {
  id: string;
  kind: 'BANK' | 'UPI';
  accountHolderName: string;
  /** BR-53a: four digits or null. */
  accountNumberLast4: string | null;
  ifsc: string | null;
  bankName: string | null;
  branchName: string | null;
  upiVpa: string | null;
  isVerified: boolean;
  isDefault: boolean;
}

export interface FarmerSubscriptionView {
  hasSubscription: boolean;
  tier: 'FREE' | 'PAID' | null;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'WAIVED' | null;
  periodStart: string | null;
  periodEnd: string | null;
  limitsEnforced: boolean;
  /** BR-14b: null while the free-tier gate is off. */
  listingLimit: number | null;
  /** Not in the API. */
  planName: null;
  paymentHistory: null;
}

export interface FarmerRatingCategoryView {
  /** The client owns the label (i18n) for this code. */
  code: string;
  score: number | null;
  maxScore: number;
}

/** BR-06: read-only. There is deliberately no edit capability on this view. */
export interface FarmerRatingView {
  isRated: boolean;
  status: 'DRAFT' | 'COMPLETE';
  overallRating: number | null;
  ratingTierCode: RatingTierCode | null;
  ratedAt: string | null;
  periodLabel: string;
  source: 'AUDIT' | 'MANUAL' | null;
  sourceAuditId: string | null;
  categories: FarmerRatingCategoryView[];
  /** No rating-history endpoint exists. */
  history: null;
}

/** One card of the application queue / Applications tab. */
export interface ApplicationRowView {
  id: string;
  name: string;
  initials: string;
  mobile: string;
  status: ApplicationStatus;
  isDraft: boolean;
  village: string | null;
  district: string | null;
  farmingType: string | null;
  primaryCrops: string[];
  /** The applicant's stated total (step 2), not the sum of the measured locations. */
  statedAreaAcres: number | null;
  locationCount: number;
  /** Locations carrying a drawn FMB boundary. */
  boundaryCount: number;
  documentCount: number;
  aadhaarLast4: string | null;
  submittedAt: string | null;
  createdAt: string;
  /** In the spec, not sent by the server today. */
  zoneId: string | null;
  slaDueAt: string | null;
  documentsComplete: boolean | null;
  /** No human application code or KYC status exists for an application. */
  applicationCode: null;
  kycStatus: null;
}

export interface ApplicationAddressView {
  line1: string | null;
  line2: string | null;
  /** The legacy single-line address. */
  text: string | null;
  village: string | null;
  taluk: string | null;
  district: string | null;
  pincode: string | null;
}

export interface ApplicationApplicantView {
  name: string;
  mobile: string;
  /** As stored: "DD / MM / YYYY" or YYYY-MM-DD. */
  dob: string | null;
  /** As stored (the app sends title case). */
  gender: string | null;
  aadhaarLast4: string | null;
  preferredLocale: string | null;
  address: ApplicationAddressView;
}

export interface ApplicationFarmingView {
  farmName: string | null;
  typeOfFarming: string | null;
  experienceYears: number | null;
  statedAreaAcres: number | null;
  statedNumberOfFarms: number | null;
  waterSource: string | null;
  primaryCrops: string[];
}

export interface ApplicationLocationView {
  id: string | null;
  label: string | null;
  areaAcres: number | null;
  calculatedAreaAcres: number | null;
  village: string | null;
  taluk: string | null;
  district: string | null;
  hasBoundary: boolean;
  gps: { lat: number; lng: number } | null;
}

export interface ApplicationDocumentView {
  docType: string | null;
  docSubType: string | null;
  fileName: string | null;
  fileUrl: string | null;
}

/** The application review screen (sections 01-05). */
export interface ApplicationDetailView {
  id: string;
  status: ApplicationStatus;
  /** APPROVED or REJECTED. */
  isDecided: boolean;
  isDraft: boolean;
  currentStep: number | null;
  completedSteps: number[];
  submittedAt: string | null;
  createdAt: string;
  applicant: ApplicationApplicantView;
  farming: ApplicationFarmingView;
  locations: ApplicationLocationView[];
  documents: ApplicationDocumentView[];
  /** In the spec, not sent by the server today. */
  tohfaFarmerId: string | null;
  decidedAt: string | null;
  rejectionReason: string | null;
  infoRequest: string | null;
  zoneId: string | null;
  /** No API source. */
  applicationCode: null;
  reviewHistory: null;
  documentVerification: null;
  declaration: null;
}
