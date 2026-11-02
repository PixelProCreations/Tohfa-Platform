/**
 * Admin accounts: create (BR-28, BR-112), Farmer Admin zones (BR-113), disable (BR-110). Wiring only:
 * requireAuth -> requirePermission -> validate -> handler.
 *
 * Mounted by app.ts at /v1/admin/accounts. There is no reactivation route for admin accounts.
 */
import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requireAnyPermission, requirePermission, requireScope, resolveScope } from '../../rbac/requirePermission.js';
import {
  adminAccountIdParams,
  createAdminAccountBody,
  CREATE_PERMISSION_BY_ROLE,
  disableAdminAccountBody,
  setFarmerAdminZonesBody,
} from './admin-accounts.schema.js';
import { adminAccountsService } from './admin-accounts.service.js';

export const adminAccountsRouter: Router = Router();

// POST /v1/admin/accounts — the code that applies depends on the role in the body
// (`x-permission-any-of` in docs/openapi.yaml). The gate admits a holder of any admin.*.create code;
// the code for the requested role is resolved here and enforced by the service (BR-28, BR-28b).
adminAccountsRouter.post(
  '/',
  requireAuth,
  requireAnyPermission(Object.values(CREATE_PERMISSION_BY_ROLE)),
  validate({ body: createAdminAccountBody }),
  asyncHandler(async (req, res) => {
    const gateScope = requireScope(req.scope);
    const body = getValidated(req, 'body', createAdminAccountBody);
    const createScope = resolveScope(requireActor(req.actor), CREATE_PERMISSION_BY_ROLE[body.role]);
    res.status(201).json(await adminAccountsService.create(gateScope, createScope, body));
  }),
);

// POST /v1/admin/accounts/:id/disable — idempotent (BR-110); the LOWER_ROLES_ONLY predicate is
// evaluated by the service against the loaded target.
adminAccountsRouter.post(
  '/:id/disable',
  requireAuth,
  requirePermission('admin.account.disable'),
  validate({ params: adminAccountIdParams, body: disableAdminAccountBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', adminAccountIdParams);
    const body = getValidated(req, 'body', disableAdminAccountBody);
    res.status(200).json(await adminAccountsService.disable(scope, id, body));
  }),
);

// PUT /v1/admin/accounts/:id/zones — replace a Farmer Admin's zones; idempotent (BR-113).
adminAccountsRouter.put(
  '/:id/zones',
  requireAuth,
  requirePermission('admin.farmer_admin.assign_zones'),
  validate({ params: adminAccountIdParams, body: setFarmerAdminZonesBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', adminAccountIdParams);
    const body = getValidated(req, 'body', setFarmerAdminZonesBody);
    res.status(200).json(await adminAccountsService.setZones(scope, id, body));
  }),
);
