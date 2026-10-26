import { Router } from 'express';
import { requireActor, requireAuth } from '../../auth/requireAuth.js';
import { asyncHandler } from '../../http/asyncHandler.js';
import { getValidated, validate } from '../../http/validate.js';
import { requirePermission, requireScope } from '../../rbac/requirePermission.js';
import {
  createGoodsReceiptBody,
  goodsReceiptDiscrepancyCreateBody,
  goodsReceiptIdParams,
  listGoodsReceiptDiscrepanciesQuery,
  listGoodsReceiptsQuery,
  qualityCheckCreateBody,
  qualityCounterOfferBody,
} from './goods-receipts.schema.js';
import { goodsReceiptsService } from './goods-receipts.service.js';

export const goodsReceiptsRouter: Router = Router();

// POST /v1/admin/goods-receipts — warehouse intake
goodsReceiptsRouter.post(
  '/',
  requireAuth,
  requirePermission('inventory.goods_receipt.record'),
  validate({ body: createGoodsReceiptBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const body = getValidated(req, 'body', createGoodsReceiptBody);

    const result = await goodsReceiptsService.createGoodsReceipt(actor, scope, body, req.header('idempotency-key'));
    res.status(201).json(result);
  }),
);

// POST /v1/admin/goods-receipts/:id/quality-check — record 5-point quality check
goodsReceiptsRouter.post(
  '/:id/quality-check',
  requireAuth,
  requirePermission('inventory.quality_check.perform'),
  validate({ params: goodsReceiptIdParams, body: qualityCheckCreateBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', goodsReceiptIdParams);
    const body = getValidated(req, 'body', qualityCheckCreateBody);

    const result = await goodsReceiptsService.recordQualityCheck(actor, scope, id, body, req.header('idempotency-key'));
    res.status(201).json(result);
  }),
);

// POST /v1/admin/goods-receipts/:id/counter-offer — send quality counter-offer
goodsReceiptsRouter.post(
  '/:id/counter-offer',
  requireAuth,
  requirePermission('inventory.quality.counter_offer'),
  validate({ params: goodsReceiptIdParams, body: qualityCounterOfferBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', goodsReceiptIdParams);
    const body = getValidated(req, 'body', qualityCounterOfferBody);

    const result = await goodsReceiptsService.createQualityCounterOffer(actor, scope, id, body, req.header('idempotency-key'));
    res.status(201).json(result);
  }),
);

// POST /v1/admin/goods-receipts/:id/discrepancies — report damage or a mismatch (BR-121).
// inventory.quality_check.perform: reporting what is wrong with delivered goods is part of inspecting them.
goodsReceiptsRouter.post(
  '/:id/discrepancies',
  requireAuth,
  requirePermission('inventory.quality_check.perform'),
  validate({ params: goodsReceiptIdParams, body: goodsReceiptDiscrepancyCreateBody }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', goodsReceiptIdParams);
    const body = getValidated(req, 'body', goodsReceiptDiscrepancyCreateBody);

    const result = await goodsReceiptsService.createDiscrepancy(actor, scope, id, body, req.header('idempotency-key'));
    res.status(201).json(result);
  }),
);

// GET /v1/admin/goods-receipts/:id/discrepancies — the receipt's reports, newest first (BR-121).
// inventory.goods_receipt.record: the code every other goods-receipt read uses.
goodsReceiptsRouter.get(
  '/:id/discrepancies',
  requireAuth,
  requirePermission('inventory.goods_receipt.record'),
  validate({ params: goodsReceiptIdParams, query: listGoodsReceiptDiscrepanciesQuery }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', goodsReceiptIdParams);
    const query = getValidated(req, 'query', listGoodsReceiptDiscrepanciesQuery);

    const result = await goodsReceiptsService.listDiscrepancies(actor, scope, id, query);
    res.json(result);
  }),
);

// GET /v1/admin/goods-receipts — list goods receipts with warehouse scoping
goodsReceiptsRouter.get(
  '/',
  requireAuth,
  requirePermission('inventory.goods_receipt.record'),
  validate({ query: listGoodsReceiptsQuery }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const query = getValidated(req, 'query', listGoodsReceiptsQuery);

    const result = await goodsReceiptsService.list(actor, scope, query);
    res.json(result);
  }),
);

// GET /v1/admin/goods-receipts/:id — get goods receipt detail
goodsReceiptsRouter.get(
  '/:id',
  requireAuth,
  requirePermission('inventory.goods_receipt.record'),
  validate({ params: goodsReceiptIdParams }),
  asyncHandler(async (req, res) => {
    const actor = requireActor(req.actor);
    const scope = requireScope(req.scope);
    const { id } = getValidated(req, 'params', goodsReceiptIdParams);

    const result = await goodsReceiptsService.getById(actor, scope, id);
    res.json(result);
  }),
);
