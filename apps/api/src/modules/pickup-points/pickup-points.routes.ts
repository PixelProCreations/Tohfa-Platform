/** Public pickup points (BR-170). Wiring only; no auth, like the catalog. Mounted at /v1/pickup-points. */
import { Router } from 'express';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { listPickupPointsQuery } from './pickup-points.schema.js';
import { pickupPointsService } from './pickup-points.service.js';

export const pickupPointsRouter: Router = Router();

pickupPointsRouter.get(
  '/',
  validate({ query: listPickupPointsQuery }),
  asyncHandler(async (req, res) => {
    res.json(await pickupPointsService.list(getValidated(req, 'query', listPickupPointsQuery)));
  }),
);
