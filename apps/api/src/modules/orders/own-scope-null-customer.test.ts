/**
 * BR-36 / BR-187: an `own`-scoped read whose principal has no resolvable customer_id (e.g. a
 * SUPER_ADMIN, which holds order.view_own at `own` but whose own-dimension is customer_id) narrows
 * to NOTHING: 404 / 403 / an empty list, never another customer's data. Staff read orders through
 * /v1/admin/orders with order.list.view_all, which is unchanged.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../app.js';
import { signAccessToken } from '../../auth/jwt.js';
import { pool } from '../../db/pool.js';
import { aScope, databaseReady, describeIfDatabase, newId } from '../../test/factories.js';
import type { Actor } from '../../auth/requireAuth.js';
import { createOrdersService } from './orders.service.js';
import type { OrdersRepo } from './orders.repo.js';
import { createFulfilmentService } from './fulfilment.service.js';
import type { FulfilmentRepo } from './fulfilment.repo.js';
import { createReviewsService } from '../reviews/reviews.service.js';
import type { ReviewsRepo } from '../reviews/reviews.repo.js';

const admin: Actor = { userId: newId(), roles: [{ code: 'SUPER_ADMIN' }], farmerId: null, customerId: null };

/** A repo whose every method fails the test: the service must refuse before any read. */
function untouchable<T>(): T {
  return new Proxy({}, {
    get: (_t, prop) => () => {
      throw new Error(`repo.${String(prop)} must not be called for a principal without a customer id`);
    },
  }) as T;
}

describe('BR-187 unit: no customer id -> nothing, and the repo is never asked', () => {
  it('ordersService.getOrder -> 404 without touching the repo', async () => {
    const svc = createOrdersService({ repo: untouchable<OrdersRepo>(), db: {} as never, events: { publish: vi.fn() } as never });
    await expect(svc.getOrder(admin, aScope(), newId())).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  });

  it('ordersService.listOrders -> 403 without touching the repo', async () => {
    const svc = createOrdersService({ repo: untouchable<OrdersRepo>(), db: {} as never, events: { publish: vi.fn() } as never });
    await expect(svc.listOrders(admin, aScope(), { limit: 20 } as never)).rejects.toMatchObject({ status: 403 });
  });

  it('fulfilmentService.getOrderTracking -> 404 without touching the repo', async () => {
    const svc = createFulfilmentService({ repo: untouchable<FulfilmentRepo>(), db: {} as never });
    await expect(svc.getOrderTracking(admin, aScope(), newId())).rejects.toMatchObject({ code: 'NOT_FOUND', status: 404 });
  });

  it('reviewsService.getOrderReview -> 403 without touching the repo', async () => {
    const svc = createReviewsService({ repo: untouchable<ReviewsRepo>(), db: {} as never });
    await expect(svc.getOrderReview(aScope(), newId())).rejects.toMatchObject({ status: 403 });
  });
});

describeIfDatabase('BR-187 HTTP: SUPER_ADMIN (no customerId) never reads a customer-own resource', () => {
  let ready = false;
  const app = createApp();
  const rand = Math.floor(100000 + Math.random() * 900000);
  const ids = {
    warehouse: newId(),
    cust1User: newId(),
    cust1: newId(),
    cust2User: newId(),
    cust2: newId(),
    adminUser: newId(),
    order2: newId(),
    address2: newId(),
  };
  const orderNumber2 = `ORD-NULLC-${rand}`;
  const secretComment = `review-secret-${rand}`;
  let tokenAdmin = '';
  let token1 = '';
  let token2 = '';

  beforeAll(async () => {
    ready = await databaseReady('order_reviews');
    if (!ready) return;
    await pool.query(
      `INSERT INTO warehouses (id, code, name, type, address, city, pincode)
       VALUES ($1, $2, 'Null-customer WH', 'MAIN', '1 Test Rd', 'Ooty', '643001')`,
      [ids.warehouse, `WH-NC-${rand}`],
    );
    await pool.query(
      `INSERT INTO users (id, mobile, full_name, user_type, status) VALUES
         ($1, $4, 'NC Customer One', 'CUSTOMER', 'ACTIVE'),
         ($2, $5, 'NC Customer Two', 'CUSTOMER', 'ACTIVE'),
         ($3, $6, 'NC Admin', 'ADMIN', 'ACTIVE')`,
      [ids.cust1User, ids.cust2User, ids.adminUser, `+919711${rand}`, `+919722${rand}`, `+919733${rand}`],
    );
    await pool.query(
      `INSERT INTO customers (id, user_id, customer_code) VALUES ($1, $2, $3), ($4, $5, $6)`,
      [ids.cust1, ids.cust1User, `CUST-NC1-${rand}`, ids.cust2, ids.cust2User, `CUST-NC2-${rand}`],
    );
    await pool.query(
      `INSERT INTO customer_addresses (id, customer_id, label, line1, city, pincode, is_default)
       VALUES ($1, $2, 'HOME', '7 Secret Lane', 'Ooty', '643004', true)`,
      [ids.address2, ids.cust2],
    );
    await pool.query(
      `INSERT INTO orders (id, order_number, customer_id, warehouse_id) VALUES ($1, $2, $3, $4)`,
      [ids.order2, orderNumber2, ids.cust2, ids.warehouse],
    );
    await pool.query(
      `INSERT INTO order_reviews (order_id, customer_id, rating, comment) VALUES ($1, $2, 5, $3)`,
      [ids.order2, ids.cust2, secretComment],
    );
    tokenAdmin = signAccessToken({ sub: ids.adminUser, roles: [{ code: 'SUPER_ADMIN' }], farmerId: null, customerId: null });
    token1 = signAccessToken({ sub: ids.cust1User, roles: [{ code: 'CUSTOMER' }], farmerId: null, customerId: ids.cust1 });
    token2 = signAccessToken({ sub: ids.cust2User, roles: [{ code: 'CUSTOMER' }], farmerId: null, customerId: ids.cust2 });
  });

  /**
   * Nothing of customer 2's may appear in any response body. The order and address ids are the
   * caller's own request input (a 404 detail may echo them), so the check is on data the caller
   * did not send: the order number, the review text, the address line and the owner's id.
   */
  const leaks = (body: unknown): boolean => {
    const text = JSON.stringify(body ?? {});
    return [orderNumber2, secretComment, '7 Secret Lane', ids.cust2].some((s) => text.includes(s));
  };

  const customerOwnReads = (): string[] => [
    `/v1/orders/${ids.order2}`,
    `/v1/orders/${ids.order2}/tracking`,
    `/v1/orders/${ids.order2}/events`,
    `/v1/orders/${ids.order2}/review`,
    '/v1/orders',
    '/v1/cart',
    '/v1/wishlist',
    '/v1/support/tickets',
    '/v1/customers/me',
    '/v1/customers/me/addresses',
    `/v1/customers/me/addresses/${ids.address2}`,
    '/v1/returns/me',
    '/v1/wallets/me',
    '/v1/wallets/me/transfers',
    '/v1/catalog/search/recent',
    '/v1/invoices',
  ];

  it('every customer-own read: 403/404 or an empty list, never data', async () => {
    if (!ready) return;
    for (const path of customerOwnReads()) {
      const res = await request(app).get(path).set('Authorization', `Bearer ${tokenAdmin}`);
      expect([200, 403, 404], `${path} -> ${res.status}`).toContain(res.status);
      if (res.status === 200) {
        const items = (res.body as { items?: unknown[] }).items;
        expect(Array.isArray(items) ? items.length : 0, `${path} returned rows`).toBe(0);
      }
      expect(leaks(res.body), `${path} leaked customer 2 data`).toBe(false);
    }
    // The headline hole: order detail, tracking and events are a hard 404.
    for (const suffix of ['', '/tracking', '/events']) {
      const res = await request(app).get(`/v1/orders/${ids.order2}${suffix}`).set('Authorization', `Bearer ${tokenAdmin}`);
      expect(res.status).toBe(404);
    }
  });

  it('the owner still reads their own order, tracking and review; another customer gets 404', async () => {
    if (!ready) return;
    const own = await request(app).get(`/v1/orders/${ids.order2}`).set('Authorization', `Bearer ${token2}`);
    expect(own.status).toBe(200);
    expect(own.body.id).toBe(ids.order2);
    const tracking = await request(app).get(`/v1/orders/${ids.order2}/tracking`).set('Authorization', `Bearer ${token2}`);
    expect(tracking.status).toBe(200);
    const review = await request(app).get(`/v1/orders/${ids.order2}/review`).set('Authorization', `Bearer ${token2}`);
    expect(review.status).toBe(200);
    expect(review.body.comment).toBe(secretComment);

    for (const suffix of ['', '/tracking', '/events', '/review']) {
      const res = await request(app).get(`/v1/orders/${ids.order2}${suffix}`).set('Authorization', `Bearer ${token1}`);
      expect(res.status, `cross-customer ${suffix}`).toBe(404);
      expect(leaks(res.body)).toBe(false);
    }
  });

  it('staff behaviour unchanged: SUPER_ADMIN still reads the order on the admin route', async () => {
    if (!ready) return;
    const res = await request(app).get(`/v1/admin/orders/${ids.order2}`).set('Authorization', `Bearer ${tokenAdmin}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(ids.order2);
  });
});
