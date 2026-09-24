import express, { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import { defaultBlobStorage } from '../../storage/blobStorage.js';
import { signUploadBody } from './uploads.schema.js';
import { uploadsService } from './uploads.service.js';

export const uploadsRouter: Router = Router();

uploadsRouter.post(
  '/sign',
  requireAuth,
  requirePermission('upload.signed_url.create'),
  validate({ body: signUploadBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', signUploadBody);
    const result = await uploadsService.signUpload(actor, body);
    res.status(201).json(result);
  }),
);

/**
 * Receiving end of InMemoryBlobStorage's mock signed-upload URL (see
 * `generateUploadTarget` in ../../storage/blobStorage.ts). Only ever hit in
 * dev/test, where AZURE_STORAGE_CONNECTION_STRING is unset and
 * createBlobStorage() falls back to the in-memory implementation -- a real
 * Azure/Cloudinary target is a pre-signed URL on a third-party host, never
 * this route.
 *
 * No requireAuth/requirePermission here on purpose: this stands in for a
 * third-party storage provider, whose real security is the pre-signed URL's
 * own time-limited secrecy (checked when it was minted in POST /sign, not on
 * every subsequent PUT) -- a real Azure SAS PUT never carries this app's
 * session either. `*storageKey` (Express 5 wildcard param syntax) captures
 * the full key including slashes (`purpose/uuid.ext`).
 *
 * Stores the raw bytes as-is, matching a real provider's PUT semantics --
 * BR-16 EXIF/GPS stripping is a deliberately separate step
 * (`processAndSanitizeImage`) applied only to images, not every upload
 * (farmer documents/certificates are frequently PDFs, which that step
 * rejects outright).
 *
 * `/mock/*` (Express 4 / path-to-regexp 0.1.x wildcard, not the named
 * `*key` syntax path-to-regexp 6+/Express 5 uses) captures the full key
 * including slashes (`purpose/uuid.ext`) positionally in `req.params[0]`.
 */
uploadsRouter.put(
  '/mock/*',
  express.raw({ type: '*/*', limit: '26mb' }),
  asyncHandler(async (req, res) => {
    const storageKey = req.params[0];
    if (storageKey === undefined) {
      res.status(400).json({ error: 'Missing storage key in upload URL.' });
      return;
    }
    const contentType = req.headers['content-type'] ?? 'application/octet-stream';
    const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
    const fileUrl = await defaultBlobStorage.upload(storageKey, buffer, contentType);
    res.status(201).json({ fileUrl });
  }),
);
