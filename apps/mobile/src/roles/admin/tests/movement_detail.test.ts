/**
 * Movement Detail (design M3-16, route M3S15): one stock ledger row, opened
 * from the Stock Ledger list.
 *
 * There is no GET /admin/stock-ledger/{id} (docs/openapi.yaml), so the screen
 * renders the row the user tapped, carried in the route params. Without that
 * row it shows "not found" and asks nothing of the server. It shows only what
 * the ledger row carries (BR-37: the row is immutable, a correction is a new
 * row); the user who performed it is a bare uuid, so no name is shown.
 *
 * The pure parts (route params, the field list, the reference label, the
 * warehouse name) are tested directly; the wiring is pinned by reading the
 * sources, because JSX cannot render in this plain-Node vitest.
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { StockLedgerEntryDto } from '../api/inventory';
import en from '../i18n/en.json';
import ta from '../i18n/ta.json';
import { t } from '../i18n';
import { inventoryWarehouseName, toBatchRow, toStockMovementRow } from '../screens/warehouse/inventory/mappers';
import {
  movementDetailRows,
  movementParam,
  movementReference,
  movementRouteParams,
} from '../screens/warehouse/inventory/movementDetailMappers';
import { pairFields } from '../screens/warehouse/shared/infoFields';
import type { StockMovementRow } from '../screens/warehouse/inventory/types';

// 12 Oct 2026, 12:00 PM IST.
const NOW = new Date('2026-10-12T06:30:00Z');
const WAREHOUSE = '11111111-1111-4111-8111-111111111111';
const OTHER_WAREHOUSE = '99999999-9999-4999-8999-999999999999';
const BATCH = '33333333-3333-4333-8333-333333333333';
const GRN = 'abcdef01-2345-4678-9abc-def012345678';

function entry(overrides: Partial<StockLedgerEntryDto> = {}): StockLedgerEntryDto {
  return {
    id: '55555555-5555-4555-8555-555555555555',
    batchId: BATCH,
    warehouseId: WAREHOUSE,
    txnType: 'RECEIPT',
    qtyDeltaKg: '100.000',
    balanceAfterKg: '120.000',
    refType: 'GOODS_RECEIPT',
    refId: GRN,
    performedBy: '66666666-6666-4666-8666-666666666666',
    // 12 Oct 2026, 10:00 AM IST.
    performedAt: '2026-10-12T04:30:00Z',
    remarks: 'Goods receipt accepted',
    ...overrides,
  };
}

const knownBatch = new Map([
  [
    BATCH,
    toBatchRow({
      id: BATCH,
      batchCode: 'BAT-OOTY-001',
      warehouseId: WAREHOUSE,
      cropId: '22222222-2222-4222-8222-222222222222',
      cropName: 'Tomato',
      grade: 'GRADE_1',
      qtyAvailableKg: '120.000',
      status: 'ACTIVE',
    }),
  ],
]);

function row(overrides: Partial<StockLedgerEntryDto> = {}, batches = knownBatch): StockMovementRow {
  return toStockMovementRow(entry(overrides), NOW, batches);
}

/** Flatten the detail rows to label -> value, for readable assertions. */
function fieldsOf(rows: readonly (readonly { label: string; value: string }[])[]): Record<string, string> {
  return Object.fromEntries(rows.flat().map((f) => [f.label, f.value]));
}

describe('the ledger row carries what the detail needs', () => {
  it('BR-37: keeps the warehouse, the reference type and the reference id the server recorded', () => {
    const r = row();
    expect(r.warehouseId).toBe(WAREHOUSE);
    expect(r.refType).toBe('GOODS_RECEIPT');
    expect(r.refId).toBe(GRN);
  });

  it('leaves the reference out when the server sent none (never an empty string)', () => {
    const r = row({ refType: null, refId: null });
    expect('refType' in r).toBe(false);
    expect('refId' in r).toBe(false);
    const blank = row({ refType: '  ', refId: '' });
    expect('refType' in blank).toBe(false);
    expect('refId' in blank).toBe(false);
  });
});

describe('route params: the tapped row travels with the navigation', () => {
  it('round-trips the row unchanged', () => {
    const r = row();
    expect(movementParam(movementRouteParams(r))).toEqual(r);
  });

  it('returns undefined without a row (a deep link, a stale key), so the screen shows "not found"', () => {
    expect(movementParam(null)).toBeUndefined();
    expect(movementParam(undefined)).toBeUndefined();
    expect(movementParam({})).toBeUndefined();
    expect(movementParam({ movement: 'MV-000928' })).toBeUndefined();
    expect(movementParam({ movementId: '55555555-5555-4555-8555-555555555555' })).toBeUndefined();
  });

  it('rejects a row missing the fields the screen draws', () => {
    const { warehouseId: _w, ...noWarehouse } = row();
    expect(movementParam({ movement: noWarehouse })).toBeUndefined();
    const { typeLabel: _t, ...noType } = row();
    expect(movementParam({ movement: noType })).toBeUndefined();
    expect(movementParam({ movement: { ...row(), id: 42 } })).toBeUndefined();
  });
});

describe('movementReference: what the row points at, without inventing a code', () => {
  it('names the known reference types (any case) with a short form of the uuid', () => {
    const short = 'ABCDEF01';
    expect(movementReference('GOODS_RECEIPT', GRN)).toBe(
      t('stockShared.pair', { first: t('inventory.movementDetail.ref.GOODS_RECEIPT'), second: short }),
    );
    expect(movementReference('stock_adjustment', GRN)).toBe(
      t('stockShared.pair', { first: t('inventory.movementDetail.ref.STOCK_ADJUSTMENT'), second: short }),
    );
    expect(movementReference('ORDER', undefined)).toBe(t('inventory.movementDetail.ref.ORDER'));
    expect(movementReference('order_item', undefined)).toBe(t('inventory.movementDetail.ref.ORDER'));
    expect(movementReference('STOCK_TRANSFER', undefined)).toBe(t('inventory.movementDetail.ref.STOCK_TRANSFER'));
    expect(movementReference('return_request', undefined)).toBe(t('inventory.movementDetail.ref.RETURN_REQUEST'));
  });

  it('an unknown type shows only the short id; nothing at all hides the field', () => {
    expect(movementReference('TEST', GRN)).toBe('ABCDEF01');
    expect(movementReference('TEST', undefined)).toBeUndefined();
    expect(movementReference(undefined, undefined)).toBeUndefined();
  });
});

describe('inventoryWarehouseName: the name for a warehouse uuid', () => {
  const options = [
    { warehouseId: WAREHOUSE, warehouseName: 'Ooty' },
    { warehouseId: OTHER_WAREHOUSE, warehouseName: 'Coonoor' },
  ];

  it("BR-30: a Sub scope names its own warehouse from the scope, without the warehouse list", () => {
    expect(inventoryWarehouseName({ warehouseId: WAREHOUSE, warehouseName: 'Ooty Sub' }, [], WAREHOUSE)).toBe('Ooty Sub');
  });

  it('the Main view names any warehouse from GET /warehouses', () => {
    expect(inventoryWarehouseName({}, options, OTHER_WAREHOUSE)).toBe('Coonoor');
  });

  it('an unknown or missing uuid has no name (the field is hidden, never the uuid)', () => {
    expect(inventoryWarehouseName({}, options, '00000000-0000-4000-8000-000000000000')).toBeUndefined();
    expect(inventoryWarehouseName({}, options, undefined)).toBeUndefined();
    expect(inventoryWarehouseName({ warehouseId: WAREHOUSE }, [], WAREHOUSE)).toBeUndefined();
  });
});

describe('movementDetailRows: only what the ledger row carries', () => {
  it('BR-37: shows the type, the signed delta, the balance after, batch, product, reference, IST time and warehouse', () => {
    const fields = fieldsOf(movementDetailRows(row(), 'Ooty'));
    expect(fields).toEqual({
      [t('inventory.movementDetail.field.type')]: t('inventory.movement.receipt'),
      [t('inventory.movementDetail.field.warehouse')]: 'Ooty',
      [t('inventory.movementDetail.field.quantity')]: '+100 kg',
      [t('inventory.movementDetail.field.balanceAfter')]: '120 kg',
      [t('inventory.movementDetail.field.product')]: `Tomato · ${t('inventory.grade.GRADE_1')}`,
      [t('inventory.movementDetail.field.batch')]: 'BAT-OOTY-001',
      [t('inventory.movementDetail.field.reference')]: t('stockShared.pair', {
        first: t('inventory.movementDetail.ref.GOODS_RECEIPT'),
        second: 'ABCDEF01',
      }),
      [t('inventory.movementDetail.field.performedAt')]: 'Today · 10:00 AM',
    });
  });

  it('BR-37: an outflow keeps its own minus sign', () => {
    const fields = fieldsOf(movementDetailRows(row({ txnType: 'SALE', qtyDeltaKg: '-20.000', balanceAfterKg: '100.000' }), 'Ooty'));
    expect(fields[t('inventory.movementDetail.field.quantity')]).toBe('-20 kg');
  });

  it('hides every field the row does not carry: no warehouse name, unknown batch, no reference, unreadable figures', () => {
    const bare = row({ refType: null, refId: null, qtyDeltaKg: '1e3', balanceAfterKg: 'x' }, new Map());
    const labels = movementDetailRows(bare, undefined)
      .flat()
      .map((f) => f.label);
    expect(labels).toEqual([t('inventory.movementDetail.field.type'), t('inventory.movementDetail.field.performedAt')]);
  });

  it('never shows who performed it (a uuid only) and no movement code the API does not have', () => {
    const values = movementDetailRows(row(), 'Ooty')
      .flat()
      .map((f) => f.value)
      .join(' ');
    expect(values).not.toContain('66666666');
    expect(values).not.toMatch(/MV-|GRN-/);
  });
});

describe('pairFields: two columns per row, hidden fields dropped', () => {
  it('pairs in order and drops undefined', () => {
    const a = { label: 'A', value: '1' };
    const b = { label: 'B', value: '2' };
    const c = { label: 'C', value: '3' };
    expect(pairFields([a, undefined, b, c])).toEqual([[a, b], [c]]);
    expect(pairFields([undefined])).toEqual([]);
  });
});

// ─── Wiring (source scan) ────────────────────────────────────────────────────

const ADMIN = path.join(__dirname, '..');
const INVENTORY = path.join(ADMIN, 'screens', 'warehouse', 'inventory');
const read = (name: string) => fs.readFileSync(path.join(INVENTORY, name), 'utf8');
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

describe('Movement Detail wiring', () => {
  const SCREEN = read('MovementDetailScreen.tsx');
  const FLOW = read('InventoryFlow.tsx');
  const LEDGER = read('StockLedgerScreen.tsx');
  const INDEX = read('index.ts');

  it('the two sample-data movement screens are gone, with their exports and the receipt route', () => {
    expect(fs.existsSync(path.join(INVENTORY, 'StockMovementDetailScreen.tsx'))).toBe(false);
    expect(fs.existsSync(path.join(INVENTORY, 'StockMovementReceiptScreen.tsx'))).toBe(false);
    for (const source of [FLOW, INDEX]) {
      expect(source).not.toMatch(/StockMovementDetailScreen|StockMovementReceiptScreen/);
    }
    expect(code(FLOW)).not.toMatch(/'M3S18'/);
  });

  it('M3S15 renders the live screen from the route params, with the warehouse name hook', () => {
    expect(FLOW).toMatch(/case 'M3S15':\s*return <LiveMovementDetailRoute \{\.\.\.live\} \/>;/);
    expect(FLOW).toMatch(/const movement = movementParam\(common\.routeParams \?\? null\);/);
    expect(FLOW).toMatch(/useInventoryWarehouseName\(common\.scope, common\.can, movement\?\.warehouseId\)/);
  });

  it('a ledger row opens M3S15 with the row itself (there is no per-id ledger read)', () => {
    expect(LEDGER).toMatch(/onPress=\{\(\) => onNavigate\?\.\('M3S15', movementRouteParams\(movement\)\)\}/);
  });

  it('the screen makes no request of its own and carries no sample data', () => {
    expect(SCREEN).not.toMatch(/useAdminQuery|from '\.\.\/\.\.\/\.\.\/api\//);
    expect(SCREEN).not.toMatch(/fixtures|MV-0|GRN-0|Suresh|\+140|'10:4\d AM'/);
    expect(SCREEN).toMatch(/movement === undefined/);
    expect(SCREEN).toMatch(/t\('inventory\.movementDetail\.notFound'\)/);
  });

  it('the screen holds no English literal and no raw colour', () => {
    const body = code(SCREEN);
    expect(body.match(/>\s*[A-Za-z][A-Za-z0-9 ,.'?&/·-]*\s*<\//g) ?? []).toEqual([]);
    expect(body.match(/\b(title|label|subtitle|placeholder|accessibilityLabel)=["'][^"']*[A-Za-z][^"']*["']/g) ?? []).toEqual([]);
    expect(body.match(/#[0-9a-fA-F]{3,8}\b|rgba?\(/g) ?? []).toEqual([]);
  });

  it('every movement detail key has English and Tamil strings', () => {
    const keys = Object.keys(en).filter((key) => key.startsWith('inventory.movementDetail.') || key.startsWith('inventory.ledger.'));
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.filter((key) => !(key in ta))).toEqual([]);
  });
});
