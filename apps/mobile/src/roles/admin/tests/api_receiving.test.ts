/**
 * roles/admin/api/receiving.ts and roles/admin/api/warehouses.ts: purchase
 * orders, goods receipts, the quality check, the quality counter-offer and the
 * storage locations (docs/openapi.yaml tag Purchase, /warehouses/{id}/storage-
 * locations). The shell client is mocked (same pattern as
 * roles/farmer/tests/admin_auth_api.test.ts), so these tests pin exactly what
 * goes on the wire.
 *
 * Writes: docs/openapi.yaml asks for an Idempotency-Key on create, QC and
 * counter-offer, so each write sends one, and the wizard's key ring
 * (createReceivingKeyRing) reuses a key for the same body and makes a new one
 * for a changed body. The server ignores the key on these three routes today
 * (server gap), which is why the wizard also resumes rather than re-creates
 * (see mappers_receiving.test.ts).
 *
 * BR-30: lists send a warehouseId only when the caller passes one, and the
 * screens pass receivingWarehouseFilter(scope, selected), which pins a Sub scope
 * to its own warehouse uuid whatever was selected.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../shell/api/client')>();
  return {
    ...actual,
    request: vi.fn(async () => ({ items: [], page: { nextCursor: null, hasMore: false } })),
  };
});

import { ApiError } from '../../../shell/api/client';
import { request } from '../../../shell/api/client';
import { adminErrorKey } from '../api/errors';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import {
  ERROR_CODES,
  createCounterOffer,
  createGoodsReceipt,
  getGoodsReceipt,
  getPurchaseOrder,
  listGoodsReceipts,
  listPurchaseOrders,
  recordQualityCheck,
  type GoodsReceiptCreate,
  type QualityCheckCreate,
} from '../api/receiving';
import { listStorageLocations } from '../api/warehouses';
import { hasKey, t } from '../i18n';
import { createReceivingKeyRing, receivingWarehouseFilter } from '../screens/warehouse/receiving-qc/mappers';

const requestMock = vi.mocked(request);

const OWN = '11111111-1111-4111-8111-111111111111';
const FOREIGN = '99999999-9999-4999-8999-999999999999';
const PO = '22222222-2222-4222-8222-222222222222';
const GR = '33333333-3333-4333-8333-333333333333';
const SUB_SCOPE = { warehouseId: OWN, warehouseCode: 'WH-COON', warehouseName: 'Coonoor' };
const MAIN_SCOPE = {};

const CREATE_BODY: GoodsReceiptCreate = { purchaseOrderId: PO, warehouseId: OWN, grossQtyKg: '250.000' };

const QC_BODY: QualityCheckCreate = {
  assignedGrade: 'GRADE_2',
  outcome: 'PARTIALLY_ACCEPTED',
  acceptedQtyKg: '220.000',
  rejectedQtyKg: '30.000',
  defectNotes: 'Bruising on 30 kg.',
  items: [
    { parameter: 'APPEARANCE', passed: true },
    { parameter: 'SIZE_UNIFORMITY', passed: true },
    { parameter: 'MOISTURE', passed: true },
    { parameter: 'DAMAGE_PEST', passed: false },
    { parameter: 'FRESHNESS', passed: true },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

function lastCall(): [string, Record<string, unknown>] {
  const call = requestMock.mock.calls.at(-1);
  if (call === undefined) throw new Error('request() was not called');
  return [call[0], call[1] as Record<string, unknown>];
}

function problem(code: string, status: number): ApiError {
  return new ApiError({ type: 'about:blank', title: code, status, code: code as never });
}

describe('listPurchaseOrders', () => {
  it('GETs /admin/purchase-orders with no query by default', async () => {
    await listPurchaseOrders();
    expect(requestMock).toHaveBeenCalledWith('/admin/purchase-orders', { method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
  });

  it('sends cursor, limit, status and warehouseId', async () => {
    await listPurchaseOrders({ cursor: 'c-1', limit: 100, status: 'ISSUED', warehouseId: OWN });
    expect(lastCall()[0]).toBe(`/admin/purchase-orders?cursor=c-1&limit=100&status=ISSUED&warehouseId=${OWN}`);
  });

  it('passes the caller signal through', async () => {
    const controller = new AbortController();
    await listPurchaseOrders({}, controller.signal);
    expect(lastCall()[1]['signal']).toBe(controller.signal);
  });
});

describe('getPurchaseOrder', () => {
  it('GETs /admin/purchase-orders/{id}, encoded as one path segment', async () => {
    await getPurchaseOrder(PO);
    expect(requestMock).toHaveBeenCalledWith(`/admin/purchase-orders/${PO}`, { method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
    await getPurchaseOrder('a/b?c');
    expect(lastCall()[0]).toBe('/admin/purchase-orders/a%2Fb%3Fc');
  });
});

describe('listGoodsReceipts / getGoodsReceipt', () => {
  it('GETs /admin/goods-receipts with no query by default', async () => {
    await listGoodsReceipts();
    expect(lastCall()[0]).toBe('/admin/goods-receipts');
  });

  it('sends cursor, limit, warehouseId, status and purchaseOrderId', async () => {
    await listGoodsReceipts({ cursor: 'c-2', limit: 20, warehouseId: OWN, status: 'AWAITING_QC', purchaseOrderId: PO });
    expect(lastCall()[0]).toBe(
      `/admin/goods-receipts?cursor=c-2&limit=20&warehouseId=${OWN}&status=AWAITING_QC&purchaseOrderId=${PO}`,
    );
  });

  it('GETs /admin/goods-receipts/{id}', async () => {
    await getGoodsReceipt(GR);
    expect(requestMock).toHaveBeenCalledWith(`/admin/goods-receipts/${GR}`, { method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
  });
});

describe('createGoodsReceipt', () => {
  it('POSTs the GoodsReceiptCreate body to /admin/goods-receipts with the Idempotency-Key', async () => {
    await createGoodsReceipt(CREATE_BODY, 'key-create-1');
    expect(requestMock).toHaveBeenCalledWith('/admin/goods-receipts', {
      method: 'POST',
      body: { purchaseOrderId: PO, warehouseId: OWN, grossQtyKg: '250.000' },
      idempotencyKey: 'key-create-1',
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });
});

describe('recordQualityCheck', () => {
  it('POSTs the QualityCheckCreate body to /admin/goods-receipts/{id}/quality-check with the Idempotency-Key', async () => {
    await recordQualityCheck(GR, QC_BODY, 'key-qc-1');
    expect(requestMock).toHaveBeenCalledWith(`/admin/goods-receipts/${GR}/quality-check`, {
      method: 'POST',
      body: QC_BODY,
      idempotencyKey: 'key-qc-1',
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });

  it('quantities on the wire are the API kg strings, never numbers', async () => {
    await recordQualityCheck(GR, QC_BODY, 'key-qc-1');
    const body = lastCall()[1]['body'] as Record<string, unknown>;
    expect(typeof body['acceptedQtyKg']).toBe('string');
    expect(typeof body['rejectedQtyKg']).toBe('string');
  });
});

describe('createCounterOffer', () => {
  it('POSTs the CounterOfferCreate body to /admin/goods-receipts/{id}/counter-offer with the Idempotency-Key', async () => {
    await createCounterOffer(GR, { pricePerKg: '42.50' as never, quantityKg: '220.000', message: 'Grade 2 at receipt' }, 'key-co-1');
    expect(requestMock).toHaveBeenCalledWith(`/admin/goods-receipts/${GR}/counter-offer`, {
      method: 'POST',
      body: { pricePerKg: '42.50', quantityKg: '220.000', message: 'Grade 2 at receipt' },
      idempotencyKey: 'key-co-1',
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });
});

describe('listStorageLocations', () => {
  it('GETs /warehouses/{id}/storage-locations with page and pageSize', async () => {
    await listStorageLocations(OWN, { page: 2, pageSize: 100 });
    expect(requestMock).toHaveBeenCalledWith(`/warehouses/${OWN}/storage-locations?page=2&pageSize=100`, {
      method: 'GET',
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });

  it('sends isActive when asked and no query by default', async () => {
    await listStorageLocations(OWN);
    expect(lastCall()[0]).toBe(`/warehouses/${OWN}/storage-locations`);
    await listStorageLocations(OWN, { isActive: true });
    expect(lastCall()[0]).toBe(`/warehouses/${OWN}/storage-locations?isActive=true`);
  });
});

describe('Idempotency-Key reuse (root CLAUDE.md 2.4)', () => {
  function ring() {
    let n = 0;
    return createReceivingKeyRing(() => `key-${(n += 1)}`);
  }

  it('the same create body reuses its key on a retry; a changed body gets a new one', async () => {
    const keys = ring();
    const first = keys.createKey(CREATE_BODY);
    expect(keys.createKey({ ...CREATE_BODY })).toBe(first);
    // Key order does not matter: the same logical body is the same request.
    expect(keys.createKey({ grossQtyKg: '250.000', warehouseId: OWN, purchaseOrderId: PO })).toBe(first);
    const changed = keys.createKey({ ...CREATE_BODY, grossQtyKg: '251.000' });
    expect(changed).not.toBe(first);

    await createGoodsReceipt(CREATE_BODY, keys.createKey(CREATE_BODY));
    expect(lastCall()[1]['idempotencyKey']).toBe(keys.createKey(CREATE_BODY));
  });

  it('the same QC body on the same receipt reuses its key; another receipt or body gets a new one', () => {
    const keys = ring();
    const first = keys.qcKey(GR, QC_BODY);
    expect(keys.qcKey(GR, { ...QC_BODY })).toBe(first);
    expect(keys.qcKey(GR, { ...QC_BODY, acceptedQtyKg: '219.000', rejectedQtyKg: '31.000' })).not.toBe(first);
    expect(keys.qcKey(PO, QC_BODY)).not.toBe(keys.qcKey(GR, QC_BODY));
  });

  it('create, QC and counter-offer never share a key', () => {
    const keys = ring();
    const create = keys.createKey(CREATE_BODY);
    const qc = keys.qcKey(GR, QC_BODY);
    const counter = keys.counterKey(GR, { pricePerKg: '42.50' as never, quantityKg: '220.000' });
    expect(new Set([create, qc, counter]).size).toBe(3);
    // Asking for the QC key did not disturb the create key.
    expect(keys.createKey(CREATE_BODY)).toBe(create);
  });

  it('a changed counter-offer gets a new key', () => {
    const keys = ring();
    const first = keys.counterKey(GR, { pricePerKg: '42.50' as never, quantityKg: '220.000' });
    expect(keys.counterKey(GR, { pricePerKg: '42.50' as never, quantityKg: '220.000' })).toBe(first);
    expect(keys.counterKey(GR, { pricePerKg: '40.00' as never, quantityKg: '220.000' })).not.toBe(first);
  });
});

describe('BR-30: a Sub scope never sends a foreign warehouseId', () => {
  it('receivingWarehouseFilter pins a Sub scope to its own warehouse uuid, whatever was selected', () => {
    expect(receivingWarehouseFilter(SUB_SCOPE, FOREIGN)).toBe(OWN);
    expect(receivingWarehouseFilter(SUB_SCOPE, undefined)).toBe(OWN);
    expect(receivingWarehouseFilter(SUB_SCOPE, undefined)).not.toBe('WH-COON');
  });

  it('Main sends the selected warehouse, or none for all warehouses', () => {
    expect(receivingWarehouseFilter(MAIN_SCOPE, FOREIGN)).toBe(FOREIGN);
    expect(receivingWarehouseFilter(MAIN_SCOPE, undefined)).toBeUndefined();
  });

  it('every list call made through the filter carries only the Sub warehouse', async () => {
    const warehouseId = receivingWarehouseFilter(SUB_SCOPE, FOREIGN);
    await listPurchaseOrders({ warehouseId });
    await listGoodsReceipts({ warehouseId });
    const paths = requestMock.mock.calls.map((c) => c[0]);
    expect(paths).toEqual([`/admin/purchase-orders?warehouseId=${OWN}`, `/admin/goods-receipts?warehouseId=${OWN}`]);
    for (const path of paths) expect(path).not.toContain(FOREIGN);
  });
});

describe('ERROR_CODES and their messages', () => {
  it('lists the problem codes the receiving endpoints document', () => {
    expect([...ERROR_CODES].sort()).toEqual(
      [
        'CONFLICT',
        'COUNTER_LIMIT_REACHED',
        'COUNTER_OFFER_EXPIRED',
        'FORBIDDEN',
        'INTERNAL',
        'INVALID_STATE_TRANSITION',
        'NOT_FOUND',
        'UNAUTHENTICATED',
        'VALIDATION_FAILED',
      ].sort(),
    );
  });

  it('every listed code has an admin message', () => {
    for (const code of ERROR_CODES) expect(hasKey(`admin.error.${code}`), code).toBe(true);
  });

  it('BR-10: COUNTER_OFFER_EXPIRED maps to the expired-offer message', () => {
    const key = adminErrorKey(problem('COUNTER_OFFER_EXPIRED', 409));
    expect(key).toBe('admin.error.COUNTER_OFFER_EXPIRED');
    expect(t(key)).not.toBe(t('admin.error.generic'));
  });

  it('BR-11: COUNTER_LIMIT_REACHED maps to the no-rounds-left message', () => {
    const key = adminErrorKey(problem('COUNTER_LIMIT_REACHED', 409));
    expect(key).toBe('admin.error.COUNTER_LIMIT_REACHED');
    expect(t(key)).not.toBe(t('admin.error.generic'));
  });
});
