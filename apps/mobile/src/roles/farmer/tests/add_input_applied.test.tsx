/**
 * Add Input Applied (Crop Detail → Inputs Applied → +) used to hand a local
 * object to `onSave` and persist nothing, with invented prefilled values
 * ("4 L" / "200 ml", "17 Sep 2026, 09:20 AM"). It now POSTs
 * /farmers/me/crops/:farmCropId/inputs (BR-56) with an Idempotency-Key, and
 * nothing is saved that the farmer did not type.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestRendererJSON } from 'react-test-renderer';

const alert = vi.hoisted(() => vi.fn());
vi.mock('react-native', () => ({
  Alert: { alert },
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  Modal: 'Modal',
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
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
  Path: 'Path',
}));

vi.mock('@tohfa/mobile-ui', () => ({
  ScreenStatusBar: 'ScreenStatusBar',
}));

const apiPost = vi.hoisted(() => vi.fn());
vi.mock('../../../shell/api/client', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, api: { post: apiPost } };
});

import { AddInputAppliedScreen } from '../screens/farm/crops/AddInputAppliedScreen';
import type { CropItem } from '../screens/farm/crops/cropItems';
import { addDaysIso, todayInKolkata } from '../screens/certifications/certificationForm';
import { t } from '../../../i18n/farmer';

const CARROT = 'c0000000-0000-4000-8000-000000000001';
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

function renderedText(node: ReactTestRendererJSON | ReactTestRendererJSON[] | string | null): string[] {
  if (node === null) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(renderedText);
  return (node.children ?? []).flatMap(renderedText);
}

async function settle(): Promise<void> {
  for (let i = 0; i < 3; i += 1) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }
}

async function mount(
  props: Partial<React.ComponentProps<typeof AddInputAppliedScreen>> = {},
): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(<AddInputAppliedScreen crop={CARROT_ITEM} onBack={() => undefined} {...props} />);
  });
  return tree;
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

async function fillValid(tree: renderer.ReactTestRenderer, date: string): Promise<void> {
  await type(tree, 'Product or Input Name', '  Vermicompost Tea ');
  await type(tree, 'Quantity', '4.5');
  await type(tree, 'Date and Time', date);
  await type(tree, 'Optional notes', 'after rain');
}

beforeEach(() => {
  apiPost.mockReset();
  alert.mockReset();
  apiPost.mockImplementation((_path: string, body: Record<string, unknown>) =>
    Promise.resolve({ id: 'new-1', farmCropId: CARROT, ...body }),
  );
});

describe('AddInputAppliedScreen (BR-56)', () => {
  it('renders the Dev header for the real crop and invents no prefilled quantity or date', async () => {
    const tree = await mount({ initialInputType: 'Fertigation' });
    const text = renderedText(tree.toJSON()).join('');
    expect(text).toContain('Add Input Applied');
    expect(text).toContain('Carrot — Nantes · Zone 1');
    expect(input(tree, 'Quantity').props.value).toBe('');
    expect(input(tree, 'Date and Time').props.value).toBe('');
    // Dev's placeholders are kept as hints only.
    expect(input(tree, 'Quantity').props.placeholder).toBe('200');
    expect(input(tree, 'Date and Time').props.placeholder).toBe('17 Sep 2026, 09:20 AM');
  });

  it('BR-56: Save posts the crop input with an Idempotency-Key, then calls onSave', async () => {
    const onSave = vi.fn();
    const tree = await mount({ initialInputType: 'Fertigation', onSave });
    await fillValid(tree, '12 Jul 2026, 07:00 AM');
    await pressLabel(tree, 'Save Input');

    expect(apiPost).toHaveBeenCalledTimes(1);
    const [p, body, key] = apiPost.mock.calls[0]!;
    expect(p).toBe(`/farmers/me/crops/${CARROT}/inputs`);
    expect(body).toEqual({
      inputType: 'OTHER',
      inputName: 'Vermicompost Tea',
      appliedOn: '2026-07-12',
      quantity: 4.5,
      unit: 'LITRE',
      notes: 'after rain',
    });
    expect(typeof key).toBe('string');
    expect((key as string).length).toBeGreaterThan(0);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith();
  });

  it('BR-56: a pest treatment is saved as a PESTICIDE input with the chosen unit; ISO dates are accepted', async () => {
    const tree = await mount({ initialInputType: 'Pest Treatment' });
    await type(tree, 'Product or Input Name', 'Neem Oil');
    await type(tree, 'Quantity', '200');
    await type(tree, 'Date and Time', '2026-07-11');
    await pressLabel(tree, 'Save Input');
    const body = apiPost.mock.calls[0]![1] as Record<string, unknown>;
    expect(body).toEqual({
      inputType: 'PESTICIDE',
      inputName: 'Neem Oil',
      appliedOn: '2026-07-11',
      quantity: 200,
      unit: 'ML',
    });
  });

  it('BR-56: a retried save after a failure replays the same Idempotency-Key', async () => {
    apiPost.mockRejectedValueOnce(new Error('network'));
    const tree = await mount({ initialInputType: 'Fertigation' });
    await fillValid(tree, '2026-07-12');
    await pressLabel(tree, 'Save Input');
    expect(alert).toHaveBeenCalledWith(t('farmer.addInput.error.title'), t('farmer.addInput.error.saveFailed'));
    await pressLabel(tree, 'Save Input');
    expect(apiPost).toHaveBeenCalledTimes(2);
    expect(apiPost.mock.calls[1]![2]).toBe(apiPost.mock.calls[0]![2]);
  });

  it('BR-56a: rejects a zero, negative or non-numeric quantity without calling the API', async () => {
    const tree = await mount({ initialInputType: 'Fertigation' });
    await fillValid(tree, '2026-07-12');
    for (const bad of ['0', '-2', 'abc', '']) {
      await type(tree, 'Quantity', bad);
      await pressLabel(tree, 'Save Input');
    }
    expect(apiPost).not.toHaveBeenCalled();
    expect(alert).toHaveBeenLastCalledWith(t('farmer.addInput.error.title'), t('farmer.addInput.error.quantity'));
  });

  it('BR-56b: rejects a future or non-calendar date without calling the API', async () => {
    const tree = await mount({ initialInputType: 'Fertigation' });
    await fillValid(tree, addDaysIso(todayInKolkata(), 1));
    await pressLabel(tree, 'Save Input');
    expect(alert).toHaveBeenLastCalledWith(t('farmer.addInput.error.title'), t('farmer.addInput.error.futureDate'));
    for (const bad of ['30 Feb 2026', '2026-02-30', 'yesterday', '']) {
      await type(tree, 'Date and Time', bad);
      await pressLabel(tree, 'Save Input');
      expect(alert).toHaveBeenLastCalledWith(t('farmer.addInput.error.title'), t('farmer.addInput.error.date'));
    }
    expect(apiPost).not.toHaveBeenCalled();
  });

  it('keeps the Dev required-name message and does not save', async () => {
    const tree = await mount({ initialInputType: 'Fertigation' });
    await type(tree, 'Quantity', '4');
    await type(tree, 'Date and Time', '2026-07-12');
    await pressLabel(tree, 'Save Input');
    expect(alert).toHaveBeenLastCalledWith('Required Field', 'Please enter a product or input name.');
    expect(apiPost).not.toHaveBeenCalled();
  });

  it('fails closed with no crop: nothing is saved against a guessed crop', async () => {
    const tree = await mount({ crop: null, initialInputType: 'Fertigation' });
    expect(renderedText(tree.toJSON()).join('')).not.toContain('Carrot');
    await fillValid(tree, '2026-07-12');
    await pressLabel(tree, 'Save Input');
    expect(apiPost).not.toHaveBeenCalled();
    expect(alert).toHaveBeenLastCalledWith(t('farmer.addInput.error.title'), t('farmer.addInput.error.noCrop'));
  });
});
