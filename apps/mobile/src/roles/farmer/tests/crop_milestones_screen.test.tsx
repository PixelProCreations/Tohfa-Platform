/**
 * CropMilestonesScreen used to render a hard-coded carrot milestone map
 * ("Direct Sowing & Bed Preparation", "8.8° Brix measured (Grade A)") and only
 * toggled that sample data in memory. These tests pin the wiring to the real
 * BR-57 endpoints: the milestones, counts and progress shown are the API's,
 * "Mark Done" PATCHes the server, and nothing sample-looking is rendered when
 * there is no data.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';
import type {
  CropMilestoneResponse,
  CropMilestonesListResponse,
  CropMilestoneTemplateResponse,
  FarmCropResponse,
} from '../api/crops';
import type * as CropsApi from '../api/crops';
import type { CropItem } from '../screens/farm/crops/cropItems';

// Only what the screen imports from react-native.
vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
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
  Rect: 'Rect',
}));

vi.mock('@tohfa/mobile-ui', () => ({
  EmptyState: 'EmptyState',
  ErrorState: 'ErrorState',
  SafeAreaView: 'SafeAreaView',
  ScreenStatusBar: 'ScreenStatusBar',
}));

const cropsApi = vi.hoisted(() => ({
  listCropMilestones: vi.fn(),
  listCropMilestoneTemplates: vi.fn(),
  updateCropMilestone: vi.fn(),
  getFarmCrop: vi.fn(),
}));
vi.mock('../api/crops', async (importOriginal) => ({
  ...(await importOriginal<typeof CropsApi>()),
  ...cropsApi,
}));

import { CropMilestonesScreen } from '../screens/farm/crops/CropMilestonesScreen';
import { setLocale, t } from '../../../i18n/farmer';

const CROP_ID = '50000000-0000-4000-8000-000000000001';

function renderedText(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(renderedText);
  return (node.children ?? []).flatMap(renderedText);
}

/** Adjacent string children of one <Text> render as separate nodes; join per element. */
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

function milestone(overrides: Partial<CropMilestoneResponse> = {}): CropMilestoneResponse {
  return {
    id: 'm-1',
    farmerId: 'farmer-1',
    farmCropId: CROP_ID,
    templateId: 'tmpl-1',
    stageCode: 'STAGE_SOWING',
    stageName: 'Sowing & Germination',
    sequenceOrder: 1,
    status: 'COMPLETED',
    targetDate: '2026-09-02',
    completedOn: '2026-09-03',
    notes: 'Even germination',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: null,
    ...overrides,
  };
}

const TEMPLATES: CropMilestoneTemplateResponse[] = [
  {
    id: 'tmpl-1',
    cropMasterId: null,
    stageCode: 'STAGE_SOWING',
    stageName: 'Sowing & Germination',
    description: 'Seed sowing and initial sprout emergence',
    sequenceOrder: 1,
    expectedDaysAfterPlanting: 7,
  },
  {
    id: 'tmpl-2',
    cropMasterId: null,
    stageCode: 'STAGE_VEGETATIVE',
    stageName: 'Vegetative Growth',
    description: 'Stem, branch and foliage leaf development',
    sequenceOrder: 2,
    expectedDaysAfterPlanting: 30,
  },
];

function list(items: CropMilestoneResponse[], completedCount: number, progressPct: number): CropMilestonesListResponse {
  return { items, totalCount: items.length, completedCount, progressPct };
}

const TWO_MILESTONES = list(
  [
    milestone(),
    milestone({
      id: 'm-2',
      templateId: 'tmpl-2',
      stageCode: 'STAGE_VEGETATIVE',
      stageName: 'Vegetative Growth',
      sequenceOrder: 2,
      status: 'PENDING',
      targetDate: '2026-10-01',
      completedOn: null,
      notes: null,
    }),
  ],
  1,
  50,
);

/** Strings from the sample carrot map in CropDetailScreen that used to be rendered as if real. */
const SAMPLE_STRINGS = [
  'Direct Sowing & Bed Preparation',
  'Seedling Emergence',
  'Brix',
  'Nantes',
  'Carrot',
  '20 Jul 2026',
  'Zone 1',
  'Day 88',
];

function expectNoSampleData(text: string): void {
  for (const s of SAMPLE_STRINGS) expect(text, `rendered sample value "${s}"`).not.toContain(s);
}

beforeEach(() => {
  vi.clearAllMocks();
  cropsApi.listCropMilestones.mockResolvedValue(TWO_MILESTONES);
  cropsApi.listCropMilestoneTemplates.mockResolvedValue(TEMPLATES);
  cropsApi.getFarmCrop.mockResolvedValue({
    id: CROP_ID,
    cropMasterId: 'master-beans',
    expectedHarvestOn: '2026-12-05',
  } as unknown as FarmCropResponse);
});

describe('CropMilestonesScreen (BR-57)', () => {
  it("BR-57b: renders the crop's API milestones, counts and progress, never the sample carrot map", async () => {
    const tree = await mount(<CropMilestonesScreen crop={makeCrop()} />);
    const text = textOf(tree);

    expect(cropsApi.listCropMilestones).toHaveBeenCalledWith(CROP_ID);
    // Crop-specific templates win over universal ones (BR-57b), so ask for this crop's.
    expect(cropsApi.listCropMilestoneTemplates).toHaveBeenCalledWith('master-beans');
    expect(text).toContain('50%');
    expect(text).toContain(t('farmer.cropMilestones.doneBadge', { done: 1, total: 2 }));
    expect(text).toContain(t('farmer.cropMilestones.completedSummary', { done: 1, total: 2 }));
    expect(text).toContain(t('farmer.cropMilestones.lifecycleDay', { day: 40 }));
    expect(text).toContain(t('farmer.cropMilestones.subtitleExpected', { zone: 'Plot North', date: '5 Dec 2026' }));
    // First PENDING milestone is selected; its template supplies the target.
    expect(text).toContain('Vegetative Growth');
    expect(text).toContain('Stem, branch and foliage leaf development');
    expect(text).toContain(t('farmer.cropMilestones.targetDay', { day: 30, date: '1 Oct 2026' }));
    expect(text).toContain(t('farmer.cropMilestones.outcomePending'));
    expect(text).toContain(t('farmer.cropMilestones.noNote'));
    expectNoSampleData(text);
  });

  it('BR-57b: shows a dash, not an invented day or deliverable, when the milestone has no template', async () => {
    cropsApi.listCropMilestones.mockResolvedValue(
      list([milestone({ templateId: null, status: 'PENDING', completedOn: null, targetDate: null })], 0, 0),
    );
    cropsApi.listCropMilestoneTemplates.mockResolvedValue([]);
    const tree = await mount(<CropMilestonesScreen crop={makeCrop({ daysOld: null })} />);
    const text = textOf(tree);

    expect(text).toContain(t('farmer.cropMilestones.targetDay', { day: '—', date: '—' }));
    expect(text).toContain(t('farmer.cropMilestones.lifecycleDay', { day: '—' }));
    expect(text).not.toMatch(/Day 15\b/);
    expect(text).not.toContain('stage criteria met');
  });

  it('BR-57b: shows the empty state, not sample milestones, when the crop has none', async () => {
    cropsApi.listCropMilestones.mockResolvedValue(list([], 0, 0));
    const tree = await mount(<CropMilestonesScreen crop={makeCrop()} />);

    const empty = tree.root.findAllByType('EmptyState' as unknown as React.ElementType);
    expect(empty).toHaveLength(1);
    expect(empty[0]?.props['title']).toBe(t('farmer.cropMilestones.empty'));
    expectNoSampleData(textOf(tree));
  });

  it('BR-57b: makes no request and renders no sample data without a crop', async () => {
    const tree = await mount(<CropMilestonesScreen crop={null} />);

    expect(cropsApi.listCropMilestones).not.toHaveBeenCalled();
    expect(tree.root.findAllByType('EmptyState' as unknown as React.ElementType)).toHaveLength(1);
    expectNoSampleData(textOf(tree));
  });

  it('BR-57c: Mark Done PATCHes COMPLETED and then shows the progress the server reports', async () => {
    const completed = milestone({
      id: 'm-2',
      templateId: 'tmpl-2',
      stageCode: 'STAGE_VEGETATIVE',
      stageName: 'Vegetative Growth',
      sequenceOrder: 2,
      status: 'COMPLETED',
      targetDate: '2026-10-01',
      completedOn: '2026-10-02',
      notes: null,
    });
    cropsApi.updateCropMilestone.mockResolvedValue(completed);
    const tree = await mount(<CropMilestonesScreen crop={makeCrop()} />);
    cropsApi.listCropMilestones.mockResolvedValue(list([milestone(), completed], 2, 100));

    const markDone = tree.root
      .findAllByType('TouchableOpacity' as unknown as React.ElementType)
      .find((b) => b.props['accessibilityLabel'] === t('farmer.cropMilestones.markCompletedA11y'));
    expect(markDone).toBeDefined();
    await act(async () => {
      (markDone!.props['onPress'] as () => void)();
    });
    await settle();

    expect(cropsApi.updateCropMilestone).toHaveBeenCalledWith(CROP_ID, 'm-2', { status: 'COMPLETED' });
    const text = textOf(tree);
    expect(text).toContain('100%');
    expect(text).toContain(t('farmer.cropMilestones.doneBadge', { done: 2, total: 2 }));
    expect(text).toContain(t('farmer.cropMilestones.outcomeCompletedOn', { date: '2 Oct 2026' }));
  });

  it('BR-57c: un-completing a milestone PATCHes PENDING and clears completedOn', async () => {
    // Only a COMPLETED milestone, so it is the one selected.
    cropsApi.listCropMilestones.mockResolvedValue(list([milestone()], 1, 100));
    cropsApi.updateCropMilestone.mockResolvedValue(milestone({ status: 'PENDING', completedOn: null }));
    const tree = await mount(<CropMilestonesScreen crop={makeCrop()} />);

    const markInProgress = tree.root
      .findAllByType('TouchableOpacity' as unknown as React.ElementType)
      .find((b) => b.props['accessibilityLabel'] === t('farmer.cropMilestones.markInProgressA11y'));
    expect(markInProgress).toBeDefined();
    await act(async () => {
      (markInProgress!.props['onPress'] as () => void)();
    });
    await settle();

    // A stale completion date must not survive the milestone going back to PENDING.
    expect(cropsApi.updateCropMilestone).toHaveBeenCalledWith(CROP_ID, 'm-1', { status: 'PENDING', completedOn: null });
  });

  it('shows the stage category from the i18n catalogue (Tamil), falling back to the readable code', async () => {
    setLocale('ta');
    try {
      cropsApi.listCropMilestones.mockResolvedValue(
        list([milestone(), milestone({ id: 'm-9', stageCode: 'STAGE_CUSTOM_PHASE', status: 'PENDING', completedOn: null })], 1, 50),
      );
      const tree = await mount(<CropMilestonesScreen crop={makeCrop()} />);
      const text = textOf(tree);
      expect(t('farmer.cropMilestones.stage.STAGE_SOWING')).not.toBe('Sowing');
      expect(text).toContain(t('farmer.cropMilestones.stage.STAGE_SOWING'));
      // A stage code with no catalogue entry is still shown, made readable.
      expect(text).toContain('Custom phase');
    } finally {
      setLocale('en');
    }
  });

  it('BR-57c: a failed update leaves the server state on screen and says so', async () => {
    cropsApi.updateCropMilestone.mockRejectedValue(new Error('boom'));
    const tree = await mount(<CropMilestonesScreen crop={makeCrop()} />);

    const markDone = tree.root
      .findAllByType('TouchableOpacity' as unknown as React.ElementType)
      .find((b) => b.props['accessibilityLabel'] === t('farmer.cropMilestones.markCompletedA11y'));
    await act(async () => {
      (markDone!.props['onPress'] as () => void)();
    });
    await settle();

    const text = textOf(tree);
    expect(text).toContain('50%');
    expect(text).toContain(t('farmer.cropMilestones.updateError'));
  });

  it('shows the error state with a retry that reloads when the milestones cannot be loaded', async () => {
    cropsApi.listCropMilestones.mockRejectedValueOnce(new Error('offline'));
    const tree = await mount(<CropMilestonesScreen crop={makeCrop()} />);

    const errors = tree.root.findAllByType('ErrorState' as unknown as React.ElementType);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.props['title']).toBe(t('farmer.cropMilestones.loadErrorTitle'));
    expectNoSampleData(textOf(tree));

    await act(async () => {
      (errors[0]!.props['onRetry'] as () => void)();
    });
    await settle();
    expect(cropsApi.listCropMilestones).toHaveBeenCalledTimes(2);
    expect(textOf(tree)).toContain('50%');
  });
});
