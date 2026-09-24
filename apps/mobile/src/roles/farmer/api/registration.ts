/**
 * Typed API client methods for Farmer Registration (S-43).
 */
import { request } from '../../../shell/api/client';

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
