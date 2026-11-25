/**
 * GET /admin/produce/records as a LIST (docs/openapi.yaml listProduceRecords,
 * produce.calendar.view_consolidated, BR-142). ./produce.ts only asks this
 * route for its `page.total`; the Crop History, Zone & Crop Breakdown and a
 * farmer's Plant & Crops tab need the rows themselves.
 *
 * Field names are docs/openapi.yaml `CropRecordSummary`, verbatim. The record
 * has no human-readable code: its `id` is a UUID and is never shown as one.
 *
 * Read-only, so no Idempotency-Key. No UI imports.
 */
import type { PageMeta } from '../../../shell/api/pagination';
import { adminGet } from './http';
import { PRODUCE_MODULE } from './produce';
import { adminKeys } from './queryKeys';

/** openapi CropRecordSummary.status. */
export const PRODUCE_RECORD_STATUSES = ['PLANNED', 'GROWING', 'HARVESTED', 'FAILED'] as const;
export type ProduceRecordStatus = (typeof PRODUCE_RECORD_STATUSES)[number];

/** openapi CropRecordSummary. */
export interface ProduceRecordSummaryDto {
  id: string;
  crop: { id: string; name: string; botanicalName: string | null };
  variety: string | null;
  farmer: { id: string; tohfaFarmerId: string; name: string };
  farm: { id: string; name: string };
  zone: { id: string; code: string; name: string } | null;
  plot: { id: string; name: string; areaAcres: number | null };
  status: ProduceRecordStatus;
  plantedOn: string | null;
  expectedHarvestOn: string | null;
  actualHarvestOn: string | null;
  expectedYieldKg: number | null;
  actualYieldKg: number | null;
  createdAt: string;
  updatedAt: string | null;
}

/** openapi ProduceRecordsListResponse; `page.total` only when includeTotal=true was sent. */
export interface ProduceRecordListPage {
  items: ProduceRecordSummaryDto[];
  page: PageMeta & { total?: number | undefined };
}

export interface ProduceRecordListFilters {
  farmerId?: string | undefined;
  zoneId?: string | undefined;
  cropId?: string | undefined;
  /** Sent only when non-blank: the server rejects an empty `q` (minLength 1). */
  q?: string | undefined;
  /** One or more statuses; sent comma-separated, never empty. */
  statuses?: readonly ProduceRecordStatus[] | undefined;
}

function statusParam(statuses: readonly ProduceRecordStatus[] | undefined): string | undefined {
  return statuses === undefined || statuses.length === 0 ? undefined : statuses.join(',');
}

function qParam(q: string | undefined): string | undefined {
  const trimmed = q?.trim();
  return trimmed === undefined || trimmed === '' ? undefined : trimmed;
}

/** One page of records, with the server's count of every match (`includeTotal=true`). */
export function listProduceRecords(
  filters: ProduceRecordListFilters,
  cursor: string | undefined,
  signal?: AbortSignal,
): Promise<ProduceRecordListPage> {
  return adminGet<ProduceRecordListPage>(
    '/admin/produce/records',
    {
      farmerId: filters.farmerId,
      zoneId: filters.zoneId,
      cropId: filters.cropId,
      q: qParam(filters.q),
      status: statusParam(filters.statuses),
      includeTotal: 'true',
      cursor,
    },
    signal,
  );
}

export function produceRecordListKey(filters: ProduceRecordListFilters) {
  return adminKeys.scoped(PRODUCE_MODULE, undefined, {
    resource: 'recordList',
    farmerId: filters.farmerId ?? null,
    zoneId: filters.zoneId ?? null,
    cropId: filters.cropId ?? null,
    q: qParam(filters.q) ?? null,
    status: statusParam(filters.statuses) ?? null,
  });
}
