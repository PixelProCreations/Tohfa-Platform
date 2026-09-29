import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import {
  certificationCreateSchema,
  certificationIdParam,
  listCertificationsQuery,
  unverifyCertificationBody,
  verifyCertificationBody,
} from './certifications.schema.js';
import { certificationsService } from './certifications.service.js';

export const certificationsFarmerRouter: Router = Router();
export const certificationsAdminRouter: Router = Router();
export const configFarmerRouter: Router = Router();

// Farmer-facing config route (mounted at /v1/config). Global, non-farmer-scoped
// data (see BR docs/rules.md — none apply here; this is a display threshold,
// not a business rule), so it lives outside the farmer-scoped
// /v1/farmers/me/certifications prefix even though the value itself is
// cert-domain data owned by this module.
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

// Admin routes (mounted at /v1/admin/certifications)
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
