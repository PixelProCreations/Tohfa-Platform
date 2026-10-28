/**
 * Design M2-16 Transfer Receiving on live data: the pure decisions in
 * screens/warehouse/transfers/transferReceiving.ts (no React, so plain-Node
 * vitest covers them).
 *
 *   - list scope (BR-30: a Sub admin lists only transfers INBOUND to its own
 *     warehouse; Main lists every warehouse's) and warehouse naming;
 *   - API -> view: statuses, line quantities as integer grams, totals;
 *   - the KPI strip (IN TRANSIT / COMPLETED from list totals, QTY MISMATCH
 *     from RECEIVED rows flagged hasDiscrepancy, unknown = no figure);
 *   - the receive body: every line exactly once as a kg string, 0..sent, and
 *     a receipt note required as soon as any line is short (BR-102);
 *   - the Idempotency-Key: the same body reuses its key, and a write whose
 *     outcome is unknown (timeout, 5xx) is replayed with the SAME body even if
 *     the form changed (BR-118, root CLAUDE.md 2.4);
 *   - the receipt summary and the tracking steps, from what the API carries.
 */
import { describe, expect, it, vi } from 'vitest';

import { ApiError, NetworkError } from '../../../shell/api/client';
import type { WarehouseTransferDetailDto } from '../api/transfers';
import type { WarehouseTransferDto } from '../api/warehouseTransfers';
import {
  buildTransferReceiveBody,
  canReceiveTransfer,
  createTransferReceiveKeys,
  destBatchIdsToRead,
  initialReceivedEntries,
  inboundTransferScopeParams,
  kpiCountLabel,
  mainTrackingSteps,
  mismatchTally,
  mismatchTileLabel,
  receiptSummaryLines,
  receiveFigures,
  receivingRouteSubtitle,
  sourceBatchIdsToRead,
  subProgressSteps,
  submitTransferReceive,
  toLiveTransferDetail,
  toLiveTransferRow,
  transferNamingOf,
  transferProductLabel,
  transferReceiptSummary,
  transferRouteText,
  transferRowMeta,
  type ReceiveSessionState,
} from '../screens/warehouse/transfers/transferReceiving';

const KOTA = '11111111-1111-4111-8111-111111111111';
const COON = '22222222-2222-4222-8222-222222222222';
const OOTY = '99999999-9999-4999-8999-999999999999';
const TRF = '33333333-3333-4333-8333-333333333333';
const LINE_A = '55555555-5555-4555-8555-555555555555';
const LINE_B = '66666666-6666-4666-8666-666666666666';
const BATCH_A = '77777777-7777-4777-8777-777777777777';
const BATCH_B = '88888888-8888-4888-8888-888888888888';
const DEST_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

const MAIN = { warehouseId: undefined };
const SUB_COON = { warehouseId: COON, warehouseName: 'Coonoor' };
const all = () => true;
const none = () => false;

function header(over: Partial<WarehouseTransferDto> = {}): WarehouseTransferDto {
  return {
    id: TRF,
    transferNumber: 'TRF-000284',
    fromWarehouseId: KOTA,
    toWarehouseId: COON,
    status: 'IN_TRANSIT',
    totalValue: '5000.00' as WarehouseTransferDto['totalValue'],
    hasUnvaluedLines: false,
    requiresApproval: false,
    hasDiscrepancy: false,
    vehicleNumber: 'TN-43-E-8821',
    notes: null,
    receiptNote: null,
    cancelReason: null,
    initiatedBy: '44444444-4444-4444-8444-444444444444',
    approvedBy: null,
    approvedAt: null,
    dispatchedAt: '2026-10-20T04:00:00.000Z',
    receivedBy: null,
    receivedAt: null,
    cancelledBy: null,
    cancelledAt: null,
    createdAt: '2026-10-20T03:00:00.000Z',
    updatedAt: null,
    ...over,
  };
}

function line(over: Partial<WarehouseTransferDetailDto['lines'][number]> = {}): WarehouseTransferDetailDto['lines'][number] {
  return {
    id: LINE_A,
    batchId: BATCH_A,
    batchCode: 'BAT-00412',
    cropId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    grade: 'GRADE_1',
    qtySentKg: '200.000',
    qtyReceivedKg: null,
    varianceKg: null,
    costPerKg: '25.00' as WarehouseTransferDetailDto['lines'][number]['costPerKg'],
    lineValue: '5000.00' as WarehouseTransferDetailDto['lines'][number]['lineValue'],
    destBatchId: null,
    ...over,
  };
}

function detail(over: Partial<WarehouseTransferDetailDto> = {}): WarehouseTransferDetailDto {
  return { ...header(), lines: [line()], ...over };
}

const mainNaming = transferNamingOf(MAIN, [
  { warehouseId: KOTA, warehouseName: 'Kotagiri' },
  { warehouseId: COON, warehouseName: 'Coonoor' },
]);
const subNaming = transferNamingOf(SUB_COON, []);

describe('list scope (BR-30)', () => {
  it('BR-30: a Sub admin lists only transfers INBOUND to its own warehouse', () => {
    expect(inboundTransferScopeParams(SUB_COON)).toEqual({ warehouseId: COON, direction: 'INBOUND' });
  });

  it('Main lists every warehouse (no warehouseId, so no direction: the server answers 422 for one)', () => {
    expect(inboundTransferScopeParams(MAIN)).toEqual({});
  });
});

describe('warehouse naming', () => {
  it('Main names both sides from GET /warehouses', () => {
    const row = toLiveTransferRow(header(), mainNaming);
    expect(row.sourceName).toBe('Kotagiri');
    expect(row.destinationName).toBe('Coonoor');
  });

  it('Sub knows only its own name: the other side is hidden (undefined), never a sample name', () => {
    const row = toLiveTransferRow(header(), subNaming);
    expect(row.destinationName).toBe('Coonoor');
    expect(row.sourceName).toBeUndefined();
  });

  it("Sub never names another warehouse with its own name", () => {
    const row = toLiveTransferRow(header({ toWarehouseId: OOTY }), subNaming);
    expect(row.destinationName).toBeUndefined();
  });
});

describe('API -> view', () => {
  it('maps the header: number, status label and tone, discrepancy flag', () => {
    const row = toLiveTransferRow(header({ status: 'RECEIVED', hasDiscrepancy: true }), mainNaming);
    expect(row).toMatchObject({ id: TRF, code: 'TRF-000284', status: 'RECEIVED', statusLabel: 'Completed', statusTone: 'success', hasDiscrepancy: true });
    expect(toLiveTransferRow(header(), mainNaming)).toMatchObject({ statusLabel: 'In Transit', statusTone: 'info' });
  });

  it('reads line quantities as integer grams (never a float) and totals them', () => {
    const view = toLiveTransferDetail(
      detail({ lines: [line(), line({ id: LINE_B, batchId: BATCH_B, qtySentKg: '12.345', grade: 'GRADE_2' })] }),
      mainNaming,
    );
    expect(view.lines.map((l) => l.sentGrams)).toEqual([200000, 12345]);
    expect(view.sentGrams).toBe(212345);
    expect(view.receivedGrams).toBeNull();
    expect(view.varianceGrams).toBeNull();
    expect(view.lines[1]?.gradeLabel).toBe('Grade 2');
  });

  it('a received transfer totals received and variance from the server lines', () => {
    const view = toLiveTransferDetail(
      detail({
        status: 'RECEIVED',
        hasDiscrepancy: true,
        receivedAt: '2026-10-21T05:00:00.000Z',
        lines: [line({ qtyReceivedKg: '195.000', varianceKg: '-5.000', destBatchId: DEST_A })],
      }),
      mainNaming,
    );
    expect(view.receivedGrams).toBe(195000);
    expect(view.varianceGrams).toBe(-5000);
  });

  it('an unparsable quantity makes the total unknown (null), never 0', () => {
    const view = toLiveTransferDetail(detail({ lines: [line({ qtySentKg: 'abc' })] }), mainNaming);
    expect(view.sentGrams).toBeNull();
  });
});

describe('receive permission', () => {
  it('needs transfer.inter_warehouse.receive, IN_TRANSIT and a destination the scope covers', () => {
    const inTransit = { status: 'IN_TRANSIT' as const, destinationWarehouseId: COON };
    expect(canReceiveTransfer(SUB_COON, all, inTransit)).toBe(true);
    expect(canReceiveTransfer(MAIN, all, inTransit)).toBe(true);
    expect(canReceiveTransfer(SUB_COON, none, inTransit)).toBe(false);
    expect(canReceiveTransfer(SUB_COON, all, { status: 'RECEIVED', destinationWarehouseId: COON })).toBe(false);
    expect(canReceiveTransfer({ warehouseId: KOTA }, all, inTransit)).toBe(false);
  });

  it('checks the receive code only', () => {
    const can = vi.fn((code: string) => code === 'transfer.inter_warehouse.receive');
    expect(canReceiveTransfer(SUB_COON, can, { status: 'IN_TRANSIT', destinationWarehouseId: COON })).toBe(true);
  });
});

describe('KPI strip', () => {
  it('QTY MISMATCH counts RECEIVED rows flagged hasDiscrepancy, complete only when every row is in', () => {
    const rows = [{ hasDiscrepancy: true }, { hasDiscrepancy: false }, { hasDiscrepancy: true }];
    expect(mismatchTally(rows, 3)).toEqual({ count: 2, complete: true });
    expect(mismatchTally(rows, 250)).toEqual({ count: 2, complete: false });
  });

  it('shows no figure while unknown, the count when complete, "n+" when the bounded read stopped early', () => {
    expect(mismatchTileLabel(undefined)).toBe('');
    expect(mismatchTileLabel({ count: 2, complete: true })).toBe('2');
    expect(mismatchTileLabel({ count: 2, complete: false })).toBe('2+');
  });

  it('a count tile is blank while unknown, never 0', () => {
    expect(kpiCountLabel(undefined)).toBe('');
    expect(kpiCountLabel(0)).toBe('0');
    expect(kpiCountLabel(4)).toBe('4');
  });

  it('the header names the first arrival route the viewer can name, else nothing', () => {
    const rows = [toLiveTransferRow(header(), subNaming), toLiveTransferRow(header(), mainNaming)];
    expect(receivingRouteSubtitle(rows)).toBe('Coonoor ← Kotagiri, and other inter-warehouse arrivals');
    expect(receivingRouteSubtitle([toLiveTransferRow(header(), subNaming)])).toBeUndefined();
    expect(receivingRouteSubtitle([])).toBeUndefined();
  });
});

describe('product names (BR-16, BR-30)', () => {
  const view = toLiveTransferDetail(detail(), mainNaming);

  it('Main reads the source batches; a Sub admin at the destination cannot (another warehouse)', () => {
    expect(sourceBatchIdsToRead(MAIN, all, view)).toEqual([BATCH_A]);
    expect(sourceBatchIdsToRead(SUB_COON, all, view)).toEqual([]);
    expect(sourceBatchIdsToRead(MAIN, none, view)).toEqual([]);
  });

  it('destination batches are read only once received, by a scope that reaches the destination', () => {
    const received = toLiveTransferDetail(
      detail({ status: 'RECEIVED', lines: [line({ qtyReceivedKg: '200.000', varianceKg: '0.000', destBatchId: DEST_A })] }),
      mainNaming,
    );
    expect(destBatchIdsToRead(SUB_COON, all, received)).toEqual([DEST_A]);
    expect(destBatchIdsToRead({ warehouseId: KOTA }, all, received)).toEqual([]);
    expect(destBatchIdsToRead(SUB_COON, all, view)).toEqual([]);
  });

  it('labels "<crop> <grade>" only when every line is named; otherwise hidden', () => {
    expect(transferProductLabel(view, new Map([[BATCH_A, 'Carrot']]))).toBe('Carrot Grade 1');
    expect(transferProductLabel(view, new Map())).toBeUndefined();
    const two = toLiveTransferDetail(
      detail({ lines: [line(), line({ id: LINE_B, batchId: BATCH_B, grade: 'GRADE_2' })] }),
      mainNaming,
    );
    expect(transferProductLabel(two, new Map([[BATCH_A, 'Carrot'], [BATCH_B, 'Beetroot']]))).toBe('Carrot Grade 1, Beetroot Grade 2');
    expect(transferProductLabel(two, new Map([[BATCH_A, 'Carrot']]))).toBeUndefined();
  });
});

describe('quantity verification and the receive body (BR-102)', () => {
  const view = toLiveTransferDetail(
    detail({ lines: [line(), line({ id: LINE_B, batchId: BATCH_B, qtySentKg: '50.000' })] }),
    mainNaming,
  );

  it('starts every line at the quantity sent', () => {
    expect(initialReceivedEntries(view.lines)).toEqual({ [LINE_A]: '200', [LINE_B]: '50' });
  });

  it('computes received and difference in integer grams from what was typed', () => {
    expect(receiveFigures(view.lines, { [LINE_A]: '195', [LINE_B]: '50' })).toEqual({
      sentGrams: 250000,
      receivedGrams: 245000,
      differenceGrams: -5000,
      shortGrams: 5000,
    });
    expect(receiveFigures(view.lines, { [LINE_A]: '0.1', [LINE_B]: '0.2' }).receivedGrams).toBe(300);
    expect(receiveFigures(view.lines, { [LINE_A]: '', [LINE_B]: '50' })).toMatchObject({ receivedGrams: null, differenceGrams: null });
  });

  it('BR-102: sends EVERY line exactly once as a kg string, no note on a full receipt', () => {
    const result = buildTransferReceiveBody(view.lines, { [LINE_A]: '200', [LINE_B]: '50' }, '  ');
    expect(result).toEqual({
      ok: true,
      shortGrams: 0,
      body: {
        lines: [
          { itemId: LINE_A, qtyReceivedKg: '200.000' },
          { itemId: LINE_B, qtyReceivedKg: '50.000' },
        ],
      },
    });
  });

  it('BR-102: a short line requires a receipt note, which is then sent trimmed', () => {
    expect(buildTransferReceiveBody(view.lines, { [LINE_A]: '195', [LINE_B]: '50' }, '')).toEqual({ ok: false, problem: 'NOTE_REQUIRED' });
    const result = buildTransferReceiveBody(view.lines, { [LINE_A]: '195', [LINE_B]: '50' }, ' Five kg spoiled ');
    expect(result).toEqual({
      ok: true,
      shortGrams: 5000,
      body: {
        lines: [
          { itemId: LINE_A, qtyReceivedKg: '195.000' },
          { itemId: LINE_B, qtyReceivedKg: '50.000' },
        ],
        receiptNote: 'Five kg spoiled',
      },
    });
  });

  it('BR-102: refuses more than was sent, a missing or invalid quantity, and a note over 1000 characters', () => {
    expect(buildTransferReceiveBody(view.lines, { [LINE_A]: '201', [LINE_B]: '50' }, '')).toEqual({ ok: false, problem: 'QTY_ABOVE_SENT', lineId: LINE_A });
    expect(buildTransferReceiveBody(view.lines, { [LINE_A]: '200' }, '')).toEqual({ ok: false, problem: 'QTY_INVALID', lineId: LINE_B });
    expect(buildTransferReceiveBody(view.lines, { [LINE_A]: '-1', [LINE_B]: '50' }, '')).toEqual({ ok: false, problem: 'QTY_INVALID', lineId: LINE_A });
    expect(buildTransferReceiveBody(view.lines, { [LINE_A]: '195', [LINE_B]: '50' }, 'x'.repeat(1001))).toEqual({ ok: false, problem: 'NOTE_TOO_LONG' });
  });

  it('BR-102: 0 received is allowed (the whole line short, with a note)', () => {
    const result = buildTransferReceiveBody(view.lines, { [LINE_A]: '0', [LINE_B]: '50' }, 'Lost in transit');
    expect(result).toMatchObject({ ok: true, shortGrams: 200000 });
  });
});

describe('Idempotency-Key and replay (BR-118)', () => {
  const bodyA = { lines: [{ itemId: LINE_A, qtyReceivedKg: '200.000' }] };
  const bodyB = { lines: [{ itemId: LINE_A, qtyReceivedKg: '195.000' }], receiptNote: 'short' };

  function keys() {
    let n = 0;
    return createTransferReceiveKeys(() => `key-${++n}`);
  }

  it('BR-118: the same transfer and body reuse one key; a changed body gets a new key', () => {
    const k = keys();
    expect(k.keyFor(TRF, bodyA)).toBe('key-1');
    expect(k.keyFor(TRF, { lines: [{ qtyReceivedKg: '200.000', itemId: LINE_A }] })).toBe('key-1');
    expect(k.keyFor(TRF, bodyB)).toBe('key-2');
    k.reset();
    expect(k.keyFor(TRF, bodyB)).toBe('key-3');
  });

  it('BR-118: a timeout holds the body; the retry resends the SAME body and key even after the form changed', async () => {
    const k = keys();
    const receive = vi
      .fn()
      .mockRejectedValueOnce(new NetworkError('timeout'))
      .mockResolvedValueOnce(detail({ status: 'RECEIVED' }));
    const state0: ReceiveSessionState = { held: null };
    const first = await submitTransferReceive(state0, TRF, bodyA, { receive }, k);
    expect(first).toMatchObject({ kind: 'failed', unknown: true });
    const second = await submitTransferReceive(first.state, TRF, bodyB, { receive }, k);
    expect(second.kind).toBe('done');
    expect(receive.mock.calls[0]).toEqual([TRF, bodyA, 'key-1']);
    expect(receive.mock.calls[1]).toEqual([TRF, bodyA, 'key-1']);
    expect(second.state).toEqual({ held: null });
  });

  it('a refused write (4xx) wrote nothing: nothing is held, the edited body goes next', async () => {
    const k = keys();
    const refused = new ApiError({ type: 'about:blank', title: 'Unprocessable', status: 422, code: 'VALIDATION_FAILED' } as never);
    const receive = vi.fn().mockRejectedValueOnce(refused).mockResolvedValueOnce(detail({ status: 'RECEIVED' }));
    const first = await submitTransferReceive({ held: null }, TRF, bodyA, { receive }, k);
    expect(first).toMatchObject({ kind: 'failed', unknown: false, state: { held: null } });
    await submitTransferReceive(first.state, TRF, bodyB, { receive }, k);
    expect(receive.mock.calls[1]?.[1]).toBe(bodyB);
  });

  it('a 5xx is an unknown outcome too (a gateway may answer after the commit)', async () => {
    const k = keys();
    const gateway = new ApiError({ type: 'about:blank', title: 'Bad gateway', status: 502, code: 'INTERNAL' } as never);
    const receive = vi.fn().mockRejectedValueOnce(gateway);
    const result = await submitTransferReceive({ held: null }, TRF, bodyA, { receive }, k);
    expect(result).toMatchObject({ kind: 'failed', unknown: true, state: { held: { transferId: TRF, body: bodyA } } });
  });
});

describe('receipt summary', () => {
  const received = toLiveTransferDetail(
    detail({
      status: 'RECEIVED',
      hasDiscrepancy: true,
      receivedAt: '2026-10-21T05:00:00.000Z',
      receiptNote: 'Five kg spoiled',
      lines: [line({ qtyReceivedKg: '195.000', varianceKg: '-5.000', destBatchId: DEST_A })],
    }),
    mainNaming,
  );

  it('is null until the transfer is RECEIVED', () => {
    expect(transferReceiptSummary(toLiveTransferDetail(detail(), mainNaming), new Map())).toBeNull();
  });

  it('carries transfer, route, sent, received, discrepancy and the destination batch code when read', () => {
    const summary = transferReceiptSummary(received, new Map([[DEST_A, 'BAT-00412/TRF-000284']]));
    expect(summary).toEqual({
      code: 'TRF-000284',
      sourceName: 'Kotagiri',
      destinationName: 'Coonoor',
      sentGrams: 200000,
      receivedGrams: 195000,
      discrepancyGrams: 5000,
      batchCodes: ['BAT-00412/TRF-000284'],
    });
  });

  it('renders one line per known figure; an unread batch and an unknown side are left out', () => {
    const named = transferReceiptSummary(received, new Map([[DEST_A, 'BAT-00412/TRF-000284']]));
    expect(named && receiptSummaryLines(named)).toEqual([
      'Transfer: TRF-000284',
      'Source → Destination: Kotagiri → Coonoor',
      'Sent: 200 kg',
      'Received: 195 kg',
      'Discrepancy: 5 kg',
      'Batch: BAT-00412/TRF-000284',
    ]);
    const sub = transferReceiptSummary(toLiveTransferDetail(
      detail({ status: 'RECEIVED', lines: [line({ qtyReceivedKg: '200.000', varianceKg: '0.000', destBatchId: DEST_A })] }),
      subNaming,
    ), new Map());
    expect(sub && receiptSummaryLines(sub)).toEqual(['Transfer: TRF-000284', 'Sent: 200 kg', 'Received: 200 kg', 'Discrepancy: 0 kg']);
  });
});

describe('tracking steps (from timestamps; no arrival, quality or decision step exists)', () => {
  it('Main tracking: created, dispatched, in transit, receiving, quantity verification, completed', () => {
    const inTransit = mainTrackingSteps(toLiveTransferDetail(detail(), mainNaming));
    expect(inTransit.map((s) => [s.key, s.completed])).toEqual([
      ['created', true],
      ['dispatched', true],
      ['inTransit', true],
      ['receiving', false],
      ['quantityVerification', false],
      ['completed', false],
    ]);
    const received = mainTrackingSteps(
      toLiveTransferDetail(detail({ status: 'RECEIVED', receivedAt: '2026-10-21T05:00:00.000Z' }), mainNaming),
    );
    expect(received.every((s) => s.completed)).toBe(true);
    expect(received.map((s) => s.label)).toEqual([
      'Transfer Created',
      'Dispatched',
      'In Transit',
      'Receiving',
      'Quantity Verification',
      'Completed',
    ]);
  });

  it('Sub progress: the approval step only when the transfer needed one; no arrival step', () => {
    const plain = subProgressSteps(toLiveTransferDetail(detail(), subNaming));
    expect(plain.map((s) => [s.key, s.done])).toEqual([
      ['requested', true],
      ['dispatched', true],
      ['inTransit', true],
      ['received', false],
    ]);
    const pending = subProgressSteps(
      toLiveTransferDetail(detail({ status: 'PENDING_APPROVAL', requiresApproval: true, dispatchedAt: null }), subNaming),
    );
    expect(pending.map((s) => [s.key, s.done])).toEqual([
      ['requested', true],
      ['approval', false],
      ['dispatched', false],
      ['inTransit', false],
      ['received', false],
    ]);
  });
});

describe('row and route text (hidden parts are left out, never sampled)', () => {
  it('meta is "<code> · <product> — <sent>" with each unknown part left out', () => {
    expect(transferRowMeta('TRF-000284', 'Carrot Grade 1', 200000)).toBe('TRF-000284 · Carrot Grade 1 — 200 kg');
    expect(transferRowMeta('TRF-000284', undefined, 200000)).toBe('TRF-000284 — 200 kg');
    expect(transferRowMeta('TRF-000284', undefined, undefined)).toBe('TRF-000284');
  });

  it('the route reads "<source> → <destination>" only when both sides are named', () => {
    expect(transferRouteText({ sourceName: 'Kotagiri', destinationName: 'Coonoor' })).toBe('Kotagiri → Coonoor');
    expect(transferRouteText({ sourceName: undefined, destinationName: 'Coonoor' })).toBeUndefined();
  });
});
