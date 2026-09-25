/**
 * Typed API client methods for Farmer Registration (S-43).
 */
import { request } from '../../../shell/api/client';
import type {
  Step1PersonalData,
  Step2FarmData,
  Step3LocationData,
  Step4DocumentsData,
} from '../storage/registrationDraft';

export interface CreateFarmerApplicationPayload {
  mobile: string;
  fullName: string;
  preferredLocale?: 'en' | 'ta';
}

export interface FarmerApplicationResponse {
  id: string;
  farmerId?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'DOCS_REVIEW' | 'FARM_VERIFICATION' | 'AUDIT' | 'APPROVED' | 'REJECTED';
  step: number;
  submittedAt?: string;
  createdAt: string;
}

export interface SignUploadPayload {
  purpose: 'FARMER_DOCUMENT' | 'CERTIFICATE';
  fileName: string;
  contentType: string;
  // Required by the server's signUploadBody schema (max 25 MiB) -- omitting it, or sending
  // it under the wrong key, always 422s (`VALIDATION_FAILED`). This shape drifted from the
  // schema before this session and was masked for months because /uploads/sign's 401 (no
  // account yet during registration) short-circuited before the body was ever validated.
  sizeBytes: number;
}

export interface SignUploadResponse {
  uploadUrl: string;
  fileUrl: string;
  resumable?: boolean;
  // Mirrors apps/api/src/storage/blobStorage.ts's SignedUploadTarget, which the
  // server always sends alongside uploadUrl/fileUrl/resumable. A real Azure
  // block-blob upload requires the `x-ms-blob-type: BlockBlob` header carried in
  // `headers`, so it has to reach the caller and not just be silently typed away.
  method?: 'PUT' | 'POST';
  headers?: Record<string, string>;
}

export async function createFarmerApplication(
  body: CreateFarmerApplicationPayload,
): Promise<FarmerApplicationResponse> {
  return await request<FarmerApplicationResponse>('/farmers/applications', {
    method: 'POST',
    body,
  });
}

/**
 * Full draft returned by `GET /farmers/applications/:id` -- everything saved so far via
 * `PATCH /farmers/applications/:id/steps/:step`, not just the lightweight status timeline
 * `fetchApplicationStatus` (`/status`) returns. Same auth-free, possess-the-UUID posture as
 * `saveFarmerApplicationStep`/`signApplicationUpload` (see `docs/openapi.yaml`'s
 * `getFarmerApplicationDraft` operation).
 *
 * A farmer who lost their local draft (reinstall, cleared storage, new device) re-triggers
 * `createFarmerApplication`, which now 409s with `problem.meta.applicationId` for that live
 * application; this endpoint is what the client calls next to recover the full draft behind
 * that id (see `RegistrationFlowScreen.tsx`'s `updateStepAndAdvance`).
 *
 * `step1Personal`/`step2FarmDetails` mirror exactly what `saveFarmerApplicationStep` sends for
 * those steps -- the server stores each step's payload verbatim, so these are the same
 * `Step1PersonalData`/`Step2FarmData` shapes the local draft store already uses, not a
 * server-invented shape. Same for `step3Location`/`step4Documents` against
 * `Step3LocationData`/`Step4DocumentsData`. Each is `Partial<...>` because a step that was
 * never saved comes back as a bare `{}` -- e.g. `Step3LocationData` normally requires
 * `locations`, but an application still on step 1 has no `locations` key at all yet.
 */
export interface FullDraftResponse {
  id: string;
  mobile: string;
  fullName: string;
  preferredLocale?: 'en' | 'ta';
  status: 'SUBMITTED' | 'DOCS_REVIEW' | 'FARM_VERIFICATION' | 'AUDIT' | 'APPROVED' | 'REJECTED';
  /**
   * True while the farmer is still filling in the 5-step form; flips false the moment
   * `submitFarmerApplication` succeeds. This -- not `status` -- is the "still drafting vs.
   * already submitted" signal: `status` defaults to `SUBMITTED` server-side from the moment the
   * draft is created (there is no `DRAFT` value in the `application_status` enum at all,
   * `db/migrations/0001_extensions_and_enums.sql`), so it stays `SUBMITTED` throughout steps
   * 1-5 and only starts meaning "in the review pipeline" once `isDraft` is false.
   */
  isDraft: boolean;
  currentStep: number;
  completedSteps: number[];
  step1Personal: Partial<Step1PersonalData>;
  step2FarmDetails: Partial<Step2FarmData>;
  step3Location: Partial<Step3LocationData>;
  step4Documents: Partial<Step4DocumentsData>;
  submittedAt: string | null;
  createdAt: string;
}

export async function getFarmerApplicationDraft(applicationId: string): Promise<FullDraftResponse> {
  return await request<FullDraftResponse>(`/farmers/applications/${applicationId}`);
}

export async function saveFarmerApplicationStep(
  applicationId: string,
  step: number,
  payload: unknown,
): Promise<FarmerApplicationResponse> {
  return await request<FarmerApplicationResponse>(
    `/farmers/applications/${applicationId}/steps/${step}`,
    {
      method: 'PATCH',
      body: payload,
    },
  );
}

export async function submitFarmerApplication(
  applicationId: string,
  idempotencyKey: string,
): Promise<FarmerApplicationResponse> {
  return await request<FarmerApplicationResponse>(
    `/farmers/applications/${applicationId}/submit`,
    {
      method: 'POST',
      idempotencyKey,
    },
  );
}

export async function signUpload(
  body: SignUploadPayload,
): Promise<SignUploadResponse> {
  return await request<SignUploadResponse>('/uploads/sign', {
    method: 'POST',
    body,
  });
}

/**
 * Registration-scoped sibling of `signUpload`, used by the Step 4 (documents) screen of the
 * farmer application flow. A brand-new applicant has no account yet -- that's the whole point
 * of registration -- so the authenticated `POST /uploads/sign` (`signUpload` above) 401s for
 * them. This calls `POST /farmers/applications/:id/uploads/sign` instead, which trusts
 * possession of the application's own unguessable UUID as the credential, the same pattern
 * `saveFarmerApplicationStep` already uses. No `Authorization` header is required or sent.
 */
export async function signApplicationUpload(
  applicationId: string,
  body: SignUploadPayload,
): Promise<SignUploadResponse> {
  return await request<SignUploadResponse>(
    `/farmers/applications/${applicationId}/uploads/sign`,
    {
      method: 'POST',
      body,
    },
  );
}
