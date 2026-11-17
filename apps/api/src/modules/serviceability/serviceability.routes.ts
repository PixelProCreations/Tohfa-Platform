/**
 * Serviceability and service-area requests (BR-171). Wiring only.
 * GET /v1/serviceability and POST /v1/service-area-requests are public (a signed-in customer's id is
 * recorded when a token is present). POST is rate limited per client IP. The admin read is gated by
 * `service_area.request.view`.
 */
import { Router, type RequestHandler } from 'express';
import { optionalAuth, requireAuth } from '../../auth/requireAuth.js';
import { pool } from '../../db/pool.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { AppError } from '../../http/problem.js';
import { getValidated, validate } from '../../http/validate.js';
import { logger } from '../../logger.js';
import { consumeBucket } from '../../rate-limit/rateLimiter.js';
import { redis } from '../../redis.js';
import { requirePermission } from '../../rbac/requirePermission.js';
import { serviceabilityRepo } from './serviceability.repo.js';
import { createAreaRequestBody, listAreaRequestsQuery, listMyAreaRequestsQuery, serviceabilityQuery } from './serviceability.schema.js';
import { serviceabilityService } from './serviceability.service.js';

export const serviceabilityRouter: Router = Router();
export const serviceAreaRequestsRouter: Router = Router();
export const adminServiceAreaRequestsRouter: Router = Router();

const RATE_KEY = 'serviceability.area_request_rate_per_hour';

/** Fails open on Redis or config trouble, like authRateLimit: a public form must not brick. */
const areaRequestRateLimit: RequestHandler = async (req, res, next) => {
  try {
    const max = Number(await serviceabilityRepo.getNumberConfig(pool, RATE_KEY));
    if (!Number.isFinite(max) || max <= 0) return next();
    const r = await consumeBucket(redis, `area-request:ip:${req.ip ?? ''}`, { windowSeconds: 3600, max });
    if (!r.allowed) {
      res.setHeader('Retry-After', String(r.retryAfterSeconds));
      return next(new AppError('RATE_LIMITED', { detail: 'Too many requests. Try again shortly.', meta: { retryAfterSeconds: r.retryAfterSeconds } }));
    }
  } catch (err) {
    logger.warn({ err }, 'area request rate limiter unavailable; failing open');
  }
  next();
};

serviceabilityRouter.get(
  '/',
  validate({ query: serviceabilityQuery }),
  asyncHandler(async (req, res) => {
    res.json(await serviceabilityService.check(getValidated(req, 'query', serviceabilityQuery)));
  }),
);

serviceAreaRequestsRouter.post(
  '/',
  optionalAuth,
  areaRequestRateLimit,
  validate({ body: createAreaRequestBody }),
  asyncHandler(async (req, res) => {
    const { request, created } = await serviceabilityService.createRequest(
      getValidated(req, 'body', createAreaRequestBody),
      { customerId: req.actor?.customerId ?? null, ip: req.ip ?? null },
    );
    res.status(created ? 201 : 200).json(request);
  }),
);

serviceAreaRequestsRouter.get(
  '/me',
  requireAuth,
  requirePermission('service_area.request.view_own'),
  validate({ query: listMyAreaRequestsQuery }),
  asyncHandler(async (req, res) => {
    res.json(await serviceabilityService.listMine(req.scope?.customerId, getValidated(req, 'query', listMyAreaRequestsQuery)));
  }),
);

adminServiceAreaRequestsRouter.get(
  '/',
  requireAuth,
  requirePermission('service_area.request.view'),
  validate({ query: listAreaRequestsQuery }),
  asyncHandler(async (req, res) => {
    res.json(await serviceabilityService.listRequests(getValidated(req, 'query', listAreaRequestsQuery)));
  }),
);
