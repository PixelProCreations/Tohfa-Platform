import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { createInputBody, inputIdParams, listInputsQuery, updateInputBody } from './inputs.schema.js';
import { inputsService } from './inputs.service.js';

export const adminInputsRouter: Router = Router();
export const inputsRouter: Router = Router();

// Admin routes (/v1/admin/inputs)
adminInputsRouter.get(
  '/',
  requireAuth,
  requirePermission('inputs.catalog.view'),
  validate({ query: listInputsQuery }),
  asyncHandler(async (req, res) => {
    const query = getValidated(req, 'query', listInputsQuery);
    res.json(await inputsService.listAdmin(query));
  }),
);

adminInputsRouter.get(
  '/:id',
  requireAuth,
  requirePermission('inputs.catalog.view'),
  validate({ params: inputIdParams }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', inputIdParams);
    res.json(await inputsService.getAdmin(id));
  }),
);

adminInputsRouter.post(
  '/',
  requireAuth,
  requirePermission('inputs.catalog.manage'),
  validate({ body: createInputBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createInputBody);
    res.status(201).json(await inputsService.create(scope, body));
  }),
);

adminInputsRouter.patch(
  '/:id',
  requireAuth,
  requirePermission('inputs.catalog.manage'),
  validate({ params: inputIdParams, body: updateInputBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', inputIdParams);
    const body = getValidated(req, 'body', updateInputBody);
    res.json(await inputsService.update(scope, id, body));
  }),
);

adminInputsRouter.delete(
  '/:id',
  requireAuth,
  requirePermission('inputs.catalog.manage'),
  validate({ params: inputIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', inputIdParams);
    await inputsService.remove(scope, id);
    res.status(204).end();
  }),
);

// Farmer / app read routes (/v1/inputs — APPROVED only, stripped metadata per BR-16)
inputsRouter.get(
  '/',
  requireAuth,
  requirePermission('inputs.catalog.view'),
  validate({ query: listInputsQuery }),
  asyncHandler(async (req, res) => {
    const query = getValidated(req, 'query', listInputsQuery);
    res.json(await inputsService.listPublic(query));
  }),
);

inputsRouter.get(
  '/:id',
  requireAuth,
  requirePermission('inputs.catalog.view'),
  validate({ params: inputIdParams }),
  asyncHandler(async (req, res) => {
    const { id } = getValidated(req, 'params', inputIdParams);
    res.json(await inputsService.getPublic(id));
  }),
);
