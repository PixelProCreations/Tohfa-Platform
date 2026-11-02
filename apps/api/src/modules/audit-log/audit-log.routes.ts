/**
 * Audit log (BR-35, BR-30). Wiring only: requireAuth -> requirePermission -> validate -> handler.
 *
 * Mounted by app.ts at /v1/admin/audit-log. READ-ONLY BY DESIGN: this router registers GET routes
 * and nothing else. BR-35 forbids every role, SUPER_ADMIN included, from editing or deleting an
 * audit entry, and the table itself rejects UPDATE/DELETE (db/migrations/0008_platform.sql). Do not
 * add a mutating route here; a correction is a new, compensating entry written by the module that
 * made the change.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { exportAuditLogQuery, listAuditLogQuery } from './audit-log.schema.js';
import { auditLogService } from './audit-log.service.js';

export const auditLogRouter: Router = Router();

auditLogRouter.get(
  '/',
  requireAuth,
  requirePermission('auditlog.view'),
  validate({ query: listAuditLogQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await auditLogService.list(scope, getValidated(req, 'query', listAuditLogQuery)));
  }),
);

// SUPER_ADMIN only (`auditlog.export`, BR-35). The service writes the export's own audit row on
// the read's transaction.
auditLogRouter.get(
  '/export',
  requireAuth,
  requirePermission('auditlog.export'),
  validate({ query: exportAuditLogQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const result = await auditLogService.exportCsv(scope, getValidated(req, 'query', exportAuditLogQuery));
    res
      .status(200)
      .set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        // Audit data: never kept by a shared cache, never sniffed into another type.
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      })
      .send(result.csv);
  }),
);
