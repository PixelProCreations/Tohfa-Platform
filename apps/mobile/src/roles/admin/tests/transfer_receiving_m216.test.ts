/**
 * Transfer receiving batch (design M2-02 Shipment Type, M2-16 Transfer Receiving),
 * on the existing /warehouse-transfers API only:
 *
 *  - Incoming Shipments lists the transfers awaiting receipt at the warehouse
 *    (GET /warehouse-transfers, status IN_TRANSIT: the API has no ARRIVED state
 *    and no arrival step, owner decision) next to the purchase orders, with a
 *    Shipment Type facet. A Sub scope always sends its own warehouse as the
 *    INBOUND side (BR-30); Main may pick one.
 *  - M2-16: the QTY MISMATCH tile counts received transfers flagged
 *    `hasDiscrepancy`; the receive screen shows sent per line and in total,
 *    received and difference, asks once before the receive POST, and ends on a
 *    summary built from the receive response (BR-102). Product names come only
 *    from a batch read the scope may make (GET /admin/batches/{id},
 *    inventory.batch.view), else the batch code the transfer carries.
 *
 * Pure functions (plain-Node vitest) plus source checks for wiring a function
 * test cannot see.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { BatchDto } from '../api/inventory';
import { WAREHOUSE_TRANSFER_STATUSES, type WarehouseTransferDto } from '../api/transfers';
import { t } from '../i18n';
import ta from '../i18n/ta.json';
import { formatKg } from '../money/quantity';
import { makeCan } from '../permissions/can';
import { DEMO_ROLE_PERMISSIONS } from '../permissions/demoGrants';
import {
  AWAITING_RECEIPT_STATUS,
  SHIPMENT_TYPE_FILTERS,
  canOpenTransferInspection,
  inboundTransferParams,
  incomingRows,
  offersTransferRows,
  shipmentTypeLabel,
  transferMatchesTab,
} from '../screens/warehouse/receiving-qc/incomingTransfers';
import { receivingWarehouseFilter } from '../screens/warehouse/receiving-qc/mappers';
import type { IncomingShipment, ShipmentFilterTab } from '../screens/warehouse/receiving-qc/types';
import { makeWarehouseNameOf, toTransferDetail, toTransferListItem, transferActions } from '../screens/warehouse/transfers/mappers';
import {
  TALLY_MAX_PAGES,
  batchFacts,
  discrepancyTally,
  discrepancyTileValue,
  lineProductName,
  receiveConfirmation,
  receiveTotals,
  transferBatchIdsToRead,
  transferReceiptSummary,
} from '../screens/warehouse/transfers/receiptViews';

const WH_A = '11111111-1111-4111-8111-111111111111'; // source (Ooty)
const WH_B = '22222222-2222-4222-8222-222222222222'; // destination (Coonoor)
const BATCH = '44444444-4444-4444-8444-444444444444';
const BATCH2 = '77777777-7777-4777-8777-777777777777';
const DEST1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const FARMER = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const LINE1 = '55555555-5555-4555-8555-555555555555';
const LINE2 = '56565656-5656-4565-8565-565656565656';

const mainCan = makeCan(DEMO_ROLE_PERMISSIONS.MAIN_WH_ADMIN);
const subCan = makeCan(DEMO_ROLE_PERMISSIONS.SUB_WH_ADMIN);
const noneCan = makeCan(null);
const MAIN = {};
const SUB_B = { warehouseId: WH_B, warehouseName: 'Coonoor' };

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
    vehicleNumber: null,
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
        id: LINE1,
        batchId: BATCH,
        batchCode: 'B-OOTY-001',
        cropId: '99999999-9999-4999-8999-999999999999',
        grade: 'GRADE_1',
        qtySentKg: '200.000',
        qtyReceivedKg: null,
        varianceKg: null,
        costPerKg: '40.00' as WarehouseTransferDto['totalValue'],
        lineValue: '8000.00' as WarehouseTransferDto['totalValue'],
        destBatchId: null,
      },
      {
        id: LINE2,
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

/** The same transfer as the receive POST answers it: line 1 short by 5 kg, line 2 received at 0. */
function received(): WarehouseTransferDto {
  const base = dto();
  return {
    ...base,
    status: 'RECEIVED',
    hasDiscrepancy: true,
    receiptNote: 'Five kg crushed in transit',
    receivedBy: '66666666-6666-4666-8666-666666666666',
    receivedAt: '2026-10-15T06:00:00.000Z',
    lines: [
      { ...base.lines[0]!, qtyReceivedKg: '195.000', varianceKg: '-5.000', destBatchId: DEST1 },
      { ...base.lines[1]!, qtyReceivedKg: '0.000', varianceKg: '-0.250', destBatchId: null },
    ],
  };
}

const nameOf = makeWarehouseNameOf(MAIN, [
  { warehouseId: WH_A, warehouseName: 'Ooty' },
  { warehouseId: WH_B, warehouseName: 'Coonoor' },
]);

function po(id: string, status: IncomingShipment['status']): IncomingShipment {
  return { purchaseOrderId: id, status } as IncomingShipment;
}

// ─── M2-02 Incoming Shipments: inbound transfers ────────────────────────────

describe('M2-02 inbound transfers next to the purchase orders', () => {
  it('BR-102: the rows are the transfers awaiting receipt (IN_TRANSIT); the API has no ARRIVED status or arrival step', () => {
    expect(AWAITING_RECEIPT_STATUS).toBe('IN_TRANSIT');
    expect(WAREHOUSE_TRANSFER_STATUSES as readonly string[]).not.toContain('ARRIVED');
    expect(inboundTransferParams(WH_B)).toEqual({ status: 'IN_TRANSIT', warehouseId: WH_B, direction: 'INBOUND' });
  });

  it('BR-30: a Sub scope sends its own warehouse as the INBOUND side, whatever was picked', () => {
    expect(inboundTransferParams(receivingWarehouseFilter(SUB_B, WH_A))).toEqual({
      status: 'IN_TRANSIT',
      warehouseId: WH_B,
      direction: 'INBOUND',
    });
  });

  it('BR-30: Main without a pick asks for every transfer in transit (direction needs a warehouse); with a pick, that warehouse inbound', () => {
    expect(inboundTransferParams(receivingWarehouseFilter(MAIN, undefined))).toEqual({ status: 'IN_TRANSIT' });
    expect(inboundTransferParams(receivingWarehouseFilter(MAIN, WH_A))).toEqual({
      status: 'IN_TRANSIT',
      warehouseId: WH_A,
      direction: 'INBOUND',
    });
  });

  it('Shipment Type: All lists the transfers first, then the purchase orders; each other choice lists only its own', () => {
    expect(SHIPMENT_TYPE_FILTERS).toEqual(['All', 'PurchaseOrders', 'Transfers']);
    const transfer = toTransferListItem(dto(), nameOf);
    const shipments = [po('po-1', 'Expected'), po('po-2', 'Completed')];
    const all = incomingRows({ shipments, transfers: [transfer], type: 'All', tab: 'All' });
    expect(all.map((r) => [r.kind, r.key])).toEqual([
      ['transfer', transfer.id],
      ['purchaseOrder', 'po-1'],
      ['purchaseOrder', 'po-2'],
    ]);
    expect(incomingRows({ shipments, transfers: [transfer], type: 'PurchaseOrders', tab: 'All' }).map((r) => r.kind)).toEqual([
      'purchaseOrder',
      'purchaseOrder',
    ]);
    expect(incomingRows({ shipments, transfers: [transfer], type: 'Transfers', tab: 'All' }).map((r) => r.kind)).toEqual(['transfer']);
  });

  it('a transfer in transit is expected: it shows under All and Expected, never under a receiving or QC pill', () => {
    const tabs: ShipmentFilterTab[] = ['All', 'Expected', 'Receiving', 'QC Pending', 'Completed'];
    expect(tabs.filter(transferMatchesTab)).toEqual(['All', 'Expected']);
    const transfer = toTransferListItem(dto(), nameOf);
    const rows = incomingRows({ shipments: [po('po-1', 'Completed')], transfers: [transfer], type: 'All', tab: 'Completed' });
    expect(rows.map((r) => r.kind)).toEqual(['purchaseOrder']);
  });

  it('the facet and the transfer rows are offered only with transfer.inter_warehouse.view', () => {
    expect(offersTransferRows(mainCan)).toBe(true);
    expect(offersTransferRows(subCan)).toBe(true);
    expect(offersTransferRows(noneCan)).toBe(false);
  });

  it('BR-30: a row opens the transfer receiving screen only where the scope may receive it', () => {
    expect(canOpenTransferInspection(mainCan)).toBe(true);
    expect(canOpenTransferInspection(subCan)).toBe(true);
    expect(canOpenTransferInspection(makeCan(['transfer.inter_warehouse.view']))).toBe(false);
    const inbound = toTransferListItem(dto(), nameOf);
    expect(transferActions(SUB_B, subCan, inbound).receive).toBe(true);
    // A Sub admin of the source sees the transfer but does not receive it.
    expect(transferActions({ warehouseId: WH_A }, subCan, inbound).receive).toBe(false);
  });

  it('the Shipment Type labels and the new notice come from the catalogue in en and ta', () => {
    expect(SHIPMENT_TYPE_FILTERS.map(shipmentTypeLabel)).toEqual([
      t('receiving.shipmentType.all'),
      t('receiving.shipmentType.purchaseOrders'),
      t('receiving.shipmentType.transfers'),
    ]);
    const keys = [
      'receiving.shipmentType.all',
      'receiving.shipmentType.purchaseOrders',
      'receiving.shipmentType.transfers',
      'receiving.shipments.typeNoticeWithTransfers',
    ];
    expect(keys.filter((key) => !(key in ta))).toEqual([]);
  });
});

// ─── M2-16 Transfer Receiving: tiles ────────────────────────────────────────

describe('M2-16 QTY MISMATCH tile', () => {
  const page = (flags: boolean[], total: number) => ({ items: flags.map((hasDiscrepancy) => ({ hasDiscrepancy })), total });

  it('BR-102: counts the received transfers flagged hasDiscrepancy, complete only once every row is in', () => {
    expect(discrepancyTally([page([true, false, true], 3)])).toEqual({ count: 2, loaded: 3, complete: true });
    expect(discrepancyTally([page([true, false], 5), page([false, true], 5)])).toEqual({ count: 2, loaded: 4, complete: false });
    expect(discrepancyTally([])).toEqual({ count: 0, loaded: 0, complete: false });
    expect(discrepancyTally([page([], 0)])).toEqual({ count: 0, loaded: 0, complete: true });
  });

  it('shows the count when complete, a placeholder while loading or after an error, and "n+" when the bounded tally stops', () => {
    expect(TALLY_MAX_PAGES).toBeGreaterThan(0);
    const unknown = t('transfers.kpi.unknown');
    expect(discrepancyTileValue({ count: 2, loaded: 3, complete: true }, { loading: false, error: false })).toBe('2');
    expect(discrepancyTileValue(undefined, { loading: true, error: false })).toBe(unknown);
    expect(discrepancyTileValue({ count: 1, loaded: 100, complete: false }, { loading: true, error: false })).toBe(unknown);
    expect(discrepancyTileValue({ count: 1, loaded: 100, complete: false }, { loading: false, error: true })).toBe(unknown);
    expect(discrepancyTileValue({ count: 7, loaded: 1000, complete: false }, { loading: false, error: false })).toBe(
      t('transfers.receiving.tile.atLeast', { count: 7 }),
    );
  });
});

// ─── M2-16 Transfer Receiving: quantities, confirmation ─────────────────────

describe('M2-16 quantity verification and the one confirmation', () => {
  const view = toTransferDetail(dto(), nameOf);

  it('BR-102: sent per line and in total; received and difference only when every line holds a valid quantity', () => {
    expect(view.lines.map((l) => l.sentGrams)).toEqual([200_000, 250]);
    expect(receiveTotals(view.lines, { [LINE1]: '195', [LINE2]: '0.25' })).toEqual({
      sentGrams: 200_250,
      receivedGrams: 195_250,
      differenceGrams: -5_000,
    });
    expect(receiveTotals(view.lines, { [LINE1]: '195' })).toEqual({ sentGrams: 200_250, receivedGrams: null, differenceGrams: null });
    expect(receiveTotals(view.lines, { [LINE1]: 'abc', [LINE2]: '0' })).toMatchObject({ receivedGrams: null });
  });

  it('BR-102: the confirmation names the transfer, received of sent, the destination, and a shortfall that will be recorded', () => {
    const short = receiveConfirmation(view, 195_250);
    expect(short.title).toBe(t('transfers.confirm.title'));
    expect(short.body).toContain(
      t('transfers.confirm.body', { code: 'TRF-2026-00012', received: formatKg(195_250), sent: formatKg(200_250), warehouse: 'Coonoor' }),
    );
    expect(short.body).toContain(t('transfers.confirm.short', { qty: formatKg(5_000) }));
    const full = receiveConfirmation(view, 200_250);
    expect(full.body).not.toContain(t('transfers.confirm.short', { qty: formatKg(0) }));
  });

  it('the new strings exist in en and ta', () => {
    const keys = [
      'transfers.confirm.title',
      'transfers.confirm.body',
      'transfers.confirm.short',
      'transfers.confirm.cancel',
      'transfers.confirm.ok',
      'transfers.receiving.tile.inTransit',
      'transfers.receiving.tile.inTransitSub',
      'transfers.receiving.tile.qtyMismatch',
      'transfers.receiving.tile.qtyMismatchSub',
      'transfers.receiving.tile.completed',
      'transfers.receiving.tile.completedSub',
      'transfers.receiving.tile.atLeast',
      'transfers.verify.title',
      'transfers.verify.sent',
      'transfers.verify.received',
      'transfers.verify.difference',
      'transfers.summary.title',
      'transfers.summary.transfer',
      'transfers.summary.route',
      'transfers.summary.sent',
      'transfers.summary.received',
      'transfers.summary.discrepancy',
      'transfers.summary.receiptNote',
      'transfers.summary.receivedAt',
      'transfers.summary.batches',
      'transfers.summary.newBatch',
      'transfers.summary.newBatchUnread',
      'transfers.summary.noBatch',
      'transfers.summary.fromBatch',
      'transfers.summary.done',
      'transfers.inspection.lineBatchMeta',
    ];
    expect(keys.filter((key) => !(key in ta))).toEqual([]);
    expect(keys.filter((key) => t(key as never) === key)).toEqual([]);
  });
});

// ─── M2-16 product names and the batch block ────────────────────────────────

describe('M2-16 product names and batches, from reads the scope may make', () => {
  it('BR-30: Main reads the source batches; a Sub admin never reads another warehouse\'s batch, only the batches created at its own', () => {
    const inTransit = toTransferDetail(dto(), nameOf);
    expect(transferBatchIdsToRead(MAIN, mainCan, inTransit)).toEqual([BATCH, BATCH2]);
    expect(transferBatchIdsToRead(SUB_B, subCan, inTransit)).toEqual([]);
    const done = toTransferDetail(received(), nameOf);
    expect(transferBatchIdsToRead(SUB_B, subCan, done)).toEqual([DEST1]);
    expect(transferBatchIdsToRead(MAIN, mainCan, done)).toEqual([BATCH, BATCH2, DEST1]);
    // Without inventory.batch.view nothing is read: the batch code the transfer carries stands in.
    expect(transferBatchIdsToRead(MAIN, makeCan(['transfer.inter_warehouse.view']), done)).toEqual([]);
  });

  it('BR-16: batch facts are an allow-list (code and crop name), never the source farmer', () => {
    const batch = {
      id: DEST1,
      batchCode: 'B-OOTY-001/TRF-2026-00012',
      warehouseId: WH_B,
      cropId: '99999999-9999-4999-8999-999999999999',
      cropName: 'Carrot',
      grade: 'GRADE_1',
      sourceFarmerId: FARMER,
      qtyAvailableKg: '195.000',
      status: 'ACTIVE',
    } as BatchDto;
    const facts = batchFacts(batch);
    expect(facts).toEqual({ batchCode: 'B-OOTY-001/TRF-2026-00012', cropName: 'Carrot' });
    expect(JSON.stringify(facts)).not.toContain(FARMER);
  });

  it('a line is named by its crop when a read carried it, else it has no product name (the batch code stands in)', () => {
    const done = toTransferDetail(received(), nameOf);
    const facts = new Map([[DEST1, { batchCode: 'B-OOTY-001/TRF-2026-00012', cropName: 'Carrot' }]]);
    expect(lineProductName(done.lines[0]!, facts)).toBe('Carrot');
    expect(lineProductName(done.lines[1]!, facts)).toBeUndefined();
    expect(lineProductName(done.lines[0]!, new Map())).toBeUndefined();
  });

  it('BR-102 / BR-24: the summary is the receive response: sent, received, discrepancy, note, and the batch created per positive line', () => {
    const done = toTransferDetail(received(), nameOf);
    const facts = new Map([[DEST1, { batchCode: 'B-OOTY-001/TRF-2026-00012', cropName: 'Carrot' }]]);
    const summary = transferReceiptSummary(done, facts);
    expect(summary).toMatchObject({
      code: 'TRF-2026-00012',
      sourceName: 'Ooty',
      destinationName: 'Coonoor',
      sentGrams: 200_250,
      receivedGrams: 195_000,
      discrepancyGrams: 5_250,
      receiptNote: 'Five kg crushed in transit',
      receivedAt: '2026-10-15T06:00:00.000Z',
    });
    expect(summary?.lines).toEqual([
      { id: LINE1, product: 'Carrot', sourceBatchCode: 'B-OOTY-001', gradeLabel: 'Grade 1', sentGrams: 200_000, receivedGrams: 195_000, newBatch: { id: DEST1, code: 'B-OOTY-001/TRF-2026-00012' } },
      { id: LINE2, product: undefined, sourceBatchCode: 'B-OOTY-002', gradeLabel: 'Grade 2', sentGrams: 250, receivedGrams: 0, newBatch: null },
    ]);
  });

  it('BR-24: without a batch read the new batch is known by id only, never a code made up on the client', () => {
    const summary = transferReceiptSummary(toTransferDetail(received(), nameOf), new Map());
    expect(summary?.lines[0]?.newBatch).toEqual({ id: DEST1, code: undefined });
  });

  it('a transfer that is not received has no summary; a full receipt has no discrepancy', () => {
    expect(transferReceiptSummary(toTransferDetail(dto(), nameOf), new Map())).toBeNull();
    const full = received();
    full.hasDiscrepancy = false;
    full.lines = [{ ...full.lines[0]!, qtyReceivedKg: '200.000', varianceKg: '0.000' }, { ...full.lines[1]!, qtyReceivedKg: '0.250', varianceKg: '0.000', destBatchId: BATCH2 }];
    expect(transferReceiptSummary(toTransferDetail(full, nameOf), new Map())?.discrepancyGrams).toBe(0);
  });
});

// ─── Wiring (source checks) ─────────────────────────────────────────────────

const SRC = path.resolve(__dirname, '..');
const code = (rel: string) =>
  fs
    .readFileSync(path.join(SRC, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const FLOW = 'screens/warehouse/receiving-qc/ReceivingFlow.tsx';
const SHIPMENTS = 'screens/warehouse/receiving-qc/IncomingShipmentsScreen.tsx';
const RECEIVING = 'screens/warehouse/transfers/TransferReceivingScreen.tsx';
const INSPECTION = 'screens/warehouse/transfers/TransferReceivingInspectionScreen.tsx';
const DATA = 'screens/warehouse/transfers/useTransfersData.ts';

describe('transfer receiving wiring', () => {
  it('BR-30: the shipments route reads the inbound transfers for the list warehouse (a Sub scope\'s own) through the tested params', () => {
    const flow = code(FLOW);
    expect(flow).toMatch(/useInboundTransfers\(\s*warehouseId/);
    expect(flow).toMatch(/<ShipmentsRoute[\s\S]{0,200}\{\.\.\.listLive\}/);
    expect(code(DATA)).toMatch(/inboundTransferParams\(warehouseId\)/);
  });

  it('a transfer row opens the existing transfer receiving screen inside the receiving flow', () => {
    const flow = code(FLOW);
    expect(flow).toMatch(/case 'TransferInspection':[\s\S]{0,120}<TransferReceivingInspectionScreen/);
    expect(flow).toMatch(/navigate\('TransferInspection', \{ transferId/);
    expect(flow).toMatch(/route === 'TransferInspection'\) return canOpenTransferInspection\(can\)/);
    const screen = code(SHIPMENTS);
    expect(screen).toContain('incomingRows(');
    expect(screen).toContain('<TransferRow');
    expect(screen).toContain('SHIPMENT_TYPE_FILTERS');
    // The purchase order row still opens the Quick View.
    expect(screen).toMatch(/onPress=\{\(\) => setQuickView\(s\)\}/);
  });

  it('M2-16 tiles are the shared OverviewDashboardCard, with the QTY MISMATCH tally', () => {
    const screen = code(RECEIVING);
    expect(screen).toContain('<OverviewDashboardCard');
    expect(screen).toContain('useTransferDiscrepancyTally(');
    expect(screen).toContain('discrepancyTileValue(');
    expect(screen).not.toContain('<KpiRow');
  });

  it('M2-16 asks once before the receive POST, keeps one Idempotency-Key per body, and disables the button while pending', () => {
    const screen = code(INSPECTION);
    expect(screen).toContain('receiveConfirmation(');
    expect(screen).toMatch(/Alert\.alert\(\s*confirmation\.title/);
    expect(screen).toMatch(/idempotencyKey: receiveKey\.keyFor\(\{ id: transfer\.id, body \}\)/);
    expect(screen).toMatch(/disabled=\{!result\.ok \|\| receive\.isPending\}/);
    // The POST is only reachable from the dialog's confirm button.
    expect(screen.match(/receive\.mutate\(/g) ?? []).toHaveLength(1);
    expect(screen).toMatch(/onPress: \(\) => (void )?send\(\)/);
    expect(screen).toContain('transferReceiptSummary(');
    expect(screen).toContain('<OverviewDashboardCard');
  });

  // A guard, not a failing-first test: `damage_mismatch_report` is a legacy goods-receipt sub-view key, hence (?!_).
  it('owner decisions: no arrival step, receipt number, damage/spoilage, reject or discrepancy resolution in the touched screens', () => {
    for (const rel of [SHIPMENTS, RECEIVING, INSPECTION, FLOW, 'screens/warehouse/transfers/receiptViews.ts', 'screens/warehouse/receiving-qc/incomingTransfers.ts']) {
      const src = code(rel);
      expect({ rel, hit: /ARRIVED|confirmArrival|arrive\(|TGR-|[Ss]poilage|[Dd]amage(?!_)|rejectTransfer|resolveDiscrepancy|initiatedByName/.exec(src)?.[0] ?? null }).toEqual({ rel, hit: null });
    }
  });
});
