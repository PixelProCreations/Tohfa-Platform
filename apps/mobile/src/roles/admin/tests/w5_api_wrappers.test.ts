/**
 * W5 (brief 07) client wrappers: what goes on the wire for the farmer's
 * payouts, the produce record list, and a farmer's farm assets / livestock.
 * The shell client is mocked, so these pin paths and query strings only.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn(async () => ({ items: [], page: { nextCursor: null, hasMore: false } })) };
});

import { request } from '../../../shell/api/client';
import { listFarmerPayouts, farmerPayoutsKey } from '../api/w5FarmerPayouts';
import { listProduceRecords, produceRecordListKey } from '../api/w5ProduceRecords';
import { listAdminFarmerAnimals, listAdminFarmerAssets } from '../api/w5FarmRecords';
import { PAYOUTS_MODULE } from '../api/payoutsHooks';

const requestMock = vi.mocked(request);
const FARMER = '33333333-3333-4333-8333-333333333333';

function lastPath(): string {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('no request');
  return call[0];
}

beforeEach(() => requestMock.mockClear());

describe('farmer payouts (GET /admin/payouts?farmerId=)', () => {
  it('filters by the farmer UUID and sends no empty parameter', async () => {
    await listFarmerPayouts(FARMER, undefined);
    expect(lastPath()).toBe(`/admin/payouts?farmerId=${FARMER}`);
  });

  it('passes the cursor for the next page', async () => {
    await listFarmerPayouts(FARMER, 'abc');
    expect(lastPath()).toBe(`/admin/payouts?farmerId=${FARMER}&cursor=abc`);
  });

  it('keys under the payouts module, so an approval refetches the farmer list', () => {
    expect(farmerPayoutsKey(FARMER).slice(0, 2)).toEqual(['admin', PAYOUTS_MODULE]);
  });
});

describe('produce record list (GET /admin/produce/records)', () => {
  it('asks for the rows with the server total and the farmer filter', async () => {
    await listProduceRecords({ farmerId: FARMER }, undefined);
    expect(lastPath()).toBe(`/admin/produce/records?farmerId=${FARMER}&includeTotal=true`);
  });

  it('sends statuses comma-separated and never a blank q (422 on the server)', async () => {
    await listProduceRecords({ q: '   ', statuses: ['GROWING', 'PLANNED'] }, undefined);
    expect(lastPath()).toBe('/admin/produce/records?status=GROWING%2CPLANNED&includeTotal=true');
    await listProduceRecords({ q: ' tomato ', statuses: [] }, 'c1');
    expect(lastPath()).toBe('/admin/produce/records?q=tomato&includeTotal=true&cursor=c1');
  });

  it('keys differ by filter', () => {
    expect(produceRecordListKey({ farmerId: FARMER })).not.toEqual(produceRecordListKey({}));
  });
});

describe('farm assets and livestock (admin read-only)', () => {
  it('GETs the farmer farm-assets list', async () => {
    await listAdminFarmerAssets(FARMER, undefined);
    expect(lastPath()).toBe(`/admin/farmers/${FARMER}/farm-assets`);
  });

  it('GETs the farmer herd', async () => {
    await listAdminFarmerAnimals(FARMER);
    expect(lastPath()).toBe(`/admin/farmers/${FARMER}/livestock/animals`);
  });
});
