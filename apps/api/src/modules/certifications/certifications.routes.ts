import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import {
  adminListCertificationsQuery,
  certificationCreateSchema,
  certificationIdParam,
  certificationUpdateSchema,
  listCertificationsQuery,
  unverifyCertificationBody,
  verifyCertificationBody,
} from './certifications.schema.js';
import { certificationsService } from './certifications.service.js';

export const certificationsFarmerRouter: Router = Router();
export const certificationsAdminRouter: Router = Router();
export const configFarmerRouter: Router = Router();

// Farmer-facing config route (mounted at /v1/config). Global, non-farmer-scoped
// data: a display threshold (certExpiryWarningDays) and BR-48's
// certExpiryMaxPastDays / certExpiryMaxFutureDays, exposed only so the app can
// pre-check its form — the server enforces BR-48 on POST and PATCH regardless.
// It lives outside the farmer-scoped
// /v1/farmers/me/certifications prefix even though the values are cert-domain
// data owned by this module.
configFarmerRouter.get(
  '/farmer',
  requireAuth,
  requirePermission('farmer.config.view'),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const result = await certificationsService.getConfig(actor);
    res.json(result);
  }),
);

// Farmer routes (mounted at /v1/farmers/me/certifications)
certificationsFarmerRouter.get(
  '/',
  requireAuth,
  requirePermission('certification.manage_own'),
  validate({ query: listCertificationsQuery }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const query = getValidated(req, 'query', listCertificationsQuery);
    const result = await certificationsService.listMyCertifications(actor, query);
    res.json(result);
  }),
);

certificationsFarmerRouter.post(
  '/',
  requireAuth,
  requirePermission('certification.manage_own'),
  validate({ body: certificationCreateSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', certificationCreateSchema);
    const result = await certificationsService.createCertification(actor, body);
    res.status(201).json(result);
  }),
);

// BR-49: edit an own certificate. Any real change resets verification; the
// merged result is validated like POST. Not-own / deleted / unknown → 404.
certificationsFarmerRouter.patch(
  '/:id',
  requireAuth,
  requirePermission('certification.manage_own'),
  validate({ params: certificationIdParam, body: certificationUpdateSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', certificationIdParam);
    const body = getValidated(req, 'body', certificationUpdateSchema);
    const result = await certificationsService.updateMyCertification(actor, id, body);
    res.json(result);
  }),
);

// BR-50: soft-delete an own certificate. Not-own / deleted / unknown → 404.
certificationsFarmerRouter.delete(
  '/:id',
  requireAuth,
  requirePermission('certification.manage_own'),
  validate({ params: certificationIdParam }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', certificationIdParam);
    await certificationsService.deleteMyCertification(actor, id);
    res.status(204).end();
  }),
);

// Admin routes (mounted at /v1/admin/certifications)

// GET /v1/admin/certifications
// List all certifications across all farmers.
// Optional query params: status (UNVERIFIED|VERIFIED|REJECTED), farmerId, cursor, limit.
certificationsAdminRouter.get(
  '/',
  requireAuth,
  requirePermission('certification.view'),
  validate({ query: adminListCertificationsQuery }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const query = getValidated(req, 'query', adminListCertificationsQuery);
    const result = await certificationsService.adminListCertifications(actor, query);
    res.json(result);
  }),
);

// GET /v1/admin/certifications/:id
// Fetch a single certification by ID (any farmer, not scope-restricted).
certificationsAdminRouter.get(
  '/:id',
  requireAuth,
  requirePermission('certification.view'),
  validate({ params: certificationIdParam }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', certificationIdParam);
    const result = await certificationsService.adminGetCertification(actor, id);
    res.json(result);
  }),
);

// BR-51: TOHFA staff correct or remove any farmer's certificate. The same
// request body, validation, verification reset and soft delete as the farmer's
// own PATCH/DELETE (BR-49, BR-50); the owner whose market block is recomputed
// is read from the stored certificate, never the body. Unknown / deleted → 404.
certificationsAdminRouter.patch(
  '/:id',
  requireAuth,
  requirePermission('certification.manage_any'),
  validate({ params: certificationIdParam, body: certificationUpdateSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', certificationIdParam);
    const body = getValidated(req, 'body', certificationUpdateSchema);
    const result = await certificationsService.adminUpdateCertification(actor, id, body);
    res.json(result);
  }),
);

certificationsAdminRouter.delete(
  '/:id',
  requireAuth,
  requirePermission('certification.manage_any'),
  validate({ params: certificationIdParam }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', certificationIdParam);
    await certificationsService.adminDeleteCertification(actor, id);
    res.status(204).end();
  }),
);

certificationsAdminRouter.post(
  '/:id/verify',
  requireAuth,
  requirePermission('certification.mark_verified'),
  validate({ params: certificationIdParam, body: verifyCertificationBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', certificationIdParam);
    const body = getValidated(req, 'body', verifyCertificationBody);
    const result = await certificationsService.verifyCertification(actor, id, body);
    res.json(result);
  }),
);

certificationsAdminRouter.post(
  '/:id/unverify',
  requireAuth,
  requirePermission('certification.mark_verified'),
  validate({ params: certificationIdParam, body: unverifyCertificationBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', certificationIdParam);
    const body = getValidated(req, 'body', unverifyCertificationBody);
    const result = await certificationsService.unverifyCertification(actor, id, body);
    res.json(result);
  }),
);
