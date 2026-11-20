/**
 * `POST /v1/uploads/sign` + direct upload to the signed target, for any role.
 *
 *   const target = await signUpload({ purpose: 'ISSUE_PHOTO', contentType: 'image/jpeg', sizeBytes, fileName });
 *   await uploadToSignedTarget(target, bytes, 'image/jpeg', { onProgress });
 *   // then send target.id (e.g. photoUploadIds) / target.fileUrl to the parent endpoint
 *
 * `uploadSignedFile()` does both. The upload honours `method`, `headers` and
 * `resumable` from the target (see ./uploader.ts).
 */
import { api } from '../api/client';
import { uploadWithResume, type UploadResult } from './uploader';

export type UploadPurpose =
  | 'FARMER_DOCUMENT'
  | 'CERTIFICATE'
  | 'LISTING_PHOTO'
  | 'GRN_PHOTO'
  | 'QC_PHOTO'
  | 'POD_PHOTO'
  | 'PROFILE_PHOTO'
  | 'ISSUE_PHOTO'
  | 'DIARY_PHOTO'
  | 'DIARY_VOICE_NOTE'
  | 'SOIL_TEST_REPORT'
  | 'PEST_PHOTO'
  | 'WORKER_PHOTO'
  | 'WORKER_ID_PROOF'
  | 'AUDIT_REPORT'
  | 'WAREHOUSE_DOCUMENT';

export interface SignUploadRequest {
  purpose: UploadPurpose;
  contentType: string;
  /** 1 .. 26214400 (25 MiB). */
  sizeBytes: number;
  fileName?: string | undefined;
}

/** docs/openapi.yaml `SignedUploadTarget`. */
export interface SignedUploadTarget {
  /** `uploads` row id -- pass back as e.g. `photoUploadIds` / `attachmentUploadId`. */
  id: string;
  uploadUrl: string;
  fileUrl: string;
  storageKey: string;
  method: 'PUT' | 'POST';
  headers?: Record<string, string>;
  expiresAt: string;
  resumable?: boolean;
}

export function signUpload(input: SignUploadRequest, signal?: AbortSignal): Promise<SignedUploadTarget> {
  const body: Record<string, unknown> = {
    purpose: input.purpose,
    contentType: input.contentType,
    sizeBytes: input.sizeBytes,
  };
  if (input.fileName !== undefined) body['fileName'] = input.fileName.slice(0, 200);
  return api.post<SignedUploadTarget>('/uploads/sign', body, undefined, {
    timeoutMs: 15000,
    ...(signal === undefined ? {} : { signal }),
  });
}

export interface UploadToTargetOptions {
  onProgress?: ((progressPct: number, uploadedBytes: number, totalBytes: number) => void) | undefined;
  abortSignal?: AbortSignal | undefined;
}

export function uploadToSignedTarget(
  target: SignedUploadTarget,
  data: Uint8Array | string,
  contentType: string,
  options: UploadToTargetOptions = {},
): Promise<UploadResult> {
  return uploadWithResume({
    uploadUrl: target.uploadUrl,
    fileUrl: target.fileUrl,
    resumable: target.resumable ?? false,
    data,
    contentType,
    method: target.method,
    headers: target.headers,
    onProgress: options.onProgress,
    abortSignal: options.abortSignal,
  });
}

/** Sign, then upload. Resolves with the signed target (its `id`/`fileUrl` are what the API wants). */
export async function uploadSignedFile(
  input: SignUploadRequest & { data: Uint8Array | string },
  options: UploadToTargetOptions = {},
): Promise<SignedUploadTarget> {
  const target = await signUpload(input, options.abortSignal);
  await uploadToSignedTarget(target, input.data, input.contentType, options);
  return target;
}
