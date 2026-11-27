import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

/** Mirrors docs/openapi.yaml `AdminFarmerAccountStatus` (`users.status`). */
export type AdminFarmerAccountStatus = 'PENDING' | 'ACTIVE' | 'DISABLED';

export type AdminFarmerKycStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

/** Mirrors docs/openapi.yaml `AdminFarmerZone`. */
export interface AdminFarmerZone {
  id: string;
  code: string;
  name: string;
}

/** Mirrors docs/openapi.yaml `AdminFarmerListItem`. Admin-only (BR-16). */
export interface AdminFarmerListItem {
  id: string;
  tohfaFarmerId: string;
  fullName: string;
  /** E.164. */
  mobile: string;
  accountStatus: AdminFarmerAccountStatus;
  applicationStatus: string;
  kycStatus: AdminFarmerKycStatus;
  zone: AdminFarmerZone | null;
  /** 0–100, null when never rated. */
  overallRating: number | null;
  ratingTier: { code: string; label: string } | null;
  landLocationCount: number;
  isMarketBlocked: boolean;
  createdAt: string;
}

/** Mirrors docs/openapi.yaml `PageMeta` (cursor paging; `total` is not sent by this endpoint). */
export interface PageMeta {
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
}

/** Mirrors docs/openapi.yaml `AdminFarmerListResponse`. */
export interface AdminFarmerListResponse {
  items: AdminFarmerListItem[];
  page: PageMeta;
}

/** Mirrors the 200 body of docs/openapi.yaml `getAdminFarmerSummary`. */
export interface AdminFarmerSummary {
  totalFarmers: number;
  pendingApplications: number;
  activeFarmers: number;
  deactivatedFarmers: number;
  inactiveFarmers: number;
  expiredCertifications: number;
  activeSubscriptions: number;
  approvalInbox: number;
  zones: Array<AdminFarmerZone & { count: number; ratio: number }>;
}

/** Query of docs/openapi.yaml `listAdminFarmers`. */
export interface AdminFarmerListQuery {
  q?: string;
  status?: AdminFarmerAccountStatus;
  zoneId?: string;
  cursor?: string;
  limit?: number;
}

/** Mirrors docs/openapi.yaml `AdminFarmerPlot` — a zone inside a land location. */
export interface AdminFarmerPlot {
  id: string;
  name: string;
  areaAcres: number | null;
  soilType: string | null;
  irrigationType: string | null;
  sunExposure: string | null;
}

/**
 * Mirrors docs/openapi.yaml `AdminFarmerLandLocation`: one labelled parcel of the farmer's single
 * operation (a `farms` row, created from a step-3 `location` of the application on approval).
 */
export interface AdminFarmerLandLocation {
  id: string;
  name: string;
  surveyNumber: string | null;
  areaAcres: number | null;
  address: string | null;
  village: string | null;
  taluk: string | null;
  district: string;
  centroid: { lat: number; lng: number } | null;
  /** True when an FMB boundary polygon is recorded; the polygon itself is not returned. */
  hasBoundary: boolean;
  isPrimary: boolean;
  createdAt: string;
  plots: AdminFarmerPlot[];
}

/** Mirrors docs/openapi.yaml `AdminFarmerCertificationSummary`. */
export interface AdminFarmerCertificationSummary {
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

/** Mirrors docs/openapi.yaml `AdminFarmerDetail`. Admin-only (BR-16). */
export interface AdminFarmerDetail {
  id: string;
  tohfaFarmerId: string;
  fullName: string;
  /** E.164. */
  mobile: string;
  email: string | null;
  accountStatus: AdminFarmerAccountStatus;
  applicationStatus: string;
  kycStatus: AdminFarmerKycStatus;
  zone: AdminFarmerZone | null;
  aadhaarLast4: string | null;
  dob: string | null;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'UNDISCLOSED' | null;
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
  landLocations: AdminFarmerLandLocation[];
  certificationSummary: AdminFarmerCertificationSummary;
  rating: { overallRating: number | null; ratingTier: { code: string; label: string } | null };
  approvedAt: string | null;
  createdAt: string;
}

/**
 * Mirrors docs/openapi.yaml `AdminFarmerUpdateRequest` (additionalProperties: false). `mobile` and
 * `aadhaarLast4` are locked (BR-33): sending either without `farmer.profile.edit_locked_field` is
 * 403 FIELD_LOCKED and nothing is applied. The full `aadhaar` key is never sent from the UI.
 */
export interface AdminFarmerUpdateRequest {
  fullName?: string;
  email?: string | null;
  dob?: string | null;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'UNDISCLOSED' | null;
  farmingExperienceYears?: number | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  village?: string | null;
  taluk?: string | null;
  district?: string;
  pincode?: string | null;
  /** Locked (BR-33). E.164, e.g. `+919812345678`. */
  mobile?: string;
}

/**
 * Request body of docs/openapi.yaml `createAdminFarmer` (POST /v1/admin/farmers, strict). It
 * creates an ACTIVE, approved farmer directly; it carries no dob, gender, address line 2, farm,
 * land location, plot or document. The full Aadhaar number is never sent (BR-33b).
 */
export interface AdminFarmerCreateRequest {
  fullName: string;
  /** `^\+91[6-9]\d{9}$`. */
  mobile: string;
  email?: string | null;
  zoneId: string;
  village: string;
  taluk?: string | null;
  district?: string;
  pincode?: string | null;
  aadhaarLast4?: string | null;
  farmingExperienceYears?: number | null;
  addressLine1?: string | null;
}

/** Mirrors docs/openapi.yaml `AdminZoneListItem` (GET /v1/admin/zones). */
export interface AdminZoneListItem {
  id: string;
  code: string;
  shortCode: string | null;
  name: string;
  warehouseId: string | null;
  warehouseName: string | null;
  description: string | null;
  taluks: string[];
  isActive: boolean;
  createdAt: string;
}

/** The `action` enum of docs/openapi.yaml `updateAdminFarmerStatus`. */
export type AdminFarmerStatusAction = 'DEACTIVATE' | 'DISABLE' | 'ACTIVATE';

/** Request body of docs/openapi.yaml `updateAdminFarmerStatus`. */
export interface AdminFarmerStatusRequest {
  action: AdminFarmerStatusAction;
  /** 3–500 characters. */
  reason: string;
  note?: string;
}

/** Mirrors docs/openapi.yaml `AdminFarmerDocument`. */
export interface AdminFarmerDocument {
  id: string;
  docType: 'ID_PROOF' | 'ADDRESS_PROOF' | 'FARM_DOC' | 'CERTIFICATE' | 'BANK_PROOF' | 'PHOTO';
  mimeType: string;
  sizeBytes: number | null;
  isMandatory: boolean;
  verificationStatus: 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';
  verifiedBy: string | null;
  verifiedAt: string | null;
  rejectReason: string | null;
  uploadedAt: string;
  /** Signed read URL, valid for 15 minutes (BR-54c). */
  readUrl: string | null;
}

/** Mirrors docs/openapi.yaml `AuditLogEntry` (only the fields this feature reads). */
export interface AuditLogEntry {
  id: string;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  outcome: 'ALLOWED' | 'DENIED' | 'ERROR';
  changedFields: string[] | null;
  at: string;
}

@Injectable({ providedIn: 'root' })
export class FarmersService {
  private readonly http = inject(HttpClient);

  /** GET /v1/admin/farmers — `farmer.profile.view_all`, scope-filtered server-side. */
  list(query: AdminFarmerListQuery): Observable<AdminFarmerListResponse> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<AdminFarmerListResponse>('/v1/admin/farmers', { params });
  }

  /** GET /v1/admin/farmers/summary — the overview KPI counts and zone list. */
  summary(): Observable<AdminFarmerSummary> {
    return this.http.get<AdminFarmerSummary>('/v1/admin/farmers/summary');
  }

  /** GET /v1/admin/farmers/{id} — `farmer.profile.view_all`; out of scope is 404, like missing. */
  get(id: string): Observable<AdminFarmerDetail> {
    return this.http.get<AdminFarmerDetail>(`/v1/admin/farmers/${encodeURIComponent(id)}`);
  }

  /**
   * PATCH /v1/admin/farmers/{id} — `farmer.profile.edit`; locked fields additionally need
   * `farmer.profile.edit_locked_field`. The API writes the `farmer.profile.edit` audit row in the
   * same transaction; a body that repeats current values writes nothing.
   */
  update(id: string, body: AdminFarmerUpdateRequest): Observable<AdminFarmerDetail> {
    return this.http.patch<AdminFarmerDetail>(`/v1/admin/farmers/${encodeURIComponent(id)}`, body);
  }

  /**
   * POST /v1/admin/farmers — `farmer.profile.edit`. No Idempotency-Key is declared (it moves no
   * money); the API writes the `farmer.profile.create` audit row in the same transaction.
   */
  create(body: AdminFarmerCreateRequest): Observable<AdminFarmerDetail> {
    return this.http.post<AdminFarmerDetail>('/v1/admin/farmers', body);
  }

  /** GET /v1/admin/zones?status=ACTIVE — `zone.view`; a bare array, scope-filtered server-side. */
  zones(): Observable<AdminZoneListItem[]> {
    const params = new HttpParams().set('status', 'ACTIVE');
    return this.http.get<AdminZoneListItem[]>('/v1/admin/zones', { params });
  }

  /**
   * POST /v1/admin/farmers/{id}/status — `farmer.profile.edit`; ACTIVATE additionally needs
   * `farmer.account.reactivate`, DISABLE `farmer.account.disable` (checked again by the API).
   */
  updateStatus(id: string, body: AdminFarmerStatusRequest): Observable<AdminFarmerDetail> {
    return this.http.post<AdminFarmerDetail>(`/v1/admin/farmers/${encodeURIComponent(id)}/status`, body);
  }

  /** GET /v1/admin/farmers/{id}/documents — `farmer.document.view`. */
  documents(id: string): Observable<{ items: AdminFarmerDocument[] }> {
    return this.http.get<{ items: AdminFarmerDocument[] }>(`/v1/admin/farmers/${encodeURIComponent(id)}/documents`);
  }

  /** GET /v1/admin/audit-log filtered to one farmer — `auditlog.view`, newest first. */
  activity(id: string, limit: number): Observable<{ items: AuditLogEntry[]; page: PageMeta }> {
    const params = new HttpParams().set('entityType', 'farmer').set('entityId', id).set('limit', String(limit));
    return this.http.get<{ items: AuditLogEntry[]; page: PageMeta }>('/v1/admin/audit-log', { params });
  }
}
