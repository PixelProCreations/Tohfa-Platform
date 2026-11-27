/**
 * Typed calls for the farmer-application review screen (SA-M3-S016a/b). Kept in its own file so the
 * queue's `AdminFarmerApplicationsService` is not edited for the review screen; every call here is
 * declared in docs/openapi.yaml and re-checked by the API with the permission named beside it.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { FarmerApplicationDetail } from './farmer-applications.service';

/** docs/openapi.yaml `InfoRequestItem` (BR-217). */
export type InfoRequestItem = 'FMB_SKETCH' | 'AADHAAR' | 'PATTA_CHITTA' | 'BANK_DETAILS' | 'CERTIFICATE' | 'OTHER';

/** The reject `reasonCode` enum of docs/openapi.yaml `rejectFarmerApplication`. */
export type RejectReasonCode = 'DOCUMENTS_INVALID' | 'LAND_NOT_VERIFIED' | 'DUPLICATE_APPLICANT' | 'OUTSIDE_SERVICE_AREA' | 'OTHER';

/** docs/openapi.yaml `ApplicationReviewState`. */
export interface ApplicationReviewState {
  status: 'PENDING' | 'VERIFIED' | 'REJECTED';
  reason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

/** docs/openapi.yaml `ApplicationReviewBlocker` — one unmet condition of a BR-214 gate. */
export interface ApplicationReviewBlocker {
  kind: 'MISSING_DOCUMENT_TYPE' | 'DOCUMENT_PENDING' | 'DOCUMENT_REJECTED' | 'FMB_PENDING' | 'FMB_REJECTED';
  docType?: string;
  documentKey?: string;
  locationId?: string;
  label?: string | null;
  reason?: string | null;
}

/** docs/openapi.yaml `ApplicationReviewGate`. */
export interface ApplicationReviewGate {
  met: boolean;
  blockers: ApplicationReviewBlocker[];
}

/** docs/openapi.yaml `FarmerApplicationReviewDetail.documents[]`. */
export interface ApplicationReviewDocument {
  documentKey: string;
  docType: 'ID_PROOF' | 'FARM_DOC' | 'CERTIFICATE' | 'OTHER';
  docSubType?: string | null;
  fileName?: string | null;
  fileUrl: string;
  required: boolean;
  review: ApplicationReviewState;
}

/** docs/openapi.yaml `FarmerApplicationReviewDetail.locations[]`. */
export interface ApplicationReviewLocation {
  locationId: string;
  label?: string | null;
  areaAcres?: number | null;
  calculatedAreaAcres?: number | null;
  calculatedAreaHectares?: number | null;
  gpsCaptured?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
  village?: string | null;
  taluk?: string | null;
  district?: string | null;
  hasBoundary: boolean;
  fmbPolygon: { type: 'Polygon'; coordinates: number[][][] } | null;
  fmbReview: ApplicationReviewState;
}

/** docs/openapi.yaml `FarmerApplication.reviewHistory[]` (append-only, BR-218). */
export interface ApplicationReviewHistoryItem {
  id?: string;
  fromStatus?: string | null;
  toStatus: string;
  actorId?: string | null;
  note?: string | null;
  createdAt: string;
  eventType?: 'TRANSITION' | 'NOTE';
  reasonCode?: string | null;
  requestedItems?: InfoRequestItem[] | null;
}

/**
 * docs/openapi.yaml `FarmerApplicationReviewDetail` (BR-214..BR-218), plus the step objects
 * (`step1Personal` …) the API also returns and `FarmerApplicationDetail` already types.
 */
export interface FarmerApplicationReviewDetail extends FarmerApplicationDetail {
  /**
   * Display code `APP-YYYY-XXXX`. Returned by the API (farmer-applications.service.ts
   * mapApplicationResponse) but not declared in docs/openapi.yaml — optional, the screen falls
   * back to the id without it.
   */
  applicationCode?: string;
  tohfaFarmerId?: string | null;
  zoneId?: string | null;
  decidedAt?: string | null;
  decidedBy?: string | null;
  rejectionReason?: string | null;
  rejectionReasonCode?: string | null;
  infoRequestDetail?: {
    items: InfoRequestItem[];
    message: string | null;
    requestedAt: string;
    requestedBy: string | null;
    open: boolean;
  } | null;
  reviewHistory?: ApplicationReviewHistoryItem[];
  documents: ApplicationReviewDocument[];
  locations: ApplicationReviewLocation[];
  reviewGates: { farmVerification: ApplicationReviewGate; approval: ApplicationReviewGate };
}

/** docs/openapi.yaml `ReviewDecisionRequest` (BR-215 / BR-216). */
export interface ReviewDecisionRequest {
  decision: 'VERIFIED' | 'REJECTED';
  reason?: string;
}

/** docs/openapi.yaml `AuditCreate` (POST /admin/audits, `audit.schedule`). */
export interface AuditCreateRequest {
  farmerId: string;
  farmId?: string;
  auditType: 'INTERNAL' | 'EXTERNAL';
  scheduledFor: string;
  auditorUserId?: string;
  externalAgencyName?: string;
}

/** The fields of docs/openapi.yaml `AuditDetail` the review screen reads back. */
export interface ScheduledAudit {
  id: string;
  scheduledFor: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class FarmerApplicationReviewService {
  private readonly http = inject(HttpClient);

  private base(id: string): string {
    return `/v1/admin/farmer-applications/${encodeURIComponent(id)}`;
  }

  /** Every review mutation requires an Idempotency-Key per docs/openapi.yaml. */
  private idem(): { headers: Record<string, string> } {
    return { headers: { 'Idempotency-Key': crypto.randomUUID() } };
  }

  /** GET /admin/farmer-applications/{id} typed as the review detail (`farmer.application.view`). */
  getReviewDetail(id: string): Observable<FarmerApplicationReviewDetail> {
    return this.http.get<FarmerApplicationReviewDetail>(this.base(id));
  }

  /** POST .../approve (`farmer.application.approve`). Only from FARM_VERIFICATION (BR-214). */
  approve(id: string, note: string): Observable<unknown> {
    return this.http.post(`${this.base(id)}/approve`, note ? { note } : {}, this.idem());
  }

  /** POST .../reject (`farmer.application.reject`). */
  reject(id: string, body: { reasonCode: RejectReasonCode; reason: string }): Observable<unknown> {
    return this.http.post(`${this.base(id)}/reject`, body, this.idem());
  }

  /**
   * POST .../request-info with the BR-217 checklist (`farmer.application.request_info`). The spec
   * makes `items` required; the older `AdminFarmerApplicationsService.requestInfo` does not send it.
   */
  requestInfo(id: string, body: { items: InfoRequestItem[]; message: string }): Observable<unknown> {
    return this.http.post(`${this.base(id)}/request-info`, body, this.idem());
  }

  /** POST .../documents/{documentKey}/review (`farmer.application.verify_document`, BR-215). */
  reviewDocument(id: string, documentKey: string, body: ReviewDecisionRequest): Observable<FarmerApplicationReviewDetail> {
    return this.http.post<FarmerApplicationReviewDetail>(
      `${this.base(id)}/documents/${encodeURIComponent(documentKey)}/review`,
      body,
      this.idem(),
    );
  }

  /** POST .../locations/{locationId}/fmb-review (`farmer.application.verify_fmb`, BR-216). */
  reviewFmb(id: string, locationId: string, body: ReviewDecisionRequest): Observable<FarmerApplicationReviewDetail> {
    return this.http.post<FarmerApplicationReviewDetail>(
      `${this.base(id)}/locations/${encodeURIComponent(locationId)}/fmb-review`,
      body,
      this.idem(),
    );
  }

  /** POST .../advance to FARM_VERIFICATION (`farmer.application.advance`, BR-214 documents gate). */
  advance(id: string): Observable<FarmerApplicationReviewDetail> {
    return this.http.post<FarmerApplicationReviewDetail>(
      `${this.base(id)}/advance`,
      { toStatus: 'FARM_VERIFICATION' },
      this.idem(),
    );
  }

  /** POST .../notes (`farmer.application.add_note`, BR-218). */
  addNote(id: string, note: string): Observable<FarmerApplicationReviewDetail> {
    return this.http.post<FarmerApplicationReviewDetail>(`${this.base(id)}/notes`, { note }, this.idem());
  }

  /** POST /admin/audits (`audit.schedule`, BR-03). */
  scheduleAudit(body: AuditCreateRequest): Observable<ScheduledAudit> {
    return this.http.post<ScheduledAudit>('/v1/admin/audits', body);
  }
}
