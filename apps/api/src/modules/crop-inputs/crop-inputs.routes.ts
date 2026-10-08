import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  createCropInputBody,
  cropInputIdParams,
  farmCropIdParams,
  listCropInputsQuery,
  updateCropInputBody,
} from './crop-inputs.schema.js';
import { cropInputsService } from './crop-inputs.service.js';

export const cropInputsRouter: Router = Router();

// GET /v1/farmers/me/crops/:farmCropId/inputs
cropInputsRouter.get(
  '/crops/:farmCropId/inputs',
  requireAuth,
  requirePermission('farmer.crop_input.manage_own'),
  validate({ params: farmCropIdParams, query: listCropInputsQuery }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmCropId } = getValidated(req, 'params', farmCropIdParams);
    const query = getValidated(req, 'query', listCropInputsQuery);
    res.json(await cropInputsService.listCropInputs(scope, farmCropId, query));
  }),
);

// POST /v1/farmers/me/crops/:farmCropId/inputs
cropInputsRouter.post(
  '/crops/:farmCropId/inputs',
  requireAuth,
  requirePermission('farmer.crop_input.manage_own'),
  validate({ params: farmCropIdParams, body: createCropInputBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmCropId } = getValidated(req, 'params', farmCropIdParams);
    const body = getValidated(req, 'body', createCropInputBody);
    res.status(201).json(await cropInputsService.createCropInput(scope, farmCropId, body));
  }),
);

// GET /v1/farmers/me/crops/:farmCropId/npk-contribution
cropInputsRouter.get(
  '/crops/:farmCropId/npk-contribution',
  requireAuth,
  requirePermission('farmer.crop_input.manage_own'),
  validate({ params: farmCropIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmCropId } = getValidated(req, 'params', farmCropIdParams);
    res.json(await cropInputsService.getNpkContribution(scope, farmCropId));
  }),
);

// GET /v1/farmers/me/crops/:farmCropId/inputs/:id
cropInputsRouter.get(
  '/crops/:farmCropId/inputs/:id',
  requireAuth,
  requirePermission('farmer.crop_input.manage_own'),
  validate({ params: cropInputIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmCropId, id } = getValidated(req, 'params', cropInputIdParams);
    res.json(await cropInputsService.getCropInput(scope, farmCropId, id));
  }),
);

// PATCH /v1/farmers/me/crops/:farmCropId/inputs/:id
cropInputsRouter.patch(
  '/crops/:farmCropId/inputs/:id',
  requireAuth,
  requirePermission('farmer.crop_input.manage_own'),
  validate({ params: cropInputIdParams, body: updateCropInputBody }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmCropId, id } = getValidated(req, 'params', cropInputIdParams);
    const body = getValidated(req, 'body', updateCropInputBody);
    res.json(await cropInputsService.updateCropInput(scope, farmCropId, id, body));
  }),
);

// DELETE /v1/farmers/me/crops/:farmCropId/inputs/:id
cropInputsRouter.delete(
  '/crops/:farmCropId/inputs/:id',
  requireAuth,
  requirePermission('farmer.crop_input.manage_own'),
  validate({ params: cropInputIdParams }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const { farmCropId, id } = getValidated(req, 'params', cropInputIdParams);
    await cropInputsService.deleteCropInput(scope, farmCropId, id);
    res.status(204).end();
  }),
);
