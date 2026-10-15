/**
 * BR-79: storage locations. Wiring only: requireAuth -> requirePermission -> validate -> handler.
 *
 * Mounted by app.ts at /v1/warehouses (through `warehouseOpsRouter`).
 *  - reads use `inventory.batch.view` (the design gates Storage Location Detail on it; a Sub admin is `own`);
 *  - writes use `warehouse.storage_location.manage` (a Sub admin is none: the storage screens are read-only for it).
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  createStorageLocationBody,
  listStorageLocationsQuery,
  storageLocationParams,
  updateStorageLocationBody,
  warehouseIdParams,
} from './storage-locations.schema.js';
import { storageLocationsService } from './storage-locations.service.js';

export const storageLocationsRouter: Router = Router();

storageLocationsRouter.get(
  '/:id/storage-locations',
  requireAuth,
  requirePermission('inventory.batch.view'),
  validate({ params: warehouseIdParams, query: listStorageLocationsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', warehouseIdParams);
    const query = getValidated(req, 'query', listStorageLocationsQuery);
    res.json(await storageLocationsService.list(scope, id, query));
  }),
);

storageLocationsRouter.get(
  '/:id/storage-locations/:locationId',
  requireAuth,
  requirePermission('inventory.batch.view'),
  validate({ params: storageLocationParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id, locationId } = getValidated(req, 'params', storageLocationParams);
    res.json(await storageLocationsService.get(scope, id, locationId));
  }),
);

storageLocationsRouter.post(
  '/:id/storage-locations',
  requireAuth,
  requirePermission('warehouse.storage_location.manage'),
  validate({ params: warehouseIdParams, body: createStorageLocationBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', warehouseIdParams);
    const body = getValidated(req, 'body', createStorageLocationBody);
    res.status(201).json(await storageLocationsService.create(scope, id, body));
  }),
);

storageLocationsRouter.patch(
  '/:id/storage-locations/:locationId',
  requireAuth,
  requirePermission('warehouse.storage_location.manage'),
  validate({ params: storageLocationParams, body: updateStorageLocationBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id, locationId } = getValidated(req, 'params', storageLocationParams);
    const body = getValidated(req, 'body', updateStorageLocationBody);
    res.json(await storageLocationsService.update(scope, id, locationId, body));
  }),
);
