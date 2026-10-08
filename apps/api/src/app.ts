/**
 * Express application assembly.
 *
 * Order matters and is deliberate:
 *   1. helmet          security headers before anything can respond
 *   2. correlationId   so every later log line and problem carries a traceId
 *   3. cors            preflight must be answered before body parsing
 *   4. json/urlencoded bounded body size
 *   5. routes
 *   6. notFoundHandler turns an unmatched path into a NOT_FOUND AppError
 *   7. errorHandler    the single place that writes problem+json
 *
 * `createApp()` returns the app WITHOUT listening, so tests can drive it with
 * supertest and `server.ts` owns the socket.
 */
import cors from 'cors';
import express, { type Express, type RequestHandler, type Router } from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import { errorHandler, notFoundHandler } from './http/errorHandler.js';
import { logger, newTraceId, runWithContext } from './logger.js';
import { healthRouter } from './modules/health/health.routes.js';
import { warehousesRouter } from './modules/_example/warehouses.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { listingsRouter } from './modules/listings/listings.routes.js';
import { uploadsRouter } from './modules/uploads/uploads.routes.js';
import { adminFarmerApplicationsRouter, farmerApplicationsRouter } from './modules/farmer-applications/farmer-applications.routes.js';
import {
  certificationsAdminRouter,
  certificationsFarmerRouter,
  configFarmerRouter,
} from './modules/certifications/certifications.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';
import { notificationPreferencesRouter } from './modules/notification-preferences/notification-preferences.routes.js';
import { fairPricesRouter, retailPricesRouter } from './modules/pricing/pricing.routes.js';
import {
  adminListingsRouter,
  farmerCounterOffersRouter,
} from './modules/listings/counter-offers.routes.js';
import { purchaseOrdersRouter } from './modules/purchase-orders/purchase-orders.routes.js';
import { goodsReceiptsRouter } from './modules/goods-receipts/goods-receipts.routes.js';
import {
  adminAllocationsRouter,
  adminAllocationConfigRouter,
} from './modules/allocations/allocations.routes.js';
import {
  adminBatchesRouter,
  adminStockLedgerRouter,
} from './modules/inventory/inventory.routes.js';
import { catalogRouter } from './modules/catalog/catalog.routes.js';
import { walletsRouter } from './modules/wallet/wallet.routes.js';
import {
  adminTopupRouter,
  topupRouter,
  webhookRouter,
} from './modules/topup/topup.routes.js';
import { cartRouter } from './modules/cart/cart.routes.js';
import { ordersRouter } from './modules/orders/orders.routes.js';
import {
  adminFulfilmentRouter,
  orderTrackingRouter,
} from './modules/orders/fulfilment.routes.js';
import {
  payoutDuesRouter,
  payoutsRouter,
} from './modules/payouts/payouts.routes.js';
import { invoicesRouter } from './modules/invoices/invoices.routes.js';
import { adminFarmRatingsRouter, farmRatingsFarmerRouter } from './modules/farm-ratings/farm-ratings.routes.js';
import { adminAuditsRouter, farmerAuditsRouter } from './modules/audits/audits.routes.js';
import { weatherFarmerRouter } from './modules/weather/weather.routes.js';
import { farmDiaryRouter } from './modules/farm-diary/farm-diary.routes.js';
import { adminDiaryTaxonomyRouter } from './modules/farm-diary/farm-diary.admin.routes.js';
import { farmsRouter } from './modules/farms/farms.routes.js';
import { cropsRouter } from './modules/crops/crops.routes.js';
import { adminCropMasterRouter } from './modules/crops/crops.admin.routes.js';
import { livestockRouter } from './modules/livestock/livestock.routes.js';
import { livestockAdminRouter } from './modules/livestock/livestock.admin.routes.js';
import { farmAssetsRouter } from './modules/farm-assets/farm-assets.routes.js';
import { adminFarmAssetsRouter } from './modules/farm-assets/farm-assets.admin.routes.js';
import { farmerDocumentsRouter } from './modules/farmer-documents/farmer-documents.routes.js';
import { soilRouter } from './modules/soil/soil.routes.js';
import { pestLibraryRouter, pestRouter, weatherRiskNotesRouter } from './modules/pest/pest.routes.js';
import { workforceRouter } from './modules/workforce/workforce.routes.js';
import {
  farmerBankAccountsRouter,
  farmerUpiRouter,
} from './modules/farmer-bank-accounts/farmer-bank-accounts.routes.js';
import { treePlantingsRouter } from './modules/tree-plantings/tree-plantings.routes.js';
import { cropInputsRouter } from './modules/crop-inputs/crop-inputs.routes.js';
import { cropMilestonesRouter } from './modules/crop-milestones/crop-milestones.routes.js';

export const CORRELATION_HEADER = 'x-correlation-id';

/**
 * Every router the API exposes, with the path prefix it is mounted under.
 *
 * This is the single source of truth BOTH for `createApp()` (traffic) and for
 * the S-20 contract test (`apps/api/src/contract/contract.test.ts`), which
 * enumerates these routers to prove the live surface matches docs/openapi.yaml.
 */
export const API_MOUNTS: ReadonlyArray<{
  prefix: string;
  router: Router;
}> = [
  { prefix: '/v1/warehouses', router: warehousesRouter },
  { prefix: '/v1/auth', router: authRouter },
  { prefix: '/v1/uploads', router: uploadsRouter },
  { prefix: '/v1/farmers', router: farmerApplicationsRouter },
  { prefix: '/v1/farmers/me/certifications', router: certificationsFarmerRouter },
  { prefix: '/v1/farmers/me/bank-accounts', router: farmerBankAccountsRouter },
  { prefix: '/v1/farmers/me/upi', router: farmerUpiRouter },
  { prefix: '/v1/config', router: configFarmerRouter },
  { prefix: '/v1/admin/farmer-applications', router: adminFarmerApplicationsRouter },
  { prefix: '/v1/admin/certifications', router: certificationsAdminRouter },
  { prefix: '/v1/notifications', router: notificationsRouter },
  { prefix: '/v1/notification-preferences', router: notificationPreferencesRouter },
  { prefix: '/v1/fair-prices', router: fairPricesRouter },
  { prefix: '/v1/retail-prices', router: retailPricesRouter },
  { prefix: '/v1/listings', router: listingsRouter },
  { prefix: '/v1/listings', router: farmerCounterOffersRouter },
  { prefix: '/v1/admin/listings', router: adminListingsRouter },
  { prefix: '/v1/admin/purchase-orders', router: purchaseOrdersRouter },
  { prefix: '/v1/admin/goods-receipts', router: goodsReceiptsRouter },
  { prefix: '/v1/admin/batches', router: adminBatchesRouter },
  { prefix: '/v1/admin/stock-ledger', router: adminStockLedgerRouter },
  { prefix: '/v1/admin/allocations', router: adminAllocationsRouter },
  { prefix: '/v1/admin/allocation-config', router: adminAllocationConfigRouter },
  { prefix: '/v1/admin', router: adminTopupRouter },
  { prefix: '/v1/admin/orders', router: adminFulfilmentRouter },
  { prefix: '/v1/catalog', router: catalogRouter },
  { prefix: '/v1/wallets', router: walletsRouter },
  { prefix: '/v1/wallets', router: topupRouter },
  { prefix: '/v1/webhooks', router: webhookRouter },
  { prefix: '/v1/cart', router: cartRouter },
  { prefix: '/v1/orders', router: ordersRouter },
  { prefix: '/v1/orders', router: orderTrackingRouter },
  { prefix: '/v1/admin/payout-dues', router: payoutDuesRouter },
  { prefix: '/v1/admin/payouts', router: payoutsRouter },
  { prefix: '/v1/invoices', router: invoicesRouter },
  { prefix: '/v1/farmers/me/documents', router: farmerDocumentsRouter },
  { prefix: '/v1/farmers/me/rating', router: farmRatingsFarmerRouter },
  { prefix: '/v1/admin/farmers', router: adminFarmRatingsRouter },
  { prefix: '/v1/admin/audits', router: adminAuditsRouter },
  { prefix: '/v1/farmers/me/audits', router: farmerAuditsRouter },
  { prefix: '/v1/farmers/me/weather', router: weatherFarmerRouter },
  { prefix: '/v1/farmers/me/diary', router: farmDiaryRouter },
  { prefix: '/v1/admin/diary', router: adminDiaryTaxonomyRouter },
  { prefix: '/v1/farms', router: farmsRouter },
  { prefix: '/v1/farmers/me', router: cropsRouter },
  { prefix: '/v1/admin/crop-master', router: adminCropMasterRouter },
  { prefix: '/v1/farmers/me', router: farmAssetsRouter },
  { prefix: '/v1/admin/farmers', router: adminFarmAssetsRouter },
  { prefix: '/v1/farmers/me/livestock', router: livestockRouter },
  { prefix: '/v1/admin/farmers', router: livestockAdminRouter },
  { prefix: '/v1/farms', router: soilRouter },
  { prefix: '/v1/farms', router: pestRouter },
  { prefix: '/v1/farms', router: workforceRouter },
  { prefix: '/v1/pest-library', router: pestLibraryRouter },
  { prefix: '/v1/weather-risk-notes', router: weatherRiskNotesRouter },
  { prefix: '/v1/farmers/me', router: treePlantingsRouter },
  { prefix: '/v1/farmers/me', router: cropInputsRouter },
  { prefix: '/v1/farmers/me', router: cropMilestonesRouter },
];

/**
 * Establishes the async-local logging context for the request. A client-supplied
 * correlation id is honoured (so a mobile crash report can be tied to server
 * logs) but length-capped so it cannot be used to bloat every log line.
 */
const correlationId: RequestHandler = (req, res, next) => {
  const incoming = req.header(CORRELATION_HEADER);
  const traceId =
    incoming !== undefined && incoming.length > 0 && incoming.length <= 128
      ? incoming
      : newTraceId();

  req.traceId = traceId;
  res.setHeader(CORRELATION_HEADER, traceId);
  runWithContext({ traceId }, () => {
    next();
  });
};

/** One line per completed request, at the level the status deserves. */
const requestLog: RequestHandler = (req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    const payload = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms: Date.now() - startedAt,
    };
    if (res.statusCode >= 500) logger.error(payload, 'request');
    else logger.info(payload, 'request');
  });
  next();
};

export function createApp(): Express {
  const app = express();

  // Behind Azure App Gateway / nginx: trust one proxy hop so req.ip is real.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(correlationId);
  app.use(requestLog);
  app.use(
    cors({
      origin: config.CORS_ORIGINS,
      credentials: true,
      exposedHeaders: [CORRELATION_HEADER],
    }),
  );
  // Webhook raw body parser MUST mount before global express.json() for exact HMAC verification
  app.use('/v1/webhooks/razorpay', express.raw({ type: 'application/json' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // Probes are unversioned: orchestrators should not care about the API version.
  app.use(healthRouter);

  // Every business router, mounted from the same table the contract test reads.
  for (const { prefix, router } of API_MOUNTS) {
    app.use(prefix, router);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
