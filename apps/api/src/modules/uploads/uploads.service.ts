import crypto from 'node:crypto';
import path from 'node:path';
import type { Actor } from '../../auth/requireAuth.js';
import { config } from '../../config.js';
import { pool } from '../../db/pool.js';
import { AppError } from '../../http/problem.js';
import { defaultBlobStorage, type BlobStorage, type SignedUploadTarget } from '../../storage/blobStorage.js';
import { isAllowedMimeType, sniffMimeType, stripExifAndGps } from '../../storage/imageProcessor.js';
import { uploadsRepo, type UploadsRepo } from './uploads.repo.js';
import type { SignUploadBody } from './uploads.schema.js';

function getExtension(mimeType: string, fileName?: string): string {
  if (fileName !== undefined && fileName.length > 0) {
    const parsedExt = path.extname(fileName).toLowerCase();
    if (parsedExt.length > 0 && /^\.[a-z0-9]+$/.test(parsedExt)) {
      return parsedExt;
    }
  }

  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'application/pdf':
      return '.pdf';
    default:
      return '.bin';
  }
}

/**
 * Who/what an upload is recorded against. Exactly one of `uploadedBy` (a real,
 * logged-in user -- the normal `POST /uploads/sign` path) or `entityType`/`entityId`
 * (some other row that owns the upload instead -- e.g. a not-yet-approved farmer
 * application, which by definition has no user account yet) is expected to be set;
 * `uploads.uploaded_by` is nullable and `entity_type`/`entity_id` exist specifically
 * for this "tie an upload to something other than a user" case
 * (see `db/migrations/0008_platform.sql`).
 */
export interface UploadOwnership {
  uploadedBy?: string | undefined;
  entityType?: string | undefined;
  entityId?: string | undefined;
  isPublic: boolean;
}

export interface UploadsService {
  signUpload(actor: Actor, input: SignUploadBody): Promise<SignedUploadTarget>;
  /**
   * The shared core of `signUpload`, generalised to any owner -- used directly by
   * callers that have no `Actor` at all (e.g. farmer-applications' pre-account
   * registration upload endpoint), which sign on behalf of an application row
   * instead of a logged-in user.
   */
  signUploadForOwner(ownership: UploadOwnership, input: SignUploadBody): Promise<SignedUploadTarget>;
  processAndSanitizeImage(key: string, buffer: Buffer): Promise<{ sanitizedBuffer: Buffer; mimeType: string }>;
}

export function createUploadsService(
  storage: BlobStorage = defaultBlobStorage,
  repo: UploadsRepo = uploadsRepo,
): UploadsService {
  async function signUploadForOwner(
    ownership: UploadOwnership,
    input: SignUploadBody,
  ): Promise<SignedUploadTarget> {
    if (!isAllowedMimeType(input.contentType)) {
      throw new AppError('VALIDATION_FAILED', {
        status: 422,
        detail: `contentType '${input.contentType}' is not permitted.`,
      });
    }

    // Generate server-side UUID storage key to prevent path traversal
    const ext = getExtension(input.contentType, input.fileName);
    const uuid = crypto.randomUUID();
    const storageKey = `${input.purpose.toLowerCase()}/${uuid}${ext}`;

    const uploadTarget = await storage.generateUploadTarget({
      key: storageKey,
      contentType: input.contentType,
      sizeBytes: input.sizeBytes,
      purpose: input.purpose,
      expiresInMinutes: 15,
    });

    // Record in the uploads audit table
    await repo.createUpload(pool, {
      storageKey,
      bucket: config.AZURE_BLOB_CONTAINER,
      mimeType: input.contentType,
      sizeBytes: input.sizeBytes,
      uploadedBy: ownership.uploadedBy,
      isPublic: ownership.isPublic,
      entityType: ownership.entityType,
      entityId: ownership.entityId,
    });

    return uploadTarget;
  }

  return {
    async signUpload(actor, input) {
      const isPublic =
        input.purpose === 'LISTING_PHOTO' ||
        input.purpose === 'PROFILE_PHOTO' ||
        input.purpose === 'POD_PHOTO';

      return signUploadForOwner({ uploadedBy: actor.userId, isPublic }, input);
    },

    signUploadForOwner,

    async processAndSanitizeImage(key, buffer) {
      // Validate magic bytes to avoid MIME spoofing
      const detectedMime = sniffMimeType(buffer);
      if (detectedMime === null || !detectedMime.startsWith('image/')) {
        throw new AppError('VALIDATION_FAILED', {
          status: 422,
          detail: 'File content does not match a valid image format.',
        });
      }

      // BR-16: Re-encode image and strip all EXIF and GPS tags
      const { buffer: sanitizedBuffer, mimeType } = await stripExifAndGps(buffer);

      // Save stripped buffer back to storage
      await storage.upload(key, sanitizedBuffer, mimeType);

      return { sanitizedBuffer, mimeType };
    },
  };
}

export const uploadsService = createUploadsService();
