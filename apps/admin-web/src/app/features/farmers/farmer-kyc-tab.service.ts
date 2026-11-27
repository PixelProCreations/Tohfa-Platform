/**
 * Data access and pure helpers for the Farmer Details → KYC tab. Every call is a documented
 * docs/openapi.yaml operation; the API re-checks each permission named below.
 *
 * Documents come through FarmersService.documents() (GET /admin/farmers/{id}/documents) so the
 * farmer feature keeps one client for that endpoint.
 */
import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';
import type { PageMeta } from './farmers.service';

/** Mirrors docs/openapi.yaml `AdminFarmerPayoutDestination`. Account number is last 4 only (BR-53a). */
export interface AdminFarmerPayoutDestination {
  id: string;
  kind: 'BANK' | 'UPI';
  accountHolderName: string;
  accountNumberLast4: string | null;
  ifsc: string | null;
  bankName: string | null;
  branchName: string | null;
  upiVpa: string | null;
  isVerified: boolean;
  isDefault: boolean;
  createdAt: string;
}

/** Mirrors docs/openapi.yaml `PayoutStatus`. */
export type PayoutStatus = 'REQUESTED' | 'PENDING_APPROVAL' | 'APPROVED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REVERSED';

/** Mirrors docs/openapi.yaml `PayoutSummary`. `amount` is a `Money` decimal string, never a float. */
export interface PayoutSummary {
  id: string;
  payoutNumber: string;
  farmerId: string;
  farmerName: string;
  amount: string;
  status: PayoutStatus;
  requestedAt: string;
  requestedBy: string;
}

@Injectable({ providedIn: 'root' })
export class FarmerKycService {
  private readonly http = inject(HttpClient);

  /** GET /v1/admin/farmers/{id}/bank-accounts — `farmer.bank_account.view`; bank accounts and UPI ids. */
  payoutDestinations(farmerId: string): Observable<{ items: AdminFarmerPayoutDestination[] }> {
    return this.http.get<{ items: AdminFarmerPayoutDestination[] }>(
      `/v1/admin/farmers/${encodeURIComponent(farmerId)}/bank-accounts`,
    );
  }

  /** GET /v1/admin/payouts?farmerId= — `payout.view`, newest first. */
  payouts(farmerId: string, limit: number): Observable<{ items: PayoutSummary[]; page: PageMeta }> {
    const params = new HttpParams().set('farmerId', farmerId).set('limit', String(limit));
    return this.http.get<{ items: PayoutSummary[]; page: PageMeta }>('/v1/admin/payouts', { params });
  }
}

/** "application/pdf" → "PDF", "image/jpeg" → "JPG"; anything else → its upper-cased subtype. */
export function fileKind(mimeType: string): string {
  const sub = mimeType.split('/')[1]?.split(';')[0]?.trim() ?? '';
  if (sub === 'jpeg') return 'JPG';
  return sub === '' ? mimeType.toUpperCase() : sub.toUpperCase();
}

/** Bytes → "1.8 MB" / "320 KB"; null when the API did not record the size. */
export function formatBytes(bytes: number | null): string | null {
  if (bytes === null) return null;
  const KB = 1024;
  const MB = KB * 1024;
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
  if (bytes >= KB) return `${Math.round(bytes / KB)} KB`;
  return `${bytes} B`;
}

/**
 * A `Money` decimal string ("18400.00") → "18,400.00" with Indian digit grouping. String work only,
 * so no float ever touches the amount (root CLAUDE.md §2.2).
 */
export function formatMoney(amount: string): string {
  const negative = amount.startsWith('-');
  const [whole = '0', fraction = ''] = (negative ? amount.slice(1) : amount).split('.');
  const last3 = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest === '' ? last3 : `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}`;
  const paise = fraction.padEnd(2, '0').slice(0, 2);
  return `${negative ? '-' : ''}${grouped}.${paise}`;
}

/** True when the signed URL may be embedded: only http(s) URLs, never `javascript:` or `data:`. */
export function isEmbeddableUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
