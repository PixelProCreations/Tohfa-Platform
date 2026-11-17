/**
 * Customer-to-customer wallet transfers (BR-150). Wiring only.
 * Mounted by app.ts at /v1/wallets (customer) and /v1/admin/wallet-transfers (admin read).
 * lookup + send: `wallet.transfer.send` (CUSTOMER own); history: `wallet.own.view`;
 * admin list: `wallet.transfer.view` (SUPER_ADMIN / TOHFA_ADMIN all).
 * Kill switch: system_config `wallet_transfer.enabled` (ON since 0150), checked inside the service.
 */
import { Router, type RequestHandler } from 'express';
import type { Redis } from 'ioredis';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { pool } from '../../db/pool.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { AppError } from '../../http/problem.js';
import { getValidated, validate } from '../../http/validate.js';
import { logger } from '../../logger.js';
import { consumeBucket } from '../../rate-limit/rateLimiter.js';
import { redis } from '../../redis.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import { walletTransfersRepo, type LookupLimitsRaw } from './wallet-transfers.repo.js';
import {
  adminListTransfersQuery,
  createTransferBody,
  listTransfersQuery,
  transferLookupBody,
} from './wallet-transfers.schema.js';
import { walletTransfersService } from './wallet-transfers.service.js';

/** Used when system_config holds no usable value (0150 seeds 10 and 30). */
export const LOOKUP_DEFAULT_PER_CUSTOMER_PER_HOUR = 10;
export const LOOKUP_DEFAULT_PER_IP_PER_HOUR = 30;

function positiveInt(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isInteger(v) && v > 0 ? v : fallback;
}

/**
 * BR-150g: lookup confirms whether a mobile belongs to a customer, so it is throttled per customer
 * AND per client IP (sliding hour). Fails open on Redis/config trouble like the other limiters;
 * the per-transfer caps still bound what an abuser can do with a confirmed number.
 */
export function transferLookupRateLimit(deps: {
  client?: Pick<Redis, 'eval'>;
  getLimits?: () => Promise<LookupLimitsRaw>;
} = {}): RequestHandler {
  const client = deps.client ?? redis;
  const getLimits = deps.getLimits ?? (() => walletTransfersRepo.getLookupLimits(pool));
  return async (req, res, next) => {
    try {
      const raw = await getLimits();
      const buckets: { key: string; max: number }[] = [];
      const customerId = req.actor?.customerId ?? null;
      if (customerId !== null) {
        buckets.push({ key: `wallet-transfer-lookup:customer:${customerId}`, max: positiveInt(raw.perCustomerPerHour, LOOKUP_DEFAULT_PER_CUSTOMER_PER_HOUR) });
      }
      const ip = req.ip ?? '';
      if (ip.length > 0) {
        buckets.push({ key: `wallet-transfer-lookup:ip:${ip}`, max: positiveInt(raw.perIpPerHour, LOOKUP_DEFAULT_PER_IP_PER_HOUR) });
      }
      let retryAfterSeconds = 0;
      for (const b of buckets) {
        const r = await consumeBucket(client as Redis, b.key, { windowSeconds: 3600, max: b.max });
        if (!r.allowed) retryAfterSeconds = Math.max(retryAfterSeconds, r.retryAfterSeconds);
      }
      if (retryAfterSeconds > 0) {
        res.setHeader('Retry-After', String(retryAfterSeconds));
        next(new AppError('RATE_LIMITED', { detail: 'Too many lookups. Try again later.', meta: { retryAfterSeconds } }));
        return;
      }
    } catch (err) {
      logger.warn({ err }, 'wallet transfer lookup rate limiter unavailable; failing open');
    }
    next();
  };
}

export const walletTransfersRouter: Router = Router();
export const adminWalletTransfersRouter: Router = Router();

walletTransfersRouter.post(
  '/me/transfers/lookup',
  requireAuth,
  requirePermission('wallet.transfer.send'),
  transferLookupRateLimit(),
  validate({ body: transferLookupBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const { mobile } = getValidated(req, 'body', transferLookupBody);
    res.json(await walletTransfersService.lookup(actor, mobile));
  }),
);

walletTransfersRouter.post(
  '/me/transfers',
  requireAuth,
  requirePermission('wallet.transfer.send'),
  validate({ body: createTransferBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createTransferBody);
    res.status(201).json(await walletTransfersService.send(actor, scope, body, req.header('idempotency-key')));
  }),
);

walletTransfersRouter.get(
  '/me/transfers',
  requireAuth,
  requirePermission('wallet.own.view'),
  validate({ query: listTransfersQuery }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    res.json(await walletTransfersService.list(actor, getValidated(req, 'query', listTransfersQuery)));
  }),
);

adminWalletTransfersRouter.get(
  '/',
  requireAuth,
  requirePermission('wallet.transfer.view'),
  validate({ query: adminListTransfersQuery }),
  asyncHandler(async (req, res) => {
    res.json(await walletTransfersService.adminList(getValidated(req, 'query', adminListTransfersQuery)));
  }),
);
