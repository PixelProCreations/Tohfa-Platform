/**
 * Purchase Orders (admin, ported from the design branch's dashboard/PurchaseOrders*
 * screens) — the pure parts: access by permission code, the design's filter chips
 * mapped onto the API's query params (status / q / from / to), Money and Quantity
 * formatting without floats, status badges, the detail view model, paging, the
 * API client and the query keys. Plus a source guard over the new folder.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const http = vi.hoisted(() => ({ adminGet: vi.fn(), adminPost: vi.fn(), adminPatch: vi.fn(), adminPut: vi.fn() }));
vi.mock('../api/http', () => http);

import { makeCan } from '../permissions/can';
import { en } from '../i18n';
import { getPurchaseOrderDetail, listPurchaseOrderRows, type PurchaseOrderDetailRowDto, type PurchaseOrderListItemDto } from '../api/purchaseOrders';
import { purchaseOrderKeys, PURCHASE_ORDERS_MODULE } from '../api/queryKeys';
import {
  DASH,
  buildListFilters,
  chipStatusParam,
  formatMoneyOrDash,
  formatPricePerKgOrDash,
  formatQtyOrDash,
  isNearEnd,
  periodRange,
  purchaseOrdersAccess,
  searchParam,
  statusView,
  timelineSteps,
  toDetailView,
  toOrderRow,
} from '../screens/purchase-orders/purchaseOrdersLogic';

const NOW = new Date('2026-11-11T06:30:00.000Z'); // 12:00 IST, 11 Nov 2026

function dto(over: Partial<PurchaseOrderListItemDto> = {}): PurchaseOrderListItemDto {
  return {
    id: '7d2c1d1e-1111-4a4a-9b9b-000000000001',
    poNumber: 'PO-LIVE-000777',
    farmerId: 'f-uuid',
    listingId: 'l-uuid-0001',
    warehouseId: 'wh-uuid',
    cropId: 'c-uuid',
    grade: 'GRADE_2',
    quantityKg: '12.345' as PurchaseOrderListItemDto['quantityKg'],
    pricePerKg: '41.50' as PurchaseOrderListItemDto['pricePerKg'],
    totalAmount: '512.32' as PurchaseOrderListItemDto['totalAmount'],
    status: 'ISSUED',
    expectedDeliveryDate: null,
    issuedAt: '2026-11-02T04:30:00.000Z',
    farmerName: 'Live Farmer Arun',
    cropName: 'Okra Live',
    ...over,
  };
}

function detailDto(over: Partial<PurchaseOrderDetailRowDto> = {}): PurchaseOrderDetailRowDto {
  const { farmerName, cropName, ...rest } = dto();
  return { ...rest, farmerName: farmerName ?? 'x', cropName, goodsReceipts: [], ...over };
}

beforeEach(() => {
  for (const f of Object.values(http)) f.mockReset();
  http.adminGet.mockResolvedValue({ items: [], page: { nextCursor: null, hasMore: false } });
});

describe('access: purchase.order.view only, fail closed', () => {
  it('grants with the code, denies without it, denies a missing can', () => {
    expect(purchaseOrdersAccess(makeCan(['purchase.order.view'])).canView).toBe(true);
    expect(purchaseOrdersAccess(makeCan(['purchase.order.create'])).canView).toBe(false);
    expect(purchaseOrdersAccess(makeCan([])).canView).toBe(false);
    expect(purchaseOrdersAccess(undefined).canView).toBe(false);
  });
});

describe('design filter chips -> API params', () => {
  it('status chips: All none, Awaiting Handover ISSUED, Completed RECEIVED (spec enum), Collection Scheduled not available', () => {
    expect(chipStatusParam('ALL')).toEqual({ available: true, status: undefined });
    expect(chipStatusParam('AWAITING_HANDOVER')).toEqual({ available: true, status: 'ISSUED' });
    expect(chipStatusParam('COMPLETED')).toEqual({ available: true, status: 'RECEIVED' });
    expect(chipStatusParam('COLLECTION_SCHEDULED')).toEqual({ available: false, status: undefined });
  });

  it('period chips are inclusive IST days ending today', () => {
    expect(periodRange('ALL', NOW)).toEqual({});
    expect(periodRange('LAST_7', NOW)).toEqual({ from: '2026-11-05', to: '2026-11-11' });
    expect(periodRange('LAST_30', NOW)).toEqual({ from: '2026-10-13', to: '2026-11-11' });
    // Month and year boundaries go through the calendar, not a 30-day guess.
    expect(periodRange('LAST_7', new Date('2026-03-02T00:00:00.000Z'))).toEqual({ from: '2026-02-24', to: '2026-03-02' });
    expect(periodRange('LAST_30', new Date('2027-01-05T10:00:00.000Z'))).toEqual({ from: '2026-12-07', to: '2027-01-05' });
  });

  it('search: trimmed, blank is no q, capped at the API max of 100', () => {
    expect(searchParam('')).toBeUndefined();
    expect(searchParam('   ')).toBeUndefined();
    expect(searchParam('  okra ')).toBe('okra');
    expect(searchParam('x'.repeat(150))).toHaveLength(100);
  });

  it('buildListFilters only carries what is set', () => {
    expect(buildListFilters({ status: 'ALL', period: 'ALL', search: '' }, NOW)).toEqual({});
    expect(buildListFilters({ status: 'AWAITING_HANDOVER', period: 'LAST_7', search: ' arun ' }, NOW)).toEqual({
      status: 'ISSUED',
      q: 'arun',
      from: '2026-11-05',
      to: '2026-11-11',
    });
    // A not-available chip never reaches the API.
    expect(buildListFilters({ status: 'COLLECTION_SCHEDULED', period: 'ALL', search: '' }, NOW)).toEqual({});
  });
});

describe('Money and quantity: strings and integer units only', () => {
  it('formats Money strings in Indian grouping, dropping a whole-rupee .00 like the design', () => {
    expect(formatMoneyOrDash('512.32')).toBe('₹512.32');
    expect(formatMoneyOrDash('2250.00')).toBe('₹2,250');
    expect(formatMoneyOrDash('12345678.90')).toBe('₹1,23,45,678.90');
    expect(formatMoneyOrDash('0.1')).toBe('₹0.10');
  });

  it('a value that is not a Money string is the dash, never a rounded float', () => {
    expect(formatMoneyOrDash('1349.9999999')).toBe(DASH);
    expect(formatMoneyOrDash(1350)).toBe(DASH);
    expect(formatMoneyOrDash(null)).toBe(DASH);
    expect(formatMoneyOrDash(undefined)).toBe(DASH);
  });

  it('price per kg', () => {
    expect(formatPricePerKgOrDash('41.50')).toBe('₹41.50/kg');
    expect(formatPricePerKgOrDash('45.00')).toBe('₹45/kg');
    expect(formatPricePerKgOrDash('abc')).toBe(DASH);
  });

  it('quantities parse as integer grams', () => {
    expect(formatQtyOrDash('50.000')).toBe('50 kg');
    expect(formatQtyOrDash('12.345')).toBe('12.345 kg');
    expect(formatQtyOrDash('1250.5')).toBe('1,250.5 kg');
    expect(formatQtyOrDash('1e3')).toBe(DASH);
    expect(formatQtyOrDash(null)).toBe(DASH);
  });
});

describe('status badges', () => {
  it('maps every API status to a label key and the design tone', () => {
    expect(statusView('ISSUED')).toEqual({ labelKey: 'purchaseOrders.status.ISSUED', tone: 'amber' });
    expect(statusView('PARTIALLY_RECEIVED')).toEqual({ labelKey: 'purchaseOrders.status.PARTIALLY_RECEIVED', tone: 'blue' });
    expect(statusView('RECEIVED')).toEqual({ labelKey: 'purchaseOrders.status.RECEIVED', tone: 'green' });
    expect(statusView('CANCELLED')).toEqual({ labelKey: 'purchaseOrders.status.CANCELLED', tone: 'muted' });
    // The server's own enum (spec drift) still reads sensibly.
    expect(statusView('FULLY_RECEIVED')).toEqual({ labelKey: 'purchaseOrders.status.RECEIVED', tone: 'green' });
    expect(statusView('CLOSED')).toEqual({ labelKey: 'purchaseOrders.status.CLOSED', tone: 'muted' });
    expect(statusView('SOMETHING_NEW')).toEqual({ labelKey: null, tone: 'muted' });
    for (const s of ['ISSUED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED', 'CLOSED']) {
      expect((en as Record<string, string>)[`purchaseOrders.status.${s}`], s).toBeTruthy();
    }
  });
});

describe('row and detail view models', () => {
  it('a list row is built from the live DTO only', () => {
    const row = toOrderRow(dto());
    expect(row).toMatchObject({
      id: '7d2c1d1e-1111-4a4a-9b9b-000000000001',
      poNumber: 'PO-LIVE-000777',
      farmer: 'Live Farmer Arun',
      quantity: '12.345 kg',
      total: '₹512.32',
      tone: 'amber',
    });
    expect(row.produce).toBe(`Okra Live, ${en['purchaseOrders.grade.GRADE_2']}`);
  });

  it('missing farmer / crop names are the dash', () => {
    const row = toOrderRow(dto({ farmerName: null, cropName: null }));
    expect(row.farmer).toBe(DASH);
    expect(row.produce).toBe(DASH);
  });

  it('the detail view fills only what the API sends', () => {
    const view = toDetailView(detailDto({ tohfaFarmerId: 'TF-LIVE-9' }));
    expect(view.poNumber).toBe('PO-LIVE-000777');
    expect(view.listingId).toBe('l-uuid-0001');
    expect(view.farmerId).toBe('TF-LIVE-9');
    expect(view.agreedQty).toBe('12.345 kg');
    expect(view.agreedPrice).toBe('₹41.50/kg');
    expect(view.total).toBe('₹512.32');
    // Not in the API: listed quantity / price, farm location.
    expect(view.listedQty).toBe(DASH);
    expect(view.listedPrice).toBe(DASH);
    expect(view.farmLocation).toBe(DASH);
    const { listingId: _omit, ...noListing } = detailDto();
    expect(toDetailView(noListing).listingId).toBe(DASH);
    expect(toDetailView(detailDto()).farmerId).toBe(DASH);
  });

  it('timeline: PO created from issuedAt, current step from the status and the latest receipt; the rest are dashes', () => {
    const steps = timelineSteps(
      detailDto({
      status: 'PARTIALLY_RECEIVED',
      goodsReceipts: [
        { id: 'g1', grnNumber: 'GRN-1', purchaseOrderId: 'x', warehouseId: 'w', grossQtyKg: '1.000' as never, status: 'ACCEPTED', receivedAt: '2026-11-03T05:00:00.000Z' },
        { id: 'g2', grnNumber: 'GRN-2', purchaseOrderId: 'x', warehouseId: 'w', grossQtyKg: '1.000' as never, status: 'ACCEPTED', receivedAt: '2026-11-06T05:00:00.000Z' },
      ],
      }),
    );
    expect(steps.map((s) => s.key)).toEqual(['listingCreated', 'listingApproved', 'poCreated', 'termsConfirmed', 'current']);
    expect(steps[0]!.time).toBe(DASH);
    expect(steps[1]!.time).toBe(DASH);
    expect(steps[2]!.time).toBe('2 Nov 2026');
    expect(steps[3]!.time).toBe(DASH);
    expect(steps[4]!.title).toBe(en['purchaseOrders.status.PARTIALLY_RECEIVED']);
    expect(steps[4]!.time).toContain('6 Nov 2026');
  });
});

describe('paging trigger', () => {
  it('near the end of the scroll content loads more, elsewhere it does not', () => {
    const at = (y: number) => ({ layoutMeasurement: { height: 600 }, contentOffset: { y }, contentSize: { height: 2000 } });
    expect(isNearEnd(at(0))).toBe(false);
    expect(isNearEnd(at(1000))).toBe(false);
    expect(isNearEnd(at(1350))).toBe(true);
    expect(isNearEnd(at(1400))).toBe(true);
  });
});

describe('API client: GET /admin/purchase-orders and /{id}', () => {
  it('list sends cursor, limit, status, warehouseId, q, from, to', async () => {
    await listPurchaseOrderRows({ cursor: 'c1', status: 'ISSUED', warehouseId: 'wh', q: 'okra', from: '2026-11-01', to: '2026-11-11' });
    expect(http.adminGet).toHaveBeenCalledWith(
      '/admin/purchase-orders',
      { cursor: 'c1', limit: undefined, status: 'ISSUED', warehouseId: 'wh', q: 'okra', from: '2026-11-01', to: '2026-11-11' },
      undefined,
    );
  });

  it('detail encodes the id', async () => {
    http.adminGet.mockResolvedValue({});
    await getPurchaseOrderDetail('a/b');
    expect(http.adminGet).toHaveBeenCalledWith('/admin/purchase-orders/a%2Fb', undefined, undefined);
  });

  it('there is no write in the client (the API has none)', () => {
    const src = fs.readFileSync(path.join(__dirname, '../api/purchaseOrders.ts'), 'utf8');
    expect(src).not.toMatch(/adminPost|adminPatch|adminPut/);
  });
});

describe('query keys', () => {
  it('are warehouse-scoped, stable, under their own module', () => {
    expect(purchaseOrderKeys.list('wh', {})).toEqual([
      'admin',
      PURCHASE_ORDERS_MODULE,
      'wh',
      { resource: 'list', status: null, q: null, from: null, to: null },
    ]);
    expect(purchaseOrderKeys.list(undefined, { status: 'ISSUED', q: 'x' })[2]).toBe('all');
    expect(purchaseOrderKeys.detail('wh', 'po-1')).toEqual(['admin', PURCHASE_ORDERS_MODULE, 'wh', { resource: 'detail', id: 'po-1' }]);
  });
});

// ---------------------------------------------------------------------------
// Source guard over screens/purchase-orders/ and the new api files
// ---------------------------------------------------------------------------

const ADMIN = path.join(__dirname, '..');
const FOLDER = path.join(ADMIN, 'screens/purchase-orders');
const read = (abs: string) => fs.readFileSync(abs, 'utf8');
const code = (source: string) =>
  source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\s\/\/.*$/gm, '');
const folderFiles = fs.existsSync(FOLDER)
  ? fs
      .readdirSync(FOLDER)
      .filter((n) => /\.tsx?$/.test(n))
      .map((n) => path.join(FOLDER, n))
  : [];
const apiFiles = ['api/purchaseOrders.ts', 'api/purchaseOrdersHooks.ts'].map((f) => path.join(ADMIN, f));
const ALL = [...folderFiles, ...apiFiles];
const rel = (f: string) => path.relative(ADMIN, f);

describe('purchase-orders source guard', () => {
  it('the folder exists with the flow, every file <= 800 lines', () => {
    expect(fs.existsSync(path.join(FOLDER, 'PurchaseOrdersFlow.tsx'))).toBe(true);
    for (const f of ALL) {
      expect(fs.existsSync(f), rel(f)).toBe(true);
      expect(read(f).split('\n').length, rel(f)).toBeLessThanOrEqual(800);
    }
  });

  it.each(ALL.map(rel))('%s: no role strings, no fail-open can', (file) => {
    const src = code(read(path.join(ADMIN, file)));
    expect(src).not.toMatch(/(SUPER_ADMIN|TOHFA_ADMIN|FARMER_ADMIN|MAIN_WH_ADMIN|SUB_WH_ADMIN)/);
    expect(src).not.toMatch(/\brole\s*(===|!==)/);
    expect(src).not.toMatch(/\brole\??\s*:/);
    expect(src).not.toMatch(/can\s*\?\s*can\(/);
    expect(src).not.toMatch(/=>\s*true\b/);
    expect(src).not.toMatch(/as any/);
  });

  it.each(ALL.map(rel))('%s: no fixtures, no float money', (file) => {
    const src = code(read(path.join(ADMIN, file)));
    expect(src).not.toMatch(/SAMPLE_|MOCK_|FIXTURE/);
    expect(src).not.toMatch(/PO-2026-|LST-00|Ramesh|Selvi|₹\d/);
    expect(src).not.toMatch(/parseFloat|toFixed\(|Number\(/);
  });

  it.each(folderFiles.map(rel))('%s: tokens only (no hex, rgba, numeric fontSize, fontFamily)', (file) => {
    const src = code(read(path.join(ADMIN, file)));
    expect(src).not.toMatch(/(['"`])#(?:[0-9A-Fa-f]{8}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3,4})\1/);
    expect(src).not.toMatch(/\brgba?\s*\(/);
    expect(src).not.toMatch(/fontSize\s*:\s*[0-9]/);
    expect(src).not.toMatch(/fontFamily\s*:/);
  });

  it('every t() key used is purchaseOrders.* and exists; the catalogue is purchaseOrders.* only, ta is {}', () => {
    const catalogue = en as Record<string, string>;
    const used = new Set<string>();
    for (const f of folderFiles) for (const m of code(read(f)).matchAll(/\bt\(\s*'([A-Za-z0-9_.]+)'/g)) used.add(m[1]!);
    expect(used.size).toBeGreaterThan(30);
    for (const key of used) {
      expect(key, key).toMatch(/^purchaseOrders\./);
      expect(catalogue[key], key).toBeTruthy();
    }
    const enFile = JSON.parse(read(path.join(ADMIN, 'i18n/purchaseOrders.en.json'))) as Record<string, string>;
    for (const key of Object.keys(enFile)) expect(key).toMatch(/^purchaseOrders\./);
    expect(JSON.parse(read(path.join(ADMIN, 'i18n/purchaseOrders.ta.json')))).toEqual({});
  });

  it('no raw English between JSX tags; mobile-ui SafeAreaView / ScreenStatusBar, never react-native ones', () => {
    for (const f of folderFiles.filter((x) => x.endsWith('.tsx'))) {
      const src = code(read(f));
      expect(src, rel(f)).not.toMatch(/>\s*[A-Z][a-z]+(?: [A-Za-z]+)*\s*</);
      expect(src, rel(f)).not.toMatch(/import \{[^}]*\b(SafeAreaView|StatusBar)\b[^}]*\} from 'react-native'/);
    }
    const frame = folderFiles.map((f) => code(read(f))).join('\n');
    expect(frame).toMatch(/from '@tohfa\/mobile-ui'/);
    expect(frame).toMatch(/BackHandler/);
  });

  it('the read permission code exists in docs/rbac.json', () => {
    const rbac = read(path.join(ADMIN, '../../../../../docs/rbac.json'));
    expect(rbac).toContain('"purchase.order.view"');
    expect(code(read(path.join(FOLDER, 'purchaseOrdersLogic.ts')))).toMatch(/'purchase\.order\.view'/);
  });
});
