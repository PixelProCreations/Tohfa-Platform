/**
 * roles/admin/api/receiving.ts: purchase orders, goods receipts, the quality
 * check, the damage / mismatch reports, the printable receipt note and the
 * quality counter-offer (docs/openapi.yaml tag Purchase, as on
 * origin/feat/admin-apis-for-mobile). The shell client is mocked, so these
 * tests pin exactly what goes on the wire.
 *
 * Writes: every receiving write sends an Idempotency-Key, which the server
 * honours (BR-118, BR-121): a replay with the same key and body moves nothing
 * twice, so a retry must reuse the key (the wizard's key ring does, see
 * receiving_data.test.ts).
 *
 * BR-30: lists send a warehouseId only when the caller passes one.
 * BR-122: `q`, `from` and `to` narrow the purchase-order and goods-receipt
 * lists; the server's query schema is strict, so nothing else is sent.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return {
    ...actual,
    request: vi.fn(async () => ({ items: [], page: { nextCursor: null, hasMore: false } })),
  };
});

import { ApiError, request } from '../../../shell/api/client';
import { adminErrorKey } from '../api/errors';
import { ADMIN_REQUEST_TIMEOUT_MS } from '../api/http';
import {
  ERROR_CODES,
  createCounterOffer,
  createGoodsReceipt,
  createGoodsReceiptDiscrepancy,
  getGoodsReceipt,
  getGoodsReceiptDocument,
  getPurchaseOrder,
  listGoodsReceiptDiscrepancies,
  listGoodsReceipts,
  listPurchaseOrders,
  recordQualityCheck,
  type GoodsReceiptCreate,
  type QualityCheckCreate,
} from '../api/receiving';
import { hasKey, t } from '../i18n';

const requestMock = vi.mocked(request);

const OWN = '11111111-1111-4111-8111-111111111111';
const PO = '22222222-2222-4222-8222-222222222222';
const GR = '33333333-3333-4333-8333-333333333333';

const CREATE_BODY: GoodsReceiptCreate = { purchaseOrderId: PO, warehouseId: OWN, grossQtyKg: '250.000' };

const QC_BODY: QualityCheckCreate = {
  assignedGrade: 'GRADE_2',
  outcome: 'PARTIALLY_ACCEPTED',
  acceptedQtyKg: '220.000',
  rejectedQtyKg: '30.000',
  damagedQtyKg: '12.000',
  spoiledQtyKg: '8.000',
  rejectionReasonCode: 'PHYSICAL_DAMAGE',
  defectNotes: 'Bruising on 30 kg.',
  storageLocation: 'A-04-R2',
  items: [
    { parameter: 'APPEARANCE', passed: true, condition: 'GOOD' },
    { parameter: 'SIZE_UNIFORMITY', passed: true, condition: 'GOOD' },
    { parameter: 'MOISTURE', passed: true, condition: 'FAIR' },
    { parameter: 'DAMAGE_PEST', passed: false, condition: 'POOR' },
    { parameter: 'FRESHNESS', passed: true, condition: 'GOOD' },
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

  it('BR-122: sends q, from and to (the spec names, not fromDate / toDate)', async () => {
    await listPurchaseOrders({ q: 'tomato', from: '2026-10-20', to: '2026-10-26' });
    expect(lastCall()[0]).toBe('/admin/purchase-orders?q=tomato&from=2026-10-20&to=2026-10-26');
    expect(lastCall()[0]).not.toContain('fromDate');
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

  it('BR-122: sends q, from and to', async () => {
    await listGoodsReceipts({ q: 'GRN-2026', from: '2026-10-01', to: '2026-10-26' });
    expect(lastCall()[0]).toBe('/admin/goods-receipts?q=GRN-2026&from=2026-10-01&to=2026-10-26');
  });

  it('GETs /admin/goods-receipts/{id} (the detail with its quality check, BR-119)', async () => {
    await getGoodsReceipt(GR);
    expect(requestMock).toHaveBeenCalledWith(`/admin/goods-receipts/${GR}`, { method: 'GET', timeoutMs: ADMIN_REQUEST_TIMEOUT_MS });
  });
});

describe('getGoodsReceiptDocument (BR-124)', () => {
  it('GETs /admin/goods-receipts/{id}/document', async () => {
    await getGoodsReceiptDocument(GR);
    expect(requestMock).toHaveBeenCalledWith(`/admin/goods-receipts/${GR}/document`, {
      method: 'GET',
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });
});

describe('createGoodsReceipt', () => {
  it('POSTs the GoodsReceiptCreate body to /admin/goods-receipts with the Idempotency-Key (BR-118)', async () => {
    await createGoodsReceipt(CREATE_BODY, 'key-create-1');
    expect(requestMock).toHaveBeenCalledWith('/admin/goods-receipts', {
      method: 'POST',
      body: { purchaseOrderId: PO, warehouseId: OWN, grossQtyKg: '250.000' },
      idempotencyKey: 'key-create-1',
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
  });

  it('BR-123: sends the package count and unit together when given', async () => {
    await createGoodsReceipt({ ...CREATE_BODY, packageCount: 12, packageUnit: 'CRATE' }, 'key-create-2');
    expect(lastCall()[1]['body']).toEqual({ ...CREATE_BODY, packageCount: 12, packageUnit: 'CRATE' });
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
    for (const field of ['acceptedQtyKg', 'rejectedQtyKg', 'damagedQtyKg', 'spoiledQtyKg']) {
      expect(typeof body[field], field).toBe('string');
    }
  });
});

describe('goods receipt discrepancies (BR-121)', () => {
  it('GETs /admin/goods-receipts/{id}/discrepancies with cursor and limit', async () => {
    await listGoodsReceiptDiscrepancies(GR);
    expect(lastCall()[0]).toBe(`/admin/goods-receipts/${GR}/discrepancies`);
    await listGoodsReceiptDiscrepancies(GR, { cursor: 'c-3', limit: 50 });
    expect(lastCall()[0]).toBe(`/admin/goods-receipts/${GR}/discrepancies?cursor=c-3&limit=50`);
  });

  it('POSTs a report with the Idempotency-Key', async () => {
    const body = { type: 'QUANTITY' as const, expected: '500 kg', actual: '480 kg', note: 'Short by 20 kg.' };
    await createGoodsReceiptDiscrepancy(GR, body, 'key-dsc-1');
    expect(requestMock).toHaveBeenCalledWith(`/admin/goods-receipts/${GR}/discrepancies`, {
      method: 'POST',
      body,
      idempotencyKey: 'key-dsc-1',
      timeoutMs: ADMIN_REQUEST_TIMEOUT_MS,
    });
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

describe('ERROR_CODES and their messages', () => {
  it('lists the problem codes the receiving endpoints document, including the BR-118 key reuse', () => {
    expect([...ERROR_CODES].sort()).toEqual(
      [
        'CONFLICT',
        'COUNTER_LIMIT_REACHED',
        'COUNTER_OFFER_EXPIRED',
        'FORBIDDEN',
        'IDEMPOTENCY_KEY_REUSED',
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

  it('BR-118: IDEMPOTENCY_KEY_REUSED maps to its own message', () => {
    const key = adminErrorKey(problem('IDEMPOTENCY_KEY_REUSED', 409));
    expect(key).toBe('admin.error.IDEMPOTENCY_KEY_REUSED');
  });
});
