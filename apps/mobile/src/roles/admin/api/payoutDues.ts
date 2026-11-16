/**
 * Farmer payout dues, read-only (docs/openapi.yaml /admin/payout-dues, BR-31):
 *   GET /admin/payout-dues   payout.dues.view   (SUPER_ADMIN and TOHFA_ADMIN `all`)
 *
 * Dues arise once goods are accepted at quality check. `totals` covers every
 * due matching the filters, not just the returned page, so a screen that only
 * wants the outstanding total asks for `limit: 1`.
 *
 * There is NO payout list or payout detail read in the API (only create,
 * approve and a CSV export), so this module is the whole payout read surface.
 * Money stays the API decimal string; screens turn it into integer paise
 * (money/paise.ts) before formatting.
 *
 * No UI imports, so any admin area can reuse it.
 */
import type { ErrorCode, GenericProblemCode, Money } from '@tohfa/shared-types';
import type { Page } from '../../../shell/api/pagination';
import { adminGet } from './http';

export const PAYOUT_DUE_AGE_BUCKETS = ['D0_7', 'D8_15', 'D16_30', 'D30_PLUS'] as const;
export type PayoutDueAgeBucket = (typeof PAYOUT_DUE_AGE_BUCKETS)[number];

/** docs/openapi.yaml `PayoutDue`. */
export interface PayoutDueDto {
  id: string;
  farmerId: string;
  tohfaFarmerId?: string | null | undefined;
  farmerName?: string | undefined;
  purchaseOrderId?: string | undefined;
  goodsReceiptId?: string | null | undefined;
  amountDue: Money;
  dueSince?: string | undefined;
  ageDays: number;
  ageBucket?: PayoutDueAgeBucket | undefined;
}

export interface PayoutDuesTotalsDto {
  totalDue: Money;
  farmerCount: number;
}

export interface PayoutDuesPage extends Page<PayoutDueDto> {
  totals: PayoutDuesTotalsDto;
}

export interface ListPayoutDuesParams {
  farmerId?: string | undefined;
  ageBucket?: PayoutDueAgeBucket | undefined;
  cursor?: string | undefined;
  /** 1-100, server default 20. */
  limit?: number | undefined;
}

/** 401/403/422/500. */
export const ERROR_CODES: readonly (GenericProblemCode | ErrorCode)[] = ['UNAUTHENTICATED', 'FORBIDDEN', 'VALIDATION_FAILED', 'INTERNAL'];

export function listPayoutDues(params: ListPayoutDuesParams = {}, signal?: AbortSignal): Promise<PayoutDuesPage> {
  return adminGet<PayoutDuesPage>(
    '/admin/payout-dues',
    { farmerId: params.farmerId, ageBucket: params.ageBucket, cursor: params.cursor, limit: params.limit },
    signal,
  );
}
