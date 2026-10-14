/**
 * screens/warehouse/returns-rma/mappers.ts (plan phase 10): the return (RMA)
 * API shapes turned into what the returns screens draw, and the rules the
 * screens act on.
 *
 * BR-61: approve is offered only for an INSPECTED return, inspect only for a
 * PENDING one, reject from PENDING or INSPECTED, the wallet refund only for an
 * APPROVED one; the bank refund is never offered (rma.refund.bank_process is
 * `none` for both warehouse roles). Quantities are integer grams and money is
 * integer paise, never floats; statuses and conditions go through exhaustive
 * tables with a fallback.
 */
import { describe, expect, it } from 'vitest';
import { ApiError, NetworkError } from '../../../shell/api/client';
import { createIdempotencyKeyCache } from '../../../shell/api/idempotency';
import { bodyFingerprint } from '../api/hookHelpers';
import type { ReturnHistoryEntryDto, ReturnRefundResultDto, ReturnRequestDto, ReturnStatus } from '../api/returns';
import {
  CONDITION_FROM_API,
  CONDITION_TO_API,
  RETURN_HISTORY_FILTERS,
  RETURN_QUEUE_FILTERS,
  RETURN_STATUS_VIEW,
  approveGate,
  conditionLabel,
  inspectionBody,
  refundAmountPaise,
  refundIdempotencyFingerprint,
  returnActions,
  returnIdParam,
  returnRefundErrorKey,
  returnReference,
  returnStatusView,
  returnWriteErrorKey,
  toRefundResult,
  toReturnDetail,
  toReturnRow,
  toReturnTimeline,
  totalAcceptedGrams,
  validateRejectReason,
} from '../screens/warehouse/returns-rma/mappers';
import type { ReturnItemView } from '../screens/warehouse/returns-rma/types';

const RETURN_ID = '7a7a7a7a-1111-4222-8333-444455556666';
const ORDER_ID = '1b1b1b1b-1111-4222-8333-444455556666';
const ITEM_A = '5c5c5c5c-1111-4222-8333-444455556666';
const ITEM_B = '6d6d6d6d-1111-4222-8333-444455556666';
// 2026-10-13 10:00 IST.
const NOW = new Date('2026-10-13T04:30:00.000Z');

const ALL_STATUSES: ReturnStatus[] = ['PENDING', 'INSPECTED', 'APPROVED', 'REJECTED', 'REFUND_PENDING_BANK', 'REFUNDED'];

function grants(...codes: string[]) {
  return (code: string) => codes.includes(code);
}
const SUB_CAN = grants('rma.request.process', 'inventory.quality_check.perform', 'rma.refund.approve', 'rma.refund.wallet_process');

const RETURN: ReturnRequestDto = {
  id: RETURN_ID,
  orderId: ORDER_ID,
  customerId: '2c2c2c2c-1111-4222-8333-444455556666',
  warehouseId: '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01',
  status: 'PENDING',
  reason: 'Leaves wilted on arrival',
  note: null,
  createdAt: '2026-10-13T03:00:00.000Z',
  updatedAt: null,
  items: [
    { id: 'i1', orderItemId: ITEM_A, requestedQty: '2.000', acceptedQty: null, damagedQty: null, condition: null },
    { id: 'i2', orderItemId: ITEM_B, requestedQty: '0.750', acceptedQty: '0.500', damagedQty: '0.250', condition: 'DAMAGED' },
  ],
};

describe('status table', () => {
  it('every ReturnStatus has a label and tone', () => {
    expect(Object.keys(RETURN_STATUS_VIEW).sort()).toEqual([...ALL_STATUSES].sort());
    expect(returnStatusView('PENDING').label).toBe('New');
    expect(returnStatusView('INSPECTED').label).toBe('Inspected');
    expect(returnStatusView('APPROVED').label).toBe('Approved');
    expect(returnStatusView('REJECTED').label).toBe('Rejected');
    expect(returnStatusView('REFUND_PENDING_BANK').label).toBe('Bank Refund Pending');
    expect(returnStatusView('REFUNDED').label).toBe('Refunded');
  });

  it('an unknown status falls back explicitly (never a crash, never a guessed state)', () => {
    const view = returnStatusView('ESCALATED');
    expect(view.label).toBe('Unknown');
    expect(view.tone).toBe('warning');
  });
});

describe('conditions (GOOD / DAMAGED / SPOILED)', () => {
  it('map 1:1 to the design labels and back, without changing the API values', () => {
    expect(CONDITION_FROM_API).toEqual({ GOOD: 'Acceptable', DAMAGED: 'Damaged', SPOILED: 'Spoiled' });
    expect(CONDITION_TO_API).toEqual({ Acceptable: 'GOOD', Damaged: 'DAMAGED', Spoiled: 'SPOILED' });
  });
});

describe('returnReference', () => {
  it('is RET- plus the first 8 hex characters of the id, upper-cased (the BR-91h display label)', () => {
    expect(returnReference(RETURN_ID)).toBe('RET-7A7A7A7A');
  });
});

describe('BR-61: which action is offered in which state', () => {
  it('inspect only for PENDING, approve only for INSPECTED, reject from PENDING or INSPECTED, refund only for APPROVED', () => {
    const table = Object.fromEntries(ALL_STATUSES.map((status) => [status, returnActions(status, SUB_CAN)]));
    expect(table).toEqual({
      PENDING: { inspect: true, approve: false, reject: true, refundWallet: false },
      INSPECTED: { inspect: false, approve: true, reject: true, refundWallet: false },
      APPROVED: { inspect: false, approve: false, reject: false, refundWallet: true },
      REJECTED: { inspect: false, approve: false, reject: false, refundWallet: false },
      REFUND_PENDING_BANK: { inspect: false, approve: false, reject: false, refundWallet: false },
      REFUNDED: { inspect: false, approve: false, reject: false, refundWallet: false },
    });
  });

  it('BR-61: approve is never offered before inspection, whatever the permissions', () => {
    const everything = () => true;
    expect(returnActions('PENDING', everything).approve).toBe(false);
  });

  it('each action also needs its docs/rbac.json code', () => {
    const none = grants();
    expect(returnActions('PENDING', none)).toEqual({ inspect: false, approve: false, reject: false, refundWallet: false });
    expect(returnActions('INSPECTED', grants('inventory.quality_check.perform')).approve).toBe(false);
    expect(returnActions('APPROVED', grants('rma.refund.approve')).refundWallet).toBe(false);
  });

  it('an unknown status offers nothing', () => {
    expect(returnActions('ESCALATED' as ReturnStatus, SUB_CAN)).toEqual({ inspect: false, approve: false, reject: false, refundWallet: false });
  });

  it('there is no bank refund action at all', () => {
    expect(Object.keys(returnActions('APPROVED', () => true))).not.toContain('refundBank');
  });
});

describe('toReturnRow / toReturnDetail', () => {
  it('maps a queue row', () => {
    expect(toReturnRow(RETURN, NOW)).toEqual({
      id: RETURN_ID,
      reference: 'RET-7A7A7A7A',
      orderId: ORDER_ID,
      status: 'PENDING',
      statusLabel: 'New',
      statusTone: 'warning',
      reason: 'Leaves wilted on arrival',
      note: null,
      created: 'Today · 08:30 AM',
    });
  });

  it('maps every item in integer grams; an item not yet inspected has no accepted / damaged / condition', () => {
    const detail = toReturnDetail(RETURN, NOW);
    expect(detail.items).toEqual([
      { orderItemId: ITEM_A, requestedGrams: 2000, acceptedGrams: null, damagedGrams: null, condition: null },
      { orderItemId: ITEM_B, requestedGrams: 750, acceptedGrams: 500, damagedGrams: 250, condition: 'Damaged' },
    ]);
  });

  it('a condition the app does not know stays unknown (null), never guessed', () => {
    const odd = { ...RETURN, items: [{ ...RETURN.items[0]!, acceptedQty: '1.000', damagedQty: '0.000', condition: 'MOULDY' as 'GOOD' }] };
    expect(toReturnDetail(odd, NOW).items[0]?.condition).toBeNull();
  });
});

describe('inspectionBody (BR-61; return_request_items CHECK: accepted + damaged <= requested)', () => {
  const items = toReturnDetail(RETURN, NOW).items;

  it('builds one row per item with the API condition and kg strings', () => {
    const result = inspectionBody(items, {
      [ITEM_A]: { condition: 'Acceptable', accepted: '1.8', damaged: '0.2' },
      [ITEM_B]: { condition: 'Spoiled', accepted: '0', damaged: '' },
    });
    expect(result).toEqual({
      ok: true,
      body: {
        items: [
          { orderItemId: ITEM_A, condition: 'GOOD', acceptedQty: '1.800', damagedQty: '0.200' },
          { orderItemId: ITEM_B, condition: 'SPOILED', acceptedQty: '0.000', damagedQty: '0.000' },
        ],
      },
    });
  });

  it('every item needs a condition and an accepted quantity; the error is pinned to the item', () => {
    expect(inspectionBody(items, { [ITEM_A]: { condition: 'Acceptable', accepted: '1', damaged: '' } })).toEqual({
      ok: false,
      errorKey: 'returns.inspect.error.incomplete',
      itemErrors: { [ITEM_B]: 'returns.inspect.error.incomplete' },
    });
    expect(
      inspectionBody(items, {
        [ITEM_A]: { condition: undefined, accepted: '1', damaged: '' },
        [ITEM_B]: { condition: 'Damaged', accepted: '0.5', damaged: '' },
      }),
    ).toEqual({ ok: false, errorKey: 'returns.inspect.error.incomplete', itemErrors: { [ITEM_A]: 'returns.inspect.error.incomplete' } });
  });

  it('a quantity that is not a kg amount with at most 3 decimals is refused', () => {
    for (const accepted of ['abc', '1.2345', '-1', '1e3']) {
      expect(
        inspectionBody(items, {
          [ITEM_A]: { condition: 'Acceptable', accepted, damaged: '' },
          [ITEM_B]: { condition: 'Damaged', accepted: '0.5', damaged: '' },
        }),
      ).toEqual({ ok: false, errorKey: 'returns.inspect.error.quantity', itemErrors: { [ITEM_A]: 'returns.inspect.error.quantity' } });
    }
  });

  it('accepted + damaged may not exceed the requested quantity, exactly, in grams', () => {
    const over = inspectionBody(items, {
      [ITEM_A]: { condition: 'Acceptable', accepted: '1.999', damaged: '0.002' },
      [ITEM_B]: { condition: 'Damaged', accepted: '0.5', damaged: '' },
    });
    expect(over).toEqual({
      ok: false,
      errorKey: 'returns.inspect.error.overRequested',
      itemErrors: { [ITEM_A]: 'returns.inspect.error.overRequested' },
    });
    const exact = inspectionBody(items, {
      [ITEM_A]: { condition: 'Acceptable', accepted: '1.999', damaged: '0.001' },
      [ITEM_B]: { condition: 'Damaged', accepted: '0.1', damaged: '0.2' },
    });
    expect(exact.ok).toBe(true);
  });

  it('reports every bad item at once, not just the first', () => {
    const result = inspectionBody(items, {
      [ITEM_A]: { condition: undefined, accepted: '', damaged: '' },
      [ITEM_B]: { condition: 'Damaged', accepted: '0.5', damaged: '0.5' },
    });
    expect(result).toEqual({
      ok: false,
      errorKey: 'returns.inspect.error.incomplete',
      itemErrors: { [ITEM_A]: 'returns.inspect.error.incomplete', [ITEM_B]: 'returns.inspect.error.overRequested' },
    });
  });
});

describe('BR-61: inspection quantities are validated SUMMED per item (return_request_items_qty_balance_chk)', () => {
  // db/migrations/0046_returns.sql: CHECK (accepted_qty + damaged_qty <= requested_qty + 0.001).
  // Validating accepted <= requested and damaged <= requested separately let this
  // through on the phone and the insert then failed on the server with a 500.
  const two: ReturnItemView[] = [{ orderItemId: ITEM_A, requestedGrams: 2000, acceptedGrams: null, damagedGrams: null, condition: null }];

  it('BR-61: requested 2, accepted 2, damaged 1 is refused (each alone fits, the sum does not)', () => {
    expect(inspectionBody(two, { [ITEM_A]: { condition: 'Damaged', accepted: '2', damaged: '1' } })).toEqual({
      ok: false,
      errorKey: 'returns.inspect.error.overRequested',
      itemErrors: { [ITEM_A]: 'returns.inspect.error.overRequested' },
    });
  });

  it('BR-61: requested 2, accepted 1.5, damaged 0.5 passes (the sum is exactly the requested quantity)', () => {
    expect(inspectionBody(two, { [ITEM_A]: { condition: 'Damaged', accepted: '1.5', damaged: '0.5' } })).toEqual({
      ok: true,
      body: { items: [{ orderItemId: ITEM_A, condition: 'DAMAGED', acceptedQty: '1.500', damagedQty: '0.500' }] },
    });
  });

  it('BR-61: the check is per item, so one item cannot borrow headroom from another', () => {
    const pair: ReturnItemView[] = [
      { orderItemId: ITEM_A, requestedGrams: 2000, acceptedGrams: null, damagedGrams: null, condition: null },
      { orderItemId: ITEM_B, requestedGrams: 2000, acceptedGrams: null, damagedGrams: null, condition: null },
    ];
    const result = inspectionBody(pair, {
      [ITEM_A]: { condition: 'Acceptable', accepted: '2', damaged: '0.5' },
      [ITEM_B]: { condition: 'Spoiled', accepted: '0', damaged: '0' },
    });
    expect(result.ok).toBe(false);
  });
});

describe('BR-61: approveGate (approve only after inspect, and never with nothing accepted)', () => {
  const SUB = grants('rma.request.process', 'inventory.quality_check.perform', 'rma.refund.approve', 'rma.refund.wallet_process');
  const item = (accepted: number | null, damaged: number | null = 0): ReturnItemView => ({
    orderItemId: ITEM_A,
    requestedGrams: 2000,
    acceptedGrams: accepted,
    damagedGrams: damaged,
    condition: accepted === null ? null : 'Acceptable',
  });

  it('BR-61: approve is not offered for a return that has not been inspected (PENDING), whatever was typed', () => {
    expect(approveGate('PENDING', [item(1000)], () => true)).toEqual({ visible: false, enabled: false, noteKey: null });
  });

  it('BR-61: approve is not offered after the decision either (APPROVED, REJECTED, REFUNDED)', () => {
    for (const status of ['APPROVED', 'REJECTED', 'REFUNDED', 'REFUND_PENDING_BANK', 'ESCALATED']) {
      expect(approveGate(status, [item(1000)], SUB).visible).toBe(false);
    }
  });

  it('BR-61: an INSPECTED return with something accepted can be approved', () => {
    expect(approveGate('INSPECTED', [item(1500, 500)], SUB)).toEqual({ visible: true, enabled: true, noteKey: null });
  });

  it('BR-61: zero accepted on every line disables approve and says why (reject stays offered)', () => {
    const zero = [item(0, 2000), { ...item(0, 0), orderItemId: ITEM_B }];
    expect(approveGate('INSPECTED', zero, SUB)).toEqual({ visible: true, enabled: false, noteKey: 'returns.review.zeroAccepted' });
    expect(returnActions('INSPECTED', SUB).reject).toBe(true);
  });

  it('BR-61: an item left uninspected (null) counts as zero accepted', () => {
    expect(approveGate('INSPECTED', [item(null, null)], SUB).enabled).toBe(false);
    expect(totalAcceptedGrams([item(null, null), { ...item(250), orderItemId: ITEM_B }])).toBe(250);
  });

  it('needs rma.refund.approve', () => {
    expect(approveGate('INSPECTED', [item(1000)], grants('rma.request.process')).visible).toBe(false);
  });
});

describe('validateRejectReason (docs/openapi.yaml ReturnRejectCreate: 1..300)', () => {
  it('trims, and refuses blank or over-long', () => {
    expect(validateRejectReason('  Not our produce  ')).toEqual({ ok: true, reason: 'Not our produce' });
    expect(validateRejectReason('   ')).toEqual({ ok: false, errorKey: 'returns.reject.error.required' });
    expect(validateRejectReason('x'.repeat(301))).toEqual({ ok: false, errorKey: 'returns.reject.error.tooLong' });
    expect(validateRejectReason('x'.repeat(300)).ok).toBe(true);
  });
});

describe('BR-61d: the wallet refund key (what useIdempotencyKey().keyFor hashes)', () => {
  it('the same return replays the same key; another return gets a new one', () => {
    let n = 0;
    // The cache useIdempotencyKey() holds, fed the same way the refund hook feeds it.
    const cache = createIdempotencyKeyCache(() => `key-${(n += 1)}`);
    const keyFor = (returnId: string) => cache.keyFor(bodyFingerprint(refundIdempotencyFingerprint(returnId)));
    expect(keyFor(RETURN_ID)).toBe('key-1');
    expect(keyFor(RETURN_ID)).toBe('key-1');
    expect(keyFor(ORDER_ID)).toBe('key-2');
  });

  it('names the return and the channel, so a wallet key can never be read as a bank one', () => {
    expect(refundIdempotencyFingerprint(RETURN_ID)).toEqual({ returnId: RETURN_ID, refund: 'wallet' });
  });
});

describe('toRefundResult (BR-61, root CLAUDE.md 2.2)', () => {
  const result = (amount: string): ReturnRefundResultDto => ({
    returnRequest: { ...RETURN, status: 'REFUNDED' },
    walletTransactionId: '9e9e9e9e-1111-4222-8333-444455556666',
    // A wire string as the server sends it; the mapper is what turns it into paise.
    amount: amount as ReturnRefundResultDto['amount'],
  });

  it('BR-61: the refunded amount is exact integer paise and its label comes from those paise', () => {
    expect(toRefundResult(result('200.10'))).toEqual({
      amountPaise: 20010,
      amountLabel: '₹200.10',
      walletTransactionId: '9e9e9e9e-1111-4222-8333-444455556666',
      reference: 'RET-7A7A7A7A',
    });
    expect(toRefundResult(result('0.30')).amountPaise).toBe(30);
    expect(toRefundResult(result('1234567.89')).amountPaise).toBe(123456789);
  });

  it('an amount that is not Money shows no figure rather than a wrong one', () => {
    expect(toRefundResult(result('abc'))).toMatchObject({ amountPaise: null, amountLabel: null });
  });
});

describe('errors', () => {
  const problem = (status: number, code: string) => new ApiError({ type: 'about:blank', title: code, status, code } as never);

  it('BR-61a: a status that moved on reads as "moved on", and 404 as not found', () => {
    expect(returnWriteErrorKey(problem(409, 'INVALID_STATE_TRANSITION'))).toBe('returns.error.INVALID_STATE_TRANSITION');
    expect(returnWriteErrorKey(problem(404, 'NOT_FOUND'))).toBe('returns.error.NOT_FOUND');
    expect(returnWriteErrorKey(problem(403, 'FORBIDDEN'))).toBe('admin.error.FORBIDDEN');
  });

  it('BR-61d: a dropped wallet refund says a retry credits at most once; a 422 says there is nothing to refund', () => {
    expect(returnRefundErrorKey(new NetworkError(new Error('timeout')))).toBe('returns.refund.error.uncertain');
    expect(returnRefundErrorKey(problem(422, 'VALIDATION_FAILED'))).toBe('returns.refund.error.zeroAmount');
    expect(returnRefundErrorKey(problem(409, 'INVALID_STATE_TRANSITION'))).toBe('returns.error.INVALID_STATE_TRANSITION');
  });
});

describe('ids, filters and labels', () => {
  it('returnIdParam takes a uuid only (a sample RMA-00231 is never sent)', () => {
    expect(returnIdParam(RETURN_ID)).toBe(RETURN_ID);
    expect(returnIdParam('RMA-00231')).toBeUndefined();
    expect(returnIdParam(undefined)).toBeUndefined();
  });

  it('the queue filters are the open statuses (server-side), history the closed ones', () => {
    expect(RETURN_QUEUE_FILTERS).toEqual([undefined, 'PENDING', 'INSPECTED', 'APPROVED']);
    expect(RETURN_HISTORY_FILTERS).toEqual(['REFUNDED', 'REJECTED', 'REFUND_PENDING_BANK']);
  });

  it('conditions have translated labels', () => {
    expect(conditionLabel('Acceptable')).toBe('Acceptable');
    expect(conditionLabel('Spoiled')).toBe('Spoiled');
  });
});

describe('toReturnTimeline', () => {
  it('lists the status changes oldest first, with the server note', () => {
    const history: ReturnHistoryEntryDto[] = [
      { id: 'h1', returnRequestId: RETURN_ID, fromStatus: null, toStatus: 'PENDING', changedBy: null, note: null, createdAt: '2026-10-13T03:00:00.000Z' },
      { id: 'h2', returnRequestId: RETURN_ID, fromStatus: 'PENDING', toStatus: 'INSPECTED', changedBy: 'u1', note: null, createdAt: '2026-10-13T04:00:00.000Z' },
      { id: 'h3', returnRequestId: RETURN_ID, fromStatus: 'INSPECTED', toStatus: 'TELEPORTED' as 'REFUNDED', changedBy: 'u1', note: 'x', createdAt: '2026-10-13T04:10:00.000Z' },
    ];
    expect(toReturnTimeline({ items: history }, NOW)).toEqual([
      { id: 'h1', title: 'New', time: 'Today · 08:30 AM', note: null },
      { id: 'h2', title: 'Inspected', time: 'Today · 09:30 AM', note: null },
      { id: 'h3', title: 'Unknown', time: 'Today · 09:40 AM', note: 'x' },
    ]);
  });
});

describe('refundAmountPaise', () => {
  it('reads the server refund amount as integer paise, exactly (no float drift)', () => {
    expect(refundAmountPaise({ amount: '200.10' })).toBe(20010);
    expect(refundAmountPaise({ amount: '0.30' })).toBe(30);
    expect(refundAmountPaise({ amount: '1234567.89' })).toBe(123456789);
  });

  it('an amount that is not Money is null (the screen shows no figure rather than a wrong one)', () => {
    expect(refundAmountPaise({ amount: 'abc' })).toBeNull();
  });
});
