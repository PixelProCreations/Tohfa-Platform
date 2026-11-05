/**
 * CropNPKContributionScreen used to render invented nutrient data: a fixed
 * five-nutrient requirement list (16 of 40 kg/ha, 40%...), "2 of 5 nutrients
 * running low", sample cumulative intake (6.4 kg...) and three sample
 * applications. The rejected PR replaced that with hard-coded per-crop N/P/K
 * targets and 50%/80% colour bands, which are business thresholds with no
 * owner-supplied source (CLAUDE.md 2.7; docs/rules.md Open contradictions).
 *
 * These tests pin the wiring to BR-56f: only the API's real totals and the
 * crop's real input applications are shown, and with no configured targets
 * the requirement section is neutral (no percentage, target, band or alert).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';
import type { CropInputResponse, CropNpkContributionResponse } from '../api/crops';
import type * as CropsApi from '../api/crops';
import type { CropItem } from '../screens/farm/crops/cropItems';

// Only what the screen imports from react-native.
vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  Image: 'Image',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  View: 'View',
}));

vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Line: 'Line',
  Path: 'Path',
  Rect: 'Rect',
}));

vi.mock('@tohfa/mobile-ui', () => ({
  EmptyState: 'EmptyState',
  ErrorState: 'ErrorState',
  SafeAreaView: 'SafeAreaView',
  ScreenStatusBar: 'ScreenStatusBar',
}));

const cropsApi = vi.hoisted(() => ({
  getNpkContribution: vi.fn(),
  listCropInputs: vi.fn(),
}));
vi.mock('../api/crops', async (importOriginal) => ({
  ...(await importOriginal<typeof CropsApi>()),
  ...cropsApi,
}));

import { CropNPKContributionScreen } from '../screens/farm/crops/CropNPKContributionScreen';
import { t } from '../../../i18n/farmer';

const CROP_ID = '11111111-2222-3333-4444-555555555555';

function renderedText(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(renderedText);
  return (node.children ?? []).flatMap(renderedText);
}

function textOf(tree: renderer.ReactTestRenderer): string {
  return tree.root
    .findAllByType('Text' as unknown as React.ElementType)
    .map((n) => renderedText(n.children as unknown as ReactTestRendererJSON[]).join(''))
    .join('\n');
}

async function settle(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function mount(element: React.ReactElement): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(element);
  });
  await settle();
  return tree;
}

function makeCrop(overrides: Partial<CropItem> = {}): CropItem {
  return {
    id: CROP_ID,
    name: 'Beans',
    variety: 'Ooty Local',
    cropType: 'custom',
    zone: 'Plot North',
    zoneShort: 'Plot North',
    area: '0.5 acres',
    daysOld: 40,
    statusType: 'harvest',
    statusDays: 30,
    statusText: 'Harvest in 30 days',
    accentColor: 'green',
    ...overrides,
  };
}

const NPK: CropNpkContributionResponse = {
  farmCropId: CROP_ID,
  totalInputsCount: 2,
  totalQuantityKg: 68,
  totalNitrogenKg: 16.5,
  totalPhosphorusKg: 12,
  totalPotassiumKg: 4.25,
  totalCostInr: '1250.00',
};

function input(overrides: Partial<CropInputResponse> = {}): CropInputResponse {
  return {
    id: 'input-1',
    farmerId: 'farmer-1',
    farmCropId: CROP_ID,
    inputType: 'MANURE',
    inputName: 'Farmyard manure',
    appliedOn: '2026-09-12',
    quantity: 60,
    unit: 'KG',
    nitrogenPct: 2,
    phosphorusPct: null,
    potassiumPct: 1,
    applicationMethod: null,
    costInr: null,
    notes: null,
    purpose: null,
    targetPest: null,
    appliedBy: null,
    createdAt: '2026-09-12T05:30:00.000Z',
    updatedAt: null,
    ...overrides,
  };
}

/** The sample values the screen used to show as if real. */
const SAMPLE_STRINGS = [
  'Magnesium',
  'Sulphur',
  'MgO',
  'SO₃',
  'Vermicompost',
  'Panchagavya',
  'Bone meal',
  '6.4 kg',
  '18.0 kg',
  'kg/ha',
  'running low',
  'Carrot',
  'Nantes',
  '0.4 HA',
];

function expectNoSampleOrTargetData(text: string): void {
  for (const s of SAMPLE_STRINGS) expect(text, `rendered sample value "${s}"`).not.toContain(s);
  // No requirement percentage of any kind (there is no configured target).
  expect(text).not.toMatch(/\d+%/);
}

beforeEach(() => {
  vi.clearAllMocks();
  cropsApi.getNpkContribution.mockResolvedValue(NPK);
  cropsApi.listCropInputs.mockResolvedValue({
    items: [
      input(),
      input({
        id: 'input-2',
        inputType: 'FERTILIZER',
        inputName: 'Rock phosphate',
        appliedOn: '2026-09-20',
        quantity: 8,
        unit: 'LITRE',
        nitrogenPct: null,
        phosphorusPct: 18,
        potassiumPct: null,
      }),
    ],
    page: { nextCursor: null, hasMore: false },
  });
});

describe('CropNPKContributionScreen (BR-56f)', () => {
  it("BR-56f: shows the API's real cumulative N, P and K totals for the crop", async () => {
    const tree = await mount(<CropNPKContributionScreen crop={makeCrop()} />);
    const text = textOf(tree);

    expect(cropsApi.getNpkContribution).toHaveBeenCalledWith(CROP_ID);
    expect(text).toContain(t('farmer.npkContribution.nitrogen'));
    expect(text).toContain(t('farmer.npkContribution.amountKg', { amount: '16.5' }));
    expect(text).toContain(t('farmer.npkContribution.amountKg', { amount: '12' }));
    expect(text).toContain(t('farmer.npkContribution.amountKg', { amount: '4.25' }));
    expect(text).toContain(t('farmer.npkContribution.cumulativeIntake', { area: '0.5 ACRES' }));
    expect(text).toContain(t('farmer.npkContribution.daysOld', { days: 40 }));
    expectNoSampleOrTargetData(text);
  });

  it('BR-56f: with no configured nutrient targets, shows a neutral requirement section: no target, percentage, band or low-nutrient alert', async () => {
    const tree = await mount(<CropNPKContributionScreen crop={makeCrop()} />);
    const text = textOf(tree);

    expect(text).toContain(t('farmer.npkContribution.requirementMet'));
    expect(text).toContain(t('farmer.npkContribution.targetsUnavailable'));
    expectNoSampleOrTargetData(text);
    // No progress bar that would encode a percentage of a requirement.
    const widths = tree.root
      .findAllByType('View' as unknown as React.ElementType)
      .flatMap((v) => (Array.isArray(v.props['style']) ? v.props['style'] : [v.props['style']]))
      .filter((s): s is { width: unknown } => typeof s === 'object' && s !== null && 'width' in s)
      .map((s) => s.width)
      .filter((w) => typeof w === 'string' && w.endsWith('%') && w !== '100%');
    expect(widths).toEqual([]);
  });

  it("BR-56f: lists the crop's real input applications with their N/P/K tags", async () => {
    const tree = await mount(<CropNPKContributionScreen crop={makeCrop()} />);
    const text = textOf(tree);

    expect(cropsApi.listCropInputs).toHaveBeenCalledWith(CROP_ID, expect.objectContaining({ limit: expect.any(Number) }));
    expect(text).toContain('Farmyard manure');
    expect(text).toContain('Rock phosphate');
    expect(text).toContain(`12 ${t('farmer.audits.monthShort.sep')} · 60 ${t('farmer.npkContribution.unit.kg')}`);
    expect(text).toContain(`20 ${t('farmer.audits.monthShort.sep')} · 8 ${t('farmer.npkContribution.unit.litre')}`);
    expect(text).toContain('P₂O₅');
  });

  it('BR-56f: follows every page of inputs', async () => {
    cropsApi.listCropInputs
      .mockResolvedValueOnce({ items: [input()], page: { nextCursor: 'cur-2', hasMore: true } })
      .mockResolvedValueOnce({
        items: [input({ id: 'input-9', inputName: 'Neem cake' })],
        page: { nextCursor: null, hasMore: false },
      });
    const tree = await mount(<CropNPKContributionScreen crop={makeCrop()} />);

    expect(cropsApi.listCropInputs).toHaveBeenCalledTimes(2);
    expect(cropsApi.listCropInputs.mock.calls[1]?.[1]).toEqual(expect.objectContaining({ cursor: 'cur-2' }));
    expect(textOf(tree)).toContain('Neem cake');
  });

  it('BR-56f: shows the empty state when the crop has no input applications', async () => {
    cropsApi.listCropInputs.mockResolvedValue({ items: [], page: { nextCursor: null, hasMore: false } });
    const tree = await mount(<CropNPKContributionScreen crop={makeCrop()} />);

    const empty = tree.root.findAllByType('EmptyState' as unknown as React.ElementType);
    expect(empty).toHaveLength(1);
    expect(empty[0]?.props['title']).toBe(t('farmer.npkContribution.empty'));
  });

  it('makes no request and renders no sample data without a crop', async () => {
    const tree = await mount(<CropNPKContributionScreen crop={null} />);

    expect(cropsApi.getNpkContribution).not.toHaveBeenCalled();
    expect(tree.root.findAllByType('EmptyState' as unknown as React.ElementType)).toHaveLength(1);
    expectNoSampleOrTargetData(textOf(tree));
  });

  it('shows the error state with a retry that reloads when the contribution cannot be loaded', async () => {
    cropsApi.getNpkContribution.mockRejectedValueOnce(new Error('offline'));
    const tree = await mount(<CropNPKContributionScreen crop={makeCrop()} />);

    const errors = tree.root.findAllByType('ErrorState' as unknown as React.ElementType);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.props['title']).toBe(t('farmer.npkContribution.loadErrorTitle'));
    expectNoSampleOrTargetData(textOf(tree));

    await act(async () => {
      (errors[0]!.props['onRetry'] as () => void)();
    });
    await settle();
    expect(cropsApi.getNpkContribution).toHaveBeenCalledTimes(2);
    expect(textOf(tree)).toContain(t('farmer.npkContribution.amountKg', { amount: '16.5' }));
  });
});
