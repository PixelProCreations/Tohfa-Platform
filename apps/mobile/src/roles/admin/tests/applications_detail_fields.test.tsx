/**
 * The complete application review screen (2026-11-19 design, origin/Superadmin-main):
 * the fields the first pass drew nothing for, although the API already sends
 * them — date of birth, gender, the masked Aadhaar, farm name, experience,
 * number of farms, the two land areas and their variance, water source, the
 * per-location cards with their GPS, and each document's file name.
 *
 * Two things these tests exist to hold:
 *   - every newly drawn field shows the API's own value, and the DASH when the
 *     API has none — never a design fixture and never an invented figure;
 *   - the variance warning is computed, not asserted: it appears only when
 *     both areas exist and differ, and never otherwise.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance, type ReactTestRendererJSON } from 'react-test-renderer';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  Image: 'Image',
  Modal: 'Modal',
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
  RefreshControl: 'RefreshControl',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));
vi.mock('react-native-svg', () => ({ default: 'Svg', Circle: 'Circle', Path: 'Path', Rect: 'Rect' }));
vi.mock('@tohfa/mobile-ui', () => ({ Icon: 'Icon', SafeAreaView: 'SafeAreaView', ScreenStatusBar: 'ScreenStatusBar' }));

const hooks = vi.hoisted(() => ({
  useApplication: vi.fn(),
  useApplicationList: vi.fn(),
  useApproveApplication: vi.fn(),
  useRejectApplication: vi.fn(),
  useAdvanceApplication: vi.fn(),
  useReviewApplicationDocument: vi.fn(),
  useReviewApplicationFmb: vi.fn(),
  useAddApplicationNote: vi.fn(),
  useRequestApplicationInfo: vi.fn(),
}));
vi.mock('../api/farmerHooks', () => hooks);

import type { ApplicationDetailView } from '../api/farmerTypes';
import { t } from '../i18n';
import { AdminApplicationDetailScreen } from '../screens/registration/AdminApplicationDetailScreen';
import {
  AREA_VARIANCE_TOLERANCE_PERCENT,
  areaVariance,
  farmingTypeChips,
  fmbAreaAcres,
  locationSummary,
  stepState,
} from '../screens/registration/detail/reviewFacts';

const APP_ID = '0b9c7a52-3f7e-4b55-9a51-6f2b1f0c1a01';
const ALL_CODES = [
  'farmer.application.list_pending',
  'farmer.application.view',
  'farmer.application.approve',
  'farmer.application.reject',
];
const allow = (codes: readonly string[]) => (c: string) => codes.includes(c);
const DASH = t('farmerApps.notAvailable');

/** Every literal the 2026-11-19 design hard-codes in the parts ported here. */
const DESIGN_FIXTURES = [
  'Sathish Kumar Farm',
  'Great Earth Organic Farm',
  'APP-2026-0101',
  '+91 99801 00100',
  '98765 43210',
  '3782 4591 0023',
  'Thottam Street',
  'Kotagiri Village',
  '12 / 06 / 1985',
  '2.45 ac',
  '11.4064',
  '76.6932',
  '±8 m',
  'aadhaar_suresh.pdf',
  'land_deed.pdf',
  '1.2 MB',
  '3.4 MB',
  'Zone A',
  'Zone B',
  'Zone C',
  'Tomato',
  'Carrot',
  'Cabbage',
  'TOHFA-2026-4817',
];

function detail(over: Partial<ApplicationDetailView> = {}): ApplicationDetailView {
  return {
    id: APP_ID,
    status: 'SUBMITTED',
    isDecided: false,
    isDraft: false,
    currentStep: 5,
    completedSteps: [1, 2, 3, 4],
    submittedAt: '2026-11-02T05:00:00Z',
    createdAt: '2026-11-01T05:00:00Z',
    applicant: {
      name: 'Revathi Selvam',
      mobile: '9876512345',
      dob: '1985-04-02',
      gender: 'Female',
      aadhaarLast4: '4821',
      preferredLocale: 'ta',
      address: {
        line1: '12 Market Road',
        line2: null,
        text: null,
        village: 'Ketti',
        taluk: 'Coonoor',
        district: 'Nilgiris',
        pincode: '643215',
      },
    },
    farming: {
      farmName: 'Selvam Farm',
      typeOfFarming: 'Natural',
      experienceYears: 6,
      statedAreaAcres: 3.5,
      statedNumberOfFarms: 2,
      waterSource: 'Well',
      primaryCrops: ['Beans', 'Potato'],
    },
    locations: [
      {
        id: 'loc-1',
        label: 'North field',
        areaAcres: 2,
        calculatedAreaAcres: 1.9,
        village: 'Ketti',
        taluk: 'Coonoor',
        district: 'Nilgiris',
        hasBoundary: true,
        gps: { lat: 11.3421, lng: 76.7891 },
      },
      {
        id: 'loc-2',
        label: 'South field',
        areaAcres: 1.5,
        calculatedAreaAcres: 1.4,
        village: null,
        taluk: null,
        district: null,
        hasBoundary: false,
        gps: null,
      },
    ],
    documents: [{ docType: 'ID_PROOF', docSubType: 'Aadhaar', fileName: 'id-front.jpg', fileUrl: 'https://files.example/a.jpg' }],
    tohfaFarmerId: null,
    decidedAt: null,
    rejectionReason: null,
    infoRequest: null,
    zoneId: null,
    applicationCode: null,
    reviewHistory: null,
    documentVerification: null,
    declaration: null,
    ...over,
  };
}

let live: { application: ApplicationDetailView | undefined; isLoading: boolean; error: unknown };

function decision() {
  return { run: vi.fn(), finish: vi.fn(), reset: vi.fn(), isPending: false, error: null };
}

beforeEach(() => {
  vi.clearAllMocks();
  live = { application: detail(), isLoading: false, error: null };
  hooks.useApplication.mockImplementation(() => ({ ...live, refresh: vi.fn(), isRefreshing: false }));
  hooks.useApproveApplication.mockImplementation(() => decision());
  hooks.useRejectApplication.mockImplementation(() => decision());
  hooks.useAdvanceApplication.mockImplementation(() => decision());
  hooks.useReviewApplicationDocument.mockImplementation(() => decision());
  hooks.useReviewApplicationFmb.mockImplementation(() => decision());
  hooks.useAddApplicationNote.mockImplementation(() => decision());
  hooks.useRequestApplicationInfo.mockImplementation(() => decision());
});

function texts(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(texts);
  const own = typeof node.props['placeholder'] === 'string' ? [node.props['placeholder'] as string] : [];
  return [...own, ...(node.children ?? []).flatMap(texts)];
}

function allText(tree: renderer.ReactTestRenderer): string {
  return texts(tree.toJSON()).join('\n');
}

function byTestId(tree: renderer.ReactTestRenderer, id: string): ReactTestInstance[] {
  return tree.root.findAll((n) => typeof n.type === 'string' && n.props['testID'] === id);
}

function mount(props: Partial<React.ComponentProps<typeof AdminApplicationDetailScreen>> = {}): renderer.ReactTestRenderer {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(
      <AdminApplicationDetailScreen applicationId={APP_ID} can={allow(ALL_CODES)} onBack={vi.fn()} {...props} />,
    );
  });
  return tree;
}

// ---------------------------------------------------------------------------
// The pure facts behind the new fields
// ---------------------------------------------------------------------------

describe('reviewFacts: the FMB area and its variance', () => {
  it('sums the locations calculated areas, and is null when no location carries one', () => {
    expect(fmbAreaAcres(detail())).toBeCloseTo(3.3, 5);
    expect(
      fmbAreaAcres(
        detail({
          locations: detail().locations.map((l) => ({ ...l, calculatedAreaAcres: null })),
        }),
      ),
    ).toBeNull();
  });

  it('computes the variance from the stated area against the summed FMB area', () => {
    const variance = areaVariance(detail());
    expect(variance).not.toBeNull();
    expect(variance!.statedAcres).toBe(3.5);
    expect(variance!.fmbAcres).toBeCloseTo(3.3, 5);
    expect(variance!.diffAcres).toBeCloseTo(0.2, 5);
    // 0.2 / 3.3 = 6.06% — above the tolerance, so it needs a surveyor.
    expect(variance!.percent).toBeCloseTo(6.1, 5);
    expect(variance!.withinTolerance).toBe(false);
    expect(AREA_VARIANCE_TOLERANCE_PERCENT).toBeGreaterThan(0);
  });

  it('is null when either area is missing, and null when the two areas agree', () => {
    expect(areaVariance(detail({ farming: { ...detail().farming, statedAreaAcres: null } }))).toBeNull();
    expect(
      areaVariance(detail({ locations: detail().locations.map((l) => ({ ...l, calculatedAreaAcres: null })) })),
    ).toBeNull();
    expect(areaVariance(detail({ farming: { ...detail().farming, statedAreaAcres: 3.3 } }))).toBeNull();
    // A zero FMB area cannot give a percentage, so no variance is claimed.
    expect(
      areaVariance(detail({ locations: detail().locations.map((l) => ({ ...l, calculatedAreaAcres: 0 })) })),
    ).toBeNull();
  });

  it('reports a variance inside the tolerance as within margin', () => {
    const variance = areaVariance(detail({ farming: { ...detail().farming, statedAreaAcres: 3.33 } }));
    expect(variance!.withinTolerance).toBe(true);
  });

  it('summarises the locations: how many, how many have a boundary, and the FMB area', () => {
    const summary = locationSummary(detail());
    expect(summary.locationCount).toBe(2);
    expect(summary.boundaryCount).toBe(1);
    expect(summary.fmbAcres).toBeCloseTo(3.3, 5);
  });
});

describe('reviewFacts: farming type chips and step state', () => {
  it('offers the four designed chips and selects the stored one, whatever its case', () => {
    const chips = farmingTypeChips('organic');
    expect(chips.map((c) => c.key)).toEqual(['natural', 'organic', 'bioDynamic', 'others']);
    expect(chips.filter((c) => c.selected).map((c) => c.key)).toEqual(['organic']);
    expect(farmingTypeChips('Bio-dynamic').filter((c) => c.selected).map((c) => c.key)).toEqual(['bioDynamic']);
  });

  it('selects nothing for a value the design has no chip for, and nothing for no value', () => {
    expect(farmingTypeChips('Permaculture').some((c) => c.selected)).toBe(false);
    expect(farmingTypeChips(null).some((c) => c.selected)).toBe(false);
  });

  it('reads each step state off completedSteps and currentStep', () => {
    const app = detail();
    expect(stepState(app, 1)).toBe('done');
    expect(stepState(app, 5)).toBe('current');
    expect(stepState(detail({ completedSteps: [1], currentStep: 2 }), 3)).toBe('pending');
  });
});

// ---------------------------------------------------------------------------
// 01 · Personal details
// ---------------------------------------------------------------------------

describe('01 Personal details', () => {
  it('shows date of birth, gender and the Aadhaar helper line', () => {
    const text = allText(mount());
    expect(text).toContain(t('farmerApps.field.dob'));
    expect(text).toContain(t('farmerApps.field.gender'));
    expect(text).toContain('Female');
    expect(text).toContain(t('farmerApps.field.aadhaar'));
    expect(text).toContain(t('farmerApps.field.aadhaarHint'));
  });

  it('BR-33b: the Aadhaar shows its last four digits only, and dashes without them', () => {
    expect(allText(mount())).toContain('XXXX XXXX 4821');
    expect(allText(mount())).not.toMatch(/\d{12}/);

    live.application = detail({ applicant: { ...detail().applicant, aadhaarLast4: null } });
    const text = allText(mount());
    expect(text).toContain(t('farmerApps.field.aadhaar'));
    expect(text).not.toContain('XXXX XXXX');
  });

  it('dashes the date of birth and gender the API did not send, keeping both rows drawn', () => {
    live.application = detail({ applicant: { ...detail().applicant, dob: null, gender: null } });
    const tree = mount();
    expect(allText(tree)).toContain(t('farmerApps.field.dob'));
    expect(allText(tree)).toContain(t('farmerApps.field.gender'));
    expect(texts(tree.toJSON()).filter((s) => s === DASH).length).toBeGreaterThanOrEqual(2);
  });

  it('draws the mobile number badge with the dash: no OTP-verified flag exists on the application', () => {
    const tree = mount();
    expect(byTestId(tree, 'farmerApps.otpBadge')).toHaveLength(1);
    expect(allText(tree)).not.toContain('OTP Verified');
  });
});

// ---------------------------------------------------------------------------
// 02 · Farm details
// ---------------------------------------------------------------------------

describe('02 Farm details', () => {
  // Design of record (2026-11-25 port): areas print to two decimals, and section 02 has no
  // water-source row (the design draws none), so it is no longer asserted here.
  it('shows the farm name, experience, number of farms and both areas', () => {
    const text = allText(mount());
    expect(text).toContain('Selvam Farm');
    expect(text).toContain(t('farmerApps.years', { value: 6 }));
    expect(text).toContain(t('farmerApps.farms', { value: 2 }));
    expect(text).toContain(t('farmerApps.acres', { value: '3.50' }));
    expect(text).toContain(t('farmerApps.field.fmbArea'));
    expect(text).toContain(t('farmerApps.acres', { value: '3.30' }));
  });

  it('dashes every farm figure the API did not send and keeps the rows drawn', () => {
    live.application = detail({
      farming: {
        farmName: null,
        typeOfFarming: null,
        experienceYears: null,
        statedAreaAcres: null,
        statedNumberOfFarms: null,
        waterSource: null,
        primaryCrops: [],
      },
    });
    const tree = mount();
    const text = allText(tree);
    expect(text).toContain(t('farmerApps.field.farmName'));
    expect(text).toContain(t('farmerApps.field.experience'));
    expect(text).toContain(t('farmerApps.field.numberOfFarms'));
    expect(text).toContain(t('farmerApps.field.statedTotalArea'));
    expect(texts(tree.toJSON()).filter((s) => s === DASH).length).toBeGreaterThanOrEqual(5);
  });

  it('draws the farming-type chips read-only, with the stored value selected', () => {
    const tree = mount();
    const chips = byTestId(tree, 'farmerApps.farmingTypeChip');
    expect(chips).toHaveLength(4);
    for (const chip of chips) {
      expect(chip.props['onPress']).toBeUndefined();
      expect(chip.type).not.toBe('TouchableOpacity');
    }
    expect(allText(tree)).toContain(t('farmerApps.farmingType.natural'));
    expect(allText(tree)).toContain(t('farmerApps.farmingType.bioDynamic'));
  });

  // The design always draws the Area Variance box (noValue.ts: an element is never removed for a
  // missing number). What is protected is unchanged: a verdict only when both real areas exist and
  // differ; otherwise the box carries the dash and states no verdict.
  it('states an area variance verdict only when both areas exist and differ', () => {
    const variance = (tree: renderer.ReactTestRenderer) => byTestId(tree, 'farmerApps.areaVariance');
    expect(variance(mount())).toHaveLength(1);
    expect(allText(mount())).toContain(t('farmerApps.variance.needsSurveyor'));

    for (const app of [
      // The two areas agree: no variance to report.
      detail({ farming: { ...detail().farming, statedAreaAcres: 3.3 } }),
      // No FMB area at all.
      detail({ locations: detail().locations.map((l) => ({ ...l, calculatedAreaAcres: null })) }),
      // No stated area either.
      detail({ farming: { ...detail().farming, statedAreaAcres: null } }),
    ]) {
      live.application = app;
      const tree = mount();
      expect(variance(tree)).toHaveLength(1);
      const boxTexts = variance(tree)[0]!
        .findAll((n) => (n.type as unknown) === 'Text')
        .map((n) => String(n.props['children']));
      expect(boxTexts).not.toContain(t('farmerApps.variance.needsSurveyor'));
      expect(boxTexts).not.toContain(t('farmerApps.variance.withinMargin', { percent: 5 }));
      expect(boxTexts.filter((x) => x === DASH)).toHaveLength(2);
    }
  });
});

// ---------------------------------------------------------------------------
// 03 · Farm location & boundaries
// ---------------------------------------------------------------------------

describe('03 Farm location & boundaries', () => {
  // Design of record (2026-11-25 port): one map card with a zone row per location, replacing the
  // previous per-location cards. The facts asserted are the same: each location, its area, the
  // real GPS, the dash where the API sent nothing, and the FMB state.
  it('lists one zone row per location with its own label and area', () => {
    const tree = mount();
    expect(byTestId(tree, 'farmerApps.locationRow')).toHaveLength(2);
    const text = allText(tree);
    expect(text).toContain('North field');
    expect(text).toContain('South field');
    expect(text).toContain(t('farmerApps.location.areaBadge', { acres: '1.90' }));
    expect(text).toContain(t('farmerApps.location.areaBadge', { acres: '1.40' }));
  });

  it('shows the GPS coordinates we carry, and the dash for the accuracy nothing reports', () => {
    const text = allText(mount());
    expect(text).toContain(t('farmerApps.gps', { lat: 11.3421, lng: 76.7891 }));
    expect(text).toContain(t('farmerApps.location.gpsLine', { gps: t('farmerApps.gps', { lat: 11.3421, lng: 76.7891 }), accuracy: DASH }));
    // The GPS-accuracy explanation was removed as noise (owner, 2026-11-24).
    expect(text).not.toContain(t('farmerApps.location.gpsAccuracyUnavailable'));
  });

  it('with no drawn ring, the map panel says so and draws no shape', () => {
    const tree = mount();
    expect(allText(tree)).toContain(t('farmerApps.location.noBoundary'));
    expect(byTestId(tree, 'farmerApps.boundaryShape')).toHaveLength(0);
  });

  it('farm-wide crops are not split across several locations: each zone row dashes its crop', () => {
    const text = allText(mount());
    expect(text).not.toContain('Beans, Potato');
    expect(text).toContain(t('farmerApps.location.zoneCrop', { crop: DASH, area: t('farmerApps.location.areaBadge', { acres: '1.90' }) }));
    live.application = detail({ locations: [detail().locations[0]!] });
    expect(allText(mount())).toContain('Beans, Potato');
  });

  it('summarises zones, the FMB area and the FMB status from the stored boundaries', () => {
    const text = allText(mount());
    expect(text).toContain(t('farmerApps.location.zonesStat'));
    expect(text).toContain(t('farmerApps.location.fmbStatusStat'));
    // One of two locations has a boundary: not "Provided".
    expect(text).toContain(t('farmerApps.fmb.pending'));
    expect(text).toContain(t('farmerApps.location.areaBadge', { acres: '3.30' }));
  });
});

// ---------------------------------------------------------------------------
// 04 · Documents, step badges and the header pills
// ---------------------------------------------------------------------------

describe('04 Documents', () => {
  // The design's file line is "name · size"; the size is reported by nothing, so it is the dash
  // (previously a separate caption explained it).
  it('shows each document file name and dashes the file size the API does not report', () => {
    expect(allText(mount())).toContain(t('farmerApps.doc.fileLine', { name: 'id-front.jpg', size: DASH }));
  });

  it('dashes the file name of a document that came without one', () => {
    live.application = detail({ documents: [{ docType: 'FARM_DOC', docSubType: null, fileName: null, fileUrl: null }] });
    expect(allText(mount())).toContain(t('farmerApps.doc.fileLine', { name: DASH, size: DASH }));
  });
});

describe('the designed step badges and header pills', () => {
  it('numbers all five steps', () => {
    const text = allText(mount());
    for (let n = 1; n <= 5; n += 1) expect(text).toContain(t('farmerApps.step', { n, total: 5 }));
  });

  // Owner decision 2026-11-25: audit is a separate flow. The design's 01/02/03 mode pills were
  // "Request Info / Waiting Audit / Schedule Audit"; with the audit modes gone there is nothing to
  // switch between, so the pill bar is not drawn at all (previously: drawn, 02/03 disabled).
  it('draws no audit mode pills and no audit wording', () => {
    const tree = mount();
    expect(byTestId(tree, 'farmerApps.modePill')).toHaveLength(0);
    expect(allText(tree)).not.toMatch(/audit/i);
  });
});

describe('no design fixture reaches the screen', () => {
  it('renders none of the 2026-11-19 design literals, in any state', () => {
    for (const state of ['SUBMITTED', 'APPROVED', 'REJECTED'] as const) {
      live.application = detail({ status: state, isDecided: state !== 'SUBMITTED' });
      const text = allText(mount());
      for (const fixture of DESIGN_FIXTURES) {
        expect(text, `rendered design fixture "${fixture}" in ${state}`).not.toContain(fixture);
      }
    }
  });
});
