/**
 * roles/admin/api/marketDay.ts: the dated market-day schedule client
 * (docs/openapi.yaml /admin/market-days, /admin/market-days/{id}; permission
 * `market.schedule.manage`, enforced router-wide at
 * apps/api/src/modules/market-days/market-days.routes.ts).
 *
 * The shell client is mocked, so these tests pin exactly what goes on the
 * wire: paths, methods, query strings and bodies — and that NO Idempotency-Key
 * is sent, because the spec declares none on these routes (unlike the pricing
 * writes, which require one).
 *
 * The list route answers a plain array, not the `{ items, page }` envelope, so
 * there is no cursor to pass.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn(async () => []) };
});

import { request } from '../../../shell/api/client';
import { adminErrorKey } from '../api/errors';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import { createMarketDay, listMarketDays, MARKET_DAY_ERROR_CODES, patchMarketDay } from '../api/marketDay';
import { adminKeys, marketDayKeys, MARKET_DAY_MODULE } from '../api/queryKeys';
import { hasKey } from '../i18n';

const requestMock = vi.mocked(request);
const WAREHOUSE = '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01';
const DAY_ID = 'aa11bb22-cc33-4d44-8e55-9f6677889900';

function lastCall() {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('no request');
  return { path: call[0], options: call[1] ?? {} };
}

beforeEach(() => requestMock.mockClear());

describe('market day schedule list client', () => {
  it('GETs /admin/market-days with no query by default', async () => {
    await listMarketDays();
    const { path, options } = lastCall();
    expect(path).toBe('/admin/market-days');
    expect(options.method).toBe('GET');
    expect(options.timeoutMs).toBe(ADMIN_REQUEST_TIMEOUT_MS);
  });

  it('sends warehouseId, from and to when given, and drops the ones left unset', async () => {
    await listMarketDays({ warehouseId: WAREHOUSE, from: '2026-11-01' });
    expect(lastCall().path).toBe(`/admin/market-days?warehouseId=${WAREHOUSE}&from=2026-11-01`);
  });

  it('passes the caller abort signal through', async () => {
    const controller = new AbortController();
    await listMarketDays({}, controller.signal);
    expect(lastCall().options.signal).toBe(controller.signal);
  });
});

describe('market day schedule writes', () => {
  it('POSTs the create body to /admin/market-days with NO Idempotency-Key (the spec declares none)', async () => {
    await createMarketDay({
      warehouseId: WAREHOUSE,
      marketDate: '2026-11-21',
      startTime: '06:00',
      endTime: '12:00',
      notes: 'Weekly haat',
    });
    const { path, options } = lastCall();
    expect(path).toBe('/admin/market-days');
    expect(options.method).toBe('POST');
    expect(options.body).toEqual({
      warehouseId: WAREHOUSE,
      marketDate: '2026-11-21',
      startTime: '06:00',
      endTime: '12:00',
      notes: 'Weekly haat',
    });
    expect(options.idempotencyKey).toBeUndefined();
  });

  it('PATCHes /admin/market-days/{id} with only the fields given', async () => {
    await patchMarketDay(DAY_ID, { isActive: false });
    const { path, options } = lastCall();
    expect(path).toBe(`/admin/market-days/${DAY_ID}`);
    expect(options.method).toBe('PATCH');
    expect(options.body).toEqual({ isActive: false });
  });

  it('encodes the id into the path rather than interpolating it raw', async () => {
    await patchMarketDay('a/b c', { startTime: '07:00' });
    expect(lastCall().path).toBe('/admin/market-days/a%2Fb%20c');
  });
});

describe('error strings and query keys', () => {
  it('every problem code these routes document has an admin string', () => {
    for (const code of MARKET_DAY_ERROR_CODES) expect(hasKey(`admin.error.${code}`), code).toBe(true);
    expect(adminErrorKey(new Error('x'))).toBe('admin.error.generic');
  });

  it('the schedule and the venue flags are separate resources under one module prefix', () => {
    const prefix = adminKeys.module(MARKET_DAY_MODULE);
    const schedule = marketDayKeys.schedule(WAREHOUSE, { warehouseId: WAREHOUSE });
    const venues = marketDayKeys.venues();
    expect(schedule.slice(0, prefix.length)).toEqual([...prefix]);
    expect(venues.slice(0, prefix.length)).toEqual([...prefix]);
    expect(schedule).not.toEqual(venues);
  });

  it('an unset filter is null, so the key shape does not change with the filters', () => {
    expect(marketDayKeys.schedule(undefined, {})).toEqual([
      'admin',
      MARKET_DAY_MODULE,
      'all',
      { resource: 'schedule', warehouseId: null, from: null, to: null },
    ]);
  });
});
