/**
 * The soil screens used to fill every missing reading with a plausible sample
 * value (pH 5.8, "Tested on 12 Jun 2026", a "soil_report_jun2026.pdf · 820 KB"
 * card, three invented history rows, a "6.4"/"3 wks" stat pair...). A farmer
 * cannot tell those apart from their own data. These tests pin the honest
 * empty state: with no real test, nothing that looks like a reading renders.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';
import type { SoilTestRecord } from '../api/soil';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StatusBar: 'StatusBar',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));

vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Circle: 'Circle',
  Line: 'Line',
  Path: 'Path',
  Polygon: 'Polygon',
  Polyline: 'Polyline',
  Rect: 'Rect',
}));

vi.mock('@tohfa/mobile-ui', () => ({ Icon: 'Icon' }));

const farmsApi = vi.hoisted(() => ({
  getFarms: vi.fn(),
  getPlots: vi.fn(),
}));
const soilApi = vi.hoisted(() => ({
  listSoilTests: vi.fn(),
  getSoilHealthSummary: vi.fn(),
}));
vi.mock('../api/farms', () => farmsApi);
vi.mock('../api/soil', () => soilApi);

import { SoilTestScreen } from '../screens/profile/SoilTestScreen';
import { SoilManagementScreen } from '../screens/farm/soil/SoilManagementScreen';
import { t } from '../../../i18n/farmer';

/** Every string rendered anywhere in the tree, in order. */
function renderedText(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(renderedText);
  return (node.children ?? []).flatMap(renderedText);
}

async function mount(element: React.ReactElement): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(element);
  });
  // Let the screen's async load effect settle.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return tree;
}

/** The sample strings the screens used to render in place of real data. */
const FAKE_SAMPLE_STRINGS = [
  '12 Jun 2026',
  '11 Jun 2027',
  '05 Jun 2025',
  '20 May 2024',
  'soil_report',
  '820 KB',
  '3 wks',
  'Harmless',
  'HARMLESS',
];

/**
 * The sample readings. Matched as whole numbers so that a legitimate
 * reference range ("Ideal 0.51–0.75%") does not trip the "0.7" check.
 */
const FAKE_SAMPLE_NUMBERS = ['5.8', '6.4', '6.1', '0.62', '0.59', '0.55', '0.7', '0.6', '312', '195'];

function expectNoFakeValues(text: string[]): void {
  const joined = text.join('\n');
  for (const fake of FAKE_SAMPLE_STRINGS) {
    expect(joined, `rendered fabricated value "${fake}"`).not.toContain(fake);
  }
  for (const fake of FAKE_SAMPLE_NUMBERS) {
    const asWholeNumber = new RegExp(`(?<![\\d.])${fake.replace('.', '\\.')}(?![\\d])`);
    expect(joined, `rendered fabricated reading "${fake}"`).not.toMatch(asWholeNumber);
  }
}

function makeTest(overrides: Partial<SoilTestRecord> = {}): SoilTestRecord {
  return {
    id: 'test-1',
    plotId: 'plot-1',
    testDate: '2026-09-01',
    nextDueDate: '2027-09-01',
    organicCarbonPct: 0.81,
    ph: 6.7,
    ecDsPerM: 0.3,
    tdsPpm: null,
    nitrogenKgPerHa: null,
    phosphorusKgPerHa: null,
    potassiumKgPerHa: null,
    limeStatus: null,
    labReportUploadId: null,
    organicCarbonLabel: 'High',
    phLabel: 'Neutral',
    ecLabel: 'Normal',
    tdsLabel: null,
    nitrogenLabel: null,
    phosphorusLabel: null,
    potassiumLabel: null,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  farmsApi.getFarms.mockResolvedValue([{ id: 'farm-1' }]);
  farmsApi.getPlots.mockResolvedValue([{ id: 'plot-1', name: 'Zone A' }]);
  soilApi.listSoilTests.mockResolvedValue([]);
  soilApi.getSoilHealthSummary.mockRejectedValue(new Error('no summary'));
});

describe('SoilTestScreen honest empty state', () => {
  it('renders no fabricated readings, dates, report or history when the farm has no soil tests', async () => {
    const tree = await mount(<SoilTestScreen farmId="farm-1" onNavigateBack={() => undefined} />);
    const text = renderedText(tree.toJSON());

    expectNoFakeValues(text);
    expect(text).toContain(t('farmer.profile.soil.noTestYet'));
    expect(text).toContain(t('farmer.profile.soil.noHistory'));
    expect(text).toContain('—');
    // No real acidic pH, so no acidity alert.
    expect(text.join('\n')).not.toContain(t('farmer.profile.soil.alertDesc'));
    // No real report, so no report card.
    expect(text).not.toContain(t('farmer.profile.soil.labReportAttached'));
    // Fewer than two real tests: trend cards show their empty state, not a line.
    expect(text.filter((s) => s === t('farmer.profile.soil.trendNotEnoughData'))).toHaveLength(2);
    expect(tree.root.findAllByType('Polyline' as unknown as React.ElementType)).toHaveLength(0);
  });

  it('shows a dash for each optional field the real test left null, never a sample value', async () => {
    soilApi.listSoilTests.mockResolvedValue([makeTest()]);
    const tree = await mount(<SoilTestScreen farmId="farm-1" onNavigateBack={() => undefined} />);
    const text = renderedText(tree.toJSON());

    expectNoFakeValues(text);
    expect(text).toContain('6.7');
    expect(text).toContain('0.81');
    // N, P, K, TDS and lime status were not recorded.
    expect(text.filter((s) => s === '—').length).toBeGreaterThanOrEqual(5);
    expect(text).not.toContain(t('farmer.profile.soil.noTestYet'));
  });

  it('shows the lab report card only for a real attached upload, without inventing a name or size', async () => {
    soilApi.listSoilTests.mockResolvedValue([makeTest({ labReportUploadId: 'upload-1' })]);
    const tree = await mount(<SoilTestScreen farmId="farm-1" onNavigateBack={() => undefined} />);
    const text = renderedText(tree.toJSON());

    expect(text).toContain(t('farmer.profile.soil.labReportAttached'));
    expect(text.join('\n')).not.toMatch(/\.pdf|KB|MB/);
  });

  it('raises the acidity alert only from a real acidic reading', async () => {
    soilApi.listSoilTests.mockResolvedValue([makeTest({ ph: 5.2, phLabel: 'Acidic' })]);
    const tree = await mount(<SoilTestScreen farmId="farm-1" onNavigateBack={() => undefined} />);
    const text = renderedText(tree.toJSON());

    expect(text).toContain(t('farmer.profile.soil.alertTitle', { value: '5.2' }));
  });
});

describe('SoilManagementScreen honest empty state', () => {
  const navProps = () => ({
    onNavigateToSoilTestRecords: vi.fn(),
    onNavigateToSoilHealthTracker: vi.fn(),
    onNavigateToSoilTypeClassification: vi.fn(),
    onNavigateToAmendments: vi.fn(),
    onNavigateToCropRotation: vi.fn(),
    onNavigateToMoistureTracking: vi.fn(),
    onNavigateToErosionConservation: vi.fn(),
    onNavigateToExportReports: vi.fn(),
    onNavigateToNewSoilTest: vi.fn(),
  });

  it('shows a dash, not "6.4" / "3 wks", when the farm has no soil test', async () => {
    const tree = await mount(<SoilManagementScreen {...navProps()} />);
    const text = renderedText(tree.toJSON());

    expectNoFakeValues(text);
    expect(text.filter((s) => s === '—')).toHaveLength(2);
  });

  it('shows the real latest pH when a test exists', async () => {
    soilApi.listSoilTests.mockResolvedValue([makeTest({ ph: 6.73 })]);
    const tree = await mount(<SoilManagementScreen {...navProps()} />);
    const text = renderedText(tree.toJSON());

    expect(text).toContain('6.7');
    expectNoFakeValues(text);
  });

  it('routes every module card and the upload button to its navigation callback with the real farmId', async () => {
    const props = navProps();
    const tree = await mount(<SoilManagementScreen {...props} />);

    const buttons = tree.root
      .findAllByType('TouchableOpacity' as unknown as React.ElementType)
      .filter((b) => b.props['accessibilityLabel'] !== 'Go back');
    // 8 module cards + the upload button.
    expect(buttons).toHaveLength(9);
    act(() => {
      for (const b of buttons) (b.props['onPress'] as () => void)();
    });

    for (const fn of Object.values(props)) {
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('farm-1');
    }
  });
});
