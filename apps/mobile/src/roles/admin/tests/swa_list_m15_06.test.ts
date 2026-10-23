/**
 * Sub Warehouse Admins list for the Main admin (design M15-06) and the More
 * screen's i18n wiring.
 *
 * Pure functions are tested directly. The confirm dialog is tested against a
 * mocked react-native Alert (no renderer in this app's plain-Node vitest);
 * the screen wiring is checked on the source, as warehouse_management_m15
 * does.
 *
 * The M15-07 Responsibility Summary is deliberately absent: no endpoint
 * exposes another role's permission set, so a test below pins that nothing
 * renders it.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const alertMock = vi.hoisted(() => vi.fn());
vi.mock('react-native', () => ({ Alert: { alert: alertMock } }));

import type { SubAdminDto } from '../api/subAdmins';
import type { WarehouseOption } from '../api/warehouseList';
import en from '../i18n/en.json';
import ta from '../i18n/ta.json';
import { confirmCreateSubAdmin } from '../screens/warehouse/warehouse-admin/confirmCreateSubAdmin';
import { warehousesWithoutSubAdmin } from '../screens/warehouse/warehouse-admin/mappers';
import { needsAttentionIds } from '../screens/warehouse/warehouse-admin/overviewFigures';
import {
  activeSubAdminCount,
  filterSubAdmins,
  filterSubAdminsByWarehouse,
  filterUnstaffedWarehouses,
  swaKpiFigures,
  swaKpiLabels,
  unstaffedInSelection,
} from '../screens/warehouse/warehouse-admin/subAdminList';

const SRC = path.join(__dirname, '..', '..', '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');
const code = (source: string) => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

const SCREEN = code(read('roles/admin/screens/warehouse/warehouse-admin/ManageSubWarehouseAdminsScreen.tsx'));
const MORE = code(read('roles/admin/screens/warehouse/dashboard-home-more/MoreScreen.tsx'));
const enCatalogue = en as Record<string, string>;
const taCatalogue = ta as Record<string, string>;

const MAIN = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OOTY = '11111111-1111-4111-8111-111111111111';
const COON = '22222222-2222-4222-8222-222222222222';
const KOTA = '33333333-3333-4333-8333-333333333333';
const GUDA = '44444444-4444-4444-8444-444444444444';
const CLOSED = '55555555-5555-4555-8555-555555555555';

function option(warehouseId: string, warehouseName: string, over: Partial<WarehouseOption> = {}): WarehouseOption {
  return { warehouseId, warehouseName, warehouseCode: `WH-${warehouseName.slice(0, 4).toUpperCase()}`, type: 'SUB', city: warehouseName, isActive: true, ...over };
}

function admin(userId: string, fullName: string, adminCode: string | null, warehouseId: string, status: SubAdminDto['status'] = 'ACTIVE'): SubAdminDto {
  return { userId, fullName, adminCode, status, warehouseId, assignedAt: '2026-09-01T00:00:00.000Z' };
}

const OPTIONS: WarehouseOption[] = [
  option(MAIN, 'Nilgiris Main', { type: 'MAIN' }),
  option(OOTY, 'Ooty'),
  option(COON, 'Coonoor'),
  option(KOTA, 'Kotagiri'),
  option(GUDA, 'Gudalur Market'),
  option(CLOSED, 'Closed Yard', { isActive: false }),
];

const ADMINS: SubAdminDto[] = [
  admin('u2', 'Karthik Kumar', 'SWA-002', COON),
  admin('u1', 'Priya Raman', 'SWA-001', OOTY),
  admin('u3', 'Vijay S', 'SWA-003', KOTA, 'ACTIVE'),
  admin('u4', 'Meena D', null, MAIN, 'DISABLED'),
];

// ─── Counts and filters ──────────────────────────────────────────────────────

describe('active count', () => {
  it('counts only ACTIVE admins; PENDING and DISABLED are not active', () => {
    expect(activeSubAdminCount(ADMINS)).toBe(3);
    expect(activeSubAdminCount([admin('x', 'A', 'SWA-9', OOTY, 'PENDING'), admin('y', 'B', 'SWA-8', COON, 'DISABLED')])).toBe(0);
    expect(activeSubAdminCount([])).toBe(0);
  });
});

describe('BR-30: warehouse selector narrows the loaded rows', () => {
  it('keeps every row for "All Warehouses" (undefined) and one warehouse otherwise', () => {
    expect(filterSubAdminsByWarehouse(ADMINS, undefined)).toHaveLength(4);
    expect(filterSubAdminsByWarehouse(ADMINS, COON).map((a) => a.userId)).toEqual(['u2']);
    expect(filterSubAdminsByWarehouse(ADMINS, GUDA)).toEqual([]);
  });

  it('unassigned warehouses follow the selection: all, only the selected one, or none when it is staffed', () => {
    expect(unstaffedInSelection(OPTIONS, ADMINS, undefined).map((w) => w.warehouseId)).toEqual([GUDA]);
    expect(unstaffedInSelection(OPTIONS, ADMINS, GUDA).map((w) => w.warehouseId)).toEqual([GUDA]);
    expect(unstaffedInSelection(OPTIONS, ADMINS, OOTY)).toEqual([]);
    // A MAIN warehouse is run by the Main admin: it is never "unassigned".
    expect(unstaffedInSelection(OPTIONS, ADMINS, MAIN)).toEqual([]);
  });
});

describe('search over admin name, admin ID and warehouse', () => {
  const nameOf = (id: string) => OPTIONS.find((o) => o.warehouseId === id)?.warehouseName ?? '';

  it('matches name, admin code and warehouse name, case-insensitively and trimmed', () => {
    expect(filterSubAdmins(ADMINS, '  karthik ', nameOf).map((a) => a.userId)).toEqual(['u2']);
    expect(filterSubAdmins(ADMINS, 'swa-001', nameOf).map((a) => a.userId)).toEqual(['u1']);
    expect(filterSubAdmins(ADMINS, 'KOTAGIRI', nameOf).map((a) => a.userId)).toEqual(['u3']);
  });

  it('returns every row for a blank query, and nothing for a miss', () => {
    expect(filterSubAdmins(ADMINS, '', nameOf)).toHaveLength(4);
    expect(filterSubAdmins(ADMINS, '   ', nameOf)).toHaveLength(4);
    expect(filterSubAdmins(ADMINS, 'zzz', nameOf)).toEqual([]);
  });

  it('survives a legacy row without an admin code', () => {
    expect(filterSubAdmins(ADMINS, 'meena', nameOf).map((a) => a.userId)).toEqual(['u4']);
    expect(filterSubAdmins(ADMINS, 'null', nameOf)).toEqual([]);
  });

  it('filters the unassigned warehouses by name too', () => {
    const unstaffed = warehousesWithoutSubAdmin(OPTIONS, ADMINS);
    expect(filterUnstaffedWarehouses(unstaffed, 'gudalur').map((w) => w.warehouseId)).toEqual([GUDA]);
    expect(filterUnstaffedWarehouses(unstaffed, 'ooty')).toEqual([]);
    expect(filterUnstaffedWarehouses(unstaffed, ' ')).toHaveLength(1);
  });
});

// ─── KPIs ────────────────────────────────────────────────────────────────────

describe('KPI figures', () => {
  it('count every SWA, the active ones and the warehouses without one', () => {
    expect(swaKpiFigures(ADMINS, OPTIONS, undefined)).toEqual({ total: 4, active: 3, pendingAssignment: 1, attention: 1 });
  });

  it('respect the selected warehouse', () => {
    expect(swaKpiFigures(ADMINS, OPTIONS, COON)).toEqual({ total: 1, active: 1, pendingAssignment: 0, attention: 0 });
    expect(swaKpiFigures(ADMINS, OPTIONS, GUDA)).toEqual({ total: 0, active: 0, pendingAssignment: 1, attention: 1 });
    expect(swaKpiFigures(ADMINS, OPTIONS, MAIN)).toEqual({ total: 1, active: 0, pendingAssignment: 0, attention: 0 });
  });

  it('Attention Required is the existing definition: an active SUB warehouse with no SWA', () => {
    // Same function, same inputs as the overview's "needs attention" SWA part.
    const definition = warehousesWithoutSubAdmin(OPTIONS, ADMINS);
    expect(swaKpiFigures(ADMINS, OPTIONS, undefined).attention).toBe(definition.length);
    const overview = needsAttentionIds(new Map(), new Set(definition.map((w) => w.warehouseId)));
    expect(overview.size).toBe(swaKpiFigures(ADMINS, OPTIONS, undefined).attention);
  });

  it('Attention Required equals Pending Assignment by definition, for every selection', () => {
    for (const selected of [undefined, MAIN, OOTY, COON, KOTA, GUDA, CLOSED]) {
      const figures = swaKpiFigures(ADMINS, OPTIONS, selected);
      expect(figures.attention).toBe(figures.pendingAssignment);
    }
  });

  it('an inactive warehouse without an SWA is not counted', () => {
    expect(swaKpiFigures(ADMINS, OPTIONS, CLOSED)).toEqual({ total: 0, active: 0, pendingAssignment: 0, attention: 0 });
  });
});

describe('KPI labels never show a made-up number', () => {
  const loaded = { data: ADMINS, isLoading: false, error: null };
  const warehousesLoaded = { data: OPTIONS, isLoading: false, error: null };

  it('draws the counts once both reads are here', () => {
    expect(swaKpiLabels({ admins: loaded, warehouses: warehousesLoaded, warehouseId: undefined })).toEqual({
      total: '4',
      active: '3',
      pendingAssignment: '1',
      attention: '1',
    });
  });

  it('shows the loading mark while warehouses load, never 0', () => {
    const labels = swaKpiLabels({ admins: loaded, warehouses: { data: undefined, isLoading: true, error: null }, warehouseId: undefined });
    expect(labels.pendingAssignment).toBe(enCatalogue['warehouseAdmin.figure.loading']);
    expect(labels.attention).toBe(enCatalogue['warehouseAdmin.figure.loading']);
    expect(labels.total).toBe('4');
  });

  it('shows the dash, never 0, when the warehouse read failed', () => {
    const labels = swaKpiLabels({ admins: loaded, warehouses: { data: undefined, isLoading: false, error: new Error('x') }, warehouseId: undefined });
    expect(labels.pendingAssignment).toBe(enCatalogue['warehouseAdmin.figure.unavailable']);
    expect(labels.attention).toBe(enCatalogue['warehouseAdmin.figure.unavailable']);
  });

  it('shows the placeholders for every tile while the admins are not here', () => {
    const labels = swaKpiLabels({ admins: { data: undefined, isLoading: true, error: null }, warehouses: warehousesLoaded, warehouseId: undefined });
    expect(Object.values(labels)).toEqual(new Array(4).fill(enCatalogue['warehouseAdmin.figure.loading']));
  });
});

// ─── Confirm before create (BR-25 / BR-81) ───────────────────────────────────

describe('BR-81: confirm dialog before POST /admin/sub-warehouse-admins', () => {
  beforeEach(() => alertMock.mockReset());

  type Button = { text: string; style?: string; onPress?: () => void };
  const buttons = (): Button[] => alertMock.mock.calls[0]?.[2] as Button[];

  it('opens "Create Sub Warehouse Admin?" and does not create by itself', () => {
    const onConfirm = vi.fn();
    confirmCreateSubAdmin({ name: 'New Admin', warehouse: 'Gudalur Market' }, onConfirm);
    expect(alertMock).toHaveBeenCalledTimes(1);
    expect(alertMock.mock.calls[0]?.[0]).toBe('Create Sub Warehouse Admin?');
    expect(alertMock.mock.calls[0]?.[1]).toContain('New Admin');
    expect(alertMock.mock.calls[0]?.[1]).toContain('Gudalur Market');
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('Cancel never creates; Confirm creates exactly once', () => {
    const onConfirm = vi.fn();
    confirmCreateSubAdmin({ name: 'New Admin', warehouse: 'Gudalur Market' }, onConfirm);
    const [cancel, confirm] = buttons();
    expect(cancel?.text).toBe('Cancel');
    expect(cancel?.style).toBe('cancel');
    expect(cancel?.onPress).toBeUndefined();
    expect(confirm?.text).toBe('Confirm');
    confirm?.onPress?.();
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

describe('BR-25 / BR-81: the screen wires Review -> confirm -> mutation', () => {
  it('create.mutate is called once, only inside submit, and submit is reached only through the confirm', () => {
    expect(SCREEN.match(/create\.mutate\(/g)).toHaveLength(1);
    expect(SCREEN).toMatch(/const confirmCreate = \(\) =>\s*\n?\s*confirmCreateSubAdmin\(\{[^}]*\}, submit\)/);
    // The Review footer's Create button opens the confirm, not the mutation.
    expect(SCREEN).toMatch(/case 'review':[\s\S]*?label=\{create\.isPending[\s\S]*?onPress=\{confirmCreate\}/);
    expect(SCREEN.match(/onPress=\{submit\}/g)).toBeNull();
  });
});

// ─── List screen wiring ──────────────────────────────────────────────────────

describe('M15-06 list wiring', () => {
  it('draws the four design tiles with the shared stat card', () => {
    expect(SCREEN).toMatch(/OverviewDashboardCard/);
    for (const key of ['total', 'active', 'pendingAssignment', 'attention']) {
      expect(SCREEN).toContain(`warehouseAdmin.swa.kpi.${key}`);
      expect(enCatalogue[`warehouseAdmin.swa.kpi.${key}`]).toBeTruthy();
    }
    expect(enCatalogue['warehouseAdmin.swa.kpi.total']).toBe('Total SWAs');
    expect(enCatalogue['warehouseAdmin.swa.kpi.active']).toBe('Active');
    expect(enCatalogue['warehouseAdmin.swa.kpi.pendingAssignment']).toBe('Pending Assignment');
    expect(enCatalogue['warehouseAdmin.swa.kpi.attention']).toBe('Attention Required');
  });

  it('BR-30: reuses the shared warehouse selector (via ScopeHeader) over the live warehouse list', () => {
    expect(SCREEN).toMatch(/useWarehouseOptions\(/);
    expect(SCREEN).toMatch(/onSelectWarehouse=\{/);
    expect(SCREEN).toMatch(/warehouseOptions=\{/);
    expect(SCREEN).toMatch(/selectedWarehouseId=\{warehouseFilter\}/);
  });

  it('has the search box with the design placeholder', () => {
    expect(SCREEN).toMatch(/<SearchBar[\s\S]*?placeholder=\{t\('warehouseAdmin\.swa\.search\.placeholder'\)\}/);
    expect(enCatalogue['warehouseAdmin.swa.search.placeholder']).toBe('Search admin name, admin ID, warehouse');
  });

  it('puts a Pending badge on the unassigned row', () => {
    expect(SCREEN).toMatch(/unstaffedRows\.map[\s\S]*?<StatusBadge label=\{t\('warehouseAdmin\.swa\.unassignedBadge'\)\} tone="warning" \/>/);
    expect(enCatalogue['warehouseAdmin.swa.unassignedBadge']).toBe('Pending');
  });

  it('does not render the M15-07 Responsibility Summary (no endpoint carries another role\'s permissions)', () => {
    expect(SCREEN).not.toMatch(/responsibilit/i);
    expect(Object.keys(enCatalogue).filter((k) => k.startsWith('warehouseAdmin.swa.') && /responsib/i.test(k))).toEqual([]);
    expect(Object.values(enCatalogue).filter((v) => /Responsibility Summary/i.test(v))).toEqual([]);
  });

  it('every new key has an English and a Tamil string', () => {
    const keys = Array.from(SCREEN.matchAll(/t\('(warehouseAdmin\.swa\.[A-Za-z.]+)'/g)).map((m) => m[1] as string);
    expect(keys.length).toBeGreaterThan(0);
    const fresh = [
      'warehouseAdmin.swa.kpi.total',
      'warehouseAdmin.swa.kpi.active',
      'warehouseAdmin.swa.kpi.pendingAssignment',
      'warehouseAdmin.swa.kpi.attention',
      'warehouseAdmin.swa.search.placeholder',
      'warehouseAdmin.swa.search.noMatch',
      'warehouseAdmin.swa.unassignedBadge',
      'warehouseAdmin.swa.create.confirm.title',
      'warehouseAdmin.swa.create.confirm.body',
      'warehouseAdmin.swa.create.confirm.ok',
    ];
    for (const key of [...keys.filter((k) => fresh.includes(k)), ...fresh]) {
      expect(enCatalogue[key], key).toBeTruthy();
      expect(taCatalogue[key], key).toBeTruthy();
    }
    for (const key of keys) expect(enCatalogue[key], key).toBeTruthy();
  });
});

// ─── MoreScreen i18n ─────────────────────────────────────────────────────────

describe('MoreScreen: no hard-coded English', () => {
  it('has no English text between JSX tags', () => {
    expect(MORE.match(/>\s*[A-Za-z][A-Za-z0-9 ,.'?&/·-]*\s*<\//g) ?? []).toEqual([]);
  });

  it('the Logout card and its confirmation come from the catalogue', () => {
    expect(MORE).not.toMatch(/'Logout'|'Cancel'|'Are you sure|Sign out of this account/);
    expect(MORE).toMatch(/Alert\.alert\(\s*t\('more\.logout\.confirmTitle'\),\s*t\('more\.logout\.confirmMessage'\)/);
    expect(MORE).toMatch(/text: t\('more\.logout\.cancel'\), style: 'cancel'/);
    expect(MORE).toMatch(/text: t\('more\.logout\.confirm'\),\s*style: 'destructive'/);
    expect(MORE).toMatch(/<Text style=\{styles\.logoutTitle\}>\{t\('more\.logout\.title'\)\}<\/Text>/);
    expect(MORE).toMatch(/\{t\('more\.logout\.subtitle'\)\}/);
  });

  it('the header and the bottom tab labels come from the catalogue', () => {
    expect(MORE).toMatch(/<Text style=\{styles\.headerTitle\}>\{t\('more\.header\.title'\)\}<\/Text>/);
    for (const tab of ['home', 'receiving', 'inventory', 'more']) {
      expect(MORE).toMatch(new RegExp(`\\{t\\('more\\.tab\\.${tab}'\\)\\}`));
    }
  });

  it('the scope label, role title and active status come from the catalogue', () => {
    expect(MORE).not.toMatch(/'All Warehouses'|'Main Warehouse Admin'|'Sub Warehouse Admin'/);
    expect(MORE).toMatch(/t\('more\.scope\.all'\)/);
    expect(MORE).toMatch(/t\('more\.role\.main'\)/);
    expect(MORE).toMatch(/t\('more\.role\.sub'\)/);
    expect(MORE).toMatch(/\{t\('more\.status\.active'\)\}/);
  });

  it('every key MoreScreen uses has an English and a Tamil string, with the wording it had', () => {
    const keys = Array.from(MORE.matchAll(/t\('(more\.[A-Za-z.]+)'\)/g)).map((m) => m[1] as string);
    expect(new Set(keys).size).toBeGreaterThanOrEqual(15);
    for (const key of keys) {
      expect(enCatalogue[key], key).toBeTruthy();
      expect(taCatalogue[key], key).toBeTruthy();
    }
    expect(enCatalogue['more.logout.title']).toBe('Logout');
    expect(enCatalogue['more.logout.subtitle']).toBe('Sign out of this account');
    expect(enCatalogue['more.logout.confirmMessage']).toBe('Are you sure you want to sign out of this account?');
    expect(enCatalogue['more.logout.cancel']).toBe('Cancel');
    expect(enCatalogue['more.logout.confirm']).toBe('Logout');
    expect(enCatalogue['more.header.title']).toBe('More');
    expect([enCatalogue['more.tab.home'], enCatalogue['more.tab.receiving'], enCatalogue['more.tab.inventory'], enCatalogue['more.tab.more']]).toEqual([
      'Home',
      'Receiving',
      'Inventory',
      'More',
    ]);
  });
});
