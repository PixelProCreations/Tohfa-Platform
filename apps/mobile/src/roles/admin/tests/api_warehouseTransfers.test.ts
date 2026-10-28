/**
 * roles/admin/api/warehouseTransfers.ts: the read-only transfer list
 * (docs/openapi.yaml listWarehouseTransfers, GET /warehouse-transfers,
 * transfer.inter_warehouse.view, BR-30, BR-102). The shell client is mocked
 * (same pattern as api_warehouses.test.ts), so these tests pin exactly what
 * goes on the wire.
 *
 * Creating, receiving and approving transfers belong to a later phase: the
 * module must export no write helper, and every call must be a GET.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

vi.mock('../../../shell/api/client', () => ({
  request: vi.fn(async () => ({ items: [], page: 1, pageSize: 20, total: 0 })),
}));

import { request } from '../../../shell/api/client';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import * as transfersApi from '../api/warehouseTransfers';
import { ERROR_CODES, TRANSFER_STATUSES, listWarehouseTransfers } from '../api/warehouseTransfers';
import { hasKey } from '../i18n';

const requestMock = vi.mocked(request);
const REPO_ROOT = path.join(__dirname, '..', '..', '..', '..', '..', '..');
const WH = '11111111-1111-4111-8111-111111111111';

beforeEach(() => {
  vi.clearAllMocks();
});

function lastCall(): [string, Record<string, unknown>] {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('request() was not called');
  return [call[0], call[1] as Record<string, unknown>];
}

describe('listWarehouseTransfers (BR-102)', () => {
  it('GETs /warehouse-transfers with no query by default', async () => {
    await listWarehouseTransfers();
    expect(requestMock).toHaveBeenCalledWith('/warehouse-transfers', { method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
  });

  it('sends status, warehouseId, direction, page and pageSize in the spec order', async () => {
    await listWarehouseTransfers({ status: 'IN_TRANSIT', warehouseId: WH, direction: 'INBOUND', page: 2, pageSize: 100 });
    expect(lastCall()[0]).toBe(`/warehouse-transfers?status=IN_TRANSIT&warehouseId=${WH}&direction=INBOUND&page=2&pageSize=100`);
  });

  it('returns the page shape the server sends (items, page, pageSize, total) untouched', async () => {
    const body = { items: [], page: 1, pageSize: 20, total: 0 };
    requestMock.mockResolvedValueOnce(body);
    await expect(listWarehouseTransfers()).resolves.toEqual(body);
  });

  it('passes the caller signal through', async () => {
    const controller = new AbortController();
    await listWarehouseTransfers({}, controller.signal);
    expect(lastCall()[1]['signal']).toBe(controller.signal);
  });
});

describe('the module is read-only and matches the spec', () => {
  it('exports no write helper (initiate, approve, dispatch, receive and cancel are a later phase)', () => {
    expect(Object.keys(transfersApi).filter((k) => /^(create|initiate|approve|dispatch|receive|cancel|update|patch|post|set|delete)/i.test(k))).toEqual([]);
  });

  it('lists exactly the status values docs/openapi.yaml WarehouseTransferSummary declares', () => {
    const spec = fs.readFileSync(path.join(REPO_ROOT, 'docs', 'openapi.yaml'), 'utf8');
    const block = spec.slice(spec.indexOf('    WarehouseTransferSummary:'), spec.indexOf('    WarehouseTransfer:\n'));
    const declared = /status: \{ type: string, enum: \[([^\]]+)\] \}/.exec(block)?.[1]?.split(',').map((v) => v.trim());
    expect([...TRANSFER_STATUSES]).toEqual(declared);
  });

  it('the list route is documented as transfer.inter_warehouse.view', () => {
    const spec = fs.readFileSync(path.join(REPO_ROOT, 'docs', 'openapi.yaml'), 'utf8');
    const block = spec.slice(spec.indexOf('  /warehouse-transfers:\n'), spec.indexOf('    post:\n', spec.indexOf('  /warehouse-transfers:\n')));
    expect(block).toContain('operationId: listWarehouseTransfers');
    expect(block).toContain('x-permission: transfer.inter_warehouse.view');
  });

  it('every documented problem code has an admin error string', () => {
    for (const code of ERROR_CODES) expect({ code, has: hasKey(`admin.error.${code}`) }).toEqual({ code, has: true });
  });
});
