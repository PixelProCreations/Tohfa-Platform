/**
 * Warehouse Management for the Main admin (design M15-01, M15-02, M15-05,
 * M15-08): the More entry, the list cards (Needs Attention, Near Capacity,
 * status pill, SWA), the capacity review before PATCH, the per-warehouse
 * capacity route, and the view-only documents (owner decision 2026-10-23).
 *
 * Pure functions are tested directly; the wiring between screens is checked on
 * the source, as the other *_wiring tests do (no React renderer in this app's
 * plain-Node vitest).
 */
import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AlertItemDto } from '../api/alerts';
import type { WarehouseCapacityDto } from '../api/warehouses';
import en from '../i18n/en.json';
import ta from '../i18n/ta.json';
import { isMoreItemPermitted, MORE_OPTION_GROUPS } from '../screens/warehouse/dashboard-home-more/moreMenu';
import {
  canManageDocuments,
  documentExpiryBannerKey,
  documentsReadOnlyNoteKey,
} from '../screens/warehouse/profile-settings/mappers_documents';
import { capacityChangeReview } from '../screens/warehouse/shared/capacityReview';
import { combinedSource, warehouseStatusPill } from '../screens/warehouse/warehouse-admin/mappers';
import {
  capacityToneInputOf,
  NEAR_FULL_ALERTS_CODE,
  nearFullSignalOf,
  needsAttentionIds,
} from '../screens/warehouse/warehouse-admin/overviewFigures';
import { capacityEntryOf } from '../screens/warehouse/warehouse-admin/routes';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const WA = 'roles/admin/screens/warehouse/warehouse-admin';
const SHELL = code(read('roles/admin/screens/dashboard/MainWarehouseAdminDashboardScreen.tsx'));
const MORE = code(read('roles/admin/screens/warehouse/dashboard-home-more/MoreScreen.tsx'));
const FLOW = code(read(`${WA}/WarehouseAdminFlow.tsx`));
const OVERVIEW = code(read(`${WA}/WarehouseOverviewScreen.tsx`));
const CITY = code(read(`${WA}/WarehouseCityDetailScreen.tsx`));
const DOCS = code(read('roles/admin/screens/warehouse/profile-settings/DocumentsScreen.tsx'));
const SO_CAPACITY = code(read('roles/admin/screens/warehouse/storage-ops/WarehouseCapacityScreen.tsx'));
const SETTINGS = code(read('roles/admin/screens/warehouse/profile-settings/WarehouseSettingsScreen.tsx'));

const OOTY = '11111111-1111-4111-8111-111111111111';
const COON = '22222222-2222-4222-8222-222222222222';
const KOTA = '33333333-3333-4333-8333-333333333333';

const allow = (codes: string[]) => (c: string) => codes.includes(c);

function capacity(over: Partial<WarehouseCapacityDto>): WarehouseCapacityDto {
  return { warehouseId: OOTY, capacityKg: '10000.000', usedKg: '6800.000', availableKg: '3200.000', utilizationPercent: 68, ...over };
}

function nearFullAlert(warehouseId: string, thresholdPercent: number | string = 80): AlertItemDto {
  return {
    itemKey: `CAPACITY_NEAR_FULL:${warehouseId}`,
    type: 'CAPACITY_NEAR_FULL',
    messageKey: 'alert.capacity_near_full.message',
    refType: 'WAREHOUSE',
    refId: warehouseId,
    warehouseId,
    since: null,
    params: { capacityKg: '10000.000', usedKg: '8100.000', utilizationPercent: 81, thresholdPercent },
    state: 'ACTIVE',
    snoozedUntil: null,
  };
}

// ─── More menu entry (M15-01) ────────────────────────────────────────────────

describe('More menu: Warehouse Management (M15-01)', () => {
  it('is offered to the Main admin holding warehouse.all.view', () => {
    expect(isMoreItemPermitted('warehouse_management', true, allow(['warehouse.all.view']))).toBe(true);
  });

  it('is never offered to a Sub admin, even one holding the code, nor to Main without it', () => {
    expect(isMoreItemPermitted('warehouse_management', false, allow(['warehouse.all.view']))).toBe(false);
    expect(isMoreItemPermitted('warehouse_management', true, allow([]))).toBe(false);
  });

  it('keeps the existing gates of the other rows', () => {
    expect(isMoreItemPermitted('finance', true, allow([]))).toBe(false);
    expect(isMoreItemPermitted('finance', false, allow(['finance.dashboard.view']))).toBe(true);
    expect(isMoreItemPermitted('orders', false, allow([]))).toBe(true);
  });

  it('every row and group is an i18n key with an English and a Tamil string', () => {
    const keys = MORE_OPTION_GROUPS.flatMap((g) => [g.titleKey, ...g.items.flatMap((i) => [i.titleKey, i.subtitleKey])]);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(en).toHaveProperty([key]);
      expect(ta).toHaveProperty([key]);
    }
    const row = MORE_OPTION_GROUPS.flatMap((g) => g.items).find((i) => i.id === 'warehouse_management');
    expect(row && (en as Record<string, string>)[row.titleKey]).toBe('Warehouse Management');
  });

  it('the Main shell wires the row to the Warehouse Management flow, gated on warehouse.all.view', () => {
    expect(SHELL).toMatch(/onNavigateToWarehouseManagement=\{can\('warehouse\.all\.view'\) \? \(\) => setMoreSubScreen\('admin'\) : undefined\}/);
    expect(MORE).toMatch(/case 'warehouse_management':\s*\n\s*onNavigateToWarehouseManagement\?\.\(\);/);
    expect(MORE).toMatch(/warehouse_management: onNavigateToWarehouseManagement/);
  });

  it('the screen header reads the design wording', () => {
    expect(en['warehouseAdmin.overview.title']).toBe('Warehouse Management');
    expect(OVERVIEW).toMatch(/title=\{t\('warehouseAdmin\.overview\.title'\)\}/);
  });
});

// ─── Capacity opens the current warehouse (M15-03 / M15-05 defect) ───────────

describe('capacity route keeps the warehouse', () => {
  it('opens Storage Capacity on the warehouse it was given', () => {
    expect(capacityEntryOf(COON)).toEqual({ initialScreen: 'Capacity', initialParams: { warehouseId: COON } });
    expect(capacityEntryOf(undefined)).toEqual({ initialScreen: 'Capacity', initialParams: undefined });
  });

  it('City Detail, the card action and Manage Capacity Limits pass the warehouse uuid on', () => {
    expect(CITY).toMatch(/onOpenCapacity\?: \(\(warehouseId: string\) => void\) \| undefined/);
    expect(CITY).toMatch(/onPress=\{\(\) => onOpenCapacity\(w\.id\)\}/);
    expect(FLOW).toMatch(/const openCapacity = \(warehouseId\?: string\) => navigate\('WarehouseCapacity', \{ warehouseId \}\)/);
    expect(FLOW).toMatch(/capacityEntryOf\(params\.warehouseId\)/);
    expect(FLOW).toMatch(/onManageCapacity=\{\(warehouseId\) => navigate\('WarehouseSettings', \{ warehouseId \}\)\}/);
    expect(SO_CAPACITY).toMatch(/onManageCapacity\(warehouse\.warehouseId\)/);
    expect(OVERVIEW).toMatch(/onNavigateCapacitySummary\(w\.warehouseId\)/);
    expect(FLOW).not.toMatch(/navigate\('WarehouseCapacity'\)/);
  });
});

// ─── List cards (M15-01 / M15-02) ────────────────────────────────────────────

describe('warehouse list cards', () => {
  it('reads utilization (basis points) and available grams from the capacity answer', () => {
    expect(capacityToneInputOf(capacity({ warehouseId: COON, utilizationPercent: 81.25, availableKg: '1875.000' }))).toEqual({
      warehouseId: COON,
      utilizationBp: 8125,
      availableGrams: 1875000,
    });
    expect(capacityToneInputOf(capacity({ capacityKg: null, availableKg: null, utilizationPercent: null }))).toEqual({
      warehouseId: OOTY,
      utilizationBp: null,
      availableGrams: null,
    });
  });

  it('BR-77: the near-full alerts are read with alert.own.view, a code that exists in docs/rbac.json', () => {
    expect(NEAR_FULL_ALERTS_CODE).toBe('alert.own.view');
    expect(fs.readFileSync(path.join(SRC, '..', '..', '..', 'docs', 'rbac.json'), 'utf8')).toContain('"code": "alert.own.view"');
  });

  it('BR-77: the near-full signal is the server alert list, and unknown while it is not whole', () => {
    expect(nearFullSignalOf(undefined)).toBeNull();
    expect(nearFullSignalOf({ items: [nearFullAlert(COON)], complete: false })).toBeNull();
    const signal = nearFullSignalOf({ items: [nearFullAlert(COON, '80')], complete: true });
    expect(signal?.warehouseIds.has(COON)).toBe(true);
    expect(signal?.thresholdBp).toBe(8000);
  });

  it('pill: Inactive, Over Capacity, Near Capacity or Active, from the real status and the server signal', () => {
    expect(warehouseStatusPill(false, 'nearFull')).toEqual({ label: en['warehouseAdmin.status.inactive'], tone: 'danger' });
    expect(warehouseStatusPill(true, 'over')).toEqual({ label: en['warehouseAdmin.status.overCapacity'], tone: 'danger' });
    expect(warehouseStatusPill(true, 'nearFull')).toEqual({ label: en['warehouseAdmin.status.nearCapacity'], tone: 'warning' });
    expect(warehouseStatusPill(true, 'neutral')).toEqual({ label: en['warehouseAdmin.status.active'], tone: 'success' });
  });

  it('Needs Attention counts each warehouse once: near full, over capacity or without a SWA', () => {
    const tones = new Map([
      [OOTY, 'neutral' as const],
      [COON, 'nearFull' as const],
      [KOTA, 'over' as const],
    ]);
    expect([...needsAttentionIds(tones, new Set([COON]))].sort()).toEqual([COON, KOTA].sort());
    expect([...needsAttentionIds(tones, new Set([OOTY]))].sort()).toEqual([OOTY, COON, KOTA].sort());
    expect([...needsAttentionIds(new Map([[OOTY, 'neutral' as const]]), null)]).toEqual([]);
  });

  it('a combined figure shows only once every source answered, and the dash when one failed', () => {
    const ready = { data: 1, isLoading: false, error: null };
    const loading = { data: undefined, isLoading: true, error: null };
    const failed = { data: undefined, isLoading: false, error: new Error('x') };
    expect(combinedSource([ready, ready])).toEqual({ data: true, isLoading: false, error: null });
    expect(combinedSource([ready, loading]).data).toBeUndefined();
    expect(combinedSource([ready, loading]).isLoading).toBe(true);
    expect(combinedSource([failed, loading]).isLoading).toBe(false);
    expect(combinedSource([failed, ready]).error).toBe(failed.error);
  });

  it('wires the KPI, the pill, the near-capacity row, SWA on every card and the bell', () => {
    expect(OVERVIEW).toMatch(/t\('warehouseAdmin\.overview\.kpi\.needsAttention'\)/);
    expect(OVERVIEW).not.toMatch(/kpi\.overCapacity/);
    expect(OVERVIEW).toMatch(/warehouseStatusPill\(w\.isActive, /);
    expect(OVERVIEW).toMatch(/t\('warehouseAdmin\.overview\.attention\.nearCapacity'/);
    expect(OVERVIEW).toMatch(/listAlerts|useNearFullAlerts/);
    expect(OVERVIEW).toMatch(/<HeaderIconButton onPress=\{onOpenNotifications\}/);
    // SWA no longer waits for the "Manage Warehouses" tile.
    expect(OVERVIEW).not.toMatch(/managing \? \(\s*<>\s*\{canManage \? \(/);
    expect(FLOW).toMatch(/onOpenNotifications=\{onOpenNotifications\}/);
    expect(SHELL.match(/<WarehouseAdminFlow[\s\S]*?\/>/g)?.every((m) => /onOpenNotifications=/.test(m))).toBe(true);
    // No client threshold: the near-full state is the server's.
    expect(OVERVIEW).not.toMatch(/>=\s*\d{2}\b|thresholdPercent\s*=\s*\d/);
  });

  it('the Home Manage Warehouses hub draws an Inactive warehouse in the danger pill, not the green one', () => {
    expect(SHELL).toMatch(/warehouseStatusPill\(wh\.isActive, 'neutral'\)/);
    expect(SHELL).not.toMatch(/\{wh\.isActive \? 'Active' : 'Inactive'\}/);
  });
});

// ─── Capacity review (M15-05) ────────────────────────────────────────────────

describe('capacity change review (BR-66)', () => {
  it('BR-66: shows current, new and an increase from integer grams', () => {
    expect(capacityChangeReview(10_000_000, '12000.000')).toEqual({
      currentLabel: '10,000 kg',
      newLabel: '12,000 kg',
      differenceLabel: '+2,000 kg',
      newKg: '12000.000',
      unchanged: false,
    });
  });

  it('BR-66: a decrease is signed and keeps grams exact', () => {
    const r = capacityChangeReview(10_000_000, '7419.5');
    expect(r?.differenceLabel).toBe('−2,580.5 kg');
    expect(r?.newKg).toBe('7419.500');
  });

  it('a warehouse without a capacity has no difference; an unread one shows the dash, never 0', () => {
    expect(capacityChangeReview(null, '500')).toMatchObject({
      currentLabel: en['capacityChange.review.notSet'],
      differenceLabel: en['capacityChange.review.unknown'],
    });
    expect(capacityChangeReview(undefined, '500')).toMatchObject({
      currentLabel: en['capacityChange.review.unknown'],
      differenceLabel: en['capacityChange.review.unknown'],
    });
  });

  it('flags an unchanged value and rejects one that is not a positive weight', () => {
    expect(capacityChangeReview(500_000, '500')).toMatchObject({ unchanged: true, differenceLabel: en['capacityChange.review.noChange'] });
    expect(capacityChangeReview(500_000, 'abc')).toBeNull();
    expect(capacityChangeReview(500_000, '0')).toBeNull();
  });

  it('BR-66e: both capacity editors say capacity never modifies inventory, review first and confirm before PATCH', () => {
    expect(en['capacityChange.notice']).toBe('Changing capacity here never modifies inventory.');
    for (const screen of [SO_CAPACITY, SETTINGS]) {
      expect(screen).toMatch(/t\('capacityChange\.notice'\)/);
      expect(screen).toMatch(/capacityChangeReview\(/);
      expect(screen).toMatch(/<CapacityReviewPanel /);
      expect(screen).toMatch(/confirmCapacityChange\(/);
    }
    expect(read('roles/admin/screens/warehouse/shared/CapacityReviewPanel.tsx')).toMatch(/Alert\.alert\(t\('capacityChange\.confirm\.title'\)/);
    // No targets (BR-80: not built).
    expect(SO_CAPACITY).not.toMatch(/[Tt]arget/);
  });
});

// ─── Documents: view-only for Main, Expiring Soon banner (M15-08) ───────────

describe('warehouse documents (BR-105, owner decision 2026-10-23)', () => {
  it('BR-105: Main (all-warehouses scope) never manages documents in the app, even holding the code', () => {
    expect(canManageDocuments({}, true)).toBe(false);
    expect(canManageDocuments({ warehouseId: undefined }, true)).toBe(false);
  });

  it('BR-105: a single-warehouse (Sub) scope keeps exactly its code', () => {
    expect(canManageDocuments({ warehouseId: COON }, true)).toBe(true);
    expect(canManageDocuments({ warehouseId: COON }, false)).toBe(false);
  });

  it('says why the list is read-only: the view-only note for Main, the permission note for a Sub without the code', () => {
    expect(documentsReadOnlyNoteKey({}, true)).toBe('warehouseDocs.viewOnlyNote');
    expect(documentsReadOnlyNoteKey({ warehouseId: COON }, false)).toBe('warehouseDocs.readOnlyNote');
    expect(documentsReadOnlyNoteKey({ warehouseId: COON }, true)).toBeNull();
  });

  it('BR-105: the Expiring Soon banner follows the server status only', () => {
    expect(documentExpiryBannerKey('EXPIRING_SOON')).toBe('warehouseDocs.banner.expiringSoon');
    expect(documentExpiryBannerKey('ACTIVE')).toBeNull();
    expect(documentExpiryBannerKey('EXPIRED')).toBeNull();
    expect(documentExpiryBannerKey('ARCHIVED')).toBeNull();
    expect(documentExpiryBannerKey(null)).toBeNull();
  });

  it('the screen derives every write control from canManageDocuments(scope, ...)', () => {
    expect(DOCS).toMatch(/const canManage = canManageDocuments\(scope, can\(WAREHOUSE_DOCUMENT_CODES\.manage\)\)/);
    expect(DOCS).toMatch(/canManageDocument\(detail, canManage\)/);
    expect(DOCS).toMatch(/\{canManage \? <InfoNote tone="info">\{t\('warehouseDocs\.addUnavailable'\)\}/);
    expect(DOCS).toMatch(/documentExpiryBannerKey\(detail\.status\)/);
    // Only these two places draw Edit / Archive; no other write control exists.
    expect(DOCS.match(/warehouseDocs\.action\.edit'/g)?.length).toBe(1);
  });

  it('Main reaches documents with its all-warehouses scope; a Sub shell passes its own warehouse', () => {
    expect(SHELL).toContain('const MAIN_WAREHOUSE_SCOPE: WarehouseScope = {};');
    expect(FLOW).toMatch(/<ProfileFlow scope=\{scope\} can=\{can\} initialScreen="Documents"/);
    // The Sub shell is rendered on its own /auth/me warehouse (BR-30) and hands that scope to ProfileFlow.
    const app = code(read('roles/farmer/App.tsx'));
    expect(app).toMatch(/renderWithSubScope\(\(subScope\) => \(\s*<SubWarehouseAdminDashboardScreen\s*scope=\{subScope\}/);
    const sub = code(read('roles/admin/screens/dashboard/SubWarehouseAdminDashboardScreen.tsx'));
    expect(sub).toMatch(/<ProfileFlow\s*scope=\{scope\}/);
  });
});

// ─── i18n ────────────────────────────────────────────────────────────────────

describe('new strings exist in English and Tamil', () => {
  const NEW_KEYS = [
    'warehouseAdmin.overview.kpi.needsAttention',
    'warehouseAdmin.overview.attention.nearCapacity',
    'warehouseAdmin.overview.notifications',
    'warehouseAdmin.status.nearCapacity',
    'warehouseAdmin.status.overCapacity',
    'warehouseAdmin.capacity.percentOf',
    'warehouseAdmin.overview.title',
    'capacityChange.notice',
    'capacityChange.review.title',
    'capacityChange.review.current',
    'capacityChange.review.new',
    'capacityChange.review.difference',
    'capacityChange.confirm.title',
    'capacityChange.success',
    'warehouseDocs.banner.expiringSoon',
    'warehouseDocs.viewOnlyNote',
    'mainDashboard.manage.title',
  ] as const;

  it.each(NEW_KEYS)('%s', (key) => {
    expect(en).toHaveProperty([key]);
    expect(ta).toHaveProperty([key]);
  });
});
