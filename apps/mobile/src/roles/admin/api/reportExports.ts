/**
 * Report exports (docs/openapi.yaml, BR-76):
 *   GET /admin/exports/<report>  CSV download, gated on report.export.file AND the
 *                                report's own data permission (both checked server-side,
 *                                apps/api/src/modules/report-exports/report-exports.routes.ts)
 *
 * The response is `text/csv`, not JSON, so it cannot go through the shared `request()` helper
 * in shell/api/client.ts (which always JSON.parses the body) or the `adminGet` wrapper built on
 * it. This module does the fetch directly, reusing the same auth/base-URL/Android-emulator
 * fallback plumbing as `request()`.
 *
 * No Idempotency-Key: this is a read, not a money-moving write (root CLAUDE.md 2.4). CSV only —
 * the server has no Excel or PDF export (docs/openapi.yaml; CLAUDE.md "no hardcoded values" cuts
 * both ways: don't offer a format the server can't produce).
 */
import type { Problem, ProblemCode } from '@tohfa/shared-types';
import {
  API_BASE_URL,
  ApiError,
  NetworkError,
  getAccessToken,
  isAndroidLocalhostFallbackCandidate,
  resolveUrl,
  toAndroidLocalhostFallbackUrl,
} from '../../../shell/api/client';
import { buildQueryString, type QueryParams } from '../../../shell/api/pagination';

/** Report names the server accepts (report-exports.routes.ts register() calls). */
export type ExportReportCode =
  | 'sales'
  | 'receiving'
  | 'inventory'
  | 'returns'
  | 'customers'
  | 'cash-topups'
  | 'expenses'
  | 'finance-revenue'
  | 'finance-expenses';

export interface ExportResult {
  /** Raw CSV text. Share it via the OS share sheet (React Native's `Share.share`); this app has
   * no file-system write capability, so there is nothing to additionally "save" on disk. */
  csv: string;
  /** Filename the server chose (Content-Disposition), already restricted server-side to
   * [A-Za-z0-9_.-] so it needs no further sanitizing before use in a share dialog's title. */
  filename: string;
}

export const EXPORT_REQUEST_TIMEOUT_MS = 15_000;

function isProblem(value: unknown): value is Problem {
  return typeof value === 'object' && value !== null && 'code' in value && 'status' in value && 'title' in value;
}

/** GET /admin/exports/{report}?query, returning the CSV text and its server-chosen filename. */
export async function exportReport(
  report: ExportReportCode,
  query: QueryParams,
  signal?: AbortSignal,
): Promise<ExportResult> {
  const path = `/admin/exports/${report}${buildQueryString(query)}`;
  const headers: Record<string, string> = { Accept: 'text/csv' };
  const token = getAccessToken();
  if (token !== null) headers['Authorization'] = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(resolveUrl(path), {
      method: 'GET',
      headers,
      ...(signal === undefined ? {} : { signal }),
    });
  } catch (error) {
    if (isAndroidLocalhostFallbackCandidate(API_BASE_URL)) {
      try {
        response = await fetch(toAndroidLocalhostFallbackUrl(resolveUrl(path)), {
          method: 'GET',
          headers,
          ...(signal === undefined ? {} : { signal }),
        });
      } catch (fallbackError) {
        throw new NetworkError(fallbackError);
      }
    } else {
      throw new NetworkError(error);
    }
  }

  const text = await response.text();

  if (!response.ok) {
    const payload: unknown = text.length === 0 ? null : JSON.parse(text);
    if (isProblem(payload)) throw new ApiError(payload);
    throw new ApiError({
      type: 'about:blank',
      title: 'Export failed',
      status: response.status,
      code: 'INTERNAL' as ProblemCode,
    });
  }

  const disposition = response.headers.get('content-disposition') ?? '';
  const match = /filename="([^"]+)"/.exec(disposition);
  return { csv: text, filename: match?.[1] ?? `${report}-export.csv` };
}
