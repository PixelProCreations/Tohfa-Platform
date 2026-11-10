/**
 * Admin Produce Control Calendar (BR-142): Router.
 *
 * Wiring only: requireAuth -> requirePermission('produce.calendar.view_consolidated') -> validate -> handler.
 * Mounted by app.ts at /v1/admin/produce.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  listProduceRecordsQuery,
  produceCalendarEventsQuery,
  produceCalendarQuery,
  produceRecordIdParams,
} from './admin-produce.schema.js';
import { adminProduceService, type AdminProduceService } from './admin-produce.service.js';

export function createAdminProduceRouter(service: AdminProduceService = adminProduceService): Router {
  const router: Router = Router();

  // GET /v1/admin/produce/records
  router.get(
    '/records',
    requireAuth,
    requirePermission('produce.calendar.view_consolidated'),
    validate({ query: listProduceRecordsQuery }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const query = getValidated(req, 'query', listProduceRecordsQuery);
      res.json(await service.listRecords(scope, query));
    }),
  );

  // GET /v1/admin/produce/records/:id
  router.get(
    '/records/:id',
    requireAuth,
    requirePermission('produce.calendar.view_consolidated'),
    validate({ params: produceRecordIdParams }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const { id } = getValidated(req, 'params', produceRecordIdParams);
      res.json(await service.getRecordById(scope, id));
    }),
  );

  // GET /v1/admin/produce/calendar
  router.get(
    '/calendar',
    requireAuth,
    requirePermission('produce.calendar.view_consolidated'),
    validate({ query: produceCalendarQuery }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const query = getValidated(req, 'query', produceCalendarQuery);
      res.json(await service.getCalendar(scope, query));
    }),
  );

  // GET /v1/admin/produce/calendar/events
  router.get(
    '/calendar/events',
    requireAuth,
    requirePermission('produce.calendar.view_consolidated'),
    validate({ query: produceCalendarEventsQuery }),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      const query = getValidated(req, 'query', produceCalendarEventsQuery);
      res.json(await service.listCalendarEvents(scope, query));
    }),
  );

  // GET /v1/admin/produce/filter-options
  router.get(
    '/filter-options',
    requireAuth,
    requirePermission('produce.calendar.view_consolidated'),
    asyncHandler(async (req, res) => {
      const scope = requireScope(req.scope);
      res.json(await service.getFilterOptions(scope));
    }),
  );

  return router;
}

export const adminProduceRouter: Router = createAdminProduceRouter();
