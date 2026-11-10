/**
 * Edit Farmer Profile (AdminEditFarmerScreen), rendered with
 * react-test-renderer over mocked hooks and stubbed form sections: Save asks
 * for confirmation first and only the confirm button sends the PATCH; the
 * host hears about the save (and so shows its "Changes Saved" toast) only
 * after the server answered. The form rules themselves are pinned in
 * farmerEdit_model.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import renderer, { act, type ReactTestInstance } from 'react-test-renderer';
import type { Problem } from '@tohfa/shared-types';

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  BackHandler: { addEventListener: () => ({ remove: () => undefined }) },
  Image: 'Image',
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

function stub(name: string) {
  return (props: Record<string, unknown>) => React.createElement(name, props);
}
vi.mock('../screens/farmers/detail/DetailHeader', () => ({ HeaderBanner: stub('HeaderBanner') }));
vi.mock('../screens/farmers/edit/EditSections', () => ({
  AddressSection: stub('AddressSection'),
  Disclaimer: stub('Disclaimer'),
  DocumentsSection: stub('DocumentsSection'),
  IdentitySection: stub('IdentitySection'),
  PersonalSection: stub('PersonalSection'),
  PlotsSection: stub('PlotsSection'),
  ZoneFarmSection: stub('ZoneFarmSection'),
}));

const hooks = vi.hoisted(() => ({
  useFarmer: vi.fn(),
  useFarmerDocuments: vi.fn(),
  useUpdateFarmer: vi.fn(),
}));
vi.mock('../api/farmerHooks', () => hooks);

const mapped = vi.hoisted(() => ({
  form: {
    fullName: 'Lakshmi Devi',
    email: '',
    dob: '1980-04-12',
    gender: 'FEMALE',
    farmingExperienceYears: 12,
    addressLine1: '4 Tea Estate Road',
    addressLine2: '',
    village: 'Kil Kotagiri',
    taluk: '',
    district: 'Nilgiris',
    pincode: '643217',
    mobile: '+919000000042',
    aadhaarLast4: '4321',
  },
  saved: { id: 'uuid-farmer-1', name: 'Lakshmi D.' },
}));
vi.mock('../api/farmerMappers', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  toEditFarmerForm: () => mapped.form,
  toFarmerDetail: () => mapped.saved,
}));

import { Alert } from 'react-native';
import { ApiError } from '../../../shell/api/client';
import { t } from '../i18n';
import { AdminEditFarmerScreen } from '../screens/farmers/AdminEditFarmerScreen';

const FARMER_ID = 'uuid-farmer-1';
const EDITOR = ['farmer.profile.view_all', 'farmer.profile.edit'];
const allow = (codes: readonly string[]) => (c: string) => codes.includes(c);
// One stable object: the screen memoises the form on it.
const DTO = { id: FARMER_ID, fullName: 'Lakshmi Devi' };

interface UpdateState {
  run: ReturnType<typeof vi.fn>;
  reset: ReturnType<typeof vi.fn>;
  isPending: boolean;
  error: unknown;
}
let update: UpdateState;

beforeEach(() => {
  vi.clearAllMocks();
  update = { run: vi.fn(), reset: vi.fn(), isPending: false, error: null };
  hooks.useFarmer.mockImplementation(() => ({
    dto: DTO,
    farmer: { id: FARMER_ID, name: 'Lakshmi Devi' },
    isLoading: false,
    error: null,
    refresh: vi.fn(),
  }));
  hooks.useFarmerDocuments.mockImplementation(() => ({ documents: [] }));
  hooks.useUpdateFarmer.mockImplementation(() => update);
});

type Props = Partial<React.ComponentProps<typeof AdminEditFarmerScreen>>;

function element(props: Props) {
  return <AdminEditFarmerScreen farmerId={FARMER_ID} can={allow(EDITOR)} initialTab="Personal" onBack={vi.fn()} {...props} />;
}

function mount(props: Props = {}): renderer.ReactTestRenderer {
  let tree!: renderer.ReactTestRenderer;
  act(() => {
    tree = renderer.create(element(props));
  });
  return tree;
}

function textOf(node: ReactTestInstance): string[] {
  return node.findAll((n) => String(n.type) === 'Text').flatMap((n) => {
    const c = n.props['children'] as unknown;
    return typeof c === 'string' ? [c] : [];
  });
}

function saveButton(tree: renderer.ReactTestRenderer): ReactTestInstance {
  const [btn] = tree.root.findAll((n) => String(n.type) === 'TouchableOpacity' && textOf(n).includes(t('farmerDetail.edit.save')));
  expect(btn).toBeDefined();
  return btn!;
}

function editName(tree: renderer.ReactTestRenderer, name: string) {
  const personal = tree.root.findAll((n) => String(n.type) === 'PersonalSection')[0]!;
  const setField = personal.props['setField'] as (k: string, v: unknown) => void;
  act(() => setField('fullName', name));
}

function pressSave(tree: renderer.ReactTestRenderer) {
  act(() => (saveButton(tree).props['onPress'] as () => void)());
}

function alertButtons(): { text: string; style?: string; onPress?: () => void }[] {
  return vi.mocked(Alert.alert).mock.calls[0]![2] as { text: string; style?: string; onPress?: () => void }[];
}

function pressAlert(label: string) {
  const button = alertButtons().find((b) => b.text === label);
  expect(button, label).toBeDefined();
  act(() => button!.onPress?.());
}

describe('AdminEditFarmerScreen: Save asks for confirmation', () => {
  it('Save with a change opens the confirmation and sends no PATCH until it is confirmed', () => {
    const tree = mount();
    editName(tree, 'Lakshmi D.');
    pressSave(tree);
    expect(Alert.alert).toHaveBeenCalledTimes(1);
    const [title, message] = vi.mocked(Alert.alert).mock.calls[0]!;
    expect(title).toBe(t('farmerDetail.edit.saveConfirm.title'));
    expect(message).toBe(t('farmerDetail.edit.saveConfirm.message'));
    expect(t('farmerDetail.edit.saveConfirm.message')).toBe('Save changes to this farmer?');
    expect(update.run).not.toHaveBeenCalled();

    pressAlert(t('farmerDetail.edit.saveConfirm.confirm'));
    expect(update.run).toHaveBeenCalledTimes(1);
    expect(update.run.mock.calls[0]![0]).toEqual({ fullName: 'Lakshmi D.' });
  });

  it('Cancel on the confirmation sends nothing and reports nothing', () => {
    const onSaved = vi.fn();
    const tree = mount({ onSaved });
    editName(tree, 'Lakshmi D.');
    pressSave(tree);
    const cancel = alertButtons().find((b) => b.text === t('farmerDetail.edit.saveConfirm.cancel'))!;
    expect(cancel.style).toBe('cancel');
    act(() => cancel.onPress?.());
    expect(update.run).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('nothing changed or an invalid form: the inline message shows and no confirmation opens', () => {
    const tree = mount();
    pressSave(tree);
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(textOf(tree.root)).toContain(t('farmerDetail.edit.noChanges'));

    editName(tree, 'L');
    pressSave(tree);
    expect(Alert.alert).not.toHaveBeenCalled();
    expect(textOf(tree.root)).toContain(t('farmerDetail.edit.error.name'));
    expect(update.run).not.toHaveBeenCalled();
  });
});

describe('AdminEditFarmerScreen: the host hears about a save only after the server agreed', () => {
  it('onSaved (the flow\'s "Changes Saved" toast) runs only when the PATCH succeeded', () => {
    const onSaved = vi.fn();
    const tree = mount({ onSaved });
    editName(tree, 'Lakshmi D.');
    pressSave(tree);
    pressAlert(t('farmerDetail.edit.saveConfirm.confirm'));
    expect(onSaved).not.toHaveBeenCalled();

    const onDone = update.run.mock.calls[0]![1] as (dto: unknown) => void;
    act(() => onDone({ id: FARMER_ID, fullName: 'Lakshmi D.' }));
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledWith(mapped.saved, 'Personal');
  });

  it('a failed save shows the mapped error and never calls onSaved', () => {
    const onSaved = vi.fn();
    const tree = mount({ onSaved });
    editName(tree, 'Lakshmi D.');
    pressSave(tree);
    pressAlert(t('farmerDetail.edit.saveConfirm.confirm'));
    update.error = new ApiError({ type: 'about:blank', title: 'x', status: 403, code: 'FORBIDDEN' } as Problem);
    act(() => {
      tree.update(element({ onSaved }));
    });
    expect(textOf(tree.root)).toContain(t('admin.error.FORBIDDEN'));
    expect(onSaved).not.toHaveBeenCalled();
  });
});
