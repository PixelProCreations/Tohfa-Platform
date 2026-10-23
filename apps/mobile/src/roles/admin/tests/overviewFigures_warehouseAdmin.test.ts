/**
 * screens/warehouse/warehouse-admin/overviewFigures.ts: the figures the Main admin's
 * Warehouse Overview (D02, the Shell sub-view and its City Detail) and Warehouse List
 * (M15-02) add: today's receipts per warehouse (BR-80), storage areas (BR-79), the
 * near-full capacity state from the server's CAPACITY_NEAR_FULL alert (BR-66, BR-77;
 * root CLAUDE.md 2.7: no client threshold) and the staff count from the roll call (BR-84).
 * Plus source checks that the screens use them and keep no hard-coded threshold.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AlertItemDto } from '../api/alerts';
import type { RollCallDto, RollCallItemDto } from '../api/attendance';
import type { WarehousePerformanceDto } from '../api/warehouseOps';
import {
  activeStaffCount,
  capacityTone,
  nearFullSignal,
  receiptsByWarehouse,
  sumStorageAreas,
  todayReceiptsCount,
  WAREHOUSE_OVERVIEW_CODES,
} from '../screens/warehouse/warehouse-admin/overviewFigures';

const OOTY = '11111111-1111-4111-8111-111111111111';
const COON = '22222222-2222-4222-8222-222222222222';
const KOTA = '33333333-3333-4333-8333-333333333333';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');

function perf(warehouseId: string, goodsReceipts: number): WarehousePerformanceDto {
  return {
    warehouseId,
    from: '2026-10-23',
    to: '2026-10-23',
    orders: { placed: 0, fulfilled: 0, cancelled: 0, byStatus: [] },
    receiving: { goodsReceipts, byStatus: [], grossQtyKg: '0.000', acceptedQtyKg: '0.000', rejectedQtyKg: '0.000' },
    returns: { requested: 0, byStatus: [] },
    stockMovements: [],
  };
}

function nearFullAlert(warehouseId: string, params: AlertItemDto['params'] = {}): AlertItemDto {
  return {
    itemKey: `CAPACITY_NEAR_FULL:${warehouseId}`,
    type: 'CAPACITY_NEAR_FULL',
    messageKey: 'alert.capacity_near_full.message',
    refType: 'WAREHOUSE',
    refId: warehouseId,
    warehouseId,
    since: null,
    params,
    state: 'ACTIVE',
    snoozedUntil: null,
  };
}

function staff(over: Partial<RollCallItemDto>): RollCallItemDto {
  return {
    staffId: 's1',
    staffCode: 'ST-1',
    staffName: 'Staff',
    designation: 'Loader',
    warehouseId: OOTY,
    staffStatus: 'ACTIVE',
    attendance: null,
    ...over,
  };
}

function rollCall(items: RollCallItemDto[]): RollCallDto {
  return { date: '2026-10-23', items, summary: { present: 0, absent: 0, leave: 0, notMarked: items.length, total: items.length } };
}

describe("BR-80: today's receipts are the server's exact performance count", () => {
  it('reads receiving.goodsReceipts of the IST-day performance', () => {
    expect(todayReceiptsCount(perf(OOTY, 7))).toBe(7);
    expect(todayReceiptsCount(perf(OOTY, 0))).toBe(0);
  });

  it('a count that is not a non-negative integer is no figure (hidden), never a 0', () => {
    expect(todayReceiptsCount(perf(OOTY, 2.5))).toBeNull();
    expect(todayReceiptsCount(perf(OOTY, -1))).toBeNull();
    expect(todayReceiptsCount(perf(OOTY, Number.NaN))).toBeNull();
  });

  it('keys each warehouse by its own uuid; a warehouse not returned has no entry', () => {
    expect(receiptsByWarehouse([perf(OOTY, 3), perf(COON, 0)])).toEqual({ [OOTY]: 3, [COON]: 0 });
    expect(receiptsByWarehouse([perf(OOTY, 3)])[KOTA]).toBeUndefined();
  });

  it('a malformed count leaves only that warehouse out', () => {
    expect(receiptsByWarehouse([perf(OOTY, 1.5), perf(COON, 4)])).toEqual({ [COON]: 4 });
  });
});

describe('BR-79: storage areas are the sum of the storage-location list totals', () => {
  it('adds the exact `total` of each warehouse', () => {
    expect(sumStorageAreas([7, 8, 6, 7])).toBe(28);
    expect(sumStorageAreas([0])).toBe(0);
  });

  it('no warehouse read, or one unreadable total, is no figure rather than a partial sum', () => {
    expect(sumStorageAreas([])).toBeNull();
    expect(sumStorageAreas([3, -1])).toBeNull();
    expect(sumStorageAreas([3, 1.5])).toBeNull();
  });
});

describe('BR-77 / BR-66: the near-full state comes from the server, never from a client threshold', () => {
  it('a warehouse with a CAPACITY_NEAR_FULL alert is near full', () => {
    const signal = nearFullSignal([nearFullAlert(OOTY)]);
    expect(capacityTone({ warehouseId: OOTY, utilizationBp: 5000, availableGrams: 1 }, signal)).toBe('nearFull');
  });

  it("without an alert or a server threshold, no utilization makes a card near full (the old 75% / 90% bands are gone)", () => {
    const signal = nearFullSignal([]);
    expect(signal.thresholdBp).toBeNull();
    for (const bp of [7500, 9000, 9999]) {
      expect(capacityTone({ warehouseId: COON, utilizationBp: bp, availableGrams: 1 }, signal)).toBe('neutral');
    }
  });

  it("applies the alert's own thresholdPercent to the other warehouses (one the caller dismissed still shows)", () => {
    const signal = nearFullSignal([nearFullAlert(OOTY, { thresholdPercent: 90, utilizationPercent: 93.1 })]);
    expect(signal.thresholdBp).toBe(9000);
    expect(capacityTone({ warehouseId: COON, utilizationBp: 9000, availableGrams: 1 }, signal)).toBe('nearFull');
    expect(capacityTone({ warehouseId: COON, utilizationBp: 8999, availableGrams: 1 }, signal)).toBe('neutral');
  });

  it('reads a decimal-string threshold, and ignores alerts of other types', () => {
    const low: AlertItemDto = { ...nearFullAlert(KOTA, { thresholdKg: '50.000' }), type: 'LOW_STOCK', itemKey: 'LOW_STOCK:x' };
    const signal = nearFullSignal([low, nearFullAlert(OOTY, { thresholdPercent: '85.5' })]);
    expect(signal.thresholdBp).toBe(8550);
    expect(signal.warehouseIds.has(KOTA)).toBe(false);
  });

  it('two different thresholds are not guessed between: only the alerts themselves count', () => {
    const signal = nearFullSignal([nearFullAlert(OOTY, { thresholdPercent: 90 }), nearFullAlert(COON, { thresholdPercent: 80 })]);
    expect(signal.thresholdBp).toBeNull();
    expect(capacityTone({ warehouseId: KOTA, utilizationBp: 9500, availableGrams: 1 }, signal)).toBe('neutral');
  });

  it('over capacity is a fact (available below zero, BR-66b) and needs no threshold', () => {
    expect(capacityTone({ warehouseId: OOTY, utilizationBp: 10001, availableGrams: -1 }, null)).toBe('over');
    expect(capacityTone({ warehouseId: OOTY, utilizationBp: 10000, availableGrams: 0 }, null)).toBe('neutral');
  });

  it('alerts not loaded yet, or no capacity set: neutral, never a claim', () => {
    expect(capacityTone({ warehouseId: OOTY, utilizationBp: 9900, availableGrams: 1 }, null)).toBe('neutral');
    expect(capacityTone({ warehouseId: OOTY, utilizationBp: null, availableGrams: null }, nearFullSignal([]))).toBe('neutral');
  });
});

describe('BR-84: the staff count is derived from the roll call', () => {
  it("counts the warehouse's ACTIVE staff in the roll call", () => {
    const rc = rollCall([
      staff({ staffId: 'a' }),
      staff({ staffId: 'b', attendance: { id: 'm', status: 'PRESENT', checkIn: null, checkOut: null, note: null } }),
      staff({ staffId: 'c', staffStatus: 'INACTIVE' }),
      staff({ staffId: 'd', warehouseId: COON }),
    ]);
    expect(activeStaffCount(rc, OOTY)).toBe(2);
    expect(activeStaffCount(rc, COON)).toBe(1);
  });

  it('an empty roll call of a warehouse the caller can read is a real zero', () => {
    expect(activeStaffCount(rollCall([]), OOTY)).toBe(0);
  });
});

describe('the rbac codes the new figures are gated on exist in docs/rbac.json', () => {
  it('storage areas need inventory.batch.view; the staff count needs admin.staff.attendance.view', () => {
    expect(WAREHOUSE_OVERVIEW_CODES).toEqual({ storageAreas: 'inventory.batch.view', staffCount: 'admin.staff.attendance.view' });
    const rbac = fs.readFileSync(path.join(SRC, '..', '..', '..', 'docs', 'rbac.json'), 'utf8');
    for (const code of Object.values(WAREHOUSE_OVERVIEW_CODES)) expect(rbac).toContain(`"${code}"`);
  });
});

describe('wiring: the screens use the shared module (source checks; no DOM in this vitest)', () => {
  const MAIN = read('roles/admin/screens/dashboard/MainWarehouseAdminDashboardScreen.tsx');
  const MAPPERS = read('roles/admin/screens/dashboard/mappers_mainDashboard.ts');
  const LIST = read('roles/admin/screens/warehouse/warehouse-admin/WarehouseOverviewScreen.tsx');
  const DETAIL = read('roles/admin/screens/warehouse/warehouse-admin/WarehouseCityDetailScreen.tsx');
  const KPIS = read('roles/admin/screens/warehouse/dashboard-home-more/useDashboardKpis.ts');
  const EN = JSON.parse(read('roles/admin/i18n/en.json')) as Record<string, string>;
  const TA = JSON.parse(read('roles/admin/i18n/ta.json')) as Record<string, string>;

  it('CLAUDE.md 2.7: the hard-coded 75% / 90% capacity bands are removed from the Main dashboard', () => {
    expect(MAPPERS).not.toMatch(/UTILIZATION_(WARN|DANGER)_BP/);
    expect(MAIN).not.toMatch(/UTILIZATION_(WARN|DANGER)_BP|capacityLevel\(/);
    expect(MAIN).toContain('nearFullSignal(');
    expect(MAIN).toContain('capacityTone(');
  });

  it("BR-80: the overview cards' receipts are the per-warehouse performance count, not a page-capped list filter", () => {
    expect(MAIN).not.toContain('goodsReceipts.filter((g) => g.warehouseId === row.warehouseId)');
    expect(MAIN).toContain('receiptsByWarehouse');
    expect(KPIS).toContain('receiptsByWarehouse(rows)');
  });

  it('BR-79: storage areas are read only while Capacity Summary is open and only with inventory.batch.view', () => {
    expect(MAIN).toContain('const canStorageAreas = can(WAREHOUSE_OVERVIEW_CODES.storageAreas);');
    expect(MAIN).toContain("useStorageAreaTotal(coveredIds, canAllView && canStorageAreas && whSubView === 'warehouse_capacity')");
    expect(MAIN).toContain('{canStorageAreas ? (');
  });

  it("BR-80: City Detail shows today's receipts from that warehouse's performance", () => {
    expect(DETAIL).toContain('useTodayPerformance(');
    expect(DETAIL).toContain('todayReceiptsCount(');
  });

  it('BR-84: the Warehouse List shows a staff count only with admin.staff.attendance.view and a successful read', () => {
    expect(LIST).toContain('can(WAREHOUSE_OVERVIEW_CODES.staffCount)');
    expect(LIST).toContain('useStaffCounts(');
    expect(LIST).toMatch(/staffCount !== undefined \?/);
  });

  it('new strings exist in both catalogues', () => {
    for (const key of [
      'mainDashboard.overview.title',
      'mainDashboard.capacity.storageAreas',
      'warehouseAdmin.overview.stat.staff',
      'warehouseAdmin.detail.kpi.todayReceipts',
    ]) {
      expect({ key, en: typeof EN[key] }).toEqual({ key, en: 'string' });
      expect({ key, ta: typeof TA[key] }).toEqual({ key, ta: 'string' });
    }
  });
});
