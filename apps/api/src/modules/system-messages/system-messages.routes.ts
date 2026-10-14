import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { listSystemMessagesQuery, systemMessageIdParam } from './system-messages.schema.js';
import { systemMessagesService } from './system-messages.service.js';

export const systemMessagesRouter: Router = Router();

// INTERIM permission codes: docs/rbac.json has no dedicated system-message permission, so the
// own-notification codes are reused until the owner adds one.
systemMessagesRouter.get(
  '/',
  requireAuth,
  requirePermission('notification.own.view'),
  validate({ query: listSystemMessagesQuery }),
  asyncHandler(async (req, res) => {
    const query = getValidated(req, 'query', listSystemMessagesQuery);
    res.json(await systemMessagesService.list(requireActor(req.actor), requireScope(req.scope), query));
  }),
);

systemMessagesRouter.get(
  '/:id',
  requireAuth,
  requirePermission('notification.own.view'),
  validate({ params: systemMessageIdParam }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', systemMessageIdParam);
    res.json(await systemMessagesService.get(requireActor(req.actor), requireScope(req.scope), id));
  }),
);

systemMessagesRouter.post(
  '/:id/read',
  requireAuth,
  requirePermission('notification.own.mark_read'),
  validate({ params: systemMessageIdParam }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', systemMessageIdParam);
    res.json(await systemMessagesService.markRead(requireActor(req.actor), requireScope(req.scope), id));
  }),
);
