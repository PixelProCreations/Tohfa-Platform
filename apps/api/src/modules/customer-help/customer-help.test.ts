import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import type { Executor } from '../../db/pool.js';
import { errorHandler, notFoundHandler } from '../../http/errorHandler.js';
import { createCustomerHelpRouter } from './customer-help.routes.js';
import { createCustomerHelpService } from './customer-help.service.js';

const article = { id: '00000000-0000-4000-8000-000000000001', category: 'Orders', locale: 'en' as const, title: 'T', body: 'B', sortOrder: 1 };

describe('customer help (public read of published admin content)', () => {
  const calls: unknown[] = [];
  const service = createCustomerHelpService(
    {
      async listPublished(_d, f) { calls.push(f); return [article]; },
      async listPublishedCategories() { return ['Orders']; },
      async getContact() { return { phone: null, email: null }; },
    },
    {} as Executor,
  );
  const app = express();
  app.use('/v1/help', createCustomerHelpRouter(service));
  app.use(notFoundHandler);
  app.use(errorHandler);

  it('GET /articles is public, defaults to locale en and returns only the reader shape', async () => {
    const res = await request(app).get('/v1/help/articles');
    expect(res.status).toBe(200);
    expect(calls[0]).toMatchObject({ locale: 'en' });
    expect(res.body.items[0]).toEqual(article);
    expect(res.body.items[0]).not.toHaveProperty('isPublished');
  });

  it('GET /categories lists categories; unknown locale / query keys are 422', async () => {
    expect((await request(app).get('/v1/help/categories')).body).toEqual({ items: ['Orders'] });
    expect((await request(app).get('/v1/help/categories?locale=xx')).status).toBe(422);
    expect((await request(app).get('/v1/help/categories?category=x')).status).toBe(422);
  });
});
