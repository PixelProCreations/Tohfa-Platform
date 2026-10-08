/**
 * Generated from the _example reference module. See CLAUDE.md.
 *
 * Wiring only: requireAuth -> requirePermission -> validate -> handler.
 *
 * Both routes reuse `notification.own.view`, whose rbac.json description is
 * already "View own notifications and manage own notification preferences" —
 * the preference rows are the caller's own (scope.userId), so there is no
 * cross-user path to authorize.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { notificationPreferencesService } from './notification-preferences.service.js';
import { updatePreferenceBody, updatePreferenceParam } from './notification-preferences.schema.js';

export const notificationPreferencesRouter: Router = Router();

notificationPreferencesRouter.get(
  '/',
  requireAuth,
  requirePermission('notification.own.view'),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await notificationPreferencesService.listMine(scope));
  }),
);

notificationPreferencesRouter.patch(
  '/:category',
  requireAuth,
  requirePermission('notification.own.view'),
  validate({ params: updatePreferenceParam, body: updatePreferenceBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { category } = getValidated(req, 'params', updatePreferenceParam);
    const { enabled } = getValidated(req, 'body', updatePreferenceBody);
    res.json(await notificationPreferencesService.updateMine(scope, category, enabled));
  }),
);
