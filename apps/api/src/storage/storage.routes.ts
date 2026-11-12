import { Router } from 'express';
import { asyncHandler } from '../http/asyncHandler.js';
import { AppError } from '../http/problem.js';
import { defaultBlobStorage, isLocallyServed, type BlobStorage } from './blobStorage.js';

/**
 * The document types the app shows (an image in-app, a PDF handed to the
 * phone's reader). Anything else is served as an opaque attachment, never with
 * a type a browser would render -- a key's extension comes from the uploader's
 * file name (uploads.service getExtension), so `.html` is possible.
 */
const INLINE_CONTENT_TYPES: Readonly<Record<string, string>> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
};

function inlineContentType(key: string): string | null {
  const dot = key.lastIndexOf('.');
  if (dot < 0) return null;
  return INLINE_CONTENT_TYPES[key.slice(dot + 1).toLowerCase()] ?? null;
}

/**
 * GET /storage/<key>?expires=..&sig=.. -- the read half of the dev/test
 * storage stand-in (BR-142d), the counterpart of PUT /v1/uploads/mock/*.
 *
 * Mounted at the origin root (like /healthz), because `/storage/<key>` is the
 * URL shape LocalDiskBlobStorage has always minted and stored. With Azure
 * configured, read URLs are Azure SAS URLs and never point here, and the
 * storage is not `isLocallyServed`, so every request is 404.
 *
 * No requireAuth / requirePermission on purpose, exactly like the mock PUT:
 * this stands in for a third-party provider whose security is the signed URL
 * itself. A signed URL is only ever minted by a service that has already
 * authorized the caller for that one file (e.g. BR-142a's ownership check), so
 * the signature IS the permission, and it expires. The permanent public URL
 * (no signature), a tampered or expired signature and a missing file are all
 * the same 404, so the route says nothing about which files exist.
 */
export function createStorageReadRouter(storage: BlobStorage = defaultBlobStorage): Router {
  const router = Router();

  router.get(
    '/*',
    asyncHandler(async (req, res) => {
      const key = req.params[0];
      const { expires, sig } = req.query;
      const notFound = () => new AppError('NOT_FOUND', { detail: 'File not found.' });

      if (
        !isLocallyServed(storage) ||
        typeof key !== 'string' ||
        typeof expires !== 'string' ||
        typeof sig !== 'string' ||
        !storage.verifyReadSignature(key, expires, sig)
      ) {
        throw notFound();
      }

      const data = await storage.download(key);
      if (data === null) throw notFound();

      const contentType = inlineContentType(key);
      // helmet's CSP (`object-src 'none'`, ...) stops a browser's built-in PDF
      // viewer from rendering the file; this response is a document, not a page.
      res.removeHeader('Content-Security-Policy');
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('Content-Type', contentType ?? 'application/octet-stream');
      res.setHeader('Content-Disposition', contentType !== null ? 'inline' : 'attachment');
      res.status(200).end(data);
    }),
  );

  return router;
}

export const storageReadRouter: Router = createStorageReadRouter();
