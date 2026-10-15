/**
 * screens/warehouse/inventory/adjustmentMappers.ts: the pure decisions behind
 * the stock count (BR-107) and stock adjustment (BR-37) screens.
 */
import { describe, expect, it } from 'vitest';
import { ApiError, NetworkError } from '../../../shell/api/client';
import type { StockAdjustmentDto } from '../api/stockAdjustments';
import type { StockVerificationDto } from '../api/stockVerifications';
import { t } from '../i18n';
import { makeCan } from '../permissions/can';
import { DEMO_ROLE_PERMISSIONS } from '../permissions/demoGrants';
import {
  adjustmentActions,
  adjustmentFilterOf,
  buildCreateAdjustmentBody,
  buildCreateVerificationBody,
  canRaiseAdjustment,
  directionsFor,
  nextPageNumber,
  rejectReasonOf,
  shortRef,
  stockActionErrorKey,
  toAdjustmentView,
  toVerificationView,
  type AdjustmentDraft,
} from '../screens/warehouse/inventory/adjustmentMappers';

const subCan = makeCan(DEMO_ROLE_PERMISSIONS.SUB_WH_ADMIN);
const mainCan = makeCan(DEMO_ROLE_PERMISSIONS.MAIN_WH_ADMIN);
const NOW = new Date('2026-10-15T06:00:00Z');
const BATCH = '22222222-2222-4222-8222-222222222222';
const CROP = '55555555-5555-4555-8555-555555555555';

function problem(code: string, status: number): ApiError {
  return new ApiError({ type: 'about:blank', title: code, status, code: code as never });
}

function adjustment(over: Partial<StockAdjustmentDto> = {}): StockAdjustmentDto {
  return {
    id: '3f2a9c1b-3333-4333-8333-333333333333',
    batchId: BATCH,
    batchCode: 'B-0001',
    warehouseId: '11111111-1111-4111-8111-111111111111',
    cropId: CROP,
    grade: 'GRADE_1',
    adjustmentType: 'DAMAGE',
    qtyDeltaKg: '-5.250',
    reason: 'Crushed crates',
    status: 'PENDING',
    createdBy: '66666666-6666-4666-8666-666666666666',
    createdAt: '2026-10-14T05:00:00Z',
    approvedBy: null,
    approvedAt: null,
    rejectedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    ledgerEntryId: null,
    verificationId: null,
    updatedAt: null,
    ...over,
  };
}

function verification(over: Partial<StockVerificationDto> = {}): StockVerificationDto {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    warehouseId: '11111111-1111-4111-8111-111111111111',
    batchId: BATCH,
    batchCode: 'B-0001',
    cropId: CROP,
    grade: 'GRADE_2',
    systemQtyKg: '100.000',
    countedQtyKg: '95.000',
    varianceKg: '-5.000',
    status: 'RECORDED',
    notes: null,
    verifiedBy: '66666666-6666-4666-8666-666666666666',
    verifiedAt: '2026-10-14T05:00:00Z',
    adjustmentId: null,
    adjustmentStatus: null,
    createdAt: '2026-10-14T05:00:00Z',
    updatedAt: null,
    ...over,
  };
}

const draft = (over: Partial<AdjustmentDraft> = {}): AdjustmentDraft => ({
  batchId: BATCH,
  type: 'DAMAGE',
  direction: 'remove',
  qtyText: '5.25',
  reason: 'Crushed crates',
  availableGrams: 100_000,
  ...over,
});

describe('toAdjustmentView', () => {
  it('maps the signed delta to integer grams and names the crop when known', () => {
    const view = toAdjustmentView(adjustment(), NOW, new Map([[CROP, 'Carrot']]));
    expect(view.deltaGrams).toBe(-5250);
    expect(view.deltaText).toContain('-5.25');
    expect(view.productLabel).toContain('Carrot');
    expect(view.statusTone).toBe('warning');
    expect(view.ref).toBe('3F2A9C1B');
    expect(view.decidedAt).toBeNull();
  });

  it('shows a positive count correction with a plus sign and an unreadable delta as empty', () => {
    expect(toAdjustmentView(adjustment({ adjustmentType: 'COUNT_CORRECTION', qtyDeltaKg: '2.000' }), NOW).deltaText).toMatch(/^\+2/);
    const bad = toAdjustmentView(adjustment({ qtyDeltaKg: '1e3' }), NOW);
    expect(bad.deltaGrams).toBeNull();
    expect(bad.deltaText).toBe('');
  });
});

describe('adjustmentActions', () => {
  it('BR-37a: a Sub admin is never offered Approve or Reject (it holds no approve grant)', () => {
    expect(adjustmentActions(subCan, { status: 'PENDING' })).toEqual({ approve: false, reject: false });
  });

  it('a Main admin is offered both on a PENDING adjustment only', () => {
    expect(adjustmentActions(mainCan, { status: 'PENDING' })).toEqual({ approve: true, reject: true });
    expect(adjustmentActions(mainCan, { status: 'APPROVED' })).toEqual({ approve: false, reject: false });
    expect(adjustmentActions(mainCan, { status: 'REJECTED' })).toEqual({ approve: false, reject: false });
  });
});

describe('stockActionErrorKey', () => {
  it('BR-37a: a self-approval refusal says why, in its own words, not the generic message', () => {
    const key = stockActionErrorKey(problem('SELF_APPROVAL_FORBIDDEN', 403));
    expect(key).toBe('stockAdj.error.selfApproval');
    expect(t(key)).not.toBe(key);
  });

  it('maps a decided adjustment, missing stock and a missing grant to their own messages', () => {
    expect(stockActionErrorKey(problem('INVALID_STATE_TRANSITION', 409))).toBe('stockAdj.error.state');
    expect(stockActionErrorKey(problem('STOCK_UNAVAILABLE', 409))).toBe('stockAdj.error.stockUnavailable');
    expect(stockActionErrorKey(problem('FORBIDDEN', 403))).toBe('stockAdj.error.forbidden');
  });

  it('falls back to the shared admin mapping for anything else', () => {
    expect(stockActionErrorKey(problem('VALIDATION_FAILED', 422))).toBe('admin.error.VALIDATION_FAILED');
    expect(stockActionErrorKey(new NetworkError('offline'))).toBe('admin.error.network');
    expect(stockActionErrorKey(new Error('x'))).toBe('admin.error.generic');
  });
});

describe('buildCreateAdjustmentBody (BR-37)', () => {
  it('signs a removal negative as a 3-decimal kg string, from integer grams', () => {
    expect(buildCreateAdjustmentBody(draft())).toEqual({
      ok: true,
      body: { batchId: BATCH, adjustmentType: 'DAMAGE', qtyDeltaKg: '-5.250', reason: 'Crushed crates' },
    });
  });

  it('lets only a count correction add stock', () => {
    expect(directionsFor('DAMAGE')).toEqual(['remove']);
    expect(directionsFor('SHRINKAGE')).toEqual(['remove']);
    expect(directionsFor('EXPIRY')).toEqual(['remove']);
    expect(directionsFor('COUNT_CORRECTION')).toEqual(['remove', 'add']);
    expect(buildCreateAdjustmentBody(draft({ direction: 'add' }))).toEqual({ ok: false, error: 'DIRECTION_NOT_ALLOWED' });
    const add = buildCreateAdjustmentBody(draft({ type: 'COUNT_CORRECTION', direction: 'add', qtyText: '0.1' }));
    expect(add).toMatchObject({ ok: true, body: { qtyDeltaKg: '0.100' } });
  });

  it('refuses a missing batch, a bad or zero quantity, an over-removal and a bad reason', () => {
    expect(buildCreateAdjustmentBody(draft({ batchId: undefined }))).toEqual({ ok: false, error: 'BATCH_REQUIRED' });
    for (const qtyText of ['', '0', '-1', '1.2345', 'abc']) {
      expect({ qtyText, r: buildCreateAdjustmentBody(draft({ qtyText })) }).toEqual({ qtyText, r: { ok: false, error: 'QTY_INVALID' } });
    }
    expect(buildCreateAdjustmentBody(draft({ qtyText: '100.001' }))).toEqual({ ok: false, error: 'QTY_ABOVE_AVAILABLE' });
    expect(buildCreateAdjustmentBody(draft({ qtyText: '100' }))).toMatchObject({ ok: true });
    expect(buildCreateAdjustmentBody(draft({ reason: '  abcd ' }))).toEqual({ ok: false, error: 'REASON_TOO_SHORT' });
    expect(buildCreateAdjustmentBody(draft({ reason: 'x'.repeat(501) }))).toEqual({ ok: false, error: 'REASON_TOO_LONG' });
  });
});

describe('rejectReasonOf', () => {
  it('trims and accepts 1-500 characters', () => {
    expect(rejectReasonOf('  no ')).toBe('no');
    expect(rejectReasonOf('   ')).toBeNull();
    expect(rejectReasonOf('x'.repeat(501))).toBeNull();
  });
});

describe('verifications (BR-107)', () => {
  it('BR-107: shows the server snapshot and variance as integer grams, never recomputing them', () => {
    // The server's variance wins even if it disagrees with counted - system.
    const view = toVerificationView(verification({ varianceKg: '-4.999' }), NOW);
    expect(view.systemGrams).toBe(100_000);
    expect(view.countedGrams).toBe(95_000);
    expect(view.varianceGrams).toBe(-4999);
    expect(view.statusTone).toBe('warning');
  });

  it('BR-107: a recorded count with a variance can be raised, once, with the create grant', () => {
    const view = toVerificationView(verification(), NOW);
    expect(canRaiseAdjustment(subCan, view)).toBe(true);
    expect(canRaiseAdjustment(mainCan, view)).toBe(true);
    expect(canRaiseAdjustment(() => false, view)).toBe(false);
    expect(canRaiseAdjustment(mainCan, { ...view, adjustmentId: 'x' })).toBe(false);
    expect(canRaiseAdjustment(mainCan, { ...view, status: 'RECONCILED' })).toBe(false);
    expect(canRaiseAdjustment(mainCan, { ...view, varianceGrams: 0 })).toBe(false);
  });

  it('a matching count is shown as reconciled with a zero variance', () => {
    const view = toVerificationView(verification({ countedQtyKg: '100.000', varianceKg: '0.000', status: 'RECONCILED' }), NOW);
    expect(view.varianceGrams).toBe(0);
    expect(view.statusTone).toBe('success');
    expect(view.varianceText).not.toMatch(/^[+-]/);
  });

  it('BR-107: the record body carries only the counted kg (zero allowed) and trimmed notes', () => {
    expect(buildCreateVerificationBody({ batchId: BATCH, countedText: '95', notes: '' })).toEqual({
      ok: true,
      body: { batchId: BATCH, countedQtyKg: '95.000' },
    });
    expect(buildCreateVerificationBody({ batchId: BATCH, countedText: '0', notes: ' shelf empty ' })).toEqual({
      ok: true,
      body: { batchId: BATCH, countedQtyKg: '0.000', notes: 'shelf empty' },
    });
    expect(buildCreateVerificationBody({ batchId: undefined, countedText: '1', notes: '' })).toEqual({ ok: false, error: 'BATCH_REQUIRED' });
    expect(buildCreateVerificationBody({ batchId: BATCH, countedText: '-1', notes: '' })).toEqual({ ok: false, error: 'COUNT_INVALID' });
    expect(buildCreateVerificationBody({ batchId: BATCH, countedText: '', notes: '' })).toEqual({ ok: false, error: 'COUNT_INVALID' });
    expect(buildCreateVerificationBody({ batchId: BATCH, countedText: '1', notes: 'x'.repeat(1001) })).toEqual({
      ok: false,
      error: 'NOTES_TOO_LONG',
    });
  });
});

describe('helpers', () => {
  it('pages an offset list to its total', () => {
    expect(nextPageNumber({ page: 1, pageSize: 20, total: 41, items: [1] })).toBe(2);
    expect(nextPageNumber({ page: 3, pageSize: 20, total: 41, items: [1] })).toBeUndefined();
    expect(nextPageNumber({ page: 1, pageSize: 20, total: 41, items: [] })).toBeUndefined();
  });

  it('reads a status filter route param', () => {
    expect(adjustmentFilterOf('PENDING')).toBe('PENDING');
    expect(adjustmentFilterOf('bogus')).toBe('ALL');
    expect(adjustmentFilterOf(undefined)).toBe('ALL');
  });

  it('shortRef is the first 8 hex digits, upper case', () => {
    expect(shortRef('abcdef12-0000-4000-8000-000000000000')).toBe('ABCDEF12');
  });
});
