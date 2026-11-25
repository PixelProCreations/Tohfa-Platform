/**
 * One farmer's payouts: GET /admin/payouts?farmerId= (docs/openapi.yaml
 * listPayouts, payout.view, BR-63). Cursor paged; the response is
 * `{ items: PayoutSummary[], page: PageMeta }` (apps/api payouts.repo returns
 * `page: { nextCursor, hasMore }`).
 *
 * Why a separate wrapper and not ./payouts.ts `listPayouts`: that module types
 * the page as top-level `nextCursor` / `hasMore`, which is not what the server
 * sends, so its paging cannot be used. This file reads the documented shape.
 * The row fields are openapi `PayoutSummary`, verbatim; there is no PO number,
 * produce or quantity on a payout summary.
 *
 * The query key sits under the payouts module, so an approval (which
 * invalidates that module) refetches this list too. Read-only. No UI imports.
 */
import type { Money } from '@tohfa/shared-types';
import type { PageMeta } from '../../../shell/api/pagination';
import { useCursorList, type CursorList } from './hooks';
import { adminGet } from './http';
import { PAYOUTS_MODULE } from './payoutsHooks';
import type { PayoutStatus } from './payouts';
import { adminKeys } from './queryKeys';

/** openapi PayoutSummary. */
export interface FarmerPayoutSummaryDto {
  id: string;
  payoutNumber: string;
  farmerId: string;
  farmerName: string;
  amount: Money;
  status: PayoutStatus;
  requestedAt: string;
  requestedBy: string;
}

export interface FarmerPayoutPage {
  items: FarmerPayoutSummaryDto[];
  page: PageMeta;
}

export function listFarmerPayouts(farmerId: string, cursor: string | undefined, signal?: AbortSignal): Promise<FarmerPayoutPage> {
  return adminGet<FarmerPayoutPage>('/admin/payouts', { farmerId, cursor }, signal);
}

export function farmerPayoutsKey(farmerId: string | undefined) {
  return adminKeys.scoped(PAYOUTS_MODULE, undefined, { resource: 'farmerPayouts', farmerId: farmerId ?? null });
}

function keep(dto: FarmerPayoutSummaryDto): FarmerPayoutSummaryDto {
  return dto;
}

/** payout.view. Nothing is fetched without a farmer id. */
export function useFarmerPayoutList(
  farmerId: string | undefined,
  options: { enabled?: boolean | undefined } = {},
): CursorList<FarmerPayoutSummaryDto, FarmerPayoutPage> {
  return useCursorList<FarmerPayoutSummaryDto, FarmerPayoutSummaryDto, FarmerPayoutPage>(
    farmerPayoutsKey(farmerId),
    (cursor, signal) => listFarmerPayouts(farmerId ?? '', cursor, signal),
    keep,
    { enabled: farmerId !== undefined && (options.enabled ?? true) },
  );
}
