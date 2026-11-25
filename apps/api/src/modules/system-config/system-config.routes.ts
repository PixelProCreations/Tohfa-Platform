import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { configKeyParams, updateSystemConfigBody } from './system-config.schema.js';
import { systemConfigService } from './system-config.service.js';

export const adminSystemConfigRouter: Router = Router();

// GET /v1/admin/system-config (SUPER_ADMIN only via system.config.manage)
adminSystemConfigRouter.get(
  '/',
  requireAuth,
  requirePermission('system.config.manage'),
  asyncHandler(async (_req, res) => {
    res.json(await systemConfigService.list());
  }),
);

// PATCH /v1/admin/system-config/:key
adminSystemConfigRouter.patch(
  '/:key',
  requireAuth,
  requirePermission('system.config.manage'),
  validate({ params: configKeyParams, body: updateSystemConfigBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { key } = getValidated(req, 'params', configKeyParams);
    const body = getValidated(req, 'body', updateSystemConfigBody);
    res.json(await systemConfigService.update(scope, key, body));
  }),
);
