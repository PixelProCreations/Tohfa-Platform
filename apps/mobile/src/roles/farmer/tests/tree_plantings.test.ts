/**
 * BR-55 — tree & perennial plantings: the farmer API client, the list-item
 * mapping, and the three screens wired to it (Trees list, Add planting, Edit
 * planting).
 *
 * The screens used to render hard-coded sample plantings ("Silver Oak (12
 * trees)", "Pruning check due in 6 days", a "Young" badge...), and the first
 * attempt at wiring them derived a "Young" status, a pruning alert and a
 * fruit-bearing class from guesses (age < 2 years, keywords in free text). The
 * API has no status, stage or care-schedule field, so none of that is real
 * data: these tests pin that nothing of the kind is invented, and that every
 * derived label goes through the i18n catalogue.
 *
 * The screens are rendered with react-test-renderer against the REAL api
 * client; only `fetch` is stubbed, so the tests prove the request each screen
 * actually sends.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance, type ReactTestRendererJSON } from 'react-test-renderer';

// Only what the code under test imports from react-native (the screens, plus
// `Platform` for the shared api client).
vi.mock('react-native', () => ({
  Alert: { alert: vi.fn() },
  Modal: 'Modal',
  Platform: { OS: 'ios', Version: 0, select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s, absoluteFill: {} },
  Text: 'Text',
  TextInput: 'TextInput',
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

vi.mock('react-native-calendars', () => ({ Calendar: 'Calendar' }));

vi.mock('@tohfa/mobile-ui', () => ({
  EmptyState: 'EmptyState',
  ErrorState: 'ErrorState',
  ScreenStatusBar: 'ScreenStatusBar',
  Skeleton: 'Skeleton',
}));

import {
  createTreePlanting,
  deleteTreePlanting,
  getTreePlanting,
  listAllTreePlantings,
  listTreePlantings,
  parsePlantedOn,
  toTreePlantingItem,
  updateTreePlanting,
  type CreateTreePlantingRequest,
  type ListTreePlantingsResponse,
  type TreePlantingResponse,
  type UpdateTreePlantingRequest,
} from '../api/treePlantings';
import { ApiError, setAccessToken } from '../../../shell/api/client';
import { setLocale, t } from '../../../i18n/farmer';
import { TreesListScreen } from '../screens/farm/assets/TreesListScreen';
import { AddPlantingScreen } from '../screens/farm/crops/AddPlantingScreen';
import { EditPlantingScreen } from '../screens/farm/crops/EditPlantingScreen';
import { RemoveItemScreen, canDeleteAsset } from '../screens/farm/assets/RemoveItemScreen';

// ── helpers ──────────────────────────────────────────────────────────────────

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': status >= 400 ? 'application/problem+json' : 'application/json' },
  });
}

function makePlanting(overrides: Partial<TreePlantingResponse> = {}): TreePlantingResponse {
  return {
    id: '80000000-0000-4000-8000-000000000001',
    farmerId: '70000000-0000-4000-8000-000000000001',
    farmId: null,
    plotId: null,
    speciesName: 'Jackfruit',
    treeCount: 3,
    plantedOn: '2022-03-05',
    zoneName: 'North fence',
    purpose: 'Fruit harvest',
    notes: null,
    createdAt: '2022-03-05T10:00:00.000Z',
    updatedAt: null,
    ...overrides,
  };
}

interface Captured {
  url: string;
  method: string;
  body: unknown;
}

/** Stubs fetch with a handler and records every request. */
function stubFetch(handler: (req: Captured) => Response): Captured[] {
  const calls: Captured[] = [];
  global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const req: Captured = {
      url: String(input),
      method: init?.method ?? 'GET',
      body: init?.body === undefined || init.body === null ? undefined : JSON.parse(String(init.body)),
    };
    calls.push(req);
    return handler(req);
  }) as typeof fetch;
  return calls;
}

/** The mocked host components are plain strings ('Text', 'Modal', ...). */
function isType(node: ReactTestInstance, name: string): boolean {
  return (node.type as unknown) === name;
}

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
  await settle();
  return tree;
}

async function settle(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/** The TouchableOpacity whose rendered text includes `label`. */
function buttonWithText(tree: renderer.ReactTestRenderer, label: string): ReactTestInstance {
  const match = tree.root.findAll(
    (node) =>
      isType(node, 'TouchableOpacity') &&
      node.findAll((child) => isType(child, 'Text')).some((txt) => txt.children.join('') === label),
  );
  const last = match[match.length - 1];
  if (!last) throw new Error(`no button with text "${label}"`);
  return last;
}

function inputWithPlaceholder(tree: renderer.ReactTestRenderer, placeholder: string): ReactTestInstance {
  return tree.root.find((node) => isType(node, 'TextInput') && node.props.placeholder === placeholder);
}

/** The sample values the Trees screens used to render instead of real data. */
const FAKE_SAMPLE_STRINGS = [
  'Silver Oak',
  'Guava',
  'Pruning check',
  'Zone A boundary',
  'Zone C boundary',
  'Near Zone B',
  'Shade & windbreak',
  'Seasonal yield',
  'Farm zone',
  '14 Jun 2019',
];

beforeEach(() => {
  vi.restoreAllMocks();
  setAccessToken('token-farmer-test');
  setLocale('en');
});

afterEach(() => {
  setAccessToken(null);
  setLocale('en');
});

// ── API client ───────────────────────────────────────────────────────────────

describe('Farmer tree plantings API client (BR-55)', () => {
  const plantingId = '80000000-0000-4000-8000-000000000001';

  it('BR-55: listTreePlantings calls GET /farmers/me/tree-plantings with query params', async () => {
    let capturedHeaders: unknown;
    const mockResponse: ListTreePlantingsResponse = {
      items: [makePlanting({ speciesName: 'Teak', treeCount: 12 })],
      page: { nextCursor: null, hasMore: false },
    };
    let capturedUrl = '';
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input);
      capturedHeaders = init?.headers;
      return jsonResponse(mockResponse);
    }) as typeof fetch;

    const result = await listTreePlantings({ limit: 50, cursor: 'cursor-abc' });

    expect(capturedUrl).toContain('/v1/farmers/me/tree-plantings');
    expect(capturedUrl).toContain('limit=50');
    expect(capturedUrl).toContain('cursor=cursor-abc');
    expect((capturedHeaders as Record<string, string>)?.Authorization).toBe('Bearer token-farmer-test');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.speciesName).toBe('Teak');
    expect(result.items[0]?.treeCount).toBe(12);
  });

  it('BR-55g: listAllTreePlantings follows nextCursor until hasMore is false, within the 100 page-size cap', async () => {
    const calls = stubFetch((req) => {
      if (req.url.includes('cursor=c2')) {
        return jsonResponse({ items: [makePlanting({ id: 'p3' })], page: { nextCursor: null, hasMore: false } });
      }
      if (req.url.includes('cursor=c1')) {
        return jsonResponse({ items: [makePlanting({ id: 'p2' })], page: { nextCursor: 'c2', hasMore: true } });
      }
      return jsonResponse({ items: [makePlanting({ id: 'p1' })], page: { nextCursor: 'c1', hasMore: true } });
    });

    const items = await listAllTreePlantings();

    expect(items.map((i) => i.id)).toEqual(['p1', 'p2', 'p3']);
    expect(calls).toHaveLength(3);
    for (const call of calls) expect(call.url).toContain('limit=100');
  });

  it('BR-55: getTreePlanting calls GET /farmers/me/tree-plantings/:id', async () => {
    const calls = stubFetch(() => jsonResponse(makePlanting({ speciesName: 'Mango', treeCount: 4 })));

    const result = await getTreePlanting(plantingId);

    expect(calls[0]?.url).toContain(`/v1/farmers/me/tree-plantings/${plantingId}`);
    expect(result.speciesName).toBe('Mango');
    expect(result.treeCount).toBe(4);
  });

  it('BR-55a,b: createTreePlanting calls POST /farmers/me/tree-plantings with the given payload', async () => {
    const requestBody: CreateTreePlantingRequest = {
      speciesName: 'Teak',
      treeCount: 25,
      plantedOn: '2024-01-15',
      zoneName: 'South perimeter',
      purpose: 'Timber & canopy',
    };
    const calls = stubFetch(() => jsonResponse(makePlanting({ id: 'new-id', speciesName: 'Teak' }), 201));

    const result = await createTreePlanting(requestBody);

    expect(calls[0]?.url).toContain('/v1/farmers/me/tree-plantings');
    expect(calls[0]?.method).toBe('POST');
    expect(calls[0]?.body).toEqual(requestBody);
    expect(result.id).toBe('new-id');
  });

  it('BR-55: updateTreePlanting calls PATCH /farmers/me/tree-plantings/:id', async () => {
    const updateBody: UpdateTreePlantingRequest = { treeCount: 30, notes: 'Planted 5 additional saplings' };
    const calls = stubFetch(() => jsonResponse(makePlanting({ treeCount: 30 })));

    const result = await updateTreePlanting(plantingId, updateBody);

    expect(calls[0]?.url).toContain(`/v1/farmers/me/tree-plantings/${plantingId}`);
    expect(calls[0]?.method).toBe('PATCH');
    expect(calls[0]?.body).toEqual(updateBody);
    expect(result.treeCount).toBe(30);
  });

  it('BR-55d: deleteTreePlanting calls DELETE /farmers/me/tree-plantings/:id', async () => {
    const calls = stubFetch(() => new Response(null, { status: 204 }));

    await deleteTreePlanting(plantingId);

    expect(calls[0]?.url).toContain(`/v1/farmers/me/tree-plantings/${plantingId}`);
    expect(calls[0]?.method).toBe('DELETE');
  });

  it('BR-55c: throws ApiError on 404 NOT_FOUND for a cross-farmer or missing planting', async () => {
    stubFetch(() =>
      jsonResponse({ type: 'about:blank', title: 'Not Found', status: 404, code: 'NOT_FOUND' }, 404),
    );

    await expect(getTreePlanting('non-existent-id')).rejects.toThrow(ApiError);
    await expect(deleteTreePlanting('non-existent-id')).rejects.toThrow(ApiError);
  });

  it('BR-55a,b: throws ApiError on 422 VALIDATION_FAILED for an invalid treeCount or future date', async () => {
    stubFetch(() =>
      jsonResponse({ type: 'about:blank', title: 'Validation Failed', status: 422, code: 'VALIDATION_FAILED' }, 422),
    );

    await expect(createTreePlanting({ speciesName: 'Mango', treeCount: 0 })).rejects.toThrow(ApiError);
  });
});

// ── list-item mapping ────────────────────────────────────────────────────────

describe('toTreePlantingItem (BR-55)', () => {
  const NOW = new Date(2026, 10, 4); // 4 Nov 2026, local

  it('BR-55: invents no status, pruning alert or fruit classification — the API has no such field', () => {
    // A sapling planted last month, whose free-text purpose mentions fruit:
    // the old mapping called it "Young", flagged "Pruning check recommended"
    // and classed it fruit-bearing. None of that is in the record.
    const mapped = toTreePlantingItem(
      makePlanting({ plantedOn: '2026-10-01', purpose: 'Fruit harvest & seasonal yield' }),
      NOW,
    );

    expect(mapped.status).toBeNull();
    expect(mapped.hasPruningAlert).toBeFalsy();
    expect(mapped.alertText).toBeUndefined();
    expect(mapped.isFruitBearing).toBeUndefined();
    // The purpose itself is real data and is shown verbatim.
    expect(mapped.purposeText).toBe('Fruit harvest & seasonal yield');
  });

  it('BR-55: name, planted date and age are derived from real fields through i18n keys (en and ta)', () => {
    const tree = makePlanting({ speciesName: 'Jackfruit', treeCount: 3, plantedOn: '2022-03-05' });

    const en = toTreePlantingItem(tree, NOW);
    expect(en.name).toBe(t('farmer.trees.nameWithCount.other', { species: 'Jackfruit', count: '3' }));
    expect(en.name).toBe('Jackfruit (3 trees)');
    expect(en.plantedDate).toBe(t('farmer.trees.plantedOn', { date: '05 Mar 2022' }));
    expect(en.ageText).toBe(t('farmer.trees.age.years', { count: '4' }));
    expect(en.ageText).toBe('≈ 4 years old');
    expect(en.zoneInfo).toBe('North fence');

    const single = toTreePlantingItem(makePlanting({ treeCount: 1, plantedOn: '2026-08-04' }), NOW);
    expect(single.name).toBe('Jackfruit (1 tree)');
    expect(single.ageText).toBe('≈ 3 months old');

    const recent = toTreePlantingItem(makePlanting({ plantedOn: '2026-11-03' }), NOW);
    expect(recent.ageText).toBe('≈ 1 day old');

    setLocale('ta');
    const ta = toTreePlantingItem(tree, NOW);
    expect(ta.name).toBe(t('farmer.trees.nameWithCount.other', { species: 'Jackfruit', count: '3' }));
    expect(ta.name).not.toContain('trees');
    expect(ta.ageText).not.toContain('years');
    expect(ta.plantedDate).not.toContain('Planted');
  });

  it('BR-55: a planting without plantedOn or zone shows no invented date, age or zone', () => {
    const mapped = toTreePlantingItem(makePlanting({ plantedOn: null, zoneName: null, purpose: null }), NOW);

    expect(mapped.plantedDate).toBe(t('farmer.trees.plantedDateUnknown'));
    expect(mapped.ageText).toBeUndefined();
    expect(mapped.zoneInfo).toBeUndefined();
    expect(mapped.purposeText).toBeUndefined();
  });

  it('BR-55b: parsePlantedOn reads the calendar date as a local day and rejects non-calendar dates', () => {
    const d = parsePlantedOn('2024-01-15');
    expect(d?.getFullYear()).toBe(2024);
    expect(d?.getMonth()).toBe(0);
    expect(d?.getDate()).toBe(15);
    expect(parsePlantedOn('2026-02-30')).toBeNull();
    expect(parsePlantedOn('not-a-date')).toBeNull();
    expect(parsePlantedOn(null)).toBeNull();
  });
});

// ── screens ──────────────────────────────────────────────────────────────────

describe('TreesListScreen wired to GET /farmers/me/tree-plantings (BR-55)', () => {
  it('BR-55: renders the farmer\'s real plantings and none of the old sample data', async () => {
    stubFetch(() =>
      jsonResponse({
        items: [makePlanting({ speciesName: 'Jackfruit', treeCount: 3, zoneName: 'North fence', purpose: 'Fruit harvest' })],
        page: { nextCursor: null, hasMore: false },
      }),
    );

    const tree = await mount(React.createElement(TreesListScreen, {}));
    const text = renderedText(tree.toJSON()).join('\n');

    expect(text).toContain('Jackfruit (3 trees)');
    expect(text).toContain('North fence');
    expect(text).toContain('Fruit harvest');
    expect(text).toContain(t('farmer.trees.plantingsCount', { count: '1' }));
    for (const fake of FAKE_SAMPLE_STRINGS) {
      expect(text, `rendered sample value "${fake}"`).not.toContain(fake);
    }
    // No status badge is invented for a record that has no status.
    expect(text).not.toMatch(/\bMature\b|\bYoung\b|Fruit-bearing/);
  });

  it('BR-55: the filter offers only statuses present in the data (none, as the API has no status)', async () => {
    stubFetch(() =>
      jsonResponse({ items: [makePlanting()], page: { nextCursor: null, hasMore: false } }),
    );

    const tree = await mount(React.createElement(TreesListScreen, {}));
    const modal = tree.root.find((node) => isType(node, 'Modal'));
    const options = modal
      .findAll((node) => isType(node, 'Text'))
      .map((node) => node.children.join(''));

    expect(options).toContain('All plantings');
    expect(options).not.toContain('Mature');
    expect(options).not.toContain('Young');
    expect(options).not.toContain('Fruit-bearing');
  });

  it('BR-55: shows an empty state, not sample plantings, when the farmer has none', async () => {
    stubFetch(() => jsonResponse({ items: [], page: { nextCursor: null, hasMore: false } }));

    const tree = await mount(React.createElement(TreesListScreen, {}));
    const empty = tree.root.findAll((node) => isType(node, 'EmptyState'));
    const text = renderedText(tree.toJSON()).join('\n');

    expect(empty).toHaveLength(1);
    expect(empty[0]?.props.title).toBe(t('farmer.trees.emptyTitle'));
    for (const fake of FAKE_SAMPLE_STRINGS) expect(text).not.toContain(fake);
  });

  it('BR-55: shows ErrorState with retry when the list request fails', async () => {
    stubFetch(() =>
      jsonResponse({ type: 'about:blank', title: 'Server error', status: 500, code: 'INTERNAL' }, 500),
    );

    const tree = await mount(React.createElement(TreesListScreen, {}));
    const errors = tree.root.findAll((node) => isType(node, 'ErrorState'));

    expect(errors).toHaveLength(1);
    expect(typeof errors[0]?.props.onRetry).toBe('function');
  });
});

describe('AddPlantingScreen wired to POST /farmers/me/tree-plantings (BR-55)', () => {
  it('BR-55a,b: saves the entered planting through createTreePlanting, then returns', async () => {
    const calls = stubFetch(() => jsonResponse(makePlanting({ id: 'created' }), 201));
    const onNavigateBack = vi.fn();
    const onSave = vi.fn();

    const tree = await mount(React.createElement(AddPlantingScreen, { onNavigateBack, onSave }));
    await act(async () => {
      inputWithPlaceholder(tree, 'e.g. Silver Oak / Guava').props.onChangeText('  Teak ');
      inputWithPlaceholder(tree, 'e.g. 12').props.onChangeText('25');
      inputWithPlaceholder(tree, 'e.g. Zone A boundary / Near Zone B').props.onChangeText('South perimeter');
      inputWithPlaceholder(tree, 'e.g. Shade & windbreak / Seasonal yield').props.onChangeText('');
    });
    await act(async () => {
      buttonWithText(tree, 'Add planting').props.onPress();
    });
    await settle();

    const posts = calls.filter((c) => c.method === 'POST');
    expect(posts).toHaveLength(1);
    expect(posts[0]?.url).toContain('/v1/farmers/me/tree-plantings');
    // Only what the farmer entered: no invented purpose, no date when none was picked.
    expect(posts[0]?.body).toEqual({ speciesName: 'Teak', treeCount: 25, zoneName: 'South perimeter' });
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onNavigateBack).toHaveBeenCalledTimes(1);
  });

  it('BR-55a: does not send a non-positive or non-integer tree count, and says why', async () => {
    const calls = stubFetch(() => jsonResponse(makePlanting(), 201));
    const onNavigateBack = vi.fn();

    const tree = await mount(React.createElement(AddPlantingScreen, { onNavigateBack }));
    for (const bad of ['0', '2.5', '-3']) {
      await act(async () => {
        inputWithPlaceholder(tree, 'e.g. Silver Oak / Guava').props.onChangeText('Teak');
        inputWithPlaceholder(tree, 'e.g. 12').props.onChangeText(bad);
      });
      await act(async () => {
        buttonWithText(tree, 'Add planting').props.onPress();
      });
      await settle();
      expect(renderedText(tree.toJSON())).toContain(t('farmer.trees.countInvalid'));
    }

    expect(calls).toHaveLength(0);
    expect(onNavigateBack).not.toHaveBeenCalled();
  });

  it('BR-55: stays on the screen and shows the error when the API rejects the planting', async () => {
    stubFetch(() =>
      jsonResponse({ type: 'about:blank', title: 'Server error', status: 500, code: 'INTERNAL' }, 500),
    );
    const onNavigateBack = vi.fn();
    const onSave = vi.fn();

    const tree = await mount(React.createElement(AddPlantingScreen, { onNavigateBack, onSave }));
    await act(async () => {
      inputWithPlaceholder(tree, 'e.g. Silver Oak / Guava').props.onChangeText('Teak');
      inputWithPlaceholder(tree, 'e.g. 12').props.onChangeText('4');
    });
    await act(async () => {
      buttonWithText(tree, 'Add planting').props.onPress();
    });
    await settle();

    expect(onSave).not.toHaveBeenCalled();
    expect(onNavigateBack).not.toHaveBeenCalled();
    expect(tree.root.findAll((node) => isType(node, 'Text') && node.props.testID === 'add-planting-error')).toHaveLength(1);
  });
});

describe('EditPlantingScreen wired to GET/PATCH /farmers/me/tree-plantings/:id (BR-55)', () => {
  const id = '80000000-0000-4000-8000-0000000000aa';

  it('BR-55: loads the record by id and PATCHes the real values back — never the sample defaults', async () => {
    const record = makePlanting({ id, speciesName: 'Jackfruit', treeCount: 3, zoneName: null, purpose: null, plantedOn: null });
    const calls = stubFetch((req) =>
      req.method === 'PATCH' ? jsonResponse({ ...record, treeCount: 4 }) : jsonResponse(record),
    );
    const onNavigateBack = vi.fn();

    // App.tsx hands over a lossy display item; the screen must not trust it.
    const tree = await mount(
      React.createElement(EditPlantingScreen, {
        planting: { id, species: 'Jackfruit', treeCount: 3, plantedDate: 'Planting date not recorded' },
        onNavigateBack,
      }),
    );

    expect(calls[0]?.method).toBe('GET');
    expect(calls[0]?.url).toContain(`/v1/farmers/me/tree-plantings/${id}`);
    const text = renderedText(tree.toJSON()).join('\n');
    for (const fake of FAKE_SAMPLE_STRINGS) expect(text, `rendered sample "${fake}"`).not.toContain(fake);

    await act(async () => {
      tree.root
        .find((node) => isType(node, 'TouchableOpacity') && node.props.accessibilityLabel === 'Increase tree count')
        .props.onPress();
    });
    await act(async () => {
      buttonWithText(tree, 'Save changes').props.onPress();
    });
    await settle();

    const patches = calls.filter((c) => c.method === 'PATCH');
    expect(patches).toHaveLength(1);
    expect(patches[0]?.url).toContain(`/v1/farmers/me/tree-plantings/${id}`);
    expect(patches[0]?.body).toEqual({
      speciesName: 'Jackfruit',
      treeCount: 4,
      plantedOn: null,
      zoneName: null,
      purpose: null,
    });
    expect(onNavigateBack).toHaveBeenCalledTimes(1);
  });

  it('BR-55c: shows ErrorState and does not offer a save when the record cannot be loaded (404)', async () => {
    const calls = stubFetch(() =>
      jsonResponse({ type: 'about:blank', title: 'Not Found', status: 404, code: 'NOT_FOUND' }, 404),
    );

    const tree = await mount(
      React.createElement(EditPlantingScreen, { planting: { id }, onNavigateBack: vi.fn() }),
    );
    expect(tree.root.findAll((node) => isType(node, 'ErrorState'))).toHaveLength(1);

    await act(async () => {
      buttonWithText(tree, 'Save changes').props.onPress?.();
    });
    await settle();
    expect(calls.filter((c) => c.method === 'PATCH')).toHaveLength(0);
  });

  it('BR-55d: Trees can be deleted (DELETE /farmers/me/tree-plantings/:id exists), so Remove hands off to onRemove', async () => {
    expect(canDeleteAsset('Trees')).toBe(true);
    stubFetch(() => jsonResponse(makePlanting({ id })));
    const onRemove = vi.fn();

    const tree = await mount(
      React.createElement(EditPlantingScreen, { planting: { id }, onNavigateBack: vi.fn(), onRemove }),
    );
    const remove = tree.root.find(
      (node) => isType(node, 'TouchableOpacity') && node.props.accessibilityLabel === 'Remove this planting',
    );
    await act(async () => {
      remove.props.onPress();
    });

    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('BR-55d: confirming removal of a tree calls onConfirmRemove instead of a "not available" alert', async () => {
    const onConfirmRemove = vi.fn(async () => undefined);
    const tree = await mount(
      React.createElement(RemoveItemScreen, {
        item: { id, name: 'Jackfruit (3 trees)', category: 'Trees', dateInfo: 'Trees · Planted 5 Mar 2022' },
        onNavigateBack: vi.fn(),
        onConfirmRemove,
      }),
    );
    const confirm = tree.root.find(
      (node) => isType(node, 'TouchableOpacity') && node.props.accessibilityLabel === 'Yes, Remove Permanently',
    );
    await act(async () => {
      confirm.props.onPress();
    });
    await settle();

    expect(onConfirmRemove).toHaveBeenCalledTimes(1);
    expect(renderedText(tree.toJSON())).not.toContain('Not available yet');
  });

  it('BR-55: without a planting id there is no record to update, so nothing is sent', async () => {
    const calls = stubFetch(() => jsonResponse(makePlanting()));
    const onNavigateBack = vi.fn();

    const tree = await mount(React.createElement(EditPlantingScreen, { onNavigateBack }));
    await act(async () => {
      buttonWithText(tree, 'Save changes').props.onPress?.();
    });
    await settle();

    expect(calls).toHaveLength(0);
    expect(onNavigateBack).not.toHaveBeenCalled();
  });
});
