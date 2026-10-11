/**
 * BR-81: Sub Warehouse Admin staffing. Wiring only: requireAuth -> requirePermission -> validate -> handler.
 * Mounted by app.ts at /v1/admin/sub-warehouse-admins.
 *
 * Both routes use `admin.sub_wh_admin.create`: the designed Manage Sub Warehouse Admins screen is
 * gated on it (Super, Tohfa and Main admin). There is no update or delete route: deactivation is not
 * built (the design shows no status-changing action, and `admin.account.disable` is none for Main).
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { createSubAdminBody, listSubAdminsQuery } from './sub-admins.schema.js';
import { subAdminsService } from './sub-admins.service.js';

export const subAdminsRouter: Router = Router();

subAdminsRouter.get(
  '/',
  requireAuth,
  requirePermission('admin.sub_wh_admin.create'),
  validate({ query: listSubAdminsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listSubAdminsQuery);
    res.json(await subAdminsService.list(scope, query));
  }),
);

subAdminsRouter.post(
  '/',
  requireAuth,
  requirePermission('admin.sub_wh_admin.create'),
  validate({ body: createSubAdminBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createSubAdminBody);
    res.status(201).json(await subAdminsService.create(scope, body));
  }),
);
