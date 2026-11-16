/**
 * Live data for the Audit Log screens: a thin TanStack Query wrapper over
 * api/auditLog.ts (BR-35). Every decision lives in ./systemSettingsLogic.ts.
 * Nothing is fetched while `enabled` is false (no auditlog.view, or the list
 * is not on screen).
 */
import { useCallback } from 'react';
import { useCursorList } from '../../../api/hooks';
import { adminKeys } from '../../../api/queryKeys';
import { listAuditLog, type AuditLogEntryDto } from '../../../api/auditLog';
import { toAuditLogRow, type AppliedAuditFilters } from './systemSettingsLogic';

const AUDIT_LOG = 'auditLog';

export function useAuditLogList(filters: AppliedAuditFilters, enabled: boolean) {
  const map = useCallback((dto: AuditLogEntryDto) => toAuditLogRow(dto), []);
  return useCursorList(
    adminKeys.scoped(AUDIT_LOG, undefined, {
      from: filters.from ?? null,
      to: filters.to ?? null,
      action: filters.action,
      entityType: filters.entityType,
    }),
    (cursor, signal) =>
      listAuditLog(
        {
          from: filters.from,
          to: filters.to,
          action: filters.action ?? undefined,
          entityType: filters.entityType ?? undefined,
          cursor,
        },
        signal,
      ),
    map,
    { enabled },
  );
}
