/**
 * Live data for the returns/RMA list screen (ReturnsIssues).
 *
 * Thin hook over useCursorList; all DTO→screen mapping is in ./mappers.ts
 * (unit-tested). BR-30: a Sub scope sends its own warehouseId; Main sends
 * undefined (all) or a narrowed id. Many RmaRecord fields have no API source
 * (spec-gap); those are '—' per the mapper.
 *
 * Only the returns list is wired. The detail, inspect, approve and refund
 * screens use the RMA object passed through params (already wired as SAMPLE_RMA
 * default); those mutations are not in scope for this wiring pass.
 */
import { useCallback } from 'react';
import { listReturns, type ReturnSummaryDto } from '../../../api/returns';
import { useCursorList, type CursorList } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { toRmaRecord } from './mappers';
import type { RmaRecord, PermissionCheck, WarehouseScope } from './types';

export { RmaRecord };

/** RBAC code that gates the returns list. */
export const RETURN_LIST_VIEW_CODE = 'return.list.view';

/**
 * Live cursor-paginated returns list for the current scope.
 * Pending = PENDING | INSPECTED status per Pending Orders spec (CLAUDE.md).
 */
export function useReturnList(
  scope: WarehouseScope,
  can: PermissionCheck,
  selectedWarehouseId: string | undefined,
): CursorList<RmaRecord> {
  const effectiveWarehouseId = scope.warehouseId ?? selectedWarehouseId;

  const map = useCallback(
    (dto: ReturnSummaryDto) => toRmaRecord(dto),
    [],
  );

  return useCursorList(
    adminKeys.scoped('returns', effectiveWarehouseId, { resource: 'list' }),
    // warehouseId is not a param; server scopes by the auth token (BR-30).
    (cursor, signal) => listReturns({ cursor }, signal),
    map,
    { enabled: can(RETURN_LIST_VIEW_CODE) },
  );
}
