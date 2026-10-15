/**
 * screens/warehouse/transfers/mappers.ts: API -> view mapping (integer grams
 * and paise, server statuses mapped to UI labels), the permission gating of
 * every transfer action against the grants generated from docs/rbac.json, the
 * Sub list scope, and the initiate / receive request bodies (BR-26, BR-102).
 */
import { describe, expect, it } from 'vitest';
import type { BatchDto } from '../api/inventory';
import type { WarehouseTransferDto } from '../api/transfers';
import { t } from '../i18n';
import { makeCan } from '../permissions/can';
import { DEMO_ROLE_PERMISSIONS } from '../permissions/demoGrants';
import { isAreaAvailable } from '../screens/warehouse/availability';
import {
  buildCreateTransferBody,
  buildReceiveTransferBody,
  canInitiateTransfer,
  canOpenTransferRoute,
  cancelReasonOf,
  createdOutcomeKey,
  kgInputText,
  makeWarehouseNameOf,
  nextOffsetPage,
  receiveShortfallGrams,
  toTransferBatchOptions,
  toTransferDetail,
  toTransferListItem,
  transferActions,
  transferListScopeParams,
  transferStatusLabel,
  transferTimeline,
} from '../screens/warehouse/transfers/mappers';

const WH_A = '11111111-1111-4111-8111-111111111111';
const WH_B = '22222222-2222-4222-8222-222222222222';
const BATCH = '44444444-4444-4444-8444-444444444444';
const BATCH2 = '77777777-7777-4777-8777-777777777777';

const mainCan = makeCan(DEMO_ROLE_PERMISSIONS.MAIN_WH_ADMIN);
const subCan = makeCan(DEMO_ROLE_PERMISSIONS.SUB_WH_ADMIN);
// Super Admin is not in the demo grants; rbac.json grants it transfer.high_value.approve (SA only).
const saCan = makeCan([...DEMO_ROLE_PERMISSIONS.MAIN_WH_ADMIN, 'transfer.high_value.approve']);
const MAIN = {};
const SUB_B = { warehouseId: WH_B, warehouseName: 'Coonoor' };
const SUB_A = { warehouseId: WH_A, warehouseName: 'Ooty' };

function dto(overrides: Partial<WarehouseTransferDto> = {}): WarehouseTransferDto {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    transferNumber: 'TRF-2026-00012',
    fromWarehouseId: WH_A,
    toWarehouseId: WH_B,
    status: 'IN_TRANSIT',
    totalValue: '1250.50' as WarehouseTransferDto['totalValue'],
    hasUnvaluedLines: false,
    requiresApproval: false,
    hasDiscrepancy: false,
    vehicleNumber: 'TN43E1234',
    notes: null,
    receiptNote: null,
    cancelReason: null,
    initiatedBy: '88888888-8888-4888-8888-888888888888',
    approvedBy: null,
    approvedAt: null,
    dispatchedAt: '2026-10-14T05:00:00.000Z',
    receivedBy: null,
    receivedAt: null,
    cancelledBy: null,
    cancelledAt: null,
    createdAt: '2026-10-14T05:00:00.000Z',
    updatedAt: null,
    lines: [
      {
        id: '55555555-5555-4555-8555-555555555555',
        batchId: BATCH,
        batchCode: 'B-OOTY-001',
        cropId: '99999999-9999-4999-8999-999999999999',
        grade: 'GRADE_1',
        qtySentKg: '12.500',
        qtyReceivedKg: null,
        varianceKg: null,
        costPerKg: '40.00' as WarehouseTransferDto['totalValue'],
        lineValue: '500.00' as WarehouseTransferDto['totalValue'],
        destBatchId: null,
      },
      {
        id: '56565656-5656-4565-8565-565656565656',
        batchId: BATCH2,
        batchCode: 'B-OOTY-002',
        cropId: '99999999-9999-4999-8999-999999999999',
        grade: 'GRADE_2',
        qtySentKg: '0.250',
        qtyReceivedKg: null,
        varianceKg: null,
        costPerKg: null,
        lineValue: null,
        destBatchId: null,
      },
    ],
    ...overrides,
  };
}

const nameOf = makeWarehouseNameOf(MAIN, [
  { warehouseId: WH_A, warehouseName: 'Ooty' },
  { warehouseId: WH_B, warehouseName: 'Coonoor' },
]);

describe('status labels', () => {
  it('maps every server status to its UI label (no mock labels)', () => {
    expect(transferStatusLabel('PENDING_APPROVAL')).toBe('Pending Approval');
    expect(transferStatusLabel('IN_TRANSIT')).toBe('In Transit');
    expect(transferStatusLabel('RECEIVED')).toBe('Received');
    expect(transferStatusLabel('CANCELLED')).toBe('Cancelled');
  });
});

describe('toTransferListItem / toTransferDetail', () => {
  it('maps the header, money to integer paise and names from the warehouse list', () => {
    const item = toTransferListItem(dto(), nameOf);
    expect(item).toMatchObject({
      code: 'TRF-2026-00012',
      sourceName: 'Ooty',
      destinationName: 'Coonoor',
      status: 'IN_TRANSIT',
      statusLabel: 'In Transit',
      statusTone: 'info',
      totalValuePaise: 125050,
    });
  });

  it('maps lines to integer grams and sums the sent quantity without floats', () => {
    const detail = toTransferDetail(dto(), nameOf);
    expect(detail.lines.map((l) => l.sentGrams)).toEqual([12500, 250]);
    expect(detail.sentGrams).toBe(12750);
    expect(detail.lines[0]).toMatchObject({ batchCode: 'B-OOTY-001', gradeLabel: 'Grade 1', lineValuePaise: 50000, receivedGrams: null });
    expect(detail.lines[1]?.lineValuePaise).toBeNull();
  });

  it('Sub cannot read the warehouse list: the other side reads "Another warehouse", its own its name', () => {
    const subNameOf = makeWarehouseNameOf(SUB_B, []);
    const item = toTransferListItem(dto(), subNameOf);
    expect(item.sourceName).toBe(t('transfers.warehouse.other'));
    expect(item.destinationName).toBe('Coonoor');
  });
});

describe('transferTimeline', () => {
  it('shows the approval step only when the transfer required approval', () => {
    expect(transferTimeline(dto()).map((s) => s.key)).toEqual(['requested', 'dispatched', 'received']);
    const pending = transferTimeline(dto({ status: 'PENDING_APPROVAL', requiresApproval: true, dispatchedAt: null }));
    expect(pending.map((s) => [s.key, s.done])).toEqual([
      ['requested', true],
      ['approved', false],
      ['dispatched', false],
      ['received', false],
    ]);
  });

  it('a cancelled transfer ends at Cancelled', () => {
    const steps = transferTimeline(dto({ status: 'CANCELLED', dispatchedAt: null, cancelledAt: '2026-10-14T06:00:00.000Z' }));
    expect(steps.map((s) => s.key)).toEqual(['requested', 'cancelled']);
  });
});

describe('permission gating (display only; rbac.json grants)', () => {
  const pending = { status: 'PENDING_APPROVAL' as const, destinationWarehouseId: WH_B };
  const inTransit = { status: 'IN_TRANSIT' as const, destinationWarehouseId: WH_B };

  it('BR-26: Main may initiate and cancel but not approve', () => {
    expect(canInitiateTransfer(mainCan)).toBe(true);
    expect(canOpenTransferRoute('InitiateNewTransfer', mainCan)).toBe(true);
    expect(transferActions(MAIN, mainCan, pending)).toEqual({ approve: false, cancel: true, receive: false });
  });

  it('BR-26: Sub may not initiate or cancel, and the Initiate route is refused', () => {
    expect(canInitiateTransfer(subCan)).toBe(false);
    expect(canOpenTransferRoute('InitiateNewTransfer', subCan)).toBe(false);
    expect(canOpenTransferRoute('Transfers', subCan)).toBe(true);
    expect(transferActions(SUB_B, subCan, pending)).toEqual({ approve: false, cancel: false, receive: false });
  });

  it('only a holder of transfer.high_value.approve (Super Admin) sees Approve', () => {
    expect(DEMO_ROLE_PERMISSIONS.MAIN_WH_ADMIN).not.toContain('transfer.high_value.approve');
    expect(DEMO_ROLE_PERMISSIONS.SUB_WH_ADMIN).not.toContain('transfer.high_value.approve');
    expect(transferActions(MAIN, saCan, pending).approve).toBe(true);
    expect(transferActions(MAIN, saCan, inTransit).approve).toBe(false);
  });

  it('BR-30: Sub receives only at its own warehouse, and only IN_TRANSIT', () => {
    expect(transferActions(SUB_B, subCan, inTransit).receive).toBe(true);
    expect(transferActions(SUB_A, subCan, inTransit).receive).toBe(false);
    expect(transferActions(SUB_B, subCan, { ...inTransit, status: 'RECEIVED' }).receive).toBe(false);
    expect(transferActions(MAIN, mainCan, inTransit).receive).toBe(true);
  });

  it('fails closed before permissions load', () => {
    expect(transferActions(MAIN, makeCan(null), pending)).toEqual({ approve: false, cancel: false, receive: false });
    expect(canInitiateTransfer(makeCan(null))).toBe(false);
  });

  it('the transfers area is shown with transfer.inter_warehouse.view (Main and Sub hold it)', () => {
    expect(isAreaAvailable('interWarehouseTransfers', mainCan)).toBe(true);
    expect(isAreaAvailable('interWarehouseTransfers', subCan)).toBe(true);
    expect(isAreaAvailable('interWarehouseTransfers', makeCan(null))).toBe(false);
  });
});

describe('list scope and paging', () => {
  it('BR-30: Main lists every transfer, Sub its inbound ones by uuid', () => {
    expect(transferListScopeParams(MAIN)).toEqual({});
    expect(transferListScopeParams(SUB_B)).toEqual({ warehouseId: WH_B, direction: 'INBOUND' });
  });

  it('nextOffsetPage follows total', () => {
    expect(nextOffsetPage({ page: 1, pageSize: 20, total: 45, items: [1] })).toBe(2);
    expect(nextOffsetPage({ page: 3, pageSize: 20, total: 45, items: [1] })).toBeUndefined();
    expect(nextOffsetPage({ page: 1, pageSize: 20, total: 45, items: [] })).toBeUndefined();
  });
});

describe('createdOutcomeKey', () => {
  it('reports the status the server chose, not a client threshold', () => {
    expect(createdOutcomeKey('PENDING_APPROVAL')).toBe('transfers.initiate.result.pending');
    expect(createdOutcomeKey('IN_TRANSIT')).toBe('transfers.initiate.result.dispatched');
  });
});

describe('initiate', () => {
  const batch = (over: Partial<BatchDto>): BatchDto => ({
    id: BATCH,
    batchCode: 'B1',
    warehouseId: WH_A,
    cropId: 'c',
    cropName: 'Carrot',
    grade: 'GRADE_1',
    qtyAvailableKg: '100.000',
    status: 'ACTIVE',
    ...over,
  });

  it('offers only ACTIVE batches with stock, in integer grams', () => {
    const opts = toTransferBatchOptions([
      batch({}),
      batch({ id: 'x', status: 'DEPLETED' }),
      batch({ id: 'y', qtyAvailableKg: '0.000' }),
    ]);
    expect(opts).toEqual([{ batchId: BATCH, batchCode: 'B1', cropName: 'Carrot', gradeLabel: 'Grade 1', availableGrams: 100000 }]);
  });

  const draft = {
    fromWarehouseId: WH_A,
    toWarehouseId: WH_B,
    lines: [{ batchId: BATCH, qtyText: '12.5', availableGrams: 100000 }],
    vehicleNumber: '  TN43E1234 ',
    notes: '',
  };

  it('BR-102: builds the body with kg strings, a trimmed vehicle and no empty notes', () => {
    expect(buildCreateTransferBody(draft)).toEqual({
      ok: true,
      body: { fromWarehouseId: WH_A, toWarehouseId: WH_B, lines: [{ batchId: BATCH, qtyKg: '12.500' }], vehicleNumber: 'TN43E1234' },
    });
  });

  it('BR-102: refuses a same-warehouse route, no lines, a zero/garbage quantity or more than available', () => {
    expect(buildCreateTransferBody({ ...draft, toWarehouseId: WH_A })).toMatchObject({ ok: false, error: 'SAME_WAREHOUSE' });
    expect(buildCreateTransferBody({ ...draft, toWarehouseId: undefined })).toMatchObject({ ok: false, error: 'DESTINATION_REQUIRED' });
    expect(buildCreateTransferBody({ ...draft, lines: [] })).toMatchObject({ ok: false, error: 'NO_LINES' });
    for (const qtyText of ['', '0', '-1', '1.2345', 'abc']) {
      expect(buildCreateTransferBody({ ...draft, lines: [{ ...draft.lines[0]!, qtyText }] })).toMatchObject({ ok: false, error: 'QTY_INVALID', batchId: BATCH });
    }
    expect(buildCreateTransferBody({ ...draft, lines: [{ ...draft.lines[0]!, qtyText: '100.001' }] })).toMatchObject({
      ok: false,
      error: 'QTY_ABOVE_AVAILABLE',
    });
    expect(buildCreateTransferBody({ ...draft, vehicleNumber: 'X'.repeat(21) })).toMatchObject({ ok: false, error: 'VEHICLE_TOO_LONG' });
  });

  it('kgInputText prints grams without trailing zeros', () => {
    expect(kgInputText(300000)).toBe('300');
    expect(kgInputText(12500)).toBe('12.5');
    expect(kgInputText(250)).toBe('0.25');
  });
});

describe('receive', () => {
  const lines = toTransferDetail(dto(), nameOf).lines;
  const [l1, l2] = lines as [typeof lines[number], typeof lines[number]];

  it('BR-102: a full receipt sends every line as kg strings and no note', () => {
    const result = buildReceiveTransferBody(lines, { [l1.id]: '12.5', [l2.id]: '0.25' }, '  ');
    expect(result).toEqual({
      ok: true,
      shortGrams: 0,
      body: { lines: [{ itemId: l1.id, qtyReceivedKg: '12.500' }, { itemId: l2.id, qtyReceivedKg: '0.250' }] },
    });
  });

  it('BR-102: a short line requires a receipt note', () => {
    const entered = { [l1.id]: '12', [l2.id]: '0' };
    expect(receiveShortfallGrams(lines, entered)).toBe(750);
    expect(buildReceiveTransferBody(lines, entered, '')).toEqual({ ok: false, error: 'NOTE_REQUIRED' });
    expect(buildReceiveTransferBody(lines, entered, 'One crate missing')).toMatchObject({
      ok: true,
      shortGrams: 750,
      body: { receiptNote: 'One crate missing' },
    });
  });

  it('BR-102: refuses more than was sent, or a missing / invalid quantity', () => {
    expect(buildReceiveTransferBody(lines, { [l1.id]: '12.501', [l2.id]: '0.25' }, '')).toEqual({ ok: false, error: 'QTY_ABOVE_SENT', lineId: l1.id });
    expect(buildReceiveTransferBody(lines, { [l1.id]: '12.5' }, '')).toEqual({ ok: false, error: 'QTY_INVALID', lineId: l2.id });
  });

  it('cancel reason is required and capped by the schema', () => {
    expect(cancelReasonOf('   ')).toBeNull();
    expect(cancelReasonOf(' Needed here ')).toBe('Needed here');
    expect(cancelReasonOf('x'.repeat(501))).toBeNull();
  });
});
