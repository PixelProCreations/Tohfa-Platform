import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import {
  createDeliveryPartnerSchema,
  deliveryPartnerIdParamSchema,
  listDeliveryPartnersQuerySchema,
  updateDeliveryPartnerSchema,
} from './delivery-partners.schema.js';
import { deliveryPartnersService } from './delivery-partners.service.js';

export const adminDeliveryPartnersRouter: Router = Router();

adminDeliveryPartnersRouter.use(requireAuth);
adminDeliveryPartnersRouter.use(requirePermission('delivery.partner.manage'));

adminDeliveryPartnersRouter.get(
  '/',
  validate({ query: listDeliveryPartnersQuerySchema }),
  asyncHandler(async (req, res) => {
    const query = getValidated(req, 'query', listDeliveryPartnersQuerySchema);
    const items = await deliveryPartnersService.list(query.status ?? 'active');
    res.status(200).json(items);
  }),
);

adminDeliveryPartnersRouter.get(
  '/:id',
  validate({ params: deliveryPartnerIdParamSchema }),
  asyncHandler(async (req, res) => {
    const params = getValidated(req, 'params', deliveryPartnerIdParamSchema);
    const item = await deliveryPartnersService.getById(params.id);
    res.status(200).json(item);
  }),
);

adminDeliveryPartnersRouter.post(
  '/',
  validate({ body: createDeliveryPartnerSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const body = getValidated(req, 'body', createDeliveryPartnerSchema);
    const item = await deliveryPartnersService.create(actor, body);
    res.status(201).json(item);
  }),
);

adminDeliveryPartnersRouter.patch(
  '/:id',
  validate({ params: deliveryPartnerIdParamSchema, body: updateDeliveryPartnerSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const params = getValidated(req, 'params', deliveryPartnerIdParamSchema);
    const body = getValidated(req, 'body', updateDeliveryPartnerSchema);
    const item = await deliveryPartnersService.update(actor, params.id, body);
    res.status(200).json(item);
  }),
);

adminDeliveryPartnersRouter.delete(
  '/:id',
  validate({ params: deliveryPartnerIdParamSchema }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const params = getValidated(req, 'params', deliveryPartnerIdParamSchema);
    await deliveryPartnersService.softDelete(actor, params.id);
    res.status(204).send();
  }),
);
