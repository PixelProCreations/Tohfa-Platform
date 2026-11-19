import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  createPaymentMethodSchema,
  listPaymentMethodsQuerySchema,
  paymentMethodIdParamSchema,
  updatePaymentMethodSchema,
} from './payment-methods.schema.js';
import { paymentMethodsService } from './payment-methods.service.js';

export const adminPaymentMethodsRouter: Router = Router();

adminPaymentMethodsRouter.use(requireAuth);
adminPaymentMethodsRouter.use(requirePermission('payment.method.configure'));

adminPaymentMethodsRouter.get(
  '/',
  validate({ query: listPaymentMethodsQuerySchema }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listPaymentMethodsQuerySchema);
    const items = await paymentMethodsService.list(scope, query);
    res.status(200).json(items);
  }),
);

adminPaymentMethodsRouter.get(
  '/:id',
  validate({ params: paymentMethodIdParamSchema }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const params = getValidated(req, 'params', paymentMethodIdParamSchema);
    const item = await paymentMethodsService.getById(scope, params.id);
    res.status(200).json(item);
  }),
);

adminPaymentMethodsRouter.post(
  '/',
  validate({ body: createPaymentMethodSchema }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createPaymentMethodSchema);
    const item = await paymentMethodsService.create(scope, body);
    res.status(201).json(item);
  }),
);

adminPaymentMethodsRouter.put(
  '/:id',
  validate({ params: paymentMethodIdParamSchema, body: updatePaymentMethodSchema }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const params = getValidated(req, 'params', paymentMethodIdParamSchema);
    const body = getValidated(req, 'body', updatePaymentMethodSchema);
    const item = await paymentMethodsService.update(scope, params.id, body);
    res.status(200).json(item);
  }),
);

adminPaymentMethodsRouter.patch(
  '/:id',
  validate({ params: paymentMethodIdParamSchema, body: updatePaymentMethodSchema }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const params = getValidated(req, 'params', paymentMethodIdParamSchema);
    const body = getValidated(req, 'body', updatePaymentMethodSchema);
    const item = await paymentMethodsService.update(scope, params.id, body);
    res.status(200).json(item);
  }),
);

adminPaymentMethodsRouter.delete(
  '/:id',
  validate({ params: paymentMethodIdParamSchema }),
  asyncHandler(async (req, res) => {
    const scope = requireScope(req.scope);
    const params = getValidated(req, 'params', paymentMethodIdParamSchema);
    const item = await paymentMethodsService.deactivate(scope, params.id);
    res.status(200).json(item);
  }),
);
