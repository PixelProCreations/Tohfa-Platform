/**
 * Tasks and alerts (BR-77, BR-78). Wiring only: requireAuth -> requirePermission -> validate -> handler.
 *
 * One router, mounted by app.ts at /v1/admin. `task.own.view` and `alert.own.view` are spec-gap
 * codes in docs/rbac.json (owner approval pending); the same code gates reading a list and acting
 * on one's own state in it (done, dismiss, snooze), because those only change the caller's own view.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  alertItemKeyParam,
  listAlertsQuery,
  listTasksQuery,
  snoozeAlertBody,
  taskItemKeyParam,
  taskSummaryQuery,
} from './tasks-alerts.schema.js';
import { tasksAlertsService } from './tasks-alerts.service.js';

export const tasksAlertsRouter: Router = Router();

tasksAlertsRouter.get(
  '/tasks',
  requireAuth,
  requirePermission('task.own.view'),
  validate({ query: listTasksQuery }),
  asyncHandler(async (req, res) => {
    res.json(await tasksAlertsService.listTasks(requireScope(req.scope), getValidated(req, 'query', listTasksQuery)));
  }),
);

// Registered before the `:itemKey` routes; the verbs differ, but the order keeps the intent obvious.
tasksAlertsRouter.get(
  '/tasks/summary',
  requireAuth,
  requirePermission('task.own.view'),
  validate({ query: taskSummaryQuery }),
  asyncHandler(async (req, res) => {
    res.json(await tasksAlertsService.taskSummary(requireScope(req.scope), getValidated(req, 'query', taskSummaryQuery)));
  }),
);

tasksAlertsRouter.post(
  '/tasks/:itemKey/done',
  requireAuth,
  requirePermission('task.own.view'),
  validate({ params: taskItemKeyParam }),
  asyncHandler(async (req, res) => {
    const { itemKey } = getValidated(req, 'params', taskItemKeyParam);
    res.json(await tasksAlertsService.markTaskDone(requireScope(req.scope), itemKey));
  }),
);

tasksAlertsRouter.get(
  '/alerts',
  requireAuth,
  requirePermission('alert.own.view'),
  validate({ query: listAlertsQuery }),
  asyncHandler(async (req, res) => {
    res.json(await tasksAlertsService.listAlerts(requireScope(req.scope), getValidated(req, 'query', listAlertsQuery)));
  }),
);

tasksAlertsRouter.post(
  '/alerts/:itemKey/dismiss',
  requireAuth,
  requirePermission('alert.own.view'),
  validate({ params: alertItemKeyParam }),
  asyncHandler(async (req, res) => {
    const { itemKey } = getValidated(req, 'params', alertItemKeyParam);
    res.json(await tasksAlertsService.dismissAlert(requireScope(req.scope), itemKey));
  }),
);

tasksAlertsRouter.post(
  '/alerts/:itemKey/snooze',
  requireAuth,
  requirePermission('alert.own.view'),
  validate({ params: alertItemKeyParam, body: snoozeAlertBody }),
  asyncHandler(async (req, res) => {
    const { itemKey } = getValidated(req, 'params', alertItemKeyParam);
    res.json(await tasksAlertsService.snoozeAlert(requireScope(req.scope), itemKey, getValidated(req, 'body', snoozeAlertBody)));
  }),
);
