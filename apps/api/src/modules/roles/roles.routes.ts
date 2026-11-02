/**
 * Role definitions (BR-109). Wiring only: requireAuth -> requirePermission -> validate -> handler.
 *
 * Mounted by app.ts at /v1/roles. READ-ONLY: editing a grant is `role.permission.edit`, which is
 * not built; grants change through docs/rbac.json and the seed, never through this router.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { roleCodeParams } from './roles.schema.js';
import { rolesService } from './roles.service.js';

export const rolesRouter: Router = Router();

rolesRouter.get(
  '/',
  requireAuth,
  requirePermission('role.definition.view'),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json(await rolesService.list(scope));
  }),
);

rolesRouter.get(
  '/:code',
  requireAuth,
  requirePermission('role.definition.view'),
  validate({ params: roleCodeParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { code } = getValidated(req, 'params', roleCodeParams);
    res.json(await rolesService.get(scope, code));
  }),
);
