import { Router, type RequestHandler } from 'express';
import { optionalAuth, requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { signUploadBody } from '../uploads/uploads.schema.js';
import {
  addApplicationNoteBody,
  advanceApplicationBody,
  applicationDocumentParams,
  applicationLocationParams,
  approveApplicationBody,
  createFarmerApplicationBody,
  farmerApplicationIdParams,
  listAdminApplicationsQuery,
  registrationStepBodySchemas,
  rejectApplicationBody,
  requestInfoApplicationBody,
  reviewDecisionBody,
  updateFarmerProfileBody,
  updateStepParams,
} from './farmer-applications.schema.js';
import { farmerApplicationsService } from './farmer-applications.service.js';

export const farmerApplicationsRouter: Router = Router();

// Draft creation (public)
farmerApplicationsRouter.post(
  '/applications',
  optionalAuth,
  validate({ body: createFarmerApplicationBody }),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', createFarmerApplicationBody);
    const result = await farmerApplicationsService.createDraft(body, req.actor);
    res.status(201).json(result);
  }),
);

// BR-69: the body schema depends on the `:step` path parameter, so it is picked from the
// already-validated params and handed to the ordinary `validate` middleware (same 422
// VALIDATION_FAILED shape, same field paths as every other route). Runs after the params check,
// so an out-of-range step is still rejected as a bad path before any body is looked at.
const validateStepBody: RequestHandler = (req, res, next) => {
  const { step } = getValidated(req, 'params', updateStepParams);
  validate({ body: registrationStepBodySchemas[step as 1 | 2 | 3 | 4 | 5] })(req, res, next);
};

// Save individual step (1..5)
farmerApplicationsRouter.patch(
  '/applications/:id/steps/:step',
  optionalAuth,
  validate({ params: updateStepParams }),
  validateStepBody,
  asyncHandler(async (req, res) => {
    const { id, step } = getValidated(req, 'params', updateStepParams);
    // `req.body` is the PARSED body: strict, trimmed, with a full Aadhaar number already dropped.
    const result = await farmerApplicationsService.updateStep(req.actor, id, step, req.body);
    res.json(result);
  }),
);

// Registration-scoped signed upload URL (public -- no account exists yet; see
// uploads.routes.ts's authenticated POST /uploads/sign for the normal, logged-in
// path). Mirrors steps/:step's wiring exactly: optionalAuth, no requirePermission,
// ownership/liveness checked inside the service instead of via RBAC scope.
farmerApplicationsRouter.post(
  '/applications/:id/uploads/sign',
  optionalAuth,
  validate({ params: farmerApplicationIdParams, body: signUploadBody }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', farmerApplicationIdParams);
    const body = getValidated(req, 'body', signUploadBody);
    const result = await farmerApplicationsService.requestDocumentUploadUrl(id, body);
    res.status(201).json(result);
  }),
);

// Submit application for review
farmerApplicationsRouter.post(
  '/applications/:id/submit',
  optionalAuth,
  validate({ params: farmerApplicationIdParams }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', farmerApplicationIdParams);
    const result = await farmerApplicationsService.submitApplication(req.actor, id);
    res.json(result);
  }),
);

// BR-217: the applicant answers a request for information (INFO_REQUESTED -> DOCS_REVIEW).
// Same optionalAuth + possession-of-UUID model as /submit and /status: an applicant usually has
// no account yet, so the unguessable application id is the credential. No Idempotency-Key: there
// is no account to scope one to, so the operation is idempotent by state instead (a repeat call
// returns the current state and writes nothing).
farmerApplicationsRouter.post(
  '/applications/:id/resubmit',
  optionalAuth,
  validate({ params: farmerApplicationIdParams }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', farmerApplicationIdParams);
    const result = await farmerApplicationsService.resubmitApplication(req.actor, id);
    res.json(result);
  }),
);

// Status timeline
farmerApplicationsRouter.get(
  '/applications/:id/status',
  optionalAuth,
  validate({ params: farmerApplicationIdParams }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', farmerApplicationIdParams);
    const result = await farmerApplicationsService.getStatusTimeline(req.actor, id);
    res.json(result);
  }),
);

// Full draft (steps 1-4 field values) -- distinct from the lightweight /status
// timeline above. Same optionalAuth + possession-of-UUID pattern as /status and
// /uploads/sign: a pre-approval applicant has no account yet, so the id itself is
// the credential. Lets a farmer who lost their local draft (reinstalled app,
// cleared storage, new device) recover it using the `applicationId` now returned
// in createDraft's 409 CONFLICT meta.
farmerApplicationsRouter.get(
  '/applications/:id',
  optionalAuth,
  validate({ params: farmerApplicationIdParams }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', farmerApplicationIdParams);
    const result = await farmerApplicationsService.getFullDraft(req.actor, id);
    res.json(result);
  }),
);

// Own farmer profile
farmerApplicationsRouter.get(
  '/me',
  requireAuth,
  requirePermission('farmer.profile.view_own'),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const result = await farmerApplicationsService.getMyProfile(actor);
    res.json(result);
  }),
);

farmerApplicationsRouter.patch(
  '/me',
  requireAuth,
  requirePermission('farmer.profile.edit_own'),
  validate({ body: updateFarmerProfileBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', updateFarmerProfileBody);
    const result = await farmerApplicationsService.updateMyProfile(actor, body);
    res.json(result);
  }),
);

// Admin farmer applications router (mounted at /v1/admin/farmer-applications)
export const adminFarmerApplicationsRouter: Router = Router();

adminFarmerApplicationsRouter.get(
  '/',
  requireAuth,
  requirePermission('farmer.application.list_pending'),
  validate({ query: listAdminApplicationsQuery }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listAdminApplicationsQuery);
    const result = await farmerApplicationsService.listAdminApplications(actor, scope, query);
    res.json(result);
  }),
);

adminFarmerApplicationsRouter.get(
  '/:id',
  requireAuth,
  requirePermission('farmer.application.view'),
  validate({ params: farmerApplicationIdParams }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', farmerApplicationIdParams);
    const result = await farmerApplicationsService.getAdminApplication(actor, scope, id);
    res.json(result);
  }),
);

// Every admin mutation: requireAuth -> requirePermission -> validate -> service, with the
// resolved scope and the raw Idempotency-Key (the service requires it, BR-214).
adminFarmerApplicationsRouter.post(
  '/:id/approve',
  requireAuth,
  requirePermission('farmer.application.approve'),
  validate({ params: farmerApplicationIdParams, body: approveApplicationBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', farmerApplicationIdParams);
    const body = getValidated(req, 'body', approveApplicationBody);
    const result = await farmerApplicationsService.approveApplication(actor, scope, id, body, req.header('idempotency-key'));
    res.json(result);
  }),
);

adminFarmerApplicationsRouter.post(
  '/:id/reject',
  requireAuth,
  requirePermission('farmer.application.reject'),
  validate({ params: farmerApplicationIdParams, body: rejectApplicationBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', farmerApplicationIdParams);
    const body = getValidated(req, 'body', rejectApplicationBody);
    const result = await farmerApplicationsService.rejectApplication(actor, scope, id, body, req.header('idempotency-key'));
    res.json(result);
  }),
);

adminFarmerApplicationsRouter.post(
  '/:id/request-info',
  requireAuth,
  requirePermission('farmer.application.request_info'),
  validate({ params: farmerApplicationIdParams, body: requestInfoApplicationBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', farmerApplicationIdParams);
    const body = getValidated(req, 'body', requestInfoApplicationBody);
    const result = await farmerApplicationsService.requestInfoApplication(actor, scope, id, body, req.header('idempotency-key'));
    res.json(result);
  }),
);

// BR-214: DOCS_REVIEW -> FARM_VERIFICATION once the documents gate is met.
adminFarmerApplicationsRouter.post(
  '/:id/advance',
  requireAuth,
  requirePermission('farmer.application.advance'),
  validate({ params: farmerApplicationIdParams, body: advanceApplicationBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', farmerApplicationIdParams);
    const body = getValidated(req, 'body', advanceApplicationBody);
    const result = await farmerApplicationsService.advanceApplication(actor, scope, id, body, req.header('idempotency-key'));
    res.json(result);
  }),
);

// BR-215: verify or reject one step-4 document.
adminFarmerApplicationsRouter.post(
  '/:id/documents/:documentKey/review',
  requireAuth,
  requirePermission('farmer.application.verify_document'),
  validate({ params: applicationDocumentParams, body: reviewDecisionBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const { id, documentKey } = getValidated(req, 'params', applicationDocumentParams);
    const body = getValidated(req, 'body', reviewDecisionBody);
    const result = await farmerApplicationsService.reviewApplicationDocument(
      actor,
      scope,
      id,
      documentKey,
      body,
      req.header('idempotency-key'),
    );
    res.json(result);
  }),
);

// BR-216: verify or reject one land location's FMB boundary.
adminFarmerApplicationsRouter.post(
  '/:id/locations/:locationId/fmb-review',
  requireAuth,
  requirePermission('farmer.application.verify_fmb'),
  validate({ params: applicationLocationParams, body: reviewDecisionBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const { id, locationId } = getValidated(req, 'params', applicationLocationParams);
    const body = getValidated(req, 'body', reviewDecisionBody);
    const result = await farmerApplicationsService.reviewApplicationFmb(
      actor,
      scope,
      id,
      locationId,
      body,
      req.header('idempotency-key'),
    );
    res.json(result);
  }),
);

// BR-218: a review note at any live stage; no status change.
adminFarmerApplicationsRouter.post(
  '/:id/notes',
  requireAuth,
  requirePermission('farmer.application.add_note'),
  validate({ params: farmerApplicationIdParams, body: addApplicationNoteBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', farmerApplicationIdParams);
    const body = getValidated(req, 'body', addApplicationNoteBody);
    const result = await farmerApplicationsService.addApplicationNote(actor, scope, id, body, req.header('idempotency-key'));
    res.json(result);
  }),
);
