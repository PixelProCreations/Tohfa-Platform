/**
 * Customer delivery addresses, mounted at /v1/customers/me/addresses (BR-160).
 * Wiring only: requireAuth -> requirePermission -> validate -> handler.
 */
import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { customerAddressesService } from './customer-addresses.service.js';
import { addressIdParams, createAddressBody, updateAddressBody } from './customer-addresses.schema.js';

export const customerAddressesRouter: Router = Router();

const PERMISSION = 'customer.address.manage_own';

customerAddressesRouter.get(
  '/',
  requireAuth,
  requirePermission(PERMISSION),
  asyncHandler(async (req, res) => {
    res.json(await customerAddressesService.list(requireScope(req.scope)));
  }),
);

customerAddressesRouter.post(
  '/',
  requireAuth,
  requirePermission(PERMISSION),
  validate({ body: createAddressBody }),
  asyncHandler(async (req, res) => {
    const body = getValidated(req, 'body', createAddressBody);
    res.status(201).json(await customerAddressesService.create(requireScope(req.scope), body));
  }),
);

customerAddressesRouter.get(
  '/:addressId',
  requireAuth,
  requirePermission(PERMISSION),
  validate({ params: addressIdParams }),
  asyncHandler(async (req, res) => {
    const { addressId } = getValidated(req, 'params', addressIdParams);
    res.json(await customerAddressesService.get(requireScope(req.scope), addressId));
  }),
);

customerAddressesRouter.patch(
  '/:addressId',
  requireAuth,
  requirePermission(PERMISSION),
  validate({ params: addressIdParams, body: updateAddressBody }),
  asyncHandler(async (req, res) => {
    const { addressId } = getValidated(req, 'params', addressIdParams);
    const body = getValidated(req, 'body', updateAddressBody);
    res.json(await customerAddressesService.update(requireScope(req.scope), addressId, body));
  }),
);

customerAddressesRouter.delete(
  '/:addressId',
  requireAuth,
  requirePermission(PERMISSION),
  validate({ params: addressIdParams }),
  asyncHandler(async (req, res) => {
    const { addressId } = getValidated(req, 'params', addressIdParams);
    await customerAddressesService.remove(requireScope(req.scope), addressId);
    res.status(204).end();
  }),
);

customerAddressesRouter.post(
  '/:addressId/default',
  requireAuth,
  requirePermission(PERMISSION),
  validate({ params: addressIdParams }),
  asyncHandler(async (req, res) => {
    const { addressId } = getValidated(req, 'params', addressIdParams);
    res.json(await customerAddressesService.setDefault(requireScope(req.scope), addressId));
  }),
);
