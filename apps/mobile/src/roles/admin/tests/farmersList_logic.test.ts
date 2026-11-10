/**
 * Farmers list (Module 1, phase 2B): the pure decisions behind
 * screens/farmers/list. Access is fail-closed, filters map onto the real API
 * values only, zone chips come from the loaded rows (never a static list),
 * and a disabled farmer is labelled Disabled, never Pending.
 */
import { describe, expect, it } from 'vitest';
import type { ApplicationRowView, FarmerRowView } from '../api/farmerTypes';
import { makeCan } from '../permissions/can';
import { en, t } from '../i18n';
import {
  applicationDetailText,
  applicationStatusLabelKey,
  applicationStatusTone,
  applicationSubText,
  farmerCodeZoneText,
  farmerRatingText,
  farmersListAccess,
  farmerStatusLabelKey,
  farmerStatusTone,
  FARMERS_KPI_CARDS,
  filterApplications,
  kpiValueText,
  mergeZoneOptions,
  resolveMainTab,
  showZoneFilter,
  STATUS_FILTER_OPTIONS,
  TIER_FILTER_OPTIONS,
  toFarmerListFilters,
  toLegacyFarmerListItem,
} from '../screens/farmers/list/farmersListLogic';

function farmerRow(over: Partial<FarmerRowView> = {}): FarmerRowView {
  return {
    id: 'f-1',
    farmerCode: 'TOHFA-F-2026-0001',
    name: 'Arun Kumar',
    initials: 'AK',
    mobile: '9876500001',
    zoneId: 'z-1',
    zoneName: 'Zone One',
    status: 'active',
    accountStatus: 'ACTIVE',
    applicationStatus: 'APPROVED',
    kycStatus: 'VERIFIED',
    overallRating: 78,
    ratingTierCode: 'GOOD',
    ratingTierLabel: 'Good',
    landLocationCount: 1,
    isMarketBlocked: false,
    registeredAt: '2026-09-01T00:00:00.000Z',
    farmingType: null,
    farmName: null,
    subscriptionLabel: null,
    hasExpiredCertification: null,
    ...over,
  };
}

function applicationRow(over: Partial<ApplicationRowView> = {}): ApplicationRowView {
  return {
    id: 'a-1',
    name: 'Meena Raj',
    initials: 'MR',
    mobile: '9876500009',
    status: 'SUBMITTED',
    isDraft: false,
    village: 'Ketti',
    district: 'Nilgiris',
    farmingType: 'Organic',
    primaryCrops: ['Carrot', 'Cabbage'],
    statedAreaAcres: 2,
    locationCount: 1,
    boundaryCount: 1,
    documentCount: 3,
    aadhaarLast4: '1234',
    submittedAt: '2026-10-05T06:00:00.000Z',
    createdAt: '2026-10-01T06:00:00.000Z',
    zoneId: null,
    slaDueAt: null,
    documentsComplete: null,
    applicationCode: null,
    kycStatus: null,
    ...over,
  };
}

const NO_VALUE = en['farmersList.noValue'];

describe('access is fail-closed', () => {
  it('a missing `can` denies both the farmer list and the applications tab', () => {
    expect(farmersListAccess(undefined)).toEqual({ canViewFarmers: false, canViewApplications: false });
  });

  it('farmer.profile.view_all opens the list; farmer.application.list_pending opens the applications tab', () => {
    expect(farmersListAccess(makeCan(['farmer.profile.view_all']))).toEqual({ canViewFarmers: true, canViewApplications: false });
    expect(farmersListAccess(makeCan(['farmer.profile.view_all', 'farmer.application.list_pending']))).toEqual({
      canViewFarmers: true,
      canViewApplications: true,
    });
  });

  it('without farmer.profile.view_all nothing is available, even with list_pending (the whole screen is gated)', () => {
    expect(farmersListAccess(makeCan(['farmer.application.list_pending']))).toEqual({
      canViewFarmers: false,
      canViewApplications: false,
    });
  });

  it('farmer.application.view alone does not open the applications tab (the list needs list_pending)', () => {
    expect(farmersListAccess(makeCan(['farmer.profile.view_all', 'farmer.application.view'])).canViewApplications).toBe(false);
  });

  it("initialTab='applications' resolves to the farmers tab for a caller without list_pending", () => {
    const denied = farmersListAccess(makeCan(['farmer.profile.view_all']));
    const allowed = farmersListAccess(makeCan(['farmer.profile.view_all', 'farmer.application.list_pending']));
    expect(resolveMainTab('applications', denied)).toBe('farmers');
    expect(resolveMainTab('applications', allowed)).toBe('applications');
    expect(resolveMainTab(undefined, allowed)).toBe('farmers');
  });
});

describe('filters map onto the API values only', () => {
  it('status chips are All plus exactly the API account statuses (no invented status)', () => {
    expect(STATUS_FILTER_OPTIONS.map((o) => o.id)).toEqual(['ALL', 'ACTIVE', 'PENDING', 'DISABLED']);
  });

  it('rating tier chips are All plus the API tier codes', () => {
    expect(TIER_FILTER_OPTIONS.map((o) => o.id)).toEqual(['ALL', 'POOR', 'MODERATE', 'GOOD', 'EXCELLENT']);
  });

  it('every chip label is an i18n key that exists', () => {
    for (const o of [...STATUS_FILTER_OPTIONS, ...TIER_FILTER_OPTIONS]) expect(en[o.labelKey]).toBeTruthy();
  });

  it('All / blank become undefined so the server applies no filter', () => {
    expect(toFarmerListFilters({ q: '   ', status: 'ALL', zoneId: 'ALL', tier: 'ALL' })).toEqual({
      q: undefined,
      status: undefined,
      zoneId: undefined,
      ratingTier: undefined,
    });
  });

  it('a chosen status, zone, tier and a trimmed search are passed through', () => {
    expect(toFarmerListFilters({ q: ' arun ', status: 'DISABLED', zoneId: 'z-2', tier: 'EXCELLENT' })).toEqual({
      q: 'arun',
      status: 'DISABLED',
      zoneId: 'z-2',
      ratingTier: 'EXCELLENT',
    });
  });
});

describe('zone chips come from the loaded rows (BR-108a: the scope is the server\'s)', () => {
  it('BR-108a: distinct zones by id, named as the server sent them, sorted by name', () => {
    const rows = [
      farmerRow({ id: '1', zoneId: 'z-b', zoneName: 'Beta' }),
      farmerRow({ id: '2', zoneId: 'z-a', zoneName: 'Alpha' }),
      farmerRow({ id: '3', zoneId: 'z-b', zoneName: 'Beta' }),
      farmerRow({ id: '4', zoneId: null, zoneName: null }),
    ];
    expect(mergeZoneOptions([], rows)).toEqual([
      { id: 'z-a', name: 'Alpha' },
      { id: 'z-b', name: 'Beta' },
    ]);
  });

  it('keeps zones it has already seen, so a zone filter can be cleared after the list narrowed to one zone', () => {
    const first = mergeZoneOptions([], [farmerRow({ id: '1', zoneId: 'z-a', zoneName: 'Alpha' }), farmerRow({ id: '2', zoneId: 'z-b', zoneName: 'Beta' })]);
    const narrowed = mergeZoneOptions(first, [farmerRow({ id: '1', zoneId: 'z-a', zoneName: 'Alpha' })]);
    expect(narrowed).toBe(first);
  });

  it('the zone group shows only with at least two distinct zones', () => {
    expect(showZoneFilter([])).toBe(false);
    expect(showZoneFilter([{ id: 'z-a', name: 'Alpha' }])).toBe(false);
    expect(showZoneFilter([{ id: 'z-a', name: 'Alpha' }, { id: 'z-b', name: 'Beta' }])).toBe(true);
  });
});

describe('farmer card text', () => {
  it('a disabled farmer is labelled Disabled, never Pending', () => {
    expect(t(farmerStatusLabelKey('disabled'))).toBe('Disabled');
    expect(farmerStatusTone('disabled')).toBe('danger');
    expect(t(farmerStatusLabelKey('pending'))).toBe('Pending');
    expect(t(farmerStatusLabelKey('active'))).toBe('Active');
    expect(t(farmerStatusLabelKey('unknown'))).toBe('Unknown');
  });

  it('BR-06: the rating is the 0-100 overall score as sent, never a derived 0-5 star figure', () => {
    expect(farmerRatingText(farmerRow({ overallRating: 78 }))).toBe('78/100');
    expect(farmerRatingText(farmerRow({ overallRating: null }))).toBe(NO_VALUE);
  });

  it('code and zone; a farmer without a zone shows the placeholder, not a guessed zone', () => {
    expect(farmerCodeZoneText(farmerRow())).toBe('TOHFA-F-2026-0001 · Zone One');
    expect(farmerCodeZoneText(farmerRow({ zoneName: null }))).toBe(`TOHFA-F-2026-0001 · ${NO_VALUE}`);
  });

  it('the legacy bridge object carries the real id and never turns a disabled farmer active', () => {
    const legacy = toLegacyFarmerListItem(farmerRow({ id: 'real-uuid', status: 'disabled', accountStatus: 'DISABLED' }));
    expect(legacy.id).toBe('real-uuid');
    expect(legacy.code).toBe('TOHFA-F-2026-0001');
    expect(legacy.status).toBe('DISABLED');
  });
});

describe('KPI cards (no count endpoint)', () => {
  it('four cards as designed, every value the placeholder, never a number', () => {
    expect(FARMERS_KPI_CARDS.map((c) => c.id)).toEqual(['all', 'active', 'pending', 'inactive']);
    expect(kpiValueText()).toBe(NO_VALUE);
    expect(kpiValueText()).not.toMatch(/[0-9]/);
  });
});

describe('applications', () => {
  it('every API application status has a label and a tone', () => {
    for (const s of ['DRAFT', 'SUBMITTED', 'DOCS_REVIEW', 'FARM_VERIFICATION', 'AUDIT', 'INFO_REQUESTED', 'APPROVED', 'REJECTED'] as const) {
      expect(en[applicationStatusLabelKey(s)]).toBeTruthy();
      expect(applicationStatusTone(s)).toMatch(/^(success|warning|danger|info|muted)$/);
    }
    expect(applicationStatusTone('APPROVED')).toBe('success');
    expect(applicationStatusTone('REJECTED')).toBe('danger');
  });

  it('the application code and KYC status have no API source and show the placeholder', () => {
    const row = applicationRow();
    expect(applicationSubText(row)).toBe(`${NO_VALUE} · Ketti, Nilgiris · Carrot, Cabbage`);
    expect(applicationDetailText(row)).toContain(`KYC ${NO_VALUE}`);
    expect(applicationDetailText(row)).toContain('Submitted 5 Oct 2026');
  });

  it('an application with no location or crops shows the placeholder', () => {
    expect(applicationSubText(applicationRow({ village: null, district: null, primaryCrops: [] }))).toBe(
      `${NO_VALUE} · ${NO_VALUE} · ${NO_VALUE}`,
    );
  });

  it('search filters the loaded rows by name, mobile or crop; blank returns them all', () => {
    const rows = [applicationRow({ id: '1', name: 'Meena' }), applicationRow({ id: '2', name: 'Ravi', mobile: '9000000000', primaryCrops: ['Tea'] })];
    expect(filterApplications(rows, '  ')).toBe(rows);
    expect(filterApplications(rows, 'meena').map((r) => r.id)).toEqual(['1']);
    expect(filterApplications(rows, '90000').map((r) => r.id)).toEqual(['2']);
    expect(filterApplications(rows, 'TEA').map((r) => r.id)).toEqual(['2']);
  });
});
