/**
 * Input Management (FR-F05) used to render a hard-coded RECENT_APPLICATIONS
 * list ("Vermicompost · Carrot — ₹720", ...) and two literal reminder cards
 * ("Fertigation due — Carrot · overdue 1 day", "Pest check due — Tomato").
 * These tests pin it to the real backend:
 *   GET /farmers/me/diary/plots + GET /farmers/me/plots/:plotId/crops   (active crops, to name pest logs)
 *   GET /farmers/me/crop-inputs?limit=                                  (BR-56h farm-wide crop inputs, ONE call)
 *   GET /farms, GET /farms/:farmId/plots                                 (zones for pest data)
 *   GET /farms/:farmId/plots/:plotId/pest-treatment-logs                 (Pest Mgmt "Log now" writes here)
 *   GET /farms/:farmId/plots/:plotId/pest-treatment-reminders            (farmer-typed reminders, BR-38)
 *
 * There is no fertigation schedule/reminder source anywhere in the API, so the
 * old "Fertigation due" card must not be fabricated (BR-38: nothing invents
 * reminders on the farmer's behalf).
 *
 * The react-native / @tohfa/mobile-ui mocks provide only what the screen and
 * its data module actually import (no StatusBar: the screen uses ScreenStatusBar).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';

vi.mock('react-native', () => ({
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
  RefreshControl: 'RefreshControl',
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
}));

vi.mock('@tohfa/mobile-ui', () => ({
  EmptyState: 'EmptyState',
  ErrorState: 'ErrorState',
  ScreenStatusBar: 'ScreenStatusBar',
  Skeleton: 'Skeleton',
}));

const apiGet = vi.hoisted(() => vi.fn());
vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, api: { get: apiGet } };
});

import { InputManagementScreen } from '../screens/farm/crops/InputManagementScreen';
import { addDaysIso, todayInKolkata } from '../screens/certifications/certificationForm';
import { t } from '../../../i18n/farmer';
import { authPalette as P } from '../theme';
import errorsEn from '../../../i18n/errors.en.json';
import errorsTa from '../../../i18n/errors.ta.json';
import farmerEn from '../../../i18n/farmer.en.json';
import farmerTa from '../../../i18n/farmer.ta.json';

const FARM = 'f0000000-0000-4000-8000-000000000001';
const PLOT1 = 'p0000000-0000-4000-8000-000000000001';
const PLOT2 = 'p0000000-0000-4000-8000-000000000002';
const CARROT = 'c0000000-0000-4000-8000-000000000001';
const CABBAGE = 'c0000000-0000-4000-8000-000000000002';
/** A crop that is already HARVESTED: not in the active-crop list, but its inputs are still history. */
const BEETROOT = 'c0000000-0000-4000-8000-000000000003';

/** What the farm-wide endpoint joins on (crop_master.name, plots.name). */
const CROP_PLOT: Record<string, { cropName: string; plotName: string }> = {
  [CARROT]: { cropName: 'Carrot', plotName: 'Zone 1 — Upper Field' },
  [CABBAGE]: { cropName: 'Cabbage', plotName: 'Zone 2 — Lower Slope' },
  [BEETROOT]: { cropName: 'Beetroot', plotName: 'Zone 1 — Upper Field' },
};

function farmCrop(id: string, plotId: string, cropName: string): unknown {
  return {
    id,
    plotId,
    cropMasterId: 'm0000000-0000-4000-8000-000000000001',
    cropName,
    cropNameTa: null,
    cropIconKey: null,
    status: 'GROWING',
    plantedOn: '2026-05-01',
    expectedHarvestOn: null,
    actualHarvestOn: null,
    expectedYieldKg: null,
    actualYieldKg: null,
    seedVariety: null,
    seedCompany: null,
    seedQuantity: null,
    seedQuantityUnit: null,
    seedCostPaise: null,
    expectedGrade: null,
    notes: null,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: null,
  };
}

function cropInput(
  id: string,
  farmCropId: string,
  inputType: string,
  inputName: string,
  appliedOn: string,
  costInr: string | null,
): unknown {
  return {
    id,
    farmerId: 'farmer-1',
    farmCropId,
    inputType,
    inputName,
    appliedOn,
    quantity: 4,
    unit: 'KG',
    nitrogenPct: null,
    phosphorusPct: null,
    potassiumPct: null,
    applicationMethod: null,
    costInr,
    notes: null,
    createdAt: `${appliedOn}T06:00:00.000Z`,
    updatedAt: null,
  };
}

function pestLog(id: string, plotId: string, farmCropId: string | null, treatment: string, appliedOn: string): unknown {
  return {
    id,
    plotId,
    farmCropId,
    detectionId: null,
    pestLibraryId: null,
    pestName: 'Powdery Mildew',
    category: 'Disease',
    severity: 'Low',
    treatment,
    intervalDays: 12,
    phiDays: 5,
    appliedOn,
    nextApplicationDate: null,
    photoUploadId: null,
    createdAt: `${appliedOn}T07:00:00.000Z`,
    updatedAt: null,
  };
}

function reminder(id: string, plotId: string, title: string, dueDate: string, status = 'Upcoming'): unknown {
  return {
    id,
    plotId,
    detectionId: null,
    title,
    targetPest: 'Aphids',
    dueDate,
    repeatInterval: 'ONE_TIME',
    status,
    completedAt: null,
    notes: null,
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: null,
  };
}

interface Fixture {
  carrotInputs: unknown[];
  cabbageInputs: unknown[];
  beetrootInputs: unknown[];
  plot1Logs: unknown[];
  plot2Logs: unknown[];
  plot1Reminders: unknown[];
  plot2Reminders: unknown[];
  fail: boolean;
  pending: boolean;
  /** A plot whose pest-treatment logs and reminders requests fail (one zone down). */
  failPestPlot: string | null;
}

let fx: Fixture;

function defaultFixture(): Fixture {
  return {
    carrotInputs: [
      cropInput('i-verm', CARROT, 'MANURE', 'Vermicompost', '2026-07-12', '720.00'),
      cropInput('i-panch', CARROT, 'BIO_INPUT', 'Panchagavya', '2026-06-28', '1234567.89'),
    ],
    cabbageInputs: [cropInput('i-neem', CABBAGE, 'PESTICIDE', 'Neem oil spray', '2026-07-08', '0.30')],
    beetrootInputs: [],
    plot1Logs: [],
    plot2Logs: [pestLog('l-sulphur', PLOT2, CABBAGE, 'Wettable Sulphur', '2026-07-10')],
    plot1Reminders: [],
    plot2Reminders: [],
    fail: false,
    pending: false,
    failPestPlot: null,
  };
}

type InputRow = { id: string; farmCropId: string; appliedOn: string; createdAt: string };

/**
 * Plays GET /farmers/me/crop-inputs as the server does (BR-56h): every own crop,
 * newest appliedOn first, ties by createdAt then id, `limit` per page, an opaque
 * cursor (here: the next index), each row carrying cropName and plotName.
 */
function farmWideInputs(p: string): Promise<unknown> {
  const url = new URL(`http://x${p}`);
  const limit = Number(url.searchParams.get('limit') ?? '20');
  const start = Number(url.searchParams.get('cursor') ?? '0');
  const all = ([...fx.carrotInputs, ...fx.cabbageInputs, ...fx.beetrootInputs] as InputRow[])
    .slice()
    .sort((a, b) =>
      a.appliedOn !== b.appliedOn
        ? b.appliedOn.localeCompare(a.appliedOn)
        : a.createdAt !== b.createdAt
          ? b.createdAt.localeCompare(a.createdAt)
          : b.id.localeCompare(a.id),
    )
    .map((row) => ({ ...row, ...CROP_PLOT[row.farmCropId] }));
  const items = all.slice(start, start + limit);
  const next = start + limit < all.length ? String(start + limit) : null;
  return Promise.resolve({ items, page: { nextCursor: next, hasMore: next !== null } });
}

function route(p: string): Promise<unknown> {
  if (fx.pending) return new Promise(() => undefined);
  if (fx.fail) return Promise.reject(new Error('boom'));
  if (fx.failPestPlot !== null && p.includes(`/plots/${fx.failPestPlot}/pest-treatment-`)) {
    return Promise.reject(new Error('zone down'));
  }
  const items = (list: unknown[]) => Promise.resolve({ items: list, page: { nextCursor: null, hasMore: false } });
  if (p === '/farmers/me/diary/plots') {
    return Promise.resolve({
      items: [
        { id: PLOT1, name: 'Zone 1 — Upper Field', areaAcres: 1 },
        { id: PLOT2, name: 'Zone 2 — Lower Slope', areaAcres: 1 },
      ],
    });
  }
  if (p.startsWith(`/farmers/me/plots/${PLOT1}/crops`)) {
    return items(p.includes('status=GROWING') ? [farmCrop(CARROT, PLOT1, 'Carrot')] : []);
  }
  if (p.startsWith(`/farmers/me/plots/${PLOT2}/crops`)) {
    return items(p.includes('status=GROWING') ? [farmCrop(CABBAGE, PLOT2, 'Cabbage')] : []);
  }
  // No per-crop /farmers/me/crops/:id/inputs route here: a per-crop fan-out is a test failure.
  if (p === '/farmers/me/crop-inputs' || p.startsWith('/farmers/me/crop-inputs?')) return farmWideInputs(p);
  if (p === '/farms') return Promise.resolve({ items: [{ id: FARM, name: 'Green Acres' }] });
  if (p === `/farms/${FARM}/plots`) {
    return Promise.resolve({
      items: [
        { id: PLOT1, farmId: FARM, name: 'Zone 1 — Upper Field' },
        { id: PLOT2, farmId: FARM, name: 'Zone 2 — Lower Slope' },
      ],
    });
  }
  if (p === `/farms/${FARM}/plots/${PLOT1}/pest-treatment-logs`) return Promise.resolve({ items: fx.plot1Logs });
  if (p === `/farms/${FARM}/plots/${PLOT2}/pest-treatment-logs`) return Promise.resolve({ items: fx.plot2Logs });
  if (p === `/farms/${FARM}/plots/${PLOT1}/pest-treatment-reminders`) return Promise.resolve({ items: fx.plot1Reminders });
  if (p === `/farms/${FARM}/plots/${PLOT2}/pest-treatment-reminders`) return Promise.resolve({ items: fx.plot2Reminders });
  return Promise.reject(new Error(`unexpected path ${p}`));
}

function renderedText(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(renderedText);
  return (node.children ?? []).flatMap(renderedText);
}

function textOf(tree: renderer.ReactTestRenderer): string {
  return renderedText(tree.toJSON()).join('');
}

/** Joined text of the <Text> carrying `testID`, nested <Text> children included. */
function textById(tree: renderer.ReactTestRenderer, testID: string): string {
  const node = tree.root.findByProps({ testID });
  const flat = (v: unknown): string => {
    if (Array.isArray(v)) return v.map(flat).join('');
    if (typeof v === 'string' || typeof v === 'number') return String(v);
    if (React.isValidElement(v)) return flat((v.props as { children?: unknown }).children);
    return '';
  };
  return flat(node.props.children);
}

async function settle(): Promise<void> {
  for (let i = 0; i < 3; i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

interface MountProps {
  onNavigateToLogFertigation?: (crop?: unknown) => void;
  onNavigateToLogPestTreatment?: (crop?: unknown, context?: unknown) => void;
  onNavigateToFullHistory?: () => void;
}

async function mount(props: MountProps = {}): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<InputManagementScreen onBack={() => undefined} {...props} />);
  });
  await settle();
  return tree;
}

async function press(tree: renderer.ReactTestRenderer, testID: string): Promise<void> {
  const node = tree.root.findByProps({ testID });
  await act(async () => {
    (node.props as { onPress: () => void }).onPress();
  });
  await settle();
}

function inputCalls(): string[] {
  return apiGet.mock.calls.map((c) => c[0] as string).filter((p) => p.includes('/inputs') || p.includes('/crop-inputs'));
}

function appRowIds(tree: renderer.ReactTestRenderer): string[] {
  return tree.root
    .findAll((n) => typeof n.props.testID === 'string' && /^inputMgmt\.app\.[^.]+:[^.]+$/.test(n.props.testID))
    .map((n) => n.props.testID as string);
}

beforeEach(() => {
  apiGet.mockReset();
  fx = defaultFixture();
  apiGet.mockImplementation((p: string) => route(p));
});

describe('InputManagementScreen — Dev copy and layout are unchanged', () => {
  it('renders the Dev header, action cards and section copy exactly (line break included)', async () => {
    const tree = await mount();
    const text = textOf(tree);
    for (const s of [
      'FR-F05',
      'Input Management',
      'Fertigation & pest treatments',
      'Fertigation',
      'Log a nutrient\napplication',
      'Pest Mgmt',
      'Log a pest treatment',
      'Log now',
      'UPCOMING REMINDERS',
      'RECENT APPLICATIONS',
      'Full history',
      'View full history',
    ]) {
      expect(text, s).toContain(s);
    }
    expect(tree.root.findByProps({ testID: 'inputMgmt.logFertigation' }).props.accessibilityLabel).toBe(
      'Fertigation, Log a nutrient application',
    );
    expect(tree.root.findByProps({ testID: 'inputMgmt.logPest' }).props.accessibilityLabel).toBe(
      'Pest Mgmt, Log a pest treatment',
    );
    expect(tree.root.findByProps({ testID: 'inputMgmt.back' }).props.accessibilityLabel).toBe('Go back');
  });

  it('keeps every Dev style value (back button 42, card radius 18, minHeight 145, icon circle 38, lineHeight 16)', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../screens/farm/crops/InputManagementScreen.tsx'),
      'utf8',
    ).replace(/\r\n/g, '\n');
    expect(source).toMatch(/backButton: \{\n\s+width: 42,\n\s+height: 42,\n\s+borderRadius: 21,/);
    expect(source).toMatch(/topCard: \{\n\s+flex: 1,\n\s+borderRadius: 18,\n\s+padding: 16,\n\s+minHeight: 145,/);
    expect(source).toMatch(/cardIconCircle: \{\n\s+width: 38,\n\s+height: 38,/);
    expect(source).toMatch(/cardSubtitle: \{\n\s+fontSize: typography.bodySmall,\n\s+lineHeight: 16,/);
    expect(source).toMatch(/recentListCard: \{\n\s+backgroundColor: P.white,\n\s+borderRadius: 18,/);
    expect(source).not.toContain('absoluteFillObject');
    expect(source).not.toMatch(/<StatusBar\b/);
  });
});

describe('InputManagementScreen — recent applications (BR-56)', () => {
  it('shows a loading state and none of the old hard-coded rows while loading', async () => {
    fx.pending = true;
    const tree = await mount();
    expect(tree.root.findAllByProps({ testID: 'inputMgmt.loading' }).length).toBe(1);
    const text = textOf(tree);
    expect(text).not.toContain('Trichoderma');
    expect(text).not.toContain('Bone meal');
    expect(text).not.toContain('₹720');
  });

  it('BR-56: maps crop inputs and pest treatment logs into one newest-first list (name, crop, date, type, icon)', async () => {
    const tree = await mount();
    const text = textOf(tree);
    expect(text).not.toContain('Trichoderma');
    expect(text).not.toContain('Bone meal');

    // ONE farm-wide request (BR-56h) for the first page, never a per-crop fan-out.
    expect(inputCalls()).toEqual(['/farmers/me/crop-inputs?limit=5']);

    expect(appRowIds(tree)).toEqual([
      'inputMgmt.app.cropInput:i-verm',
      'inputMgmt.app.pestLog:l-sulphur',
      'inputMgmt.app.cropInput:i-neem',
      'inputMgmt.app.cropInput:i-panch',
    ]);

    expect(textById(tree, 'inputMgmt.app.cropInput:i-verm.title')).toBe('Vermicompost · Carrot');
    expect(textById(tree, 'inputMgmt.app.cropInput:i-verm.subtitle')).toBe(
      `12 ${t('farmer.audits.monthShort.jul')} · ${t('farmer.inputManagement.type.fertigation')}`,
    );
    // PESTICIDE crop inputs and pest treatment logs are both "Pest treatment" (Dev's category copy).
    expect(textById(tree, 'inputMgmt.app.cropInput:i-neem.subtitle')).toBe('8 Jul · Pest treatment');
    expect(textById(tree, 'inputMgmt.app.pestLog:l-sulphur.title')).toBe('Wettable Sulphur · Cabbage');
    expect(textById(tree, 'inputMgmt.app.pestLog:l-sulphur.subtitle')).toBe('10 Jul · Pest treatment');

    // Icon picked from the API's inputType.
    expect(tree.root.findAllByProps({ testID: 'inputMgmt.app.cropInput:i-verm.icon.organic' }).length).toBe(1);
    expect(tree.root.findAllByProps({ testID: 'inputMgmt.app.cropInput:i-panch.icon.leaf' }).length).toBe(1);
    expect(tree.root.findAllByProps({ testID: 'inputMgmt.app.cropInput:i-neem.icon.pest' }).length).toBe(1);
    expect(tree.root.findAllByProps({ testID: 'inputMgmt.app.pestLog:l-sulphur.icon.pest' }).length).toBe(1);
  });

  it('BR-56f: renders costInr exactly via Money (integer paise) — no float drift, Indian grouping', async () => {
    const tree = await mount();
    expect(textById(tree, 'inputMgmt.app.cropInput:i-verm.cost')).toBe('₹720.00');
    expect(textById(tree, 'inputMgmt.app.cropInput:i-neem.cost')).toBe('₹0.30');
    expect(textById(tree, 'inputMgmt.app.cropInput:i-panch.cost')).toBe('₹12,34,567.89');
    // A pest treatment log has no cost field in the API; it is not invented.
    expect(textById(tree, 'inputMgmt.app.pestLog:l-sulphur.cost')).toBe(t('farmer.inputManagement.noCost'));
  });

  it('BR-56f: a missing or malformed costInr renders the no-cost placeholder, never NaN', async () => {
    fx.carrotInputs = [
      cropInput('i-null', CARROT, 'FERTILIZER', 'Bone meal', '2026-07-01', null),
      cropInput('i-bad', CARROT, 'OTHER', 'Mystery', '2026-06-30', '12.345'),
    ];
    const tree = await mount();
    expect(textById(tree, 'inputMgmt.app.cropInput:i-null.cost')).toBe(t('farmer.inputManagement.noCost'));
    expect(textById(tree, 'inputMgmt.app.cropInput:i-bad.cost')).toBe(t('farmer.inputManagement.noCost'));
    expect(textOf(tree)).not.toContain('NaN');
    expect(tree.root.findAllByProps({ testID: 'inputMgmt.app.cropInput:i-null.icon.flask' }).length).toBe(1);
    expect(tree.root.findAllByProps({ testID: 'inputMgmt.app.cropInput:i-bad.icon.seedling' }).length).toBe(1);
  });

  it('shows only the 5 newest applications', async () => {
    fx.carrotInputs = ['01', '02', '03', '04', '05', '06'].map((d) =>
      cropInput(`i-${d}`, CARROT, 'MANURE', `Input ${d}`, `2026-07-${d}`, '10.00'),
    );
    fx.cabbageInputs = [];
    fx.plot2Logs = [];
    const tree = await mount();
    // The server is asked for exactly the 5 rows the section shows.
    expect(inputCalls()).toEqual(['/farmers/me/crop-inputs?limit=5']);
    expect(appRowIds(tree).length).toBe(5);
    expect(tree.root.findAllByProps({ testID: 'inputMgmt.app.cropInput:i-06' }).length).toBe(1);
    expect(tree.root.findAllByProps({ testID: 'inputMgmt.app.cropInput:i-02' }).length).toBe(1);
    expect(tree.root.findAllByProps({ testID: 'inputMgmt.app.cropInput:i-01' }).length).toBe(0);
  });

  it('BR-56h: an input on a HARVESTED crop (no longer in the active list) still shows, named from the endpoint', async () => {
    fx.beetrootInputs = [cropInput('i-beet', BEETROOT, 'MANURE', 'Farmyard manure', '2026-07-15', '80.00')];
    const tree = await mount();
    expect(textById(tree, 'inputMgmt.app.cropInput:i-beet.title')).toBe('Farmyard manure · Beetroot');
    expect(textById(tree, 'inputMgmt.app.cropInput:i-beet.cost')).toBe('₹80.00');
    expect(appRowIds(tree)[0]).toBe('inputMgmt.app.cropInput:i-beet');
    expect(inputCalls().some((p) => p.includes(`/crops/${BEETROOT}/`))).toBe(false);
  });

  it('shows an empty state when nothing has been applied yet', async () => {
    fx.carrotInputs = [];
    fx.cabbageInputs = [];
    fx.plot2Logs = [];
    const tree = await mount();
    expect(tree.root.findAllByProps({ testID: 'inputMgmt.empty' }).length).toBe(1);
    const empty = tree.root.findByType('EmptyState' as unknown as React.ElementType);
    expect(empty.props.title).toBe(t('farmer.inputManagement.recent.empty'));
    expect(appRowIds(tree)).toEqual([]);
  });

  it('shows an error with Retry, and Retry refetches', async () => {
    fx.fail = true;
    const tree = await mount();
    const error = tree.root.findByType('ErrorState' as unknown as React.ElementType);
    expect(error.props.message).toBe(t('farmer.inputManagement.loadError'));
    expect(textOf(tree)).not.toContain('Vermicompost');

    fx.fail = false;
    const before = inputCalls().length;
    await act(async () => {
      (error.props as { onRetry: () => void }).onRetry();
    });
    await settle();
    expect(inputCalls().length).toBeGreaterThan(before);
    expect(tree.root.findAllByType('ErrorState' as unknown as React.ElementType).length).toBe(0);
    expect(textOf(tree)).toContain('Vermicompost');
  });

  it("one zone's pest data failing does not fail the screen: the rest shows, with a partial-data note", async () => {
    fx.failPestPlot = PLOT1;
    fx.plot2Reminders = [reminder('r-p2', PLOT2, 'Spray neem', addDaysIso(todayInKolkata(), 2))];
    const tree = await mount();

    expect(tree.root.findAllByType('ErrorState' as unknown as React.ElementType).length).toBe(0);
    // Crop inputs and the healthy zone's pest log and reminder are all still shown.
    expect(appRowIds(tree)).toEqual([
      'inputMgmt.app.cropInput:i-verm',
      'inputMgmt.app.pestLog:l-sulphur',
      'inputMgmt.app.cropInput:i-neem',
      'inputMgmt.app.cropInput:i-panch',
    ]);
    expect(tree.root.findAllByProps({ testID: 'inputMgmt.reminder.r-p2' }).length).toBe(1);
    // ...and the farmer is told some of it is missing.
    expect(textById(tree, 'inputMgmt.partial')).toBe(t('farmer.inputManagement.partial'));
  });

  it('shows no partial-data note when every zone loaded', async () => {
    const tree = await mount();
    expect(tree.root.findAllByProps({ testID: 'inputMgmt.partial' }).length).toBe(0);
  });

  it('passes the abort signal to GET /farms and GET /farms/:farmId/plots', async () => {
    await mount();
    const signalFor = (p: string) => apiGet.mock.calls.find((c) => c[0] === p)?.[1];
    expect(signalFor('/farms')).toBeInstanceOf(AbortSignal);
    expect(signalFor(`/farms/${FARM}/plots`)).toBeInstanceOf(AbortSignal);
  });

  it('pull-to-refresh refetches and keeps the list on screen', async () => {
    const tree = await mount();
    type RefreshProps = { refreshing: boolean; onRefresh: () => void };
    const refreshProps = (): RefreshProps => {
      const scroll = tree.root.find((n) => n.props.refreshControl !== undefined);
      return (scroll.props.refreshControl as React.ReactElement<RefreshProps>).props;
    };
    expect(refreshProps().refreshing).toBe(false);
    const before = inputCalls().length;

    fx.carrotInputs = [
      cropInput('i-new', CARROT, 'FERTILIZER', 'Bone meal', '2026-07-20', '525.00'),
      ...fx.carrotInputs,
    ];
    await act(async () => {
      refreshProps().onRefresh();
    });
    await settle();

    expect(inputCalls().length).toBe(before * 2);
    expect(refreshProps().refreshing).toBe(false);
    expect(textOf(tree)).toContain('Bone meal');
    expect(textOf(tree)).toContain('Vermicompost');
  });

  it('BR-56: after a fertigation is logged and the farmer returns, the list shows the new application', async () => {
    // App.tsx's LogFertigation onSave is goBack('InputManagement'), which
    // mounts this screen again — the fresh mount must refetch, not reuse data.
    const onNavigateToLogFertigation = vi.fn();
    const first = await mount({ onNavigateToLogFertigation });
    await press(first, 'inputMgmt.logFertigation');
    expect(onNavigateToLogFertigation).toHaveBeenCalledWith(null);
    act(() => first.unmount());

    // The POST from LogFertigationScreen landed server-side.
    fx.carrotInputs = [
      cropInput('i-logged', CARROT, 'MANURE', 'Jeevamrutha', '2026-07-21', '150.50'),
      ...fx.carrotInputs,
    ];
    const second = await mount();
    expect(textById(second, 'inputMgmt.app.cropInput:i-logged.title')).toBe('Jeevamrutha · Carrot');
    expect(textById(second, 'inputMgmt.app.cropInput:i-logged.cost')).toBe('₹150.50');
  });

  it('Full history and View full history both open the history screen', async () => {
    const onNavigateToFullHistory = vi.fn();
    const tree = await mount({ onNavigateToFullHistory });
    await press(tree, 'inputMgmt.fullHistoryLink');
    await press(tree, 'inputMgmt.viewFullHistory');
    expect(onNavigateToFullHistory).toHaveBeenCalledTimes(2);
  });
});

describe('InputManagementScreen — upcoming reminders (BR-38)', () => {
  it('BR-38: renders only farmer-created pest treatment reminders, soonest first, with zone and due label', async () => {
    const today = todayInKolkata();
    fx.plot2Reminders = [
      reminder('r-today', PLOT2, 'Spray neem', today),
      reminder('r-late', PLOT2, 'Re-check for aphids', addDaysIso(today, -1)),
      reminder('r-done', PLOT2, 'Old check', addDaysIso(today, -10), 'Completed'),
    ];
    fx.plot1Reminders = [reminder('r-later', PLOT1, 'Inspect leaves', addDaysIso(today, 3))];
    const tree = await mount();

    const cards = tree.root
      .findAll((n) => typeof n.props.testID === 'string' && /^inputMgmt\.reminder\.r-[a-z]+$/.test(n.props.testID))
      .map((n) => n.props.testID as string);
    expect(cards).toEqual(['inputMgmt.reminder.r-late', 'inputMgmt.reminder.r-today', 'inputMgmt.reminder.r-later']);

    expect(textById(tree, 'inputMgmt.reminder.r-late.title')).toBe(
      t('farmer.inputManagement.reminder.pestTitle', { title: 'Re-check for aphids' }),
    );
    // Overdue: Dev's orange line with the bold overdue span; otherwise Dev's grey line.
    expect(textById(tree, 'inputMgmt.reminder.r-late.zone')).toBe('Zone 2 — Lower Slope · overdue 1 day');
    expect(tree.root.findByProps({ testID: 'inputMgmt.reminder.r-late.zone' }).props.style.color).toBe(P.twOrange700);
    expect(textById(tree, 'inputMgmt.reminder.r-today.zone')).toBe('Zone 2 — Lower Slope · due today');
    expect(tree.root.findByProps({ testID: 'inputMgmt.reminder.r-today.zone' }).props.style.color).toBe(P.twGray500);
    expect(textById(tree, 'inputMgmt.reminder.r-later.zone')).toBe(
      `Zone 1 — Upper Field · ${t('farmer.inputManagement.reminder.dueInDays', { count: 3 })}`,
    );

    // The old literal cards are gone.
    const text = textOf(tree);
    expect(text).not.toContain('Fertigation due — Carrot');
    expect(text).not.toContain('Pest check due — Tomato');
  });

  it('BR-38: no fertigation reminder is fabricated; the screen says that source is not available', async () => {
    const tree = await mount();
    expect(tree.root.findAllByProps({ testID: 'inputMgmt.reminders.fertigationUnavailable' }).length).toBe(1);
    expect(textOf(tree)).toContain(t('farmer.inputManagement.reminders.fertigationUnavailable'));
    expect(tree.root.findAllByProps({ testID: 'inputMgmt.reminders.empty' }).length).toBe(1);
  });

  it("'Log now' on a pest reminder opens Log Pest Treatment with the reminder's farm and zone", async () => {
    fx.plot2Reminders = [reminder('r-late', PLOT2, 'Re-check for aphids', addDaysIso(todayInKolkata(), -2))];
    const onNavigateToLogPestTreatment = vi.fn();
    const tree = await mount({ onNavigateToLogPestTreatment });
    expect(textById(tree, 'inputMgmt.reminder.r-late.zone')).toBe(
      `Zone 2 — Lower Slope · ${t('farmer.inputManagement.reminder.overdueDays', { count: 2 })}`,
    );
    await press(tree, 'inputMgmt.reminder.r-late.logNow');
    expect(onNavigateToLogPestTreatment).toHaveBeenCalledWith(null, { farmId: FARM, plotId: PLOT2 });
  });
});

describe('InputManagementScreen i18n', () => {
  it('every literal t() key on the screen and its data module exists in both en and ta', () => {
    const en: Record<string, string> = { ...errorsEn, ...farmerEn };
    const ta: Record<string, string> = { ...errorsTa, ...farmerTa };
    const files = ['../screens/farm/crops/InputManagementScreen.tsx', '../screens/farm/crops/inputApplications.ts'];
    const keys = new Set<string>();
    for (const f of files) {
      const source = fs.readFileSync(path.resolve(__dirname, f), 'utf8');
      for (const m of source.matchAll(/\bt\(\s*(['"])([A-Za-z0-9_.-]+)\1/g)) keys.add(m[2]!);
    }
    expect(keys.size).toBeGreaterThan(10);
    for (const key of keys) {
      expect(en[key], `en ${key}`).toBeTruthy();
      expect(ta[key], `ta ${key}`).toBeTruthy();
    }
  });

  it('the screen has no hard-coded user-facing English left', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../screens/farm/crops/InputManagementScreen.tsx'),
      'utf8',
    ).replace(/\r\n/g, '\n');
    for (const literal of ['RECENT APPLICATIONS', 'Full history', 'View full history', 'Log now', 'UPCOMING REMINDERS', 'Fertigation & pest treatments']) {
      expect(source, literal).not.toContain(`>${literal}<`);
      expect(source, literal).not.toContain(`"${literal}"`);
    }
    expect(source).not.toContain('RECENT_APPLICATIONS');
  });
});
