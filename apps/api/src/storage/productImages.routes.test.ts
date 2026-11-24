import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import express from 'express';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { errorHandler } from '../http/errorHandler.js';
import { productImageUrl } from '../modules/catalog/catalog.image.js';
import { createProductImagesRouter } from './productImages.routes.js';

const dir = mkdtempSync(join(tmpdir(), 'product-images-'));
writeFileSync(join(dir, 'vegCarrot.png'), Buffer.from('png-bytes'));
writeFileSync(join(dir, 'fruit_apple-1.jpg'), Buffer.from('jpg-bytes'));
writeFileSync(join(dir, 'notes.txt'), 'not an image');
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const app = express();
app.use('/product-images', createProductImagesRouter(dir));
app.use(errorHandler);

describe('GET /product-images/<key>.<ext> (dev product image stand-in)', () => {
  it('answers the .jpg URL the catalog emits with whichever <key>.* exists, typed correctly', async () => {
    const res = await request(app).get('/product-images/vegCarrot.jpg').buffer(true);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(Buffer.from(res.body as Buffer).toString()).toBe('png-bytes');
  });

  it('serves the exact extension, another extension, or no extension', async () => {
    const exact = await request(app).get('/product-images/fruit_apple-1.jpg');
    expect(exact.status).toBe(200);
    expect(exact.headers['content-type']).toBe('image/jpeg');
    expect((await request(app).get('/product-images/fruit_apple-1.webp')).status).toBe(200);
    expect((await request(app).get('/product-images/vegCarrot')).status).toBe(200);
  });

  it('404s unknown keys, non-image files and anything outside [A-Za-z0-9_-]', async () => {
    for (const path of [
      '/product-images/vegBeans.jpg',
      '/product-images/notes.txt',
      '/product-images/notes.jpg',
      '/product-images/..%2Fpackage.json',
      '/product-images/..%5Cpackage.json',
      '/product-images/veg.Carrot.jpg',
      '/product-images/vegCarrot.j%2Fpg',
      '/product-images/a/b.jpg',
    ]) {
      const res = await request(app).get(path);
      expect(res.status, path).toBe(404);
    }
  });
});

describe('productImageUrl (BR-16 / BR-195)', () => {
  it('emits only the configured base + the catalog key (CDN by default)', () => {
    expect(productImageUrl('vegCarrot', 'crop-1')).toBe('https://cdn.tohfa.in/products/vegCarrot.jpg');
    expect(productImageUrl(null, 'crop-1')).toBe('https://cdn.tohfa.in/products/crop-1.jpg');
  });
});
