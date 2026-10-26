/**
 * screens/warehouse/storage-ops/mappers.ts: API rows -> the live storage-ops
 * views, and the form drafts -> request bodies. Plain-Node vitest, no React.
 */
import { describe, expect, it } from 'vitest';
import type { BatchDto } from '../api/inventory';
import type { WarehouseActivityEventDto } from '../api/warehouseActivity';
import type { WarehouseIssueDto } from '../api/warehouseIssues';
import type { WarehousePerformanceDto } from '../api/warehouseOps';
import type { StorageLocationDto } from '../api/warehouses';
import { t } from '../i18n';
import {
  activityFilterTypes,
  activityPresetRange,
  buildComment,
  buildCreateIssueBody,
  buildLocationBody,
  buildStatusChange,
  canCommentOn,
  countLabel,
  groupLocationsByType,
  ISSUE_NEXT_STATUSES,
  issueFilterStatus,
  istDate,
  locationBatches,
  locationInfoRows,
  locationStockOf,
  nextOffsetPage,
  parseCapacityInput,
  percentOf,
  performanceRange,
  stockByLocationCode,
  storageWarehouseId,
  toActivityRow,
  toCapacityView,
  toIssueRow,
  toLocationRow,
  toPerformanceView,
} from '../screens/warehouse/storage-ops/mappers';

const WH = '3f1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a01';
const OTHER = '99999999-9999-4999-8999-999999999999';
// 2026-10-14 20:00 UTC = 2026-10-15 01:30 IST.
const LATE_UTC = new Date('2026-10-14T20:00:00.000Z');
const NOON = new Date('2026-10-14T06:30:00.000Z');

describe('storageWarehouseId (BR-30)', () => {
  it('a Sub scope always sends its own warehouse, whatever was picked', () => {
    expect(storageWarehouseId({ warehouseId: WH }, OTHER)).toBe(WH);
  });
  it('the Main view sends its pick only when it is a uuid (old fixture ids are refused)', () => {
    expect(storageWarehouseId({}, OTHER)).toBe(OTHER);
    expect(storageWarehouseId({}, 'WH-OOTY')).toBeUndefined();
    expect(storageWarehouseId({}, undefined)).toBeUndefined();
  });
  it('a Sub scope with a non-uuid id asks for nothing', () => {
    expect(storageWarehouseId({ warehouseId: 'WH-COON' }, OTHER)).toBeUndefined();
  });
});

describe('IST dates', () => {
  it('reads the IST calendar day, not the UTC one', () => {
    expect(istDate(LATE_UTC)).toBe('2026-10-15');
    expect(istDate(NOON, 6)).toBe('2026-10-08');
  });
  it('BR-104: the Today preset sends today (IST) as both ends; All sends no range', () => {
    expect(activityPresetRange('Today', LATE_UTC)).toEqual({ from: '2026-10-15', to: '2026-10-15' });
    expect(activityPresetRange('All', LATE_UTC)).toBeUndefined();
  });
  it('BR-80: performance periods are inclusive IST ranges ending today', () => {
    expect(performanceRange('TODAY', NOON)).toEqual({ from: '2026-10-14', to: '2026-10-14' });
    expect(performanceRange('LAST_7', NOON)).toEqual({ from: '2026-10-08', to: '2026-10-14' });
    expect(performanceRange('LAST_30', NOON)).toEqual({ from: '2026-09-15', to: '2026-10-14' });
  });
});

const ISSUE: WarehouseIssueDto = {
  id: '5a1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a02',
  issueNumber: 'WI-000007',
  warehouseId: WH,
  category: 'EQUIPMENT',
  severity: 'CRITICAL',
  title: 'Scale drift',
  description: '  ',
  status: 'IN_PROGRESS',
  reportedBy: OTHER,
  assignedTo: null,
  resolutionNote: null,
  resolvedBy: null,
  resolvedAt: null,
  closedAt: null,
  createdAt: '2026-10-14T05:00:00.000Z',
  updatedAt: null,
};

describe('operational issues (BR-103)', () => {
  it('maps an issue to labelled, toned values and drops a blank description', () => {
    const row = toIssueRow(ISSUE, NOON);
    expect(row.issueNumber).toBe('WI-000007');
    expect(row.statusLabel).toBe(t('storageOps.issue.status.IN_PROGRESS'));
    expect(row.statusTone).toBe('warning');
    expect(row.severityTone).toBe('danger');
    expect(row.categoryLabel).toBe(t('storageOps.issue.category.EQUIPMENT'));
    expect(row.description).toBeUndefined();
    expect(row.isAssigned).toBe(false);
    expect(row.reportedAt).not.toBe('');
  });

  it('an unknown status from a newer server still renders (as sent), with a neutral tone', () => {
    const row = toIssueRow({ ...ISSUE, status: 'ESCALATED' as WarehouseIssueDto['status'] }, NOON);
    expect(row.statusLabel).toBe('ESCALATED');
    expect(row.statusTone).toBe('info');
  });

  it('BR-103: offers exactly the legal status moves; CLOSED is terminal and takes no comment', () => {
    expect(ISSUE_NEXT_STATUSES).toEqual({
      OPEN: ['IN_PROGRESS', 'RESOLVED'],
      IN_PROGRESS: ['OPEN', 'RESOLVED'],
      RESOLVED: ['CLOSED', 'IN_PROGRESS'],
      CLOSED: [],
    });
    expect(canCommentOn('CLOSED')).toBe(false);
    expect(canCommentOn('RESOLVED')).toBe(true);
  });

  it('BR-103: resolving needs a resolution note; other moves send only the status', () => {
    expect(buildStatusChange('RESOLVED', '   ')).toEqual({ ok: false, error: 'storageOps.issue.error.noteRequired' });
    expect(buildStatusChange('RESOLVED', ' Fixed ')).toEqual({ ok: true, body: { status: 'RESOLVED', resolutionNote: 'Fixed' } });
    expect(buildStatusChange('CLOSED', 'ignored')).toEqual({ ok: true, body: { status: 'CLOSED' } });
    expect(buildStatusChange('RESOLVED', 'x'.repeat(2001))).toEqual({ ok: false, error: 'storageOps.issue.error.noteLong' });
  });

  it('BR-103: the report form needs category, severity and a 1-160 title; description is optional', () => {
    expect(buildCreateIssueBody({ category: undefined, severity: undefined, title: ' ', description: '' })).toEqual({
      ok: false,
      errors: {
        category: 'storageOps.report.error.category',
        severity: 'storageOps.report.error.severity',
        title: 'storageOps.report.error.title',
      },
    });
    expect(buildCreateIssueBody({ category: 'SAFETY', severity: 'LOW', title: 'x'.repeat(161), description: '' })).toEqual({
      ok: false,
      errors: { title: 'storageOps.report.error.titleLong' },
    });
    expect(buildCreateIssueBody({ category: 'SAFETY', severity: 'LOW', title: ' Wet floor ', description: '  ' })).toEqual({
      ok: true,
      body: { category: 'SAFETY', severity: 'LOW', title: 'Wet floor' },
    });
    expect(buildCreateIssueBody({ category: 'OTHER', severity: 'HIGH', title: 'T', description: ' Bay 2 ' })).toEqual({
      ok: true,
      body: { category: 'OTHER', severity: 'HIGH', title: 'T', description: 'Bay 2' },
    });
  });

  it('a comment is trimmed and must not be empty', () => {
    expect(buildComment('  ')).toEqual({ ok: false, error: 'storageOps.issue.error.commentEmpty' });
    expect(buildComment(' ok ')).toEqual({ ok: true, body: 'ok' });
  });

  it('the ALL chip sends no status filter', () => {
    expect(issueFilterStatus('ALL')).toBeUndefined();
    expect(issueFilterStatus('RESOLVED')).toBe('RESOLVED');
  });
});

describe('offset paging', () => {
  it('asks for the next page only while rows remain', () => {
    expect(nextOffsetPage({ page: 1, pageSize: 20, total: 45, items: [1] })).toBe(2);
    expect(nextOffsetPage({ page: 3, pageSize: 20, total: 45, items: [1] })).toBeUndefined();
    expect(nextOffsetPage({ page: 1, pageSize: 20, total: 45, items: [] })).toBeUndefined();
  });
});

describe('warehouse activity (BR-104)', () => {
  const base: WarehouseActivityEventDto = {
    type: 'STOCK_MOVEMENT',
    sourceId: '7a1b7c2e-2a44-4f0e-9b1a-6b0d2f0f1a04',
    occurredAt: '2026-10-14T05:00:00.000001Z',
    reference: 'WASTAGE',
    status: null,
    severity: null,
    qtyKg: '-12.500',
    direction: null,
    actorId: null,
  };

  it('a stock movement shows its movement type as a label and its signed kg', () => {
    const row = toActivityRow(base, NOON);
    expect(row.key).toBe(`STOCK_MOVEMENT:${base.sourceId}`);
    expect(row.reference).toBe(t('storageOps.movement.WASTAGE'));
    expect(row.quantity).toBe(t('unit.kg', { value: '-12.5' }));
    expect(row.statusLabel).toBeUndefined();
    expect(row.module).toBeUndefined();
    expect(row.hasActor).toBe(false);
  });

  it('an issue event links to its issue, with the issue status and severity labels', () => {
    const row = toActivityRow({ ...base, type: 'ISSUE', reference: 'WI-000007', status: 'OPEN', severity: 'HIGH', qtyKg: null }, NOON);
    expect(row.module).toBe('operational_issue');
    expect(row.statusLabel).toBe(t('storageOps.issue.status.OPEN'));
    expect(row.severityLabel).toBe(t('storageOps.issue.severity.HIGH'));
    expect(row.reference).toBe('WI-000007');
  });

  it('a goods receipt links to receiving; a transfer shows its direction', () => {
    expect(toActivityRow({ ...base, type: 'GOODS_RECEIPT', reference: 'GRN-1' }, NOON).module).toBe('receiving');
    const transfer = toActivityRow({ ...base, type: 'TRANSFER', reference: 'TR-1', direction: 'INBOUND', actorId: OTHER }, NOON);
    expect(transfer.directionLabel).toBe(t('storageOps.activity.direction.INBOUND'));
    expect(transfer.hasActor).toBe(true);
  });

  it('BR-104: a chip filters on exactly one API type; ALL on none', () => {
    expect(activityFilterTypes('ALL')).toBeUndefined();
    expect(activityFilterTypes('RETURN')).toEqual(['RETURN']);
  });
});

const batch = (over: Partial<BatchDto>): BatchDto => ({
  id: 'b1',
  batchCode: 'B-1',
  warehouseId: WH,
  cropId: 'c1',
  cropName: 'Carrot',
  grade: 'GRADE_1',
  qtyAvailableKg: '10.000',
  storageLocation: 'CS-A',
  status: 'ACTIVE',
  ...over,
});

describe('storage locations (BR-79) and derived stock', () => {
  const batches = [
    batch({ id: 'b1', qtyAvailableKg: '10.250' }),
    batch({ id: 'b2', qtyAvailableKg: '5.000', storageLocation: ' CS-A ' }),
    batch({ id: 'b3', qtyAvailableKg: '7.000', status: 'DEPLETED' }),
    batch({ id: 'b4', qtyAvailableKg: '3.000', storageLocation: null }),
    batch({ id: 'b5', qtyAvailableKg: '2.000', storageLocation: 'DS-B' }),
  ];

  it('sums ACTIVE batch grams per location code (integer grams, no float)', () => {
    const map = stockByLocationCode(batches);
    expect(map.get('CS-A')).toEqual({ grams: 15250, batchCount: 2 });
    expect(map.get('DS-B')).toEqual({ grams: 2000, batchCount: 1 });
    expect(map.size).toBe(2);
  });

  it('a location with no batches has zero stock once batches are known, unknown before', () => {
    expect(locationStockOf(undefined, 'CS-A')).toBeUndefined();
    expect(locationStockOf(new Map(), 'X')).toEqual({ grams: 0, batchCount: 0 });
  });

  it('lists the batches at a code, largest first', () => {
    const rows = locationBatches(batches, 'CS-A');
    expect(rows.map((r) => r.id)).toEqual(['b1', 'b2']);
    expect(rows[0]?.productName).toBe('Carrot');
  });

  const dto: StorageLocationDto = {
    id: 'l1',
    warehouseId: WH,
    code: 'CS-A',
    name: 'Cold A',
    locationType: null,
    capacityKg: '20.000',
    isActive: true,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: null,
  };

  it('maps a location with derived occupancy; no layout fields are invented', () => {
    const row = toLocationRow(dto, { grams: 15250, batchCount: 2 }, NOON);
    expect(row.occupancyPercent).toBe(76);
    expect(row.typeLabel).toBe(t('storageOps.location.typeNotSet'));
    expect(row.available).toBe(t('unit.kg', { value: '4.75' }));
    expect(Object.keys(row)).not.toEqual(expect.arrayContaining(['rack']));
    expect(toLocationRow({ ...dto, capacityKg: null }, { grams: 1, batchCount: 1 }, NOON).occupancyPercent).toBeNull();
    expect(toLocationRow(dto, undefined, NOON).occupancyPercent).toBeNull();
  });

  it('M4-04: the info card names the warehouse the location belongs to, and hides it while unknown', () => {
    const row = toLocationRow(dto, undefined, NOON);
    const rows = locationInfoRows(row, 'Coonoor');
    expect(rows.flat()).toEqual([
      { label: t('storageOps.location.field.code'), value: 'CS-A' },
      { label: t('storageOps.location.field.type'), value: t('storageOps.location.typeNotSet') },
      { label: t('storageOps.location.field.warehouse'), value: 'Coonoor' },
      { label: t('storageOps.location.field.capacity'), value: row.capacity },
      { label: t('storageOps.location.field.created'), value: row.createdAt },
    ]);
    expect(rows.every((r) => r.length <= 2)).toBe(true);
    const labels = locationInfoRows(row, undefined).flat().map((f) => f.label);
    expect(labels).not.toContain(t('storageOps.location.field.warehouse'));
    // No section / rack / shelf: the API has no layout fields.
    expect(labels).toHaveLength(4);
    expect(locationInfoRows(toLocationRow({ ...dto, capacityKg: null }, undefined, NOON), 'Coonoor').flat()[3]?.value).toBe(
      t('storageOps.location.capacityNotSet'),
    );
  });

  it('groups by type with untyped locations last', () => {
    const now = NOON;
    const groups = groupLocationsByType([
      toLocationRow({ ...dto, id: 'a', code: 'Z' }, undefined, now),
      toLocationRow({ ...dto, id: 'b', code: 'B', locationType: 'Dry' }, undefined, now),
      toLocationRow({ ...dto, id: 'c', code: 'A', locationType: 'Cold' }, undefined, now),
    ]);
    expect(groups.map((g) => g.type)).toEqual(['Cold', 'Dry', undefined]);
  });

  it('percentOf rounds and refuses a missing or zero capacity', () => {
    expect(percentOf(1, 3)).toBe(33);
    expect(percentOf(5, 0)).toBeNull();
    expect(percentOf(5, null)).toBeNull();
  });

  it('BR-79: the location form validates lengths and turns capacity into a kg string', () => {
    expect(buildLocationBody({ code: ' CS-1 ', name: ' Cold ', locationType: ' ', capacityKg: '1,250.5' })).toEqual({
      ok: true,
      body: { code: 'CS-1', name: 'Cold', locationType: null, capacityKg: '1250.500' },
    });
    expect(buildLocationBody({ code: '', name: '', locationType: 'x'.repeat(41), capacityKg: '0' })).toEqual({
      ok: false,
      errors: {
        code: 'storageOps.location.error.code',
        name: 'storageOps.location.error.name',
        locationType: 'storageOps.location.error.type',
        capacityKg: 'storageOps.capacity.error.invalid',
      },
    });
  });

  it('capacity input: blank = none, positive with at most 3 decimals, never a float', () => {
    expect(parseCapacityInput('')).toEqual({ ok: true, value: null });
    expect(parseCapacityInput('0.1')).toEqual({ ok: true, value: '0.100' });
    expect(parseCapacityInput('1.2345')).toEqual({ ok: false, error: 'storageOps.capacity.error.invalid' });
    expect(parseCapacityInput('-5')).toEqual({ ok: false, error: 'storageOps.capacity.error.invalid' });
  });
});

describe('capacity (BR-66b) and performance (BR-80)', () => {
  it('BR-66b: shows the server numbers unclamped and flags over-capacity', () => {
    const view = toCapacityView({ warehouseId: WH, capacityKg: '100.000', usedKg: '120.000', availableKg: '-20.000', utilizationPercent: 120 });
    expect(view.overCapacity).toBe(true);
    expect(view.available).toBe(t('unit.kg', { value: '-20' }));
    expect(view.utilizationLabel).toBe('120%');
  });

  it('BR-66b: without a capacity there is no percentage and nothing over', () => {
    const view = toCapacityView({ warehouseId: WH, capacityKg: null, usedKg: '5.000', availableKg: null, utilizationPercent: null });
    expect(view).toMatchObject({ isSet: false, utilizationPercent: null, overCapacity: false, available: undefined });
  });

  it('BR-80: performance carries only the API counts and kg sums; empty movement types are dropped', () => {
    const dto: WarehousePerformanceDto = {
      warehouseId: WH,
      from: '2026-10-08',
      to: '2026-10-14',
      orders: { placed: 10, fulfilled: 7, cancelled: 1, byStatus: [] },
      receiving: { goodsReceipts: 3, byStatus: [], grossQtyKg: '100.000', acceptedQtyKg: '95.500', rejectedQtyKg: '4.500' },
      returns: { requested: 2, byStatus: [] },
      stockMovements: [
        { movementType: 'SALE', entries: 4, qtyKg: '-12.000' },
        { movementType: 'WASTAGE', entries: 0, qtyKg: '0.000' },
      ],
    };
    const view = toPerformanceView(dto);
    expect(view).toMatchObject({ ordersPlaced: 10, ordersFulfilled: 7, ordersCancelled: 1, goodsReceipts: 3, returnsRequested: 2 });
    expect(view.accepted).toBe(t('unit.kg', { value: '95.5' }));
    expect(view.movements).toEqual([{ type: 'SALE', label: t('storageOps.movement.SALE'), entries: 4, quantity: t('unit.kg', { value: '-12' }) }]);
  });

  it('a capped count reads "N+"', () => {
    expect(countLabel(12, true)).toBe('12');
    expect(countLabel(500, false)).toBe('500+');
  });
});
