import { getCertificationDocumentReadUrl, type CertificationDocumentReadUrl } from '../../api/farmer';
import { ApiError } from '../../../../shell/api/client';

/**
 * What the Certifications "View" button does next (BR-142f). React-free so the
 * plain-Node vitest can cover it (tests/certification_document.test.ts).
 *
 * - `open`: a fresh signed URL to hand to CertificateDocumentScreen.
 * - `noDocument`: the server has no document for this certificate the farmer
 *   may read (404: none attached, deleted, or not theirs) -- the same message
 *   as a certificate without a documentUrl.
 * - `failed`: anything else (server error, offline); the screen shows the
 *   shared error dialog. Carries the error for classification, never a URL.
 * - `cancelled`: the request was aborted (screen left); show nothing.
 */
export type CertificateDocumentOutcome =
  | { kind: 'open'; url: string }
  | { kind: 'noDocument' }
  | { kind: 'failed'; error: unknown }
  | { kind: 'cancelled' };

export async function resolveCertificateDocument(
  certificationId: string,
  fetchReadUrl: (id: string, signal?: AbortSignal) => Promise<CertificationDocumentReadUrl> = getCertificationDocumentReadUrl,
  signal?: AbortSignal,
): Promise<CertificateDocumentOutcome> {
  try {
    const { readUrl } = await fetchReadUrl(certificationId, signal);
    if (signal?.aborted) return { kind: 'cancelled' };
    return { kind: 'open', url: readUrl };
  } catch (error) {
    if (signal?.aborted) return { kind: 'cancelled' };
    if (error instanceof ApiError && error.problem.status === 404) return { kind: 'noDocument' };
    return { kind: 'failed', error };
  }
}
