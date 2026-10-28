/**
 * Warehouse Activity (design D03, "Today's Operations" / activity log) wired
 * to GET /warehouses/{id}/activity (BR-104). Everything the screen decides is
 * a pure function in storage-ops/mappers_activity.ts, so it is covered here in
 * plain Node; the screen and its hook only pass values through.
 */
import { describe, expect, it } from 'vitest';
import type { WarehouseActivityEventDto } from '../api/warehouseActivity';
import {
  ACTIVITY_CHIPS,
  activityChipLabel,
  activityFetchTargets,
  activityModuleFor,
  activityRange,
  activityStatusBadge,
  activityTypesFor,
  filterActivityRows,
  mergeActivityPages,
  shortWarehouseName,
  toActivityRow,
} from '../screens/warehouse/storage-ops/mappers_activity';

// 26 Oct 2026, 12:00 PM IST.
const NOW = new Date('2026-10-26T06:30:00Z');

function event(over: Partial<WarehouseActivityEventDto> = {}): WarehouseActivityEventDto {
  return {
    type: 'STOCK_MOVEMENT',
    sourceId: 'src-1',
    occurredAt: '2026-10-26T05:12:00.123456Z',
    reference: 'RECEIPT',
    status: null,
    severity: null,
    qtyKg: null,
    direction: null,
    actorId: null,
    ...over,
  };
}

const COONOOR = { id: 'wh-coon', name: 'Coonoor Warehouse' };

describe('activity filter chips', () => {
  it('are All plus the six API event types, and Material Handling is gone (excluded feature)', () => {
    expect(ACTIVITY_CHIPS).toEqual(['all', 'STOCK_MOVEMENT', 'GOODS_RECEIPT', 'TRANSFER', 'ISSUE', 'RETURN', 'DOCUMENT']);
    const labels = ACTIVITY_CHIPS.map(activityChipLabel);
    expect(labels).toEqual(['All', 'Stock Movement', 'Goods Receipt', 'Transfer', 'Operational Issue', 'Return', 'Document']);
    expect(labels.some((l) => /material/i.test(l))).toBe(false);
  });

  it('BR-104: All sends no type filter; a type chip sends exactly that type', () => {
    expect(activityTypesFor('all')).toBeUndefined();
    expect(activityTypesFor('GOODS_RECEIPT')).toEqual(['GOODS_RECEIPT']);
  });
});

describe('activityRange (preset)', () => {
  it('BR-104: Today asks for the IST calendar day as from = to', () => {
    expect(activityRange('Today', NOW)).toEqual({ from: '2026-10-26', to: '2026-10-26' });
    // 19:00 UTC on the 25th is already the 26th in IST.
    expect(activityRange('Today', new Date('2026-10-25T19:00:00Z'))).toEqual({ from: '2026-10-26', to: '2026-10-26' });
  });

  it('All (and no preset) sends no date range', () => {
    expect(activityRange('All', NOW)).toEqual({});
    expect(activityRange(undefined, NOW)).toEqual({});
  });
});

describe('activityFetchTargets', () => {
  const live = [
    { id: 'wh-ooty', name: 'Ooty Warehouse' },
    { id: 'wh-coon', name: 'Coonoor Warehouse' },
  ];

  it('BR-30: a Sub admin always asks for its own warehouse, whatever else is passed', () => {
    expect(activityFetchTargets({ warehouseId: 'wh-own', warehouseName: 'Kotagiri' }, 'wh-ooty', live)).toEqual([
      { id: 'wh-own', name: 'Kotagiri' },
    ]);
  });

  it('Main with no selection reads every live warehouse', () => {
    expect(activityFetchTargets({}, undefined, live)).toEqual(live);
  });

  it('Main with a selection reads only that warehouse', () => {
    expect(activityFetchTargets({}, 'wh-coon', live)).toEqual([{ id: 'wh-coon', name: 'Coonoor Warehouse' }]);
  });

  it('Main with a selection that is not in the live list reads nothing (no guessed id)', () => {
    expect(activityFetchTargets({}, 'wh-gone', live)).toEqual([]);
  });

  it('Main before the warehouse list has loaded reads nothing', () => {
    expect(activityFetchTargets({}, undefined, undefined)).toEqual([]);
  });
});

describe('mergeActivityPages', () => {
  it('BR-104: merges several warehouses newest first by occurredAt (microsecond precision)', () => {
    const merged = mergeActivityPages([
      {
        warehouseId: 'a',
        hasMore: false,
        items: [event({ sourceId: 'a2', occurredAt: '2026-10-26T05:00:00.000900Z' }), event({ sourceId: 'a1', occurredAt: '2026-10-26T03:00:00Z' })],
      },
      {
        warehouseId: 'b',
        hasMore: false,
        items: [event({ sourceId: 'b2', occurredAt: '2026-10-26T05:00:00.0005Z' }), event({ sourceId: 'b1', occurredAt: '2026-10-26T04:00:00Z' })],
      },
    ]);
    expect(merged.map((m) => m.event.sourceId)).toEqual(['a2', 'b2', 'b1', 'a1']);
    expect(merged.map((m) => m.warehouseId)).toEqual(['a', 'b', 'b', 'a']);
  });

  it('BR-104: breaks a time tie the way the server orders (type DESC, then sourceId DESC)', () => {
    const at = '2026-10-26T05:00:00Z';
    const merged = mergeActivityPages([
      {
        warehouseId: 'a',
        hasMore: false,
        items: [event({ type: 'GOODS_RECEIPT', sourceId: 'x', occurredAt: at }), event({ type: 'TRANSFER', sourceId: 'y', occurredAt: at })],
      },
      { warehouseId: 'b', hasMore: false, items: [event({ type: 'TRANSFER', sourceId: 'z', occurredAt: at })] },
    ]);
    expect(merged.map((m) => `${m.event.type}:${m.event.sourceId}`)).toEqual(['TRANSFER:z', 'TRANSFER:y', 'GOODS_RECEIPT:x']);
  });

  it('cuts the merged list where a truncated page ends, so no older event of that warehouse is silently missing', () => {
    // Warehouse a has more rows older than 04:00 that were not loaded; b's 02:00
    // row would otherwise sit in a timeline that is missing a's 03:00 rows.
    const merged = mergeActivityPages([
      {
        warehouseId: 'a',
        hasMore: true,
        items: [event({ sourceId: 'a2', occurredAt: '2026-10-26T05:00:00Z' }), event({ sourceId: 'a1', occurredAt: '2026-10-26T04:00:00Z' })],
      },
      {
        warehouseId: 'b',
        hasMore: false,
        items: [event({ sourceId: 'b2', occurredAt: '2026-10-26T04:30:00Z' }), event({ sourceId: 'b1', occurredAt: '2026-10-26T02:00:00Z' })],
      },
    ]);
    expect(merged.map((m) => m.event.sourceId)).toEqual(['a2', 'b2', 'a1']);
  });

  it('keeps the same transfer once per warehouse feed it appears in, but never twice for one warehouse', () => {
    const transfer = event({ type: 'TRANSFER', sourceId: 't1', direction: 'OUTBOUND' });
    const merged = mergeActivityPages([
      { warehouseId: 'a', hasMore: false, items: [transfer, transfer] },
      { warehouseId: 'b', hasMore: false, items: [{ ...transfer, direction: 'INBOUND' }] },
    ]);
    expect(merged.map((m) => m.warehouseId).sort()).toEqual(['a', 'b']);
  });

  it('is empty for no pages', () => {
    expect(mergeActivityPages([])).toEqual([]);
  });
});

describe('activityStatusBadge', () => {
  it('maps done states to success', () => {
    for (const s of ['ACCEPTED', 'PARTIALLY_ACCEPTED', 'RECEIVED', 'RESOLVED', 'CLOSED', 'APPROVED', 'REFUNDED', 'ARCHIVED']) {
      expect(activityStatusBadge(s)?.tone).toBe('success');
    }
  });

  it('maps REJECTED, CANCELLED and OPEN to danger', () => {
    expect(activityStatusBadge('REJECTED')).toEqual({ label: 'Rejected', tone: 'danger' });
    expect(activityStatusBadge('CANCELLED')?.tone).toBe('danger');
    expect(activityStatusBadge('OPEN')).toEqual({ label: 'Open', tone: 'danger' });
  });

  it('maps every other known status to warning', () => {
    expect(activityStatusBadge('AWAITING_QC')).toEqual({ label: 'Awaiting QC', tone: 'warning' });
    expect(activityStatusBadge('IN_TRANSIT')?.tone).toBe('warning');
  });

  it('shows no badge without a status, or for a status the catalogue does not know (no raw code on screen)', () => {
    expect(activityStatusBadge(null)).toBeNull();
    expect(activityStatusBadge('SOMETHING_NEW')).toBeNull();
  });
});

describe('shortWarehouseName', () => {
  it('drops a trailing " Warehouse" only', () => {
    expect(shortWarehouseName('Coonoor Warehouse')).toBe('Coonoor');
    expect(shortWarehouseName('Gudalur Market')).toBe('Gudalur Market');
    expect(shortWarehouseName('Warehouse Row Store')).toBe('Warehouse Row Store');
  });
});

describe('toActivityRow', () => {
  it('builds the card from a stock movement: type title, signed kg, short warehouse, IST time', () => {
    const row = toActivityRow(event({ qtyKg: '-12.500', reference: 'SALE' }), COONOOR, NOW);
    expect(row.title).toBe('Stock Movement');
    expect(row.subtitle).toBe('SALE · -12.5 kg · Coonoor');
    expect(row.time).toBe('Today · 10:42 AM');
    expect(row.status).toBeNull();
    expect(row.warehouseName).toBe('Coonoor');
    expect(row.warehouseFullName).toBe('Coonoor Warehouse');
    expect(row.qtyLabel).toBe('-12.5 kg');
  });

  it('uses the plain subtitle when the event has no kg (never a 0)', () => {
    const row = toActivityRow(
      event({ type: 'ISSUE', reference: 'ISS-0042', status: 'OPEN', severity: 'HIGH', qtyKg: null }),
      COONOOR,
      NOW,
    );
    expect(row.subtitle).toBe('ISS-0042 · Coonoor');
    expect(row.qtyLabel).toBeNull();
    expect(row.status).toEqual({ label: 'Open', tone: 'danger' });
  });

  it('treats a malformed kg value as absent rather than guessing', () => {
    expect(toActivityRow(event({ qtyKg: 'abc' }), COONOOR, NOW).qtyLabel).toBeNull();
  });

  it('carries the transfer direction label and no qty', () => {
    const row = toActivityRow(event({ type: 'TRANSFER', reference: 'TRF-9', direction: 'INBOUND', status: 'IN_TRANSIT' }), COONOOR, NOW);
    expect(row.directionLabel).toBe('Inbound');
    expect(row.subtitle).toBe('TRF-9 · Coonoor');
  });

  it('BR-104: only carries API fields (no actor name, no free text, no farm data)', () => {
    const row = toActivityRow(event({ actorId: 'user-uuid' }), COONOOR, NOW);
    expect(Object.keys(row).sort()).toEqual(
      [
        'directionLabel',
        'key',
        'module',
        'occurredAt',
        'qtyLabel',
        'reference',
        'sourceId',
        'status',
        'subtitle',
        'time',
        'title',
        'type',
        'warehouseFullName',
        'warehouseId',
        'warehouseName',
      ].sort(),
    );
    expect(JSON.stringify(row)).not.toContain('user-uuid');
  });

  it('keys a row by warehouse, type and source id (a transfer shows once per warehouse)', () => {
    const row = toActivityRow(event({ type: 'TRANSFER', sourceId: 't1' }), COONOOR, NOW);
    expect(row.key).toBe('wh-coon:TRANSFER:t1');
  });

  it('links only a goods receipt to its owning module (receiving); nothing else has a live destination', () => {
    expect(activityModuleFor('GOODS_RECEIPT')).toBe('receiving');
    for (const type of ['STOCK_MOVEMENT', 'TRANSFER', 'ISSUE', 'RETURN', 'DOCUMENT'] as const) {
      expect(activityModuleFor(type)).toBeUndefined();
    }
    expect(toActivityRow(event({ type: 'GOODS_RECEIPT' }), COONOOR, NOW).module).toBe('receiving');
  });
});

describe('filterActivityRows (client search)', () => {
  // Built inside each test (not at collection time) so a broken mapper fails the tests, not the file.
  const rows = () => [
    toActivityRow(event({ sourceId: '1', type: 'GOODS_RECEIPT', reference: 'GRN-00291' }), COONOOR, NOW),
    toActivityRow(event({ sourceId: '2', type: 'TRANSFER', reference: 'TRF-7' }), { id: 'wh-ooty', name: 'Ooty Warehouse' }, NOW),
  ];

  it('returns every row for an empty or blank query', () => {
    expect(filterActivityRows(rows(), '')).toHaveLength(2);
    expect(filterActivityRows(rows(), '   ')).toHaveLength(2);
  });

  it('matches the reference, the type label and the warehouse, case-insensitively', () => {
    expect(filterActivityRows(rows(), 'grn-002').map((r) => r.sourceId)).toEqual(['1']);
    expect(filterActivityRows(rows(), 'transfer').map((r) => r.sourceId)).toEqual(['2']);
    expect(filterActivityRows(rows(), 'OOTY').map((r) => r.sourceId)).toEqual(['2']);
  });

  it('returns nothing when no row matches', () => {
    expect(filterActivityRows(rows(), 'tomato')).toEqual([]);
  });
});
