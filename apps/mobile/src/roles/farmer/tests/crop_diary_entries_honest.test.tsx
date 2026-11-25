/**
 * CropDiaryEntriesScreen used to render six invented diary entries
 * (`INITIAL_DIARY_ENTRIES`: "Weeding — North row cleared", "FYM, 40kg", ...)
 * plus a 'Carrot' / 'Nantes' / 'Zone 1' header and a hardcoded "14 entries /
 * 2 days" stat pair. A farmer could not tell those apart from their own log.
 *
 * These tests pin the honest behaviour: the screen reads
 * GET /farmers/me/diary/entries and renders exactly what came back, an empty
 * result shows the empty state, and a failed load shows the error — never the
 * fixture.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';
import type { DiaryEntrySummary } from '../api/farmDiary';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: () => undefined },
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
  Rect: 'Rect',
}));

vi.mock('@tohfa/mobile-ui', () => ({
  Icon: 'Icon',
  SafeAreaView: 'SafeAreaView',
  ScreenStatusBar: 'ScreenStatusBar',
}));

const diaryApi = vi.hoisted(() => ({
  listDiaryEntries: vi.fn(),
  listDiaryPlots: vi.fn(),
  getDiaryTaxonomy: vi.fn(),
  listActiveCrops: vi.fn(),
  getDiaryCalendar: vi.fn(),
}));
vi.mock('../api/farmDiary', () => diaryApi);

import { CropDiaryEntriesScreen } from '../screens/farm/diary/CropDiaryEntriesScreen';
import { t } from '../../../i18n/farmer';

/** Every string rendered anywhere in the tree, in order. */
function renderedText(
  node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null,
): string[] {
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
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  return tree;
}

function textOf(tree: renderer.ReactTestRenderer): string {
  return renderedText(tree.toJSON()).join('\n');
}

const CROP_ID = '11111111-1111-4111-8111-111111111111';

const crop = {
  id: CROP_ID,
  name: 'Beetroot',
  variety: 'Detroit',
  cropType: 'custom' as const,
  zone: 'Upper Field',
  zoneShort: 'Upper',
  area: '1 ac',
  daysOld: 20,
  statusType: 'growing' as const,
  statusDays: null,
  statusText: 'Growing',
  accentColor: 'transparent',
};

const TAXONOMY = {
  categories: [
    {
      key: 'weed_mgmt',
      name: 'Weed Management',
      nameTa: null,
      iconKey: 'shield',
      sortOrder: 5,
      isActive: true,
      subActivities: [
        {
          key: 'hand_weeding',
          categoryKey: 'weed_mgmt',
          name: 'Hand weeding',
          nameTa: null,
          sortOrder: 1,
          isActive: true,
        },
      ],
    },
  ],
};

function entry(over: Partial<DiaryEntrySummary> = {}): DiaryEntrySummary {
  return {
    id: 'e1',
    plotId: 'p1',
    farmCropId: CROP_ID,
    categoryKey: 'weed_mgmt',
    subActivityKey: 'hand_weeding',
    minutes: 75,
    notes: 'Cleared the north row',
    activityOn: '2026-07-15',
    loggedAt: '2026-07-15T06:45:00.000Z',
    totalLabourCostPaise: 0,
    createdAt: '2026-07-15T06:45:00.000Z',
    updatedAt: null,
    workerCount: 0,
    photoCount: 0,
    ...over,
  };
}

/** The strings the screen used to invent in place of the farmer's own log. */
const FIXTURE_STRINGS = [
  'North row cleared',
  'FYM, 40kg',
  'Drip line, 30 mins',
  'Minor aphids found',
  'South quadrant regular cycle',
  'Panchagavya organic spray',
  'Deep root watering',
  'Bio-stimulant foliar spray',
  'Nantes',
  'Zone 1',
];

beforeEach(() => {
  vi.clearAllMocks();
  diaryApi.listDiaryPlots.mockResolvedValue([{ id: 'p1', name: 'Upper Field', areaAcres: 1 }]);
  diaryApi.getDiaryTaxonomy.mockResolvedValue(TAXONOMY);
});

describe('CropDiaryEntriesScreen reads the real diary endpoint', () => {
  it('renders the entries the server returned, and nothing it did not', async () => {
    diaryApi.listDiaryEntries.mockResolvedValue({
      items: [entry()],
      page: { nextCursor: null, hasMore: false },
    });

    const tree = await mount(<CropDiaryEntriesScreen crop={crop} />);
    const text = textOf(tree);

    expect(diaryApi.listDiaryEntries).toHaveBeenCalled();
    expect(text).toContain('Hand weeding');
    expect(text).toContain('Cleared the north row');
    expect(text).toContain('1h 15m');
    // The "Entries Logged" stat is the real count, not the hardcoded 14.
    expect(text).toContain('1');
    expect(text).not.toContain('14');
    for (const fake of FIXTURE_STRINGS) expect(text).not.toContain(fake);
  });

  it('only shows entries logged against this crop', async () => {
    diaryApi.listDiaryEntries.mockResolvedValue({
      items: [
        entry(),
        entry({
          id: 'e2',
          farmCropId: '22222222-2222-4222-8222-222222222222',
          notes: 'Another crop entirely',
        }),
      ],
      page: { nextCursor: null, hasMore: false },
    });

    const text = textOf(await mount(<CropDiaryEntriesScreen crop={crop} />));
    expect(text).toContain('Cleared the north row');
    expect(text).not.toContain('Another crop entirely');
  });

  it('shows an em-dash for a note the entry does not have', async () => {
    diaryApi.listDiaryEntries.mockResolvedValue({
      items: [entry({ notes: null })],
      page: { nextCursor: null, hasMore: false },
    });

    const text = textOf(await mount(<CropDiaryEntriesScreen crop={crop} />));
    expect(text).toContain('—');
    for (const fake of FIXTURE_STRINGS) expect(text).not.toContain(fake);
  });

  it('shows the empty state, not the six fixture rows, when there are no entries', async () => {
    diaryApi.listDiaryEntries.mockResolvedValue({
      items: [],
      page: { nextCursor: null, hasMore: false },
    });

    const text = textOf(await mount(<CropDiaryEntriesScreen crop={crop} />));
    expect(text).toContain(t('farmer.farmDiary.list.emptyTitle'));
    expect(text).toContain(t('farmer.cropDiary.emptySubtitle'));
    for (const fake of FIXTURE_STRINGS) expect(text).not.toContain(fake);
  });

  it('shows the error with a retry, not invented entries, when the load fails', async () => {
    diaryApi.listDiaryEntries.mockRejectedValue(new Error('network down'));

    const text = textOf(await mount(<CropDiaryEntriesScreen crop={crop} />));
    expect(text).toContain(t('farmer.common.retry'));
    expect(text).not.toContain(t('farmer.farmDiary.list.emptyTitle'));
    for (const fake of FIXTURE_STRINGS) expect(text).not.toContain(fake);
  });
});

describe('CropDiaryEntriesScreen source guard', () => {
  const source = readFileSync(
    path.join(__dirname, '../screens/farm/diary/CropDiaryEntriesScreen.tsx'),
    'utf8',
  );

  it('has no INITIAL_DIARY_ENTRIES fixture and no invented defaults', () => {
    expect(source).not.toContain('INITIAL_DIARY_ENTRIES');
    expect(source).not.toContain('Nantes');
  });
});
