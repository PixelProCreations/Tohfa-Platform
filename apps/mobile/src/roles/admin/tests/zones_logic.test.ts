/**
 * Zone Management's data decisions (screens/zones/zonesLogic.ts): what is real,
 * what is a dash, and when a count is honest. Pure, so plain-Node vitest.
 */
import { describe, expect, it } from 'vitest';
import type { FarmerSummaryDto } from '../api/farmers';
import type { FarmerRowView } from '../api/farmerTypes';
import { countLoadedWhere } from '../api/hookHelpers';
import type { AdminZoneDetailDto, AdminZoneListItemDto } from '../api/zones';
import type { WarehouseDto } from '../api/warehouses';
import { queryViewState } from '../screens/warehouse/shared/queryViewState';
import {
  NO_ZONE,
  attentionItems,
  bulkExistingFarmers,
  countText,
  farmerDistribution,
  mapSlotLabels,
  percentWidth,
  recentZones,
  reportMetrics,
  shareOfMax,
  toZoneFarmerView,
  toZoneView,
  toZoneViews,
  unassignedFarmers,
  warehouseMappingsFor,
  zoneFarmerCounts,
  zoneKpis,
  zoneLabel,
} from '../screens/zones/zonesLogic';
import { ADMIN_NO_VALUE } from '../utils/noValue';

const Z1 = '11111111-1111-4111-8111-111111111111';
const Z2 = '22222222-2222-4222-8222-222222222222';
const Z3 = '33333333-3333-4333-8333-333333333333';
const W1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function zone(over: Partial<AdminZoneListItemDto> & { id: string }): AdminZoneListItemDto {
  return {
    code: 'ZONE-OOTY',
    shortCode: 'OOT',
    name: 'Ooty Zone',
    warehouseId: W1,
    warehouseName: 'Ooty Warehouse',
    description: null,
    taluks: ['Ooty', 'Udhagamandalam'],
    isActive: true,
    createdAt: '2026-03-10T05:30:00.000Z',
    ...over,
  };
}

function summary(over: Partial<FarmerSummaryDto> = {}): FarmerSummaryDto {
  return {
    totalFarmers: 100,
    pendingApplications: 0,
    activeFarmers: 90,
    deactivatedFarmers: 5,
    inactiveFarmers: 5,
    expiredCertifications: 0,
    activeSubscriptions: 0,
    approvalInbox: 0,
    zones: [
      { id: Z1, code: 'ZONE-OOTY', name: 'Ooty Zone', count: 60, ratio: 0.6 },
      { id: Z2, code: 'ZONE-COONOOR', name: 'Coonoor Zone', count: 30, ratio: 0.3 },
    ],
    ...over,
  };
}

function farmer(over: Partial<FarmerRowView> & { id: string }): FarmerRowView {
  return {
    farmerCode: 'TOHFA-F-2026-0001',
    name: 'Rajesh Kumar',
    initials: 'RK',
    mobile: '+91 98XXXXX210',
    zoneId: Z1,
    zoneName: 'Ooty Zone',
    status: 'active',
    accountStatus: 'ACTIVE',
    applicationStatus: 'APPROVED',
    kycStatus: 'VERIFIED',
    overallRating: null,
    ratingTierCode: null,
    ratingTierLabel: null,
    landLocationCount: 1,
    isMarketBlocked: false,
    registeredAt: '2026-03-10T05:30:00.000Z',
    farmingType: null,
    farmName: null,
    subscriptionLabel: null,
    hasExpiredCertification: null,
    ...over,
  } as FarmerRowView;
}

describe('the zone list comes from the API, not a fixture', () => {
  it('maps exactly the zones the API sent, in the server order', () => {
    const views = toZoneViews([zone({ id: Z1 }), zone({ id: Z2, name: 'Coonoor Zone', shortCode: 'COO', code: 'ZONE-COONOOR' })], summary());
    expect(views.map((v) => v.id)).toEqual([Z1, Z2]);
    expect(views.map((v) => v.name)).toEqual(['Ooty Zone', 'Coonoor Zone']);
  });

  it('an empty list is empty: no zone is invented', () => {
    expect(toZoneViews([], summary())).toEqual([]);
    expect(toZoneViews(undefined, undefined)).toEqual([]);
  });

  it('maps name, code, shortCode, description, status, taluks, warehouse and the created day', () => {
    const v = toZoneView(zone({ id: Z1, description: 'Ooty and around', isActive: false }), { farmersCount: null });
    expect(v).toMatchObject({
      name: 'Ooty Zone',
      code: 'ZONE-OOTY',
      shortCode: 'OOT',
      description: 'Ooty and around',
      status: 'Inactive',
      taluk: 'Ooty, Udhagamandalam',
      warehouseId: W1,
      warehouses: ['Ooty Warehouse'],
      warehousesCount: 1,
    });
    expect(v.createdDate).toBe('10 Mar 2026');
  });

  it('a zone with no warehouse has none: 0 warehouses, not a made-up one', () => {
    const v = toZoneView(zone({ id: Z1, warehouseId: null, warehouseName: null }), { farmersCount: null });
    expect(v.warehousesCount).toBe(0);
    expect(v.warehouses).toEqual([]);
  });

  it('the manager comes from the detail only; before it loads the manager is unknown, after it null means not assigned', () => {
    const list = zone({ id: Z1 });
    const before = toZoneView(list, { farmersCount: null });
    expect(before.managerLoaded).toBe(false);
    const detail: AdminZoneDetailDto = { ...list, manager: { userId: 'u1', fullName: 'Asha Menon', mobile: '+91 98XXXXX001' } };
    const after = toZoneView(list, { farmersCount: null, detail });
    expect(after).toMatchObject({ manager: 'Asha Menon', contact: '+91 98XXXXX001', managerLoaded: true });
    const none = toZoneView(list, { farmersCount: null, detail: { ...list, manager: null } });
    expect(none).toMatchObject({ manager: null, contact: null, managerLoaded: true });
  });

  it('orders recent zones newest first', () => {
    const views = toZoneViews(
      [zone({ id: Z1, createdAt: '2026-03-10T00:00:00Z' }), zone({ id: Z2, createdAt: '2026-04-02T00:00:00Z' }), zone({ id: Z3, createdAt: '2026-03-20T00:00:00Z' })],
      undefined,
    );
    expect(recentZones(views, 2).map((v) => v.id)).toEqual([Z2, Z3]);
  });

  it('formats the picker label the design uses', () => {
    expect(zoneLabel({ name: 'Ooty Zone', shortCode: 'OOT' })).toBe('Ooty Zone (OOT)');
  });
});

describe('per-zone farmer counts come from the farmers summary', () => {
  it('takes each zone count from summary.zones by id', () => {
    const views = toZoneViews([zone({ id: Z1 }), zone({ id: Z2 })], summary());
    expect(views.map((v) => v.farmersCount)).toEqual([60, 30]);
  });

  it('a zone the summary does not list (it lists ACTIVE zones only) has NO count: null, never 0', () => {
    const views = toZoneViews([zone({ id: Z3, isActive: false })], summary());
    expect(views[0]?.farmersCount).toBeNull();
  });

  it('before the summary loads every count is null', () => {
    expect(toZoneViews([zone({ id: Z1 })], undefined)[0]?.farmersCount).toBeNull();
  });

  it('the distribution rows carry the server count and ratio, and null for an uncounted zone', () => {
    const views = toZoneViews([zone({ id: Z1 }), zone({ id: Z3, isActive: false })], summary());
    expect(farmerDistribution(views, summary())).toEqual([
      { id: Z1, name: 'Ooty Zone', count: 60, ratio: 0.6 },
      { id: Z3, name: 'Ooty Zone', count: null, ratio: null },
    ]);
  });

  it('bar widths: a 0-1 ratio is a percent, an unknown one is an empty bar', () => {
    expect(percentWidth(0.6)).toBe('60%');
    expect(percentWidth(null)).toBe('0%');
    expect(percentWidth(7)).toBe('100%');
    expect(shareOfMax(30, 60)).toBe('50%');
    expect(shareOfMax(null, 60)).toBe('0%');
    expect(shareOfMax(5, 0)).toBe('0%');
  });
});

describe('dashboard KPIs state only what the data supports', () => {
  const zones = toZoneViews([zone({ id: Z1 }), zone({ id: Z2 })], summary());
  const warehouses: WarehouseDto[] = [
    { id: W1, code: 'WH-MAIN', name: 'Ooty Main', type: 'MAIN', isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'w2', code: 'WH-SUB1', name: 'Coonoor Sub', type: 'SUB', isActive: true, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'w3', code: 'WH-SUB2', name: 'Old Sub', type: 'SUB', isActive: false, createdAt: '2026-01-01T00:00:00Z' },
  ];

  it('counts zones, active and inactive from the list', () => {
    const k = zoneKpis([...zones, ...toZoneViews([zone({ id: Z3, isActive: false })], undefined)], summary(), warehouses);
    expect(k).toMatchObject({ totalZones: 3, activeZones: 2, inactiveZones: 1 });
  });

  it('assigned = the sum of the zone counts, unassigned = registered - assigned, when every zone has a count', () => {
    const k = zoneKpis(zones, summary(), warehouses);
    expect(k).toMatchObject({ registeredFarmers: 100, assignedFarmers: 90, unassignedFarmers: 10 });
  });

  it('with an uncounted (inactive) zone the assigned and unassigned totals dash: those farmers are not "unassigned"', () => {
    const withInactive = [...zones, ...toZoneViews([zone({ id: Z3, isActive: false })], summary())];
    const k = zoneKpis(withInactive, summary(), warehouses);
    expect(k.assignedFarmers).toBeNull();
    expect(k.unassignedFarmers).toBeNull();
    expect(k.registeredFarmers).toBe(100);
  });

  it('counts only ACTIVE warehouses as main and sub', () => {
    const k = zoneKpis(zones, summary(), warehouses);
    expect(k).toMatchObject({ mainWarehouses: 1, subWarehouses: 1 });
  });

  it('everything dashes before anything loads, and the location total never has a value', () => {
    const k = zoneKpis(undefined, undefined, undefined);
    expect(Object.values(k).every((v) => v === null)).toBe(true);
    expect(zoneKpis(zones, summary(), warehouses).totalLocations).toBeNull();
  });

  it('flags an inactive zone and an active zone with no warehouse, and nothing it cannot know', () => {
    const items = attentionItems(
      toZoneViews([zone({ id: Z1 }), zone({ id: Z2, isActive: false }), zone({ id: Z3, warehouseId: null, warehouseName: null })], summary()),
    );
    expect(items.map((i) => [i.kind, i.zoneId])).toEqual([
      ['inactive', Z2],
      ['noWarehouse', Z3],
    ]);
  });
});

describe('sub-counts dash while pages remain', () => {
  const rows = [
    farmer({ id: 'f1', kycStatus: 'VERIFIED', accountStatus: 'ACTIVE' }),
    farmer({ id: 'f2', kycStatus: 'PENDING', accountStatus: 'ACTIVE' }),
    farmer({ id: 'f3', kycStatus: 'VERIFIED', accountStatus: 'DISABLED' }),
  ];

  it('is null (the dash) while another page is still to load', () => {
    expect(zoneFarmerCounts(rows, false)).toEqual({ verified: null, active: null });
    expect(countLoadedWhere(rows, () => true, false)).toBeNull();
  });

  it('is the real count once every page is in', () => {
    expect(zoneFarmerCounts(rows, true)).toEqual({ verified: 2, active: 2 });
  });

  it('flows into the zone view and renders as the dash while null', () => {
    const notYet = zoneFarmerCounts(rows, false);
    const loading = toZoneView(zone({ id: Z1 }), { farmersCount: 60, verifiedFarmers: notYet.verified, activeFarmers: notYet.active });
    expect(loading.verifiedFarmers).toBeNull();
    expect(countText(loading.verifiedFarmers, ADMIN_NO_VALUE)).toBe(ADMIN_NO_VALUE);
    const done = zoneFarmerCounts(rows, true);
    const loaded = toZoneView(zone({ id: Z1 }), { farmersCount: 60, verifiedFarmers: done.verified, activeFarmers: done.active });
    expect(countText(loaded.verifiedFarmers, ADMIN_NO_VALUE)).toBe('2');
  });
});

describe('loading, error and empty are distinct', () => {
  it('loading, error, empty and ready are four different states', () => {
    expect(queryViewState({ isLoading: true, error: null, itemCount: 0 })).toBe('loading');
    expect(queryViewState({ isLoading: false, error: new Error('x'), itemCount: 0 })).toBe('error');
    expect(queryViewState({ isLoading: false, error: null, itemCount: 0 })).toBe('empty');
    expect(queryViewState({ isLoading: false, error: null, itemCount: 4 })).toBe('ready');
  });

  it('a refresh that fails does not blank zones already on screen', () => {
    expect(queryViewState({ isLoading: false, error: new Error('x'), itemCount: 4 })).toBe('ready');
  });
});

describe('what has no source is null, so the screen draws the dash', () => {
  const v = toZoneView(zone({ id: Z1 }), { farmersCount: 60 });

  it('zone acreage, district, locations and the boundary have no value', () => {
    expect(v.farmAreaAcres).toBeNull();
    expect(v.district).toBeNull();
    expect(v.locationsCount).toBeNull();
    expect(v.boundaryPoints).toBeNull();
  });

  it('the NO_ZONE placeholder holds no figure', () => {
    expect(NO_ZONE.name).toBe('');
    expect([NO_ZONE.farmersCount, NO_ZONE.farmAreaAcres, NO_ZONE.locationsCount, NO_ZONE.verifiedFarmers].every((x) => x === null)).toBe(true);
  });

  it('a zone farmer has no acreage, farming type or village: the API list has none', () => {
    const f = toZoneFarmerView(farmer({ id: 'f1' }));
    expect(f).toMatchObject({ acres: null, farmingType: null, location: null, code: 'TOHFA-F-2026-0001', status: 'Active', verification: 'Verified' });
  });

  it('the report states only the summary figures; verified, farming type, farm area are all null', () => {
    const zones = toZoneViews([zone({ id: Z1 }), zone({ id: Z2 })], summary());
    const r = reportMetrics(zones, summary(), null);
    expect(r.active).toBe(90);
    expect(r.inactive).toBe(10);
    expect(r.verified).toBeNull();
    expect(r.pending).toBeNull();
    expect(r.totalFarmAreaAcres).toBeNull();
    expect(r.farmingTypes.every((t) => t.count === null)).toBe(true);
    expect(r.farmersByZone.map((row) => row.count)).toEqual([60, 30, 10]);
    expect(r.mappedZones).toBe(2);
    expect(r.activeZoneCount).toBe(2);
  });

  it('a single-zone report has no active / inactive split and no "no zone" row', () => {
    const zones = toZoneViews([zone({ id: Z1 }), zone({ id: Z2 })], summary());
    const r = reportMetrics(zones, summary(), Z1);
    expect(r.active).toBeNull();
    expect(r.inactive).toBeNull();
    expect(r.farmersByZone).toHaveLength(1);
  });

  it('the schematic map labels come from the zones and dash when there are fewer zones than slots', () => {
    const zones = toZoneViews([zone({ id: Z1 }), zone({ id: Z2, shortCode: 'COO' })], undefined);
    expect(mapSlotLabels(zones, 5)).toEqual(['OOT', 'COO', null, null, null]);
    expect(mapSlotLabels([], 5)).toEqual([null, null, null, null, null]);
  });
});

describe('farmer pools for the assignment wizards', () => {
  const zones = toZoneViews([zone({ id: Z1 })], undefined);

  it('unassigned = no zone and not disabled', () => {
    const rows = [
      farmer({ id: 'a', zoneId: null, zoneName: null }),
      farmer({ id: 'b', zoneId: Z1 }),
      farmer({ id: 'c', zoneId: null, zoneName: null, accountStatus: 'DISABLED' }),
    ];
    expect(unassignedFarmers(rows).map((f) => f.id)).toEqual(['a']);
  });

  it('existing = already in a zone, or disabled; never the eligible ones', () => {
    const rows = [
      farmer({ id: 'a', zoneId: null, zoneName: null }),
      farmer({ id: 'b', zoneId: Z1 }),
      farmer({ id: 'c', zoneId: null, zoneName: null, accountStatus: 'DISABLED' }),
    ];
    const existing = bulkExistingFarmers(rows, zones);
    expect(existing.map((f) => f.id)).toEqual(['b', 'c']);
    expect(existing[0]).toMatchObject({ assignedZoneName: 'Ooty Zone' });
    expect(existing[1]).toMatchObject({ disabled: true });
    expect(existing[0]?.district).toBeNull();
    expect(existing[0]?.registeredLocation).toBeNull();
  });
});

describe('zone warehouse mapping', () => {
  const views = toZoneViews([zone({ id: Z1 })], undefined);
  const list: WarehouseDto[] = [{ id: W1, code: 'WH-MAIN', name: 'Ooty Main Warehouse', type: 'MAIN', isActive: true, createdAt: '2026-01-01T00:00:00Z' }];

  it('maps the zone warehouse, adding code and type from the warehouse list; the since date has no source', () => {
    const m = warehouseMappingsFor(views[0], list);
    expect(m).toEqual([
      { id: W1, code: 'WH-MAIN', name: 'Ooty Main Warehouse', type: 'Main warehouse', sinceDate: null, status: 'Active', isMapped: true },
    ]);
  });

  it('still shows the mapping by name when the warehouse list is unavailable, with no code', () => {
    const m = warehouseMappingsFor(views[0], undefined);
    expect(m[0]).toMatchObject({ code: '', name: 'Ooty Warehouse' });
  });

  it('a zone with no warehouse has no mapping', () => {
    const none = toZoneViews([zone({ id: Z1, warehouseId: null, warehouseName: null })], undefined);
    expect(warehouseMappingsFor(none[0], list)).toEqual([]);
    expect(warehouseMappingsFor(undefined, list)).toEqual([]);
  });
});
