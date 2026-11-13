/**
 * What kind of file a document URL points at, and whether the app may open it.
 *
 * React-free and import-free so apps/mobile's plain-Node vitest can test it
 * (apps/mobile/src/roles/farmer/tests/documentKind.test.ts imports this file directly).
 *
 * The kind comes from the extension of the URL *path* only: upload storage keys
 * are minted as `<purpose>/<uuid>.<ext>` (apps/api uploads.service), and a signed
 * read URL appends its token as a query string, which must not be mistaken for
 * the file type (`...abc.png?sig=x.pdf` is an image).
 */

export type DocumentKind = 'image' | 'pdf' | 'unknown';

const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif']);

/** Only absolute http(s) URLs: a stored value must never launch `intent:`, `file:` or `javascript:`. */
const OPENABLE_URL = /^https?:\/\/[^\s/?#]+/i;

export function isOpenableDocumentUrl(url: string): boolean {
  return OPENABLE_URL.test(url);
}

export function documentKind(url: string): DocumentKind {
  // Drop the scheme + host first so a host such as `cdn.pdf` is not read as an extension.
  const withoutOrigin = url.replace(/^[a-z][a-z0-9+.-]*:\/\/[^/?#]*/i, '');
  const path = withoutOrigin.split(/[?#]/, 1)[0] ?? '';
  const lastSegment = path.slice(path.lastIndexOf('/') + 1);
  const dot = lastSegment.lastIndexOf('.');
  if (dot <= 0) return 'unknown';
  const ext = lastSegment.slice(dot + 1).toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  return 'unknown';
}
