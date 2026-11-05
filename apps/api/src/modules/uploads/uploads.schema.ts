import { z } from 'zod';
import { ALLOWED_MIME_TYPES } from '../../storage/imageProcessor.js';

export const UploadPurpose = {
  FARMER_DOCUMENT: 'FARMER_DOCUMENT',
  CERTIFICATE: 'CERTIFICATE',
  LISTING_PHOTO: 'LISTING_PHOTO',
  GRN_PHOTO: 'GRN_PHOTO',
  QC_PHOTO: 'QC_PHOTO',
  POD_PHOTO: 'POD_PHOTO',
  PROFILE_PHOTO: 'PROFILE_PHOTO',
  ISSUE_PHOTO: 'ISSUE_PHOTO',
  DIARY_PHOTO: 'DIARY_PHOTO',
  DIARY_VOICE_NOTE: 'DIARY_VOICE_NOTE',
  SOIL_TEST_REPORT: 'SOIL_TEST_REPORT',
  PEST_PHOTO: 'PEST_PHOTO',
  WORKER_PHOTO: 'WORKER_PHOTO',
  WORKER_ID_PROOF: 'WORKER_ID_PROOF',
  /** Optional report file attached to an audit (typically an external agency's own report). */
  AUDIT_REPORT: 'AUDIT_REPORT',
  /** A warehouse compliance or property document (licence, FSSAI, lease ...) (BR-105). */
  WAREHOUSE_DOCUMENT: 'WAREHOUSE_DOCUMENT',
} as const;

export type UploadPurpose = (typeof UploadPurpose)[keyof typeof UploadPurpose];

/**
 * The `uploads` table has no purpose column: the purpose an upload was signed
 * for is recorded as the first segment of its storage key
 * (`<purpose lower-cased>/<uuid><ext>`, uploads.service.ts). These two
 * functions are the only place that encoding is written and read, so a
 * consumer that must check what an upload was signed for (BR-137i) cannot
 * drift from the signer.
 */
export function storageKeyPrefixFor(purpose: UploadPurpose): string {
  return `${purpose.toLowerCase()}/`;
}

/** The purpose a storage key was signed for, or null when its prefix is not a known purpose. */
export function uploadPurposeOfStorageKey(storageKey: string): UploadPurpose | null {
  const slash = storageKey.indexOf('/');
  if (slash <= 0) return null;
  const prefix = storageKey.slice(0, slash);
  for (const purpose of Object.values(UploadPurpose)) {
    if (storageKeyPrefixFor(purpose) === `${prefix}/`) return purpose;
  }
  return null;
}

export const signUploadBody = z.object({
  purpose: z.enum([
    UploadPurpose.FARMER_DOCUMENT,
    UploadPurpose.CERTIFICATE,
    UploadPurpose.LISTING_PHOTO,
    UploadPurpose.GRN_PHOTO,
    UploadPurpose.QC_PHOTO,
    UploadPurpose.POD_PHOTO,
    UploadPurpose.PROFILE_PHOTO,
    UploadPurpose.ISSUE_PHOTO,
    UploadPurpose.DIARY_PHOTO,
    UploadPurpose.DIARY_VOICE_NOTE,
    UploadPurpose.SOIL_TEST_REPORT,
    UploadPurpose.PEST_PHOTO,
    UploadPurpose.WORKER_PHOTO,
    UploadPurpose.WORKER_ID_PROOF,
    UploadPurpose.AUDIT_REPORT,
    UploadPurpose.WAREHOUSE_DOCUMENT,
  ]),
  contentType: z.enum(ALLOWED_MIME_TYPES, {
    errorMap: () => ({
      message: `contentType must be one of: ${ALLOWED_MIME_TYPES.join(', ')}`,
    }),
  }),
  sizeBytes: z.number().int().min(1).max(26_214_400, {
    message: 'File size must not exceed 25 MiB (26214400 bytes).',
  }),
  fileName: z.string().max(200).optional(),
});
export type SignUploadBody = z.infer<typeof signUploadBody>;

export const signUploadResponse = z.object({
  // The `uploads` table row id this signed target was recorded against
  // (uploads.repo.ts's `createUpload` `RETURNING id`) -- surfaced so callers
  // that must create a photo/document *before* the parent record exists
  // (pest detections, soil test lab reports, workforce id proof/photos) can
  // send it back as e.g. `photoUploadId`/`labReportUploadId` when they create
  // that parent record. Previously discarded; see uploads.service.ts's
  // `signUploadForOwner`.
  id: z.string().uuid(),
  uploadUrl: z.string().url(),
  fileUrl: z.string().url(),
  storageKey: z.string(),
  method: z.enum(['PUT', 'POST']),
  headers: z.record(z.string()),
  expiresAt: z.string().datetime(),
  resumable: z.boolean(),
});
export type SignUploadResponse = z.infer<typeof signUploadResponse>;
