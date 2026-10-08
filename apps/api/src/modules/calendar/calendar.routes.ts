import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  calendarQuery,
  createPlatformEventBody,
  platformEventIdParams,
  updatePlatformEventBody,
} from './calendar.schema.js';
import { calendarService } from './calendar.service.js';

export const farmerCalendarRouter: Router = Router();

// GET /v1/farmers/me/calendar
farmerCalendarRouter.get(
  '/calendar',
  requireAuth,
  requirePermission('farmer.calendar.view_own'),
  validate({ query: calendarQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', calendarQuery);
    res.json(await calendarService.getFarmerCalendar(scope, query));
  }),
);

export const adminPlatformEventsRouter: Router = Router();

// GET /v1/admin/platform-events
adminPlatformEventsRouter.get(
  '/platform-events',
  requireAuth,
  requirePermission('platform.event.manage'),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    res.json({ items: await calendarService.listPlatformEvents(scope) });
  }),
);

// POST /v1/admin/platform-events
adminPlatformEventsRouter.post(
  '/platform-events',
  requireAuth,
  requirePermission('platform.event.manage'),
  validate({ body: createPlatformEventBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createPlatformEventBody);
    res.status(201).json(await calendarService.createPlatformEvent(scope, body));
  }),
);

// GET /v1/admin/platform-events/:id
adminPlatformEventsRouter.get(
  '/platform-events/:id',
  requireAuth,
  requirePermission('platform.event.manage'),
  validate({ params: platformEventIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', platformEventIdParams);
    res.json(await calendarService.getPlatformEvent(scope, id));
  }),
);

// PATCH /v1/admin/platform-events/:id
adminPlatformEventsRouter.patch(
  '/platform-events/:id',
  requireAuth,
  requirePermission('platform.event.manage'),
  validate({ params: platformEventIdParams, body: updatePlatformEventBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', platformEventIdParams);
    const body = getValidated(req, 'body', updatePlatformEventBody);
    res.json(await calendarService.updatePlatformEvent(scope, id, body));
  }),
);

// DELETE /v1/admin/platform-events/:id
adminPlatformEventsRouter.delete(
  '/platform-events/:id',
  requireAuth,
  requirePermission('platform.event.manage'),
  validate({ params: platformEventIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', platformEventIdParams);
    await calendarService.deletePlatformEvent(scope, id);
    res.status(204).end();
  }),
);
