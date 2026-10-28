/**
 * Audit log read and export (BR-35, BR-30). Zod schemas only, matching docs/openapi.yaml
 * `getAuditLog`, `exportAuditLogCsv` and `AuditLogEntry`.
 *
 * There is deliberately no body schema: the audit log has no write route (BR-35).
 */
import { z } from 'zod';
import { CURSOR_TAGS, decodeKeysetCursor } from '../../http/keysetCursor.js';

/** Filters shared by the list and the export (openapi `AuditLog*Param`). */
const filterShape = {
  actorId: z.string().uuid().optional(),
  action: z.string().trim().min(1).max(120).optional(),
  entityType: z.string().trim().min(1).max(64).optional(),
  entityId: z.string().uuid().optional(),
  // An offset is required so the bound is an instant, not a server-local wall clock time.
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
};

/** `from` after `to` can only ever be an empty page; say so instead (422 on `query.to`). */
function fromNotAfterTo(value: { from?: string | undefined; to?: string | undefined }, ctx: z.RefinementCtx): void {
  if (value.from !== undefined && value.to !== undefined && Date.parse(value.from) > Date.parse(value.to)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['to'], message: '`to` must not be before `from`.' });
  }
}

export const auditLogFiltersSchema = z.object(filterShape).strict();
export type AuditLogFilters = z.infer<typeof auditLogFiltersSchema>;

/** GET /v1/admin/audit-log */
export const listAuditLogQuery = z
  .object({
    ...filterShape,
    // Opaque keyset cursor (http/keysetCursor.ts); anything this list did not produce is 422.
    cursor: z
      .string()
      .max(512)
      .refine((raw) => decodeKeysetCursor(CURSOR_TAGS.auditLog, raw) !== null, { message: 'Invalid cursor.' })
      .optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .superRefine(fromNotAfterTo);
export type ListAuditLogQuery = z.infer<typeof listAuditLogQuery>;

/** GET /v1/admin/audit-log/export — the list's filters, no paging. */
export const exportAuditLogQuery = auditLogFiltersSchema.superRefine(fromNotAfterTo);
export type ExportAuditLogQuery = z.infer<typeof exportAuditLogQuery>;

export const auditActorTypes = ['USER', 'SYSTEM', 'JOB', 'ANONYMOUS'] as const;
export const auditOutcomes = ['ALLOWED', 'DENIED', 'ERROR'] as const;

/** openapi `AuditLogEntry`. */
export const auditLogEntry = z.object({
  id: z.string().uuid(),
  actorId: z.string().uuid().nullable(),
  actorType: z.enum(auditActorTypes),
  actorRole: z.string().nullable(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().uuid().nullable(),
  warehouseId: z.string().uuid().nullable(),
  outcome: z.enum(auditOutcomes),
  before: z.unknown(),
  after: z.unknown(),
  changedFields: z.array(z.string()).nullable(),
  correlationId: z.string().uuid().nullable(),
  ip: z.string().nullable(),
  at: z.string(),
});
export type AuditLogEntry = z.infer<typeof auditLogEntry>;

export const listAuditLogResponse = z.object({
  items: z.array(auditLogEntry),
  page: z.object({ nextCursor: z.string().nullable(), hasMore: z.boolean() }),
});
export type ListAuditLogResponse = z.infer<typeof listAuditLogResponse>;
