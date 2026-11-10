/**
 * Editing and deleting a crop input (BR-56l), and showing what the farmer
 * recorded about it (purpose / target pest / applied by, BR-56k).
 *
 *  - EditInputAppliedScreen loads GET /farmers/me/crops/:farmCropId/inputs/:id,
 *    reuses the Add Input Applied form in edit mode, and PATCHes only the form's
 *    fields. A MANURE / BIO_INPUT row logged from LogFertigation keeps its
 *    specific type unless the farmer switches the form between Fertigation and
 *    Pest Treatment.
 *  - Delete always asks first (Alert with Cancel / Delete), then sends
 *    DELETE /farmers/me/crops/:farmCropId/inputs/:id.
 *  - The Inputs Applied history gives each crop-input row Edit and Delete; a pest
 *    treatment log (another table, another screen) gets neither. After a delete
 *    the list is fetched again.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';

type AlertButton = { text: string; style?: string; onPress?: () => void };
const alert = vi.hoisted(() => vi.fn());
vi.mock('react-native', () => ({
  Alert: { alert },
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  Modal: 'Modal',
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
  RefreshControl: 'RefreshControl',
  SafeAreaView: 'SafeAreaView',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  Text: 'Text',
  TextInput: 'TextInput',
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
  SafeAreaView: 'SafeAreaView',
  ScreenStatusBar: 'ScreenStatusBar',
  Skeleton: 'Skeleton',
}));

const apiGet = vi.hoisted(() => vi.fn());
const apiPatch = vi.hoisted(() => vi.fn());
const apiDelete = vi.hoisted(() => vi.fn());
const apiPost = vi.hoisted(() => vi.fn());
vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, api: { get: apiGet, patch: apiPatch, delete: apiDelete, post: apiPost } };
});

import { EditInputAppliedScreen } from '../screens/farm/crops/EditInputAppliedScreen';
import { CropInputsAppliedScreen } from '../screens/farm/crops/CropInputsAppliedScreen';
import { iconForInputType, kindForInputType } from '../screens/farm/crops/inputApplications';
import type { CropItem } from '../screens/farm/crops/cropItems';
import { setLocale, t } from '../../../i18n/farmer';

const CARROT = 'c0000000-0000-4000-8000-000000000001';
const INPUT = 'i0000000-0000-4000-8000-000000000001';
const FARM = 'f0000000-0000-4000-8000-000000000001';
const PLOT1 = 'p0000000-0000-4000-8000-000000000001';

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

function record(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: INPUT,
    farmerId: 'farmer-1',
    farmCropId: CARROT,
    inputType: 'MANURE',
    inputName: 'Vermicompost',
    appliedOn: '2026-07-12',
    quantity: 60,
    unit: 'KG',
    nitrogenPct: null,
    phosphorusPct: null,
    potassiumPct: null,
    applicationMethod: 'Drench',
    costInr: null,
    notes: 'after rain',
    purpose: 'SOIL_FERTILITY',
    targetPest: null,
    appliedBy: 'Lakshmi',
    createdAt: '2026-07-12T06:00:00.000Z',
    updatedAt: null,
    ...overrides,
  };
}

function renderedText(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(renderedText);
  return (node.children ?? []).flatMap(renderedText);
}

function textById(tree: renderer.ReactTestRenderer, testID: string): string {
  const node = tree.root.findByProps({ testID });
  const flat = (v: unknown): string =>
    Array.isArray(v) ? v.map(flat).join('') : typeof v === 'string' || typeof v === 'number' ? String(v) : '';
  return flat(node.props.children);
}

function hasTestId(tree: renderer.ReactTestRenderer, testID: string): boolean {
  return tree.root.findAll((n) => n.props.testID === testID).length > 0;
}

async function settle(): Promise<void> {
  for (let i = 0; i < 4; i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

function input(tree: renderer.ReactTestRenderer, label: string): renderer.ReactTestInstance {
  return tree.root.find((n) => (n.type as unknown) === 'TextInput' && n.props.accessibilityLabel === label);
}

async function type(tree: renderer.ReactTestRenderer, label: string, value: string): Promise<void> {
  await act(async () => {
    (input(tree, label).props as { onChangeText: (v: string) => void }).onChangeText(value);
  });
}

async function pressLabel(tree: renderer.ReactTestRenderer, label: string): Promise<void> {
  const node = tree.root.find((n) => (n.type as unknown) === 'TouchableOpacity' && n.props.accessibilityLabel === label);
  await act(async () => {
    (node.props as { onPress: () => void }).onPress();
  });
  await settle();
}

async function pressTestId(tree: renderer.ReactTestRenderer, testID: string): Promise<void> {
  const node = tree.root.find((n) => n.props.testID === testID && typeof n.props.onPress === 'function');
  await act(async () => {
    (node.props as { onPress: () => void }).onPress();
  });
  await settle();
}

/** The last Alert's button with the given text, pressed. */
async function pressAlertButton(text: string): Promise<void> {
  const buttons = (alert.mock.calls[alert.mock.calls.length - 1]![2] ?? []) as AlertButton[];
  const button = buttons.find((b) => b.text === text);
  if (!button) throw new Error(`no alert button "${text}"`);
  await act(async () => {
    button.onPress?.();
  });
  await settle();
}

async function mountEdit(
  props: Partial<React.ComponentProps<typeof EditInputAppliedScreen>> = {},
): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      <EditInputAppliedScreen
        farmCropId={CARROT}
        inputId={INPUT}
        cropName="Carrot"
        zoneName="Zone 1"
        onBack={() => undefined}
        {...props}
      />,
    );
  });
  await settle();
  return tree;
}

let stored: Record<string, unknown>;
let failGet: boolean;

beforeEach(() => {
  setLocale('en');
  stored = record();
  failGet = false;
  alert.mockReset();
  apiGet.mockReset();
  apiPatch.mockReset();
  apiDelete.mockReset();
  apiPost.mockReset();
  apiGet.mockImplementation((p: string) => {
    if (failGet) return Promise.reject(new Error('offline'));
    if (p === `/farmers/me/crops/${CARROT}/inputs/${INPUT}`) return Promise.resolve(stored);
    return Promise.reject(new Error(`unexpected path ${p}`));
  });
  apiPatch.mockImplementation((_p: string, body: Record<string, unknown>) => Promise.resolve({ ...stored, ...body }));
  apiDelete.mockResolvedValue(undefined);
});

describe('EditInputAppliedScreen (BR-56l)', () => {
  it('BR-56l: edit input screen shows a loading state, then the stored values in the Add Input form', async () => {
    let resolve!: (v: unknown) => void;
    apiGet.mockImplementationOnce(() => new Promise((r) => { resolve = r; }));
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(<EditInputAppliedScreen farmCropId={CARROT} inputId={INPUT} />);
    });
    expect(hasTestId(tree, 'editInput.loading')).toBe(true);
    await act(async () => {
      resolve(stored);
    });
    await settle();

    expect(apiGet).toHaveBeenCalledWith(`/farmers/me/crops/${CARROT}/inputs/${INPUT}`, expect.anything());
    expect(hasTestId(tree, 'editInput.loading')).toBe(false);
    const text = renderedText(tree.toJSON()).join('\n');
    expect(text).toContain(t('farmer.editInput.title'));
    expect(input(tree, 'Product or Input Name').props.value).toBe('Vermicompost');
    expect(input(tree, 'Quantity').props.value).toBe('60');
    expect(input(tree, 'Date and Time').props.value).toBe('2026-07-12');
    expect(input(tree, t('farmer.addInput.appliedByA11y')).props.value).toBe('Lakshmi');
    expect(input(tree, 'Optional notes').props.value).toBe('after rain');
    // The stored purpose code is shown as its label.
    expect(text).toContain(t('farmer.addInput.purposeOption.SOIL_FERTILITY'));
  });

  it('BR-56l: a failed load shows ErrorState with Retry and offers no save', async () => {
    failGet = true;
    const tree = await mountEdit();
    const error = tree.root.findByType('ErrorState' as unknown as React.ElementType);
    expect(error.props.message).toBe(t('farmer.editInput.loadError'));
    expect(tree.root.findAll((n) => n.props.accessibilityLabel === t('farmer.addInput.save')).length).toBe(0);
    failGet = false;
    await act(async () => {
      (error.props as { onRetry: () => void }).onRetry();
    });
    await settle();
    expect(input(tree, 'Product or Input Name').props.value).toBe('Vermicompost');
  });

  it('BR-56l: Save PATCHes only the form fields, keeps the specific MANURE type, then calls onSaved', async () => {
    const onSaved = vi.fn();
    const tree = await mountEdit({ onSaved });
    await type(tree, 'Quantity', '55.5');
    await type(tree, t('farmer.addInput.appliedByA11y'), '');
    await type(tree, 'Optional notes', '  ');
    await pressLabel(tree, t('farmer.addInput.save'));

    expect(apiPost).not.toHaveBeenCalled();
    expect(apiPatch).toHaveBeenCalledTimes(1);
    const [p, body] = apiPatch.mock.calls[0]!;
    expect(p).toBe(`/farmers/me/crops/${CARROT}/inputs/${INPUT}`);
    expect(body).toEqual({
      inputName: 'Vermicompost',
      appliedOn: '2026-07-12',
      quantity: 55.5,
      unit: 'KG',
      purpose: 'SOIL_FERTILITY',
      targetPest: null,
      appliedBy: null,
      notes: null,
    });
    // Fields the form does not edit (method, NPK, cost) are never sent.
    expect(body).not.toHaveProperty('applicationMethod');
    expect(body).not.toHaveProperty('costInr');
    expect(body).not.toHaveProperty('inputType');
    expect(onSaved).toHaveBeenCalledTimes(1);
  });

  it('BR-56l: switching the form to Pest Treatment sends PESTICIDE and clears the purpose', async () => {
    const tree = await mountEdit();
    await pressLabel(tree, t('farmer.addInput.type.pest'));
    await pressLabel(tree, t('farmer.addInput.targetPestA11y'));
    await pressTestId(tree, 'addInput.pestOption.APHIDS');
    await pressLabel(tree, t('farmer.addInput.save'));
    const body = apiPatch.mock.calls[0]![1] as Record<string, unknown>;
    expect(body['inputType']).toBe('PESTICIDE');
    expect(body['purpose']).toBeNull();
    expect(body['targetPest']).toBe('APHIDS');
  });

  it('BR-56l: a failed PATCH keeps the farmer on the form with an error', async () => {
    apiPatch.mockRejectedValueOnce(new Error('network'));
    const onSaved = vi.fn();
    const tree = await mountEdit({ onSaved });
    await pressLabel(tree, t('farmer.addInput.save'));
    expect(onSaved).not.toHaveBeenCalled();
    expect(alert).toHaveBeenLastCalledWith(t('farmer.addInput.error.title'), t('farmer.addInput.error.saveFailed'));
  });

  it('BR-56l: Delete asks first; Cancel sends nothing, Delete sends DELETE and calls onDeleted', async () => {
    const onDeleted = vi.fn();
    const tree = await mountEdit({ onDeleted });
    await pressLabel(tree, t('farmer.editInput.delete'));
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0]![0]).toBe(t('farmer.inputHistory.deleteConfirm.title'));
    expect(alert.mock.calls[0]![1]).toBe(t('farmer.inputHistory.deleteConfirm.body', { name: 'Vermicompost' }));
    await pressAlertButton(t('farmer.common.cancel'));
    expect(apiDelete).not.toHaveBeenCalled();

    await pressLabel(tree, t('farmer.editInput.delete'));
    await pressAlertButton(t('farmer.inputHistory.deleteConfirm.confirm'));
    expect(apiDelete).toHaveBeenCalledWith(`/farmers/me/crops/${CARROT}/inputs/${INPUT}`);
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it('BR-56l: renders its own labels from the i18n catalogue (Tamil)', async () => {
    setLocale('ta');
    try {
      const tree = await mountEdit();
      const text = renderedText(tree.toJSON()).join('\n');
      expect(text).toContain(t('farmer.editInput.title'));
      expect(text).not.toContain('Edit Input Applied');
    } finally {
      setLocale('en');
    }
  });
});

// ── History rows: details, edit and delete ──────────────────────────────────

let historyRows: Record<string, unknown>[];

function routeHistory(p: string): Promise<unknown> {
  if (p.startsWith(`/farmers/me/crops/${CARROT}/inputs`)) {
    return Promise.resolve({ items: historyRows, page: { nextCursor: null, hasMore: false } });
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
          farmCropId: CARROT,
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

async function mountHistory(
  props: Partial<React.ComponentProps<typeof CropInputsAppliedScreen>> = {},
): Promise<renderer.ReactTestRenderer> {
  apiGet.mockImplementation((p: string) => routeHistory(p));
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<CropInputsAppliedScreen crop={CARROT_ITEM} onBack={() => undefined} {...props} />);
  });
  await settle();
  return tree;
}

describe('Inputs Applied history — recorded details (BR-56k)', () => {
  beforeEach(() => {
    historyRows = [
      record({ id: 'i-fert', inputType: 'FERTIGATION', inputName: 'Jeevamrutha', purpose: 'SOIL_FERTILITY', appliedBy: 'Lakshmi' }),
      record({ id: 'i-pest', inputType: 'PESTICIDE', inputName: 'Neem Oil', appliedOn: '2026-07-11', purpose: null, targetPest: 'FRUIT_BORER', appliedBy: null }),
      // A value from an older client or typed elsewhere: shown as stored, not dropped.
      record({ id: 'i-raw', inputType: 'OTHER', inputName: 'Old fertigation', appliedOn: '2026-07-10', purpose: 'Root booster', appliedBy: null }),
      record({ id: 'i-none', inputType: 'MANURE', inputName: 'Cow dung', appliedOn: '2026-07-09', purpose: null, targetPest: null, appliedBy: null }),
    ];
  });

  it('BR-56k: shows purpose, target pest and applied by when recorded, mapped to i18n labels, raw text for unknown values', async () => {
    const tree = await mountHistory();
    expect(textById(tree, 'inputHistory.row.cropInput:i-fert.purpose')).toBe(
      t('farmer.inputHistory.detail.purpose', { value: t('farmer.addInput.purposeOption.SOIL_FERTILITY') }),
    );
    expect(textById(tree, 'inputHistory.row.cropInput:i-fert.appliedBy')).toBe(
      t('farmer.inputHistory.detail.appliedBy', { value: 'Lakshmi' }),
    );
    expect(textById(tree, 'inputHistory.row.cropInput:i-pest.targetPest')).toBe(
      t('farmer.inputHistory.detail.targetPest', { value: t('farmer.addInput.pestOption.FRUIT_BORER') }),
    );
    expect(textById(tree, 'inputHistory.row.cropInput:i-raw.purpose')).toBe(
      t('farmer.inputHistory.detail.purpose', { value: 'Root booster' }),
    );
    // Nothing recorded: no detail line at all, not a placeholder.
    for (const field of ['purpose', 'targetPest', 'appliedBy']) {
      expect(hasTestId(tree, `inputHistory.row.cropInput:i-none.${field}`), field).toBe(false);
    }
  });

  it('BR-56j: FERTIGATION and legacy OTHER rows both count and show as Fertigation', async () => {
    const tree = await mountHistory();
    expect(textById(tree, 'inputHistory.row.cropInput:i-fert.tag')).toBe(t('farmer.inputHistory.type.fertigation'));
    expect(textById(tree, 'inputHistory.row.cropInput:i-raw.tag')).toBe(t('farmer.inputHistory.type.fertigation'));
    expect(kindForInputType('FERTIGATION')).toBe('fertigation');
    expect(kindForInputType('OTHER')).toBe('fertigation');
    // Same icon as the legacy OTHER rows that used to carry fertigation.
    expect(iconForInputType('FERTIGATION')).toBe(iconForInputType('OTHER'));
  });
});

describe('Inputs Applied history — edit and delete (BR-56l)', () => {
  beforeEach(() => {
    historyRows = [record({ id: 'i-a', inputName: 'Vermicompost' })];
  });

  it('BR-56l: each crop-input row has Edit and Delete; a pest treatment log has neither', async () => {
    const tree = await mountHistory({ onEditInput: vi.fn() });
    expect(hasTestId(tree, 'inputHistory.row.cropInput:i-a.edit')).toBe(true);
    expect(hasTestId(tree, 'inputHistory.row.cropInput:i-a.delete')).toBe(true);
    expect(hasTestId(tree, 'inputHistory.row.pestLog:l-1')).toBe(true);
    expect(hasTestId(tree, 'inputHistory.row.pestLog:l-1.edit')).toBe(false);
    expect(hasTestId(tree, 'inputHistory.row.pestLog:l-1.delete')).toBe(false);
  });

  it('BR-56l: Edit hands the crop and input ids (and display names) to onEditInput', async () => {
    const onEditInput = vi.fn();
    const tree = await mountHistory({ onEditInput });
    await pressTestId(tree, 'inputHistory.row.cropInput:i-a.edit');
    expect(onEditInput).toHaveBeenCalledWith({
      farmCropId: CARROT,
      inputId: 'i-a',
      cropName: 'Carrot',
      zoneName: 'Zone 1 — Upper Field',
    });
  });

  it('BR-56l: Delete confirms first, then DELETEs and fetches the list again', async () => {
    const tree = await mountHistory();
    await pressTestId(tree, 'inputHistory.row.cropInput:i-a.delete');
    expect(alert).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls[0]![1]).toBe(t('farmer.inputHistory.deleteConfirm.body', { name: 'Vermicompost' }));
    await pressAlertButton(t('farmer.common.cancel'));
    expect(apiDelete).not.toHaveBeenCalled();

    const listCallsBefore = apiGet.mock.calls.filter((c) => (c[0] as string).includes('/inputs')).length;
    historyRows = [];
    await pressTestId(tree, 'inputHistory.row.cropInput:i-a.delete');
    await pressAlertButton(t('farmer.inputHistory.deleteConfirm.confirm'));
    expect(apiDelete).toHaveBeenCalledWith(`/farmers/me/crops/${CARROT}/inputs/i-a`);
    const listCallsAfter = apiGet.mock.calls.filter((c) => (c[0] as string).includes('/inputs')).length;
    expect(listCallsAfter).toBeGreaterThan(listCallsBefore);
    expect(hasTestId(tree, 'inputHistory.row.cropInput:i-a')).toBe(false);
  });

  it('BR-56l: a failed delete says so and keeps the row', async () => {
    apiDelete.mockRejectedValueOnce(new Error('network'));
    const tree = await mountHistory();
    await pressTestId(tree, 'inputHistory.row.cropInput:i-a.delete');
    await pressAlertButton(t('farmer.inputHistory.deleteConfirm.confirm'));
    expect(alert).toHaveBeenLastCalledWith(
      t('farmer.inputHistory.deleteFailed.title'),
      t('farmer.inputHistory.deleteFailed.body'),
    );
    expect(hasTestId(tree, 'inputHistory.row.cropInput:i-a')).toBe(true);
  });
});
