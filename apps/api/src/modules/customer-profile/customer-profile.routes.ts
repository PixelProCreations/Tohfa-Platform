/**
 * Customer self-service profile, mounted at /v1/customers/me (BR-160).
 * Wiring only: requireAuth -> requirePermission -> validate -> handler.
 * Reading one's own profile uses customer.profile.edit (CUSTOMER own): there is
 * no separate view code, and anyone who may edit a profile may read it.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { customerProfileService } from './customer-profile.service.js';
import { emailOtpBody, emailVerifyBody, gstDetailsBody, updateProfileBody } from './customer-profile.schema.js';

export const customerProfileRouter: Router = Router();

customerProfileRouter.get(
  '/',
  requireAuth,
  requirePermission('customer.profile.edit'),
  asyncHandler(async (req, res) => {
    res.json(await customerProfileService.get(requireScope(req.scope)));
  }),
);

customerProfileRouter.patch(
  '/',
  requireAuth,
  requirePermission('customer.profile.edit'),
  validate({ body: updateProfileBody }),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', updateProfileBody);
    res.json(await customerProfileService.update(requireScope(req.scope), body));
  }),
);

customerProfileRouter.delete(
  '/',
  requireAuth,
  requirePermission('customer.account.delete_own'),
  asyncHandler(async (req, res) => {
    await customerProfileService.deleteAccount(requireScope(req.scope));
    res.status(204).end();
  }),
);

customerProfileRouter.put(
  '/gst-details',
  requireAuth,
  requirePermission('customer.gst_details.manage'),
  validate({ body: gstDetailsBody }),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', gstDetailsBody);
    res.json(await customerProfileService.setGstDetails(requireScope(req.scope), body));
  }),
);

customerProfileRouter.post(
  '/email/otp',
  requireAuth,
  requirePermission('customer.profile.edit'),
  validate({ body: emailOtpBody }),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', emailOtpBody);
    res.status(202).json(await customerProfileService.requestEmailOtp(requireScope(req.scope), body));
  }),
);

customerProfileRouter.post(
  '/email/verify',
  requireAuth,
  requirePermission('customer.profile.edit'),
  validate({ body: emailVerifyBody }),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', emailVerifyBody);
    res.json(await customerProfileService.verifyEmail(requireScope(req.scope), body));
  }),
);
