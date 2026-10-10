/**
 * Body-parser failures used to fall through errorHandler's "anything else is a
 * bug" branch: invalid JSON and an oversized body both came back 500 INTERNAL
 * (and were reported to Sentry as server errors). They are client errors.
 *
 * These run against the REAL app (createApp), so the real express.json limit,
 * the real parser ordering and the real error middleware are what is proven.
 * No database is needed: the parser fails before any handler or auth check.
 */
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CORRELATION_HEADER, createApp } from '../app.js';
import { reportError } from '../obs/sentry.js';
import { errorHandler } from './errorHandler.js';

vi.mock('../obs/sentry.js', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  reportError: vi.fn(),
}));

const app = createApp();
const SECRET_BODY = '{"mobile":"+919999999999","password":"hunter2-SECRET"';

function expectProblem(res: request.Response, status: number, code: string): void {
  expect(res.status).toBe(status);
  expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
  expect(res.body).toMatchObject({ status, code });
  // Correlation id: in the header and in the body, and they agree.
  expect(res.headers[CORRELATION_HEADER]).toEqual(expect.any(String));
  expect(res.body.traceId).toBe(res.headers[CORRELATION_HEADER]);
  // No stack, no parser internals, no echo of what the client sent.
  const text = JSON.stringify(res.body);
  expect(text).not.toMatch(/SyntaxError|at \w+.*\(|node_modules|body-parser|JSON\.parse|hunter2|SECRET|919999999999/);
  expect(res.body).not.toHaveProperty('stack');
}

describe('HTTP: body-parser errors are problem+json client errors, not 500', () => {
  beforeEach(() => {
    vi.mocked(reportError).mockClear();
  });

  it('HTTP: malformed JSON on POST /v1/auth/login (public, rate-limited) is 400 BAD_REQUEST', async () => {
    const res = await request(app).post('/v1/auth/login').set('Content-Type', 'application/json').send('{"mobile":');
    expectProblem(res, 400, 'BAD_REQUEST');
  });

  it('HTTP: malformed JSON on a public POST (register/customer) is 400 BAD_REQUEST and does not echo the body', async () => {
    const res = await request(app)
      .post('/v1/auth/register/customer')
      .set('Content-Type', 'application/json')
      .send(SECRET_BODY);
    expectProblem(res, 400, 'BAD_REQUEST');
  });

  it('HTTP: malformed JSON on a protected POST (/v1/farms, no token) is 400, not 500 and not a leaked 401 path', async () => {
    const res = await request(app).post('/v1/farms').set('Content-Type', 'application/json').send('{"name": ');
    expectProblem(res, 400, 'BAD_REQUEST');
  });

  it('HTTP: a body over the 1mb JSON limit is 413 PAYLOAD_TOO_LARGE with no body echo', async () => {
    const huge = JSON.stringify({ mobile: '+919999999999', password: `hunter2-SECRET${'x'.repeat(1024 * 1024 + 10)}` });
    const res = await request(app).post('/v1/auth/login').set('Content-Type', 'application/json').send(huge);
    expectProblem(res, 413, 'PAYLOAD_TOO_LARGE');
  });

  it('HTTP: an oversized urlencoded body is 413 PAYLOAD_TOO_LARGE too', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send(`mobile=${'9'.repeat(1024 * 1024 + 10)}`);
    expectProblem(res, 413, 'PAYLOAD_TOO_LARGE');
  });

  it('HTTP: an unsupported charset on a JSON body is a 4xx problem+json (415 as body-parser reports), not 500', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .set('Content-Type', 'application/json; charset=iso-8859-1')
      .send('{"mobile":"+919999999999","password":"x"}');
    expectProblem(res, 415, 'BAD_REQUEST');
  });

  it('HTTP: an unsupported Content-Encoding is a 4xx problem+json (415 as body-parser reports), not 500', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .set('Content-Type', 'application/json')
      .set('Content-Encoding', 'bogus')
      .send('{"mobile":"+919999999999","password":"x"}');
    expectProblem(res, 415, 'BAD_REQUEST');
  });

  it('HTTP: a corrupt gzip body is 400 problem+json, not 500', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .set('Content-Type', 'application/json')
      .set('Content-Encoding', 'gzip')
      .send(Buffer.from('this is not gzip'));
    expectProblem(res, 400, 'BAD_REQUEST');
  });

  it('HTTP: wrong content-type with a body (text/plain JSON) is not a 5xx: the body is ignored and validation answers 422', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .set('Content-Type', 'text/plain')
      .send('{"mobile":"+919999999999","password":"x"}');
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
  });

  it('HTTP: these client errors are logged as 4xx and NEVER reported to Sentry as server errors', async () => {
    await request(app).post('/v1/auth/login').set('Content-Type', 'application/json').send('{"mobile":');
    await request(app)
      .post('/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ pad: 'x'.repeat(1024 * 1024 + 10) }));
    expect(reportError).not.toHaveBeenCalled();
  });

  it('HTTP: a well-formed request is unaffected (valid JSON reaches validation: 422 for an invalid mobile)', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send({ mobile: 'not-a-mobile', password: 'x' });
    expect(res.status).toBe(422);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(res.body.errors).toHaveProperty('body.mobile');
  });

  it('HTTP: a body just under the limit is still parsed (not rejected as too large)', async () => {
    const res = await request(app)
      .post('/v1/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ mobile: 'not-a-mobile', password: 'y'.repeat(900 * 1024) }));
    expect(res.status).toBe(422);
  });
});

describe('HTTP: genuine server errors are still 500 with nothing leaked, and still reported', () => {
  beforeEach(() => {
    vi.mocked(reportError).mockClear();
  });

  it('HTTP: a thrown non-AppError is 500 INTERNAL problem+json with no message, stack or secret', async () => {
    const mini = express();
    mini.use(express.json());
    mini.post('/boom', () => {
      throw new Error('connect ECONNREFUSED postgres://tohfa:s3cr3t-password@db:5432');
    });
    mini.use(errorHandler);

    const res = await request(mini).post('/boom').send({ a: 1 });
    expect(res.status).toBe(500);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(res.body.code).toBe('INTERNAL');
    expect(JSON.stringify(res.body)).not.toMatch(/ECONNREFUSED|s3cr3t|postgres:|stack|at \w+/);
    expect(reportError).toHaveBeenCalledTimes(1);
  });

  it('HTTP: an Error that merely carries status 500 and a body-parser-like type is not treated as a client error', async () => {
    const mini = express();
    mini.use(express.json());
    mini.post('/boom', () => {
      throw Object.assign(new Error('internal'), { status: 500, type: 'something.else' });
    });
    mini.use(errorHandler);

    const res = await request(mini).post('/boom').send({ a: 1 });
    expect(res.status).toBe(500);
    expect(res.body.code).toBe('INTERNAL');
    expect(reportError).toHaveBeenCalledTimes(1);
  });
});
