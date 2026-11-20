import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { RoleCode, ScopeLevel } from '@tohfa/shared-types';
import type { Executor } from '../../db/pool.js';
import { errorHandler, notFoundHandler } from '../../http/errorHandler.js';
import { signAccessToken } from '../../auth/jwt.js';
import { aScope, newId } from '../../test/factories.js';
import type { ReviewItemRow, ReviewRow, ReviewsRepo } from './reviews.repo.js';
import { createAdminReviewsRouter, createOrderReviewsRouter, createProductReviewsRouter } from './reviews.routes.js';
import { createReviewsService, type ReviewsService } from './reviews.service.js';

const db = {} as Executor;
const CUSTOMER = newId();
const scope = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.CUSTOMER, customerId: CUSTOMER });
const ORDER = newId();
const LINE = newId();
const CROP = newId();

function build(status = 'DELIVERED', terms: string[] = []) {
  const reviews: ReviewRow[] = [];
  const items: ReviewItemRow[] = [];
  const repo: ReviewsRepo = {
    async findOwnOrder(_d, c, id) { return c === CUSTOMER && id === ORDER ? { id, status } : null; },
    async listOrderLines() { return [{ id: LINE }]; },
    async insertReview(_d, i) {
      const r: ReviewRow = { id: newId(), order_id: i.orderId, order_number: 'ORD-1', customer_id: i.customerId, rating: i.rating, tags: i.tags, comment: i.comment, created_at: new Date() };
      reviews.push(r);
      return r.id;
    },
    async insertReviewItems(_d, rid, list) {
      for (const l of list) items.push({ review_id: rid, order_item_id: l.orderItemId, crop_id: CROP, name: 'Carrot', grade: 'GRADE_1', rating: l.rating, comment: l.comment });
    },
    async findByOrder(_d, oid, c) { return reviews.find((r) => r.order_id === oid && r.customer_id === c) ?? null; },
    async findById(_d, id) { return reviews.find((r) => r.id === id) ?? null; },
    async listItems(_d, ids) { return items.filter((i) => ids.includes(i.review_id)); },
    async listAdmin() { return { rows: reviews, total: reviews.length }; },
    async productSummary() { return { count: 2, average: '4.5', distribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 } }; },
    async listProductReviews() { return [{ id: newId(), rating: 5, comment: 'great', created_at: new Date() }]; },
    async cropExists(_d, id) { return id === CROP; },
  };
  return createReviewsService({ repo, db, transaction: (fn) => fn(db), identityLookup: async () => ({ terms, personNames: [] }) });
}
const body = { rating: 5, tags: ['FRESHNESS' as const], comment: 'Lovely', items: [{ orderItemId: LINE, rating: 4 }] };

describe('order reviews: service', () => {
  it('creates a review for a delivered order; customer shape has no customer id / order number', async () => {
    const r = await build().createReview(scope, ORDER, body);
    expect(r).toMatchObject({ orderId: ORDER, rating: 5, tags: ['FRESHNESS'] });
    expect(r.items[0]).toMatchObject({ rating: 4, productId: CROP });
    expect(r).not.toHaveProperty('customerId');
    expect(r).not.toHaveProperty('orderNumber');
  });

  it('accepts PICKED_UP, refuses other statuses with 409 INVALID_STATE_TRANSITION', async () => {
    await expect(build('PICKED_UP').createReview(scope, ORDER, body)).resolves.toBeTruthy();
    await expect(build('CONFIRMED').createReview(scope, ORDER, body)).rejects.toMatchObject({ code: 'INVALID_STATE_TRANSITION', status: 409 });
  });

  it('one review per order: second is 409 CONFLICT', async () => {
    const s = build();
    await s.createReview(scope, ORDER, body);
    await expect(s.createReview(scope, ORDER, body)).rejects.toMatchObject({ code: 'CONFLICT', status: 409 });
  });

  it('BR-36: someone else\'s order is 404; reading it is 404', async () => {
    const stranger = aScope({ level: ScopeLevel.OWN, roleCode: RoleCode.CUSTOMER, customerId: newId() });
    const s = build();
    await expect(s.createReview(stranger, ORDER, body)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await s.createReview(scope, ORDER, body);
    await expect(s.getOrderReview(stranger, ORDER)).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect((await s.getOrderReview(scope, ORDER)).rating).toBe(5);
  });

  it('a rated line that is not on the order, or a repeated one, is 422', async () => {
    await expect(build().createReview(scope, ORDER, { ...body, items: [{ orderItemId: newId(), rating: 3 }] })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    await expect(build().createReview(scope, ORDER, { ...body, items: [{ orderItemId: LINE, rating: 3 }, { orderItemId: LINE, rating: 2 }] })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('BR-16: a comment naming a farm is refused 422', async () => {
    await expect(build('DELIVERED', ['Green Valley Farm']).createReview(scope, ORDER, { ...body, comment: 'Green Valley Farm rocks' })).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('product reviews: aggregate + anonymised list (no customer, order or farm keys)', async () => {
    const res = await build().getProductReviews(CROP, { page: 1, limit: 20 });
    expect(res.summary).toMatchObject({ averageRating: '4.5', ratingCount: 2 });
    expect(Object.keys(res.items[0]!).sort()).toEqual(['comment', 'createdAt', 'id', 'rating']);
    await expect(build().getProductReviews(newId(), { page: 1, limit: 20 })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
});

describe('reviews routes (real middleware, stub service)', () => {
  const stub = new Proxy({} as ReviewsService, { get: () => async () => ({ ok: true }) });
  const app = express();
  app.use(express.json());
  app.use('/v1/orders', createOrderReviewsRouter(stub));
  app.use('/v1/catalog', createProductReviewsRouter(stub));
  app.use('/v1/admin/reviews', createAdminReviewsRouter(stub));
  app.use(notFoundHandler);
  app.use(errorHandler);
  const tok = (code: RoleCode) => `Bearer ${signAccessToken({ sub: newId(), roles: [{ code }], farmerId: null, customerId: newId() } as never)}`;

  it('customer create/view own; admin view all; product reviews public', async () => {
    const c = tok(RoleCode.CUSTOMER);
    expect((await request(app).post(`/v1/orders/${ORDER}/review`).send(body)).status).toBe(401);
    expect((await request(app).post(`/v1/orders/${ORDER}/review`).set('Authorization', tok(RoleCode.SUPER_ADMIN)).send(body)).status).toBe(403);
    expect((await request(app).post(`/v1/orders/${ORDER}/review`).set('Authorization', c).send(body)).status).toBe(201);
    expect((await request(app).post(`/v1/orders/${ORDER}/review`).set('Authorization', c).send({ ...body, rating: 6 })).status).toBe(422);
    expect((await request(app).get(`/v1/orders/${ORDER}/review`).set('Authorization', c)).status).toBe(200);
    expect((await request(app).get(`/v1/catalog/products/${CROP}/reviews`)).status).toBe(200);
    expect((await request(app).get('/v1/admin/reviews').set('Authorization', c)).status).toBe(403);
    expect((await request(app).get('/v1/admin/reviews').set('Authorization', tok(RoleCode.SUPER_ADMIN))).status).toBe(200);
    expect((await request(app).get('/v1/admin/reviews').set('Authorization', tok(RoleCode.MAIN_WH_ADMIN))).status).toBe(403);
  });
});
