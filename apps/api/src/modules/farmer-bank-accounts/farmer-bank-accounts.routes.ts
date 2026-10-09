import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import {
  createFarmerBankAccountBody,
  farmerBankAccountIdParam,
  updateFarmerBankAccountBody,
  updateFarmerUpiBody,
} from './farmer-bank-accounts.schema.js';
import { farmerBankAccountsService } from './farmer-bank-accounts.service.js';

export const farmerBankAccountsRouter: Router = Router();
export const farmerUpiRouter: Router = Router();

// /v1/farmers/me/bank-accounts
farmerBankAccountsRouter.get(
  '/',
  requireAuth,
  requirePermission('farmer.bank_account.manage_own'),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const result = await farmerBankAccountsService.listMyBankAccounts(actor);
    res.json(result);
  }),
);

farmerBankAccountsRouter.post(
  '/',
  requireAuth,
  requirePermission('farmer.bank_account.manage_own'),
  validate({ body: createFarmerBankAccountBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', createFarmerBankAccountBody);
    const result = await farmerBankAccountsService.createMyBankAccount(actor, body);
    res.status(201).json(result);
  }),
);

farmerBankAccountsRouter.patch(
  '/:id',
  requireAuth,
  requirePermission('farmer.bank_account.manage_own'),
  validate({ params: farmerBankAccountIdParam, body: updateFarmerBankAccountBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', farmerBankAccountIdParam);
    const body = getValidated(req, 'body', updateFarmerBankAccountBody);
    const result = await farmerBankAccountsService.updateMyBankAccount(actor, id, body);
    res.json(result);
  }),
);

farmerBankAccountsRouter.post(
  '/:id/default',
  requireAuth,
  requirePermission('farmer.bank_account.manage_own'),
  validate({ params: farmerBankAccountIdParam }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', farmerBankAccountIdParam);
    const result = await farmerBankAccountsService.setDefaultBankAccount(actor, id);
    res.json(result);
  }),
);

farmerBankAccountsRouter.delete(
  '/:id',
  requireAuth,
  requirePermission('farmer.bank_account.manage_own'),
  validate({ params: farmerBankAccountIdParam }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { id } = getValidated(req, 'params', farmerBankAccountIdParam);
    await farmerBankAccountsService.deleteMyBankAccount(actor, id);
    res.status(204).send();
  }),
);

// /v1/farmers/me/upi
farmerUpiRouter.get(
  '/',
  requireAuth,
  requirePermission('farmer.bank_account.manage_own'),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const result = await farmerBankAccountsService.getMyUpi(actor);
    res.json(result);
  }),
);

farmerUpiRouter.put(
  '/',
  requireAuth,
  requirePermission('farmer.bank_account.manage_own'),
  validate({ body: updateFarmerUpiBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', updateFarmerUpiBody);
    const result = await farmerBankAccountsService.updateMyUpi(actor, body);
    res.json(result);
  }),
);

farmerUpiRouter.delete(
  '/',
  requireAuth,
  requirePermission('farmer.bank_account.manage_own'),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    await farmerBankAccountsService.deleteMyUpi(actor);
    res.status(204).send();
  }),
);
