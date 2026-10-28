/**
 * Admin farmer directory and profile (BR-108). Wiring only:
 * requireAuth -> requirePermission -> validate -> handler.
 *
 * Mounted by app.ts at /v1/admin/farmers, next to the farm-ratings, farm-assets and livestock admin
 * routers that share the prefix (their paths are disjoint from these).
 */
import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope, resolveScope } from '../../rbac/requirePermission.js';
import { farmerDocumentParams, farmerIdParams, listAdminFarmersQuery, updateAdminFarmerBody } from './admin-farmers.schema.js';
import { adminFarmersService } from './admin-farmers.service.js';

export const adminFarmersRouter: Router = Router();

// GET /v1/admin/farmers — the directory
adminFarmersRouter.get(
  '/',
  requireAuth,
  requirePermission('farmer.profile.view_all'),
  validate({ query: listAdminFarmersQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await adminFarmersService.list(scope, getValidated(req, 'query', listAdminFarmersQuery)));
  }),
);

// GET /v1/admin/farmers/:id — the profile
adminFarmersRouter.get(
  '/:id',
  requireAuth,
  requirePermission('farmer.profile.view_all'),
  validate({ params: farmerIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', farmerIdParams);
    res.json(await adminFarmersService.get(scope, id));
  }),
);

// PATCH /v1/admin/farmers/:id — profile edit. The locked fields (BR-33) additionally need
// farmer.profile.edit_locked_field; its scope (or null) is handed to the service, which refuses a
// locked key with FIELD_LOCKED before anything is written.
adminFarmersRouter.patch(
  '/:id',
  requireAuth,
  requirePermission('farmer.profile.edit'),
  validate({ params: farmerIdParams, body: updateAdminFarmerBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const lockedFieldScope = resolveScope(requireActor(req.actor), 'farmer.profile.edit_locked_field');
    const { id } = getValidated(req, 'params', farmerIdParams);
    const body = getValidated(req, 'body', updateAdminFarmerBody);
    res.json(await adminFarmersService.update(scope, lockedFieldScope, id, body));
  }),
);

// GET /v1/admin/farmers/:id/documents
adminFarmersRouter.get(
  '/:id/documents',
  requireAuth,
  requirePermission('farmer.document.view'),
  validate({ params: farmerIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', farmerIdParams);
    res.json(await adminFarmersService.listDocuments(scope, id));
  }),
);

// POST /v1/admin/farmers/:id/documents/:docId/verify — idempotent (BR-108)
adminFarmersRouter.post(
  '/:id/documents/:docId/verify',
  requireAuth,
  requirePermission('farmer.document.verify'),
  validate({ params: farmerDocumentParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id, docId } = getValidated(req, 'params', farmerDocumentParams);
    res.status(200).json(await adminFarmersService.verifyDocument(scope, id, docId));
  }),
);

// GET /v1/admin/farmers/:id/bank-accounts — masked, not audited (BR-53)
adminFarmersRouter.get(
  '/:id/bank-accounts',
  requireAuth,
  requirePermission('farmer.bank_account.view'),
  validate({ params: farmerIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', farmerIdParams);
    res.json(await adminFarmersService.listBankAccounts(scope, id));
  }),
);

// GET /v1/admin/farmers/:id/subscription — free-tier limits are null while unset (BR-14)
adminFarmersRouter.get(
  '/:id/subscription',
  requireAuth,
  requirePermission('farmer.subscription.view_tier_limits'),
  validate({ params: farmerIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', farmerIdParams);
    res.json(await adminFarmersService.getSubscription(scope, id));
  }),
);
