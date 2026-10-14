/**
 * BR-102 / BR-26: inter-warehouse transfers. Wiring only: requireAuth -> requirePermission ->
 * validate -> handler. Mounted by app.ts at /v1/warehouse-transfers.
 *
 *  - create and cancel: `transfer.inter_warehouse.initiate` (Super Admin and Main only, BR-26);
 *  - approve: `transfer.high_value.approve` (Super Admin only);
 *  - receive: `transfer.inter_warehouse.receive` (the service confines it to the destination);
 *  - list and read: `transfer.inter_warehouse.view` (a Sub admin sees transfers touching its warehouse).
 * Create, approve and receive require an Idempotency-Key; the service enforces it before any write.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  cancelTransferBody,
  createTransferBody,
  listTransfersQuery,
  receiveTransferBody,
  transferIdParams,
} from './warehouse-transfers.schema.js';
import { warehouseTransfersService } from './warehouse-transfers.service.js';

export const warehouseTransfersRouter: Router = Router();

warehouseTransfersRouter.get(
  '/',
  requireAuth,
  requirePermission('transfer.inter_warehouse.view'),
  validate({ query: listTransfersQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listTransfersQuery);
    res.json(await warehouseTransfersService.list(scope, query));
  }),
);

warehouseTransfersRouter.post(
  '/',
  requireAuth,
  requirePermission('transfer.inter_warehouse.initiate'),
  validate({ body: createTransferBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createTransferBody);
    const { transfer } = await warehouseTransfersService.create(scope, req.header('idempotency-key'), body);
    // A replay returns the original 201 response (docs/openapi.yaml IdempotencyKeyHeader).
    res.status(201).json(transfer);
  }),
);

warehouseTransfersRouter.get(
  '/:id',
  requireAuth,
  requirePermission('transfer.inter_warehouse.view'),
  validate({ params: transferIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', transferIdParams);
    res.json(await warehouseTransfersService.get(scope, id));
  }),
);

warehouseTransfersRouter.post(
  '/:id/approve',
  requireAuth,
  requirePermission('transfer.high_value.approve'),
  validate({ params: transferIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', transferIdParams);
    res.json(await warehouseTransfersService.approve(scope, id, req.header('idempotency-key')));
  }),
);

warehouseTransfersRouter.post(
  '/:id/receive',
  requireAuth,
  requirePermission('transfer.inter_warehouse.receive'),
  validate({ params: transferIdParams, body: receiveTransferBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', transferIdParams);
    const body = getValidated(req, 'body', receiveTransferBody);
    res.json(await warehouseTransfersService.receive(scope, id, req.header('idempotency-key'), body));
  }),
);

warehouseTransfersRouter.post(
  '/:id/cancel',
  requireAuth,
  requirePermission('transfer.inter_warehouse.initiate'),
  validate({ params: transferIdParams, body: cancelTransferBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', transferIdParams);
    const body = getValidated(req, 'body', cancelTransferBody);
    res.json(await warehouseTransfersService.cancel(scope, id, body));
  }),
);
