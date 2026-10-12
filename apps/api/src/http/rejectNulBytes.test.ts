/**
 * NUL: the shared request guard that refuses U+0000 anywhere in a request.
 * Infrastructure, not a business rule, so these are named `NUL:` rather than `BR-xx:`.
 *
 * Unit level: the walker, and the middleware mounted on a bare Express app with
 * a handler that records whether it ran. The real routers and the database are
 * in rejectNulBytes.e2e.test.ts.
 */
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { errorHandler, notFoundHandler } from './errorHandler.js';
import { findNulPaths, rejectNulBytes } from './rejectNulBytes.js';

const NUL = '\u0000';

describe('NUL: findNulPaths', () => {
  it('NUL: finds a NUL in a top-level string and names its path', () => {
    expect(findNulPaths({ fullName: `Bad${NUL}Name` }, 'body')).toEqual(['body.fullName']);
  });

  it('NUL: finds NULs in nested objects and arrays, naming each path with array indexes', () => {
    const body = { a: { b: [{ c: 'ok' }, { c: `x${NUL}` }], d: [`${NUL}`, 'fine'] } };
    expect(findNulPaths(body, 'body').sort()).toEqual(['body.a.b.1.c', 'body.a.d.0']);
  });

  it('NUL: finds a NUL in a bare string root and in a query-style array value', () => {
    expect(findNulPaths(`a${NUL}`, 'body')).toEqual(['body']);
    expect(findNulPaths({ tag: ['a', `b${NUL}`] }, 'query')).toEqual(['query.tag.1']);
  });

  it('NUL: finds a NUL in an object KEY without echoing the key', () => {
    const paths = findNulPaths({ [`evil${NUL}key`]: 'v', nested: { [`x${NUL}`]: 1 } }, 'body');
    expect(paths).toHaveLength(2);
    for (const p of paths) expect(p).not.toContain(NUL);
    expect(paths.some((p) => p.startsWith('body.nested.'))).toBe(true);
  });

  it.each([
    ['plain ascii', 'hello world'],
    ['emoji', 'fresh carrots \u{1F955}\u{1F33E}'],
    ['Tamil', 'நீலகிரி கரிம விவசாயி'],
    ['mixed scripts and combining marks', 'Café ñ 日本語 é'],
    ['a literal backslash-u string', 'literal \\u0000 text'],
    ['the six characters %00', 'a%00b'],
    ['control characters other than NUL', 'tab\there\nnewline\u0001\u001f'],
    ['empty string', ''],
    ['the replacement character', '�'],
  ])('NUL: no false positive on %s', (_name, value) => {
    expect(findNulPaths({ a: value, b: [value], c: { d: value } }, 'body')).toEqual([]);
  });

  it('NUL: ignores non-string leaves, null, undefined and Buffers (a raw webhook body)', () => {
    expect(findNulPaths({ n: 1, b: true, z: null, u: undefined, buf: Buffer.from([0, 1, 2]) }, 'body')).toEqual([]);
    expect(findNulPaths(Buffer.from([0, 0, 0]), 'body')).toEqual([]);
  });

  it('NUL: a 200000-deep nested body is walked without overflowing the stack', () => {
    let deep: unknown = `x${NUL}`;
    for (let i = 0; i < 200_000; i += 1) deep = [deep];
    expect(() => findNulPaths(deep, 'body')).not.toThrow();
    expect(findNulPaths(deep, 'body').length).toBe(1);
  });

  it('NUL: caps how many offending paths it reports', () => {
    const body = Object.fromEntries(Array.from({ length: 500 }, (_, i) => [`f${i}`, NUL]));
    expect(findNulPaths(body, 'body').length).toBeLessThanOrEqual(20);
  });
});

describe('NUL: rejectNulBytes middleware', () => {
  function appWith(): { app: express.Express; reached: { count: number } } {
    const reached = { count: 0 };
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(rejectNulBytes);
    app.all('/v1/things/:id', (_req, res) => {
      reached.count += 1;
      res.json({ ok: true });
    });
    app.use(notFoundHandler);
    app.use(errorHandler);
    return { app, reached };
  }

  it('NUL: a body string with an escaped \\u0000 is 422 VALIDATION_FAILED problem+json naming body.<field>, and the handler never runs', async () => {
    const { app, reached } = appWith();
    const res = await request(app)
      .post('/v1/things/1')
      .set('Content-Type', 'application/json')
      .send('{"fullName":"Bad\\u0000Name","other":"fine"}');
    expect(res.status).toBe(422);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(Object.keys(res.body.errors)).toEqual(['body.fullName']);
    expect(JSON.stringify(res.body)).not.toContain('Bad');
    expect(JSON.stringify(res.body)).not.toContain('\\u0000');
    expect(reached.count).toBe(0);
  });

  it('NUL: a percent-encoded %00 in a query value is 422 naming query.<field>', async () => {
    const { app, reached } = appWith();
    const res = await request(app).get('/v1/things/1?cursor=%00&limit=5');
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(Object.keys(res.body.errors)).toEqual(['query.cursor']);
    expect(reached.count).toBe(0);
  });

  it('NUL: %00 inside an array-valued and a nested query parameter is caught', async () => {
    const { app, reached } = appWith();
    const res = await request(app).get('/v1/things/1?tag=a&tag=b%00');
    expect(res.status).toBe(422);
    expect(Object.keys(res.body.errors)).toEqual(['query.tag.1']);
    expect(reached.count).toBe(0);
  });

  it('NUL: %00 in a path segment (a route param) is 422 and the handler never runs', async () => {
    const { app, reached } = appWith();
    for (const url of ['/v1/things/a%00b', '/v1/things/a%00', '/v1/things/%00']) {
      const res = await request(app).get(url);
      expect(res.status, url).toBe(422);
      expect(res.body.code).toBe('VALIDATION_FAILED');
      expect(Object.keys(res.body.errors)).toEqual(['params']);
    }
    expect(reached.count).toBe(0);
  });

  it('NUL: an urlencoded form body with %00 is caught', async () => {
    const { app, reached } = appWith();
    const res = await request(app).post('/v1/things/1').type('form').send('name=a%00b');
    expect(res.status).toBe(422);
    expect(Object.keys(res.body.errors)).toEqual(['body.name']);
    expect(reached.count).toBe(0);
  });

  it('NUL: a NUL nested in arrays of objects is caught with the full path', async () => {
    const { app, reached } = appWith();
    const res = await request(app).post('/v1/things/1').send({ items: [{ name: 'ok' }, { tags: ['a', `b${NUL}`] }] });
    expect(res.status).toBe(422);
    expect(Object.keys(res.body.errors)).toEqual(['body.items.1.tags.1']);
    expect(reached.count).toBe(0);
  });

  it('NUL: normal unicode, emoji, Tamil, a literal backslash-u string and a literal %00 text pass through untouched', async () => {
    const { app, reached } = appWith();
    const res = await request(app)
      .post('/v1/things/1?q=%E0%AE%A8%E0%AF%80%E0%AE%B2')
      .send({ a: 'நீலகிரி', b: '\u{1F955}', c: 'literal \\u0000', d: 'a%00b' });
    expect(res.status).toBe(200);
    expect(reached.count).toBe(1);
    const encoded = await request(app).get('/v1/things/a%2500b');
    expect(encoded.status).toBe(200);
  });

  it('NUL: several offending fields are all named, and no value is echoed', async () => {
    const { app } = appWith();
    const res = await request(app).post('/v1/things/1?x=%00').send({ a: `1${NUL}`, b: { c: `2${NUL}` } });
    expect(res.status).toBe(422);
    expect(Object.keys(res.body.errors).sort()).toEqual(['body.a', 'body.b.c', 'query.x']);
  });

  it('NUL: a clean request with no body and no query is untouched', async () => {
    const { app, reached } = appWith();
    const res = await request(app).get('/v1/things/1');
    expect(res.status).toBe(200);
    expect(reached.count).toBe(1);
  });
});
