import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  listNotificationTemplatesQuery,
  listNotificationsQuery,
  notificationIdParam,
  notificationTemplateIdParam,
  registerDeviceTokenBody,
  revokeDeviceTokenParam,
  updateNotificationTemplateBody,
} from './notifications.schema.js';
import { notificationsService } from './notifications.service.js';

export const notificationsRouter: Router = Router();

notificationsRouter.get(
  '/',
  requireAuth,
  requirePermission('notification.own.view'),
  validate({ query: listNotificationsQuery }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const query = getValidated(req, 'query', listNotificationsQuery);
    const result = await notificationsService.listMyNotifications(actor, query);
    res.json(result);
  }),
);

// Registered before the `/:id` routes so the literal segment is never captured as an id.
notificationsRouter.post(
  '/read-all',
  requireAuth,
  requirePermission('notification.own.mark_read'),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    res.json(await notificationsService.markAllAsRead(actor));
  }),
);

notificationsRouter.get(
  '/:id',
  requireAuth,
  requirePermission('notification.own.view'),
  validate({ params: notificationIdParam }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', notificationIdParam);
    res.json(await notificationsService.getMyNotification(actor, id));
  }),
);

notificationsRouter.post(
  '/:id/read',
  requireAuth,
  requirePermission('notification.own.mark_read'),
  validate({ params: notificationIdParam }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', notificationIdParam);
    const result = await notificationsService.markAsRead(actor, id);
    res.json(result);
  }),
);

notificationsRouter.post(
  '/device-tokens',
  requireAuth,
  requirePermission('notification.own.view'),
  validate({ body: registerDeviceTokenBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', registerDeviceTokenBody);
    const result = await notificationsService.registerDeviceToken(actor, body);
    res.status(201).json(result);
  }),
);

notificationsRouter.delete(
  '/device-tokens/:token',
  requireAuth,
  requirePermission('notification.own.view'),
  validate({ params: revokeDeviceTokenParam }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { token } = getValidated(req, 'params', revokeDeviceTokenParam);
    const result = await notificationsService.revokeDeviceToken(actor, token);
    res.json(result);
  }),
);

// ---------------------------------------------------------------------------
// /v1/admin/notification-templates (BR-231, SUPER_ADMIN only)
// ---------------------------------------------------------------------------

export const adminNotificationTemplatesRouter: Router = Router();

adminNotificationTemplatesRouter.get(
  '/',
  requireAuth,
  requirePermission('notification.template.configure'),
  validate({ query: listNotificationTemplatesQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listNotificationTemplatesQuery);
    res.json(await notificationsService.listTemplates(scope, query));
  }),
);

adminNotificationTemplatesRouter.get(
  '/:id',
  requireAuth,
  requirePermission('notification.template.configure'),
  validate({ params: notificationTemplateIdParam }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', notificationTemplateIdParam);
    res.json(await notificationsService.getTemplate(scope, id));
  }),
);

adminNotificationTemplatesRouter.patch(
  '/:id',
  requireAuth,
  requirePermission('notification.template.configure'),
  validate({ params: notificationTemplateIdParam, body: updateNotificationTemplateBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', notificationTemplateIdParam);
    const body = getValidated(req, 'body', updateNotificationTemplateBody);
    res.json(await notificationsService.updateTemplate(scope, id, body));
  }),
);

