/**
 * BR-103: warehouse operational issues. Wiring only: requireAuth -> requirePermission -> validate -> handler.
 *
 * Mounted by app.ts at /v1/warehouses (through `warehouseOpsRouter`).
 *  - reads use `warehouse.issue.view`; writes (report, change, comment) use `warehouse.issue.manage`.
 *    A Sub admin holds both as `own`; the service confines it to its warehouse (same 404 otherwise).
 *  - There is no DELETE route: issues and comments are never deleted (BR-103 rule 6).
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  createWarehouseIssueBody,
  createWarehouseIssueCommentBody,
  listWarehouseIssuesQuery,
  updateWarehouseIssueBody,
  warehouseIssueParams,
  warehouseIssuesParams,
} from './warehouse-issues.schema.js';
import { warehouseIssuesService } from './warehouse-issues.service.js';

export const warehouseIssuesRouter: Router = Router();

warehouseIssuesRouter.get(
  '/:id/issues',
  requireAuth,
  requirePermission('warehouse.issue.view'),
  validate({ params: warehouseIssuesParams, query: listWarehouseIssuesQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', warehouseIssuesParams);
    const query = getValidated(req, 'query', listWarehouseIssuesQuery);
    res.json(await warehouseIssuesService.list(scope, id, query));
  }),
);

warehouseIssuesRouter.post(
  '/:id/issues',
  requireAuth,
  requirePermission('warehouse.issue.manage'),
  validate({ params: warehouseIssuesParams, body: createWarehouseIssueBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', warehouseIssuesParams);
    const body = getValidated(req, 'body', createWarehouseIssueBody);
    res.status(201).json(await warehouseIssuesService.create(scope, id, body));
  }),
);

warehouseIssuesRouter.get(
  '/:id/issues/:issueId',
  requireAuth,
  requirePermission('warehouse.issue.view'),
  validate({ params: warehouseIssueParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id, issueId } = getValidated(req, 'params', warehouseIssueParams);
    res.json(await warehouseIssuesService.get(scope, id, issueId));
  }),
);

warehouseIssuesRouter.patch(
  '/:id/issues/:issueId',
  requireAuth,
  requirePermission('warehouse.issue.manage'),
  validate({ params: warehouseIssueParams, body: updateWarehouseIssueBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id, issueId } = getValidated(req, 'params', warehouseIssueParams);
    const body = getValidated(req, 'body', updateWarehouseIssueBody);
    res.json(await warehouseIssuesService.update(scope, id, issueId, body));
  }),
);

warehouseIssuesRouter.post(
  '/:id/issues/:issueId/comments',
  requireAuth,
  requirePermission('warehouse.issue.manage'),
  validate({ params: warehouseIssueParams, body: createWarehouseIssueCommentBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id, issueId } = getValidated(req, 'params', warehouseIssueParams);
    const body = getValidated(req, 'body', createWarehouseIssueCommentBody);
    res.status(201).json(await warehouseIssuesService.addComment(scope, id, issueId, body));
  }),
);
