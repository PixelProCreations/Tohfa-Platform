/**
 * Admin farmer application review (docs/openapi.yaml /admin/farmer-applications):
 *   GET  /admin/farmer-applications                  farmer.application.list_pending
 *   GET  /admin/farmer-applications/{id}             farmer.application.view
 *   POST /admin/farmer-applications/{id}/approve     farmer.application.approve       Idempotency-Key
 *   POST /admin/farmer-applications/{id}/reject      farmer.application.reject        Idempotency-Key
 *   POST /admin/farmer-applications/{id}/request-info farmer.application.request_info Idempotency-Key
 *
 * The spec declares the Idempotency-Key header (required) on the three
 * decisions, so each takes one; the routes in
 * apps/api/src/modules/farmer-applications do not read it today, so a replay is
 * guarded by the server's own CONFLICT check (already approved / rejected).
 *
 * SPEC vs SERVER: the spec types the list items as `FarmerApplicationSummary`
 * and the detail as `FarmerApplication` (zoneId, tohfaFarmerId, decidedAt,
 * rejectionReason, infoRequest, slaDueAt, documentsComplete, `data`). The
 * server (farmer-applications.service.ts mapApplicationResponse) answers both
 * with the raw application row: the step payloads as stored, and none of those
 * fields. `FarmerApplicationDto` is what the server sends, with the spec-only
 * fields optional so they are used if the server is brought to spec. The
 * `zoneId` list filter is accepted by the server but not applied (repo).
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
export const APPLICATION_LIST_FILTER_STATUSES = ['SUBMITTED', 'DOCS_REVIEW', 'FARM_VERIFICATION', 'AUDIT', 'APPROVED', 'REJECTED'] as const;
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

/** A stored step payload (JSONB). Shape per farmer-applications.schema.ts, not guaranteed. */
export type ApplicationStepPayload = Readonly<Record<string, unknown>> | null;

/** What GET/POST /admin/farmer-applications* answer (see the header on spec vs server). */
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
  // Spec-only (docs/openapi.yaml FarmerApplication / FarmerApplicationSummary); not sent today.
  tohfaFarmerId?: string | null;
  zoneId?: string | null;
  decidedAt?: string | null;
  decidedBy?: string | null;
  rejectionReason?: string | null;
  infoRequest?: string | null;
  slaDueAt?: string | null;
  documentsComplete?: boolean;
}

export type FarmerApplicationPage = Page<FarmerApplicationDto>;

export interface ListFarmerApplicationsParams {
  status?: ApplicationListFilterStatus | undefined;
  /** In the spec; accepted but NOT applied by the server today. */
  zoneId?: string | undefined;
  /** ISO date-time. */
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

/** docs/openapi.yaml request-info body. */
export interface RequestInfoApplicationBody {
  /** 5-1000 chars. */
  message: string;
  /** Registration steps 1-5 to send back to the applicant. */
  requiredSteps?: number[];
}

/** API validation limits (spec / schema), not business thresholds. */
export const APPLICATION_LIST_MAX_LIMIT = 100;
export const APPROVE_NOTE_MAX = 500;
export const REJECT_REASON_MIN = 5;
export const REJECT_REASON_MAX = 500;
export const INFO_MESSAGE_MIN = 5;
export const INFO_MESSAGE_MAX = 1000;

/** Problem codes these routes document (401/403/404/409/422/500), plus a reused key. */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
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

/** BR-69: 422 with zero farm locations; BR-135: 409 for an admin applicant; 409 if already approved. */
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

/** Sends the application back to the applicant (the server moves it to DOCS_REVIEW). */
export function requestFarmerApplicationInfo(
  id: string,
  body: RequestInfoApplicationBody,
  idempotencyKey: string,
): Promise<FarmerApplicationDto> {
  return adminPost<FarmerApplicationDto>(`${applicationPath(id)}/request-info`, body, { idempotencyKey });
}
