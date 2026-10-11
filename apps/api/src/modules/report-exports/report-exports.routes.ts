/**
 * Report exports (BR-76). Wiring only: requireAuth -> requirePermission -> validate -> handler.
 *
 * GET /v1/admin/exports/<report>, mounted by app.ts at /v1/admin/exports. One literal route per report,
 * because each has its own query (see report-exports.schema.ts); an unknown report name falls
 * through to the router's 404.
 *
 * Two permission checks, in this order, both must pass:
 *  1. `report.export.file` (docs/rbac.json: SUPER_ADMIN and TOHFA_ADMIN `all`, MAIN_WH_ADMIN and
 *     FARMER_ADMIN `view`, SUB_WH_ADMIN `own`, FARMER and CUSTOMER `own`). `view` is "read-only, no
 *     mutation": requirePermission lets a GET through and refuses any other verb, which is how every
 *     module reads it, so a Main admin may export. docs/SPEC_GAPS #11 flags that the screens treat
 *     `view` as "no export button": an open owner decision (see openapi).
 *  2. The permission of the data being exported, the same one the report or finance endpoint it
 *     exports requires. FINAL_LIST row 92 gates a report on "can() of its data code" and the export
 *     on `report.export.file`; having the export permission must not open a report whose data the
 *     caller may not read (FARMER_ADMIN, FARMER and CUSTOMER hold `report.export.file` but none of
 *     the data permissions, apart from CUSTOMER's `own` order list, which the service refuses).
 * The second check is the one whose scope the service receives, as in the report endpoints.
 */
import { Router } from 'express';
import type { ZodTypeAny, z } from 'zod';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { exportQuerySchemas, type ExportReport } from './report-exports.schema.js';
import { reportExportsService, type ExportRequest } from './report-exports.service.js';

export const reportExportsRouter: Router = Router();

function register<S extends ZodTypeAny>(
  report: ExportReport,
  dataPermission: string,
  schema: S,
  toRequest: (query: z.infer<S>) => ExportRequest,
): void {
  reportExportsRouter.get(
    `/${report}`,
    requireAuth,
    requirePermission('report.export.file'),
    requirePermission(dataPermission),
    validate({ query: schema }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const result = await reportExportsService.exportReport(scope, toRequest(getValidated(req, 'query', schema)));
      res
        .status(200)
        .set({
          'Content-Type': 'text/csv; charset=utf-8',
          // The file name is built from [A-Za-z0-9_.-] only (service), so it needs no escaping here.
          'Content-Disposition': `attachment; filename="${result.filename}"`,
          // Report data: never cached by a shared cache, never sniffed into another type.
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        })
        .send(result.csv);
    }),
  );
}

register('sales', 'order.list.view_all', exportQuerySchemas.sales, (query) => ({ report: 'sales', query }));
register('receiving', 'inventory.goods_receipt.record', exportQuerySchemas.receiving, (query) => ({ report: 'receiving', query }));
register('inventory', 'inventory.batch.view', exportQuerySchemas.inventory, (query) => ({ report: 'inventory', query }));
register('returns', 'rma.request.process', exportQuerySchemas.returns, (query) => ({ report: 'returns', query }));
register('customers', 'customer.list.view', exportQuerySchemas.customers, (query) => ({ report: 'customers', query }));
register('cash-topups', 'wallet.cash_topup.process', exportQuerySchemas['cash-topups'], (query) => ({ report: 'cash-topups', query }));
register('expenses', 'finance.expense.log', exportQuerySchemas.expenses, (query) => ({ report: 'expenses', query }));
register('finance-revenue', 'finance.sales_income.view', exportQuerySchemas['finance-revenue'], (query) => ({ report: 'finance-revenue', query }));
register('finance-expenses', 'finance.expense.log', exportQuerySchemas['finance-expenses'], (query) => ({ report: 'finance-expenses', query }));
