import { beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ApiError, NetworkError } from '../../../shell/api/client';
import { AdminTimeoutError } from '../api/http';
import {
  RETURN_ITEM_CONDITIONS,
  RETURN_STATUSES,
  type ReturnRefundResultDto,
  type ReturnRequestDto,
  type ReturnStatusHistoryEntryDto,
} from '../api/returns';
import { isTranslationKey } from '../i18n';
import { createAdminCan } from '../rbac/permissions';
import {
  REJECT_REASON_MAX_LENGTH,
  RETURN_STATUS_FILTERS,
  emptyInspectionForm,
  refundIdempotencyFingerprint,
  refundInvalidationKeys,
  returnActions,
  returnConditionLabelKey,
  returnHistoryKey,
  returnRefundErrorKey,
  returnStatusMeta,
  returnTransitionInvalidationKeys,
  returnWriteErrorKey,
  toRefundResult,
  toReturnDetail,
  toReturnHistoryEntry,
  toReturnRow,
  validateInspectionForm,
  validateRejectReason,
} from '../screens/warehouse/returns/mappers';

const WAREHOUSE = '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01';
const RETURN_ID = '0a1b2c3d-4e5f-4061-8728-394a5b6c7d8e';
const ITEM_A = '5d6e7f80-9a1b-4c2d-8e3f-4a5b6c7d8e9f';
const ITEM_B = '5d6e7f80-9a1b-4c2d-8e3f-000000000000';

function dto(over: Partial<ReturnRequestDto> = {}): ReturnRequestDto {
  return {
    id: RETURN_ID,
    orderId: '1b2c3d4e-5f60-4172-8839-4a5b6c7d8e9f',
    customerId: '6f0c2d1e-1111-4222-8333-944455556666',
    warehouseId: WAREHOUSE,
    status: 'PENDING',
    reason: 'Leaves wilted',
    note: 'Customer brought it back to the counter',
    createdAt: '2026-10-12T05:30:00.000Z',
    updatedAt: null,
    items: [
      {
        id: '7e8f9a0b-1c2d-4e3f-8a4b-5c6d7e8f9a0b',
        orderItemId: ITEM_A,
        requestedQty: '1.500',
        acceptedQty: null,
        damagedQty: null,
        condition: null,
      },
      {
        id: '7e8f9a0b-1c2d-4e3f-8a4b-000000000000',
        orderItemId: ITEM_B,
        requestedQty: '0.250',
        acceptedQty: null,
        damagedQty: null,
        condition: null,
      },
    ],
    ...over,
  };
}

function problem(code: string, status: number): ApiError {
  return new ApiError({ type: 'about:blank', title: code, status, code } as never);
}

function grantsOf(role: string): string[] {
  const rbac = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../../../../../../docs/rbac.json'), 'utf8'),
  ) as { permissions: { code: string; grants: Record<string, string> }[] };
  return rbac.permissions.filter((p) => (p.grants[role] ?? 'none') !== 'none').map((p) => p.code);
}

const subCan = createAdminCan(grantsOf('SUB_WH_ADMIN'));
const superCan = createAdminCan(grantsOf('SUPER_ADMIN'));

describe('returns status / condition labels', () => {
  it('maps every ReturnStatus to a real catalogue key, and an unknown status to a fallback', () => {
    for (const s of RETURN_STATUSES) {
      const meta = returnStatusMeta(s);
      expect(isTranslationKey(meta.labelKey), s).toBe(true);
      expect(meta.labelKey).toBe(`admin.returns.status.${s}`);
    }
    expect(returnStatusMeta('ON_HOLD').labelKey).toBe('admin.returns.status.unknown');
    expect(isTranslationKey(returnStatusMeta('ON_HOLD').labelKey)).toBe(true);
  });

  it('maps every ReturnItemCondition (GOOD/DAMAGED/SPOILED) and falls back for an unknown one', () => {
    for (const c of RETURN_ITEM_CONDITIONS) {
      expect(returnConditionLabelKey(c)).toBe(`admin.returns.condition.${c}`);
      expect(isTranslationKey(returnConditionLabelKey(c))).toBe(true);
    }
    expect(returnConditionLabelKey('MOULDY')).toBe('admin.returns.condition.unknown');
    expect(isTranslationKey('admin.returns.condition.unknown')).toBe(true);
  });

  it('the status filter is "All" plus every API status (the list endpoint filters by status)', () => {
    expect(RETURN_STATUS_FILTERS).toEqual([undefined, ...RETURN_STATUSES]);
  });
});

describe('toReturnRow / toReturnDetail — allow-listed screen models', () => {
  it('copies only the listed fields; quantities become integer grams; nulls stay null', () => {
    const d = toReturnDetail({
      ...dto({ updatedAt: '2026-10-12T07:00:00.000Z' }),
      customerName: 'Meena R',
      customerMobile: '9876543210',
      farmerId: 'f-1',
    } as never);
    expect(d.id).toBe(RETURN_ID);
    expect(d.status.labelKey).toBe('admin.returns.status.PENDING');
    expect(d.statusCode).toBe('PENDING');
    expect(d.reason).toBe('Leaves wilted');
    expect(d.note).toBe('Customer brought it back to the counter');
    expect(d.createdAtLabel).toEqual(expect.any(String));
    expect(d.updatedAtLabel).toEqual(expect.any(String));
    expect(d.items[0]).toEqual({
      id: '7e8f9a0b-1c2d-4e3f-8a4b-5c6d7e8f9a0b',
      orderItemId: ITEM_A,
      requestedGrams: 1500,
      acceptedGrams: null,
      damagedGrams: null,
      conditionKey: null,
    });
    // Nothing the API did not send for this scope is invented, and nothing extra leaks through.
    const json = JSON.stringify(d);
    expect(json).not.toContain('Meena');
    expect(json).not.toContain('9876543210');
    expect(json).not.toContain('farmerId');
  });

  it('an inspected item carries its accepted/damaged grams and condition label', () => {
    const d = toReturnDetail(
      dto({
        status: 'INSPECTED',
        items: [
          {
            id: 'i1',
            orderItemId: ITEM_A,
            requestedQty: '1.500',
            acceptedQty: '1.250',
            damagedQty: '0.250',
            condition: 'DAMAGED',
          },
        ],
      }),
    );
    expect(d.items[0]).toMatchObject({
      requestedGrams: 1500,
      acceptedGrams: 1250,
      damagedGrams: 250,
      conditionKey: 'admin.returns.condition.DAMAGED',
    });
  });

  it('a row keeps the status code for gating and an unknown status still renders', () => {
    const row = toReturnRow({ ...dto(), status: 'ON_HOLD' as never });
    expect(row.statusCode).toBe('ON_HOLD');
    expect(row.status.labelKey).toBe('admin.returns.status.unknown');
  });
});

describe('toReturnHistoryEntry — real /history entries only', () => {
  it('maps from/to status labels; the first entry has no from-status', () => {
    const entry: ReturnStatusHistoryEntryDto = {
      id: 'h1',
      returnRequestId: RETURN_ID,
      fromStatus: null,
      toStatus: 'PENDING',
      changedBy: null,
      note: null,
      createdAt: '2026-10-12T05:30:00.000Z',
    };
    const e = toReturnHistoryEntry(entry);
    expect(e.from).toBeNull();
    expect(e.to.labelKey).toBe('admin.returns.status.PENDING');
    expect(e.note).toBeNull();
    expect(e.createdAtLabel).toEqual(expect.any(String));

    const e2 = toReturnHistoryEntry({ ...entry, id: 'h2', fromStatus: 'INSPECTED', toStatus: 'REJECTED', note: 'Outside window' });
    expect(e2.from?.labelKey).toBe('admin.returns.status.INSPECTED');
    expect(e2.to.labelKey).toBe('admin.returns.status.REJECTED');
    expect(e2.note).toBe('Outside window');
  });
});

describe('returnActions — state-transition visibility per status (BR-61)', () => {
  it('PENDING: inspect and reject only — never approve or refund', () => {
    expect(returnActions('PENDING', subCan)).toEqual({
      inspect: true,
      approve: false,
      reject: true,
      refundWallet: false,
    });
  });

  it('BR-61: approve is offered ONLY after inspection (INSPECTED), alongside reject', () => {
    expect(returnActions('INSPECTED', subCan)).toEqual({
      inspect: false,
      approve: true,
      reject: true,
      refundWallet: false,
    });
  });

  it('BR-61: APPROVED offers the wallet refund only (approve again / reject are impossible server-side)', () => {
    expect(returnActions('APPROVED', subCan)).toEqual({
      inspect: false,
      approve: false,
      reject: false,
      refundWallet: true,
    });
  });

  it('BR-61: REJECTED, REFUNDED and REFUND_PENDING_BANK are terminal — no action, so nothing can refund twice', () => {
    const none = { inspect: false, approve: false, reject: false, refundWallet: false };
    expect(returnActions('REJECTED', subCan)).toEqual(none);
    expect(returnActions('REFUNDED', subCan)).toEqual(none);
    expect(returnActions('REFUND_PENDING_BANK', subCan)).toEqual(none);
    expect(returnActions('ON_HOLD', subCan)).toEqual(none);
  });

  it('every action is also gated by its rbac.json permission (none without the grants)', () => {
    const none = { inspect: false, approve: false, reject: false, refundWallet: false };
    const nobody = createAdminCan(['rma.request.process']);
    for (const s of RETURN_STATUSES) expect(returnActions(s, nobody), s).toEqual(none);
    expect(returnActions('PENDING', createAdminCan(['rma.request.process', 'inventory.quality_check.perform']))).toMatchObject({ inspect: true, reject: false });
    expect(returnActions('INSPECTED', createAdminCan(['rma.request.process', 'rma.refund.approve']))).toMatchObject({ approve: true, reject: true });
    expect(returnActions('APPROVED', createAdminCan(['rma.request.process', 'rma.refund.wallet_process']))).toMatchObject({ refundWallet: true });
  });

  it('BR-61: no bank-refund action exists at all, even for a Super Admin holding rma.refund.bank_process', () => {
    expect(superCan('rma.refund.bank_process')).toBe(true);
    expect(Object.keys(returnActions('APPROVED', superCan)).sort()).toEqual(
      ['approve', 'inspect', 'refundWallet', 'reject'].sort(),
    );
  });

  it('a Sub Warehouse Admin (docs/rbac.json) holds every grant the queue needs, and none for bank refunds', () => {
    for (const code of [
      'rma.request.process',
      'inventory.quality_check.perform',
      'rma.refund.approve',
      'rma.refund.wallet_process',
    ] as const) {
      expect(subCan(code), code).toBe(true);
    }
    expect(subCan('rma.refund.bank_process')).toBe(false);
  });
});

describe('validateInspectionForm — POST /inspect body (BR-61)', () => {
  // Built per test (not at collection time) so a broken mapper fails the test, not the suite.
  let detail: ReturnType<typeof toReturnDetail>;
  beforeEach(() => {
    detail = toReturnDetail(dto());
  });

  it('requires a condition and a valid accepted quantity for EVERY item', () => {
    const r = validateInspectionForm(detail, emptyInspectionForm(detail));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors[ITEM_A]?.condition).toBe('admin.returns.inspect.errors.conditionRequired');
      expect(r.errors[ITEM_A]?.accepted).toBe('admin.returns.inspect.errors.qtyInvalid');
      expect(r.errors[ITEM_B]?.condition).toBe('admin.returns.inspect.errors.conditionRequired');
    }
  });

  it('builds the wire body with 3-decimal Quantity strings; an empty damaged qty is 0.000', () => {
    const form = emptyInspectionForm(detail);
    form[ITEM_A] = { condition: 'DAMAGED', acceptedText: '1.25', damagedText: '0.25' };
    form[ITEM_B] = { condition: 'GOOD', acceptedText: '0.250', damagedText: '' };
    const r = validateInspectionForm(detail, form);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.body).toEqual({
        items: [
          { orderItemId: ITEM_A, condition: 'DAMAGED', acceptedQty: '1.250', damagedQty: '0.250' },
          { orderItemId: ITEM_B, condition: 'GOOD', acceptedQty: '0.250', damagedQty: '0.000' },
        ],
      });
    }
  });

  it('accepts zero (e.g. a SPOILED item nothing of which is accepted) but refuses negative, malformed or 4-decimal quantities', () => {
    const form = emptyInspectionForm(detail);
    form[ITEM_B] = { condition: 'GOOD', acceptedText: '0.250', damagedText: '' };
    form[ITEM_A] = { condition: 'SPOILED', acceptedText: '0', damagedText: '1.5' };
    expect(validateInspectionForm(detail, form).ok).toBe(true);
    for (const bad of ['-1', 'abc', '1.2345', '1e2']) {
      form[ITEM_A] = { condition: 'SPOILED', acceptedText: bad, damagedText: '' };
      const r = validateInspectionForm(detail, form);
      expect(r.ok, bad).toBe(false);
      if (!r.ok) expect(r.errors[ITEM_A]?.accepted, bad).toBe('admin.returns.inspect.errors.qtyInvalid');
    }
  });

  it('refuses an accepted or damaged quantity above what the customer asked to return (the refund is accepted qty x price)', () => {
    const form = emptyInspectionForm(detail);
    form[ITEM_B] = { condition: 'GOOD', acceptedText: '0.250', damagedText: '' };
    form[ITEM_A] = { condition: 'GOOD', acceptedText: '1.501', damagedText: '' };
    let r = validateInspectionForm(detail, form);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[ITEM_A]?.accepted).toBe('admin.returns.inspect.errors.qtyAboveRequested');
    form[ITEM_A] = { condition: 'DAMAGED', acceptedText: '1.000', damagedText: '1.600' };
    r = validateInspectionForm(detail, form);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[ITEM_A]?.damaged).toBe('admin.returns.inspect.errors.qtyAboveRequested');
  });
});

describe('validateRejectReason — ReturnRejectCreate.reason 1..300', () => {
  it('trims, requires text and caps at the contract length', () => {
    expect(validateRejectReason('  Outside window  ')).toEqual({ ok: true, reason: 'Outside window' });
    expect(validateRejectReason('   ')).toEqual({ ok: false, errorKey: 'admin.returns.reject.errors.required' });
    expect(validateRejectReason('x'.repeat(REJECT_REASON_MAX_LENGTH))).toMatchObject({ ok: true });
    expect(validateRejectReason('x'.repeat(REJECT_REASON_MAX_LENGTH + 1))).toEqual({
      ok: false,
      errorKey: 'admin.returns.reject.errors.tooLong',
    });
    expect(REJECT_REASON_MAX_LENGTH).toBe(300);
  });
});

describe('wallet refund — key, invalidation, result (BR-61)', () => {
  it('the idempotency fingerprint is the return id: the same return replays the same key', () => {
    expect(refundIdempotencyFingerprint(RETURN_ID)).toEqual({ returnId: RETURN_ID, refund: 'wallet' });
  });

  it('a refund invalidates the returns list/detail/history and the wallet + customer caches, under this warehouse', () => {
    expect(refundInvalidationKeys(WAREHOUSE)).toEqual([
      ['admin', 'wh', WAREHOUSE, 'returns'],
      ['admin', 'wh', WAREHOUSE, 'wallet'],
      ['admin', 'wh', WAREHOUSE, 'customers'],
    ]);
    expect(returnTransitionInvalidationKeys(WAREHOUSE)).toEqual([['admin', 'wh', WAREHOUSE, 'returns']]);
    // History lives under the returns prefix, so the same invalidation refreshes it.
    expect(returnHistoryKey(WAREHOUSE, RETURN_ID).slice(0, 4)).toEqual(['admin', 'wh', WAREHOUSE, 'returns']);
  });

  it('the amount becomes integer paise; a malformed server amount throws instead of rounding', () => {
    const result: ReturnRefundResultDto = {
      returnRequest: { ...dto(), status: 'REFUNDED' },
      walletTransactionId: '9e8d7c6b-5a49-4382-8716-a5b4c3d2e1f0',
      amount: '112.50',
    };
    const r = toRefundResult(result);
    expect(r.amountPaise).toBe(11250);
    expect(r.walletTransactionId).toBe('9e8d7c6b-5a49-4382-8716-a5b4c3d2e1f0');
    expect(r.detail.statusCode).toBe('REFUNDED');
    expect(() => toRefundResult({ ...result, amount: '112.505' })).toThrow();
  });
});

describe('returns error copy', () => {
  it('a stale status (409 INVALID_STATE_TRANSITION) and a 404 get returns-specific copy', () => {
    expect(returnWriteErrorKey(problem('INVALID_STATE_TRANSITION', 409))).toBe('admin.returns.errors.INVALID_STATE_TRANSITION');
    expect(returnWriteErrorKey(problem('NOT_FOUND', 404))).toBe('admin.returns.errors.NOT_FOUND');
    expect(returnWriteErrorKey(problem('FORBIDDEN', 403))).toBe('admin.errors.FORBIDDEN');
  });

  it('a refund whose outcome is unknown (network/timeout) says it may have gone through and that retrying is safe', () => {
    expect(returnRefundErrorKey(new NetworkError('x'))).toBe('admin.returns.refund.errors.uncertain');
    expect(returnRefundErrorKey(new AdminTimeoutError(20000))).toBe('admin.returns.refund.errors.uncertain');
    expect(returnRefundErrorKey(problem('VALIDATION_FAILED', 422))).toBe('admin.returns.refund.errors.VALIDATION_FAILED');
    expect(returnRefundErrorKey(problem('INVALID_STATE_TRANSITION', 409))).toBe('admin.returns.errors.INVALID_STATE_TRANSITION');
  });

  it('every key the returns mappers can produce is in the catalogue', () => {
    const keys = [
      returnWriteErrorKey(problem('INVALID_STATE_TRANSITION', 409)),
      returnWriteErrorKey(problem('NOT_FOUND', 404)),
      returnRefundErrorKey(new NetworkError('x')),
      returnRefundErrorKey(problem('VALIDATION_FAILED', 422)),
      'admin.returns.inspect.errors.conditionRequired',
      'admin.returns.inspect.errors.qtyInvalid',
      'admin.returns.inspect.errors.qtyAboveRequested',
      'admin.returns.reject.errors.required',
      'admin.returns.reject.errors.tooLong',
    ];
    for (const k of keys) expect(isTranslationKey(k), k).toBe(true);
  });
});
