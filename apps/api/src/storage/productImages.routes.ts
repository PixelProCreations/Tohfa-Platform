import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Router } from 'express';
import { asyncHandler } from '../http/asyncHandler.js';
import { AppError } from '../http/problem.js';
import { PRODUCT_IMAGES_DIR } from '../paths.js';

/** Only a catalog key, never a path: no dots, slashes or anything else a traversal needs. */
const KEY_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;
const EXTENSION_PATTERN = /^[A-Za-z0-9]{1,5}$/;

/** The image types a key may be stored as, in lookup order. Nothing else is ever served. */
const IMAGE_CONTENT_TYPES: Readonly<Record<string, string>> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function isMissingFile(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return code === 'ENOENT' || code === 'EISDIR' || code === 'ENOTDIR';
}

/**
 * GET /product-images/<key>.<ext> -- the dev stand-in for the product image CDN.
 *
 * catalog.image.ts always emits `<PRODUCT_IMAGE_BASE_URL>/<catalog key>.jpg` (BR-16/BR-195). In
 * local dev that base points here, and the key resolves to whichever `<key>.<jpg|jpeg|png|webp>`
 * exists in the checked-in folder, so a `.jpg` URL may be answered with a PNG and the right
 * Content-Type. Mounted at the origin root like /storage, and only outside production (app.ts).
 *
 * No auth on purpose: these are the same public catalog images the CDN serves. A key outside
 * [A-Za-z0-9_-], an unknown key and an unknown extension are all the same 404.
 */
export function createProductImagesRouter(dir: string = PRODUCT_IMAGES_DIR): Router {
  const router = Router();

  router.get(
    '/:file',
    asyncHandler(async (req, res) => {
      const notFound = () => new AppError('NOT_FOUND', { detail: 'Image not found.' });
      const file = req.params['file'] ?? '';
      const dot = file.lastIndexOf('.');
      const key = dot < 0 ? file : file.slice(0, dot);
      const requested = dot < 0 ? '' : file.slice(dot + 1).toLowerCase();

      if (!KEY_PATTERN.test(key) || (dot >= 0 && !EXTENSION_PATTERN.test(requested))) {
        throw notFound();
      }

      // The requested extension first (when it is an image type), then every other one.
      const extensions = Object.keys(IMAGE_CONTENT_TYPES);
      const candidates = requested in IMAGE_CONTENT_TYPES
        ? [requested, ...extensions.filter((ext) => ext !== requested)]
        : extensions;

      for (const ext of candidates) {
        let data: Buffer;
        try {
          data = await readFile(join(dir, `${key}.${ext}`));
        } catch (error) {
          if (isMissingFile(error)) continue;
          throw error;
        }
        res.setHeader('Content-Type', IMAGE_CONTENT_TYPES[ext] ?? 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.status(200).end(data);
        return;
      }

      throw notFound();
    }),
  );

  return router;
}

export const productImagesRouter: Router = createProductImagesRouter();
