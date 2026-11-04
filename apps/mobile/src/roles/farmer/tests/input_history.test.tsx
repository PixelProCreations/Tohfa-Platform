/**
 * "Inputs Applied" (CropInputsAppliedScreen) is both Input Management's
 * "Full history" target and Crop Detail's per-crop inputs list. It used to
 * render a hard-coded INITIAL_INPUTS list with a fudged "+ 2" fertigation
 * count. These tests pin it to the real BR-56 list endpoints, walking the
 * cursor (`page.nextCursor` / `hasMore`) to the end so counts are exact:
 *  - per crop: GET /farmers/me/crops/:farmCropId/inputs
 *  - farm-wide ("Full history", crop = null): GET /farmers/me/crop-inputs
 *    (BR-56h, every own crop including harvested ones) merged with each zone's
 *    pest treatment logs.
 *
 * The Dev design is kept: name, date subtitle, type tag and the QUANTITY
 * column ("4 kg"); a pest treatment log has no quantity in the API, so it
 * shows the placeholder instead of an invented amount.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import * as fs from 'node:fs';
import * as path from 'node:path';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';

vi.mock('react-native', () => ({
  Alert: { alert: () => undefined },
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
  Path: 'Path',
}));

vi.mock('@tohfa/mobile-ui', () => ({
  Button: 'Button',
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

import { CropInputsAppliedScreen } from '../screens/farm/crops/CropInputsAppliedScreen';
import type { CropItem } from '../screens/farm/crops/cropItems';
import { t } from '../../../i18n/farmer';
import errorsEn from '../../../i18n/errors.en.json';
import errorsTa from '../../../i18n/errors.ta.json';
import farmerEn from '../../../i18n/farmer.en.json';
import farmerTa from '../../../i18n/farmer.ta.json';

const FARM = 'f0000000-0000-4000-8000-000000000001';
const PLOT1 = 'p0000000-0000-4000-8000-000000000001';
const CARROT = 'c0000000-0000-4000-8000-000000000001';
/** A HARVESTED crop: absent from the active-crop list, but its inputs are history. */
const BEETROOT = 'c0000000-0000-4000-8000-000000000003';

const CARROT_ITEM: CropItem = {
  id: CARROT,
  name: 'Carrot',
  variety: 'Nantes',
  cropType: 'carrot',
  zone: 'Zone 1 — Upper Field',
  zoneShort: 'Zone 1',
  area: '',
  daysOld: null,
  statusType: 'growing',
  statusDays: null,
  statusText: '',
  accentColor: '',
};

function cropInput(
  id: string,
  inputType: string,
  inputName: string,
  appliedOn: string,
  costInr: string | null,
  farmCropId: string = CARROT,
  quantity = 4,
  unit = 'KG',
): unknown {
  return {
    id,
    farmerId: 'farmer-1',
    farmCropId,
    inputType,
    inputName,
    appliedOn,
    quantity,
    unit,
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

/** 25 carrot inputs served 10 per page, newest first, as the repo orders them. */
function allCarrotInputs(): unknown[] {
  return Array.from({ length: 25 }, (_, i) => {
    const day = String(25 - i).padStart(2, '0');
    const pesticide = i % 5 === 0;
    return cropInput(`i-${day}`, pesticide ? 'PESTICIDE' : 'MANURE', `Input ${day}`, `2026-06-${day}`, '100.10');
  });
}

let carrotInputs: unknown[];
/** Inputs on the harvested BEETROOT crop; only the farm-wide endpoint can return these. */
let beetrootInputs: unknown[];
let fail: boolean;
let pending: boolean;

const CROP_PLOT: Record<string, { cropName: string; plotName: string }> = {
  [CARROT]: { cropName: 'Carrot', plotName: 'Zone 1 — Upper Field' },
  [BEETROOT]: { cropName: 'Beetroot', plotName: 'Zone 1 — Upper Field' },
};

/** Serves `rows` 10 per page whatever `limit` asks for, so the client must walk the cursor. */
function paged(p: string, rows: unknown[]): Promise<unknown> {
  const url = new URL(`http://x${p}`);
  const cursor = url.searchParams.get('cursor');
  const start = cursor === null ? 0 : Number(cursor);
  const pageSize = 10;
  const slice = rows.slice(start, start + pageSize);
  const next = start + pageSize < rows.length ? String(start + pageSize) : null;
  return Promise.resolve({ items: slice, page: { nextCursor: next, hasMore: next !== null } });
}

type InputRow = { id: string; farmCropId: string; appliedOn: string; createdAt: string };

function route(p: string): Promise<unknown> {
  if (pending) return new Promise(() => undefined);
  if (fail) return Promise.reject(new Error('boom'));
  if (p.startsWith(`/farmers/me/crops/${CARROT}/inputs`)) return paged(p, carrotInputs);
  if (p === '/farmers/me/crop-inputs' || p.startsWith('/farmers/me/crop-inputs?')) {
    // BR-56h order: appliedOn desc, createdAt desc, id desc; each row carries cropName/plotName.
    const all = ([...carrotInputs, ...beetrootInputs] as InputRow[])
      .slice()
      .sort((a, b) =>
        a.appliedOn !== b.appliedOn
          ? b.appliedOn.localeCompare(a.appliedOn)
          : a.createdAt !== b.createdAt
            ? b.createdAt.localeCompare(a.createdAt)
            : b.id.localeCompare(a.id),
      )
      .map((row) => ({ ...row, ...CROP_PLOT[row.farmCropId] }));
    return paged(p, all);
  }
  if (p === '/farmers/me/diary/plots') {
    return Promise.resolve({ items: [{ id: PLOT1, name: 'Zone 1 — Upper Field', areaAcres: 1 }] });
  }
  if (p.startsWith(`/farmers/me/plots/${PLOT1}/crops`)) {
    const growing = p.includes('status=GROWING')
      ? [{ id: CARROT, plotId: PLOT1, cropName: 'Carrot', cropIconKey: null, status: 'GROWING' }]
      : [];
    return Promise.resolve({ items: growing, page: { nextCursor: null, hasMore: false } });
  }
  if (p === '/farms') return Promise.resolve({ items: [{ id: FARM, name: 'Green Acres' }] });
  if (p === `/farms/${FARM}/plots`) {
    return Promise.resolve({ items: [{ id: PLOT1, farmId: FARM, name: 'Zone 1 — Upper Field' }] });
  }
  if (p === `/farms/${FARM}/plots/${PLOT1}/pest-treatment-logs`) {
    return Promise.resolve({
      items: [
        {
          id: 'l-1',
          plotId: PLOT1,
          farmCropId: null,
          detectionId: null,
          pestLibraryId: null,
          pestName: 'Aphids',
          category: 'Pest',
          severity: 'Low',
          treatment: 'Agniastra',
          intervalDays: null,
          phiDays: null,
          appliedOn: '2026-06-30',
          nextApplicationDate: null,
          photoUploadId: null,
          createdAt: '2026-06-30T07:00:00.000Z',
          updatedAt: null,
        },
      ],
    });
  }
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

function textById(tree: renderer.ReactTestRenderer, testID: string): string {
  const node = tree.root.findByProps({ testID });
  const flat = (v: unknown): string =>
    Array.isArray(v) ? v.map(flat).join('') : typeof v === 'string' || typeof v === 'number' ? String(v) : '';
  return flat(node.props.children);
}

async function settle(): Promise<void> {
  for (let i = 0; i < 4; i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

async function mount(crop: CropItem | null): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<CropInputsAppliedScreen crop={crop} onBack={() => undefined} />);
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

function rowIds(tree: renderer.ReactTestRenderer): string[] {
  return tree.root
    .findAll((n) => typeof n.props.testID === 'string' && /^inputHistory\.row\.[^.]+:[^.]+$/.test(n.props.testID))
    .map((n) => n.props.testID as string);
}

beforeEach(() => {
  apiGet.mockReset();
  carrotInputs = allCarrotInputs();
  beetrootInputs = [];
  fail = false;
  pending = false;
  apiGet.mockImplementation((p: string) => route(p));
});

describe('CropInputsAppliedScreen — Dev copy and layout are unchanged', () => {
  it('renders the Dev header, stat labels, filter and tag copy exactly', async () => {
    const tree = await mount(CARROT_ITEM);
    const text = textOf(tree);
    for (const s of ['Inputs Applied', 'Carrot — Nantes · Zone 1', 'Fertigation Events', 'Pest Treatments']) {
      expect(text, s).toContain(s);
    }
    expect(textById(tree, 'inputHistory.filter.all.label')).toBe('All');
    expect(textById(tree, 'inputHistory.filter.fertigation.label')).toBe('Fertigation');
    expect(textById(tree, 'inputHistory.filter.pest.label')).toBe('Pest Treatment');
    expect(textById(tree, 'inputHistory.row.cropInput:i-25.tag')).toBe('Pest Treatment');
    expect(textById(tree, 'inputHistory.row.cropInput:i-24.tag')).toBe('Fertigation');
    expect(tree.root.findByProps({ testID: 'inputHistory.back' }).props.accessibilityLabel).toBe('Go back');
    expect(tree.root.findByProps({ testID: 'inputHistory.fab' }).props.accessibilityLabel).toBe('Add input applied');
  });

  it('keeps every Dev style value (back button 42/21, card radius 16, quantity column, no absoluteFillObject)', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../screens/farm/crops/CropInputsAppliedScreen.tsx'),
      'utf8',
    ).replace(/\r\n/g, '\n');
    expect(source).toMatch(/backButton: \{\n\s+width: 42,\n\s+height: 42,\n\s+borderRadius: 21,/);
    expect(source).toMatch(/inputCard: \{\n(?:.*\n){3}\s+borderRadius: 16,/);
    expect(source).toMatch(/statIconBadge: \{\n\s+width: 38,\n\s+height: 38,\n\s+borderRadius: 12,/);
    expect(source).toContain('inputQuantityText: {');
    expect(source).not.toContain('inputCostText');
    expect(source).not.toContain('absoluteFillObject');
    expect(source).not.toMatch(/<StatusBar\b/);
  });
});

describe('CropInputsAppliedScreen — per-crop history (BR-56)', () => {
  it('shows a loading state and placeholder counts while loading, never the old sample rows', async () => {
    pending = true;
    const tree = await mount(CARROT_ITEM);
    expect(tree.root.findAllByProps({ testID: 'inputHistory.loading' }).length).toBe(1);
    expect(textById(tree, 'inputHistory.count.fertigation')).toBe(t('farmer.inputHistory.placeholder'));
    expect(textById(tree, 'inputHistory.count.pest')).toBe(t('farmer.inputHistory.placeholder'));
    expect(textOf(tree)).not.toContain('Vermicompost Tea');
    expect(textOf(tree)).not.toContain('Neem Oil Concentrate');
  });

  it('BR-56: walks the inputs cursor to the end and counts fertigation vs pest treatments exactly', async () => {
    const tree = await mount(CARROT_ITEM);
    const calls = apiGet.mock.calls.map((c) => c[0] as string).filter((p) => p.includes('inputs'));
    expect(calls).toEqual([
      `/farmers/me/crops/${CARROT}/inputs?limit=100`,
      `/farmers/me/crops/${CARROT}/inputs?cursor=10&limit=100`,
      `/farmers/me/crops/${CARROT}/inputs?cursor=20&limit=100`,
    ]);
    // A per-crop view never reads the farm-wide list.
    expect(calls.some((p) => p.startsWith('/farmers/me/crop-inputs'))).toBe(false);
    // 25 inputs, every 5th is a PESTICIDE: 5 pest, 20 fertigation. No "+ 2" fudge.
    expect(textById(tree, 'inputHistory.count.fertigation')).toBe('20');
    expect(textById(tree, 'inputHistory.count.pest')).toBe('5');
    expect(textOf(tree)).not.toContain('Vermicompost Tea');
  });

  it('BR-56: a row shows the input name, the applied date and the real quantity with its unit', async () => {
    carrotInputs = [
      cropInput('i-tea', 'MANURE', 'Vermicompost Tea', '2026-07-14', null, CARROT, 4, 'LITRE'),
      cropInput('i-neem', 'PESTICIDE', 'Neem Oil Concentrate', '2026-07-11', null, CARROT, 200, 'ML'),
      cropInput('i-cake', 'FERTILIZER', 'Neem cake', '2026-07-09', null, CARROT, 1.5, 'KG'),
      cropInput('i-misc', 'OTHER', 'Misc', '2026-07-08', null, CARROT, 2, 'OTHER'),
    ];
    const tree = await mount(CARROT_ITEM);
    expect(textById(tree, 'inputHistory.row.cropInput:i-tea.title')).toBe('Vermicompost Tea');
    expect(textById(tree, 'inputHistory.row.cropInput:i-tea.subtitle')).toBe(`14 ${t('farmer.audits.monthShort.jul')}`);
    expect(textById(tree, 'inputHistory.row.cropInput:i-tea.quantity')).toBe('4 L');
    expect(textById(tree, 'inputHistory.row.cropInput:i-neem.quantity')).toBe('200 ml');
    expect(textById(tree, 'inputHistory.row.cropInput:i-cake.quantity')).toBe('1.5 kg');
    // An unspecified unit is not guessed: the number alone.
    expect(textById(tree, 'inputHistory.row.cropInput:i-misc.quantity')).toBe('2');
  });

  it('pages the list 20 rows at a time with Show more', async () => {
    const tree = await mount(CARROT_ITEM);
    expect(rowIds(tree).length).toBe(20);
    expect(rowIds(tree)[0]).toBe('inputHistory.row.cropInput:i-25');
    await press(tree, 'inputHistory.showMore');
    expect(rowIds(tree).length).toBe(25);
    expect(tree.root.findAllByProps({ testID: 'inputHistory.showMore' }).length).toBe(0);
  });

  it('filters by type', async () => {
    const tree = await mount(CARROT_ITEM);
    await press(tree, 'inputHistory.filter.pest');
    expect(rowIds(tree).length).toBe(5);
    await press(tree, 'inputHistory.filter.fertigation');
    expect(rowIds(tree).length).toBe(20);
    await press(tree, 'inputHistory.filter.all');
    expect(rowIds(tree).length).toBe(20);
  });

  it('shows an empty state for a crop with no inputs', async () => {
    carrotInputs = [];
    const tree = await mount(CARROT_ITEM);
    expect(tree.root.findAllByProps({ testID: 'inputHistory.empty' }).length).toBe(1);
    expect(tree.root.findByType('EmptyState' as unknown as React.ElementType).props.title).toBe(
      t('farmer.inputHistory.empty'),
    );
    expect(textById(tree, 'inputHistory.count.fertigation')).toBe('0');
  });

  it('shows an error with Retry, and Retry refetches', async () => {
    fail = true;
    const tree = await mount(CARROT_ITEM);
    const error = tree.root.findByType('ErrorState' as unknown as React.ElementType);
    expect(error.props.message).toBe(t('farmer.inputHistory.loadError'));
    expect(textById(tree, 'inputHistory.count.pest')).toBe(t('farmer.inputHistory.placeholder'));
    fail = false;
    await act(async () => {
      (error.props as { onRetry: () => void }).onRetry();
    });
    await settle();
    expect(rowIds(tree).length).toBe(20);
  });

  it('pull-to-refresh refetches', async () => {
    const tree = await mount(CARROT_ITEM);
    type RefreshProps = { refreshing: boolean; onRefresh: () => void };
    const scroll = tree.root.find((n) => n.props.refreshControl !== undefined);
    const before = apiGet.mock.calls.length;
    await act(async () => {
      (scroll.props.refreshControl as React.ReactElement<RefreshProps>).props.onRefresh();
    });
    await settle();
    expect(apiGet.mock.calls.length).toBe(before * 2);
    expect(rowIds(tree).length).toBe(20);
  });
});

describe('CropInputsAppliedScreen — farm-wide history (Input Management "Full history")', () => {
  it('BR-56h: merges the farm-wide inputs (harvested crops included) with zone pest treatment logs, newest first', async () => {
    carrotInputs = [
      cropInput('i-a', 'MANURE', 'Vermicompost', '2026-07-12', '720.00'),
      cropInput('i-b', 'BIO_INPUT', 'Panchagavya', '2026-06-28', '640.00'),
    ];
    beetrootInputs = [cropInput('i-beet', 'PESTICIDE', 'Neem oil spray', '2026-07-01', '45.00', BEETROOT, 250, 'ML')];
    const tree = await mount(null);
    expect(rowIds(tree)).toEqual([
      'inputHistory.row.cropInput:i-a',
      'inputHistory.row.cropInput:i-beet',
      'inputHistory.row.pestLog:l-1',
      'inputHistory.row.cropInput:i-b',
    ]);
    const jul = t('farmer.audits.monthShort.jul');
    const jun = t('farmer.audits.monthShort.jun');
    // Farm-wide rows name the crop (or the zone) after the date, as Dev's subtitle carried extra context.
    expect(textById(tree, 'inputHistory.row.cropInput:i-a.title')).toBe('Vermicompost');
    expect(textById(tree, 'inputHistory.row.cropInput:i-a.subtitle')).toBe(`12 ${jul} · Carrot`);
    // The harvested crop is not in the active list; its name comes from the endpoint.
    expect(textById(tree, 'inputHistory.row.cropInput:i-beet.subtitle')).toBe(`1 ${jul} · Beetroot`);
    expect(textById(tree, 'inputHistory.row.cropInput:i-beet.quantity')).toBe('250 ml');
    // A pest log without a farmCropId is labelled with its zone; it has no quantity in the API.
    expect(textById(tree, 'inputHistory.row.pestLog:l-1.title')).toBe('Agniastra');
    expect(textById(tree, 'inputHistory.row.pestLog:l-1.subtitle')).toBe(`30 ${jun} · Zone 1 — Upper Field`);
    expect(textById(tree, 'inputHistory.row.pestLog:l-1.quantity')).toBe(t('farmer.inputHistory.placeholder'));
    expect(textOf(tree)).toContain(t('farmer.inputHistory.allCrops'));
    expect(textById(tree, 'inputHistory.count.pest')).toBe('2');
    expect(textById(tree, 'inputHistory.count.fertigation')).toBe('2');

    // One farm-wide source; no per-crop fan-out.
    const calls = apiGet.mock.calls.map((c) => c[0] as string).filter((p) => p.includes('inputs'));
    expect(calls).toEqual(['/farmers/me/crop-inputs?limit=100']);
  });

  it('BR-56h: walks the farm-wide cursor to the end so the counts are exact', async () => {
    // 25 carrot inputs (5 pesticide) + 10 harvested-beetroot manure inputs, served 10 per page.
    beetrootInputs = Array.from({ length: 10 }, (_, i) =>
      cropInput(`b-${i}`, 'MANURE', `Beet ${i}`, `2026-05-${String(10 + i).padStart(2, '0')}`, '1.00', BEETROOT),
    );
    const tree = await mount(null);
    const calls = apiGet.mock.calls.map((c) => c[0] as string).filter((p) => p.includes('inputs'));
    expect(calls).toEqual([
      '/farmers/me/crop-inputs?limit=100',
      '/farmers/me/crop-inputs?cursor=10&limit=100',
      '/farmers/me/crop-inputs?cursor=20&limit=100',
      '/farmers/me/crop-inputs?cursor=30&limit=100',
    ]);
    // 30 fertigation (20 carrot + 10 beetroot) and 5 pesticide inputs + 1 pest log.
    expect(textById(tree, 'inputHistory.count.fertigation')).toBe('30');
    expect(textById(tree, 'inputHistory.count.pest')).toBe('6');
  });
});

describe('CropInputsAppliedScreen i18n', () => {
  it('every literal t() key exists in both en and ta, and the old literals are gone', () => {
    const en: Record<string, string> = { ...errorsEn, ...farmerEn };
    const ta: Record<string, string> = { ...errorsTa, ...farmerTa };
    const source = fs.readFileSync(
      path.resolve(__dirname, '../screens/farm/crops/CropInputsAppliedScreen.tsx'),
      'utf8',
    ).replace(/\r\n/g, '\n');
    const keys = [...new Set([...source.matchAll(/\bt\(\s*(['"])([A-Za-z0-9_.-]+)\1/g)].map((m) => m[2]!))];
    expect(keys.length).toBeGreaterThan(5);
    for (const key of keys) {
      expect(en[key], `en ${key}`).toBeTruthy();
      expect(ta[key], `ta ${key}`).toBeTruthy();
    }
    expect(source).not.toContain('INITIAL_INPUTS');
    expect(source).not.toContain('>Inputs Applied<');
  });
});
