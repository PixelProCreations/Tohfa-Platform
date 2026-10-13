/**
 * BR-105: warehouse documents. Wiring only: requireAuth -> requirePermission -> validate -> handler.
 *
 * Mounted by app.ts at /v1/warehouses (through `warehouseOpsRouter`).
 *  - reads use `warehouse.document.view` (a Sub admin is `own`);
 *  - writes use `warehouse.document.manage` (a Sub admin is none: licences, leases and insurance are
 *    warehouse master data).
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  createWarehouseDocumentBody,
  listWarehouseDocumentsQuery,
  updateWarehouseDocumentBody,
  warehouseDocumentParams,
  warehouseDocumentsParams,
} from './warehouse-documents.schema.js';
import { warehouseDocumentsService } from './warehouse-documents.service.js';

export const warehouseDocumentsRouter: Router = Router();

warehouseDocumentsRouter.get(
  '/:id/documents',
  requireAuth,
  requirePermission('warehouse.document.view'),
  validate({ params: warehouseDocumentsParams, query: listWarehouseDocumentsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', warehouseDocumentsParams);
    const query = getValidated(req, 'query', listWarehouseDocumentsQuery);
    res.json(await warehouseDocumentsService.list(scope, id, query));
  }),
);

warehouseDocumentsRouter.post(
  '/:id/documents',
  requireAuth,
  requirePermission('warehouse.document.manage'),
  validate({ params: warehouseDocumentsParams, body: createWarehouseDocumentBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', warehouseDocumentsParams);
    const body = getValidated(req, 'body', createWarehouseDocumentBody);
    res.status(201).json(await warehouseDocumentsService.create(scope, id, body));
  }),
);

warehouseDocumentsRouter.get(
  '/:id/documents/:documentId',
  requireAuth,
  requirePermission('warehouse.document.view'),
  validate({ params: warehouseDocumentParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id, documentId } = getValidated(req, 'params', warehouseDocumentParams);
    res.json(await warehouseDocumentsService.get(scope, id, documentId));
  }),
);

warehouseDocumentsRouter.patch(
  '/:id/documents/:documentId',
  requireAuth,
  requirePermission('warehouse.document.manage'),
  validate({ params: warehouseDocumentParams, body: updateWarehouseDocumentBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id, documentId } = getValidated(req, 'params', warehouseDocumentParams);
    const body = getValidated(req, 'body', updateWarehouseDocumentBody);
    res.json(await warehouseDocumentsService.update(scope, id, documentId, body));
  }),
);

warehouseDocumentsRouter.post(
  '/:id/documents/:documentId/archive',
  requireAuth,
  requirePermission('warehouse.document.manage'),
  validate({ params: warehouseDocumentParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id, documentId } = getValidated(req, 'params', warehouseDocumentParams);
    res.json(await warehouseDocumentsService.archive(scope, id, documentId));
  }),
);
