/**
 * The immutable system audit log (docs/openapi.yaml tag Platform, BR-35):
 *   GET /admin/audit-log   auditlog.view   (BR-30, BR-35)
 *
 * Read-only on purpose. The CSV export (GET /admin/audit-log/export,
 * auditlog.export) is a file download that writes its own audit row, so it is
 * left to the host that owns downloads; there is no write route at all.
 *
 * No UI imports, so any admin screen can reuse this module.
 */
import type { PageMeta } from '../../../shell/api/pagination';
import { adminGet } from './http';

/** docs/openapi.yaml `AuditLogEntry`. */
export interface AuditLogEntryDto {
  id: string;
  actorId: string | null;
  actorType: 'USER' | 'SYSTEM' | 'JOB' | 'ANONYMOUS';
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  warehouseId: string | null;
  outcome: 'ALLOWED' | 'DENIED' | 'ERROR';
  before: unknown;
  after: unknown;
  changedFields: string[] | null;
  correlationId: string | null;
  ip: string | null;
  at: string;
}

/** docs/openapi.yaml `AuditLog*Param` + CursorParam / LimitParam. */
export interface ListAuditLogParams {
  actorId?: string | undefined;
  action?: string | undefined;
  entityType?: string | undefined;
  entityId?: string | undefined;
  /** Inclusive, ISO 8601 with an offset. */
  from?: string | undefined;
  /** Inclusive, ISO 8601 with an offset, not before `from`. */
  to?: string | undefined;
  cursor?: string | undefined;
  limit?: number | undefined;
}

export interface ListAuditLogResponseDto {
  items: AuditLogEntryDto[];
  page: PageMeta;
}

export function listAuditLog(params: ListAuditLogParams = {}, signal?: AbortSignal): Promise<ListAuditLogResponseDto> {
  return adminGet<ListAuditLogResponseDto>(
    '/admin/audit-log',
    {
      actorId: params.actorId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      from: params.from,
      to: params.to,
      cursor: params.cursor,
      limit: params.limit,
    },
    signal,
  );
}
