import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { authRateLimit } from '../../rate-limit/rateLimiter.js';
import {
  changePasswordBody,
  forgotPasswordBody,
  loginBody,
  oauthLinkBody,
  oauthLoginBody,
  oauthProviderParams,
  refreshTokenBody,
  registerCustomerBody,
  resetPasswordBody,
  sendOtpBody,
  terminateSessionParams,
  updateMeBody,
  verifyOtpBody,
} from './auth.schema.js';
import { authService } from './auth.service.js';

export const authRouter: Router = Router();

authRouter.post(
  '/register/customer',
  validate({ body: registerCustomerBody }),
  authRateLimit(),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', registerCustomerBody);
    const result = await authService.registerCustomer(body);
    res.status(201).json(result);
  }),
);

authRouter.post(
  '/otp/send',
  validate({ body: sendOtpBody }),
  authRateLimit(),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', sendOtpBody);
    const result = await authService.sendOtp(body);
    res.status(202).json(result);
  }),
);

authRouter.post(
  '/otp/verify',
  validate({ body: verifyOtpBody }),
  authRateLimit(),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', verifyOtpBody);
    const result = await authService.verifyOtp(body, req.ip, req.headers['user-agent']);
    res.json(result);
  }),
);

authRouter.post(
  '/login',
  validate({ body: loginBody }),
  authRateLimit(),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', loginBody);
    const result = await authService.login(body, req.ip, req.headers['user-agent']);
    res.json(result);
  }),
);

authRouter.post(
  '/refresh',
  validate({ body: refreshTokenBody }),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', refreshTokenBody);
    const result = await authService.refreshToken(body.refreshToken);
    res.json(result);
  }),
);

authRouter.post(
  '/logout',
  requireAuth,
  requirePermission('auth.session.revoke_own'),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    await authService.logout(actor);
    res.status(204).send();
  }),
);

authRouter.post(
  '/forgot-password',
  validate({ body: forgotPasswordBody }),
  authRateLimit(),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', forgotPasswordBody);
    const result = await authService.forgotPassword(body);
    res.status(202).json(result);
  }),
);

authRouter.post(
  '/reset-password',
  validate({ body: resetPasswordBody }),
  authRateLimit(),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', resetPasswordBody);
    await authService.resetPassword(body);
    res.status(204).send();
  }),
);

authRouter.post(
  '/me/change-password',
  requireAuth,
  requirePermission('auth.password.change_own'),
  validate({ body: changePasswordBody }),
  authRateLimit(),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', changePasswordBody);
    await authService.changePassword(actor, body);
    res.status(204).send();
  }),
);

authRouter.post(
  '/sessions/:id/terminate',
  requireAuth,
  requirePermission('auth.session.terminate_other'),
  validate({ params: terminateSessionParams }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', terminateSessionParams);
    await authService.terminateSession(actor, id);
    res.status(204).send();
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  requirePermission('auth.principal.view_own'),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const result = await authService.getMe(actor);
    res.json(result);
  }),
);

// BR-82: an admin edits their own display name and language. The user id comes
// from the token only. mobile/email are BR-33 locked fields (403 FIELD_LOCKED).
// Mounted behind its own permission, not auth.principal.view_own, which is
// read-only and is granted to farmers and customers.
authRouter.patch(
  '/me',
  requireAuth,
  requirePermission('auth.profile.edit_own'),
  validate({ body: updateMeBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', updateMeBody);
    res.json(await authService.updateMyProfile(scope, body));
  }),
);

// BR-67: the caller's own live sessions. The user id is taken from the token
// only; there is deliberately no `:userId` or query filter.
authRouter.get(
  '/me/sessions',
  requireAuth,
  requirePermission('auth.principal.view_own'),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const result = await authService.listMySessions(actor);
    res.json(result);
  }),
);

// BR-39: alternate login method for an already mobile-verified account, or a
// prefill convenience during first-time registration — public like /auth/login,
// never a way to create/activate an account by itself.
authRouter.post(
  '/oauth/:provider',
  validate({ params: oauthProviderParams, body: oauthLoginBody }),
  authRateLimit(),
  asyncHandler(async (req, res) => {
    const { provider } = getValidated(req, 'params', oauthProviderParams);
    const body = getValidated(req, 'body', oauthLoginBody);
    const result = await authService.loginWithOAuth(provider, body, req.ip, req.headers['user-agent']);
    res.status(200).json(result);
  }),
);

authRouter.post(
  '/me/oauth/link',
  requireAuth,
  requirePermission('auth.oauth.link_own'),
  validate({ body: oauthLinkBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', oauthLinkBody);
    const result = await authService.linkOAuthIdentity(actor, body);
    res.status(200).json(result);
  }),
);

authRouter.delete(
  '/me/oauth/:provider',
  requireAuth,
  requirePermission('auth.oauth.unlink_own'),
  validate({ params: oauthProviderParams }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { provider } = getValidated(req, 'params', oauthProviderParams);
    await authService.unlinkOAuthIdentity(actor, provider);
    res.status(204).send();
  }),
);
