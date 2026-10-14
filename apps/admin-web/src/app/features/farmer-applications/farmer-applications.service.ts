import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { ApplicationStatus } from '@tohfa/shared-types';

export interface FarmerApplicationSummary {
  id: string;
  mobile: string;
  fullName: string;
  preferredLocale: 'en' | 'ta';
  status: ApplicationStatus;
  currentStep: number;
  completedSteps: number[];
  submittedAt: string | null;
  createdAt: string;
}

export interface FarmerApplicationDetail extends FarmerApplicationSummary {
  step1Personal: {
    fullName?: string;
    dob?: string;
    gender?: string;
    aadhaarLast4?: string;
    farmingExperienceYears?: number;
    addressLine1?: string;
    village?: string;
    taluk?: string;
    district?: string;
    pincode?: string;
  };
  /**
   * One farming operation per farmer, so these are singular properties of that
   * operation — including years of experience, which is asked once here.
   *
   * `totalAreaAcres` and `numberOfFarms` are the farmer's OWN STATED figures, normally
   * read off their land records (patta/chitta). Neither is derived from step 3 — not
   * from the parcels' summed acreage, and not from how many parcels were marked, which
   * are measured on the ground. Keeping each pair independent is the whole point: a
   * derived figure always agrees with itself and so tells a verifier nothing.
   *
   * `farmName` names the whole operation ("Great Earth Organic"). It is not a parcel
   * name — each step 3 location carries its own `label` — so do not read one as the
   * other when reviewing an application.
   */
  step2FarmDetails: {
    farmName?: string;
    typeOfFarming?: string;
    experienceYears?: number;
    totalAreaAcres?: number;
    numberOfFarms?: number;
    waterSource?: string;
    primaryCrops?: string[];
  };
  /**
   * The operation's land sits in several physical places. Each location is
   * self-contained — its own acreage and its own surveyed boundary — so there is
   * no cross-step correlation key between step 2 and step 3 any more.
   *
   * The sum of `areaAcres` is the land actually marked. It is compared against the
   * farmer's stated total from step 2, never substituted for it.
   */
  step3Location: {
    locations?: Array<{
      id: string;
      label: string;
      areaAcres: number;
      gpsCaptured?: boolean;
      latitude?: number;
      longitude?: number;
      calculatedAreaAcres?: number;
      calculatedAreaHectares?: number;
      fmbPolygon?: {
        type: 'Polygon';
        coordinates: number[][][];
      };
      village?: string;
      taluk?: string;
      district?: string;
    }>;
  };
  step4Documents: {
    documents?: Array<{
      docType: string;
      fileUrl: string;
      fileName?: string;
      /**
       * Which specific document this is (e.g. "Aadhaar Card" for an ID_PROOF row, "Patta" for
       * a FARM_DOC row) -- without it a FARM_VERIFICATION reviewer has to open the file to
       * find out what it is. Absent on documents saved before this field existed, and never
       * set on CERTIFICATE/OTHER rows (the mobile picker only offers it for ID_PROOF/FARM_DOC).
       */
      docSubType?: string;
    }>;
  };
}

export interface ListApplicationsResponse {
  items: FarmerApplicationSummary[];
  page: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface StatusTimeline {
  applicationId: string;
  status: string;
  submittedAt: string | null;
  expectedDecisionBy: string;
  steps: Array<{
    status: string;
    reachedAt: string;
    note?: string | null;
  }>;
}

@Injectable({ providedIn: 'root' })
export class AdminFarmerApplicationsService {
  private readonly http = inject(HttpClient);

  list(filters: {
    status?: string;
    zoneId?: string;
    submittedAfter?: string;
    cursor?: string;
    limit?: number;
  }): Observable<ListApplicationsResponse> {
    let params = new HttpParams();
    if (filters.status) params = params.set('status', filters.status);
    if (filters.zoneId) params = params.set('zoneId', filters.zoneId);
    if (filters.submittedAfter) params = params.set('submittedAfter', filters.submittedAfter);
    if (filters.cursor) params = params.set('cursor', filters.cursor);
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<ListApplicationsResponse>('/v1/admin/farmer-applications', { params });
  }

  getById(id: string): Observable<FarmerApplicationDetail> {
    return this.http.get<FarmerApplicationDetail>(`/v1/admin/farmer-applications/${id}`);
  }

  getStatusTimeline(id: string): Observable<StatusTimeline> {
    return this.http.get<StatusTimeline>(`/v1/farmers/applications/${id}/status`);
  }

  approve(
    id: string,
    body: { zoneId?: string; note?: string } = {},
  ): Observable<FarmerApplicationDetail> {
    return this.http.post<FarmerApplicationDetail>(
      `/v1/admin/farmer-applications/${id}/approve`,
      body,
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      },
    );
  }

  reject(
    id: string,
    body: { reasonCode: string; reason: string },
  ): Observable<FarmerApplicationDetail> {
    return this.http.post<FarmerApplicationDetail>(
      `/v1/admin/farmer-applications/${id}/reject`,
      body,
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      },
    );
  }

  requestInfo(
    id: string,
    body: { message: string; requiredSteps?: number[] },
  ): Observable<FarmerApplicationDetail> {
    return this.http.post<FarmerApplicationDetail>(
      `/v1/admin/farmer-applications/${id}/request-info`,
      body,
      {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      },
    );
  }
}
