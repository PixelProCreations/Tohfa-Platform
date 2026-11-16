/**
 * Pure logic of the Tohfa Admin Inventory & Warehouse overview (M10-S01,
 * screens/operations/warehouseOverviewLogic.ts) and its one new API client
 * (api/inventoryOverview.ts, GET /admin/inventory/overview, BR-116).
 *
 * Pins: fail-closed gates on rbac codes, quick links only with callback AND
 * code, figures mapped from the server (kg strings to integer grams, never a
 * float), the dash for every figure the backend has no source for, search and
 * warehouse filter over API rows.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type * as ClientModule from '../../../shell/api/client';

vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof ClientModule>();
  return { ...actual, request: vi.fn() };
});

import { request } from '../../../shell/api/client';
import { getInventoryOverview, type InventoryOverviewDto } from '../api/inventoryOverview';
import type { WarehouseCapacityDto, WarehouseDto } from '../api/warehouses';
import {
  OPS_OVERVIEW_CODES,
  buildWarehouseRows,
  canViewWarehouseOverview,
  filterOptions,
  filterRows,
  kpiFigures,
  quickLinkAccess,
  type Fetched,
} from '../screens/operations/warehouseOverviewLogic';
import { makeCan } from '../permissions/can';
import { en } from '../i18n';

const DASH = en['warehouseOverview.figure.none'];
const WH_A = '11111111-1111-4111-8111-111111111111';
const WH_B = '22222222-2222-4222-8222-222222222222';

function warehouse(over: Partial<WarehouseDto> = {}): WarehouseDto {
  return { id: WH_A, code: 'AA-1', name: 'Alpha Store', type: 'MAIN', isActive: true, createdAt: '2026-01-01T00:00:00Z', ...over };
}

function overview(over: Partial<InventoryOverviewDto> = {}): InventoryOverviewDto {
  return {
    warehouses: [
      { warehouseId: WH_A, name: 'Alpha Store', availableQtyKg: '1980.500' },
      { warehouseId: WH_B, name: 'Beta Store', availableQtyKg: '20.000' },
    ],
    nearExpiryBatchCount: 2,
    lowStockCount: 5,
    pendingAdjustmentCount: 1,
    unreconciledVerificationCount: 3,
    varianceUnreconciledVerificationCount: 1,
    thresholds: { nearExpiryDays: 3, lowStockThresholdKg: '10.000' },
    ...over,
  };
}

const ok = <T>(data: T): Fetched<T> => ({ status: 'ok', data });

describe('api/inventoryOverview.ts', () => {
  const requestMock = vi.mocked(request);
  beforeEach(() => requestMock.mockReset());

  it('BR-116: GETs /admin/inventory/overview with no query', async () => {
    requestMock.mockResolvedValue(overview());
    const res = await getInventoryOverview();
    expect(res.lowStockCount).toBe(5);
    const [path, init] = requestMock.mock.calls[0]!;
    expect(path).toBe('/admin/inventory/overview');
    expect(init?.method).toBe('GET');
  });
});

describe('gates: rbac codes, fail closed', () => {
  it('the screen needs warehouse.all.view; a missing can denies', () => {
    expect(OPS_OVERVIEW_CODES.screen).toBe('warehouse.all.view');
    expect(canViewWarehouseOverview(makeCan(['warehouse.all.view']))).toBe(true);
    expect(canViewWarehouseOverview(makeCan(['inventory.batch.view']))).toBe(false);
    expect(canViewWarehouseOverview(undefined)).toBe(false);
  });

  it('a quick link needs its callback AND its code', () => {
    const cb = () => undefined;
    const all = makeCan(['inventory.stock_ledger.view_all', 'inventory.batch.view', 'transfer.inter_warehouse.view']);
    expect(quickLinkAccess(all, { onOpenStockLedger: cb, onOpenStockVerification: cb, onOpenTransfers: cb })).toEqual({
      stockLedger: true,
      verification: true,
      transfers: true,
    });
    expect(quickLinkAccess(all, {})).toEqual({ stockLedger: false, verification: false, transfers: false });
    const none = makeCan([]);
    expect(quickLinkAccess(none, { onOpenStockLedger: cb, onOpenStockVerification: cb, onOpenTransfers: cb })).toEqual({
      stockLedger: false,
      verification: false,
      transfers: false,
    });
    // Stock ledger opens with either ledger code; verification (KPI cards only, no tile) needs inventory.batch.view.
    const ledgerOnly = makeCan(['inventory.stock_ledger.view_all']);
    expect(quickLinkAccess(ledgerOnly, { onOpenStockLedger: cb, onOpenStockVerification: cb }).stockLedger).toBe(true);
    expect(quickLinkAccess(ledgerOnly, { onOpenStockLedger: cb, onOpenStockVerification: cb }).verification).toBe(false);
    expect(quickLinkAccess(undefined, { onOpenStockLedger: cb }).stockLedger).toBe(false);
  });
});

describe('KPI figures', () => {
  it('BR-116: maps the overview counts and sums available stock in integer grams', () => {
    const k = kpiFigures(ok(overview()), ok(2));
    expect(k.totalAvailable).toBe('2,000.5 kg');
    expect(k.lowStock).toBe('05');
    expect(k.pendingVerification).toBe('03');
    expect(k.discrepancies).toBe('01');
    expect(k.inTransit).toBe('02');
  });

  it('batch count has no backend source: always the dash', () => {
    expect(kpiFigures(ok(overview()), ok(2)).batches).toBe(DASH);
  });

  it('a null threshold count, a failed or switched-off source shows the dash, never 0', () => {
    const k = kpiFigures(ok(overview({ lowStockCount: null })), { status: 'failed' });
    expect(k.lowStock).toBe(DASH);
    expect(k.inTransit).toBe(DASH);
    const off = kpiFigures({ status: 'off' }, { status: 'off' });
    expect(Object.values(off).every((v) => v === DASH)).toBe(true);
  });

  it('shows the loading mark while a source loads', () => {
    const k = kpiFigures({ status: 'loading' }, { status: 'loading' });
    expect(k.totalAvailable).toBe(en['warehouseOverview.figure.loading']);
  });
});

describe('warehouse rows', () => {
  const caps: Record<string, Fetched<WarehouseCapacityDto>> = {
    [WH_A]: ok({ warehouseId: WH_A, capacityKg: '50000.000', usedKg: '21000.000', availableKg: '29000.000', utilizationPercent: 42 }),
    [WH_B]: { status: 'failed' },
  };

  it('rows come from the API list, mapped and ordered active, MAIN first, then by name', () => {
    const rows = buildWarehouseRows(
      [warehouse({ id: WH_B, code: 'BB-2', name: 'Beta Store', type: 'SUB' }), warehouse()],
      ok(overview()),
      caps,
      { [WH_A]: ok(1), [WH_B]: ok(0) },
    );
    expect(rows.map((r) => r.id)).toEqual([WH_A, WH_B]);
    const a = rows[0]!;
    expect(a.title).toBe('Alpha Store (AA-1)');
    expect(a.active).toBe(true);
    expect(a.capacityFailed).toBe(false);
    expect(a.line1).toContain('50,000 kg');
    expect(a.line1).toContain('42%');
    expect(a.line2).toContain('1,980.5 kg');
    expect(a.line2).toContain(`${en['warehouseOverview.card.transfersLabel']} 1`);
  });

  it('unsourced per-warehouse figures (products, batches, pending receipts, discrepancies, updated) are the dash', () => {
    const [a] = buildWarehouseRows([warehouse()], ok(overview()), caps, { [WH_A]: ok(1) });
    expect(a!.products).toBe(DASH);
    expect(a!.batches).toBe(DASH);
    expect(a!.pendingReceipts).toBe(DASH);
    expect(a!.discrepancies).toBe(DASH);
    expect(a!.updated).toBe(DASH);
  });

  it('a failed capacity read marks the card failed; a missing overview row is the dash', () => {
    const [b] = buildWarehouseRows([warehouse({ id: WH_B, code: 'BB-2', name: 'Beta Store' })], ok(overview({ warehouses: [] })), caps, {});
    expect(b!.capacityFailed).toBe(true);
    expect(b!.line1).toContain(en['warehouseOverview.card.capacityFailed']);
    expect(b!.available).toBe(DASH);
    expect(b!.transfers).toBe(DASH);
  });

  it('an inactive warehouse is labelled Inactive', () => {
    const [w] = buildWarehouseRows([warehouse({ isActive: false })], { status: 'off' }, {}, {});
    expect(w!.active).toBe(false);
    expect(w!.statusLabel).toBe(en['warehouseOverview.status.inactive']);
  });
});

describe('search and filter', () => {
  const rows = buildWarehouseRows(
    [warehouse(), warehouse({ id: WH_B, code: 'BB-2', name: 'Beta Store', type: 'SUB' })],
    { status: 'off' },
    {},
    {},
  );

  it('filter chips come from the API rows, after All Warehouses', () => {
    expect(filterOptions(rows)).toEqual([
      { id: null, label: en['warehouseOverview.filter.all'] },
      { id: WH_A, label: 'Alpha Store (AA-1)' },
      { id: WH_B, label: 'Beta Store (BB-2)' },
    ]);
  });

  it('filters by selected warehouse id and by name or code text', () => {
    expect(filterRows(rows, '', WH_B).map((r) => r.id)).toEqual([WH_B]);
    expect(filterRows(rows, 'alpha', null).map((r) => r.id)).toEqual([WH_A]);
    expect(filterRows(rows, 'bb-2', null).map((r) => r.id)).toEqual([WH_B]);
    expect(filterRows(rows, '  ', null)).toHaveLength(2);
  });
});
