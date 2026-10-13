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
import type { ReturnHistoryEntryDto, ReturnRequestDto, ReturnStatus } from '../api/returns';
import {
  CONDITION_FROM_API,
  CONDITION_TO_API,
  RETURN_STATUS_VIEW,
  inspectionBody,
  refundAmountPaise,
  returnActions,
  returnReference,
  returnStatusView,
  toReturnDetail,
  toReturnRow,
  toReturnTimeline,
} from '../screens/warehouse/returns-rma/mappers';

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

  it('every item needs a condition and an accepted quantity', () => {
    expect(inspectionBody(items, { [ITEM_A]: { condition: 'Acceptable', accepted: '1', damaged: '' } })).toEqual({
      ok: false,
      errorKey: 'returns.inspect.error.incomplete',
    });
    expect(
      inspectionBody(items, {
        [ITEM_A]: { condition: undefined, accepted: '1', damaged: '' },
        [ITEM_B]: { condition: 'Damaged', accepted: '0.5', damaged: '' },
      }),
    ).toEqual({ ok: false, errorKey: 'returns.inspect.error.incomplete' });
  });

  it('a quantity that is not a kg amount with at most 3 decimals is refused', () => {
    for (const accepted of ['abc', '1.2345', '-1', '1e3']) {
      expect(
        inspectionBody(items, {
          [ITEM_A]: { condition: 'Acceptable', accepted, damaged: '' },
          [ITEM_B]: { condition: 'Damaged', accepted: '0.5', damaged: '' },
        }),
      ).toEqual({ ok: false, errorKey: 'returns.inspect.error.quantity' });
    }
  });

  it('accepted + damaged may not exceed the requested quantity, exactly, in grams', () => {
    const over = inspectionBody(items, {
      [ITEM_A]: { condition: 'Acceptable', accepted: '1.999', damaged: '0.002' },
      [ITEM_B]: { condition: 'Damaged', accepted: '0.5', damaged: '' },
    });
    expect(over).toEqual({ ok: false, errorKey: 'returns.inspect.error.overRequested' });
    const exact = inspectionBody(items, {
      [ITEM_A]: { condition: 'Acceptable', accepted: '1.999', damaged: '0.001' },
      [ITEM_B]: { condition: 'Damaged', accepted: '0.1', damaged: '0.2' },
    });
    expect(exact.ok).toBe(true);
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
