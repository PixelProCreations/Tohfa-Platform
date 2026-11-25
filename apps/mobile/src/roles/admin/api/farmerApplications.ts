/**
 * Admin farmer application review (docs/openapi.yaml /admin/farmer-applications):
 *   GET  /admin/farmer-applications                              farmer.application.list_pending
 *   GET  /admin/farmer-applications/{id}                         farmer.application.view
 *   POST /admin/farmer-applications/{id}/approve                 farmer.application.approve         Idempotency-Key
 *   POST /admin/farmer-applications/{id}/reject                  farmer.application.reject          Idempotency-Key
 *   POST /admin/farmer-applications/{id}/request-info            farmer.application.request_info    Idempotency-Key
 *   POST /admin/farmer-applications/{id}/advance                 farmer.application.advance         Idempotency-Key
 *   POST /admin/farmer-applications/{id}/documents/{key}/review  farmer.application.verify_document Idempotency-Key
 *   POST /admin/farmer-applications/{id}/locations/{loc}/fmb-review farmer.application.verify_fmb   Idempotency-Key
 *   POST /admin/farmer-applications/{id}/notes                   farmer.application.add_note        Idempotency-Key
 *
 * The step payloads are the stored JSONB of the registration steps (BR-69
 * validates them on save); they are typed loosely here and read defensively by
 * ./farmerMappers.ts.
 *
 * No UI imports, so any admin area can reuse it.
 */
import type { ErrorCode, GenericProblemCode } from '@tohfa/shared-types';
import type { Page } from '../../../shell/api/pagination';
import { adminGet, adminPost } from './http';

/** docs/openapi.yaml `ApplicationStatus`. */
export const APPLICATION_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'DOCS_REVIEW',
  'FARM_VERIFICATION',
  'AUDIT',
  'INFO_REQUESTED',
  'APPROVED',
  'REJECTED',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** The statuses the list filter accepts (farmer-applications.schema.ts listAdminApplicationsQuery); others are 422. */
export const APPLICATION_LIST_FILTER_STATUSES = [
  'SUBMITTED',
  'DOCS_REVIEW',
  'FARM_VERIFICATION',
  'AUDIT',
  'INFO_REQUESTED',
  'APPROVED',
  'REJECTED',
] as const;
export type ApplicationListFilterStatus = (typeof APPLICATION_LIST_FILTER_STATUSES)[number];

/** docs/openapi.yaml reject `reasonCode`. */
export const APPLICATION_REJECT_REASON_CODES = [
  'DOCUMENTS_INVALID',
  'LAND_NOT_VERIFIED',
  'DUPLICATE_APPLICANT',
  'OUTSIDE_SERVICE_AREA',
  'OTHER',
] as const;
export type ApplicationRejectReasonCode = (typeof APPLICATION_REJECT_REASON_CODES)[number];

/** docs/openapi.yaml `InfoRequestItem`. */
export const INFO_REQUEST_ITEMS = [
  'FMB_SKETCH',
  'AADHAAR',
  'PATTA_CHITTA',
  'BANK_DETAILS',
  'CERTIFICATE',
  'OTHER',
] as const;
export type InfoRequestItem = (typeof INFO_REQUEST_ITEMS)[number];

export type ReviewDecision = 'VERIFIED' | 'REJECTED';
export type ReviewStatus = 'PENDING' | ReviewDecision;

export interface ApplicationReviewStateDto {
  status: ReviewStatus;
  reason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

export interface ApplicationReviewDocumentDto {
  documentKey: string;
  docType: string;
  docSubType: string | null;
  fileName: string | null;
  fileUrl: string;
  required: boolean;
  review: ApplicationReviewStateDto;
}

export interface ApplicationReviewLocationDto {
  locationId: string;
  label: string | null;
  areaAcres: number | null;
  calculatedAreaAcres: number | null;
  calculatedAreaHectares: number | null;
  gpsCaptured: boolean | null;
  latitude: number | null;
  longitude: number | null;
  village: string | null;
  taluk: string | null;
  district: string | null;
  hasBoundary: boolean;
  fmbPolygon: Record<string, unknown> | null;
  fmbReview: ApplicationReviewStateDto;
}

export type ApplicationReviewBlockerKind =
  | 'MISSING_DOCUMENT_TYPE'
  | 'DOCUMENT_PENDING'
  | 'DOCUMENT_REJECTED'
  | 'FMB_PENDING'
  | 'FMB_REJECTED';

export interface ApplicationReviewBlockerDto {
  kind: ApplicationReviewBlockerKind;
  docType?: string;
  documentKey?: string;
  locationId?: string;
  label?: string | null;
  reason?: string | null;
}

export interface ApplicationReviewGateDto {
  met: boolean;
  blockers: ApplicationReviewBlockerDto[];
}

export interface ApplicationReviewHistoryItemDto {
  id?: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  actorId: string | null;
  note: string | null;
  createdAt: string;
  eventType?: 'TRANSITION' | 'NOTE';
  reasonCode?: ApplicationRejectReasonCode | string | null;
  requestedItems?: InfoRequestItem[] | null;
}

export interface InfoRequestDetailDto {
  items: InfoRequestItem[];
  message: string | null;
  requestedAt: string;
  requestedBy: string | null;
  open: boolean;
}

/** A stored step payload (JSONB). Shape per farmer-applications.schema.ts, not guaranteed. */
export type ApplicationStepPayload = Readonly<Record<string, unknown>> | null;

/** What GET/POST /admin/farmer-applications* answer (docs/openapi.yaml FarmerApplication / FarmerApplicationReviewDetail). */
export interface FarmerApplicationDto {
  id: string;
  mobile: string;
  fullName: string | null;
  preferredLocale?: string | null;
  status: ApplicationStatus;
  isDraft?: boolean;
  currentStep?: number | null;
  completedSteps: number[];
  step1Personal?: ApplicationStepPayload;
  step2FarmDetails?: ApplicationStepPayload;
  step3Location?: ApplicationStepPayload;
  step4Documents?: ApplicationStepPayload;
  submittedAt: string | null;
  createdAt: string;
  applicationCode?: string | null;
  tohfaFarmerId?: string | null;
  zoneId?: string | null;
  decidedAt?: string | null;
  decidedBy?: string | null;
  rejectionReason?: string | null;
  rejectionReasonCode?: ApplicationRejectReasonCode | null;
  infoRequest?: string | null;
  infoRequestDetail?: InfoRequestDetailDto | null;
  slaDueAt?: string | null;
  documentsComplete?: boolean;
  reviewHistory?: ApplicationReviewHistoryItemDto[];
  documents?: ApplicationReviewDocumentDto[];
  locations?: ApplicationReviewLocationDto[];
  reviewGates?: {
    farmVerification: ApplicationReviewGateDto;
    approval: ApplicationReviewGateDto;
  };
}

export type FarmerApplicationPage = Page<FarmerApplicationDto>;

export interface ListFarmerApplicationsParams {
  status?: ApplicationListFilterStatus | undefined;
  zoneId?: string | undefined;
  submittedAfter?: string | undefined;
  cursor?: string | undefined;
  /** 1-100, server default 20. */
  limit?: number | undefined;
}

/** Approve body: both optional. */
export interface ApproveApplicationBody {
  zoneId?: string;
  /** Up to 500 chars. */
  note?: string;
}

/** docs/openapi.yaml reject body: both required, reason 5-500 chars. */
export interface RejectApplicationBody {
  reasonCode: ApplicationRejectReasonCode;
  reason: string;
}

/** docs/openapi.yaml request-info body (BR-217). */
export interface RequestInfoApplicationBody {
  /** At least 1 checklist item. */
  items: InfoRequestItem[];
  /** 5-1000 chars. */
  message: string;
  /** Registration steps 1-5 to re-open. */
  requiredSteps?: number[];
}

/** docs/openapi.yaml advance body (BR-214). */
export interface AdvanceApplicationBody {
  toStatus: 'FARM_VERIFICATION';
  note?: string;
}

/** docs/openapi.yaml document/FMB review body (BR-215, BR-216). */
export interface ReviewDecisionBody {
  decision: ReviewDecision;
  /** Required when decision === 'REJECTED' (5-500 chars); disallowed when VERIFIED. */
  reason?: string;
}

/** docs/openapi.yaml note body (BR-218). */
export interface AddApplicationNoteBody {
  /** 1-1000 chars. */
  note: string;
}

/** API validation limits (spec / schema), not business thresholds. */
export const APPLICATION_LIST_MAX_LIMIT = 100;
export const APPROVE_NOTE_MAX = 500;
export const REJECT_REASON_MIN = 5;
export const REJECT_REASON_MAX = 500;
export const INFO_MESSAGE_MIN = 5;
export const INFO_MESSAGE_MAX = 1000;
export const REVIEW_NOTE_MAX = 1000;

/** Problem codes these routes document (401/403/404/409/422/500), plus review gates and replay. */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'INVALID_STATE_TRANSITION',
  'APPLICATION_DOCUMENTS_NOT_VERIFIED',
  'APPLICATION_FMB_NOT_VERIFIED',
  'ZONE_NOT_FOUND',
  'VALIDATION_FAILED',
  'IDEMPOTENCY_KEY_REUSED',
  'INTERNAL',
];

const BASE = '/admin/farmer-applications';

function applicationPath(id: string): string {
  return `${BASE}/${encodeURIComponent(id)}`;
}

/** The review queue, newest first, cursor paged. With no status the server returns every status. */
export function listFarmerApplications(
  params: ListFarmerApplicationsParams = {},
  signal?: AbortSignal,
): Promise<FarmerApplicationPage> {
  return adminGet<FarmerApplicationPage>(
    BASE,
    {
      status: params.status,
      zoneId: params.zoneId,
      submittedAfter: params.submittedAfter,
      cursor: params.cursor,
      limit: params.limit,
    },
    signal,
  );
}

export function getFarmerApplication(id: string, signal?: AbortSignal): Promise<FarmerApplicationDto> {
  return adminGet<FarmerApplicationDto>(applicationPath(id), undefined, signal);
}

/** BR-69: 422 with zero farm locations; BR-135: 409 for an admin applicant; BR-214: 409 if not FARM_VERIFICATION or gates unmet. */
export function approveFarmerApplication(
  id: string,
  body: ApproveApplicationBody,
  idempotencyKey: string,
): Promise<FarmerApplicationDto> {
  return adminPost<FarmerApplicationDto>(`${applicationPath(id)}/approve`, body, { idempotencyKey });
}

/** Terminal; 409 if already rejected. */
export function rejectFarmerApplication(
  id: string,
  body: RejectApplicationBody,
  idempotencyKey: string,
): Promise<FarmerApplicationDto> {
  return adminPost<FarmerApplicationDto>(`${applicationPath(id)}/reject`, body, { idempotencyKey });
}

/** BR-217: moves to INFO_REQUESTED from DOCS_REVIEW or FARM_VERIFICATION. */
export function requestFarmerApplicationInfo(
  id: string,
  body: RequestInfoApplicationBody,
  idempotencyKey: string,
): Promise<FarmerApplicationDto> {
  return adminPost<FarmerApplicationDto>(`${applicationPath(id)}/request-info`, body, { idempotencyKey });
}

/** BR-214: DOCS_REVIEW -> FARM_VERIFICATION once documents gate is met. */
export function advanceFarmerApplication(
  id: string,
  body: AdvanceApplicationBody,
  idempotencyKey: string,
): Promise<FarmerApplicationDto> {
  return adminPost<FarmerApplicationDto>(`${applicationPath(id)}/advance`, body, { idempotencyKey });
}

/** BR-215: verify or reject one step-4 document. */
export function reviewFarmerApplicationDocument(
  id: string,
  documentKey: string,
  body: ReviewDecisionBody,
  idempotencyKey: string,
): Promise<FarmerApplicationDto> {
  return adminPost<FarmerApplicationDto>(
    `${applicationPath(id)}/documents/${encodeURIComponent(documentKey)}/review`,
    body,
    { idempotencyKey },
  );
}

/** BR-216: verify or reject one step-3 location FMB boundary. */
export function reviewFarmerApplicationFmb(
  id: string,
  locationId: string,
  body: ReviewDecisionBody,
  idempotencyKey: string,
): Promise<FarmerApplicationDto> {
  return adminPost<FarmerApplicationDto>(
    `${applicationPath(id)}/locations/${encodeURIComponent(locationId)}/fmb-review`,
    body,
    { idempotencyKey },
  );
}

/** BR-218: save an internal review note without changing status. */
export function addFarmerApplicationNote(
  id: string,
  body: AddApplicationNoteBody,
  idempotencyKey: string,
): Promise<FarmerApplicationDto> {
  return adminPost<FarmerApplicationDto>(`${applicationPath(id)}/notes`, body, { idempotencyKey });
}
